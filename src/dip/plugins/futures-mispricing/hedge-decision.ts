/**
 * EIDOS Futures Mispricing Research Prototype — hedge timing decision engine.
 *
 * Orchestrates the full pipeline:
 *   MarketSnapshot
 *     → CurveMetrics (structural analysis)
 *     → ValuationRange (structural + uncertainty)
 *     → MinimaxResult (robust worst-case)
 *     → MispricingSignal (decision)
 *     → HedgeDecision (final recommendation)
 *
 * LOOK-AHEAD PROTECTION:
 *   - The function signature accepts only MarketSnapshot (pre-decision data).
 *   - It does NOT accept OutcomeData.
 *   - Outcome data is computed separately in a dedicated utility function
 *     that is explicitly sealed from the decision pipeline.
 */

import type {
  MarketSnapshot,
  HedgeDecision,
  ValuationRange,
  Robustness,
  MinimaxResult,
  MispricingSignal,
  CurveMetrics,
} from "@/eidos/types/futures";
import { computeCurveMetrics, computeStructuralValuation } from "./curve-analysis";
import {
  buildUncertaintyRange,
  computeHistoricalDispersion,
} from "./uncertainty";
import { filterHistoricalObservations } from "./historical-dynamics";
import { runMinimax } from "./minimax";
import { computeMispricingSignal } from "./mispricing";

// ---------------------------------------------------------------------------
// Decision computation
// ---------------------------------------------------------------------------

/**
 * Compute a complete hedge timing decision for a target contract.
 *
 * This function only receives information available at decision time.
 * It does NOT and MUST NOT receive outcome/future price data.
 *
 * @param snapshot          Market snapshot (pre-decision information only)
 * @param targetContract    Contract to analyse (e.g. "Q1-2027")
 * @param historicalObs     Historical price observations (pre-decision)
 * @param decisionDate      ISO 8601 date string
 */
export function computeHedgeDecision(
  snapshot: MarketSnapshot,
  targetContract: string,
  historicalObs: Array<{ date: string; price: number }>,
  decisionDate: string,
): HedgeDecision {
  const filteredHistoricalObs = filterHistoricalObservations(
    historicalObs,
    decisionDate,
  );

  // 1. Forward curve structural analysis
  const curveMetrics = computeCurveMetrics(snapshot, targetContract);

  // 2. Structural valuation from curve shape
  const structuralValuation = computeStructuralValuation(snapshot, targetContract);

  // 3. Uncertainty-adjusted valuation range
  const valuation: ValuationRange = buildUncertaintyRange(
    structuralValuation.central,
    filteredHistoricalObs,
    snapshot,
    targetContract,
  );

  // 5. Current price from snapshot
  const targetPoint = snapshot.points.find((p) => p.contract === targetContract);
  if (!targetPoint) {
    throw new Error(`Contract ${targetContract} not found in snapshot`);
  }
  const currentPrice = targetPoint.price;

  // 4. Minimax robust valuation
  const minimax = runMinimax(currentPrice, valuation);

  // 6. Mispricing signal
  const signal = computeMispricingSignal(
    targetContract,
    currentPrice,
    valuation,
    minimax,
  );

  // 7. Downside / upside
  // downside = distance from current price to worst-case lower bound (clamped to >= 0)
  // upside = how much price could rise to reach central estimate
  const downside = Math.max(0, currentPrice - minimax.worstCaseLow);
  const upside = valuation.central - currentPrice;

  // 8. Robustness
  const robustness: Robustness = signal.robustness;

  // 9. Rationale
  const rationale = buildRationale(
    targetContract,
    currentPrice,
    valuation,
    minimax,
    signal.signal,
    curveMetrics,
  );

  return {
    action: signal.signal,
    contract: targetContract,
    entryPrice: currentPrice,
    valuationRange: valuation,
    minimax,
    downside,
    upside,
    robustness,
    decisionDate,
    rationale,
    curveMetrics,
  };
}

// ---------------------------------------------------------------------------
// Rationale builder
// ---------------------------------------------------------------------------

/**
 * Assemble a HedgeDecision from pre-computed intermediates.
 * Use this when the calling code has already run the sub-steps so that the
 * canonical decision object uses exactly the same values that are recorded in
 * the decision trace (no double-computation).
 */
export function assembleHedgeDecision(params: {
  targetContract: string;
  currentPrice: number;
  valuation: ValuationRange;
  minimax: MinimaxResult;
  signal: MispricingSignal;
  curveMetrics: CurveMetrics;
  decisionDate: string;
}): HedgeDecision {
  const { targetContract, currentPrice, valuation, minimax, signal, curveMetrics, decisionDate } = params;
  const downside = Math.max(0, currentPrice - minimax.worstCaseLow);
  const upside = valuation.central - currentPrice;
  const robustness: Robustness = signal.robustness;
  const rationale = buildRationale(
    targetContract,
    currentPrice,
    valuation,
    minimax,
    signal.signal,
    curveMetrics,
  );
  return {
    action: signal.signal,
    contract: targetContract,
    entryPrice: currentPrice,
    valuationRange: valuation,
    minimax,
    downside,
    upside,
    robustness,
    decisionDate,
    rationale,
    curveMetrics,
  };
}

function buildRationale(
  contract: string,
  currentPrice: number,
  valuation: ValuationRange,
  minimax: { worstCaseLow: number; robustDiscount: number },
  signal: string,
  metrics: { normalisedDeviation: number; spreadToAnnual: number; localSlope: number },
): string {
  const parts: string[] = [];

  parts.push(
    `Forward curve analysis for ${contract}: ` +
      `local curve slope ${metrics.localSlope.toFixed(2)} PLN/ordinal unit, ` +
      `normalised deviation ${metrics.normalisedDeviation.toFixed(2)} σ from local curve.`,
  );

  if (metrics.spreadToAnnual < -5) {
    parts.push(
      `The contract trades ${Math.abs(metrics.spreadToAnnual).toFixed(0)} PLN/MWh ` +
        `below the nearest annual (Cal) contract — a structural discount.`,
    );
  }

  parts.push(
    `Structural valuation range: ${valuation.lower.toFixed(0)} – ${valuation.upper.toFixed(0)} PLN/MWh ` +
      `(central ${valuation.central.toFixed(0)}, uncertainty ±${(valuation.uncertaintyWidth / 2).toFixed(0)} PLN/MWh).`,
  );

  parts.push(
    `Minimax worst-case lower bound: ${minimax.worstCaseLow.toFixed(0)} PLN/MWh. ` +
      `Current price vs. worst-case lower: ${minimax.robustDiscount > 0 ? "+" : ""}${minimax.robustDiscount.toFixed(0)} PLN/MWh.`,
  );

  if (signal === "BUY") {
    parts.push(
      `Recommendation: BUY — current price is below even the adversarial worst-case ` +
        `lower bound. The structural discount is robust to uncertainty.`,
    );
  } else if (signal === "WATCH") {
    parts.push(
      `Recommendation: WATCH — current price is below central valuation but ` +
        `the discount is within the uncertainty range. Further confirmation needed.`,
    );
  } else {
    parts.push(
      `Recommendation: NO_ACTION — current price is at or above central valuation.`,
    );
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Outcome computation (SEALED from decision pipeline)
// ---------------------------------------------------------------------------

/**
 * Compute the outcome for a historical case.
 *
 * THIS FUNCTION IS ISOLATED FROM THE DECISION PIPELINE.
 * It is only called after the decision has been computed and frozen.
 *
 * The outcome price MUST NOT flow back into any decision calculation.
 *
 * @param decisionPrice     Price at decision time (from the decision output)
 * @param referencePrice    Subsequent market price (post-decision)
 */
export function computeOutcome(
  decisionPrice: number,
  referencePrice: number,
): {
  absoluteChange: number;
  percentageChange: number;
  outcomeStatus: "FAVOURABLE" | "NEUTRAL" | "UNFAVOURABLE";
} {
  const absoluteChange = referencePrice - decisionPrice;
  const percentageChange =
    decisionPrice > 0 ? absoluteChange / decisionPrice : 0;

  let outcomeStatus: "FAVOURABLE" | "NEUTRAL" | "UNFAVOURABLE";
  if (percentageChange > 0.02) {
    // > +2% — the hedge was entered at a good price
    outcomeStatus = "FAVOURABLE";
  } else if (percentageChange < -0.02) {
    // < -2% — the hedge was expensive ex-post
    outcomeStatus = "UNFAVOURABLE";
  } else {
    outcomeStatus = "NEUTRAL";
  }

  return { absoluteChange, percentageChange, outcomeStatus };
}

// ---------------------------------------------------------------------------
// Historical dispersion re-export for convenience
// ---------------------------------------------------------------------------
export { computeHistoricalDispersion };
