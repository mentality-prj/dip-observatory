import { NextResponse } from "next/server";

import {
  getResourceAllocationDecision,
  ResourceAllocationLifecycleReadError,
} from "@/lib/resource-allocation-lifecycle-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ decisionId: string }> },
) {
  try {
    const { decisionId } = await context.params;
    return NextResponse.json(await getResourceAllocationDecision(decisionId));
  } catch (error) {
    if (error instanceof ResourceAllocationLifecycleReadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Unexpected Resource Allocation lifecycle read error." },
      { status: 500 },
    );
  }
}
