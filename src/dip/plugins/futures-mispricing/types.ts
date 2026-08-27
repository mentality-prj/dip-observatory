/**
 * DIP Core plugin — futures mispricing.
 *
 * DIP-specific request/response and configuration types for the futures
 * mispricing decision plugin. These adapt the Observatory domain types in
 * `@/eidos/types/futures` for use across the DIP plugin boundary (HTTP API).
 *
 * LOOK-AHEAD PROTECTION:
 *   The request contract intentionally contains ONLY pre-decision information.
 *   It has no field for outcome / future price / realized return.
 */

import type {
  MarketSnapshot,
  ValuationRange,
  CurveMetrics,
  MinimaxResult,
  MispricingSignal,
  HedgeDecision,
  HedgeSignal,
} from "@/eidos/types/futures";

/** Plugin metadata describing identity and capabilities. */
export interface FuturesMispricingPluginMeta {
  id: "futures-mispricing";
  version: "0.1.0";
  category: "research";
  capabilities: string[];
  description: string;
}

/**
 * Version 1 configuration for the futures mispricing plugin.
 * All values are explicit structural assumptions — NOT outcome-fitted.
 */
export interface FuturesMispricingConfigV1 {
  /** Structural valuation weights: local interpolation vs annual proxy. */
  valuationWeights: { localInterpolation: number; annualProxy: number };
  /** Coverage factor k for the uncertainty half-width (deterministic). */
  uncertaintyCoverageFactor: number;
  /** Minimum uncertainty half-width regardless of data quality (PLN/MWh). */
  minimumHalfWidth: number;
  /** Number of deterministic grid points for the minimax search. */
  minimaxGridSize: number;
  /** Minimum discount (fraction of central) to consider a BUY. */
  minimumBuyDiscountPercent: number;
  /** Minimum discount / uncertainty-width ratio for a BUY. */
  minimumDiscountUncertaintyRatio: number;
  /** Minimum absolute discount (PLN/MWh) for economic significance. */
  minimumAbsoluteDiscountPln: number;
  /** Historical window length used for market dynamics (days). */
  historicalWindowDays: number;
  /** Robustness HIGH threshold (× uncertainty half-width). */
  robustnessHighThreshold: number;
  /** Robustness MEDIUM threshold (× uncertainty half-width). */
  robustnessMediumThreshold: number;
  /** Configuration schema version. */
  configVersion: "1.0";
}

export type FuturesMispricingConfigOverride = Partial<
  Omit<FuturesMispricingConfigV1, "valuationWeights">
> & {
  valuationWeights?: Partial<FuturesMispricingConfigV1["valuationWeights"]>;
};

/**
 * Request contract for the futures mispricing plugin.
 *
 * MUST NOT contain outcome, futurePrice, realizedReturn, or any information
 * from after the decision date. This is a hard look-ahead protection boundary.
 */
export interface FuturesMispricingRequest {
  /** Decision date (ISO 8601). Information cutoff for the whole computation. */
  decisionDate: string;
  /** Contract being analysed, e.g. "Q1-2027". */
  targetContract: string;
  /** Pre-decision market snapshot (forward curve). */
  marketSnapshot: MarketSnapshot;
  /** Pre-decision historical price observations. */
  historicalObservations: Array<{ date: string; price: number }>;
  /** Optional configuration overrides (merged over DEFAULT_CONFIG). */
  configuration?: FuturesMispricingConfigOverride;
}

/**
 * Historical market dynamics computed from pre-decision observations only.
 */
export interface HistoricalDynamics {
  /** Linear regression slope (PLN/MWh per day). */
  trend: number;
  /** Sample standard deviation of prices (PLN/MWh). */
  volatility: number;
  /** Price change over the window (latest - oldest, PLN/MWh). */
  momentum: number;
  /** Number of observations used (after the decisionDate cutoff). */
  observationCount: number;
  /** Span of the observation window in days. */
  windowDays: number;
}

/**
 * Deterministic decision trace for auditability. Every intermediate step of
 * the pipeline is captured so a reviewer can reproduce and verify the outcome.
 */
export interface DecisionTrace {
  input: {
    decisionDate: string;
    targetContract: string;
    contractPrice: number;
    historicalObservations: number;
  };
  curveMetrics: CurveMetrics;
  structuralValuation: ValuationRange;
  uncertaintyRange: ValuationRange;
  historicalDynamics: HistoricalDynamics;
  minimax: MinimaxResult;
  mispricingSignal: MispricingSignal;
  hedgeDecision: { action: HedgeSignal; rationale: string };
}

/** Response contract for the futures mispricing plugin. */
export interface FuturesMispricingResponse {
  /** Final hedge decision. */
  decision: HedgeDecision;
  /** Plugin version that produced this response. */
  pluginVersion: string;
  /** Model version identifier. */
  modelVersion: string;
  /** Configuration schema version. */
  configurationVersion: string;
  /** Timestamp when the response was produced (metadata only). */
  computedAt: string;
  /** Full deterministic decision trace. */
  decisionTrace: DecisionTrace;
}
