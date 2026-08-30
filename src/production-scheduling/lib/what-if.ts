/**
 * Scenario what-if state — shared between the UI controls and tests.
 *
 * Extracted here so the pure mapping function `buildSchedulingScenario`
 * can be unit-tested without importing React or the full workspace component.
 */
import type { SchedulingScenario } from "@/production-scheduling/types";

export interface WhatIfState {
  /** Line B capacity reduction (%). Range: 0–60. */
  lineBCapacityReductionPct: number;
  /** Disruption duration in days. Range: 1–5. */
  disruptionDurationDays: number;
  /** Deadline in days for the CRITICAL order #101. Range: 1–5. */
  criticalOrderDeadlineDays: number;
  /** Whether ORDER-103 material is available. */
  order103MaterialAvailable: boolean;
  /** Whether overtime is allowed. */
  overtimeAvailable: boolean;
  /** Overtime cost per hour (€). Range: 50–400. */
  overtimeCostPerHour: number;
  /** Priority adjustment for ORDER-116 (normally NORMAL). */
  order116Priority: "HIGH" | "NORMAL" | "LOW";
}

export const BASELINE_WHAT_IF: WhatIfState = {
  lineBCapacityReductionPct: 25,
  disruptionDurationDays: 2,
  criticalOrderDeadlineDays: 1,
  order103MaterialAvailable: true,
  overtimeAvailable: false,
  overtimeCostPerHour: 180,
  order116Priority: "NORMAL",
};

/**
 * Apply a WhatIfState onto a base SchedulingScenario.
 * Never mutates the base scenario.
 */
export function buildSchedulingScenario(
  base: SchedulingScenario,
  what: WhatIfState,
): SchedulingScenario {
  const scenarioId = [
    base.scenarioId,
    "WHATIF",
    `cap${what.lineBCapacityReductionPct}`,
    `dur${what.disruptionDurationDays}`,
    `crit${what.criticalOrderDeadlineDays}`,
    `mat${what.order103MaterialAvailable ? "1" : "0"}`,
    `ot${what.overtimeAvailable ? "1" : "0"}`,
    `otc${what.overtimeCostPerHour}`,
    `p116${what.order116Priority}`,
  ].join("-");

  return {
    ...base,
    scenarioId,
    orders: base.orders.map((o) => {
      if (o.id === "ORDER-101") {
        return { ...o, deadlineDays: what.criticalOrderDeadlineDays };
      }
      if (o.id === "ORDER-103") {
        return {
          ...o,
          materialStatus: what.order103MaterialAvailable ? "AVAILABLE" : "UNAVAILABLE",
        } as typeof o;
      }
      if (o.id === "ORDER-116") {
        return { ...o, priority: what.order116Priority } as typeof o;
      }
      return o;
    }),
    disruption: {
      ...base.disruption,
      capacityReductionFactor: what.lineBCapacityReductionPct / 100,
      durationDays: what.disruptionDurationDays,
    },
    overtimeAvailable: what.overtimeAvailable,
  };
}

/**
 * Build a partial CostConfig override from a WhatIfState.
 */
export function buildCostConfigOverride(what: WhatIfState) {
  return { overtimeCostPerHour: what.overtimeCostPerHour };
}
