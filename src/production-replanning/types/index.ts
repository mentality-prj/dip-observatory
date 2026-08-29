/**
 * Production Replanning Decision Engine — domain types.
 *
 * Deterministic, pure, stateless. Same input + config + engine version
 * → identical decision, scores, financial impact, and audit trace.
 *
 * SYNTHETIC DEMONSTRATION — not BTS & SAKER production data.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type ActionId =
  | "KEEP_CURRENT_PLAN"
  | "PRIORITIZE_CRITICAL_ORDER"
  | "REDISTRIBUTE_PRODUCTION"
  | "DELAY_LOW_PRIORITY_ORDER";

export type OrderPriority = "CRITICAL" | "HIGH" | "NORMAL";

export type FeasibilityStatus = "FEASIBLE" | "INFEASIBLE";

export type DecisionStatus = "DECIDED" | "NO_FEASIBLE_ALTERNATIVE";

// ---------------------------------------------------------------------------
// Production scenario inputs
// ---------------------------------------------------------------------------

export interface ProductionLine {
  id: string;
  name: string;
  /** Normal capacity in tonnes/day. */
  normalCapacityTpd: number;
  /** Current availability factor [0, 1] (1 = full availability). */
  availabilityFactor: number;
}

export interface Material {
  id: string;
  name: string;
  /** Available stock in tonnes. */
  availableTonnes: number;
}

export interface ProductionOrder {
  id: string;
  name: string;
  /** Required production in tonnes. */
  requiredTonnes: number;
  /** Deadline in calendar days from now. */
  deadlineDays: number;
  priority: OrderPriority;
}

export interface Disruption {
  /** Which line is affected. */
  affectedLineId: string;
  /** Capacity reduction factor (e.g. 0.3 = 30% capacity lost). */
  capacityReductionFactor: number;
  /** Duration of the disruption in days. */
  durationDays: number;
}

// ---------------------------------------------------------------------------
// Scenario (complete input)
// ---------------------------------------------------------------------------

export interface ProductionScenario {
  scenarioId: string;
  lines: ProductionLine[];
  materials: Material[];
  orders: ProductionOrder[];
  disruption: Disruption;
  /** Whether overtime is available (enables OT capacity in some alternatives). */
  overtimeAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Cost configuration
// ---------------------------------------------------------------------------

export interface CostConfig {
  /** Cost per tonne-day for missed CRITICAL deadline. */
  missedCriticalDeadlineCostPerTonneDay: number;
  /** Cost per tonne-day for missed HIGH deadline. */
  missedHighDeadlineCostPerTonneDay: number;
  /** Overtime production cost per tonne above normal. */
  overtimeCostPerTonne: number;
  /** Penalty per tonne-day of production delay (NORMAL priority). */
  productionDelayCostPerTonneDay: number;
  /** Cost per t/day of unused capacity (opportunity cost). */
  unusedCapacityCostPerTpdDay: number;
  /** One-time cost for material switching / line reconfiguration. */
  materialHandlingSwitchCost: number;
  configVersion: string;
}

// ---------------------------------------------------------------------------
// Rule definitions
// ---------------------------------------------------------------------------

export interface ProductionRule {
  id: string;
  name: string;
  description: string;
  /** True = failing this rule makes the alternative INFEASIBLE. */
  blocking: boolean;
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  condition: string;
  passed: boolean;
  evidence: string;
  featureValues: Record<string, number | string | boolean>;
}

// ---------------------------------------------------------------------------
// Alternative evaluation
// ---------------------------------------------------------------------------

export interface AlternativeFinancialImpact {
  missedDeadlineCost: number;
  overtimeCost: number;
  delayCost: number;
  unusedCapacityCost: number;
  switchingCost: number;
  total: number;
}

export interface OperationalConsequences {
  criticalOrderDeadlineProtected: boolean;
  affectedOrderIds: string[];
  /** Map from orderId → expected completion day. */
  expectedCompletionDays: Record<string, number>;
  capacityUtilizationFactor: number;
  /** Total tonnes processed under this alternative. */
  totalTonnesProcessed: number;
}

export interface AlternativeScore {
  deadlineProtection: number;
  criticalOrderProtection: number;
  financialScore: number;
  capacityUtilization: number;
  materialUtilization: number;
  operationalDisruption: number;
  /** Composite weighted score [0, 1] — higher is better. */
  composite: number;
}

export interface AlternativeEvaluation {
  actionId: ActionId;
  actionLabel: string;
  feasibility: FeasibilityStatus;
  /** Blocking constraints violated (empty if FEASIBLE). */
  blockingConstraints: string[];
  ruleResults: RuleResult[];
  financialImpact: AlternativeFinancialImpact;
  operationalConsequences: OperationalConsequences;
  score: AlternativeScore;
  /** Rank among feasible alternatives (1 = best). */
  rank: number;
}

// ---------------------------------------------------------------------------
// Decision output
// ---------------------------------------------------------------------------

export interface DecisionFactor {
  label: string;
  direction: "positive" | "negative";
  evidence: string;
}

export interface DecisionExplanation {
  recommendedActionId: ActionId;
  reasons: DecisionFactor[];
  rejectedAlternatives: Array<{
    actionId: ActionId;
    reason: string;
  }>;
}

export interface AuditEntry {
  decisionId: string;
  scenarioId: string;
  computedAt: string;
  engineVersion: string;
  configVersion: string;
  rulesExecuted: string[];
  alternativesEvaluated: ActionId[];
  recommendedAction: ActionId;
  decisionStatus: DecisionStatus;
  totalFinancialImpact: number;
  avoidedCostVsBaseline: number;
  source: "SYNTHETIC_DEMONSTRATION";
}

export interface ProductionDecisionResponse {
  recommendedAction: ActionId;
  decisionStatus: DecisionStatus;
  alternatives: AlternativeEvaluation[];
  explanation: DecisionExplanation;
  decisiveFactors: DecisionFactor[];
  totalFinancialImpact: number;
  avoidedCostVsBaseline: number;
  scenarioSnapshot: ProductionScenario;
  engineVersion: string;
  configVersion: string;
  computedAt: string;
  auditTrail: AuditEntry;
}

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface ProductionDecisionRequest {
  scenario: ProductionScenario;
  costConfig?: Partial<CostConfig>;
}
