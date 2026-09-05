"use server";

import { z } from "zod";

import {
  logGasForecastDiagnostic,
  testGasForecastProviderConnection,
} from "@/lib/gas-forecast-provider-client";
import {
  getTodayLocalDateIso,
  validateEntsogHistoricalDateRange,
} from "@/lib/entsog-date-range";
import {
  GAS_FORECAST_PROVIDER_IDS,
  mapGasForecastFailure,
  type GasForecastConnectionResult,
  type GasForecastEntsogCheckInput,
  type GasForecastProviderCheckInput,
  type GasForecastProviderId,
  type GasForecastWeatherCheckInput,
} from "@/lib/gas-forecast-provider-model";

const entsogSchema = z
  .object({
    pointDirection: z.string().trim().min(1),
    from: z.string().trim().min(1),
    to: z.string().trim().min(1),
    indicator: z.literal("Physical Flow"),
    periodType: z.literal("day"),
  })
  .superRefine((input, context) => {
    const dateError = validateEntsogHistoricalDateRange(
      { from: input.from, to: input.to },
      getTodayLocalDateIso(),
    );

    if (dateError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: dateError,
      });
    }
  });

const weatherSchema = z
  .object({
    start_date: z.string().trim().min(1),
    end_date: z.string().trim().min(1),
    regions: z.array(z.string().trim().min(1)).min(1),
    metric: z.literal("temperature_c"),
  })
  .superRefine((input, context) => {
    const dateError = validateEntsogHistoricalDateRange(
      {
        from: input.start_date,
        to: input.end_date,
      },
      getTodayLocalDateIso(),
    );

    if (dateError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["start_date"],
        message: dateError,
      });
    }
  });

const requestSchema = z.object({
  providerId: z.enum(GAS_FORECAST_PROVIDER_IDS),
  entsog: entsogSchema.optional(),
  weather: weatherSchema.optional(),
}).superRefine((input, context) => {
  if (input.providerId === "entsog" && !input.entsog) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["entsog"],
      message: "ENTSOG query is required.",
    });
  }

  if (input.providerId === "weather" && !input.weather) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["weather"],
      message: "Weather query is required.",
    });
  }
});

/**
 * Always returns a plain, JSON-serializable structured result — never
 * throws — so that a failure at any stage (validation, DIP request,
 * response parsing) surfaces as a real error category to the UI instead of
 * a generic "Load failed" caused by an unhandled server action rejection.
 */
export async function testGasForecastProviderAction(input: {
  providerId: GasForecastProviderId;
  entsog?: GasForecastEntsogCheckInput;
  weather?: GasForecastWeatherCheckInput;
}): Promise<GasForecastConnectionResult> {
  logGasForecastDiagnostic("info", "server_action_entered", {
    providerIdRaw: input?.providerId ?? null,
  });

  try {
    const { providerId, entsog, weather } = requestSchema.parse(input);
    return await testGasForecastProviderConnection(
      providerId,
      {
        entsog: providerId === "entsog" ? entsog : undefined,
        weather: providerId === "weather" ? weather : undefined,
      } satisfies GasForecastProviderCheckInput,
    );
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
          ? error.issues.some((issue) => issue.path[0] === "providerId")
            ? "Invalid provider."
            : (error.issues[0]?.message ?? "Invalid request.")
          : error instanceof Error
            ? error.message
            : "Unexpected server action error",
    });
  }
}
