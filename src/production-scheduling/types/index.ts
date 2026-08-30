/**
 * Production Scheduling Decision Engine — domain types.
 *
 * Deterministic, pure, stateless. Same input + config + engine version
 * → identical decision, scores, financial impact, and audit trace.
 *
 * SYNTHETIC DEMONSTRATION — not SURMA SYSTEMS production data.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type ProductType =
  | "PERGOLA_BASIC"
  | "PERGOLA_PREMIUM"
  | "CARPORT_SINGLE"
  | "CARPORT_DOUBLE"
  | "AWNING_STANDARD"
  | "AWNING_MOTORISED"
  | "WALL_SCREEN";

export type SetupCategory = "PERGOLA" | "CARPORT" | "AWNING" | "SCREEN";

export type OrderPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export type MaterialStatus = "AVAILABLE" | "PARTIAL" | "UNAVAILABLE";

export type StrategyId =
  | "KEEP_CURRENT_SCHEDULE"
  | "PRIORITIZE_URGENT_ORDERS"
  | "REDISTRIBUTE_TO_OTHER_LINES"
  | "DELAY_LOW_PRIORITY_ORDERS"
  | "USE_OVERTIME";

export type FeasibilityStatus = "FEASIBLE" | "INFEASIBLE";

export type TaskStatus = "ON_TIME" | "DELAYED" | "NOT_SCHEDULED";

export type DecisionStatus = "DECIDED" | "NO_FEASIBLE_ALTERNATIVE";

// ---------------------------------------------------------------------------
// Production order
// ---------------------------------------------------------------------------

export interface SchedulingOrder {
  id: string;
  /** Human-readable customer order name. */
  name: string;
  productType: ProductType;
  setupCategory: SetupCategory;
  /** Quantity in units. */
  quantity: number;
  /** Duration to produce this order in hours. */
  durationHours: number;
  /** Compatible production lines (subset of ["LINE-A","LINE-B","LINE-C"]). */
  compatibleLines: string[];
  /** Preferred / default line assignment. */
  defaultLineId: string;
  materialStatus: MaterialStatus;
  priority: OrderPriority;
  /** Customer delivery deadline in calendar days from now. */
  deadlineDays: number;
  /** Estimated revenue for this order (€). */
  revenueEur: number;
  /** Delay penalty per day overdue (€/day). */
  delayPenaltyPerDay: number;
}

// ---------------------------------------------------------------------------
// Production lines
// ---------------------------------------------------------------------------

export interface ProductionLine {
  id: string;
  name: string;
  /** Normal working hours per day. */
  normalHoursPerDay: number;
  /** Compatible setup categories for this line. */
  compatibleCategories: SetupCategory[];
}

// ---------------------------------------------------------------------------
// Disruption
// ---------------------------------------------------------------------------

export interface Disruption {
  affectedLineId: string;
  /** Fraction of daily capacity removed. 0.25 = 25% less capacity. */
  capacityReductionFactor: number;
  /** Duration of disruption in days. */
  durationDays: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// Setup / changeover matrix
// ---------------------------------------------------------------------------

/** Hours required to switch from one setup category to another. */
export type SetupMatrix = Record<SetupCategory, Record<SetupCategory, number>>;

// ---------------------------------------------------------------------------
// Complete scenario (input to the engine)
// ---------------------------------------------------------------------------

export interface SchedulingScenario {
  scenarioId: string;
  lines: ProductionLine[];
  orders: SchedulingOrder[];
  disruption: Disruption;
  setupMatrix: SetupMatrix;
  /** Planning horizon in days. */
  planningHorizonDays: number;
  overtimeAvailable: boolean;
  /** Additional hours per line per day when overtime is enabled. */
  overtimeHoursPerLinePerDay: number;
}

// ---------------------------------------------------------------------------
// Cost configuration
// ---------------------------------------------------------------------------

export interface CostConfig {
  /** Hourly operating cost for a production line (€/h). */
  lineOperatingCostPerHour: number;
  /** Additional overtime cost per hour above normal capacity (€/h). */
  overtimeCostPerHour: number;
  /** Cost per hour of setup/changeover (€/h). */
  setupCostPerHour: number;
  /** Opportunity cost per unused line-hour (€/h). */
  unusedCapacityCostPerHour: number;
  configVersion: string;
}

// ---------------------------------------------------------------------------
// Constraint rules
// ---------------------------------------------------------------------------

export interface ConstraintRule {
  id: string;
  name: string;
  description: string;
  /** If true, violating this rule makes the strategy INFEASIBLE. */
  hard: boolean;
}

export interface ConstraintResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  evidence: string;
  featureValues: Record<string, number | string | boolean>;
}

// ---------------------------------------------------------------------------
// Scheduled task (output)
// ---------------------------------------------------------------------------

export interface ScheduledTask {
  orderId: string;
  orderName: string;
  productType: ProductType;
  priority: OrderPriority;
  lineId: string;
  /** 1-based day index within the planning horizon. */
  day: number;
  /** Start hour within the day (0 = start of shift). */
  startHour: number;
  /** End hour within the day. */
  endHour: number;
  setupHoursBefore: number;
  status: TaskStatus;
  /** Days late (0 = on time). */
  daysLate: number;
  isOvertime: boolean;
  revenueEur: number;
  delayPenalty: number;
}

// ---------------------------------------------------------------------------
// Per-line utilization summary
// ---------------------------------------------------------------------------

export interface LineUtilization {
  lineId: string;
  lineName: string;
  availableHours: number;
  productionHours: number;
  setupHours: number;
  overtimeHours: number;
  unusedHours: number;
  utilizationPct: number;
}

// ---------------------------------------------------------------------------
// Financial impact
// ---------------------------------------------------------------------------

export interface FinancialImpact {
  delayCost: number;
  overtimeCost: number;
  setupCost: number;
  unusedCapacityCost: number;
  revenueAtRisk: number;
  totalCost: number;
}

// ---------------------------------------------------------------------------
// Strategy score (soft criteria)
// ---------------------------------------------------------------------------

export interface StrategyScore {
  onTimeDelivery: number;
  criticalOrderProtection: number;
  delayCostScore: number;
  setupEfficiency: number;
  capacityUtilization: number;
  overtimeCostScore: number;
  revenueProtection: number;
  /**
   * Inverse fraction of production + setup hours scheduled on the disrupted
   * line, normalised against the feasible strategy with the most disrupted-line
   * hours. 1 = least exposure to the disrupted line (best); 0 = most exposure (worst).
   */
  disruptionAvoidanceScore: number;
  /** Composite weighted score [0, 1] — higher is better. */
  composite: number;
}

// ---------------------------------------------------------------------------
// Strategy evaluation (complete)
// ---------------------------------------------------------------------------

export interface StrategyEvaluation {
  strategyId: StrategyId;
  strategyLabel: string;
  feasibility: FeasibilityStatus;
  blockingConstraints: string[];
  constraintResults: ConstraintResult[];
  schedule: ScheduledTask[];
  lineUtilization: LineUtilization[];
  financialImpact: FinancialImpact;
  score: StrategyScore;
  onTimeCount: number;
  delayedCount: number;
  notScheduledCount: number;
  totalOrders: number;
  /** Rank among feasible strategies (1 = best). 0 = not ranked. */
  rank: number;
}

// ---------------------------------------------------------------------------
// Decision explanation
// ---------------------------------------------------------------------------

export interface DecisionFactor {
  label: string;
  direction: "positive" | "negative";
  evidence: string;
}

export interface DecisionExplanation {
  recommendedStrategyId: StrategyId;
  reasons: DecisionFactor[];
  rejectedStrategies: Array<{
    strategyId: StrategyId;
    reason: string;
    feasibility: FeasibilityStatus;
  }>;
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export interface AuditEntry {
  decisionId: string;
  scenarioId: string;
  computedAt: string;
  engineVersion: string;
  configVersion: string;
  rulesExecuted: string[];
  strategiesEvaluated: StrategyId[];
  recommendedStrategy: StrategyId;
  decisionStatus: DecisionStatus;
  totalFinancialImpact: number;
  avoidedCostVsBaseline: number;
  source: "SYNTHETIC_DEMONSTRATION";
}

// ---------------------------------------------------------------------------
// Decision response (complete engine output)
// ---------------------------------------------------------------------------

export interface SchedulingDecisionResponse {
  recommendedStrategy: StrategyId;
  decisionStatus: DecisionStatus;
  strategies: StrategyEvaluation[];
  explanation: DecisionExplanation;
  decisiveFactors: DecisionFactor[];
  totalFinancialImpact: number;
  avoidedCostVsBaseline: number;
  scenarioSnapshot: SchedulingScenario;
  engineVersion: string;
  configVersion: string;
  computedAt: string;
  auditTrail: AuditEntry;
}

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface SchedulingDecisionRequest {
  scenario: SchedulingScenario;
  costConfig?: Partial<CostConfig>;
}
