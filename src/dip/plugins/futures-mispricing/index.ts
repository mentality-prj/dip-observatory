/**
 * DIP Core plugin — futures mispricing entry point.
 *
 * Independent deterministic robust/minimax baseline for futures hedge timing.
 * This plugin does NOT reproduce EIDOS's internal methodology and does NOT
 * implement Kapustian's published mathematical estimator.
 *
 * The full pipeline is deterministic and free of look-ahead: it consumes only
 * pre-decision information (market snapshot + historical observations up to the
 * decision date) and produces a hedge decision plus an auditable trace.
 */

import type {
  FuturesMispricingPluginMeta,
  FuturesMispricingRequest,
  FuturesMispricingResponse,
  DecisionTrace,
} from "./types";
import { mergeFuturesMispricingConfig } from "./config";
import { computeCurveMetrics } from "./curve-analysis";
import { StructuralCurveValuationV1 } from "./valuation";
import {
  computeHistoricalDynamics,
  filterHistoricalObservations,
} from "./historical-dynamics";
import { buildUncertaintyRange } from "./uncertainty";
import { runMinimax } from "./minimax";
import { computeMispricingSignal } from "./mispricing";
import { assembleHedgeDecision } from "./hedge-decision";

export const FUTURES_MISPRICING_PLUGIN_META: FuturesMispricingPluginMeta = {
  id: "futures-mispricing",
  version: "0.1.0",
  category: "research",
  capabilities: [
    "futures-curve-analysis",
    "valuation",
    "uncertainty-analysis",
    "robust-minimax",
    "mispricing-detection",
    "hedge-timing",
  ],
  description:
    "Independent deterministic robust/minimax baseline for futures hedge timing. " +
    "Does not reproduce EIDOS's internal methodology and does not implement Kapustian's published mathematical estimator.",
};

export const MODEL_VERSION = "1.0" as const;

/**
 * Run the futures mispricing plugin over a request.
 *
 * @param request  Pre-decision request contract (no outcome/future data).
 */
export function runFuturesMispricingPlugin(
  request: FuturesMispricingRequest,
): FuturesMispricingResponse {
  const config = mergeFuturesMispricingConfig(request.configuration);

  const {
    marketSnapshot,
    targetContract,
    historicalObservations: rawHistoricalObservations,
    decisionDate,
  } = request;
  const historicalObservations = filterHistoricalObservations(
    rawHistoricalObservations,
    decisionDate,
  );

  // Current price from the snapshot (decision-time information only).
  const targetPoint = marketSnapshot.points.find(
    (p) => p.contract === targetContract,
  );
  if (!targetPoint) {
    throw new Error(`Contract ${targetContract} not found in snapshot`);
  }
  const currentPrice = targetPoint.price;

  // 1. Forward curve structural analysis.
  const curveMetrics = computeCurveMetrics(marketSnapshot, targetContract);

  // 2. Structural valuation from curve shape.
  const structuralValuation = new StructuralCurveValuationV1(config).estimate(
    marketSnapshot,
    targetContract,
  );

  // 3. Historical market dynamics (hard cutoff at decisionDate).
  const historicalDynamics = computeHistoricalDynamics(
    historicalObservations,
    decisionDate,
  );

  // 4. Uncertainty-adjusted valuation range.
  const uncertaintyRange = buildUncertaintyRange(
    structuralValuation.central,
    historicalObservations,
    marketSnapshot,
    targetContract,
    config,
  );

  // 5. Minimax robust valuation.
  const minimax = runMinimax(
    currentPrice,
    uncertaintyRange,
    config.minimaxGridSize,
  );

  // 6. Mispricing signal.
  const mispricingSignal = computeMispricingSignal(
    targetContract,
    currentPrice,
    uncertaintyRange,
    minimax,
    config,
  );

  // 7. Full hedge decision — assembled from pre-computed intermediates so that
  //    the canonical decision and the trace record the same values.
  const decision = assembleHedgeDecision({
    targetContract,
    currentPrice,
    valuation: uncertaintyRange,
    minimax,
    signal: mispricingSignal,
    curveMetrics,
    decisionDate,
  });

  const decisionTrace: DecisionTrace = {
    input: {
      decisionDate,
      targetContract,
      contractPrice: currentPrice,
      historicalObservations: historicalObservations.length,
    },
    curveMetrics,
    structuralValuation,
    uncertaintyRange,
    historicalDynamics,
    minimax,
    mispricingSignal,
    hedgeDecision: { action: decision.action, rationale: decision.rationale },
  };

  return {
    decision,
    pluginVersion: FUTURES_MISPRICING_PLUGIN_META.version,
    modelVersion: MODEL_VERSION,
    configurationVersion: config.configVersion,
    computedAt: new Date().toISOString(),
    decisionTrace,
  };
}

export { DEFAULT_CONFIG } from "./config";
export type * from "./types";
