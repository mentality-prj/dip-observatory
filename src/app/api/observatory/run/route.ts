import { NextResponse } from "next/server";

import { DipApiError, runDipObservatoryScenario } from "@/lib/dip-api";
import { observatoryRunRequestSchema } from "@/lib/dip-contracts";

export async function POST(request: Request) {
  try {
    const body = observatoryRunRequestSchema.parse(await request.json());
    const response = await runDipObservatoryScenario(body);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof DipApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Unexpected Observatory run error." },
      { status: 500 },
    );
  }
}
