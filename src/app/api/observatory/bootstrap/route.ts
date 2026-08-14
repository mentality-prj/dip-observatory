import { NextResponse } from "next/server";

import { DipApiError, getObservatoryBootstrapPayload } from "@/lib/dip-api";

export async function GET() {
  try {
    const payload = await getObservatoryBootstrapPayload();
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof DipApiError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected Observatory bootstrap error.",
      },
      { status: 500 },
    );
  }
}
