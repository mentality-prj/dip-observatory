import { NextResponse } from "next/server";
import { z } from "zod";

import { runFuturesMispricingPlugin } from "@/dip/plugins/futures-mispricing";
import type { FuturesMispricingRequest } from "@/dip/plugins/futures-mispricing/types";

const requestSchema = z.object({
  decisionDate: z.string(),
  targetContract: z.string(),
  marketSnapshot: z.object({
    timestamp: z.string(),
    points: z.array(
      z.object({
        contract: z.string(),
        deliveryPeriod: z.string(),
        deliveryOrdinal: z.number(),
        price: z.number(),
        timestamp: z.string(),
        isTarget: z.boolean().optional(),
      }),
    ),
  }),
  historicalObservations: z.array(
    z.object({
      date: z.string(),
      price: z.number(),
    }),
  ),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = runFuturesMispricingPlugin(body as FuturesMispricingRequest);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
