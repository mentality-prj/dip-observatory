/**
 * Scenario lab helpers for production replanning.
 * Pure deterministic functions for sensitivity analysis and trace diff.
 */
import {
  runProductionReplanningEngine,
  DEFAULT_COST_CONFIG,
} from "@/production-replanning/lib/engine";
import type {
  ProductionDecisionResponse,
  ProductionDecisionRequest,
  ProductionScenario,
} from "@/production-replanning/types";

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
  baselineDecision: string;
  scenarioDecision: string;
  changed: boolean;
  changedReasons: string[];
  financialDelta: number;
  avoidedCostDelta: number;
}

/**
 * Compute decision sensitivity by perturbing key variables one at a time
 * and observing whether the recommended action changes.
 */
export function computeProductionSensitivity(
  baseRequest: ProductionDecisionRequest,
): SensitivityEntry[] {
  const base = runProductionReplanningEngine(baseRequest);
  const baseDecision = base.recommendedAction;
  const scenario = baseRequest.scenario;
  const costs = baseRequest.costConfig ?? DEFAULT_COST_CONFIG;

  function changed(s: ProductionScenario): boolean {
    const r = runProductionReplanningEngine({ scenario: s, costConfig: costs });
    return r.recommendedAction !== baseDecision;
  }

  const capReductionFactor = scenario.disruption.capacityReductionFactor;
  const capHigh = changed({
    ...scenario,
    scenarioId: "SEN-CAP",
    disruption: {
      ...scenario.disruption,
      capacityReductionFactor: Math.min(0.9, capReductionFactor + 0.15),
    },
  });

  const criticalOrders = scenario.orders.filter((o) => o.priority === "CRITICAL");
  const minCritDeadline =
    criticalOrders.length > 0
      ? Math.min(...criticalOrders.map((o) => o.deadlineDays))
      : 99;
  const deadlineHigh =
    minCritDeadline > 1 &&
    changed({
      ...scenario,
      scenarioId: "SEN-DL",
      orders: scenario.orders.map((o) =>
        o.priority === "CRITICAL"
          ? { ...o, deadlineDays: Math.max(1, o.deadlineDays - 1) }
          : o,
      ),
    });

  const matATonnes =
    scenario.materials.find((m) => m.id === "MAT-A")?.availableTonnes ?? 0;
  const materialHigh =
    matATonnes > 0 &&
    changed({
      ...scenario,
      scenarioId: "SEN-MAT",
      materials: scenario.materials.map((m) =>
        m.id === "MAT-A" ? { ...m, availableTonnes: matATonnes * 0.8 } : m,
      ),
    });

  const overtimeChanged = changed({
    ...scenario,
    scenarioId: "SEN-OT",
    overtimeAvailable: !scenario.overtimeAvailable,
  });

  const normalOrderChanged = changed({
    ...scenario,
    scenarioId: "SEN-NRM",
    orders: scenario.orders.map((o) =>
      o.priority === "NORMAL" ? { ...o, deadlineDays: o.deadlineDays + 3 } : o,
    ),
  });

  return [
    {
      variable: "Critical deadline",
      level: deadlineHigh ? "HIGH" : "MEDIUM",
      evidence: deadlineHigh
        ? "Tightening critical deadline by 1 day changes the recommended action."
        : "Critical deadline has moderate influence on the decision.",
    },
    {
      variable: "Capacity reduction",
      level: capHigh ? "HIGH" : "MEDIUM",
      evidence: capHigh
        ? "Increasing capacity reduction by 15% changes the recommended action."
        : "Capacity reduction influences costs but not the action within ±15%.",
    },
    {
      variable: "Material availability",
      level: materialHigh ? "HIGH" : "MEDIUM",
      evidence: materialHigh
        ? "Reducing Material A by 20% changes the recommended action."
        : "Material availability at current level does not change the action within −20%.",
    },
    {
      variable: "Overtime availability",
      level: overtimeChanged ? "MEDIUM" : "LOW",
      evidence: overtimeChanged
        ? "Toggling overtime availability changes the recommended action."
        : "Overtime availability affects costs but not the action at current levels.",
    },
    {
      variable: "Normal-priority orders",
      level: normalOrderChanged ? "MEDIUM" : "LOW",
      evidence: normalOrderChanged
        ? "Changing normal-priority order deadlines changes the recommended action."
        : "Normal-priority order timing has low influence on the decision.",
    },
  ];
}

/**
 * Compute rule-level trace diff between baseline and scenario decisions.
 */
export function computeProductionTraceDiff(
  baseline: ProductionDecisionResponse,
  scenario: ProductionDecisionResponse,
): TraceDiffEntry[] {
  const baselineRecs = baseline.alternatives.find(
    (a) => a.actionId === baseline.recommendedAction,
  );
  const scenarioRecs = scenario.alternatives.find(
    (a) => a.actionId === scenario.recommendedAction,
  );

  if (!baselineRecs || !scenarioRecs) return [];

  const ruleIds = [
    ...new Set([
      ...baselineRecs.ruleResults.map((r) => r.ruleId),
      ...scenarioRecs.ruleResults.map((r) => r.ruleId),
    ]),
  ];

  return ruleIds.map((ruleId) => {
    const bRule = baselineRecs.ruleResults.find((r) => r.ruleId === ruleId);
    const sRule = scenarioRecs.ruleResults.find((r) => r.ruleId === ruleId);
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

/**
 * Compute decision delta between baseline and scenario.
 */
export function computeProductionDecisionDelta(
  baseline: ProductionDecisionResponse,
  scenario: ProductionDecisionResponse,
  changedParams: Partial<
    Record<string, { from: string | number; to: string | number }>
  >,
): DecisionDelta {
  const changed = baseline.recommendedAction !== scenario.recommendedAction;
  const changedReasons: string[] = [];

  for (const [key, change] of Object.entries(changedParams)) {
    if (change && change.from !== change.to) {
      changedReasons.push(`${key}: ${change.from} → ${change.to}`);
    }
  }

  const baselineFinancial =
    baseline.alternatives.find((a) => a.actionId === baseline.recommendedAction)
      ?.financialImpact.total ?? 0;
  const scenarioFinancial =
    scenario.alternatives.find((a) => a.actionId === scenario.recommendedAction)
      ?.financialImpact.total ?? 0;

  return {
    baselineDecision: baseline.recommendedAction,
    scenarioDecision: scenario.recommendedAction,
    changed,
    changedReasons,
    financialDelta: scenarioFinancial - baselineFinancial,
    avoidedCostDelta:
      scenario.avoidedCostVsBaseline - baseline.avoidedCostVsBaseline,
  };
}
