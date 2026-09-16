import { NextResponse } from "next/server";

import { createResourceAllocationDecision, DipApiError } from "@/lib/dip-api";

export async function POST(request: Request) {
  try {
    const input = await request.json() as Record<string, unknown>;
    return NextResponse.json(await createResourceAllocationDecision(input));
  } catch (error) {
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unexpected Resource Allocation decision error." }, { status: 500 });
  }
}
