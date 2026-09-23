'use server'

import type {
  GasForecastExperimentRequest,
  GasForecastExperimentResult,
} from '@/lib/gas-forecast-experiment-client'
import { runGasForecastExperimentAction as runFeatureAction } from '@/features/gas-forecast/server-actions'

/**
 * Compatibility entry point for the legacy admin route.
 * New feature code must import the action from the gas-forecast feature boundary.
 */
export async function runGasForecastExperimentAction(
  input: GasForecastExperimentRequest
): Promise<GasForecastExperimentResult> {
  return runFeatureAction(input)
}
