/**
 * SURMA Production Scheduling Decision Engine.
 *
 * Pure, deterministic, stateless. No randomness, no external APIs,
 * no database, no hidden mutable state, no LLM.
 *
 * Pipeline:
 *   SchedulingScenario
 *     → compute disrupted line capacities
 *     → build strategy assignments
 *     → run greedy scheduling algorithm
 *     → evaluate hard constraints
 *     → compute line utilisation
 *     → compute financial impact
 *     → score strategies
 *     → rank and select recommended strategy
 *     → build explanation
 *     → build audit trace
 *
 * Same input + config + ENGINE_VERSION → identical output.
 *
 * SYNTHETIC DEMONSTRATION — not SURMA SYSTEMS production data.
 */

import type {
  AuditEntry,
  ConstraintResult,
  CostConfig,
  DecisionExplanation,
  DecisionFactor,
  DecisionStatus,
  FeasibilityStatus,
  FinancialImpact,
  LineUtilization,
  OrderPriority,
  ScheduledTask,
  SchedulingDecisionRequest,
  SchedulingDecisionResponse,
  SchedulingOrder,
  SchedulingScenario,
  SetupCategory,
  SetupMatrix,
  StrategyEvaluation,
  StrategyId,
  StrategyScore,
} from "@/production-scheduling/types";

export const ENGINE_VERSION = "1.0.0" as const;

// ---------------------------------------------------------------------------
// Default cost configuration
// ---------------------------------------------------------------------------

export const DEFAULT_COST_CONFIG: CostConfig = {
  lineOperatingCostPerHour: 120,
  overtimeCostPerHour: 180,
  setupCostPerHour: 80,
  unusedCapacityCostPerHour: 40,
  configVersion: "1.0",
};

function mergeCostConfig(override: Partial<CostConfig> | undefined): CostConfig {
  return { ...DEFAULT_COST_CONFIG, ...override };
}

// ---------------------------------------------------------------------------
// Score weights (explicit, versioned)
// ---------------------------------------------------------------------------

const SCORE_WEIGHTS = {
  onTimeDelivery: 0.25,
  criticalOrderProtection: 0.30,
  delayCostScore: 0.15,
  setupEfficiency: 0.05,
  capacityUtilization: 0.05,
  overtimeCostScore: 0.10,
  revenueProtection: 0.10,
} as const;

// ---------------------------------------------------------------------------
// Constraint rule catalogue
// ---------------------------------------------------------------------------

export const CONSTRAINT_RULES = [
  {
    id: "RULE-CAPACITY",
    name: "Line capacity",
    description: "Total scheduled hours must not exceed available line capacity.",
    hard: true,
  },
  {
    id: "RULE-MACHINE-COMPAT",
    name: "Machine compatibility",
    description: "Each order must be assigned to a compatible production line.",
    hard: true,
  },
  {
    id: "RULE-MATERIAL",
    name: "Material availability",
    description: "Orders requiring unavailable material cannot be scheduled.",
    hard: true,
  },
  {
    id: "RULE-CRITICAL-DEADLINE",
    name: "Critical deadline",
    description: "All CRITICAL orders must meet their delivery deadline.",
    hard: true,
  },
  {
    id: "RULE-ORDER-PRIORITY",
    name: "Order priority",
    description: "CRITICAL and HIGH orders should be scheduled before NORMAL/LOW.",
    hard: false,
  },
  {
    id: "RULE-SETUP",
    name: "Setup / changeover",
    description: "Setup time between different product categories is accounted for.",
    hard: false,
  },
  {
    id: "RULE-CAPACITY-UTIL",
    name: "Capacity utilisation",
    description: "Available capacity should be used efficiently.",
    hard: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Priority ordering helper
// ---------------------------------------------------------------------------

const PRIORITY_RANK: Record<OrderPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

// ---------------------------------------------------------------------------
// Effective capacity per line per day
// ---------------------------------------------------------------------------

function buildLineCapacitiesPerDay(
  scenario: SchedulingScenario,
  overtimeEnabled: boolean,
): Record<string, number[]> {
  const capacities: Record<string, number[]> = {};
  for (const line of scenario.lines) {
    const daily: number[] = [];
    for (let day = 1; day <= scenario.planningHorizonDays; day++) {
      const isDisrupted =
        line.id === scenario.disruption.affectedLineId &&
        day <= scenario.disruption.durationDays;

      const normal =
        line.normalHoursPerDay *
        (isDisrupted ? 1 - scenario.disruption.capacityReductionFactor : 1);
      const overtime = overtimeEnabled ? scenario.overtimeHoursPerLinePerDay : 0;
      daily.push(normal + overtime);
    }
    capacities[line.id] = daily;
  }
  return capacities;
}

function normalCapacityPerDay(
  scenario: SchedulingScenario,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const line of scenario.lines) result[line.id] = line.normalHoursPerDay;
  return result;
}

/** Per-day normal (non-overtime) capacity: reduced on disrupted days, no overtime added. */
function buildNormalCapacitiesPerDay(
  scenario: SchedulingScenario,
): Record<string, number[]> {
  const capacities: Record<string, number[]> = {};
  for (const line of scenario.lines) {
    const daily: number[] = [];
    for (let day = 1; day <= scenario.planningHorizonDays; day++) {
      const isDisrupted =
        line.id === scenario.disruption.affectedLineId &&
        day <= scenario.disruption.durationDays;
      const normal =
        line.normalHoursPerDay *
        (isDisrupted ? 1 - scenario.disruption.capacityReductionFactor : 1);
      daily.push(normal);
    }
    capacities[line.id] = daily;
  }
  return capacities;
}

// ---------------------------------------------------------------------------
// Greedy day-by-day scheduling
// ---------------------------------------------------------------------------

interface LineCursor {
  day: number;          // 1-based
  hour: number;         // cumulative within the day
  lastCategory: SetupCategory | null;
}

interface AssignedOrder {
  order: SchedulingOrder;
  lineId: string;
}

/**
 * Schedule a list of ordered assignments onto lines.
 * Returns an array of ScheduledTask (one per order).
 * Orders that cannot fit within the horizon are marked NOT_SCHEDULED.
 */
function scheduleAssignments(
  assignments: AssignedOrder[],
  capacitiesPerDay: Record<string, number[]>,
  normalCapacitiesPerDay: Record<string, number[]>,
  setupMatrix: SetupMatrix,
  horizonDays: number,
  normalCapacities: Record<string, number>,
  overtimeEnabled: boolean,
): ScheduledTask[] {
  const cursors: Record<string, LineCursor> = {};
  for (const lineId of Object.keys(capacitiesPerDay)) {
    cursors[lineId] = { day: 1, hour: 0, lastCategory: null };
  }

  const tasks: ScheduledTask[] = [];

  for (const { order, lineId } of assignments) {
    const unscheduledDaysLate = Math.max(0, horizonDays + 1 - order.deadlineDays);

    if (order.materialStatus === "UNAVAILABLE") {
      tasks.push({
        orderId: order.id,
        orderName: order.name,
        productType: order.productType,
        priority: order.priority,
        lineId,
        day: -1,
        startHour: 0,
        endHour: 0,
        setupHoursBefore: 0,
        status: "NOT_SCHEDULED",
        daysLate: unscheduledDaysLate,
        isOvertime: false,
        revenueEur: order.revenueEur,
        delayPenalty: order.delayPenaltyPerDay * unscheduledDaysLate,
      });
      continue;
    }

    const cursor = cursors[lineId];
    const dayCapacities = capacitiesPerDay[lineId];
    const normalDayCapacities = normalCapacitiesPerDay[lineId];
    const normalCap = normalCapacities[lineId] ?? 8;

    // Find a slot for this order
    let scheduled = false;

    while (cursor.day <= horizonDays) {
      const dayCap = dayCapacities[cursor.day - 1] ?? 0;
      const normalDayCap = normalDayCapacities?.[cursor.day - 1] ?? normalCap;

      // Setup time: only applies between consecutive orders within same day
      const setup =
        cursor.hour > 0 && cursor.lastCategory !== null
          ? setupMatrix[cursor.lastCategory][order.setupCategory]
          : 0;

      const totalNeeded = setup + order.durationHours;

      if (cursor.hour + totalNeeded <= dayCap) {
        const startHour = cursor.hour + setup;
        const endHour = startHour + order.durationHours;
        const daysLate = Math.max(0, cursor.day - order.deadlineDays);

        // Determine if any part is overtime (threshold is effective normal capacity for the day)
        const isOvertime =
          overtimeEnabled && endHour > normalDayCap;

        tasks.push({
          orderId: order.id,
          orderName: order.name,
          productType: order.productType,
          priority: order.priority,
          lineId,
          day: cursor.day,
          startHour,
          endHour,
          setupHoursBefore: setup,
          status: daysLate > 0 ? "DELAYED" : "ON_TIME",
          daysLate,
          isOvertime,
          revenueEur: order.revenueEur,
          delayPenalty: daysLate * order.delayPenaltyPerDay,
        });

        cursor.hour += totalNeeded;
        cursor.lastCategory = order.setupCategory;
        scheduled = true;
        break;
      }

      // Doesn't fit today → move to next day
      cursor.day += 1;
      cursor.hour = 0;
      cursor.lastCategory = null;
    }

    if (!scheduled) {
      tasks.push({
        orderId: order.id,
        orderName: order.name,
        productType: order.productType,
        priority: order.priority,
        lineId,
        day: -1,
        startHour: 0,
        endHour: 0,
        setupHoursBefore: 0,
        status: "NOT_SCHEDULED",
        daysLate: unscheduledDaysLate,
        isOvertime: false,
        revenueEur: order.revenueEur,
        delayPenalty: order.delayPenaltyPerDay * unscheduledDaysLate,
      });
    }
  }

  return tasks;
}

// ---------------------------------------------------------------------------
// Strategy assignment builders
// ---------------------------------------------------------------------------

function sortByPriorityThenDeadline(orders: SchedulingOrder[]): SchedulingOrder[] {
  return [...orders].sort((a, b) => {
    const pd = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pd !== 0) return pd;
    return a.deadlineDays - b.deadlineDays;
  });
}

/**
 * KEEP_CURRENT_SCHEDULE: process orders in their original array order,
 * each on its defaultLine. No re-sorting. Disruption affects Line B capacity.
 */
function buildKeepCurrentAssignments(orders: SchedulingOrder[]): AssignedOrder[] {
  return orders.map((o) => ({ order: o, lineId: o.defaultLineId }));
}

/**
 * PRIORITIZE_URGENT_ORDERS: same default line assignments, but sort
 * by priority then deadline.
 */
function buildPrioritizeUrgentAssignments(orders: SchedulingOrder[]): AssignedOrder[] {
  return sortByPriorityThenDeadline(orders).map((o) => ({
    order: o,
    lineId: o.defaultLineId,
  }));
}

/**
 * REDISTRIBUTE_TO_OTHER_LINES:
 * Move PERGOLA orders from Line B to Line C.
 * AWNING/SCREEN orders remain on Line B (Line A cannot handle them).
 * All other lines keep their default assignment.
 * Sort by priority then deadline.
 */
function buildRedistributeAssignments(
  orders: SchedulingOrder[],
): AssignedOrder[] {
  const sorted = sortByPriorityThenDeadline(orders);
  return sorted.map((o) => {
    if (
      o.defaultLineId === "LINE-B" &&
      o.setupCategory === "PERGOLA"
    ) {
      return { order: o, lineId: "LINE-C" };
    }
    return { order: o, lineId: o.defaultLineId };
  });
}

/**
 * DELAY_LOW_PRIORITY_ORDERS:
 * Keep default line assignments, but schedule CRITICAL and HIGH priority
 * orders before NORMAL and LOW orders. Lower-priority orders still run on
 * the same lines; they are only moved later in the queue.
 */
function buildDelayLowPriorityAssignments(orders: SchedulingOrder[]): AssignedOrder[] {
  const critical = orders.filter((o) => o.priority === "CRITICAL");
  const high = orders.filter((o) => o.priority === "HIGH");
  const normal = orders.filter((o) => o.priority === "NORMAL");
  const low = orders.filter((o) => o.priority === "LOW");

  // Lower-priority orders are scheduled later purely by queue order.
  const delayed: SchedulingOrder[] = [
    ...normal,
    ...low,
  ].sort((a, b) => a.deadlineDays - b.deadlineDays);

  const prioritised = [
    ...sortByPriorityThenDeadline(critical),
    ...sortByPriorityThenDeadline(high),
    ...delayed,
  ];

  return prioritised.map((o) => ({ order: o, lineId: o.defaultLineId }));
}

/**
 * USE_OVERTIME:
 * Same redistribution as PRIORITIZE_URGENT but with overtime capacity
 * enabled (handled via capacitiesPerDay). This flag is passed separately;
 * here we just build the assignment order.
 */
function buildUseOvertimeAssignments(orders: SchedulingOrder[]): AssignedOrder[] {
  // Keep default line assignments, sort by priority/deadline
  return sortByPriorityThenDeadline(orders).map((o) => ({
    order: o,
    lineId: o.defaultLineId,
  }));
}

// ---------------------------------------------------------------------------
// Line utilisation
// ---------------------------------------------------------------------------

function computeLineUtilization(
  tasks: ScheduledTask[],
  scenario: SchedulingScenario,
  capacitiesPerDay: Record<string, number[]>,
  normalCapacitiesPerDay: Record<string, number[]>,
): LineUtilization[] {
  return scenario.lines.map((line) => {
    const lineTasks = tasks.filter((t) => t.lineId === line.id && t.day >= 1);
    const productionHours = lineTasks.reduce((s, t) => s + t.endHour - t.startHour, 0);
    const setupHours = lineTasks.reduce((s, t) => s + t.setupHoursBefore, 0);
    const normalCapPerDay = normalCapacitiesPerDay[line.id] ?? [];
    const overtimeHours = lineTasks
      .filter((t) => t.isOvertime)
      .reduce(
        (s, t) => {
          const dayNormalCap = normalCapPerDay[t.day - 1] ?? line.normalHoursPerDay;
          return s + Math.max(0, t.endHour - Math.max(t.startHour, dayNormalCap));
        },
        0,
      );
    const availableHours =
      (capacitiesPerDay[line.id] ?? []).reduce((s, h) => s + h, 0);
    const usedHours = productionHours + setupHours;
    const unusedHours = Math.max(0, availableHours - usedHours);
    const utilizationPct = availableHours > 0 ? usedHours / availableHours : 0;

    return {
      lineId: line.id,
      lineName: line.name,
      availableHours,
      productionHours,
      setupHours,
      overtimeHours: Math.max(0, overtimeHours),
      unusedHours,
      utilizationPct,
    };
  });
}

// ---------------------------------------------------------------------------
// Financial impact
// ---------------------------------------------------------------------------

function computeFinancialImpact(
  tasks: ScheduledTask[],
  lineUtil: LineUtilization[],
  costConfig: CostConfig,
): FinancialImpact {
  const delayCost = tasks.reduce((s, t) => s + t.delayPenalty, 0);
  const overtimeCost = lineUtil.reduce(
    (s, l) => s + l.overtimeHours * costConfig.overtimeCostPerHour,
    0,
  );
  const setupCost = lineUtil.reduce(
    (s, l) => s + l.setupHours * costConfig.setupCostPerHour,
    0,
  );
  const unusedCapacityCost = lineUtil.reduce(
    (s, l) => s + l.unusedHours * costConfig.unusedCapacityCostPerHour,
    0,
  );
  const revenueAtRisk = tasks
    .filter((t) => t.status === "DELAYED" || t.status === "NOT_SCHEDULED")
    .reduce((s, t) => s + t.revenueEur, 0);

  return {
    delayCost,
    overtimeCost,
    setupCost,
    unusedCapacityCost,
    revenueAtRisk,
    totalCost: delayCost + overtimeCost + setupCost + unusedCapacityCost,
  };
}

// ---------------------------------------------------------------------------
// Constraint evaluation
// ---------------------------------------------------------------------------

function evaluateConstraints(
  assignments: AssignedOrder[],
  tasks: ScheduledTask[],
  scenario: SchedulingScenario,
  capacitiesPerDay: Record<string, number[]>,
): ConstraintResult[] {
  const results: ConstraintResult[] = [];

  // RULE-CAPACITY
  const lineOverflows: string[] = [];
  for (const line of scenario.lines) {
    const lineTasks = tasks.filter((t) => t.lineId === line.id && t.day >= 1);
    for (let day = 1; day <= scenario.planningHorizonDays; day++) {
      const cap = (capacitiesPerDay[line.id] ?? [])[day - 1] ?? 0;
      const dayTasks = lineTasks.filter((t) => t.day === day);
      const used = dayTasks.reduce(
        (s, t) => s + t.endHour - t.startHour + t.setupHoursBefore,
        0,
      );
      if (used > cap + 0.001) lineOverflows.push(`${line.name} day ${day}`);
    }
  }
  results.push({
    ruleId: "RULE-CAPACITY",
    ruleName: "Line capacity",
    passed: lineOverflows.length === 0,
    evidence:
      lineOverflows.length === 0
        ? "All lines within daily capacity limits."
        : `Capacity exceeded on: ${lineOverflows.join(", ")}.`,
    featureValues: { overflowCount: lineOverflows.length },
  });

  // RULE-MACHINE-COMPAT
  const incompatible = assignments.filter(
    ({ order, lineId }) => !order.compatibleLines.includes(lineId),
  );
  results.push({
    ruleId: "RULE-MACHINE-COMPAT",
    ruleName: "Machine compatibility",
    passed: incompatible.length === 0,
    evidence:
      incompatible.length === 0
        ? "All orders assigned to compatible lines."
        : `Incompatible assignments: ${incompatible.map((a) => a.order.id).join(", ")}.`,
    featureValues: { incompatibleCount: incompatible.length },
  });

  // RULE-MATERIAL
  const unavailable = assignments.filter(
    ({ order }) => order.materialStatus === "UNAVAILABLE",
  );
  results.push({
    ruleId: "RULE-MATERIAL",
    ruleName: "Material availability",
    passed: unavailable.length === 0,
    evidence:
      unavailable.length === 0
        ? "All required materials are available."
        : `Orders with unavailable material: ${unavailable.map((a) => a.order.id).join(", ")}.`,
    featureValues: { unavailableCount: unavailable.length },
  });

  // RULE-CRITICAL-DEADLINE
  const criticalDelayed = tasks.filter(
    (t) =>
      assignments.some((a) => a.order.id === t.orderId && a.order.priority === "CRITICAL") &&
      (t.status === "DELAYED" || t.status === "NOT_SCHEDULED"),
  );
  results.push({
    ruleId: "RULE-CRITICAL-DEADLINE",
    ruleName: "Critical deadline",
    passed: criticalDelayed.length === 0,
    evidence:
      criticalDelayed.length === 0
        ? "All CRITICAL orders meet their deadlines."
        : `CRITICAL deadline violated: ${criticalDelayed.map((t) => t.orderId).join(", ")}.`,
    featureValues: { criticalDelayedCount: criticalDelayed.length },
  });

  // RULE-ORDER-PRIORITY (soft)
  const highDelayed = tasks.filter(
    (t) =>
      assignments.some((a) => a.order.id === t.orderId && a.order.priority === "HIGH") &&
      t.status === "DELAYED",
  );
  results.push({
    ruleId: "RULE-ORDER-PRIORITY",
    ruleName: "Order priority",
    passed: highDelayed.length === 0,
    evidence:
      highDelayed.length === 0
        ? "All HIGH-priority orders meet their deadlines."
        : `${highDelayed.length} HIGH-priority order(s) delayed.`,
    featureValues: { highDelayedCount: highDelayed.length },
  });

  // RULE-SETUP (informational — always passes)
  const totalSetupHours = tasks.reduce((s, t) => s + t.setupHoursBefore, 0);
  results.push({
    ruleId: "RULE-SETUP",
    ruleName: "Setup / changeover",
    passed: true,
    evidence: `Total setup/changeover time: ${totalSetupHours.toFixed(2)}h.`,
    featureValues: { totalSetupHours },
  });

  // RULE-CAPACITY-UTIL (soft)
  const notScheduled = tasks.filter((t) => t.status === "NOT_SCHEDULED").length;
  results.push({
    ruleId: "RULE-CAPACITY-UTIL",
    ruleName: "Capacity utilisation",
    passed: notScheduled === 0,
    evidence:
      notScheduled === 0
        ? "All orders are scheduled within the planning horizon."
        : `${notScheduled} order(s) could not be scheduled within the horizon.`,
    featureValues: { notScheduledCount: notScheduled },
  });

  return results;
}

// ---------------------------------------------------------------------------
// Feasibility
// ---------------------------------------------------------------------------

function determineFeasibility(
  constraintResults: ConstraintResult[],
): { feasibility: FeasibilityStatus; blockingConstraints: string[] } {
  const failing = constraintResults.filter((r) => {
    const rule = CONSTRAINT_RULES.find((cr) => cr.id === r.ruleId);
    return rule?.hard && !r.passed;
  });
  return {
    feasibility: failing.length === 0 ? "FEASIBLE" : "INFEASIBLE",
    blockingConstraints: failing.map((r) => r.ruleName),
  };
}

// ---------------------------------------------------------------------------
// Scoring (only for feasible strategies; infeasible strategies get 0)
// ---------------------------------------------------------------------------

function scoreStrategy(
  tasks: ScheduledTask[],
  lineUtil: LineUtilization[],
  financial: FinancialImpact,
  allOrders: SchedulingOrder[],
  allFinancials: FinancialImpact[],
): StrategyScore {
  const total = tasks.length;
  const onTime = tasks.filter((t) => t.status === "ON_TIME").length;
  const criticalOrders = allOrders.filter((o) => o.priority === "CRITICAL");
  const criticalOnTime = criticalOrders.every((o) =>
    tasks.find((t) => t.orderId === o.id && t.status === "ON_TIME"),
  );

  const onTimeDelivery = total > 0 ? onTime / total : 0;
  const criticalOrderProtection = criticalOrders.length === 0 || criticalOnTime ? 1 : 0;

  // Normalise financial scores against worst feasible strategy
  const maxDelayCost = Math.max(...allFinancials.map((f) => f.delayCost), 1);
  const maxSetupCost = Math.max(...allFinancials.map((f) => f.setupCost), 1);
  const maxOvertimeCost = Math.max(...allFinancials.map((f) => f.overtimeCost), 1);

  const delayCostScore = 1 - financial.delayCost / maxDelayCost;
  const setupEfficiency = 1 - financial.setupCost / maxSetupCost;
  const overtimeCostScore = 1 - financial.overtimeCost / maxOvertimeCost;

  const totalAvailHours = lineUtil.reduce((s, l) => s + l.availableHours, 0);
  const totalUsedHours = lineUtil.reduce(
    (s, l) => s + l.productionHours + l.setupHours,
    0,
  );
  const capacityUtilization =
    totalAvailHours > 0 ? Math.min(1, totalUsedHours / totalAvailHours) : 0;

  const totalRevenue = allOrders.reduce((s, o) => s + o.revenueEur, 0);
  const atRiskRevenue = tasks
    .filter((t) => t.status !== "ON_TIME")
    .reduce((s, t) => s + t.revenueEur, 0);
  const revenueProtection =
    totalRevenue > 0 ? (totalRevenue - atRiskRevenue) / totalRevenue : 1;

  const composite =
    SCORE_WEIGHTS.onTimeDelivery * onTimeDelivery +
    SCORE_WEIGHTS.criticalOrderProtection * criticalOrderProtection +
    SCORE_WEIGHTS.delayCostScore * delayCostScore +
    SCORE_WEIGHTS.setupEfficiency * setupEfficiency +
    SCORE_WEIGHTS.capacityUtilization * capacityUtilization +
    SCORE_WEIGHTS.overtimeCostScore * overtimeCostScore +
    SCORE_WEIGHTS.revenueProtection * revenueProtection;

  return {
    onTimeDelivery,
    criticalOrderProtection,
    delayCostScore,
    setupEfficiency,
    capacityUtilization,
    overtimeCostScore,
    revenueProtection,
    composite,
  };
}

// ---------------------------------------------------------------------------
// Strategy labels
// ---------------------------------------------------------------------------

const STRATEGY_LABELS: Record<StrategyId, string> = {
  KEEP_CURRENT_SCHEDULE: "Keep Current Schedule",
  PRIORITIZE_URGENT_ORDERS: "Prioritise Urgent Orders",
  REDISTRIBUTE_TO_OTHER_LINES: "Redistribute to Other Lines",
  DELAY_LOW_PRIORITY_ORDERS: "Delay Low-Priority Orders",
  USE_OVERTIME: "Use Overtime",
};

// ---------------------------------------------------------------------------
// Explanation builder
// ---------------------------------------------------------------------------

function buildExplanation(
  recommended: StrategyEvaluation,
  all: StrategyEvaluation[],
  baseline: StrategyEvaluation,
): DecisionExplanation {
  const reasons: DecisionFactor[] = [];
  const tasks = recommended.schedule;

  const criticalOnTime = tasks
    .filter((t) => t.priority === "CRITICAL" && t.status === "ON_TIME")
    .length;
  const criticalTotal = tasks.filter((t) => t.priority === "CRITICAL").length;
  if (criticalOnTime > 0) {
    reasons.push({
      label: `Protects ${criticalOnTime} of ${criticalTotal} critical customer deadline(s)`,
      direction: "positive",
      evidence: `All CRITICAL orders complete within their delivery window.`,
    });
  }

  const avoidedDelay = baseline.financialImpact.delayCost - recommended.financialImpact.delayCost;
  if (avoidedDelay > 0) {
    reasons.push({
      label: `Avoids €${Math.round(avoidedDelay).toLocaleString("de-DE")} in delay penalties`,
      direction: "positive",
      evidence: `Delay cost reduced from €${Math.round(baseline.financialImpact.delayCost).toLocaleString("de-DE")} to €${Math.round(recommended.financialImpact.delayCost).toLocaleString("de-DE")}.`,
    });
  }

  const setupSavings = baseline.financialImpact.setupCost - recommended.financialImpact.setupCost;
  if (setupSavings > 0) {
    reasons.push({
      label: `Reduces setup/changeover cost by €${Math.round(setupSavings).toLocaleString("de-DE")}`,
      direction: "positive",
      evidence: `Grouping compatible product families on the same line reduces changeover time.`,
    });
  }

  const overtimeSavings =
    baseline.financialImpact.overtimeCost - recommended.financialImpact.overtimeCost;
  if (overtimeSavings > 0) {
    reasons.push({
      label: `Avoids €${Math.round(overtimeSavings).toLocaleString("de-DE")} overtime cost`,
      direction: "positive",
      evidence: `Redistribution eliminates the need for overtime production.`,
    });
  }

  if (recommended.financialImpact.overtimeCost > 0) {
    reasons.push({
      label: `Requires €${Math.round(recommended.financialImpact.overtimeCost).toLocaleString("de-DE")} overtime`,
      direction: "negative",
      evidence: `Overtime hours needed to meet all deadlines under current capacity.`,
    });
  }

  const utilPct = Math.round(
    (recommended.lineUtilization.reduce(
      (s, l) => s + l.productionHours + l.setupHours,
      0,
    ) /
      Math.max(
        1,
        recommended.lineUtilization.reduce((s, l) => s + l.availableHours, 0),
      )) *
      100,
  );
  reasons.push({
    label: `${utilPct}% available capacity utilised`,
    direction: utilPct > 50 ? "positive" : "negative",
    evidence: `Total used hours vs total available hours across all lines.`,
  });

  const rejectedStrategies = all
    .filter((s) => s.strategyId !== recommended.strategyId)
    .map((s) => {
      let reason: string;
      if (s.feasibility === "INFEASIBLE") {
        reason = `Infeasible: ${s.blockingConstraints.join("; ")}.`;
      } else if (s.financialImpact.totalCost > recommended.financialImpact.totalCost) {
        const diff = Math.round(
          s.financialImpact.totalCost - recommended.financialImpact.totalCost,
        );
        reason = `Feasible but €${diff.toLocaleString("de-DE")} higher total cost.`;
      } else {
        reason = `Lower composite score (${s.score.composite.toFixed(3)} vs ${recommended.score.composite.toFixed(3)}).`;
      }
      return { strategyId: s.strategyId, reason, feasibility: s.feasibility };
    });

  return {
    recommendedStrategyId: recommended.strategyId,
    reasons,
    rejectedStrategies,
  };
}

// ---------------------------------------------------------------------------
// Main engine entry point
// ---------------------------------------------------------------------------

export function runSchedulingEngine(
  request: SchedulingDecisionRequest,
): SchedulingDecisionResponse {
  const scenario = request.scenario;
  const costConfig = mergeCostConfig(request.costConfig);

  // Compute capacity tables
  const normalCaps = normalCapacityPerDay(scenario);

  // Build strategy assignments
  const strategyDefs: Array<{
    id: StrategyId;
    assignments: AssignedOrder[];
    overtime: boolean;
  }> = [
    {
      id: "KEEP_CURRENT_SCHEDULE",
      assignments: buildKeepCurrentAssignments(scenario.orders),
      overtime: false,
    },
    {
      id: "PRIORITIZE_URGENT_ORDERS",
      assignments: buildPrioritizeUrgentAssignments(scenario.orders),
      overtime: false,
    },
    {
      id: "REDISTRIBUTE_TO_OTHER_LINES",
      assignments: buildRedistributeAssignments(scenario.orders),
      overtime: false,
    },
    {
      id: "DELAY_LOW_PRIORITY_ORDERS",
      assignments: buildDelayLowPriorityAssignments(scenario.orders),
      overtime: false,
    },
    {
      id: "USE_OVERTIME",
      assignments: buildUseOvertimeAssignments(scenario.orders),
      overtime: scenario.overtimeAvailable,
    },
  ];

  // Evaluate each strategy
  const allFinancials: FinancialImpact[] = [];
  const rawEvaluations: Array<{
    id: StrategyId;
    assignments: AssignedOrder[];
    tasks: ScheduledTask[];
    lineUtil: LineUtilization[];
    constraintResults: ConstraintResult[];
    feasibility: FeasibilityStatus;
    blockingConstraints: string[];
    financial: FinancialImpact;
  }> = [];

  for (const def of strategyDefs) {
    const overtime = def.overtime;
    const caps = buildLineCapacitiesPerDay(scenario, overtime);
    const normalCapsPerDay = buildNormalCapacitiesPerDay(scenario);
    const tasks = scheduleAssignments(
      def.assignments,
      caps,
      normalCapsPerDay,
      scenario.setupMatrix,
      scenario.planningHorizonDays,
      normalCaps,
      overtime,
    );
    const lineUtil = computeLineUtilization(tasks, scenario, caps, normalCapsPerDay);
    const constraintResults = evaluateConstraints(
      def.assignments,
      tasks,
      scenario,
      caps,
    );
    const { feasibility, blockingConstraints } = determineFeasibility(constraintResults);
    const financial = computeFinancialImpact(tasks, lineUtil, costConfig);
    allFinancials.push(financial);
    rawEvaluations.push({
      id: def.id,
      assignments: def.assignments,
      tasks,
      lineUtil,
      constraintResults,
      feasibility,
      blockingConstraints,
      financial,
    });
  }

  // Score feasible strategies
  const feasibleFinancials = rawEvaluations
    .filter((e) => e.feasibility === "FEASIBLE")
    .map((e) => e.financial);

  const strategies: StrategyEvaluation[] = rawEvaluations.map((raw) => {
    const onTime = raw.tasks.filter((t) => t.status === "ON_TIME").length;
    const delayed = raw.tasks.filter((t) => t.status === "DELAYED").length;
    const notSched = raw.tasks.filter((t) => t.status === "NOT_SCHEDULED").length;

    const score: StrategyScore =
      raw.feasibility === "FEASIBLE"
        ? scoreStrategy(
            raw.tasks,
            raw.lineUtil,
            raw.financial,
            scenario.orders,
            feasibleFinancials.length > 0 ? feasibleFinancials : [raw.financial],
          )
        : {
            onTimeDelivery: 0,
            criticalOrderProtection: 0,
            delayCostScore: 0,
            setupEfficiency: 0,
            capacityUtilization: 0,
            overtimeCostScore: 0,
            revenueProtection: 0,
            composite: 0,
          };

    return {
      strategyId: raw.id,
      strategyLabel: STRATEGY_LABELS[raw.id],
      feasibility: raw.feasibility,
      blockingConstraints: raw.blockingConstraints,
      constraintResults: raw.constraintResults,
      schedule: raw.tasks,
      lineUtilization: raw.lineUtil,
      financialImpact: raw.financial,
      score,
      onTimeCount: onTime,
      delayedCount: delayed,
      notScheduledCount: notSched,
      totalOrders: raw.tasks.length,
      rank: 0,
    };
  });

  // Rank feasible strategies
  const feasible = strategies
    .filter((s) => s.feasibility === "FEASIBLE")
    .sort((a, b) => b.score.composite - a.score.composite);
  feasible.forEach((s, i) => {
    s.rank = i + 1;
  });

  // Select recommended strategy
  const recommended = feasible[0];

  let decisionStatus: DecisionStatus = "DECIDED";
  let recommendedStrategyId: StrategyId = "REDISTRIBUTE_TO_OTHER_LINES";

  if (!recommended) {
    decisionStatus = "NO_FEASIBLE_ALTERNATIVE";
    recommendedStrategyId = "KEEP_CURRENT_SCHEDULE";
  } else {
    recommendedStrategyId = recommended.strategyId;
  }

  // Compute avoided cost vs KEEP_CURRENT
  const keepCurrentFinancial = strategies.find(
    (s) => s.strategyId === "KEEP_CURRENT_SCHEDULE",
  )?.financialImpact;
  const recommendedFinancial = recommended?.financialImpact;
  const avoidedCostVsBaseline =
    keepCurrentFinancial && recommendedFinancial
      ? keepCurrentFinancial.totalCost - recommendedFinancial.totalCost
      : 0;

  const baselineStrategy = strategies.find(
    (s) => s.strategyId === "KEEP_CURRENT_SCHEDULE",
  ) ?? strategies[0]!;

  const explanation =
    recommended && decisionStatus === "DECIDED"
      ? buildExplanation(recommended, strategies, baselineStrategy)
      : {
          recommendedStrategyId,
          reasons: [],
          rejectedStrategies: [],
        };

  const decisiveFactors: DecisionFactor[] = explanation.reasons;

  const computedAt = new Date("2026-01-15T09:00:00Z").toISOString();
  const decisionId = [
    scenario.scenarioId,
    ENGINE_VERSION,
    costConfig.configVersion,
    recommendedStrategyId,
  ].join("-");

  const auditTrail: AuditEntry = {
    decisionId,
    scenarioId: scenario.scenarioId,
    computedAt,
    engineVersion: ENGINE_VERSION,
    configVersion: costConfig.configVersion,
    rulesExecuted: CONSTRAINT_RULES.map((r) => r.id),
    strategiesEvaluated: strategyDefs.map((s) => s.id),
    recommendedStrategy: recommendedStrategyId,
    decisionStatus,
    totalFinancialImpact: recommendedFinancial?.totalCost ?? 0,
    avoidedCostVsBaseline,
    source: "SYNTHETIC_DEMONSTRATION",
  };

  return {
    recommendedStrategy: recommendedStrategyId,
    decisionStatus,
    strategies,
    explanation,
    decisiveFactors,
    totalFinancialImpact: recommendedFinancial?.totalCost ?? 0,
    avoidedCostVsBaseline,
    scenarioSnapshot: scenario,
    engineVersion: ENGINE_VERSION,
    configVersion: costConfig.configVersion,
    computedAt,
    auditTrail,
  };
}
