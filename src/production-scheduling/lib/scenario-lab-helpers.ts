/**
 * Scenario lab helpers for the SURMA production scheduling demonstrator.
 * Pure deterministic functions for sensitivity analysis and trace diff.
 *
 * SYNTHETIC DEMONSTRATION — not SURMA SYSTEMS production data.
 */
import {
  runSchedulingEngine,
  DEFAULT_COST_CONFIG,
} from "@/production-scheduling/lib/engine";
import { buildCostConfigOverride, type WhatIfState } from "@/production-scheduling/lib/what-if";
import type {
  SchedulingDecisionResponse,
  SchedulingDecisionRequest,
  SchedulingScenario,
  StrategyId,
} from "@/production-scheduling/types";

export interface SensitivityEntry {
  variable: string;
  level: "HIGH" | "MEDIUM" | "LOW";
  evidence: string;
}

export interface TraceDiffEntry {
  ruleId: string;
  ruleName: string;
  baselineResult: "PASS" | "FAIL";
  scenarioResult: "PASS" | "FAIL";
  baselineEvidence: string;
  scenarioEvidence: string;
  changed: boolean;
}

export interface DecisionDelta {
  baselineDecision: StrategyId;
  scenarioDecision: StrategyId;
  changed: boolean;
  changedReasons: string[];
  financialDelta: number;
  avoidedCostDelta: number;
}

// ---------------------------------------------------------------------------
// Sensitivity
// ---------------------------------------------------------------------------

/**
 * Compute decision sensitivity by perturbing key variables one at a time
 * and observing whether the recommended strategy changes.
 */
export function computeSchedulingSensitivity(
  baseRequest: SchedulingDecisionRequest,
): SensitivityEntry[] {
  const base = runSchedulingEngine(baseRequest);
  const baseDecision = base.recommendedStrategy;
  const scenario = baseRequest.scenario;
  const costs = { ...DEFAULT_COST_CONFIG, ...(baseRequest.costConfig ?? {}) };

  function decisionChanged(s: SchedulingScenario, costOverride?: Partial<typeof costs>): boolean {
    const r = runSchedulingEngine({
      scenario: s,
      costConfig: costOverride ?? costs,
    });
    return r.recommendedStrategy !== baseDecision;
  }

  // Critical deadline sensitivity
  const criticalOrder = scenario.orders.find((o) => o.id === "ORDER-101");
  const critDeadline = criticalOrder?.deadlineDays ?? 1;
  const criticalDeadlineChanged =
    critDeadline > 1 &&
    decisionChanged({
      ...scenario,
      scenarioId: "SEN-CRIT-DL",
      orders: scenario.orders.map((o) =>
        o.id === "ORDER-101" ? { ...o, deadlineDays: Math.max(1, critDeadline - 1) } : o,
      ),
    });

  // Line B capacity sensitivity
  const capFactor = scenario.disruption.capacityReductionFactor;
  const lineBCapChanged = decisionChanged({
    ...scenario,
    scenarioId: "SEN-CAP",
    disruption: {
      ...scenario.disruption,
      capacityReductionFactor: Math.min(0.9, capFactor + 0.25),
    },
  });

  // Disruption duration sensitivity
  const durationChanged = decisionChanged({
    ...scenario,
    scenarioId: "SEN-DUR",
    disruption: {
      ...scenario.disruption,
      durationDays: Math.min(5, scenario.disruption.durationDays + 2),
    },
  });

  // Material availability sensitivity (ORDER-103)
  const materialChanged = decisionChanged({
    ...scenario,
    scenarioId: "SEN-MAT",
    orders: scenario.orders.map((o) =>
      o.id === "ORDER-103" ? { ...o, materialStatus: "UNAVAILABLE" as const } : o,
    ),
  });

  // Overtime availability sensitivity
  const overtimeChanged =
    scenario.overtimeAvailable !== true &&
    decisionChanged({
      ...scenario,
      scenarioId: "SEN-OT",
      overtimeAvailable: !scenario.overtimeAvailable,
    });

  // Overtime cost sensitivity
  const overtimeCostChanged = decisionChanged(
    { ...scenario, scenarioId: "SEN-OTCOST" },
    { ...costs, overtimeCostPerHour: costs.overtimeCostPerHour * 0.5 },
  );

  // Normal priority order deadline sensitivity
  const normalDeadlineChanged = decisionChanged({
    ...scenario,
    scenarioId: "SEN-NORM",
    orders: scenario.orders.map((o) =>
      o.priority === "NORMAL"
        ? { ...o, deadlineDays: Math.max(1, o.deadlineDays - 2) }
        : o,
    ),
  });

  return [
    {
      variable: "Critical order deadline",
      level: criticalDeadlineChanged ? "HIGH" : "MEDIUM",
      evidence: criticalDeadlineChanged
        ? "Tightening the critical deadline by 1 day changes the recommended strategy."
        : "Critical deadline is already at its tightest; any relaxation reduces urgency.",
    },
    {
      variable: "Line B capacity",
      level: lineBCapChanged ? "HIGH" : "MEDIUM",
      evidence: lineBCapChanged
        ? "Increasing Line B capacity reduction by 25% changes the recommended strategy."
        : "Capacity reduction within ±25% does not change the strategy at current levels.",
    },
    {
      variable: "Disruption duration",
      level: durationChanged ? "HIGH" : "MEDIUM",
      evidence: durationChanged
        ? "Extending the disruption by 2 more days changes the recommended strategy."
        : "Two additional disruption days influence costs but not the strategy choice.",
    },
    {
      variable: "Material availability (ORDER-103)",
      level: materialChanged ? "MEDIUM" : "LOW",
      evidence: materialChanged
        ? "Making ORDER-103 material unavailable changes the recommended strategy."
        : "ORDER-103 material availability does not affect the strategy at current levels.",
    },
    {
      variable: "Overtime availability",
      level: overtimeChanged ? "MEDIUM" : "LOW",
      evidence: overtimeChanged
        ? "Enabling overtime changes the recommended strategy."
        : "Overtime availability affects costs but not the strategy at current levels.",
    },
    {
      variable: "Overtime cost",
      level: overtimeCostChanged ? "MEDIUM" : "LOW",
      evidence: overtimeCostChanged
        ? "Halving the overtime cost changes the recommended strategy."
        : "Overtime cost has low influence at current capacity levels.",
    },
    {
      variable: "Normal-priority deadlines",
      level: normalDeadlineChanged ? "MEDIUM" : "LOW",
      evidence: normalDeadlineChanged
        ? "Tightening normal-priority deadlines by 2 days changes the recommended strategy."
        : "Normal-priority order deadlines have low influence on the strategy.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Trace diff
// ---------------------------------------------------------------------------

/**
 * Compute rule-level trace diff between baseline and scenario decisions.
 * Uses the recommended strategy's constraint results in each response.
 */
export function computeSchedulingTraceDiff(
  baseline: SchedulingDecisionResponse,
  scenario: SchedulingDecisionResponse,
): TraceDiffEntry[] {
  const bRec = baseline.strategies.find((s) => s.strategyId === baseline.recommendedStrategy);
  const sRec = scenario.strategies.find((s) => s.strategyId === scenario.recommendedStrategy);

  if (!bRec || !sRec) return [];

  const ruleIds = [
    ...new Set([
      ...bRec.constraintResults.map((r) => r.ruleId),
      ...sRec.constraintResults.map((r) => r.ruleId),
    ]),
  ];

  return ruleIds.map((ruleId) => {
    const bRule = bRec.constraintResults.find((r) => r.ruleId === ruleId);
    const sRule = sRec.constraintResults.find((r) => r.ruleId === ruleId);
    const bResult: "PASS" | "FAIL" = bRule?.passed ? "PASS" : "FAIL";
    const sResult: "PASS" | "FAIL" = sRule?.passed ? "PASS" : "FAIL";
    return {
      ruleId,
      ruleName: bRule?.ruleName ?? sRule?.ruleName ?? ruleId,
      baselineResult: bResult,
      scenarioResult: sResult,
      baselineEvidence: bRule?.evidence ?? "—",
      scenarioEvidence: sRule?.evidence ?? "—",
      changed: bResult !== sResult,
    };
  });
}

// ---------------------------------------------------------------------------
// Decision delta
// ---------------------------------------------------------------------------

/**
 * Compute a human-readable delta between baseline and scenario decisions.
 */
export function computeSchedulingDecisionDelta(
  baseline: SchedulingDecisionResponse,
  scenario: SchedulingDecisionResponse,
  what: WhatIfState,
  baseWhat: WhatIfState,
): DecisionDelta {
  const changed = baseline.recommendedStrategy !== scenario.recommendedStrategy;
  const changedReasons: string[] = [];

  if (what.lineBCapacityReductionPct !== baseWhat.lineBCapacityReductionPct) {
    changedReasons.push(
      `Line B capacity reduction: ${baseWhat.lineBCapacityReductionPct}% → ${what.lineBCapacityReductionPct}%`,
    );
  }
  if (what.disruptionDurationDays !== baseWhat.disruptionDurationDays) {
    changedReasons.push(
      `Disruption duration: ${baseWhat.disruptionDurationDays} day(s) → ${what.disruptionDurationDays} day(s)`,
    );
  }
  if (what.criticalOrderDeadlineDays !== baseWhat.criticalOrderDeadlineDays) {
    changedReasons.push(
      `Critical order deadline: day ${baseWhat.criticalOrderDeadlineDays} → day ${what.criticalOrderDeadlineDays}`,
    );
  }
  if (what.order103MaterialAvailable !== baseWhat.order103MaterialAvailable) {
    changedReasons.push(
      `ORDER-103 material: ${baseWhat.order103MaterialAvailable ? "available" : "unavailable"} → ${what.order103MaterialAvailable ? "available" : "unavailable"}`,
    );
  }
  if (what.overtimeAvailable !== baseWhat.overtimeAvailable) {
    changedReasons.push(
      `Overtime: ${baseWhat.overtimeAvailable ? "enabled" : "disabled"} → ${what.overtimeAvailable ? "enabled" : "disabled"}`,
    );
  }
  if (what.overtimeCostPerHour !== baseWhat.overtimeCostPerHour) {
    changedReasons.push(
      `Overtime cost: €${baseWhat.overtimeCostPerHour}/h → €${what.overtimeCostPerHour}/h`,
    );
  }
  if (what.order116Priority !== baseWhat.order116Priority) {
    changedReasons.push(
      `ORDER-116 priority: ${baseWhat.order116Priority} → ${what.order116Priority}`,
    );
  }

  const baseFinancial =
    baseline.strategies.find((s) => s.strategyId === baseline.recommendedStrategy)
      ?.financialImpact.totalCost ?? 0;
  const scenFinancial =
    scenario.strategies.find((s) => s.strategyId === scenario.recommendedStrategy)
      ?.financialImpact.totalCost ?? 0;

  return {
    baselineDecision: baseline.recommendedStrategy,
    scenarioDecision: scenario.recommendedStrategy,
    changed,
    changedReasons,
    financialDelta: scenFinancial - baseFinancial,
    avoidedCostDelta:
      scenario.avoidedCostVsBaseline - baseline.avoidedCostVsBaseline,
  };
}
