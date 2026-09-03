import { normalizeDipBaseUrl } from "@/lib/dip-url";
import {
  DEFAULT_GAS_FORECAST_CAPABILITY_PATHS,
  mapGasForecastFailure,
  mapGasForecastSuccess,
  type GasForecastConnectionResult,
  type GasForecastProviderId,
} from "@/lib/gas-forecast-provider-model";

const DEFAULT_DIP_REQUEST_TIMEOUT_MS = 15_000;

function getDipRequestTimeoutMs() {
  const raw = process.env.DIP_GAS_FORECAST_TIMEOUT_MS?.trim();
  const parsed = raw ? Number(raw) : NaN;

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_DIP_REQUEST_TIMEOUT_MS;
}

/**
 * Temporary safe structured diagnostics for the DIP gas forecast provider
 * connectivity path. Never logs DIP_API_KEY (only its presence as a
 * boolean). Intended to be removed once the "Load failed" investigation is
 * closed.
 */
function logGasForecastDiagnostic(
  event: string,
  fields: Record<string, unknown>,
) {
  console.info("[gas-forecast-provider]", {
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  });
}

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
  const hasApiKey = Boolean(apiKey);
  const capabilityUrls = buildGasForecastCapabilityUrls();
  const timeoutMs = getDipRequestTimeoutMs();

  logGasForecastDiagnostic("server_action_entered", {
    providerId,
    dipApiBaseUrlPresent: Boolean(process.env.DIP_API_BASE_URL),
    dipApiBaseUrlNormalized: baseUrl || null,
    dipApiKeyPresent: hasApiKey,
    requestUrls: capabilityUrls,
    httpMethod: "POST",
    requestTimeoutMs: timeoutMs,
  });

  if ((!baseUrl && !hasAbsoluteCapabilityUrl()) || !apiKey) {
    logGasForecastDiagnostic("failure", {
      providerId,
      failureStage: "before_fetch",
      exceptionName: null,
      exceptionMessage: null,
      httpStatus: 503,
    });

    return mapGasForecastFailure({
      providerId,
      httpStatus: 503,
      responseTimeMs: null,
      payload: null,
      stage: "configuration",
    });
  }

  const startedAt = performance.now();

  try {
    for (const capabilityUrl of capabilityUrls) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;

      try {
        response = await fetch(capabilityUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(buildGasForecastCapabilityRequest(providerId)),
          cache: "no-store",
          signal: controller.signal,
        });
      } catch (fetchError) {
        const responseTimeMs = Math.round(performance.now() - startedAt);
        const isAbort =
          fetchError instanceof Error && fetchError.name === "AbortError";

        logGasForecastDiagnostic("failure", {
          providerId,
          requestUrl: capabilityUrl,
          failureStage: "during_fetch",
          exceptionName:
            fetchError instanceof Error ? fetchError.name : typeof fetchError,
          exceptionMessage:
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError),
          httpStatus: null,
          responseTimeMs,
        });

        return mapGasForecastFailure({
          providerId,
          httpStatus: null,
          responseTimeMs,
          payload: null,
          stage: "network",
          fallbackMessage: isAbort
            ? `DIP request timed out after ${timeoutMs}ms (${capabilityUrl})`
            : fetchError instanceof Error
              ? fetchError.message
              : "Network request to DIP failed",
        });
      } finally {
        clearTimeout(timeoutHandle);
      }

      const responseTimeMs = Math.round(performance.now() - startedAt);

      let payload: unknown;

      try {
        payload = await readJsonOrText(response);
      } catch (parseError) {
        logGasForecastDiagnostic("failure", {
          providerId,
          requestUrl: capabilityUrl,
          failureStage: "during_response_parsing",
          exceptionName:
            parseError instanceof Error ? parseError.name : typeof parseError,
          exceptionMessage:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
          httpStatus: response.status,
          responseTimeMs,
        });

        return mapGasForecastFailure({
          providerId,
          httpStatus: response.status,
          responseTimeMs,
          payload: null,
          stage: "parse",
          fallbackMessage:
            parseError instanceof Error
              ? parseError.message
              : "Failed to parse DIP response body",
        });
      }

      logGasForecastDiagnostic("response_received", {
        providerId,
        requestUrl: capabilityUrl,
        httpStatus: response.status,
        responseTimeMs,
        responseBody: payload,
      });

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
    const responseTimeMs = Math.round(performance.now() - startedAt);

    logGasForecastDiagnostic("failure", {
      providerId,
      failureStage: "unknown",
      exceptionName: error instanceof Error ? error.name : typeof error,
      exceptionMessage:
        error instanceof Error ? error.message : String(error),
      httpStatus: null,
      responseTimeMs,
    });

    return mapGasForecastFailure({
      providerId,
      httpStatus: null,
      responseTimeMs,
      payload: null,
      fallbackMessage:
        error instanceof Error ? error.message : "Unexpected provider error",
    });
  }
}
