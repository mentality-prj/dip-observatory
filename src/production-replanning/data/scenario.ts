/**
 * Synthetic scenario data for the Production Replanning demonstrator.
 *
 * BTS & SAKER inspired context — NOT their actual production data.
 * All figures are synthetic demonstration values.
 */

import type {
  ProductionScenario,
  ProductionDecisionRequest,
} from "@/production-replanning/types";
import {
  runProductionReplanningEngine,
  DEFAULT_COST_CONFIG,
} from "@/production-replanning/lib/engine";

// ---------------------------------------------------------------------------
// Baseline scenario
// ---------------------------------------------------------------------------

export const DEFAULT_SCENARIO: ProductionScenario = {
  scenarioId: "BTS-DEMO-001",
  lines: [
    {
      id: "LINE-A",
      name: "Line A",
      normalCapacityTpd: 80,
      availabilityFactor: 1.0,
    },
    {
      id: "LINE-B",
      name: "Line B",
      normalCapacityTpd: 55,
      availabilityFactor: 1.0,
    },
  ],
  materials: [
    {
      id: "MAT-A",
      name: "Material A",
      availableTonnes: 420,
    },
    {
      id: "MAT-B",
      name: "Material B",
      availableTonnes: 180,
    },
  ],
  orders: [
    {
      id: "ORDER-A",
      name: "Order A",
      requiredTonnes: 120,
      deadlineDays: 2,
      priority: "CRITICAL",
    },
    {
      id: "ORDER-B",
      name: "Order B",
      requiredTonnes: 90,
      deadlineDays: 7,
      priority: "HIGH",
    },
    {
      id: "ORDER-C",
      name: "Order C",
      requiredTonnes: 60,
      deadlineDays: 10,
      priority: "NORMAL",
    },
  ],
  disruption: {
    affectedLineId: "LINE-A",
    capacityReductionFactor: 0.3,
    durationDays: 3,
  },
  overtimeAvailable: true,
};

export const DEFAULT_REQUEST: ProductionDecisionRequest = {
  scenario: DEFAULT_SCENARIO,
  costConfig: DEFAULT_COST_CONFIG,
};

// ---------------------------------------------------------------------------
// Cached decision (memo pattern matching supplier-decision)
// ---------------------------------------------------------------------------

let _cachedDecision: ReturnType<typeof runProductionReplanningEngine> | null = null;
let _cachedScenarioId: string | null = null;

export function getDemoDecision() {
  if (
    _cachedDecision &&
    _cachedScenarioId === DEFAULT_SCENARIO.scenarioId
  ) {
    return _cachedDecision;
  }
  _cachedDecision = runProductionReplanningEngine(DEFAULT_REQUEST);
  _cachedScenarioId = DEFAULT_SCENARIO.scenarioId;
  return _cachedDecision;
}

export { DEFAULT_COST_CONFIG };
