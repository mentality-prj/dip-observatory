import { NextResponse } from "next/server";
import { z } from "zod";
import { gtmDemoSchema } from "@/features/gtm-lab/contracts";
import { DipApiError, runDipPlugin } from "@/lib/dip-api";

export async function POST() {
  try {
    const result = await runDipPlugin("gtm-lab", "gtm.demo.run", {});
    return NextResponse.json(gtmDemoSchema.parse(result));
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "QDIP returned an incompatible GTM Lab contract.", issues: error.issues }, { status: 502 });
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "The GTM dataset could not be evaluated." }, { status: 500 });
  }
}
