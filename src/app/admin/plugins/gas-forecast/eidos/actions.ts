"use server";

import { z } from "zod";

import {
  runGasForecastExperiment,
  type GasForecastExperimentRequest,
  type GasForecastExperimentResult,
} from "@/lib/gas-forecast-experiment-client";

const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

const requestSchema = z
  .object({
    start_date: dateSchema,
    end_date: dateSchema,
    forecast_horizon_days: z.number().int().min(1),
    volume_mwh: z.number().positive(),
    procurement_threshold_eur_per_mwh: z.number(),
  })
  .superRefine((input, context) => {
    if (input.start_date > input.end_date) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["start_date"],
        message: "start_date must be before or equal to end_date.",
      });
    }
  });

export async function runGasForecastExperimentAction(
  input: GasForecastExperimentRequest,
): Promise<GasForecastExperimentResult> {
  try {
    const parsed = requestSchema.parse(input);
    return await runGasForecastExperiment(parsed);
  } catch (error) {
    return {
      status: "failed",
      httpStatus: 400,
      responseTimeMs: null,
      message:
        error instanceof z.ZodError
          ? (error.issues[0]?.message ?? "Invalid request.")
          : error instanceof Error
            ? error.message
            : "Unexpected server action error.",
      payload: null,
      executedAt: new Date().toISOString(),
    };
  }
}
