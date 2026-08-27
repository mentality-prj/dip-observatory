import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { runFuturesMispricingPlugin } from "@/dip/plugins/futures-mispricing";

function isParseableIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isParseableIsoTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

const configurationSchema = z
  .object({
    valuationWeights: z
      .object({
        localInterpolation: z.number(),
        annualProxy: z.number(),
      })
      .partial()
      .optional(),
    uncertaintyCoverageFactor: z.number().optional(),
    minimumHalfWidth: z.number().optional(),
    minimaxGridSize: z.number().int().positive().optional(),
    minimumBuyDiscountPercent: z.number().optional(),
    minimumDiscountUncertaintyRatio: z.number().optional(),
    minimumAbsoluteDiscountPln: z.number().optional(),
    historicalWindowDays: z.number().int().positive().optional(),
    robustnessHighThreshold: z.number().optional(),
    robustnessMediumThreshold: z.number().optional(),
    configVersion: z.literal("1.0").optional(),
  })
  .strict();

const requestSchema = z.object({
  decisionDate: z.string().refine(isParseableIsoDate, {
    message: "decisionDate must be a parseable ISO 8601 date (YYYY-MM-DD)",
  }),
  targetContract: z.string(),
  marketSnapshot: z.object({
    timestamp: z.string().refine(isParseableIsoTimestamp, {
      message: "marketSnapshot.timestamp must be a parseable ISO 8601 timestamp",
    }),
    points: z.array(
      z.object({
        contract: z.string(),
        deliveryPeriod: z.string(),
        deliveryOrdinal: z.number(),
        price: z.number(),
        timestamp: z.string().refine(isParseableIsoTimestamp, {
          message: "marketSnapshot point timestamp must be a parseable ISO 8601 timestamp",
        }),
        isTarget: z.boolean().optional(),
      }),
    ),
  }),
  historicalObservations: z.array(
    z.object({
      date: z.string().refine(isParseableIsoDate, {
        message: "historical observation date must be a parseable ISO 8601 date (YYYY-MM-DD)",
      }),
      price: z.number(),
    }),
  ),
  configuration: configurationSchema.partial().optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = runFuturesMispricingPlugin(body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: `Invalid request: ${error.issues.map((i) => i.message).join("; ")}` },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      // Errors that indicate bad client input rather than a server fault
      const isClientError =
        /not found in snapshot|Grid must have at least \d+ points|computeDataDensityFactor.*at least one point/.test(
          error.message,
        );
      return NextResponse.json(
        { error: error.message },
        { status: isClientError ? 400 : 500 },
      );
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
