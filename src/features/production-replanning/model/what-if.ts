import type { ProductionScenario } from "@/production-replanning/types";

/** Pure scenario inputs shared by presentation, orchestration and tests. */
export interface WhatIfState {
  capacityReductionPct: number;
  disruptionDurationDays: number;
  materialATonnes: number;
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

/** Maps user-controlled what-if inputs onto an immutable scenario snapshot. */
export function buildScenario(
  base: ProductionScenario,
  what: WhatIfState,
): ProductionScenario {
  return {
    ...base,
    scenarioId: `${base.scenarioId}-WHATIF`,
    materials: base.materials.map((material) =>
      material.id === "MAT-A"
        ? { ...material, availableTonnes: what.materialATonnes }
        : material,
    ),
    orders: base.orders.map((order) =>
      order.priority === "CRITICAL"
        ? { ...order, deadlineDays: what.criticalDeadlineDays }
        : order,
    ),
    disruption: {
      ...base.disruption,
      capacityReductionFactor: what.capacityReductionPct / 100,
      durationDays: what.disruptionDurationDays,
    },
    overtimeAvailable: what.overtimeAvailable,
  };
}
