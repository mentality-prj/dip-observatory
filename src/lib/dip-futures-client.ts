import type {
  FuturesMispricingRequest,
  FuturesMispricingResponse,
} from "@/dip/plugins/futures-mispricing/types";
import { normalizeDipBaseUrl } from "@/lib/dip-url";

export class DipFuturesApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "DipFuturesApiError";
    this.status = status;
  }
}

function getDipFuturesBaseUrl() {
  const raw =
    process.env.DIP_API_BASE_URL ??
    process.env.DIP_URL ??
    process.env.NEXT_PUBLIC_DIP_API_BASE_URL ??
    process.env.DIP_FUTURES_BASE_URL ??
    "";

  return normalizeDipBaseUrl(raw);
}

function getDipFuturesApiKey() {
  const raw = process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? "";
  return raw.trim();
}

export function buildDipFuturesMispricingUrl() {
  return `${getDipFuturesBaseUrl()}/api/dip/futures-mispricing`;
}

/**
 * Call the DIP futures mispricing API endpoint.
 *
 * The Observatory has NO local computation fallback — decisions are always
 * produced by DIP Core over the configured backend URL.
 */
export async function callFuturesMispricingApi(
  request: FuturesMispricingRequest,
): Promise<FuturesMispricingResponse> {
  const baseUrl = getDipFuturesBaseUrl();
  const apiKey = getDipFuturesApiKey();

  if (!baseUrl || !apiKey) {
    throw new DipFuturesApiError(
      "DIP API is not configured. Set DIP_API_BASE_URL and DIP_API_KEY.",
      503,
    );
  }

  const response = await fetch(buildDipFuturesMispricingUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(request),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ detail: null, error: { message: null } }));
    throw new DipFuturesApiError(
      payload.detail ??
        payload.error?.message ??
        `DIP futures mispricing API error: ${response.status}`,
      response.status,
    );
  }

  return response.json();
}
