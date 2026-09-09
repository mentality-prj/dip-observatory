import { NextResponse } from "next/server";
import { z } from "zod";

import { DipApiError, runDipPlugin } from "@/lib/dip-api";

const requestSchema = z.object({
  material_flow: z.number().min(0).max(100),
  sorting_capacity: z.number().min(0).max(100),
  production_capacity: z.number().min(0).max(100),
  machine_availability: z.number().min(0).max(100),
  outbound_pressure: z.number().min(0).max(100),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    return NextResponse.json(
      await runDipPlugin(
        "vive-production-intelligence",
        "vive.production_intelligence.evaluate",
        input,
      ),
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid VIVE operational state." }, { status: 422 });
    }
    if (error instanceof DipApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unexpected VIVE decision engine error." }, { status: 500 });
  }
}
