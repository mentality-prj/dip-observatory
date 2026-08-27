/**
 * DIP Core plugin — valuation models.
 *
 * Defines the {@link ValuationModel} interface and the first structural
 * implementation, {@link StructuralCurveValuationV1}.
 */

import type { MarketSnapshot, ValuationRange } from "@/eidos/types/futures";
import type { FuturesMispricingConfigV1 } from "./types";
import { computeStructuralValuation } from "./curve-analysis";

/** A valuation model estimates a defensible price range for a contract. */
export interface ValuationModel {
  /** Estimate a valuation range for the target contract from the snapshot. */
  estimate(snapshot: MarketSnapshot, targetContract: string): ValuationRange;
  /** Human-readable description of the model. */
  description: string;
}

/**
 * StructuralCurveValuationV1
 *
 * Structural assumption (NOT calibrated to the EIDOS case):
 *   - localInterpolation weight (default 0.7): local linear interpolation
 *     from adjacent quarterly contracts.
 *   - annualProxy weight (default 0.3): nearest annual (Cal) contract proxy.
 *
 * These weights are structural assumptions, not outcome-fitted parameters.
 */
export class StructuralCurveValuationV1 implements ValuationModel {
  constructor(private readonly config: FuturesMispricingConfigV1) {}

  estimate(snapshot: MarketSnapshot, targetContract: string): ValuationRange {
    const { localInterpolation, annualProxy } = this.config.valuationWeights;
    return computeStructuralValuation(snapshot, targetContract, {
      localInterpolationWeight: localInterpolation,
      annualProxyWeight: annualProxy,
      minimumHalfWidth: this.config.minimumHalfWidth,
    });
  }

  description =
    "Structural curve valuation: weighted average of local interpolation and annual proxy.";
}
