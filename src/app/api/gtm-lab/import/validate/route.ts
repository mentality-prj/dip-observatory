import { NextResponse } from "next/server";
import { z } from "zod";
import { DipApiError, validateGtmImport } from "@/lib/dip-api";

const requestSchema = z.object({ rows: z.array(z.record(z.string(), z.unknown())).max(5000) });

export async function POST(request: Request) {
  try {
    const { rows } = requestSchema.parse(await request.json());
    return NextResponse.json(await validateGtmImport(rows));
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid GTM import payload.", issues: error.issues }, { status: 400 });
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "The GTM import could not be validated." }, { status: 500 });
  }
}
