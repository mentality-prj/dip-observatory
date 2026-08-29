/**
 * Supplier Decision Engine — synthetic demonstration dataset.
 *
 * SYNTHETIC DEMONSTRATION — not production supplier data.
 *
 * Deterministic, authored seed for the automotive component supplier
 * selection scenario. No runtime randomness.
 *
 * Scenario: select a Tier-2 automotive component supplier for a
 * €2M annual contract.
 */

import { runSupplierDecisionPlugin } from "@/supplier/lib/supplier-decision";
import type {
  SupplierDecisionRequest,
  SupplierDecisionResponse,
  SupplierFeatures,
} from "@/supplier/types/supplier-decision";

export const DEMO_CASE_ID = "CASE-2026-SUP-001";
export const DEMO_DECISION_DATE = "2026-08-29";

/**
 * Three supplier candidates with distinct risk profiles.
 * Authored so that one yields APPROVE_WITH_CONDITIONS, one REJECT,
 * and one lower-ranked APPROVE — demonstrating comparison.
 */
export const DEMO_SUPPLIERS: SupplierFeatures[] = [
  {
    name: "ACME Components GmbH",
    category: "Automotive — Tier 2 Structural",
    contractValueEur: 2_100_000,
    deliveryPerformance: 0.97, // strong delivery
    qualityScore: 0.98, // excellent quality
    financialRisk: "MEDIUM", // triggers conditions (quarterly review)
    dependency: 0.70, // moderate dependency
    leadTimeDays: 25,
    compliant: true,
    incidentsLast12Months: 0,
  },
  {
    name: "Brenner Precision Parts AG",
    category: "Automotive — Tier 2 Structural",
    contractValueEur: 1_950_000,
    deliveryPerformance: 0.88,
    qualityScore: 0.90,
    financialRisk: "LOW",
    dependency: 0.35,
    leadTimeDays: 35,
    compliant: true,
    incidentsLast12Months: 1,
  },
  {
    name: "Nova Casting Sp. z o.o.",
    category: "Automotive — Tier 2 Structural",
    contractValueEur: 1_800_000,
    deliveryPerformance: 0.81, // fails RULE-01
    qualityScore: 0.88, // fails RULE-02
    financialRisk: "HIGH",
    dependency: 0.20,
    leadTimeDays: 42,
    compliant: false, // fails RULE-03
    incidentsLast12Months: 4, // fails RULE-04
  },
];

export const DEMO_REQUEST: SupplierDecisionRequest = {
  caseId: DEMO_CASE_ID,
  decisionDate: DEMO_DECISION_DATE,
  candidates: DEMO_SUPPLIERS,
};

/**
 * The deterministic demo response.
 * Called once and cached — identical on every call.
 */
let _cached: SupplierDecisionResponse | null = null;

export function getDemoDecision(): SupplierDecisionResponse {
  if (!_cached) {
    _cached = runSupplierDecisionPlugin(DEMO_REQUEST);
  }
  return _cached;
}
