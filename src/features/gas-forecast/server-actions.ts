'use server'

import { z } from 'zod'

import { getTodayLocalDateIso, validateEntsogHistoricalDateRange } from '@/lib/entsog-date-range'
import {
  runGasForecastExperiment,
  type GasForecastExperimentRequest,
  type GasForecastExperimentResult,
} from '@/lib/gas-forecast-experiment-client'
import {
  logGasForecastDiagnostic,
  testGasForecastProviderConnection,
} from '@/lib/gas-forecast-provider-client'
import {
  GAS_FORECAST_PROVIDER_IDS,
  mapGasForecastFailure,
  type GasForecastConnectionResult,
  type GasForecastEntsogCheckInput,
  type GasForecastProviderCheckInput,
  type GasForecastProviderId,
  type GasForecastTtfCheckInput,
  type GasForecastWeatherCheckInput,
} from '@/lib/gas-forecast-provider-model'

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')

const experimentRequestSchema = z
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
        path: ['start_date'],
        message: 'start_date must be before or equal to end_date.',
      })
    }
  })

const entsogSchema = z
  .object({
    pointDirection: z.string().trim().min(1),
    from: z.string().trim().min(1),
    to: z.string().trim().min(1),
    indicator: z.literal('Physical Flow'),
    periodType: z.literal('day'),
  })
  .superRefine((input, context) => {
    const dateError = validateEntsogHistoricalDateRange(
      { from: input.from, to: input.to },
      getTodayLocalDateIso()
    )
    if (dateError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['from'],
        message: dateError,
      })
    }
  })

const weatherSchema = z
  .object({
    start_date: z.string().trim().min(1),
    end_date: z.string().trim().min(1),
    regions: z.array(z.string().trim().min(1)).min(1),
    metric: z.literal('temperature_c'),
  })
  .superRefine((input, context) => {
    const dateError = validateEntsogHistoricalDateRange(
      { from: input.start_date, to: input.end_date },
      getTodayLocalDateIso()
    )
    if (dateError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start_date'],
        message: dateError,
      })
    }
  })

const ttfSchema = z
  .object({
    start_date: z.string().trim().min(1),
    end_date: z.string().trim().min(1),
  })
  .superRefine((input, context) => {
    const dateError = validateEntsogHistoricalDateRange(
      { from: input.start_date, to: input.end_date },
      getTodayLocalDateIso()
    )
    if (dateError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start_date'],
        message: dateError,
      })
    }
  })

const providerRequestSchema = z
  .object({
    providerId: z.enum(GAS_FORECAST_PROVIDER_IDS),
    entsog: entsogSchema.optional(),
    ttf: ttfSchema.optional(),
    weather: weatherSchema.optional(),
  })
  .superRefine((input, context) => {
    if (input.providerId === 'entsog' && !input.entsog) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entsog'],
        message: 'ENTSOG query is required.',
      })
    }
    if (input.providerId === 'weather' && !input.weather) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weather'],
        message: 'Weather query is required.',
      })
    }
    if (input.providerId === 'ttf' && !input.ttf) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ttf'],
        message: 'TTF query is required.',
      })
    }
  })

export async function runGasForecastExperimentAction(
  input: GasForecastExperimentRequest
): Promise<GasForecastExperimentResult> {
  try {
    return await runGasForecastExperiment(experimentRequestSchema.parse(input))
  } catch (error) {
    return {
      status: 'failed',
      httpStatus: 400,
      responseTimeMs: null,
      message:
        error instanceof z.ZodError
          ? (error.issues[0]?.message ?? 'Invalid request.')
          : error instanceof Error
            ? error.message
            : 'Unexpected server action error.',
      payload: null,
      executedAt: new Date().toISOString(),
    }
  }
}

export async function testGasForecastProviderAction(input: {
  providerId: GasForecastProviderId
  entsog?: GasForecastEntsogCheckInput
  ttf?: GasForecastTtfCheckInput
  weather?: GasForecastWeatherCheckInput
}): Promise<GasForecastConnectionResult> {
  logGasForecastDiagnostic('info', 'server_action_entered', {
    providerIdRaw: input?.providerId ?? null,
  })

  try {
    const { providerId, entsog, ttf, weather } = providerRequestSchema.parse(input)
    return await testGasForecastProviderConnection(providerId, {
      entsog: providerId === 'entsog' ? entsog : undefined,
      ttf: providerId === 'ttf' ? ttf : undefined,
      weather: providerId === 'weather' ? weather : undefined,
    } satisfies GasForecastProviderCheckInput)
  } catch (error) {
    logGasForecastDiagnostic('error', 'failure', {
      failureStage: 'server_action_serialization',
      exceptionName: error instanceof Error ? error.name : typeof error,
      exceptionMessage: error instanceof Error ? error.message : String(error),
    })

    const fallbackProviderId = GAS_FORECAST_PROVIDER_IDS.includes(
      input?.providerId as GasForecastProviderId
    )
      ? (input.providerId as GasForecastProviderId)
      : GAS_FORECAST_PROVIDER_IDS[0]

    return mapGasForecastFailure({
      providerId: fallbackProviderId,
      httpStatus: null,
      responseTimeMs: null,
      payload: null,
      kind: error instanceof z.ZodError ? 'configuration' : 'unknown',
      fallbackMessage:
        error instanceof z.ZodError
          ? error.issues.some((issue) => issue.path[0] === 'providerId')
            ? 'Invalid provider.'
            : (error.issues[0]?.message ?? 'Invalid request.')
          : error instanceof Error
            ? error.message
            : 'Unexpected server action error',
    })
  }
}
