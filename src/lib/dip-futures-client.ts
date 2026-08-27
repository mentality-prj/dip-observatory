import type {
  FuturesMispricingRequest,
  FuturesMispricingResponse,
} from "@/dip/plugins/futures-mispricing/types";

/**
 * Call the DIP futures mispricing API endpoint.
 *
 * In production this would call an external DIP service. In this monorepo it
 * calls the local Next.js API route. The Observatory has NO local computation
 * fallback — decisions are always produced by DIP Core.
 */
export async function callFuturesMispricingApi(
  request: FuturesMispricingRequest,
): Promise<FuturesMispricingResponse> {
  // Use relative URL for same-origin calls from Next.js server components.
  const baseUrl = process.env.DIP_FUTURES_BASE_URL ?? "";
  const url = `${baseUrl}/api/dip/futures-mispricing`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
  });

  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `DIP futures mispricing API error: ${err.error ?? response.status}`,
    );
  }

  return response.json();
}
