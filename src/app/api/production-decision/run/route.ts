import { NextResponse } from "next/server";
import { z } from "zod";

import { DipApiError, runDipPlugin } from "@/lib/dip-api";

const requestSchema = z.object({
  demand_change: z.number().min(-15).max(15),
  material_availability: z.number().min(0).max(100),
  production_capacity: z.number().min(0).max(100),
  machine_availability: z.number().min(0).max(100),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const response = await runDipPlugin(
      "production-decision",
      "production.decision.evaluate",
      input,
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid production state." },
        { status: 422 },
      );
    }

    if (error instanceof DipApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unexpected decision engine error." },
      { status: 500 },
    );
  }
}
