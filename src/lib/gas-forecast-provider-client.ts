import { normalizeDipBaseUrl } from "@/lib/dip-url";
import {
  DEFAULT_GAS_FORECAST_CAPABILITY_PATHS,
  mapGasForecastFailure,
  mapGasForecastSuccess,
  toSafeRawBody,
  type GasForecastConnectionResult,
  type GasForecastProviderId,
} from "@/lib/gas-forecast-provider-model";

const DEFAULT_DIP_REQUEST_TIMEOUT_MS = 15_000;
const ENABLED_DIAGNOSTIC_VALUES = new Set(["1", "true", "yes", "on"]);

function getDipRequestTimeoutMs() {
  const raw = process.env.DIP_GAS_FORECAST_TIMEOUT_MS?.trim();
  const parsed = raw ? Number(raw) : NaN;

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_DIP_REQUEST_TIMEOUT_MS;
}

/**
 * Temporary structured diagnostics for the DIP gas forecast provider
 * connectivity path. Never logs DIP_API_KEY (only its presence as a
 * boolean). Logs are gated behind DIP_GAS_FORECAST_DIAGNOSTICS and default
 * to off so production logging stays quiet unless explicitly enabled for an
 * investigation.
 */
function isGasForecastDiagnosticsEnabled() {
  const raw = process.env.DIP_GAS_FORECAST_DIAGNOSTICS?.trim().toLowerCase();
  return raw ? ENABLED_DIAGNOSTIC_VALUES.has(raw) : false;
}

export function logGasForecastDiagnostic(
  level: "info" | "error",
  event: string,
  fields: Record<string, unknown>,
) {
  if (!isGasForecastDiagnosticsEnabled()) {
    return;
  }

  console[level]("[gas-forecast-provider]", {
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

const AGSI_CONNECTIVITY_CHECK_INPUT = {
  start_date: "2025-01-01",
  end_date: "2025-01-07",
  type: "eu",
} as const;

function buildGasForecastCapabilityRequest(providerId: GasForecastProviderId) {
  if (providerId === "agsi") {
    return {
      provider: "agsi" as const,
      agsi: AGSI_CONNECTIVITY_CHECK_INPUT,
    };
  }

  return {
    provider: providerId,
    [providerId]: {},
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
    // Not JSON: never surface the raw DIP body verbatim — redact anything
    // credential-shaped and truncate it to a safe length before it can ever
    // reach the UI or a diagnostics log.
    const safeBody = toSafeRawBody(body);
    return { message: safeBody, rawBody: safeBody };
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

  logGasForecastDiagnostic("info", "server_action_entered", {
    providerId,
    dipApiBaseUrlPresent: Boolean(process.env.DIP_API_BASE_URL),
    dipApiBaseUrlNormalized: baseUrl || null,
    dipApiKeyPresent: hasApiKey,
    requestUrls: capabilityUrls,
    httpMethod: "POST",
    requestTimeoutMs: timeoutMs,
  });

  if ((!baseUrl && !hasAbsoluteCapabilityUrl()) || !apiKey) {
    logGasForecastDiagnostic("error", "failure", {
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

        logGasForecastDiagnostic("error", "failure", {
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
        logGasForecastDiagnostic("error", "failure", {
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

      logGasForecastDiagnostic("info", "response_received", {
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
        const failure = mapGasForecastFailure({
          providerId,
          httpStatus: response.status,
          responseTimeMs,
          payload,
        });

        // Safe structured-error logging: only the parsed/classified fields,
        // never the request headers, DIP_API_KEY, or any other credential.
        logGasForecastDiagnostic("error", "dip_error_response", {
          providerId,
          requestUrl: capabilityUrl,
          httpStatus: response.status,
          responseTimeMs,
          kind: failure.kind,
          message: failure.message,
          errorDetail: failure.errorDetail ?? null,
        });

        return failure;
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

    logGasForecastDiagnostic("error", "failure", {
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
