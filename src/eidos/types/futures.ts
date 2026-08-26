/**
 * EIDOS Futures Mispricing Research Prototype — domain types.
 *
 * These types model the futures hedge-timing decision problem.
 * All calculations are deterministic and ex-ante (no look-ahead).
 *
 * Prototype only — NOT a production trading system.
 */

/** Hedge timing recommendation produced by the mispricing engine. */
export type HedgeSignal = "BUY" | "WATCH" | "NO_ACTION";

/** Qualitative robustness of the mispricing opportunity. */
export type Robustness = "HIGH" | "MEDIUM" | "LOW";

/** Retrospective outcome classification used ONLY for post-decision reporting. */
export type OutcomeStatus = "FAVOURABLE" | "NEUTRAL" | "UNFAVOURABLE";

/**
 * A single futures contract with price data available at decision time.
 * MUST NOT contain information from after the decision date.
 */
export interface FuturesContract {
  /** Unique contract identifier, e.g. "Q1-2027". */
  id: string;
  /** Underlying product / commodity. */
  product: string;
  /** Delivery period label, e.g. "Q1 2027". */
  deliveryPeriod: string;
  /**
   * Delivery period ordinal — monotonically increasing across the curve.
   * Used for mathematical ordering and spread calculations.
   */
  deliveryOrdinal: number;
  /** Date at which this snapshot was captured (ISO 8601). */
  decisionDate: string;
  /** Last traded / mid price in PLN/MWh. */
  price: number;
  /** Best bid (optional). */
  bid?: number;
  /** Best offer/ask (optional). */
  ask?: number;
  /** Official settlement price if available. */
  settlementPrice?: number;
}

/** A single point on the forward curve. */
export interface ForwardCurvePoint {
  /** Contract identifier. */
  contract: string;
  /** Human-readable delivery period. */
  deliveryPeriod: string;
  /** Delivery period ordinal — same as in FuturesContract. */
  deliveryOrdinal: number;
  /** Mid price in PLN/MWh. */
  price: number;
  /** Snapshot timestamp (ISO 8601). */
  timestamp: string;
  /** True when this is the target contract being analysed. */
  isTarget?: boolean;
}

/**
 * Complete market snapshot available at a single decision date.
 * Contains ONLY information that existed at or before the snapshot timestamp.
 */
export interface MarketSnapshot {
  /** Snapshot timestamp (ISO 8601). */
  timestamp: string;
  /** Forward curve points, ordered by deliveryOrdinal. */
  points: ForwardCurvePoint[];
}

/**
 * Uncertainty-aware valuation range produced by the curve model.
 * NOT a probability distribution — uses deterministic interval arithmetic.
 */
export interface ValuationRange {
  /** Conservative lower bound of the defensible valuation. */
  lower: number;
  /** Central estimate derived from curve structure. */
  central: number;
  /** Optimistic upper bound. */
  upper: number;
  /**
   * Width of the uncertainty interval (upper - lower).
   * Derived from measurable properties of the available data.
   */
  uncertaintyWidth: number;
  /** Human-readable description of how the range was calculated. */
  methodology: string;
}

/**
 * Mispricing signal for a single futures contract.
 * Represents the output of the full mispricing pipeline.
 */
export interface MispricingSignal {
  /** Contract being analysed. */
  contract: string;
  /** Price of the contract at decision time (PLN/MWh). */
  currentPrice: number;
  /** Valuation range derived from curve structure and uncertainty model. */
  valuationRange: ValuationRange;
  /** Absolute discount: lowerValuation - currentPrice (positive = cheap). */
  discountAbsolute: number;
  /** Relative discount as a fraction of central valuation (e.g. 0.08 = 8%). */
  discountPercent: number;
  /** Hedge timing recommendation. */
  signal: HedgeSignal;
  /**
   * Qualitative robustness of the opportunity.
   * Based on discount/uncertainty ratio — NOT a fake probability.
   */
  robustness: Robustness;
  /** Human-readable explanation of the signal. */
  explanation: string;
}

/** Forward curve structural metrics computed around a target contract. */
export interface CurveMetrics {
  /** Overall slope of the curve (PLN/MWh per ordinal unit). */
  overallSlope: number;
  /** Local slope around the target contract (PLN/MWh per ordinal unit). */
  localSlope: number;
  /** Second derivative — curvature at target contract position. */
  curvature: number;
  /** Spread to the preceding quarterly contract (PLN/MWh). */
  spreadToPrevious: number;
  /** Spread to the following quarterly contract (PLN/MWh). */
  spreadToNext: number;
  /** Spread to the same-year annual (Cal) contract (PLN/MWh). */
  spreadToAnnual: number;
  /**
   * Normalised deviation of the target contract price from the local curve fit.
   * Positive = target is above local curve; negative = below (cheap).
   */
  normalisedDeviation: number;
  /** Number of curve points used in the calculation. */
  dataPoints: number;
}

/** Output of the minimax layer — robust worst-case valuation bounds. */
export interface MinimaxResult {
  /** Worst-case lower bound under adversarial uncertainty perturbation. */
  worstCaseLow: number;
  /** Worst-case upper bound under adversarial uncertainty perturbation. */
  worstCaseHigh: number;
  /** Maximum absolute deviation from central estimate in the uncertainty set. */
  worstCaseDeviation: number;
  /**
   * Robust discount: worstCaseLow - currentPrice.
   * Positive means the current price is below even the worst-case lower bound.
   */
  robustDiscount: number;
  /** Grid size used for the deterministic minimax search. */
  gridSize: number;
}

/**
 * Full hedge timing decision output.
 * Answers: "Is this a good time and price to buy the hedge?"
 */
export interface HedgeDecision {
  /** Recommended action. */
  action: HedgeSignal;
  /** Contract identifier. */
  contract: string;
  /** Current market entry price (PLN/MWh). */
  entryPrice: number;
  /** Robust valuation range used in the decision. */
  valuationRange: ValuationRange;
  /** Minimax analysis result. */
  minimax: MinimaxResult;
  /**
   * Distance between current price and the worst-case lower bound (PLN/MWh).
   * Always >= 0. Zero when price is at or above worstCaseLow; positive when
   * the price is inside the uncertainty range.
   */
  downside: number;
  /** Potential upside relative to current price (central - currentPrice). */
  upside: number;
  /** Robustness classification of the opportunity. */
  robustness: Robustness;
  /** Decision date (ISO 8601 date string). */
  decisionDate: string;
  /** Human-readable rationale for the decision. */
  rationale: string;
  /** Forward curve structural metrics. */
  curveMetrics: CurveMetrics;
}

/**
 * Subsequent outcome observed AFTER the decision.
 * MUST NOT be used by any valuation or decision calculation.
 * Only for post-hoc reporting.
 */
export interface Outcome {
  /** Price at which the hedge was evaluated (decision-time price). */
  decisionPrice: number;
  /**
   * Reference / current market price at time of outcome review.
   * THIS IS POST-DECISION INFORMATION — not available at decision time.
   */
  referencePrice: number;
  /** Absolute change: referencePrice - decisionPrice. */
  absoluteChange: number;
  /** Percentage change as a fraction (e.g. 0.165 = +16.5%). */
  percentageChange: number;
  /** Qualitative outcome relative to the hedge decision. */
  outcomeStatus: OutcomeStatus;
}

/**
 * Look-ahead guard: type that explicitly seals the outcome from the decision pipeline.
 * The decision function only receives MarketSnapshot, never OutcomeData.
 */
export interface OutcomeData {
  /** Clearly labelled as post-decision data. */
  _label: "SUBSEQUENT_OUTCOME_NOT_AVAILABLE_AT_DECISION_TIME";
  outcome: Outcome;
}
