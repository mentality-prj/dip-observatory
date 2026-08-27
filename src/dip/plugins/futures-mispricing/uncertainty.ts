/**
 * EIDOS Futures Mispricing Research Prototype — uncertainty model.
 *
 * Produces a ValuationRange from measurable properties of the available
 * market data. Does NOT invent arbitrary confidence percentages.
 *
 * Terminology:
 *   uncertainty range   — interval [lower, upper] around central estimate
 *   valuation range     — same, emphasising the estimation context
 *   robustness          — qualitative assessment of signal strength
 *   worst-case deviation — largest plausible error in central estimate
 *
 * Assumptions (all documented):
 *   1. Uncertainty scales with historical price dispersion (σ_hist).
 *   2. Uncertainty scales with local curve dispersion (σ_local).
 *   3. Uncertainty increases with distance from nearest neighbours (ordinal gap).
 *   4. Uncertainty increases with data sparsity (fewer points → wider range).
 *   5. Combined uncertainty: σ_combined = √(σ_hist² + σ_local²) × distance_factor.
 *   6. Half-width = k × σ_combined where k = 1.5 (conservative coverage factor).
 */

import type { MarketSnapshot, ValuationRange } from "@/eidos/types/futures";
import { DEFAULT_CONFIG } from "./config";
import type { FuturesMispricingConfigV1 } from "./types";
import { FuturesMispricingInputError } from "./types";

/** Maximum normalised distance factor (caps uncertainty scaling for sparse data). */
const MAX_DISTANCE_FACTOR = 2.5;

// ---------------------------------------------------------------------------
// Historical dispersion
// ---------------------------------------------------------------------------

/**
 * Compute sample standard deviation of historical prices.
 * Uses the unbiased estimator (n-1 denominator).
 *
 * σ = √( Σ(xᵢ - x̄)² / (n-1) )
 */
export function computeHistoricalDispersion(
  observations: Array<{ price: number }>,
): number {
  const n = observations.length;
  if (n < 2) return 0;

  const mean = observations.reduce((s, o) => s + o.price, 0) / n;
  const variance =
    observations.reduce((s, o) => s + (o.price - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// Local curve dispersion
// ---------------------------------------------------------------------------

/**
 * Compute the dispersion of prices within a local window around the target,
 * EXCLUDING the target contract itself.
 *
 * Rationale: the target's deviation from the curve is the *signal*, not the *noise*.
 * Including the target in the dispersion window conflates signal with uncertainty.
 * The dispersion should measure how much the surrounding curve data varies.
 */
export function computeLocalCurveDispersion(
  snapshot: MarketSnapshot,
  targetContract: string,
  windowSize: number = 3,
): number {
  const quarterly = snapshot.points
    .filter((p) => p.contract.startsWith("Q"))
    .sort((a, b) => a.deliveryOrdinal - b.deliveryOrdinal);

  const idx = quarterly.findIndex((p) => p.contract === targetContract);
  if (idx < 0) return 0;

  const start = Math.max(0, idx - windowSize);
  const end = Math.min(quarterly.length - 1, idx + windowSize);
  // Exclude target contract — its deviation is the signal, not the uncertainty
  const window = quarterly
    .slice(start, end + 1)
    .filter((p) => p.contract !== targetContract);

  if (window.length < 2) return 0;

  const mean = window.reduce((s, p) => s + p.price, 0) / window.length;
  const variance =
    window.reduce((s, p) => s + (p.price - mean) ** 2, 0) / window.length;
  return Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// Distance factor
// ---------------------------------------------------------------------------

/**
 * Compute a distance factor that increases uncertainty when the target
 * contract is far from its nearest quarterly neighbours.
 *
 * Formula: factor = 1 + (maxGap / referenceGap - 1) × 0.5
 *   where referenceGap = 1 ordinal unit (adjacent contract)
 *
 * Clamped to [1, MAX_DISTANCE_FACTOR].
 */
export function computeDistanceFactor(
  snapshot: MarketSnapshot,
  targetContract: string,
): number {
  const quarterly = snapshot.points
    .filter((p) => p.contract.startsWith("Q"))
    .sort((a, b) => a.deliveryOrdinal - b.deliveryOrdinal);

  const idx = quarterly.findIndex((p) => p.contract === targetContract);
  if (idx < 0) return 1;

  const target = quarterly[idx];
  const prevGap =
    idx > 0 ? target.deliveryOrdinal - quarterly[idx - 1].deliveryOrdinal : 1;
  const nextGap =
    idx < quarterly.length - 1
      ? quarterly[idx + 1].deliveryOrdinal - target.deliveryOrdinal
      : 1;

  const maxGap = Math.max(prevGap, nextGap);
  const factor = 1 + (maxGap - 1) * 0.5;
  return Math.min(factor, MAX_DISTANCE_FACTOR);
}

// ---------------------------------------------------------------------------
// Data density factor
// ---------------------------------------------------------------------------

/**
 * Scale uncertainty by data density.
 * Fewer data points → wider uncertainty range.
 *
 * Formula: densityFactor = √(referencePoints / actualPoints)
 *   where referencePoints = 10 (full quarterly curve)
 */
export function computeDataDensityFactor(snapshot: MarketSnapshot): number {
  const REFERENCE_POINTS = 10;
  const n = snapshot.points.length;
  if (n <= 0) throw new FuturesMispricingInputError("computeDataDensityFactor: snapshot must contain at least one point");
  if (n >= REFERENCE_POINTS) return 1;
  return Math.sqrt(REFERENCE_POINTS / n);
}

// ---------------------------------------------------------------------------
// Combined uncertainty
// ---------------------------------------------------------------------------

/**
 * Compute the combined uncertainty width for the target contract.
 *
 * Formula:
 *   σ_combined = √(σ_hist² + σ_local²) × distanceFactor × densityFactor
 *   halfWidth = max(COVERAGE_FACTOR × σ_combined, MIN_HALF_WIDTH)
 *
 * @param historicalDispersion  σ_hist from historical observations
 * @param snapshot              Current market snapshot
 * @param targetContract        Contract being analysed
 */
export function computeCombinedUncertainty(
  historicalDispersion: number,
  snapshot: MarketSnapshot,
  targetContract: string,
  config: Pick<
    FuturesMispricingConfigV1,
    "minimumHalfWidth" | "uncertaintyCoverageFactor"
  > = DEFAULT_CONFIG,
): { halfWidth: number; sigma: number; sigmaLocal: number; distanceFactor: number; densityFactor: number } {
  const sigmaLocal = computeLocalCurveDispersion(snapshot, targetContract);
  const distanceFactor = computeDistanceFactor(snapshot, targetContract);
  const densityFactor = computeDataDensityFactor(snapshot);

  const sigmaCombined =
    Math.sqrt(historicalDispersion ** 2 + sigmaLocal ** 2) *
    distanceFactor *
    densityFactor;

  const halfWidth = Math.max(
    config.uncertaintyCoverageFactor * sigmaCombined,
    config.minimumHalfWidth,
  );

  return { halfWidth, sigma: sigmaCombined, sigmaLocal, distanceFactor, densityFactor };
}

// ---------------------------------------------------------------------------
// Uncertainty-adjusted ValuationRange
// ---------------------------------------------------------------------------

/**
 * Build a ValuationRange incorporating both structural valuation and
 * explicit uncertainty bounds.
 *
 * The central estimate is passed in from the structural valuation.
 * This function adjusts the bounds using the uncertainty model.
 *
 * @param centralEstimate   Structural central estimate (PLN/MWh)
 * @param historicalObs     Historical price observations (pre-decision)
 * @param snapshot          Market snapshot (pre-decision)
 * @param targetContract    Target contract id
 */
export function buildUncertaintyRange(
  centralEstimate: number,
  historicalObs: Array<{ price: number }>,
  snapshot: MarketSnapshot,
  targetContract: string,
  config: Pick<
    FuturesMispricingConfigV1,
    "minimumHalfWidth" | "uncertaintyCoverageFactor"
  > = DEFAULT_CONFIG,
): ValuationRange {
  const sigmaHist = computeHistoricalDispersion(historicalObs);
  const { halfWidth, sigma, sigmaLocal, distanceFactor, densityFactor } = computeCombinedUncertainty(
    sigmaHist,
    snapshot,
    targetContract,
    config,
  );

  return {
    lower: centralEstimate - halfWidth,
    central: centralEstimate,
    upper: centralEstimate + halfWidth,
    uncertaintyWidth: 2 * halfWidth,
    methodology:
      `Uncertainty model: σ_hist=${sigmaHist.toFixed(2)} PLN/MWh (${historicalObs.length} observations), ` +
      `σ_local=${sigmaLocal.toFixed(2)} PLN/MWh, ` +
      `distanceFactor=${distanceFactor.toFixed(2)}, densityFactor=${densityFactor.toFixed(2)}, ` +
      `σ_combined=${sigma.toFixed(2)}, halfWidth=${halfWidth.toFixed(2)} PLN/MWh. ` +
      `Coverage factor k=${config.uncertaintyCoverageFactor} (deterministic interval, not probabilistic).`,
  };
}
