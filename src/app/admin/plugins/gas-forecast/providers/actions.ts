'use server'

import type {
  GasForecastConnectionResult,
  GasForecastEntsogCheckInput,
  GasForecastProviderId,
  GasForecastTtfCheckInput,
  GasForecastWeatherCheckInput,
} from '@/lib/gas-forecast-provider-model'
import { testGasForecastProviderAction as testFeatureProvider } from '@/features/gas-forecast/server-actions'

/**
 * Compatibility entry point for the legacy admin path.
 * Feature code must import the Server Action from the gas-forecast boundary.
 */
export async function testGasForecastProviderAction(input: {
  providerId: GasForecastProviderId
  entsog?: GasForecastEntsogCheckInput
  ttf?: GasForecastTtfCheckInput
  weather?: GasForecastWeatherCheckInput
}): Promise<GasForecastConnectionResult> {
  return testFeatureProvider(input)
}
