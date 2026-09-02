import "server-only";

import { normalizeDipBaseUrl } from "@/lib/dip-url";
import {
  mapGasForecastFailure,
  mapGasForecastSuccess,
  type GasForecastConnectionResult,
  type GasForecastProviderId,
} from "@/lib/gas-forecast-provider-model";

function getDipBaseUrl() {
  const raw =
    process.env.DIP_API_BASE_URL ??
    process.env.DIP_URL ??
    process.env.NEXT_PUBLIC_DIP_API_BASE_URL ??
    "";

  return normalizeDipBaseUrl(raw);
}

function getDipApiKey() {
  const raw = process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? "";
  return raw.trim();
}

function getGasForecastCapabilityPath() {
  return (
    process.env.DIP_GAS_FORECAST_CAPABILITY_PATH?.trim() ??
    process.env.GAS_FORECAST_CAPABILITY_PATH?.trim() ??
    "/api/v1/plugin-runtime/plugins/gas-forecast/capabilities/gas.dataset.build"
  );
}

function buildGasForecastCapabilityUrl() {
  const path = getGasForecastCapabilityPath();

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(path)) {
    return path.replace(/\/+$/, "");
  }

  return `${getDipBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildGasForecastCapabilityRequest(providerId: GasForecastProviderId) {
  return {
    provider: providerId,
  };
}

async function readJsonOrText(response: Response) {
  const body = await response.text();

  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return { message: body };
  }
}

export async function testGasForecastProviderConnection(
  providerId: GasForecastProviderId,
): Promise<GasForecastConnectionResult> {
  const baseUrl = getDipBaseUrl();
  const apiKey = getDipApiKey();

  if (!baseUrl || !apiKey) {
    return mapGasForecastFailure({
      providerId,
      httpStatus: 503,
      responseTimeMs: null,
      payload: null,
    });
  }

  const startedAt = performance.now();

  try {
    const response = await fetch(buildGasForecastCapabilityUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(buildGasForecastCapabilityRequest(providerId)),
      cache: "no-store",
    });

    const responseTimeMs = Math.round(performance.now() - startedAt);
    const payload = await readJsonOrText(response);

    if (!response.ok) {
      return mapGasForecastFailure({
        providerId,
        httpStatus: response.status,
        responseTimeMs,
        payload,
      });
    }

    return mapGasForecastSuccess({
      providerId,
      httpStatus: response.status,
      responseTimeMs,
      payload,
    });
  } catch (error) {
    return mapGasForecastFailure({
      providerId,
      httpStatus: null,
      responseTimeMs: Math.round(performance.now() - startedAt),
      payload: null,
      fallbackMessage:
        error instanceof Error ? error.message : "Unexpected provider error",
    });
  }
}
