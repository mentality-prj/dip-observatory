/**
 * Scenario what-if state — shared between the UI controls and tests.
 *
 * Extracted here so the pure mapping function `buildScenario` can be unit-tested
 * without importing React or the full workspace component.
 */
import type { ProductionScenario } from "@/production-replanning/types";

export interface WhatIfState {
  /** Line A capacity reduction (%). Range: 0–60. */
  capacityReductionPct: number;
  /** Disruption duration in days. Range: 1–10. */
  disruptionDurationDays: number;
  /** Available tonnes of Material A. Range: 50–600. */
  materialATonnes: number;
  /** Critical order deadline in days from now. Range: 1–14. */
  criticalDeadlineDays: number;
  overtimeAvailable: boolean;
}

export const BASELINE_WHAT_IF: WhatIfState = {
  capacityReductionPct: 30,
  disruptionDurationDays: 3,
  materialATonnes: 420,
  criticalDeadlineDays: 2,
  overtimeAvailable: true,
};

/**
 * Map a WhatIfState onto a base ProductionScenario.
 *
 * Rules:
 *  - capacityReductionPct / 100  → disruption.capacityReductionFactor
 *  - disruptionDurationDays      → disruption.durationDays
 *  - materialATonnes             → MAT-A availableTonnes
 *  - criticalDeadlineDays        → every CRITICAL order's deadlineDays
 *  - overtimeAvailable           → scenario.overtimeAvailable
 */
export function buildScenario(
  base: ProductionScenario,
  what: WhatIfState,
): ProductionScenario {
  return {
    ...base,
    scenarioId: `${base.scenarioId}-WHATIF`,
    materials: base.materials.map((m) =>
      m.id === "MAT-A" ? { ...m, availableTonnes: what.materialATonnes } : m,
    ),
    orders: base.orders.map((o) =>
      o.priority === "CRITICAL" ? { ...o, deadlineDays: what.criticalDeadlineDays } : o,
    ),
    disruption: {
      ...base.disruption,
      capacityReductionFactor: what.capacityReductionPct / 100,
      durationDays: what.disruptionDurationDays,
    },
    overtimeAvailable: what.overtimeAvailable,
  };
}
