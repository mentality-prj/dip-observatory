import { normalizeDipBaseUrl } from "@/lib/dip-url";
import {
  DEFAULT_GAS_FORECAST_CAPABILITY_PATHS,
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
    ""
  );
}

function isAbsoluteUrl(value: string) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value);
}

function hasAbsoluteCapabilityUrl() {
  const path = getGasForecastCapabilityPath();
  return Boolean(path) && isAbsoluteUrl(path);
}

export function getGasForecastCapabilityPaths() {
  const configuredPath = getGasForecastCapabilityPath();

  if (!configuredPath) {
    return [...DEFAULT_GAS_FORECAST_CAPABILITY_PATHS];
  }

  return [configuredPath];
}

function buildGasForecastCapabilityUrls() {
  const baseUrl = getDipBaseUrl();

  return getGasForecastCapabilityPaths().map((path) =>
    isAbsoluteUrl(path)
      ? path.replace(/\/+$/, "")
      : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`,
  );
}

function buildInvalidEndpointMessage(urls: string[]) {
  return `Invalid API endpoint. Tried: ${urls.join(", ")}`;
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
  const capabilityUrls = buildGasForecastCapabilityUrls();

  if ((!baseUrl && !hasAbsoluteCapabilityUrl()) || !apiKey) {
    return mapGasForecastFailure({
      providerId,
      httpStatus: 503,
      responseTimeMs: null,
      payload: null,
    });
  }

  const startedAt = performance.now();

  try {
    for (const capabilityUrl of capabilityUrls) {
      const response = await fetch(capabilityUrl, {
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

      if (response.ok) {
        return mapGasForecastSuccess({
          providerId,
          httpStatus: response.status,
          responseTimeMs,
          payload,
        });
      }

      if (response.status !== 404) {
        return mapGasForecastFailure({
          providerId,
          httpStatus: response.status,
          responseTimeMs,
          payload,
        });
      }
    }

    return mapGasForecastFailure({
      providerId,
      httpStatus: 404,
      responseTimeMs: Math.round(performance.now() - startedAt),
      payload: null,
      fallbackMessage: buildInvalidEndpointMessage(capabilityUrls),
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
