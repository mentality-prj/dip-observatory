"use server";

import { z } from "zod";

import { testGasForecastProviderConnection } from "@/lib/gas-forecast-provider-client";
import {
  GAS_FORECAST_PROVIDER_IDS,
  type GasForecastProviderId,
} from "@/lib/gas-forecast-provider-model";

const requestSchema = z.object({
  providerId: z.enum(GAS_FORECAST_PROVIDER_IDS),
});

export async function testGasForecastProviderAction(input: {
  providerId: GasForecastProviderId;
}) {
  const { providerId } = requestSchema.parse(input);
  return testGasForecastProviderConnection(providerId);
}
