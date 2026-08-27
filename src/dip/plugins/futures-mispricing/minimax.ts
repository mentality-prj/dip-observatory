/**
 * EIDOS Futures Mispricing Research Prototype — minimax layer.
 *
 * Implements a transparent minimax evaluation over a deterministic grid.
 *
 * Purpose:
 *   Given an uncertainty set U, evaluate candidate valuation states and
 *   calculate the worst-case loss/deviation to select a robust valuation.
 *
 * This is NOT a faithful implementation of Kapustian's PDE estimator.
 * It is a prototype that demonstrates the minimax principle for uncertainty-
 * aware hedge timing. See README.md for the known limitations.
 *
 * Algorithm:
 *   1. Define uncertainty set U = [central - halfWidth, central + halfWidth]
 *   2. Generate a deterministic grid of N states across U
 *   3. For each state v, compute loss = |currentPrice - v| relative to central
 *   4. Worst-case state = argmax loss over the grid
 *   5. Robust discount = worstCaseLow - currentPrice (positive → price is below worst-case lower bound)
 *
 * No random sampling. No Monte Carlo. Deterministic and reproducible.
 */

import type { ValuationRange, MinimaxResult } from "@/eidos/types/futures";

/** Number of grid points for the minimax search. */
export const MINIMAX_GRID_SIZE = 100;

// ---------------------------------------------------------------------------
// Grid generation
// ---------------------------------------------------------------------------

/**
 * Generate a uniform deterministic grid over the uncertainty interval [lower, upper].
 * Always includes the endpoints.
 *
 * @param lower  Lower bound of uncertainty interval
 * @param upper  Upper bound of uncertainty interval
 * @param n      Number of grid points (>= 2)
 */
export function generateMinimaxGrid(
  lower: number,
  upper: number,
  n: number = MINIMAX_GRID_SIZE,
): number[] {
  if (n < 2) throw new Error("Grid must have at least 2 points");
  if (upper <= lower) return [lower];

  const step = (upper - lower) / (n - 1);
  return Array.from({ length: n }, (_, i) => lower + i * step);
}

// ---------------------------------------------------------------------------
// Loss function
// ---------------------------------------------------------------------------

/**
 * Compute the loss for a candidate valuation state.
 *
 * Loss = deviation of state from central estimate, penalised for being
 * adversarial (i.e., the state that makes the mispricing look smallest).
 *
 * For the purpose of finding worst-case low: the adversarial state is the
 * one with the smallest value (i.e., the state where the current price
 * looks least mispriced from below).
 */
export function computeStateLoss(state: number, central: number): number {
  return Math.abs(state - central);
}

// ---------------------------------------------------------------------------
// Minimax evaluation
// ---------------------------------------------------------------------------

/**
 * Run the minimax evaluation over the uncertainty set.
 *
 * The adversary (market) picks the worst state for the hedge buyer.
 * The hedge buyer evaluates the robust discount at the worst-case state.
 *
 * Formula:
 *   worstCaseLow  = min(grid)      — adversary collapses valuation
 *   worstCaseHigh = max(grid)      — adversary inflates valuation
 *   worstCaseDeviation = max(|state - central| for all states)
 *   robustDiscount = worstCaseLow - currentPrice
 *     (positive means current price is below even the worst-case lower bound)
 *
 * @param currentPrice    Current futures price (PLN/MWh)
 * @param valuation       Structural valuation range
 * @param gridSize        Number of grid points (default: MINIMAX_GRID_SIZE)
 */
export function runMinimax(
  currentPrice: number,
  valuation: ValuationRange,
  gridSize: number = MINIMAX_GRID_SIZE,
): MinimaxResult {
  const grid = generateMinimaxGrid(valuation.lower, valuation.upper, gridSize);

  // Worst-case from buyer's perspective: adversary chooses state to minimise discount
  // i.e., adversary picks the lowest valuation state
  const worstCaseLow = grid[0]; // = valuation.lower (grid includes endpoints)
  const worstCaseHigh = grid[grid.length - 1]; // = valuation.upper

  // Maximum deviation from central estimate
  const worstCaseDeviation = Math.max(
    ...grid.map((state) => computeStateLoss(state, valuation.central)),
  );

  // Robust discount: how much cheaper is current price vs. even the worst-case low?
  // Positive = current price is below even the worst-case lower bound
  const robustDiscount = worstCaseLow - currentPrice;

  return {
    worstCaseLow,
    worstCaseHigh,
    worstCaseDeviation,
    robustDiscount,
    gridSize,
  };
}

/**
 * RobustMinimaxEstimatorV1 — named wrapper around {@link runMinimax}.
 *
 * Provides a stable, versioned identity for the deterministic minimax layer
 * used by the DIP futures mispricing plugin. This is an independent robust
 * baseline; it is NOT Kapustian's published mathematical estimator.
 *
 * `runMinimax` remains exported as a backward-compatible alias.
 */
export function RobustMinimaxEstimatorV1(
  currentPrice: number,
  valuation: ValuationRange,
  gridSize: number = MINIMAX_GRID_SIZE,
): MinimaxResult {
  return runMinimax(currentPrice, valuation, gridSize);
}

// ---------------------------------------------------------------------------
// Sensitivity analysis
// ---------------------------------------------------------------------------

/**
 * Compute minimax results across a range of uncertainty width multipliers.
 * Used for sensitivity reporting — not for the decision itself.
 *
 * @param currentPrice    Current futures price
 * @param centralEstimate Central valuation estimate
 * @param baseHalfWidth   Base uncertainty half-width
 * @param multipliers     Array of multipliers to test (e.g. [0.5, 1.0, 1.5, 2.0])
 */
export function computeMinimaxSensitivity(
  currentPrice: number,
  centralEstimate: number,
  baseHalfWidth: number,
  multipliers: number[] = [0.5, 1.0, 1.5, 2.0],
): Array<{ multiplier: number; result: MinimaxResult }> {
  return multipliers.map((m) => {
    const hw = baseHalfWidth * m;
    const valuation: ValuationRange = {
      lower: centralEstimate - hw,
      central: centralEstimate,
      upper: centralEstimate + hw,
      uncertaintyWidth: 2 * hw,
      methodology: `sensitivity at multiplier ${m}`,
    };
    return { multiplier: m, result: runMinimax(currentPrice, valuation) };
  });
}
