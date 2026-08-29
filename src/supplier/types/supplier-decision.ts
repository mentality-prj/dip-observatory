/**
 * Supplier Decision Engine — domain types.
 *
 * These types follow the same DIP Core plugin contract pattern used by the
 * futures-mispricing plugin: request → deterministic evaluation → response
 * with full decision trace.
 *
 * This is a capability demonstration: the same decision-engine architecture
 * (rules → evidence → decision → explanation → audit trail) applied to a
 * different domain (supplier selection).
 *
 * SYNTHETIC DEMONSTRATION — not production supplier data.
 */

/** Coarse risk bucket used across the decision (mirrors DIP Core convention). */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

/** Final decision outcome for a supplier case. */
export type SupplierDecisionOutcome =
  | "APPROVE"
  | "APPROVE_WITH_CONDITIONS"
  | "REJECT";

/**
 * A single rule definition.
 * Rules are explicit and deterministic — their evaluation is traceable.
 */
export interface SupplierRule {
  /** Unique rule identifier, e.g. "RULE-01". */
  id: string;
  /** Human-readable name. */
  name: string;
  /** What the rule checks. */
  description: string;
  /** True = passing is required to avoid REJECT; false = advisory. */
  blocking: boolean;
}

/**
 * A single evaluated rule with condition evidence.
 * Maps 1:1 to the DecisionTrace evidence pattern from futures-mispricing.
 */
export interface RuleEvaluationResult {
  rule: SupplierRule;
  /** Whether the rule passed. */
  passed: boolean;
  /** Human-readable evidence explaining why the rule passed or failed. */
  evidence: string;
  /** The feature value(s) that drove the evaluation. */
  featureValues: Record<string, number | string>;
}

/**
 * Input features for a supplier candidate.
 * All values are explicit structured inputs — no derived analytics.
 */
export interface SupplierFeatures {
  /** Supplier name. */
  name: string;
  /** Supply category. */
  category: string;
  /** Estimated annual contract value in EUR. */
  contractValueEur: number;
  /** On-time delivery rate [0, 1]. */
  deliveryPerformance: number;
  /** Quality pass rate [0, 1]. */
  qualityScore: number;
  /** Financial risk bucket. */
  financialRisk: RiskLevel;
  /** Dependency level [0, 1]: 1 = sole source. */
  dependency: number;
  /** Lead time in calendar days. */
  leadTimeDays: number;
  /** Compliance status. */
  compliant: boolean;
  /** Number of material incidents in the last 12 months. */
  incidentsLast12Months: number;
}

/**
 * Evaluation of a single supplier candidate.
 * Analogous to StrategyEvaluation in the EIDOS plugin — one entry per
 * alternative, ranked by overall decision score.
 */
export interface SupplierEvaluation {
  supplier: SupplierFeatures;
  ruleResults: RuleEvaluationResult[];
  /** Number of blocking rules that failed. */
  blockingFailures: number;
  /** Composite decision score [0, 1] — higher is better. */
  overallScore: number;
  /** Derived risk level. */
  riskLevel: RiskLevel;
  /** Rank within the evaluated set (1 = recommended). */
  rank: number;
}

/**
 * A single factor explaining the recommended decision.
 * Mirrors DecisionFactor from the EIDOS plugin.
 */
export interface SupplierDecisionFactor {
  label: string;
  /** Positive = supportive, negative = concern. */
  direction: "positive" | "negative";
  evidence: string;
}

/**
 * Full deterministic decision trace — every intermediate step captured for
 * auditability. Mirrors DecisionTrace from futures-mispricing.
 */
export interface SupplierDecisionTrace {
  input: {
    caseId: string;
    decisionDate: string;
    engineVersion: string;
    rulesVersion: string;
    candidateCount: number;
  };
  evaluations: SupplierEvaluation[];
  recommendedSupplier: SupplierFeatures;
  decision: SupplierDecisionOutcome;
  factors: SupplierDecisionFactor[];
  conditions: string[];
}

/**
 * Audit trail entry — reproduced deterministically from the trace.
 */
export interface SupplierAuditEntry {
  decisionId: string;
  caseId: string;
  timestamp: string;
  engineVersion: string;
  rulesVersion: string;
  rulesExecuted: string[];
  featuresUsed: string[];
  candidateCount: number;
  recommendedSupplier: string;
  decision: SupplierDecisionOutcome;
  source: string;
}

/**
 * Request contract for the supplier decision plugin.
 * Contains only pre-decision information.
 */
export interface SupplierDecisionRequest {
  caseId: string;
  decisionDate: string;
  candidates: SupplierFeatures[];
  configuration?: Partial<SupplierDecisionConfig>;
}

/** Configuration for the supplier decision engine. */
export interface SupplierDecisionConfig {
  /** Minimum delivery performance to avoid a blocking rule failure. */
  minDeliveryPerformance: number;
  /** Minimum quality score to avoid a blocking rule failure. */
  minQualityScore: number;
  /** Maximum incident count before triggering a blocking rule. */
  maxIncidents: number;
  /** Optional scoring weights for composite ranking. */
  scoreWeights?: {
    delivery: number;
    quality: number;
    inverseDependency: number;
    inverseIncidents: number;
    compliance: number;
    inverseLeadTime: number;
  };
  /** Configuration schema version. */
  configVersion: "1.0";
}

/** Full response from the supplier decision plugin. */
export interface SupplierDecisionResponse {
  recommendation: SupplierEvaluation;
  pluginVersion: string;
  configurationVersion: string;
  computedAt: string;
  decisionTrace: SupplierDecisionTrace;
  auditEntry: SupplierAuditEntry;
}
