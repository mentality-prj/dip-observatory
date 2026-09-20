import { NextResponse } from "next/server";
import { z } from "zod";
import { prospectSeedSchema } from "@/features/gtm-lab/import-contracts";
import { DipApiError, runGtmPipeline } from "@/lib/dip-api";

const requestSchema = z.object({ rows: z.array(prospectSeedSchema).min(1).max(5000) });

export async function POST(request: Request) {
  try {
    const { rows } = requestSchema.parse(await request.json());
    return NextResponse.json(await runGtmPipeline(rows));
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid GTM pipeline payload.", issues: error.issues }, { status: 400 });
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "The GTM pipeline could not be executed." }, { status: 500 });
  }
}
