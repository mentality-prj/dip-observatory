/**
 * Supplier Decision Engine — deterministic rule-based evaluation.
 *
 * This plugin demonstrates that the same DIP Core decision-engine architecture
 * (rules → evidence → decision → explanation → audit trail) applies to a
 * completely different domain problem (supplier selection).
 *
 * Pipeline:
 *   SupplierFeatures[]
 *     → rule evaluation (explicit, traceable)
 *     → scoring (deterministic composite)
 *     → ranking
 *     → decision derivation
 *     → explanation factors
 *     → audit trail
 *
 * Everything is pure and deterministic: same input + same config + same
 * engine version → identical decision and trace.
 *
 * SYNTHETIC DEMONSTRATION — not production supplier data.
 */

import type {
  RiskLevel,
  RuleEvaluationResult,
  SupplierDecisionConfig,
  SupplierDecisionFactor,
  SupplierDecisionOutcome,
  SupplierDecisionRequest,
  SupplierDecisionResponse,
  SupplierDecisionTrace,
  SupplierEvaluation,
  SupplierFeatures,
  SupplierRule,
} from "@/supplier/types/supplier-decision";

export const SUPPLIER_PLUGIN_VERSION = "0.1.0" as const;
export const SUPPLIER_RULES_VERSION = "1.0" as const;

// ---------------------------------------------------------------------------
// Rules catalogue
// ---------------------------------------------------------------------------

export const SUPPLIER_RULES: SupplierRule[] = [
  {
    id: "RULE-01",
    name: "Minimum delivery performance",
    description: "Supplier on-time delivery rate must meet the configured threshold.",
    blocking: true,
  },
  {
    id: "RULE-02",
    name: "Minimum quality score",
    description: "Supplier quality pass rate must meet the configured threshold.",
    blocking: true,
  },
  {
    id: "RULE-03",
    name: "Compliance certification",
    description: "Supplier must hold valid compliance certification.",
    blocking: true,
  },
  {
    id: "RULE-04",
    name: "Incident threshold",
    description: "Material incidents in the last 12 months must not exceed the limit.",
    blocking: true,
  },
  {
    id: "RULE-05",
    name: "Financial risk gate",
    description: "Suppliers with HIGH financial risk require additional conditions.",
    blocking: false,
  },
  {
    id: "RULE-06",
    name: "Sole-source dependency",
    description: "Sole-source (dependency = 1.0) requires contingency planning.",
    blocking: false,
  },
];

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

export const DEFAULT_SUPPLIER_CONFIG: SupplierDecisionConfig = {
  minDeliveryPerformance: 0.85,
  minQualityScore: 0.90,
  maxIncidents: 2,
  configVersion: "1.0",
};

function mergeConfig(
  override: Partial<SupplierDecisionConfig> | undefined,
): SupplierDecisionConfig {
  return { ...DEFAULT_SUPPLIER_CONFIG, ...override };
}

// ---------------------------------------------------------------------------
// Rule evaluation
// ---------------------------------------------------------------------------

function evaluateRules(
  supplier: SupplierFeatures,
  config: SupplierDecisionConfig,
): RuleEvaluationResult[] {
  return SUPPLIER_RULES.map((rule): RuleEvaluationResult => {
    switch (rule.id) {
      case "RULE-01": {
        const passed = supplier.deliveryPerformance >= config.minDeliveryPerformance;
        return {
          rule,
          passed,
          evidence: `Delivery performance ${(supplier.deliveryPerformance * 100).toFixed(0)}% — threshold ${(config.minDeliveryPerformance * 100).toFixed(0)}%.`,
          featureValues: {
            deliveryPerformance: supplier.deliveryPerformance,
            threshold: config.minDeliveryPerformance,
          },
        };
      }
      case "RULE-02": {
        const passed = supplier.qualityScore >= config.minQualityScore;
        return {
          rule,
          passed,
          evidence: `Quality score ${(supplier.qualityScore * 100).toFixed(0)}% — threshold ${(config.minQualityScore * 100).toFixed(0)}%.`,
          featureValues: {
            qualityScore: supplier.qualityScore,
            threshold: config.minQualityScore,
          },
        };
      }
      case "RULE-03": {
        const passed = supplier.compliant;
        return {
          rule,
          passed,
          evidence: passed
            ? "Valid compliance certification confirmed."
            : "No valid compliance certification on file.",
          featureValues: { compliant: supplier.compliant ? 1 : 0 },
        };
      }
      case "RULE-04": {
        const passed = supplier.incidentsLast12Months <= config.maxIncidents;
        return {
          rule,
          passed,
          evidence: `${supplier.incidentsLast12Months} material incident(s) in last 12 months — limit ${config.maxIncidents}.`,
          featureValues: {
            incidents: supplier.incidentsLast12Months,
            limit: config.maxIncidents,
          },
        };
      }
      case "RULE-05": {
        const passed = supplier.financialRisk !== "HIGH";
        return {
          rule,
          passed,
          evidence: passed
            ? `Financial risk is ${supplier.financialRisk} — within acceptable range.`
            : "HIGH financial risk: requires escrow or bond as condition.",
          featureValues: { financialRisk: supplier.financialRisk },
        };
      }
      case "RULE-06": {
        const passed = supplier.dependency < 1.0;
        return {
          rule,
          passed,
          evidence: passed
            ? `Dependency ${(supplier.dependency * 100).toFixed(0)}% — contingency alternatives exist.`
            : "Sole-source dependency: contingency plan required.",
          featureValues: { dependency: supplier.dependency },
        };
      }
      default:
        return {
          rule,
          passed: true,
          evidence: "Rule not implemented — defaulting to pass.",
          featureValues: {},
        };
    }
  });
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Composite decision score [0, 1] — higher is better.
 * Weights are explicit structural assumptions, not fitted parameters.
 * Financial risk affects the derived RiskLevel and conditions,
 * not the score itself, to keep the two concerns separate.
 */
function computeScore(supplier: SupplierFeatures): number {
  const raw =
    0.30 * supplier.deliveryPerformance +
    0.25 * supplier.qualityScore +
    0.15 * (1 - supplier.dependency) +
    0.15 * (1 - Math.min(supplier.incidentsLast12Months / 5, 1)) +
    0.10 * (supplier.compliant ? 1 : 0) +
    0.05 * (1 - Math.min(supplier.leadTimeDays / 90, 1));

  return Math.max(0, Math.min(1, raw));
}

function deriveRisk(supplier: SupplierFeatures, blockingFailures: number): RiskLevel {
  if (blockingFailures >= 2 || supplier.financialRisk === "HIGH") return "HIGH";
  if (blockingFailures === 1 || supplier.financialRisk === "MEDIUM" || supplier.dependency >= 0.8)
    return "MEDIUM";
  return "LOW";
}

// ---------------------------------------------------------------------------
// Decision derivation
// ---------------------------------------------------------------------------

function deriveDecision(
  evaluation: SupplierEvaluation,
): SupplierDecisionOutcome {
  if (evaluation.blockingFailures > 0) return "REJECT";
  const hasConditions =
    evaluation.ruleResults.some((r) => !r.passed) ||
    evaluation.riskLevel === "MEDIUM";
  return hasConditions ? "APPROVE_WITH_CONDITIONS" : "APPROVE";
}

function buildFactors(
  evaluation: SupplierEvaluation,
): SupplierDecisionFactor[] {
  const factors: SupplierDecisionFactor[] = [];
  const s = evaluation.supplier;

  if (s.deliveryPerformance >= 0.95)
    factors.push({ label: "Delivery performance", direction: "positive", evidence: `${(s.deliveryPerformance * 100).toFixed(0)}% on-time delivery` });
  else if (s.deliveryPerformance < 0.85)
    factors.push({ label: "Delivery performance", direction: "negative", evidence: `${(s.deliveryPerformance * 100).toFixed(0)}% below threshold` });

  if (s.qualityScore >= 0.95)
    factors.push({ label: "Quality score", direction: "positive", evidence: `${(s.qualityScore * 100).toFixed(0)}% quality pass rate` });
  else if (s.qualityScore < 0.90)
    factors.push({ label: "Quality score", direction: "negative", evidence: `${(s.qualityScore * 100).toFixed(0)}% below threshold` });

  if (s.incidentsLast12Months === 0)
    factors.push({ label: "Incident history", direction: "positive", evidence: "Zero incidents in last 12 months" });
  else if (s.incidentsLast12Months > 2)
    factors.push({ label: "Incident history", direction: "negative", evidence: `${s.incidentsLast12Months} incidents in last 12 months` });

  if (s.dependency >= 0.8)
    factors.push({ label: "Supplier dependency", direction: "negative", evidence: `${(s.dependency * 100).toFixed(0)}% dependency — contingency required` });

  if (s.financialRisk === "HIGH")
    factors.push({ label: "Financial risk", direction: "negative", evidence: "HIGH financial risk — bond required" });
  else if (s.financialRisk === "LOW")
    factors.push({ label: "Financial risk", direction: "positive", evidence: "LOW financial risk" });

  if (s.compliant)
    factors.push({ label: "Compliance", direction: "positive", evidence: "Valid certification" });
  else
    factors.push({ label: "Compliance", direction: "negative", evidence: "No valid certification" });

  return factors;
}

function buildConditions(evaluation: SupplierEvaluation): string[] {
  const conditions: string[] = [];
  const s = evaluation.supplier;

  if (s.financialRisk === "HIGH")
    conditions.push("Financial bond or escrow required before contract execution.");
  if (s.dependency >= 0.8)
    conditions.push("Documented contingency supplier plan required.");
  if (s.financialRisk === "MEDIUM")
    conditions.push("Quarterly financial review during contract period.");
  if (s.incidentsLast12Months === 2)
    conditions.push("Performance improvement plan with 90-day review.");

  return conditions;
}

// ---------------------------------------------------------------------------
// Main plugin entry point
// ---------------------------------------------------------------------------

/**
 * Run the supplier decision plugin.
 *
 * @param request  Pre-decision request containing candidate supplier data.
 * @returns        Full response with recommendation, trace, and audit entry.
 */
export function runSupplierDecisionPlugin(
  request: SupplierDecisionRequest,
): SupplierDecisionResponse {
  const config = mergeConfig(request.configuration);
  const { caseId, decisionDate, candidates } = request;

  if (candidates.length === 0) {
    throw new Error("SupplierDecisionPlugin: no candidates provided");
  }

  // 1. Evaluate all candidates.
  const evaluations: SupplierEvaluation[] = candidates.map((supplier) => {
    const ruleResults = evaluateRules(supplier, config);
    const blockingFailures = ruleResults.filter(
      (r) => r.rule.blocking && !r.passed,
    ).length;
    const overallScore = computeScore(supplier);
    const riskLevel = deriveRisk(supplier, blockingFailures);
    return {
      supplier,
      ruleResults,
      blockingFailures,
      overallScore,
      riskLevel,
      rank: 0, // assigned after sort
    };
  });

  // 2. Rank by: fewest blocking failures first, then highest score.
  const sorted = [...evaluations].sort((a, b) => {
    if (a.blockingFailures !== b.blockingFailures)
      return a.blockingFailures - b.blockingFailures;
    return b.overallScore - a.overallScore;
  });
  sorted.forEach((e, i) => {
    e.rank = i + 1;
  });

  const recommendation = sorted[0];
  const decision = deriveDecision(recommendation);
  const factors = buildFactors(recommendation);
  const conditions = buildConditions(recommendation);

  // 3. Decision trace — mirrors DecisionTrace from futures-mispricing.
  const trace: SupplierDecisionTrace = {
    input: {
      caseId,
      decisionDate,
      engineVersion: SUPPLIER_PLUGIN_VERSION,
      rulesVersion: SUPPLIER_RULES_VERSION,
      candidateCount: candidates.length,
    },
    evaluations: sorted,
    recommendedSupplier: recommendation.supplier,
    decision,
    factors,
    conditions,
  };

  // 4. Audit entry — deterministic from trace.
  const auditEntry = {
    decisionId: `${caseId}-${decisionDate}`,
    caseId,
    timestamp: decisionDate + "T00:00:00Z",
    engineVersion: SUPPLIER_PLUGIN_VERSION,
    rulesVersion: SUPPLIER_RULES_VERSION,
    rulesExecuted: SUPPLIER_RULES.map((r) => r.id),
    featuresUsed: [
      "deliveryPerformance",
      "qualityScore",
      "financialRisk",
      "dependency",
      "leadTimeDays",
      "compliant",
      "incidentsLast12Months",
    ],
    candidateCount: candidates.length,
    recommendedSupplier: recommendation.supplier.name,
    decision,
    source: "SupplierDecisionPlugin/automated",
  };

  return {
    recommendation,
    pluginVersion: SUPPLIER_PLUGIN_VERSION,
    configurationVersion: config.configVersion,
    computedAt: decisionDate + "T00:00:00Z",
    decisionTrace: trace,
    auditEntry,
  };
}
