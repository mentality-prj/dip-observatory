/**
 * Production Disruption Decision Scenario — synthetic data.
 *
 * 12 active orders across 3 production lines. Machine B (LINE-B)
 * experiences an equipment failure and becomes unavailable.
 * The scenario exercises recovery options: move production, use overtime,
 * resequence, or accept delays.
 *
 * Internal ID: PRODUCTION_DISRUPTION
 *
 * SYNTHETIC DEMONSTRATION — not production data.
 * No real company, customer, machine or production process is referenced.
 */

import type {
  SchedulingScenario,
  SchedulingOrder,
  ProductionLine,
  SetupMatrix,
} from "@/production-scheduling/types";
import {
  runSchedulingEngine,
  DEFAULT_COST_CONFIG,
} from "@/production-scheduling/lib/engine";
import type {
  SchedulingDecisionResponse,
  CostConfig,
} from "@/production-scheduling/types";

// ---------------------------------------------------------------------------
// Production lines (same physical lines as the main scenario)
// ---------------------------------------------------------------------------

export const PDR_LINES: ProductionLine[] = [
  {
    id: "LINE-A",
    name: "Machine A",
    normalHoursPerDay: 8,
    compatibleCategories: ["PERGOLA", "CARPORT"],
  },
  {
    id: "LINE-B",
    name: "Machine B",
    normalHoursPerDay: 8,
    compatibleCategories: ["PERGOLA", "AWNING", "SCREEN"],
  },
  {
    id: "LINE-C",
    name: "Machine C",
    normalHoursPerDay: 8,
    compatibleCategories: ["PERGOLA", "CARPORT", "AWNING", "SCREEN"],
  },
];

// ---------------------------------------------------------------------------
// Setup / changeover matrix
// ---------------------------------------------------------------------------

export const PDR_SETUP_MATRIX: SetupMatrix = {
  PERGOLA: { PERGOLA: 0.25, CARPORT: 0.5,  AWNING: 0.75, SCREEN: 0.75 },
  CARPORT: { PERGOLA: 0.5,  CARPORT: 0.25, AWNING: 1.0,  SCREEN: 1.0  },
  AWNING:  { PERGOLA: 0.75, CARPORT: 1.0,  AWNING: 0.25, SCREEN: 0.25 },
  SCREEN:  { PERGOLA: 0.75, CARPORT: 1.0,  AWNING: 0.25, SCREEN: 0.25 },
};

// ---------------------------------------------------------------------------
// 12 orders
//
// Array order determines processing sequence in KEEP_CURRENT_SCHEDULE.
//
// Machine B orders (PDR-104, PDR-106, PDR-108, PDR-110) appear first in the
// array so they are processed in that order on LINE-B during KEEP_CURRENT.
//
// Baseline (no disruption):
//   LINE-B Day 1: PDR-104 (0–2h) → PDR-106 (2.75–5.75h) → PDR-108 → Day 2
//   LINE-B Day 2: PDR-108 (0–2.5h) → PDR-110 (2.75–4.75h) — all on time
//
// With disruption (Machine B unavailable Day 1, factor=1.0):
//   KEEP_CURRENT pushes all LINE-B orders to Day 2:
//     PDR-104 (CRITICAL, day-1 deadline) → 1 day late
//     PDR-108 (HIGH, day-2 deadline)     → 1 day late (Day 3)
//     PDR-110 (HIGH, day-2 deadline)     → 1 day late (Day 3)
//   → 3 orders at risk; CRITICAL deadline violated → KEEP_CURRENT INFEASIBLE
//
// SYNTHETIC DEMONSTRATION — not production data.
// ---------------------------------------------------------------------------

export const PDR_ORDERS: SchedulingOrder[] = [
  // --- Machine B assigned orders (disrupted) ---
  {
    id: "PDR-104",
    name: "#104 Pergola Assembly (Critical)",
    productType: "PERGOLA_PREMIUM",
    setupCategory: "PERGOLA",
    quantity: 3,
    durationHours: 2,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "CRITICAL",
    deadlineDays: 1,
    revenueEur: 5_000,
    delayPenaltyPerDay: 2_000,
  },
  {
    id: "PDR-106",
    name: "#106 Motorised Awning Set",
    productType: "AWNING_MOTORISED",
    setupCategory: "AWNING",
    quantity: 5,
    durationHours: 3,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 2,
    revenueEur: 3_500,
    delayPenaltyPerDay: 800,
  },
  {
    id: "PDR-108",
    name: "#108 Standard Awning Batch",
    productType: "AWNING_STANDARD",
    setupCategory: "AWNING",
    quantity: 4,
    durationHours: 2.5,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 2,
    revenueEur: 2_800,
    delayPenaltyPerDay: 600,
  },
  {
    id: "PDR-110",
    name: "#110 Vertical Screen Panel",
    productType: "WALL_SCREEN",
    setupCategory: "SCREEN",
    quantity: 6,
    durationHours: 2,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 2,
    revenueEur: 2_000,
    delayPenaltyPerDay: 500,
  },
  // --- Machine A assigned orders ---
  {
    id: "PDR-101",
    name: "#101 Double Carport Frame (Critical)",
    productType: "CARPORT_DOUBLE",
    setupCategory: "CARPORT",
    quantity: 2,
    durationHours: 4,
    compatibleLines: ["LINE-A", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "CRITICAL",
    deadlineDays: 2,
    revenueEur: 6_000,
    delayPenaltyPerDay: 1_500,
  },
  {
    id: "PDR-103",
    name: "#103 Single Carport",
    productType: "CARPORT_SINGLE",
    setupCategory: "CARPORT",
    quantity: 3,
    durationHours: 3.5,
    compatibleLines: ["LINE-A", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 3,
    revenueEur: 3_500,
    delayPenaltyPerDay: 700,
  },
  {
    id: "PDR-105",
    name: "#105 Premium Pergola",
    productType: "PERGOLA_PREMIUM",
    setupCategory: "PERGOLA",
    quantity: 4,
    durationHours: 3,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 5,
    revenueEur: 4_000,
    delayPenaltyPerDay: 300,
  },
  {
    id: "PDR-111",
    name: "#111 Pergola Entry",
    productType: "PERGOLA_BASIC",
    setupCategory: "PERGOLA",
    quantity: 3,
    durationHours: 2,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 6,
    revenueEur: 2_500,
    delayPenaltyPerDay: 200,
  },
  // --- Machine C assigned orders ---
  {
    id: "PDR-102",
    name: "#102 Standard Awning",
    productType: "AWNING_STANDARD",
    setupCategory: "AWNING",
    quantity: 4,
    durationHours: 2,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 3,
    revenueEur: 2_200,
    delayPenaltyPerDay: 500,
  },
  {
    id: "PDR-107",
    name: "#107 Carport Eco",
    productType: "CARPORT_SINGLE",
    setupCategory: "CARPORT",
    quantity: 3,
    durationHours: 3,
    compatibleLines: ["LINE-A", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 3,
    revenueEur: 3_200,
    delayPenaltyPerDay: 700,
  },
  {
    id: "PDR-109",
    name: "#109 Terrace Screen",
    productType: "WALL_SCREEN",
    setupCategory: "SCREEN",
    quantity: 5,
    durationHours: 1.5,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 5,
    revenueEur: 1_600,
    delayPenaltyPerDay: 200,
  },
  {
    id: "PDR-112",
    name: "#112 Compact Screen",
    productType: "WALL_SCREEN",
    setupCategory: "SCREEN",
    quantity: 4,
    durationHours: 1.5,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "LOW",
    deadlineDays: 7,
    revenueEur: 1_200,
    delayPenaltyPerDay: 80,
  },
];

// ---------------------------------------------------------------------------
// IDs of orders that are on Machine B (affected by disruption)
// ---------------------------------------------------------------------------

export const PDR_MACHINE_B_ORDER_IDS = ["PDR-104", "PDR-106", "PDR-108", "PDR-110"] as const;

// ---------------------------------------------------------------------------
// Disruption what-if state
// ---------------------------------------------------------------------------

export interface DisruptionWhatIfState {
  /** Whether Machine B is available. When false, disruption is active. */
  machineBAvailable: boolean;
  /** Disruption duration in hours (mapped to engine capacityReductionFactor / durationDays). */
  disruptionHours: 4 | 8 | 12 | 16;
  /** Overtime available for all lines. */
  overtimeAvailable: boolean;
  /** Overtime cost per hour (€/h). */
  overtimeCostPerHour: number;
  /** PDR-104 deadline adjustment in days (1–3). */
  criticalDeadlineDays: number;
  /** Machine C available capacity (normal hours per day). */
  lineCCapacityHours: 4 | 6 | 8 | 10;
}

export const BASELINE_DISRUPTION_WHAT_IF: DisruptionWhatIfState = {
  machineBAvailable: false,        // disruption active
  disruptionHours: 8,
  overtimeAvailable: false,
  overtimeCostPerHour: 180,
  criticalDeadlineDays: 1,
  lineCCapacityHours: 8,
};

// ---------------------------------------------------------------------------
// Map disruption hours to engine params
// ---------------------------------------------------------------------------

/**
 * Convert disruption hours to (capacityReductionFactor, durationDays).
 * Machine B is modelled as fully unavailable (factor=1.0) for N complete days,
 * or partially reduced on Day 1 for sub-day disruptions.
 *
 * 4h  → factor=0.5, days=1  (half Day 1 lost)
 * 8h  → factor=1.0, days=1  (full Day 1 lost — Machine B offline)
 * 12h → factor=1.0, days=2  (Days 1–2 fully offline)
 * 16h → factor=1.0, days=3  (Days 1–3 fully offline)
 */
export function disruptionHoursToParams(hours: 4 | 8 | 12 | 16): {
  capacityReductionFactor: number;
  durationDays: number;
} {
  if (hours <= 4) return { capacityReductionFactor: 0.5, durationDays: 1 };
  if (hours <= 8) return { capacityReductionFactor: 1.0, durationDays: 1 };
  if (hours <= 12) return { capacityReductionFactor: 1.0, durationDays: 2 };
  return { capacityReductionFactor: 1.0, durationDays: 3 };
}

// ---------------------------------------------------------------------------
// Pre-disruption baseline scenario (Machine B fully operational)
// ---------------------------------------------------------------------------

export const PDR_PRE_DISRUPTION_SCENARIO: SchedulingScenario = {
  scenarioId: "PDR-BASELINE",
  lines: PDR_LINES,
  orders: PDR_ORDERS,
  disruption: {
    affectedLineId: "LINE-B",
    capacityReductionFactor: 0,
    durationDays: 0,
    reason: "No disruption — normal operations",
  },
  setupMatrix: PDR_SETUP_MATRIX,
  planningHorizonDays: 5,
  overtimeAvailable: false,
  overtimeHoursPerLinePerDay: 2,
};

// ---------------------------------------------------------------------------
// Default disrupted scenario (Machine B unavailable 8h = Day 1 fully offline)
// ---------------------------------------------------------------------------

export const PDR_DISRUPTED_SCENARIO: SchedulingScenario = {
  scenarioId: "PDR-DISRUPTED",
  lines: PDR_LINES,
  orders: PDR_ORDERS,
  disruption: {
    affectedLineId: "LINE-B",
    capacityReductionFactor: 1.0,
    durationDays: 1,
    reason: "Machine B unavailable — equipment failure",
  },
  setupMatrix: PDR_SETUP_MATRIX,
  planningHorizonDays: 5,
  overtimeAvailable: false,
  overtimeHoursPerLinePerDay: 2,
};

// ---------------------------------------------------------------------------
// Scenario builder from DisruptionWhatIfState
// ---------------------------------------------------------------------------

/**
 * Build the disrupted SchedulingScenario from a DisruptionWhatIfState.
 * Returns the scenario and the effective cost config override.
 */
export function buildPdrScenario(what: DisruptionWhatIfState): {
  scenario: SchedulingScenario;
  costConfigOverride: Partial<CostConfig>;
} {
  const { capacityReductionFactor, durationDays } = disruptionHoursToParams(
    what.disruptionHours,
  );

  // Optionally adjust LINE-C capacity
  const lines = PDR_LINES.map((l) =>
    l.id === "LINE-C"
      ? { ...l, normalHoursPerDay: what.lineCCapacityHours }
      : l,
  );

  const scenarioId = [
    "PDR",
    `avail${what.machineBAvailable ? "1" : "0"}`,
    `h${what.disruptionHours}`,
    `ot${what.overtimeAvailable ? "1" : "0"}`,
    `otc${what.overtimeCostPerHour}`,
    `crit${what.criticalDeadlineDays}`,
    `lc${what.lineCCapacityHours}`,
  ].join("-");

  const scenario: SchedulingScenario = {
    scenarioId,
    lines,
    orders: PDR_ORDERS.map((o) =>
      o.id === "PDR-104"
        ? { ...o, deadlineDays: what.criticalDeadlineDays }
        : o,
    ),
    disruption: {
      affectedLineId: "LINE-B",
      capacityReductionFactor: what.machineBAvailable ? 0 : capacityReductionFactor,
      durationDays: what.machineBAvailable ? 0 : durationDays,
      reason: what.machineBAvailable
        ? "Machine B operational"
        : "Machine B unavailable — equipment failure",
    },
    setupMatrix: PDR_SETUP_MATRIX,
    planningHorizonDays: 5,
    overtimeAvailable: what.overtimeAvailable,
    overtimeHoursPerLinePerDay: 2,
  };

  return {
    scenario,
    costConfigOverride: { overtimeCostPerHour: what.overtimeCostPerHour },
  };
}

// ---------------------------------------------------------------------------
// Pre-disruption result (no disruption, all orders on time)
// ---------------------------------------------------------------------------

let _cachedPreDisruption: SchedulingDecisionResponse | null = null;

export function getPdrPreDisruptionDecision(): SchedulingDecisionResponse {
  if (!_cachedPreDisruption) {
    _cachedPreDisruption = runSchedulingEngine({
      scenario: PDR_PRE_DISRUPTION_SCENARIO,
      costConfig: DEFAULT_COST_CONFIG,
    });
  }
  return _cachedPreDisruption;
}

// ---------------------------------------------------------------------------
// Disrupted decision (Machine B unavailable, 8h default)
// ---------------------------------------------------------------------------

let _cachedDisrupted: SchedulingDecisionResponse | null = null;

export function getPdrDisruptedDecision(): SchedulingDecisionResponse {
  if (!_cachedDisrupted) {
    _cachedDisrupted = runSchedulingEngine({
      scenario: PDR_DISRUPTED_SCENARIO,
      costConfig: DEFAULT_COST_CONFIG,
    });
  }
  return _cachedDisrupted;
}

// ---------------------------------------------------------------------------
// Orders at risk (identified from the disrupted keep-current result)
// ---------------------------------------------------------------------------

/**
 * Return the list of order IDs that are delayed or not scheduled in the
 * KEEP_CURRENT_SCHEDULE strategy of the given disruption result.
 * These are the orders "at risk" from the disruption.
 */
export function getOrdersAtRisk(
  disrupted: SchedulingDecisionResponse,
): string[] {
  const keep = disrupted.strategies.find(
    (s) => s.strategyId === "KEEP_CURRENT_SCHEDULE",
  );
  if (!keep) return [];
  return keep.schedule
    .filter((t) => t.status === "DELAYED" || t.status === "NOT_SCHEDULED")
    .map((t) => t.orderId);
}

// ---------------------------------------------------------------------------
// Sensitivity thresholds for disruption duration
// ---------------------------------------------------------------------------

/**
 * Compute the recommended strategy for each disruption duration level.
 * Used for the sensitivity section: "at what point does recovery stop working?"
 */
export function computeDisruptionSensitivity(what: DisruptionWhatIfState): Array<{
  hours: 4 | 8 | 12 | 16;
  strategy: string;
  feasible: boolean;
}> {
  const durations: Array<4 | 8 | 12 | 16> = [4, 8, 12, 16];
  return durations.map((hours) => {
    const { scenario, costConfigOverride } = buildPdrScenario({
      ...what,
      disruptionHours: hours,
    });
    const result = runSchedulingEngine({
      scenario,
      costConfig: { ...DEFAULT_COST_CONFIG, ...costConfigOverride },
    });
    return {
      hours,
      strategy:
        result.decisionStatus === "NO_FEASIBLE_ALTERNATIVE"
          ? "No feasible recovery"
          : result.strategies.find(
              (s) => s.strategyId === result.recommendedStrategy,
            )?.strategyLabel ?? result.recommendedStrategy,
      feasible: result.decisionStatus === "DECIDED",
    };
  });
}
