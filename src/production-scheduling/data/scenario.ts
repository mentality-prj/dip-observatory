/**
 * Synthetic production scheduling scenario for the scheduling demonstrator.
 *
 * Pergola, carport and shading system manufacturer — all figures are synthetic demonstration values.
 *
 * SYNTHETIC DEMONSTRATION — not real production data.
 */

import type {
  SchedulingScenario,
  SchedulingDecisionRequest,
  SchedulingOrder,
  ProductionLine,
  SetupMatrix,
} from "@/production-scheduling/types";
import {
  runSchedulingEngine,
  DEFAULT_COST_CONFIG,
} from "@/production-scheduling/lib/engine";
import type { SchedulingDecisionResponse } from "@/production-scheduling/types";

// ---------------------------------------------------------------------------
// Production lines
// ---------------------------------------------------------------------------

export const PRODUCTION_LINES: ProductionLine[] = [
  {
    id: "LINE-A",
    name: "Line A",
    normalHoursPerDay: 8,
    compatibleCategories: ["PERGOLA", "CARPORT"],
  },
  {
    id: "LINE-B",
    name: "Line B",
    normalHoursPerDay: 8,
    compatibleCategories: ["PERGOLA", "AWNING", "SCREEN"],
  },
  {
    id: "LINE-C",
    name: "Line C",
    normalHoursPerDay: 8,
    compatibleCategories: ["PERGOLA", "CARPORT", "AWNING", "SCREEN"],
  },
];

// ---------------------------------------------------------------------------
// Setup / changeover matrix (hours between categories)
// ---------------------------------------------------------------------------

export const SETUP_MATRIX: SetupMatrix = {
  PERGOLA: { PERGOLA: 0.25, CARPORT: 0.5, AWNING: 0.75, SCREEN: 0.75 },
  CARPORT: { PERGOLA: 0.5, CARPORT: 0.25, AWNING: 1.0, SCREEN: 1.0 },
  AWNING:  { PERGOLA: 0.75, CARPORT: 1.0, AWNING: 0.25, SCREEN: 0.25 },
  SCREEN:  { PERGOLA: 0.75, CARPORT: 1.0, AWNING: 0.25, SCREEN: 0.25 },
};

// ---------------------------------------------------------------------------
// 20 customer orders
//
// Array order determines processing sequence in KEEP_CURRENT_SCHEDULE.
// NORMAL-priority orders appear before the critical order on Line B to
// produce a meaningful disruption conflict in that strategy.
// ---------------------------------------------------------------------------

export const ORDERS: SchedulingOrder[] = [
  // --- Line B queue — NORMAL orders precede critical in the current plan ---
  {
    id: "ORDER-109",
    name: "#109 Pergola Standard",
    productType: "PERGOLA_BASIC",
    setupCategory: "PERGOLA",
    quantity: 4,
    durationHours: 2,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 5,
    revenueEur: 2_400,
    delayPenaltyPerDay: 250,
  },
  {
    id: "ORDER-112",
    name: "#112 Pergola Deluxe",
    productType: "PERGOLA_BASIC",
    setupCategory: "PERGOLA",
    quantity: 5,
    durationHours: 2.5,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 6,
    revenueEur: 2_600,
    delayPenaltyPerDay: 220,
  },
  {
    id: "ORDER-103",
    name: "#103 Motorised Awning",
    productType: "AWNING_MOTORISED",
    setupCategory: "AWNING",
    quantity: 8,
    durationHours: 3,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 2,
    revenueEur: 3_200,
    delayPenaltyPerDay: 800,
  },
  {
    id: "ORDER-104",
    name: "#104 Pergola Basic",
    productType: "PERGOLA_BASIC",
    setupCategory: "PERGOLA",
    quantity: 4,
    durationHours: 2,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 3,
    revenueEur: 2_800,
    delayPenaltyPerDay: 600,
  },
  // *** CRITICAL order buried in Line B queue — delayed by KEEP_CURRENT ***
  {
    id: "ORDER-101",
    name: "#101 Premium Pergola (Critical)",
    productType: "PERGOLA_PREMIUM",
    setupCategory: "PERGOLA",
    quantity: 6,
    durationHours: 4,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "CRITICAL",
    deadlineDays: 1,
    revenueEur: 8_500,
    delayPenaltyPerDay: 2_000,
  },
  {
    id: "ORDER-107",
    name: "#107 Vertical Screen",
    productType: "WALL_SCREEN",
    setupCategory: "SCREEN",
    quantity: 10,
    durationHours: 2.5,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 4,
    revenueEur: 1_800,
    delayPenaltyPerDay: 400,
  },
  {
    id: "ORDER-114",
    name: "#114 Motorised Awning XL",
    productType: "AWNING_MOTORISED",
    setupCategory: "AWNING",
    quantity: 6,
    durationHours: 3,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 6,
    revenueEur: 3_000,
    delayPenaltyPerDay: 250,
  },
  {
    id: "ORDER-118",
    name: "#118 Standard Awning",
    productType: "AWNING_STANDARD",
    setupCategory: "AWNING",
    quantity: 5,
    durationHours: 2,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-B",
    materialStatus: "AVAILABLE",
    priority: "LOW",
    deadlineDays: 8,
    revenueEur: 1_500,
    delayPenaltyPerDay: 100,
  },
  // --- Line A orders ---
  {
    id: "ORDER-102",
    name: "#102 Double Carport (Critical)",
    productType: "CARPORT_DOUBLE",
    setupCategory: "CARPORT",
    quantity: 3,
    durationHours: 5,
    compatibleLines: ["LINE-A", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "CRITICAL",
    deadlineDays: 2,
    revenueEur: 6_000,
    delayPenaltyPerDay: 1_500,
  },
  {
    id: "ORDER-105",
    name: "#105 Single Carport",
    productType: "CARPORT_SINGLE",
    setupCategory: "CARPORT",
    quantity: 5,
    durationHours: 4,
    compatibleLines: ["LINE-A", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 3,
    revenueEur: 3_500,
    delayPenaltyPerDay: 700,
  },
  {
    id: "ORDER-108",
    name: "#108 Premium Pergola",
    productType: "PERGOLA_PREMIUM",
    setupCategory: "PERGOLA",
    quantity: 5,
    durationHours: 3,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 4,
    revenueEur: 4_000,
    delayPenaltyPerDay: 300,
  },
  {
    id: "ORDER-113",
    name: "#113 Double Carport XL",
    productType: "CARPORT_DOUBLE",
    setupCategory: "CARPORT",
    quantity: 4,
    durationHours: 4,
    compatibleLines: ["LINE-A", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 6,
    revenueEur: 4_200,
    delayPenaltyPerDay: 320,
  },
  {
    id: "ORDER-117",
    name: "#117 Single Carport Plus",
    productType: "CARPORT_SINGLE",
    setupCategory: "CARPORT",
    quantity: 4,
    durationHours: 3.5,
    compatibleLines: ["LINE-A", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 8,
    revenueEur: 3_100,
    delayPenaltyPerDay: 200,
  },
  {
    id: "ORDER-119",
    name: "#119 Pergola Entry",
    productType: "PERGOLA_BASIC",
    setupCategory: "PERGOLA",
    quantity: 3,
    durationHours: 2,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-A",
    materialStatus: "AVAILABLE",
    priority: "LOW",
    deadlineDays: 9,
    revenueEur: 2_000,
    delayPenaltyPerDay: 80,
  },
  // --- Line C orders ---
  {
    id: "ORDER-106",
    name: "#106 Retractable Awning",
    productType: "AWNING_STANDARD",
    setupCategory: "AWNING",
    quantity: 6,
    durationHours: 2,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "HIGH",
    deadlineDays: 4,
    revenueEur: 2_200,
    delayPenaltyPerDay: 500,
  },
  {
    id: "ORDER-110",
    name: "#110 Single Carport Eco",
    productType: "CARPORT_SINGLE",
    setupCategory: "CARPORT",
    quantity: 4,
    durationHours: 3,
    compatibleLines: ["LINE-A", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 5,
    revenueEur: 2_800,
    delayPenaltyPerDay: 280,
  },
  {
    id: "ORDER-111",
    name: "#111 Fabric Awning",
    productType: "AWNING_STANDARD",
    setupCategory: "AWNING",
    quantity: 5,
    durationHours: 2,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 5,
    revenueEur: 1_900,
    delayPenaltyPerDay: 200,
  },
  {
    id: "ORDER-115",
    name: "#115 Terrace Screen",
    productType: "WALL_SCREEN",
    setupCategory: "SCREEN",
    quantity: 8,
    durationHours: 2,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 7,
    revenueEur: 1_600,
    delayPenaltyPerDay: 180,
  },
  {
    id: "ORDER-116",
    name: "#116 Premium Pergola L",
    productType: "PERGOLA_PREMIUM",
    setupCategory: "PERGOLA",
    quantity: 4,
    durationHours: 4,
    compatibleLines: ["LINE-A", "LINE-B", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "NORMAL",
    deadlineDays: 7,
    revenueEur: 4_500,
    delayPenaltyPerDay: 280,
  },
  {
    id: "ORDER-120",
    name: "#120 Compact Screen",
    productType: "WALL_SCREEN",
    setupCategory: "SCREEN",
    quantity: 6,
    durationHours: 1.5,
    compatibleLines: ["LINE-B", "LINE-C"],
    defaultLineId: "LINE-C",
    materialStatus: "AVAILABLE",
    priority: "LOW",
    deadlineDays: 10,
    revenueEur: 1_200,
    delayPenaltyPerDay: 60,
  },
];

// ---------------------------------------------------------------------------
// Baseline scenario
// ---------------------------------------------------------------------------

export const DEFAULT_SCENARIO: SchedulingScenario = {
  scenarioId: "PS-DEMO-001",
  lines: PRODUCTION_LINES,
  orders: ORDERS,
  disruption: {
    affectedLineId: "LINE-B",
    capacityReductionFactor: 0.25,
    durationDays: 2,
    reason: "Maintenance — aluminium extrusion alignment",
  },
  setupMatrix: SETUP_MATRIX,
  planningHorizonDays: 5,
  overtimeAvailable: false,
  overtimeHoursPerLinePerDay: 2,
};

export const DEFAULT_REQUEST: SchedulingDecisionRequest = {
  scenario: DEFAULT_SCENARIO,
  costConfig: DEFAULT_COST_CONFIG,
};

// ---------------------------------------------------------------------------
// Cached demo decision (computed once)
// ---------------------------------------------------------------------------

let _cachedDecision: SchedulingDecisionResponse | null = null;

export function getDemoDecision(): SchedulingDecisionResponse {
  if (!_cachedDecision) {
    _cachedDecision = runSchedulingEngine(DEFAULT_REQUEST);
  }
  return _cachedDecision;
}

// ---------------------------------------------------------------------------
// Critical Aerospace Order (WHAT-IF simulation)
//
// AERO-201: a high-priority customer order arriving while production capacity
// is constrained.
//
// Uses a CARPORT setup category — compatible with LINE-A and LINE-C.
// The 3-day deadline and high delay penalty put meaningful pressure on the
// existing schedule without crowding out the LINE-B disruption story.
//
// SYNTHETIC DEMONSTRATION — not Astronika production data.
// All values are synthetic and chosen to create meaningful trade-offs.
// ---------------------------------------------------------------------------

export const AERO_ORDER: SchedulingOrder = {
  id: "AERO-201",
  name: "AERO-201 Critical Aerospace Component",
  productType: "CARPORT_SINGLE",
  setupCategory: "CARPORT",
  quantity: 4,
  durationHours: 3.5,
  compatibleLines: ["LINE-A", "LINE-C"],
  defaultLineId: "LINE-A",
  materialStatus: "AVAILABLE",
  priority: "CRITICAL",
  deadlineDays: 3,
  revenueEur: 5_500,
  delayPenaltyPerDay: 1_200,
};

/**
 * Return a new scenario that appends AERO-201 to the order queue.
 * Never mutates the base scenario.
 *
 * If AERO-201 is already present, returns a scenario with the `-AERO` suffix
 * in the scenarioId (idempotent with respect to orders and scenarioId form).
 */
export function buildAerospaceOrderScenario(
  base: SchedulingScenario,
): SchedulingScenario {
  const scenarioId = base.scenarioId.endsWith("-AERO")
    ? base.scenarioId
    : `${base.scenarioId}-AERO`;
  if (base.orders.some((o) => o.id === AERO_ORDER.id)) {
    return base.scenarioId === scenarioId ? base : { ...base, scenarioId };
  }
  return {
    ...base,
    scenarioId,
    orders: [...base.orders, AERO_ORDER],
  };
}

// ---------------------------------------------------------------------------
// Urgent order (WHAT-IF simulation)
//
// URGENT-201: a rush motorised awning received mid-schedule.
// Compatible with LINE-B and LINE-C only.
// CRITICAL priority, day-2 deadline — creates meaningful pressure on the
// disrupted LINE-B. KEEP_CURRENT cannot handle both URGENT-201 and ORDER-101
// on time; REDISTRIBUTE absorbs it without changing the optimal strategy.
//
// SYNTHETIC DEMONSTRATION — not real production data.
// ---------------------------------------------------------------------------

export const URGENT_ORDER: SchedulingOrder = {
  id: "URGENT-201",
  name: "#201 Rush Motorised Awning (Urgent)",
  productType: "AWNING_MOTORISED",
  setupCategory: "AWNING",
  quantity: 6,
  durationHours: 3,
  compatibleLines: ["LINE-B", "LINE-C"],
  defaultLineId: "LINE-B",
  materialStatus: "AVAILABLE",
  priority: "CRITICAL",
  deadlineDays: 2,
  revenueEur: 7_200,
  delayPenaltyPerDay: 1_800,
};

/**
 * Return a new scenario that appends URGENT-201 to the order queue.
 * Never mutates the base scenario.
 */
export function buildUrgentOrderScenario(
  base: SchedulingScenario,
): SchedulingScenario {
  if (base.orders.some((o) => o.id === URGENT_ORDER.id)) return base;
  return {
    ...base,
    scenarioId: `${base.scenarioId}-URGENT`,
    orders: [...base.orders, URGENT_ORDER],
  };
}

// ---------------------------------------------------------------------------
// Initial scenario accessor
//
// Returns the genuine baseline scenario that must be active on page load —
// before the user clicks "Simulate Urgent Order".
// URGENT-201 must NOT be present.
// ---------------------------------------------------------------------------

/**
 * Return the baseline production scenario that the page starts from.
 * Guaranteed not to contain URGENT-201 as an active order.
 * Returns a deep copy to prevent external mutation of the shared constant.
 */
export function getInitialProductionScenario(): SchedulingScenario {
  const scenario = structuredClone(DEFAULT_SCENARIO);
  scenario.orders = scenario.orders.filter((o) => o.id !== URGENT_ORDER.id);
  return scenario;
}
