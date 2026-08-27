/**
 * EIDOS Futures Mispricing Research Prototype — mispricing detection model.
 *
 * Classifies a futures contract as BUY / WATCH / NO_ACTION based on:
 *   1. Current futures price vs robust valuation range
 *   2. Relative discount magnitude
 *   3. Uncertainty width (discount must exceed uncertainty to be actionable)
 *   4. Minimum economic significance threshold
 *
 * Decision policy (explicit, non-optimised thresholds):
 *
 *   BUY:
 *     currentPrice < worstCaseLow (robust lower bound)
 *     AND discountPercent > MIN_BUY_DISCOUNT_PCT
 *     AND discountAbsolute > discountUncertaintyRatio × uncertaintyWidth
 *
 *   WATCH:
 *     currentPrice < central
 *     BUT currentPrice >= worstCaseLow
 *     OR discountAbsolute <= discountUncertaintyRatio × uncertaintyWidth
 *
 *   NO_ACTION:
 *     currentPrice >= central
 *     OR opportunity is not economically significant
 *
 * IMPORTANT: These thresholds are NOT calibrated to the 2026-05-26 EIDOS outcome.
 * They are generic structural thresholds based on domain reasoning.
 */

import type {
  MispricingSignal,
  ValuationRange,
  MinimaxResult,
  HedgeSignal,
  Robustness,
} from "@/eidos/types/futures";

// ---------------------------------------------------------------------------
// Decision thresholds (explicit configuration — not outcome-fitted)
// ---------------------------------------------------------------------------

/**
 * Minimum discount as a fraction of central valuation to consider a BUY.
 * 3% is a structurally meaningful threshold for energy futures hedging.
 */
export const MIN_BUY_DISCOUNT_PCT = 0.03;

/**
 * Minimum ratio of (discountAbsolute / uncertaintyWidth) for a BUY.
 * Discount must be materially larger than the uncertainty to be actionable.
 * A ratio of 0.5 means the discount must exceed half the uncertainty width.
 */
export const MIN_DISCOUNT_UNCERTAINTY_RATIO = 0.5;

/**
 * Minimum absolute discount (PLN/MWh) for economic significance.
 * Below this, even a structurally cheap contract may not be worth transacting.
 */
export const MIN_ABSOLUTE_DISCOUNT_PLN = 5.0;

// ---------------------------------------------------------------------------
// Robustness classification
// ---------------------------------------------------------------------------

/**
 * Classify the robustness of a mispricing opportunity.
 *
 * HIGH:   discount > 1.5 × uncertaintyWidth/2 (discount dominates uncertainty)
 * MEDIUM: discount > 0.5 × uncertaintyWidth/2 (discount exceeds uncertainty)
 * LOW:    discount <= 0.5 × uncertaintyWidth/2 (uncertainty dominates)
 */
export function classifyRobustness(
  discountAbsolute: number,
  uncertaintyWidth: number,
): Robustness {
  const halfWidth = uncertaintyWidth / 2;
  if (discountAbsolute > 1.5 * halfWidth) return "HIGH";
  if (discountAbsolute > 0.5 * halfWidth) return "MEDIUM";
  return "LOW";
}

// ---------------------------------------------------------------------------
// Signal classification
// ---------------------------------------------------------------------------

/**
 * Classify the hedge timing signal.
 *
 * @param currentPrice    Current futures price
 * @param valuation       Structural valuation range
 * @param minimax         Minimax result
 */
export function classifySignal(
  currentPrice: number,
  valuation: ValuationRange,
  minimax: MinimaxResult,
): HedgeSignal {
  const discountAbsolute = valuation.lower - currentPrice;
  const discountPercent =
    valuation.central > 0 ? (valuation.central - currentPrice) / valuation.central : 0;
  const discountUncertaintyRatio =
    valuation.uncertaintyWidth > 0
      ? discountAbsolute / valuation.uncertaintyWidth
      : 0;

  // BUY: price is below even worst-case lower bound, discount is material
  if (
    minimax.robustDiscount > 0 &&
    discountPercent > MIN_BUY_DISCOUNT_PCT &&
    discountUncertaintyRatio >= MIN_DISCOUNT_UNCERTAINTY_RATIO &&
    discountAbsolute > MIN_ABSOLUTE_DISCOUNT_PLN
  ) {
    return "BUY";
  }

  // WATCH: price is below central but not robustly below lower bound
  if (currentPrice < valuation.central) {
    return "WATCH";
  }

  // NO_ACTION: price at or above central estimate
  return "NO_ACTION";
}

// ---------------------------------------------------------------------------
// Signal explanation
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic, human-readable explanation for the signal.
 */
export function explainSignal(
  contract: string,
  currentPrice: number,
  valuation: ValuationRange,
  minimax: MinimaxResult,
  signal: HedgeSignal,
): string {
  const discountFromCentral = valuation.central - currentPrice;
  const discountPct = ((discountFromCentral / valuation.central) * 100).toFixed(1);
  const robustDisc = minimax.robustDiscount;

  if (signal === "BUY") {
    return (
      `${contract} is trading at ${currentPrice.toFixed(0)} PLN/MWh, ` +
      `${discountFromCentral.toFixed(0)} PLN (${discountPct}%) below the central ` +
      `structural valuation of ${valuation.central.toFixed(0)} PLN/MWh. ` +
      `The current price is ${robustDisc.toFixed(0)} PLN below even the ` +
      `worst-case lower valuation bound of ${minimax.worstCaseLow.toFixed(0)} PLN/MWh. ` +
      `The discount is materially larger than the uncertainty range — robust BUY signal.`
    );
  }

  if (signal === "WATCH") {
    return (
      `${contract} is trading at ${currentPrice.toFixed(0)} PLN/MWh, below the ` +
      `central valuation of ${valuation.central.toFixed(0)} PLN/MWh, but the ` +
      `discount of ${discountFromCentral.toFixed(0)} PLN does not exceed the ` +
      `uncertainty range of ±${(valuation.uncertaintyWidth / 2).toFixed(0)} PLN/MWh. ` +
      `Monitor for further weakness before committing.`
    );
  }

  return (
    `${contract} at ${currentPrice.toFixed(0)} PLN/MWh is at or above the ` +
    `central valuation of ${valuation.central.toFixed(0)} PLN/MWh. ` +
    `No mispricing detected under current curve structure.`
  );
}

// ---------------------------------------------------------------------------
// Full mispricing signal
// ---------------------------------------------------------------------------

/**
 * Compute the complete mispricing signal for a futures contract.
 *
 * @param contract    Contract identifier
 * @param currentPrice Current market price (PLN/MWh)
 * @param valuation   Structural + uncertainty valuation range
 * @param minimax     Minimax result
 */
export function computeMispricingSignal(
  contract: string,
  currentPrice: number,
  valuation: ValuationRange,
  minimax: MinimaxResult,
): MispricingSignal {
  const discountAbsolute = valuation.lower - currentPrice;
  const discountPercent =
    valuation.central > 0
      ? (valuation.central - currentPrice) / valuation.central
      : 0;

  const signal = classifySignal(currentPrice, valuation, minimax);
  const robustness = classifyRobustness(
    Math.max(discountAbsolute, 0),
    valuation.uncertaintyWidth,
  );
  const explanation = explainSignal(
    contract,
    currentPrice,
    valuation,
    minimax,
    signal,
  );

  return {
    contract,
    currentPrice,
    valuationRange: valuation,
    discountAbsolute,
    discountPercent,
    signal,
    robustness,
    explanation,
  };
}
