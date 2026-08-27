/**
 * EIDOS Futures Mispricing Research Prototype — forward curve analysis.
 *
 * Implements deterministic curve slope, curvature, calendar spreads and
 * relative valuation. All functions are pure with no side-effects.
 *
 * Mathematical model:
 *
 *   Local slope    = (P[i+1] - P[i-1]) / (ord[i+1] - ord[i-1])   (central diff)
 *   Overall slope  = linear regression slope (OLS) over all points
 *   Curvature      = (P[i+1] - 2·P[i] + P[i-1]) / ((Δord)²)      (second diff)
 *   Calendar spread = P[target] - P[annual]
 *   Normalised dev  = (P[target] - P̂[target]) / σ_local
 *
 * where P̂ is the linear interpolation from the two neighbours.
 */

import type {
  ForwardCurvePoint,
  MarketSnapshot,
  ValuationRange,
  CurveMetrics,
} from "@/eidos/types/futures";
import { FuturesMispricingInputError } from "./types";

// ---------------------------------------------------------------------------
// Curve slope
// ---------------------------------------------------------------------------

/**
 * Compute the OLS linear regression slope over all curve points.
 * Units: PLN/MWh per ordinal unit.
 *
 * Formula: slope = Σ((x_i - x̄)(y_i - ȳ)) / Σ((x_i - x̄)²)
 */
export function computeOverallSlope(points: ForwardCurvePoint[]): number {
  if (points.length < 2) return 0;

  const n = points.length;
  const xBar = points.reduce((s, p) => s + p.deliveryOrdinal, 0) / n;
  const yBar = points.reduce((s, p) => s + p.price, 0) / n;

  let num = 0;
  let den = 0;
  for (const p of points) {
    const dx = p.deliveryOrdinal - xBar;
    num += dx * (p.price - yBar);
    den += dx * dx;
  }

  return den === 0 ? 0 : num / den;
}

/**
 * Compute the local slope at the target contract using central differences.
 * Requires at least one neighbour on each side; falls back to one-sided diff.
 *
 * Formula (central): slope = (P_next - P_prev) / (ord_next - ord_prev)
 * Formula (one-sided): slope = (P_next - P_target) / (ord_next - ord_target)
 */
export function computeLocalSlope(
  points: ForwardCurvePoint[],
  targetContract: string,
): number {
  const sorted = [...points].sort(
    (a, b) => a.deliveryOrdinal - b.deliveryOrdinal,
  );
  const idx = sorted.findIndex((p) => p.contract === targetContract);
  if (idx < 0) return 0;

  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const target = sorted[idx];

  if (prev && next) {
    return (next.price - prev.price) / (next.deliveryOrdinal - prev.deliveryOrdinal);
  }
  if (next) {
    return (next.price - target.price) / (next.deliveryOrdinal - target.deliveryOrdinal);
  }
  if (prev) {
    return (target.price - prev.price) / (target.deliveryOrdinal - prev.deliveryOrdinal);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Curvature
// ---------------------------------------------------------------------------

/**
 * Compute the discrete second derivative (curvature) at the target contract.
 *
 * Formula: κ = (P_next - 2·P_target + P_prev) / ((Δord)²)
 *
 * Returns 0 if neighbours are not available on both sides.
 */
export function computeCurvature(
  points: ForwardCurvePoint[],
  targetContract: string,
): number {
  const sorted = [...points].sort(
    (a, b) => a.deliveryOrdinal - b.deliveryOrdinal,
  );
  const idx = sorted.findIndex((p) => p.contract === targetContract);
  if (idx <= 0 || idx >= sorted.length - 1) return 0;

  const prev = sorted[idx - 1];
  const target = sorted[idx];
  const next = sorted[idx + 1];

  const dOrd =
    (next.deliveryOrdinal - prev.deliveryOrdinal) / 2;
  if (dOrd === 0) return 0;

  return (next.price - 2 * target.price + prev.price) / (dOrd * dOrd);
}

// ---------------------------------------------------------------------------
// Calendar spreads
// ---------------------------------------------------------------------------

/**
 * Compute the spread between the target contract and its adjacent quarterly contracts.
 * Returns { spreadToPrevious, spreadToNext } in PLN/MWh.
 * A negative spread means the target is cheaper than its neighbour.
 */
export function computeCalendarSpreads(
  points: ForwardCurvePoint[],
  targetContract: string,
): { spreadToPrevious: number; spreadToNext: number } {
  const quarterly = points
    .filter((p) => p.contract.startsWith("Q"))
    .sort((a, b) => a.deliveryOrdinal - b.deliveryOrdinal);

  const idx = quarterly.findIndex((p) => p.contract === targetContract);
  if (idx < 0) return { spreadToPrevious: 0, spreadToNext: 0 };

  const target = quarterly[idx];
  const prev = idx > 0 ? quarterly[idx - 1] : null;
  const next = idx < quarterly.length - 1 ? quarterly[idx + 1] : null;

  return {
    spreadToPrevious: prev ? target.price - prev.price : 0,
    spreadToNext: next ? target.price - next.price : 0,
  };
}

/**
 * Compute the spread between the target quarterly contract and the
 * closest annual (Cal) contract by ordinal.
 * Returns PLN/MWh; negative = target cheaper than annual.
 */
export function computeAnnualSpread(
  points: ForwardCurvePoint[],
  targetContract: string,
): number {
  const target = points.find((p) => p.contract === targetContract);
  if (!target) return 0;

  const annuals = points
    .filter((p) => p.contract.startsWith("Cal"))
    .sort(
      (a, b) =>
        Math.abs(a.deliveryOrdinal - target.deliveryOrdinal) -
        Math.abs(b.deliveryOrdinal - target.deliveryOrdinal),
    );

  if (annuals.length === 0) return 0;
  return target.price - annuals[0].price;
}

// ---------------------------------------------------------------------------
// Relative valuation / normalised deviation
// ---------------------------------------------------------------------------

/**
 * Compute the normalised deviation of the target contract from the local curve fit.
 *
 * Algorithm:
 *   1. Fit a local linear interpolation between the two neighbouring quarterly contracts.
 *   2. Compute residual = P_target - P_interpolated.
 *   3. Normalise by the local price dispersion σ_local.
 *
 * A negative normalised deviation indicates the target is trading below its
 * locally-interpolated fair value — a potential mispricing signal.
 */
export function computeNormalisedDeviation(
  points: ForwardCurvePoint[],
  targetContract: string,
): number {
  const quarterly = points
    .filter((p) => p.contract.startsWith("Q"))
    .sort((a, b) => a.deliveryOrdinal - b.deliveryOrdinal);

  const idx = quarterly.findIndex((p) => p.contract === targetContract);
  if (idx <= 0 || idx >= quarterly.length - 1) return 0;

  const prev = quarterly[idx - 1];
  const target = quarterly[idx];
  const next = quarterly[idx + 1];

  // Linear interpolation from neighbours
  const t =
    (target.deliveryOrdinal - prev.deliveryOrdinal) /
    (next.deliveryOrdinal - prev.deliveryOrdinal);
  const interpolated = prev.price + t * (next.price - prev.price);
  const residual = target.price - interpolated;

  // Local dispersion: std dev of prices in a window of ±2 neighbouring quarterly contracts
  const windowStart = Math.max(0, idx - 2);
  const windowEnd = Math.min(quarterly.length - 1, idx + 2);
  const window = quarterly.slice(windowStart, windowEnd + 1);
  const mean = window.reduce((s, p) => s + p.price, 0) / window.length;
  const variance =
    window.reduce((s, p) => s + (p.price - mean) ** 2, 0) / window.length;
  const sigma = Math.sqrt(variance);

  if (sigma < 1e-9) return 0;
  return residual / sigma;
}

// ---------------------------------------------------------------------------
// Aggregate curve metrics
// ---------------------------------------------------------------------------

/**
 * Compute all curve metrics for a target contract from a market snapshot.
 * Returns a complete CurveMetrics object.
 */
export function computeCurveMetrics(
  snapshot: MarketSnapshot,
  targetContract: string,
): CurveMetrics {
  const { points } = snapshot;
  const { spreadToPrevious, spreadToNext } = computeCalendarSpreads(
    points,
    targetContract,
  );

  return {
    overallSlope: computeOverallSlope(points),
    localSlope: computeLocalSlope(points, targetContract),
    curvature: computeCurvature(points, targetContract),
    spreadToPrevious,
    spreadToNext,
    spreadToAnnual: computeAnnualSpread(points, targetContract),
    normalisedDeviation: computeNormalisedDeviation(points, targetContract),
    dataPoints: points.length,
  };
}

// ---------------------------------------------------------------------------
// Valuation range from curve structure
// ---------------------------------------------------------------------------

/**
 * Derive a defensible valuation range for the target contract from the curve.
 *
 * Methodology:
 *   1. Compute the locally-interpolated price from adjacent quarterly contracts.
 *   2. Compute the annual (Cal) contract proxy value.
 *   3. Central estimate = weighted average of local interpolation and annual proxy.
 *   4. Uncertainty bounds derived from local price dispersion and curvature.
 *
 * This is a structural valuation — it does NOT use the target price itself
 * in the central estimate calculation, only its neighbours.
 */
export function computeStructuralValuation(
  snapshot: MarketSnapshot,
  targetContract: string,
  options?: {
    localInterpolationWeight?: number;
    annualProxyWeight?: number;
    minimumHalfWidth?: number;
  },
): ValuationRange {
  const localWeight = options?.localInterpolationWeight ?? 0.7;
  const annualWeight = options?.annualProxyWeight ?? 0.3;
  const minHalfWidth = options?.minimumHalfWidth ?? 10;

  const points = snapshot.points;
  const quarterly = points
    .filter((p) => p.contract.startsWith("Q"))
    .sort((a, b) => a.deliveryOrdinal - b.deliveryOrdinal);

  const targetIdx = quarterly.findIndex((p) => p.contract === targetContract);
  if (targetIdx < 0) {
    throw new FuturesMispricingInputError(`Contract ${targetContract} not found in snapshot`);
  }

  // --- Local interpolation from adjacent quarterly contracts ---
  const prev = targetIdx > 0 ? quarterly[targetIdx - 1] : null;
  const next =
    targetIdx < quarterly.length - 1 ? quarterly[targetIdx + 1] : null;
  const target = quarterly[targetIdx];

  let localInterpolated = target.price;
  if (prev && next) {
    const t =
      (target.deliveryOrdinal - prev.deliveryOrdinal) /
      (next.deliveryOrdinal - prev.deliveryOrdinal);
    localInterpolated = prev.price + t * (next.price - prev.price);
  } else if (prev) {
    localInterpolated = prev.price + computeOverallSlope(quarterly);
  } else if (next) {
    localInterpolated = next.price - computeOverallSlope(quarterly);
  }

  // --- Annual (Cal) contract proxy ---
  const annuals = points
    .filter((p) => p.contract.startsWith("Cal"))
    .sort(
      (a, b) =>
        Math.abs(a.deliveryOrdinal - target.deliveryOrdinal) -
        Math.abs(b.deliveryOrdinal - target.deliveryOrdinal),
    );

  const annualProxy = annuals.length > 0 ? annuals[0].price : localInterpolated;

  // --- Central estimate: weight local interpolation more heavily ---
  // Default: 70% local curve interpolation, 30% annual proxy
  const central = localWeight * localInterpolated + annualWeight * annualProxy;

  // --- Uncertainty bounds from local price dispersion ---
  const windowPrices = [
    prev?.price,
    target.price,
    next?.price,
    annualProxy,
  ].filter((p): p is number => p !== undefined);

  const wMean = windowPrices.reduce((s, p) => s + p, 0) / windowPrices.length;
  const wVariance =
    windowPrices.reduce((s, p) => s + (p - wMean) ** 2, 0) /
    windowPrices.length;
  const wSigma = Math.sqrt(wVariance);

  // Uncertainty width = 1.5 × local dispersion, minimum minHalfWidth PLN
  const halfWidth = Math.max(1.5 * wSigma, minHalfWidth);

  return {
    lower: central - halfWidth,
    central,
    upper: central + halfWidth,
    uncertaintyWidth: 2 * halfWidth,
    methodology:
      `Structural valuation: ${(localWeight * 100).toFixed(0)}% local linear interpolation (adjacent quarterly) + ` +
      `${(annualWeight * 100).toFixed(0)}% annual contract proxy. Uncertainty bounds: 1.5× local price dispersion, ` +
      `minimum ±${minHalfWidth.toFixed(0)} PLN/MWh.`,
  };
}

/**
 * Compute relative price of target versus its quarterly neighbours.
 * Returns an object describing how the target price compares to adjacent contracts.
 */
export function computeRelativePosition(
  points: ForwardCurvePoint[],
  targetContract: string,
): { vsLocalCurve: number; vsAnnual: number; interpretation: string } {
  const quarterly = points
    .filter((p) => p.contract.startsWith("Q"))
    .sort((a, b) => a.deliveryOrdinal - b.deliveryOrdinal);

  const idx = quarterly.findIndex((p) => p.contract === targetContract);
  if (idx < 0) return { vsLocalCurve: 0, vsAnnual: 0, interpretation: "unknown" };

  const target = quarterly[idx];
  const prev = idx > 0 ? quarterly[idx - 1] : null;
  const next = idx < quarterly.length - 1 ? quarterly[idx + 1] : null;

  let interpolated = target.price;
  if (prev && next) {
    const t =
      (target.deliveryOrdinal - prev.deliveryOrdinal) /
      (next.deliveryOrdinal - prev.deliveryOrdinal);
    interpolated = prev.price + t * (next.price - prev.price);
  }

  const annuals = points.filter((p) => p.contract.startsWith("Cal")).sort(
    (a, b) =>
      Math.abs(a.deliveryOrdinal - target.deliveryOrdinal) -
      Math.abs(b.deliveryOrdinal - target.deliveryOrdinal),
  );
  const annualProxy = annuals.length > 0 ? annuals[0].price : interpolated;

  const vsLocalCurve = target.price - interpolated;
  const vsAnnual = target.price - annualProxy;

  let interpretation = "approximately fairly valued";
  if (vsLocalCurve < -10 && vsAnnual < -10) {
    interpretation = "trading at a discount versus both local curve and annual proxy";
  } else if (vsLocalCurve < -5) {
    interpretation = "slightly below local curve";
  } else if (vsLocalCurve > 10) {
    interpretation = "trading at a premium versus local curve";
  }

  return { vsLocalCurve, vsAnnual, interpretation };
}
