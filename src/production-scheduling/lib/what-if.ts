/**
 * Scenario what-if state — shared between the UI controls and tests.
 *
 * Extracted here so the pure mapping function `buildSchedulingScenario`
 * can be unit-tested without importing React or the full workspace component.
 */
import type { SchedulingScenario } from "@/production-scheduling/types";
import { URGENT_ORDER, AERO_ORDER } from "@/production-scheduling/data/scenario";

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
  /** When true, URGENT-201 is appended to the production queue. */
  includeUrgentOrder: boolean;
  /** When true, AERO-201 (Critical Aerospace Order) is appended to the production queue. */
  includeAerospaceOrder: boolean;
};

export const BASELINE_WHAT_IF: WhatIfState = {
  lineBCapacityReductionPct: 25,
  disruptionDurationDays: 2,
  criticalOrderDeadlineDays: 1,
  order103MaterialAvailable: true,
  overtimeAvailable: false,
  overtimeCostPerHour: 180,
  order116Priority: "NORMAL",
  includeUrgentOrder: false,
  includeAerospaceOrder: false,
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
    `uo${what.includeUrgentOrder ? "1" : "0"}`,
    `ao${what.includeAerospaceOrder ? "1" : "0"}`,
  ].join("-");

  // Build order list: add/remove URGENT-201 and AERO-201 based on flags
  const filteredBase = base.orders.filter(
    (o) => o.id !== URGENT_ORDER.id && o.id !== AERO_ORDER.id,
  );
  let baseOrders = what.includeUrgentOrder
    ? [...filteredBase, URGENT_ORDER]
    : filteredBase;
  if (what.includeAerospaceOrder) {
    baseOrders = [...baseOrders, AERO_ORDER];
  }

  return {
    ...base,
    scenarioId,
    orders: baseOrders.map((o) => {
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

// ---------------------------------------------------------------------------
// Scenario presets
// ---------------------------------------------------------------------------

export interface ScenarioPreset {
  id: string;
  label: string;
  state: WhatIfState;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "baseline",
    label: "Baseline",
    state: BASELINE_WHAT_IF,
  },
  {
    id: "urgent-order",
    label: "Accept urgent order",
    state: { ...BASELINE_WHAT_IF, includeUrgentOrder: true },
  },
  {
    id: "capacity-disruption",
    label: "Capacity disruption",
    state: { ...BASELINE_WHAT_IF, lineBCapacityReductionPct: 50, disruptionDurationDays: 3 },
  },
  {
    id: "tight-deadline",
    label: "Tight deadline",
    state: { ...BASELINE_WHAT_IF, criticalOrderDeadlineDays: 1, disruptionDurationDays: 3 },
  },
  {
    id: "material-shortage",
    label: "Material shortage",
    state: { ...BASELINE_WHAT_IF, order103MaterialAvailable: false },
  },
  {
    id: "critical-aerospace-order",
    label: "Critical Aerospace Order",
    state: { ...BASELINE_WHAT_IF, includeAerospaceOrder: true },
  },
  {
    id: "production-disruption",
    label: "Production Disruption",
    // Uses its own PDR scenario — WhatIfState is a placeholder (baseline).
    state: BASELINE_WHAT_IF,
  },
];
