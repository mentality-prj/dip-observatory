/**
 * Production Replanning Decision Engine.
 *
 * Pure, deterministic, stateless. No randomness, no external APIs,
 * no database, no hidden mutable state, no LLM.
 *
 * Pipeline:
 *   ProductionScenario
 *     → compute disrupted capacities
 *     → generate alternatives
 *     → evaluate constraints (rules)
 *     → calculate operational impact
 *     → calculate financial impact
 *     → score alternatives
 *     → select recommended action
 *     → generate explanation
 *     → generate audit trace
 *
 * Same input + config + ENGINE_VERSION → identical output.
 *
 * SYNTHETIC DEMONSTRATION — not BTS & SAKER production data.
 */

import type {
  ActionId,
  AlternativeEvaluation,
  AlternativeFinancialImpact,
  AlternativeScore,
  AuditEntry,
  CostConfig,
  DecisionExplanation,
  DecisionFactor,
  DecisionStatus,
  FeasibilityStatus,
  LineProductionAllocation,
  OperationalConsequences,
  ProductionDecisionRequest,
  ProductionDecisionResponse,
  ProductionLine,
  ProductionOrder,
  ProductionRule,
  RuleResult,
} from "@/production-replanning/types";

export const ENGINE_VERSION = "1.0.0" as const;
export const RULES_VERSION = "1.0" as const;

// ---------------------------------------------------------------------------
// Default cost configuration
// ---------------------------------------------------------------------------

export const DEFAULT_COST_CONFIG: CostConfig = {
  missedCriticalDeadlineCostPerTonneDay: 1_200,
  missedHighDeadlineCostPerTonneDay: 400,
  overtimeCostPerTonne: 180,
  productionDelayCostPerTonneDay: 80,
  unusedCapacityCostPerTpdDay: 50,
  materialHandlingSwitchCost: 3_200,
  configVersion: "1.0",
};

function mergeCostConfig(override: Partial<CostConfig> | undefined): CostConfig {
  return { ...DEFAULT_COST_CONFIG, ...override };
}

// ---------------------------------------------------------------------------
// Rules catalogue
// ---------------------------------------------------------------------------

export const PRODUCTION_RULES: ProductionRule[] = [
  {
    id: "RULE-CAPACITY",
    name: "Capacity feasibility",
    description: "The proposed plan must fit within available production capacity.",
    blocking: true,
  },
  {
    id: "RULE-MATERIAL",
    name: "Material availability",
    description: "Sufficient feedstock must be available to execute the plan.",
    blocking: true,
  },
  {
    id: "RULE-CRITICAL-DEADLINE",
    name: "Critical deadline protection",
    description: "The plan must not miss the deadline for any CRITICAL order.",
    blocking: true,
  },
  {
    id: "RULE-PRIORITY",
    name: "Priority ordering",
    description: "Higher-priority orders should be scheduled before lower-priority ones.",
    blocking: false,
  },
  {
    id: "RULE-UTILIZATION",
    name: "Capacity utilisation",
    description: "The plan should use available capacity efficiently.",
    blocking: false,
  },
  {
    id: "RULE-DISRUPTION",
    name: "Disruption compensation",
    description: "The alternative must adequately compensate for the production disruption.",
    blocking: false,
  },
  {
    id: "RULE-COST",
    name: "Financial consequence",
    description: "The estimated total cost of the alternative must be evaluated.",
    blocking: false,
  },
];

// ---------------------------------------------------------------------------
// Scoring weights (explicit, versioned)
// ---------------------------------------------------------------------------

const SCORE_WEIGHTS = {
  deadlineProtection: 0.25,
  criticalOrderProtection: 0.30,
  financialScore: 0.25,
  capacityUtilization: 0.10,
  materialUtilization: 0.05,
  operationalDisruption: 0.05,
} as const;

// ---------------------------------------------------------------------------
// Capacity calculation helpers
// ---------------------------------------------------------------------------

interface LineCapacity {
  lineId: string;
  normalTpd: number;
  effectiveTpd: number;
}

function computeEffectiveCapacities(
  lines: ProductionLine[],
  disruption: { affectedLineId: string; capacityReductionFactor: number; durationDays: number },
  planHorizonDays: number,
): { perDay: LineCapacity[]; totalCapacityTonnes: number } {
  const perDay: LineCapacity[] = lines.map((line) => {
    const isAffected = line.id === disruption.affectedLineId;
    const disruptedTpd = isAffected
      ? Math.max(0, line.normalCapacityTpd * line.availabilityFactor * (1 - disruption.capacityReductionFactor))
      : line.normalCapacityTpd * line.availabilityFactor;
    const effectiveTpd = disruptedTpd;
    return { lineId: line.id, normalTpd: line.normalCapacityTpd * line.availabilityFactor, effectiveTpd };
  });

  // Total capacity over the planning horizon (disruption affects first N days)
  const totalCapacityTonnes = lines.reduce((sum, line) => {
    const isAffected = line.id === disruption.affectedLineId;
    const normalDailyTpd = line.normalCapacityTpd * line.availabilityFactor;

    if (!isAffected) {
      return sum + normalDailyTpd * planHorizonDays;
    }

    const disruptedTpd = normalDailyTpd * (1 - disruption.capacityReductionFactor);
    const disruptedCapacity = disruptedTpd * Math.min(disruption.durationDays, planHorizonDays);
    const normalCapacity = normalDailyTpd * Math.max(0, planHorizonDays - disruption.durationDays);
    return sum + disruptedCapacity + normalCapacity;
  }, 0);

  return { perDay, totalCapacityTonnes };
}

// ---------------------------------------------------------------------------
// Operational scheduling helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Rule evaluation per alternative
// ---------------------------------------------------------------------------

function evaluateRulesForAlternative(
  actionId: ActionId,
  orders: ProductionOrder[],
  totalCapacityTonnes: number,
  totalMaterialTonnes: number,
  overtimeTonnes: number,
  capacityUtilization: number,
  disruptionDurationDays: number,
  normalCapacityTonnes: number,
  planHorizonDays: number,
  /** For KEEP_CURRENT_PLAN this is the disrupted affected-line tpd; for other actions the combined effective tpd. */
  criticalOrderTpd: number,
  /** Fraction of normal capacity removed from the affected line, e.g. 0.30 = 30%. */
  capacityReductionFactor: number,
  /** Human-readable name of the disrupted line, e.g. "Line A". */
  affectedLineName: string,
): RuleResult[] {
  const totalRequired = orders.reduce((s, o) => s + o.requiredTonnes, 0);
  const criticalOrders = orders.filter((o) => o.priority === "CRITICAL");
  const criticalRequired = criticalOrders.reduce((s, o) => s + o.requiredTonnes, 0);

  // For critical deadline protection we need a rough completion estimate
  const effectiveCapacity = totalCapacityTonnes + overtimeTonnes;

  // Simulate whether critical orders complete in time
  // Allocate capacity to critical orders first
  const criticalCanComplete = effectiveCapacity >= criticalRequired;
  const criticalDeadlineDays = criticalOrders.length > 0 ? Math.min(...criticalOrders.map((o) => o.deadlineDays)) : 99;
  // Use criticalOrderTpd — disrupted affected-line rate for KEEP_CURRENT_PLAN, combined rate for other actions
  const criticalCompletionDays = criticalOrderTpd > 0 ? criticalRequired / criticalOrderTpd : 999;
  const criticalDeadlineProtected = criticalCanComplete && criticalCompletionDays <= criticalDeadlineDays;

  return PRODUCTION_RULES.map((rule): RuleResult => {
    switch (rule.id) {
      case "RULE-CAPACITY": {
        const passed = effectiveCapacity >= totalRequired;
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          condition: `Effective capacity (${effectiveCapacity.toFixed(0)} t) ≥ total required (${totalRequired} t)`,
          passed,
          evidence: passed
            ? `Available capacity ${effectiveCapacity.toFixed(0)} t covers total requirement ${totalRequired} t.`
            : `Capacity shortfall: ${(totalRequired - effectiveCapacity).toFixed(0)} t cannot be produced.`,
          featureValues: {
            effectiveCapacityTonnes: +effectiveCapacity.toFixed(1),
            totalRequiredTonnes: totalRequired,
            surplus: +(effectiveCapacity - totalRequired).toFixed(1),
          },
        };
      }

      case "RULE-MATERIAL": {
        const passed = totalMaterialTonnes >= totalRequired;
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          condition: `Available material (${totalMaterialTonnes} t) ≥ total required (${totalRequired} t)`,
          passed,
          evidence: passed
            ? `Total material ${totalMaterialTonnes} t covers requirement ${totalRequired} t.`
            : `Material shortfall: ${totalRequired - totalMaterialTonnes} t unavailable.`,
          featureValues: {
            availableMaterialTonnes: totalMaterialTonnes,
            totalRequiredTonnes: totalRequired,
          },
        };
      }

      case "RULE-CRITICAL-DEADLINE": {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          condition: `Critical orders complete by deadline day ${criticalDeadlineDays}`,
          passed: criticalDeadlineProtected,
          evidence: criticalDeadlineProtected
            ? `Critical order(s) can complete by day ${criticalCompletionDays.toFixed(1)} (deadline: day ${criticalDeadlineDays}).`
            : `Critical order(s) estimated completion day ${criticalCompletionDays.toFixed(1)} exceeds deadline day ${criticalDeadlineDays}.`,
          featureValues: {
            criticalRequiredTonnes: criticalRequired,
            estimatedCompletionDay: +criticalCompletionDays.toFixed(2),
            deadlineDays: criticalDeadlineDays,
            criticalCanComplete,
          },
        };
      }

      case "RULE-PRIORITY": {
        // Heuristic: check if the action explicitly re-orders by priority
        const passed = actionId !== "KEEP_CURRENT_PLAN" || criticalDeadlineProtected;
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          condition: "Higher-priority orders are scheduled before lower-priority ones",
          passed,
          evidence: passed
            ? "Plan schedules orders in CRITICAL → HIGH → NORMAL priority sequence."
            : "Current plan does not re-prioritise orders given the disruption.",
          featureValues: { actionId, priorityRespected: passed },
        };
      }

      case "RULE-UTILIZATION": {
        const passed = capacityUtilization >= 0.65;
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          condition: "Capacity utilisation ≥ 65%",
          passed,
          evidence: `Plan achieves ${(capacityUtilization * 100).toFixed(0)}% capacity utilisation.`,
          featureValues: { capacityUtilisationPct: +(capacityUtilization * 100).toFixed(1) },
        };
      }

      case "RULE-DISRUPTION": {
        // The plan compensates if it uses redistribution or prioritisation
        const compensates =
          actionId === "REDISTRIBUTE_PRODUCTION" ||
          actionId === "PRIORITIZE_CRITICAL_ORDER" ||
          actionId === "DELAY_LOW_PRIORITY_ORDER";
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          condition: "Plan actively compensates for the disruption",
          passed: compensates,
          evidence: compensates
            ? `${actionId} compensates for the ${disruptionDurationDays}-day disruption, during which ${affectedLineName} operates at ${((1 - capacityReductionFactor) * 100).toFixed(0)}% of normal capacity (−${(capacityReductionFactor * 100).toFixed(0)}% reduction).`
            : `No compensating action taken — ${affectedLineName} runs at ${((1 - capacityReductionFactor) * 100).toFixed(0)}% capacity for ${disruptionDurationDays} days (−${(capacityReductionFactor * 100).toFixed(0)}% reduction); disruption impacts flow directly.`,
          featureValues: {
            actionId,
            compensates,
            lineCapacityReductionPct: +(capacityReductionFactor * 100).toFixed(1),
          },
        };
      }

      case "RULE-COST": {
        // Advisory: always passes but records the fact that cost was evaluated
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          condition: "Total estimated cost evaluated",
          passed: true,
          evidence: "Financial impact calculated and included in scoring.",
          featureValues: { capacityUtilisationPct: +(capacityUtilization * 100).toFixed(1) },
        };
      }

      default:
        throw new Error(`Unimplemented rule: ${rule.id}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Financial impact calculation per alternative
// ---------------------------------------------------------------------------

function calcFinancialImpact(
  actionId: ActionId,
  orders: ProductionOrder[],
  effectiveCapacityTonnes: number,
  normalCapacityTonnes: number,
  totalMaterialTonnes: number,
  dailyEffectiveTpd: number,
  /** Disrupted rate of the affected line only — used for KEEP_CURRENT_PLAN critical deadline. */
  affectedLineTpd: number,
  /** Sum of all lines' normal t/day (no disruption) — used for unused-capacity calculation. */
  totalNormalTpd: number,
  planHorizonDays: number,
  costs: CostConfig,
  overtimeAvailable: boolean,
): AlternativeFinancialImpact {
  const totalRequired = orders.reduce((s, o) => s + o.requiredTonnes, 0);
  const criticalOrders = orders.filter((o) => o.priority === "CRITICAL");
  const highOrders = orders.filter((o) => o.priority === "HIGH");
  const normalOrders = orders.filter((o) => o.priority === "NORMAL");

  // Overtime cost applies when OT is used (only for REDISTRIBUTE or PRIORITIZE)
  const overtimeTonnes =
    overtimeAvailable &&
    (actionId === "REDISTRIBUTE_PRODUCTION" || actionId === "PRIORITIZE_CRITICAL_ORDER")
      ? Math.max(0, totalRequired - effectiveCapacityTonnes) * 0.5
      : 0;

  // Missed deadline cost
  let missedDeadlineCost = 0;

  if (actionId === "KEEP_CURRENT_PLAN") {
    // Current plan keeps critical orders on the disrupted affected line only.
    // Critical orders: use affected-line tpd (the disrupted rate).
    let criticalCumulative = 0;
    for (const o of criticalOrders) {
      criticalCumulative += o.requiredTonnes;
      const estimatedCompletion = affectedLineTpd > 0 ? criticalCumulative / affectedLineTpd : 999;
      const overrun = Math.max(0, estimatedCompletion - o.deadlineDays);
      missedDeadlineCost += overrun * o.requiredTonnes * costs.missedCriticalDeadlineCostPerTonneDay;
    }
    // High orders also on affected line (queued behind critical).
    let highCumulative = criticalOrders.reduce((s, o) => s + o.requiredTonnes, 0);
    for (const o of highOrders) {
      highCumulative += o.requiredTonnes;
      const estimatedCompletion = affectedLineTpd > 0 ? highCumulative / affectedLineTpd : 999;
      const overrun = Math.max(0, estimatedCompletion - o.deadlineDays);
      missedDeadlineCost += overrun * o.requiredTonnes * costs.missedHighDeadlineCostPerTonneDay;
    }
  } else if (actionId === "DELAY_LOW_PRIORITY_ORDER") {
    // Delay normal orders intentionally, protecting high & critical
    for (const o of normalOrders) {
      const delayDays = 3;
      missedDeadlineCost += delayDays * o.requiredTonnes * costs.productionDelayCostPerTonneDay;
    }
  } else if (actionId === "PRIORITIZE_CRITICAL_ORDER") {
    // Critical protected, but HIGH might slip
    for (const o of highOrders) {
      const overrun = 1;
      missedDeadlineCost += overrun * o.requiredTonnes * costs.missedHighDeadlineCostPerTonneDay * 0.5;
    }
  }
  // REDISTRIBUTE_PRODUCTION: no missed deadlines — all lines combined meet deadlines

  // Overtime cost
  const overtimeCost = overtimeTonnes * costs.overtimeCostPerTonne;

  // Delay cost (production queue delay for non-deadline-specific delay)
  let delayCost = 0;
  if (actionId === "KEEP_CURRENT_PLAN") {
    // Normal orders queued on unaffected line(s): delay due to overall throughput reduction
    for (const o of normalOrders) {
      delayCost += 2 * o.requiredTonnes * costs.productionDelayCostPerTonneDay;
    }
  }

  // Unused capacity cost: consistent across all alternatives.
  // unusedDailyTpd = total normal t/day minus the average daily throughput required.
  // This is the same for all plans because total production (270 t) does not change.
  const unusedDailyTpd = Math.max(0, totalNormalTpd - totalRequired / planHorizonDays);
  const unusedCapacityCost = unusedDailyTpd * costs.unusedCapacityCostPerTpdDay * planHorizonDays;

  // Material switching / reconfiguration cost
  const switchingCost =
    actionId === "REDISTRIBUTE_PRODUCTION"
      ? costs.materialHandlingSwitchCost
      : 0;

  const roundedMissedDeadlineCost = Math.round(missedDeadlineCost);
  const roundedOvertimeCost = Math.round(overtimeCost);
  const roundedDelayCost = Math.round(delayCost);
  const roundedUnusedCapacityCost = Math.round(unusedCapacityCost);
  const roundedSwitchingCost = Math.round(switchingCost);

  return {
    missedDeadlineCost: roundedMissedDeadlineCost,
    overtimeCost: roundedOvertimeCost,
    delayCost: roundedDelayCost,
    unusedCapacityCost: roundedUnusedCapacityCost,
    switchingCost: roundedSwitchingCost,
    total: roundedMissedDeadlineCost + roundedOvertimeCost + roundedDelayCost + roundedUnusedCapacityCost + roundedSwitchingCost,
  };
}

// ---------------------------------------------------------------------------
// Per-line production allocation (derived from the engine)
// ---------------------------------------------------------------------------

function computeLineAllocations(
  actionId: ActionId,
  lines: ProductionLine[],
  orders: ProductionOrder[],
  affectedLineId: string,
  affectedLineTpd: number,
  dailyEffectiveTpd: number,
): LineProductionAllocation[] {
  const affectedLine = lines.find((l) => l.id === affectedLineId);
  const unaffectedLines = lines.filter((l) => l.id !== affectedLineId);
  const unaffectedTpd = unaffectedLines.reduce(
    (s, l) => s + l.normalCapacityTpd * l.availabilityFactor,
    0,
  );

  const criticalAndHigh = orders.filter((o) => o.priority === "CRITICAL" || o.priority === "HIGH")
    .sort((a, _b) => (a.priority === "CRITICAL" ? -1 : 1));
  const normalOrders = orders.filter((o) => o.priority === "NORMAL");

  if (actionId === "KEEP_CURRENT_PLAN") {
    // Affected line handles CRITICAL + HIGH; unaffected line(s) handle NORMAL.
    let cumA = 0;
    const affectedAllocs = criticalAndHigh.map((o) => {
      cumA += o.requiredTonnes;
      const completionDay = affectedLineTpd > 0 ? cumA / affectedLineTpd : 999;
      return {
        orderId: o.id,
        orderName: o.name,
        allocatedTonnes: o.requiredTonnes,
        deadlineDays: o.deadlineDays,
        estimatedCompletionDay: +completionDay.toFixed(2),
        deadlineMet: completionDay <= o.deadlineDays,
      };
    });


    return [
      {
        lineId: affectedLine?.id ?? affectedLineId,
        lineName: affectedLine?.name ?? affectedLineId,
        effectiveTpd: affectedLineTpd,
        orders: affectedAllocs,
        totalAllocatedTonnes: criticalAndHigh.reduce((s, o) => s + o.requiredTonnes, 0),
      },
      ...unaffectedLines.map((line) => {
        const tpd = line.normalCapacityTpd * line.availabilityFactor;
        const share = unaffectedTpd > 0 ? tpd / unaffectedTpd : 0;
        let cumU = 0;
        const lineNormalAllocs = normalOrders.map((o) => {
          cumU += o.requiredTonnes;
          const completionDay = unaffectedTpd > 0 ? cumU / unaffectedTpd : 999;
          return {
            orderId: o.id,
            orderName: o.name,
            allocatedTonnes: Math.round(o.requiredTonnes * share),
            deadlineDays: o.deadlineDays,
            estimatedCompletionDay: +completionDay.toFixed(2),
            deadlineMet: completionDay <= o.deadlineDays,
          };
        });
        return {
          lineId: line.id,
          lineName: line.name,
          effectiveTpd: tpd,
          orders: lineNormalAllocs,
          totalAllocatedTonnes: Math.round(normalOrders.reduce((s, o) => s + o.requiredTonnes, 0) * share),
        };
      }),
    ];
  }

  // For all other actions: all lines work together proportionally.
  const prioritised = [...orders].sort((a, b) => {
    const p: Record<string, number> = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
    return p[a.priority] - p[b.priority];
  });

  return lines.map((line) => {
    const lineTpd = line.id === affectedLineId
      ? affectedLineTpd
      : line.normalCapacityTpd * line.availabilityFactor;
    const share = dailyEffectiveTpd > 0 ? lineTpd / dailyEffectiveTpd : 0;
    let cum = 0;
    const orderAllocs = prioritised.map((o) => {
      cum += o.requiredTonnes;
      const completionDay = dailyEffectiveTpd > 0 ? cum / dailyEffectiveTpd : 999;
      return {
        orderId: o.id,
        orderName: o.name,
        allocatedTonnes: Math.round(o.requiredTonnes * share),
        deadlineDays: o.deadlineDays,
        estimatedCompletionDay: +completionDay.toFixed(2),
        deadlineMet: completionDay <= o.deadlineDays,
      };
    });
    return {
      lineId: line.id,
      lineName: line.name,
      effectiveTpd: lineTpd,
      orders: orderAllocs,
      totalAllocatedTonnes: Math.round(orders.reduce((s, o) => s + o.requiredTonnes, 0) * share),
    };
  });
}

// ---------------------------------------------------------------------------
// Operational consequences per alternative
// ---------------------------------------------------------------------------

function calcOperationalConsequences(
  actionId: ActionId,
  orders: ProductionOrder[],
  effectiveCapacityTonnes: number,
  overtimeTonnes: number,
  normalCapacityTonnes: number,
  /** For KEEP_CURRENT_PLAN: disrupted affected-line tpd; for others: combined effective tpd. */
  criticalOrderTpd: number,
  lines: ProductionLine[],
  affectedLineId: string,
  affectedLineTpd: number,
  dailyEffectiveTpd: number,
): OperationalConsequences {
  const totalEffective = effectiveCapacityTonnes + overtimeTonnes;
  const totalRequired = orders.reduce((s, o) => s + o.requiredTonnes, 0);

  // Simulate completion days per order.
  // For KEEP_CURRENT_PLAN, model two independent queues:
  //   – Critical + High on the disrupted Line A (affectedLineTpd)
  //   – Normal on the unaffected line(s) (unaffectedLineTpd)
  // For all other actions the lines work together (criticalOrderTpd = combined rate).
  const unaffectedLineTpd = lines
    .filter((l) => l.id !== affectedLineId)
    .reduce((s, l) => s + l.normalCapacityTpd * l.availabilityFactor, 0);

  const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
  const sorted = [...orders].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const expectedCompletionDays: Record<string, number> = {};
  const affectedOrderIds: string[] = [];

  if (actionId === "KEEP_CURRENT_PLAN") {
    // Queue A (Line A, disrupted): critical + high
    let cumulativeA = 0;
    for (const order of sorted.filter((o) => o.priority !== "NORMAL")) {
      cumulativeA += order.requiredTonnes;
      const completionDay = affectedLineTpd > 0
        ? Math.ceil(cumulativeA / affectedLineTpd)
        : 999;
      expectedCompletionDays[order.id] = completionDay;
      if (completionDay > order.deadlineDays) {
        affectedOrderIds.push(order.id);
      }
    }
    // Queue B (unaffected lines): normal orders
    let cumulativeB = 0;
    for (const order of sorted.filter((o) => o.priority === "NORMAL")) {
      cumulativeB += order.requiredTonnes;
      const completionDay = unaffectedLineTpd > 0
        ? Math.ceil(cumulativeB / unaffectedLineTpd)
        : 999;
      expectedCompletionDays[order.id] = completionDay;
      if (completionDay > order.deadlineDays) {
        affectedOrderIds.push(order.id);
      }
    }
  } else {
    let cumulativeTonnes = 0;
    for (const order of sorted) {
      cumulativeTonnes += order.requiredTonnes;
      const completionDay = criticalOrderTpd > 0
        ? Math.ceil(cumulativeTonnes / criticalOrderTpd)
        : 999;
      expectedCompletionDays[order.id] = completionDay;

      if (actionId === "DELAY_LOW_PRIORITY_ORDER" && order.priority === "NORMAL") {
        expectedCompletionDays[order.id] = completionDay + 3;
        affectedOrderIds.push(order.id);
      }
    }
  }

  const criticalOrders = orders.filter((o) => o.priority === "CRITICAL");
  const criticalDeadlineProtected = criticalOrders.every((o) => {
    const day = expectedCompletionDays[o.id] ?? 999;
    return day <= o.deadlineDays;
  });

  const capacityUtilizationFactor = normalCapacityTonnes > 0
    ? Math.min(1, totalRequired / normalCapacityTonnes)
    : 0;

  const lineAllocations = computeLineAllocations(
    actionId,
    lines,
    orders,
    affectedLineId,
    affectedLineTpd,
    dailyEffectiveTpd,
  );

  return {
    criticalOrderDeadlineProtected: criticalDeadlineProtected,
    affectedOrderIds,
    expectedCompletionDays,
    capacityUtilizationFactor,
    totalTonnesProcessed: Math.min(totalRequired, totalEffective),
    lineAllocations,
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function computeScore(
  operational: OperationalConsequences,
  financial: AlternativeFinancialImpact,
  ruleResults: RuleResult[],
  maxFinancialCost: number,
): AlternativeScore {
  const deadlineProtection =
    ruleResults.find((r) => r.ruleId === "RULE-CRITICAL-DEADLINE")?.passed ? 1.0 : 0.0;

  const criticalOrderProtection = operational.criticalOrderDeadlineProtected ? 1.0 : 0.0;

  const financialScore =
    maxFinancialCost > 0 ? 1 - financial.total / maxFinancialCost : 1.0;

  const capacityUtilization = Math.min(1, operational.capacityUtilizationFactor);

  const materialUtilization = operational.totalTonnesProcessed > 0 ? 1.0 : 0.0;

  const disruptionRule = ruleResults.find((r) => r.ruleId === "RULE-DISRUPTION");
  const operationalDisruption = disruptionRule?.passed ? 1.0 : 0.5;

  const composite =
    SCORE_WEIGHTS.deadlineProtection * deadlineProtection +
    SCORE_WEIGHTS.criticalOrderProtection * criticalOrderProtection +
    SCORE_WEIGHTS.financialScore * financialScore +
    SCORE_WEIGHTS.capacityUtilization * capacityUtilization +
    SCORE_WEIGHTS.materialUtilization * materialUtilization +
    SCORE_WEIGHTS.operationalDisruption * operationalDisruption;

  return {
    deadlineProtection,
    criticalOrderProtection,
    financialScore: +financialScore.toFixed(4),
    capacityUtilization: +capacityUtilization.toFixed(4),
    materialUtilization,
    operationalDisruption,
    composite: +composite.toFixed(4),
  };
}

// ---------------------------------------------------------------------------
// Explanation generation (derived from rule results — not hardcoded text)
// ---------------------------------------------------------------------------

function generateExplanation(
  ranked: AlternativeEvaluation[],
  recommended: AlternativeEvaluation,
): DecisionExplanation {
  const reasons: DecisionFactor[] = [];

  // Derive reasons from rule results
  for (const r of recommended.ruleResults) {
    if (r.passed && r.ruleId === "RULE-CRITICAL-DEADLINE") {
      reasons.push({
        label: "Critical deadline protected",
        direction: "positive",
        evidence: r.evidence,
      });
    }
    if (r.passed && r.ruleId === "RULE-DISRUPTION") {
      reasons.push({
        label: "Disruption adequately compensated",
        direction: "positive",
        evidence: r.evidence,
      });
    }
    if (r.passed && r.ruleId === "RULE-UTILIZATION") {
      reasons.push({
        label: "Capacity used efficiently",
        direction: "positive",
        evidence: r.evidence,
      });
    }
    if (!r.passed && PRODUCTION_RULES.find((pr) => pr.id === r.ruleId)?.blocking) {
      reasons.push({
        label: `Constraint: ${r.ruleName}`,
        direction: "negative",
        evidence: r.evidence,
      });
    }
  }

  // Financial advantage
  const baseline = ranked.find((a) => a.actionId === "KEEP_CURRENT_PLAN");
  if (baseline && recommended.financialImpact.total < baseline.financialImpact.total) {
    const saved = baseline.financialImpact.total - recommended.financialImpact.total;
    reasons.push({
      label: "Lower total financial impact",
      direction: "positive",
      evidence: `Saves €${saved.toLocaleString("en-US")} compared to keeping the current plan.`,
    });
  }

  const rejectedAlternatives = ranked
    .filter((a) => a.actionId !== recommended.actionId)
    .map((a) => {
      if (a.feasibility === "INFEASIBLE") {
        return {
          actionId: a.actionId,
          reason: `INFEASIBLE — ${a.blockingConstraints.join("; ")}`,
        };
      }
      if (a.financialImpact.total > recommended.financialImpact.total) {
        const extra = a.financialImpact.total - recommended.financialImpact.total;
        return {
          actionId: a.actionId,
          reason: `Higher total cost — €${extra.toLocaleString("en-US")} more than recommended action.`,
        };
      }
      return {
        actionId: a.actionId,
        reason: `Lower composite score (${(a.score.composite * 100).toFixed(0)}%) than recommended (${(recommended.score.composite * 100).toFixed(0)}%).`,
      };
    });

  return {
    recommendedActionId: recommended.actionId,
    reasons,
    rejectedAlternatives,
  };
}

// ---------------------------------------------------------------------------
// Action labels
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<ActionId, string> = {
  KEEP_CURRENT_PLAN: "Keep current plan",
  PRIORITIZE_CRITICAL_ORDER: "Prioritise critical order",
  REDISTRIBUTE_PRODUCTION: "Redistribute production",
  DELAY_LOW_PRIORITY_ORDER: "Delay low-priority order",
};

// ---------------------------------------------------------------------------
// Main engine entry point
// ---------------------------------------------------------------------------

export function runProductionReplanningEngine(
  request: ProductionDecisionRequest,
): ProductionDecisionResponse {
  const { scenario } = request;
  const costs = mergeCostConfig(request.costConfig);
  const computedAt = new Date("2026-01-15T09:00:00Z").toISOString(); // deterministic

  const { lines, materials, orders, disruption, overtimeAvailable } = scenario;

  // Planning horizon = max order deadline + buffer
  const planHorizonDays = Math.max(...orders.map((o) => o.deadlineDays)) + 2;

  // Total available material
  const totalMaterialTonnes = materials.reduce((s, m) => s + m.availableTonnes, 0);

  // Effective capacities under disruption
  const { totalCapacityTonnes } = computeEffectiveCapacities(lines, disruption, planHorizonDays);

  // Normal capacity (no disruption)
  const normalCapacityTonnes = lines.reduce(
    (s, l) => s + l.normalCapacityTpd * l.availabilityFactor * planHorizonDays,
    0,
  );

  // Daily effective throughput (disrupted)
  const dailyLines = lines.map((l) => {
    if (l.id === disruption.affectedLineId) {
      return Math.max(0, l.normalCapacityTpd * l.availabilityFactor * (1 - disruption.capacityReductionFactor));
    }
    return l.normalCapacityTpd * l.availabilityFactor;
  });
  const dailyEffectiveTpd = dailyLines.reduce((s, v) => s + v, 0);

  // Disrupted throughput of the affected line only (used for KEEP_CURRENT_PLAN deadline estimation)
  const affectedLineTpd = lines.reduce((s, l) => {
    if (l.id !== disruption.affectedLineId) return s;
    return s + Math.max(0, l.normalCapacityTpd * l.availabilityFactor * (1 - disruption.capacityReductionFactor));
  }, 0);

  // Sum of all lines' normal t/day (no disruption) — for unused-capacity calculation
  const totalNormalTpd = lines.reduce((s, l) => s + l.normalCapacityTpd * l.availabilityFactor, 0);

  // Daily overtime bonus (t/day) when overtime is available
  const dailyOvertimeTpd = overtimeAvailable
    ? lines.reduce((s, l) => s + l.normalCapacityTpd * 0.15, 0)
    : 0;

  // Overtime bonus tonnes (available for 3 extra hours/day ≈ 15% of normal)
  const overtimeBonusTonnes = dailyOvertimeTpd * planHorizonDays;

  // ------------------------------------------------------------------
  // Evaluate each alternative
  // ------------------------------------------------------------------

  const actionIds: ActionId[] = [
    "KEEP_CURRENT_PLAN",
    "PRIORITIZE_CRITICAL_ORDER",
    "REDISTRIBUTE_PRODUCTION",
    "DELAY_LOW_PRIORITY_ORDER",
  ];

  // First pass: compute raw financials to determine max cost (for normalisation)
  const rawFinancials = actionIds.map((actionId) => {
    return calcFinancialImpact(
      actionId,
      orders,
      totalCapacityTonnes,
      normalCapacityTonnes,
      totalMaterialTonnes,
      dailyEffectiveTpd,
      affectedLineTpd,
      totalNormalTpd,
      planHorizonDays,
      costs,
      overtimeAvailable,
    );
  });
  const maxFinancialCost = Math.max(...rawFinancials.map((f) => f.total), 1);

  const evaluations: AlternativeEvaluation[] = actionIds.map((actionId, idx) => {
    const overtimeTonnes =
      overtimeAvailable &&
      (actionId === "REDISTRIBUTE_PRODUCTION" || actionId === "PRIORITIZE_CRITICAL_ORDER")
        ? overtimeBonusTonnes
        : 0;

    // For KEEP_CURRENT_PLAN: critical orders are on the disrupted line only → use affectedLineTpd.
    // For other actions: all lines work together → use combined effective tpd (+ overtime when applicable).
    const criticalOrderTpd =
      actionId === "KEEP_CURRENT_PLAN"
        ? affectedLineTpd
        : overtimeTonnes > 0
          ? dailyEffectiveTpd + dailyOvertimeTpd
          : dailyEffectiveTpd;

    const operational = calcOperationalConsequences(
      actionId,
      orders,
      totalCapacityTonnes,
      overtimeTonnes,
      normalCapacityTonnes,
      criticalOrderTpd,
      lines,
      disruption.affectedLineId,
      affectedLineTpd,
      overtimeTonnes > 0 ? dailyEffectiveTpd + dailyOvertimeTpd : dailyEffectiveTpd,
    );

    const capacityUtilization = Math.min(
      1,
      orders.reduce((s, o) => s + o.requiredTonnes, 0) /
        Math.max(totalCapacityTonnes + overtimeTonnes, 1),
    );

    const ruleResults = evaluateRulesForAlternative(
      actionId,
      orders,
      totalCapacityTonnes,
      totalMaterialTonnes,
      overtimeTonnes,
      capacityUtilization,
      disruption.durationDays,
      normalCapacityTonnes,
      planHorizonDays,
      criticalOrderTpd,
      disruption.capacityReductionFactor,
      lines.find((l) => l.id === disruption.affectedLineId)?.name ?? disruption.affectedLineId,
    );

    const blockingConstraints = ruleResults
      .filter((r) => !r.passed && PRODUCTION_RULES.find((pr) => pr.id === r.ruleId)?.blocking)
      .map((r) => r.evidence);

    const feasibility: FeasibilityStatus =
      blockingConstraints.length === 0 ? "FEASIBLE" : "INFEASIBLE";

    const financial = rawFinancials[idx];
    const score = computeScore(operational, financial, ruleResults, maxFinancialCost);

    return {
      actionId,
      actionLabel: ACTION_LABELS[actionId],
      feasibility,
      blockingConstraints,
      ruleResults,
      financialImpact: financial,
      operationalConsequences: operational,
      score,
      rank: 0, // assigned after sorting
    };
  });

  // ------------------------------------------------------------------
  // Rank: feasible first, then by composite score descending
  // ------------------------------------------------------------------

  const sorted = [...evaluations].sort((a, b) => {
    if (a.feasibility === "FEASIBLE" && b.feasibility !== "FEASIBLE") return -1;
    if (b.feasibility === "FEASIBLE" && a.feasibility !== "FEASIBLE") return 1;
    return b.score.composite - a.score.composite;
  });

  sorted.forEach((ev, i) => {
    const original = evaluations.find((e) => e.actionId === ev.actionId)!;
    original.rank = i + 1;
  });

  // ------------------------------------------------------------------
  // Recommended action
  // ------------------------------------------------------------------

  const feasibleSorted = sorted.filter((a) => a.feasibility === "FEASIBLE");
  const recommended = feasibleSorted[0] ?? sorted[0];

  const decisionStatus: DecisionStatus =
    feasibleSorted.length > 0 ? "DECIDED" : "NO_FEASIBLE_ALTERNATIVE";

  const baseline = evaluations.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
  const avoidedCostVsBaseline = Math.max(
    0,
    baseline.financialImpact.total - recommended.financialImpact.total,
  );

  const explanation = generateExplanation(sorted, recommended);

  const decisiveFactors: DecisionFactor[] = explanation.reasons.slice(0, 4);

  // ------------------------------------------------------------------
  // Audit trail
  // ------------------------------------------------------------------

  const auditTrail: AuditEntry = {
    decisionId: `PRD-${scenario.scenarioId}-${ENGINE_VERSION}`,
    scenarioId: scenario.scenarioId,
    computedAt,
    engineVersion: ENGINE_VERSION,
    configVersion: costs.configVersion,
    rulesExecuted: PRODUCTION_RULES.map((r) => r.id),
    alternativesEvaluated: actionIds,
    recommendedAction: recommended.actionId,
    decisionStatus,
    totalFinancialImpact: recommended.financialImpact.total,
    avoidedCostVsBaseline,
    source: "SYNTHETIC_DEMONSTRATION",
  };

  return {
    recommendedAction: recommended.actionId,
    decisionStatus,
    alternatives: evaluations,
    explanation,
    decisiveFactors,
    totalFinancialImpact: recommended.financialImpact.total,
    avoidedCostVsBaseline,
    scenarioSnapshot: scenario,
    engineVersion: ENGINE_VERSION,
    configVersion: costs.configVersion,
    computedAt,
    auditTrail,
  };
}
