/**
 * EIDOS Decision Observatory — domain types.
 *
 * Prototype only. These types describe a *synthetic* energy-procurement
 * decision model used to validate a product hypothesis. They do NOT map to any
 * real EIDOS system, the DIP core, or production procurement data.
 */

/** Coarse risk bucket used for badges and status derivation. */
export type ClientRisk = "LOW" | "MEDIUM" | "HIGH";

/** Exception-oriented status of a client's current procurement decision. */
export type DecisionStatus =
  | "STABLE"
  | "STRATEGY_CHANGED"
  | "HIGH_RISK"
  | "ACTION_REQUIRED";

/** The three procurement alternatives compared by the prototype. */
export type ProcurementStrategy = "BUY_20" | "BUY_40" | "WAIT";

/** Retrospective quality of an executed decision. */
export type OutcomeStatus = "FAVOURABLE" | "NEUTRAL" | "UNFAVOURABLE";

/** Market assumption presets. Switching a scenario can change the preferred decision. */
export type EidosScenario =
  | "BASELINE"
  | "HIGH_PRICE"
  | "LOW_PRICE"
  | "HIGH_DEMAND"
  | "LOW_DEMAND"
  | "HIGH_VOLATILITY";

/**
 * Authored, deterministic seed for a synthetic client. All derived values
 * (recommendation, risk, status, costs) are computed from this seed and a
 * scenario — never stored, never random at runtime.
 */
export interface EidosClientSeed {
  id: string;
  name: string;
  annualConsumptionMwh: number;
  /** The client's existing contract coverage. */
  currentStrategy: ProcurementStrategy;
  /** Risk aversion (λ) used in the risk-adjusted cost ranking. */
  riskAversion: number;
  /** Local spot-price offset (€/MWh) relative to the market forward. */
  spotBias: number;
  /** Per-client forward contango premium (€/MWh) that widens as prices rise. */
  forwardPremium: number;
  /** Intrinsic risk offset (0..1) folded into the client's risk exposure. */
  baseRisk: number;
  /** Deterministic seed for synthetic history / outcome generation. */
  historySeed: number;
}

/** Market assumptions for a scenario. */
export interface ScenarioParams {
  id: EidosScenario;
  label: string;
  description: string;
  /** Multiplier on the reference price that drives the realized scenario spot. */
  priceLevel: number;
  /** Multiplier on consumed volume. */
  demandLevel: number;
  /** Multiplier on price volatility (drives risk). */
  volatility: number;
}

/** Evaluation of a single procurement alternative under a scenario. */
export interface StrategyEvaluation {
  strategy: ProcurementStrategy;
  /** Expected annual procurement cost in euros. */
  expectedCost: number;
  /** Continuous risk value in [0, 1]. */
  riskValue: number;
  /** Bucketed risk for badges. */
  risk: ClientRisk;
  /** Forecast confidence in [0, 1]. */
  confidence: number;
  /** Additional euros of exposure in an adverse spot move. */
  downside: number;
  /** Euros saved versus the most expensive alternative (can be 0). */
  expectedSavings: number;
  /** Risk-adjusted cost used for ranking (lower is better). */
  riskAdjustedCost: number;
  /** 1 = recommended under current assumptions. */
  rank: number;
}

/** A single factor that explains why a recommendation changed. */
export interface DecisionFactor {
  label: string;
  /** Signed fractional change, e.g. -0.08 for -8%. */
  delta: number;
  /** True when a higher value pushes toward more hedging. */
  supportsHedging: boolean;
}

/** Scenario-resolved view of a client (matches the problem-statement shape). */
export interface EidosClient {
  id: string;
  name: string;
  annualConsumptionMwh: number;
  currentStrategy: ProcurementStrategy;
  recommendedStrategy: ProcurementStrategy;
  status: DecisionStatus;
  risk: ClientRisk;
  decisionChanged: boolean;
}

/** Full decision analysis for one client under one scenario. */
export interface ClientDecision {
  client: EidosClient;
  scenario: EidosScenario;
  evaluations: StrategyEvaluation[];
  recommended: StrategyEvaluation;
  current: StrategyEvaluation;
  factors: DecisionFactor[];
}

/** A point on the client's decision-history timeline. */
export interface DecisionHistoryEntry {
  date: string;
  strategy: ProcurementStrategy;
  risk: ClientRisk;
  scenario: EidosScenario;
  reason?: string;
}

/** A tracked outcome for a previously executed decision. */
export interface DecisionOutcome {
  date: string;
  recommendedStrategy: ProcurementStrategy;
  executedStrategy: ProcurementStrategy;
  expectedCost: number;
  actualCost: number;
  /** Signed cost variance as a fraction (e.g. 0.02 = +2%). */
  variancePct: number;
  outcome: OutcomeStatus;
}

/** Aggregated, exception-oriented summary of the whole portfolio. */
export interface PortfolioSummary {
  total: number;
  stable: number;
  strategyChanged: number;
  highRisk: number;
  actionRequired: number;
  /** Clients that require attention (everything except STABLE). */
  needsAttention: number;
}
