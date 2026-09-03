"use server";

import { z } from "zod";

import {
  logGasForecastDiagnostic,
  testGasForecastProviderConnection,
} from "@/lib/gas-forecast-provider-client";
import {
  GAS_FORECAST_PROVIDER_IDS,
  mapGasForecastFailure,
  type GasForecastConnectionResult,
  type GasForecastProviderId,
} from "@/lib/gas-forecast-provider-model";

const requestSchema = z.object({
  providerId: z.enum(GAS_FORECAST_PROVIDER_IDS),
});

/**
 * Always returns a plain, JSON-serializable structured result — never
 * throws — so that a failure at any stage (validation, DIP request,
 * response parsing) surfaces as a real error category to the UI instead of
 * a generic "Load failed" caused by an unhandled server action rejection.
 */
export async function testGasForecastProviderAction(input: {
  providerId: GasForecastProviderId;
}): Promise<GasForecastConnectionResult> {
  logGasForecastDiagnostic("info", "server_action_entered", {
    providerIdRaw: input?.providerId ?? null,
  });

  try {
    const { providerId } = requestSchema.parse(input);
    return await testGasForecastProviderConnection(providerId);
  } catch (error) {
    logGasForecastDiagnostic("error", "failure", {
      failureStage: "server_action_serialization",
      exceptionName: error instanceof Error ? error.name : typeof error,
      exceptionMessage:
        error instanceof Error ? error.message : String(error),
    });

    const fallbackProviderId = GAS_FORECAST_PROVIDER_IDS.includes(
      input?.providerId as GasForecastProviderId,
    )
      ? (input.providerId as GasForecastProviderId)
      : GAS_FORECAST_PROVIDER_IDS[0];

    return mapGasForecastFailure({
      providerId: fallbackProviderId,
      httpStatus: null,
      responseTimeMs: null,
      payload: null,
      kind: error instanceof z.ZodError ? "configuration" : "unknown",
      fallbackMessage:
        error instanceof z.ZodError
          ? "Invalid provider id."
          : error instanceof Error
            ? error.message
            : "Unexpected server action error",
    });
  }
}
