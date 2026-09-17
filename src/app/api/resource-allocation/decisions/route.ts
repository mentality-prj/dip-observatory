import { NextResponse } from "next/server";

import { createResourceAllocationDecision, DipApiError } from "@/lib/dip-api";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const input = await request.json() as Record<string, unknown>;
    return NextResponse.json(await createResourceAllocationDecision(input));
  } catch (error) {
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected Resource Allocation decision error." }, { status: 500 });
  }
}
