/**
 * DIP Core plugin — futures mispricing default configuration.
 *
 * These values are explicit structural assumptions. They are NOT calibrated
 * to, or fitted against, the EIDOS 2026-05-26 outcome (558 PLN). They encode
 * domain reasoning for energy futures hedge timing.
 */

import type {
  FuturesMispricingConfigOverride,
  FuturesMispricingConfigV1,
} from "./types";

export const DEFAULT_CONFIG: FuturesMispricingConfigV1 = {
  valuationWeights: { localInterpolation: 0.7, annualProxy: 0.3 },
  uncertaintyCoverageFactor: 1.5,
  minimumHalfWidth: 10.0,
  minimaxGridSize: 100,
  minimumBuyDiscountPercent: 0.03,
  minimumDiscountUncertaintyRatio: 0.5,
  minimumAbsoluteDiscountPln: 5.0,
  historicalWindowDays: 180,
  robustnessHighThreshold: 1.5,
  robustnessMediumThreshold: 0.5,
  configVersion: "1.0",
};

export function mergeFuturesMispricingConfig(
  overrides?: FuturesMispricingConfigOverride,
): FuturesMispricingConfigV1 {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    valuationWeights: {
      ...DEFAULT_CONFIG.valuationWeights,
      ...overrides?.valuationWeights,
    },
  };
}
