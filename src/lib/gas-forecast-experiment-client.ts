import { normalizeDipBaseUrl } from "@/lib/dip-url";

const GAS_FORECAST_PLUGIN_ID = "gas-forecast" as const;
const GAS_FORECAST_EXPERIMENT_CAPABILITY_ID = "gas.forecast.experiment" as const;

const DEFAULT_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATHS = [
  `/api/v1/plugin-runtime/plugins/${GAS_FORECAST_PLUGIN_ID}/capabilities/${GAS_FORECAST_EXPERIMENT_CAPABILITY_ID}`,
  `/api/v1/plugin-runtime/plugins/${GAS_FORECAST_PLUGIN_ID}/capabilities/${GAS_FORECAST_EXPERIMENT_CAPABILITY_ID}/run`,
  `/api/v1/plugins/${GAS_FORECAST_PLUGIN_ID}/capabilities/${GAS_FORECAST_EXPERIMENT_CAPABILITY_ID}`,
  `/api/v1/plugin-runtime/${GAS_FORECAST_PLUGIN_ID}/capabilities/${GAS_FORECAST_EXPERIMENT_CAPABILITY_ID}`,
  `/api/v1/plugin-runtime/capabilities/${GAS_FORECAST_EXPERIMENT_CAPABILITY_ID}?plugin=${GAS_FORECAST_PLUGIN_ID}`,
] as const;

export type GasForecastExperimentRequest = {
  start_date: string;
  end_date: string;
  forecast_horizon_days: number;
  volume_mwh: number;
  procurement_threshold_eur_per_mwh: number;
};

export type GasForecastExperimentResult = {
  status: "succeeded" | "failed";
  httpStatus: number | null;
  responseTimeMs: number | null;
  message: string | null;
  payload: unknown;
  executedAt: string;
};

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

function getGasForecastExperimentCapabilityPath() {
  return (
    process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH?.trim() ??
    process.env.GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH?.trim() ??
    ""
  );
}

function isAbsoluteUrl(value: string) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value);
}

function hasAbsoluteCapabilityUrl() {
  const path = getGasForecastExperimentCapabilityPath();
  return Boolean(path) && isAbsoluteUrl(path);
}

export function getGasForecastExperimentCapabilityPaths() {
  const configuredPath = getGasForecastExperimentCapabilityPath();

  if (!configuredPath) {
    return [...DEFAULT_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATHS];
  }

  return [configuredPath];
}

function buildCapabilityUrls() {
  const baseUrl = getDipBaseUrl();

  return getGasForecastExperimentCapabilityPaths().map((path) =>
    isAbsoluteUrl(path)
      ? path.replace(/\/+$/, "")
      : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`,
  );
}

function readMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate =
    ("detail" in payload && typeof payload.detail === "string"
      ? payload.detail
      : null) ??
    ("message" in payload && typeof payload.message === "string"
      ? payload.message
      : null) ??
    ("error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
      ? payload.error.message
      : null);

  return candidate?.trim() || fallback;
}

async function readJsonOrText(response: Response) {
  const body = await response.text();

  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return { message: body.slice(0, 2_000) };
  }
}

export async function runGasForecastExperiment(
  request: GasForecastExperimentRequest,
): Promise<GasForecastExperimentResult> {
  const baseUrl = getDipBaseUrl();
  const apiKey = getDipApiKey();

  if ((!baseUrl && !hasAbsoluteCapabilityUrl()) || !apiKey) {
    return {
      status: "failed",
      httpStatus: 503,
      responseTimeMs: null,
      message:
        "DIP gas forecast experiment is not configured. Set DIP_API_BASE_URL and DIP_API_KEY, or configure an absolute DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH.",
      payload: null,
      executedAt: new Date().toISOString(),
    };
  }

  const capabilityUrls = buildCapabilityUrls();
  const startedAt = performance.now();
  let allResponsesWere404 = true;
  let lastFailure: GasForecastExperimentResult | null = null;

  try {
    for (const capabilityUrl of capabilityUrls) {
      let response: Response;

      try {
        response = await fetch(capabilityUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(request),
          cache: "no-store",
        });
      } catch (error) {
        allResponsesWere404 = false;
        lastFailure = {
          status: "failed",
          httpStatus: null,
          responseTimeMs: Math.round(performance.now() - startedAt),
          message:
            error instanceof Error
              ? error.message
              : "Network request to DIP failed.",
          payload: null,
          executedAt: new Date().toISOString(),
        };
        continue;
      }

      const payload = await readJsonOrText(response);
      const responseTimeMs = Math.round(performance.now() - startedAt);

      if (response.ok) {
        return {
          status: "succeeded",
          httpStatus: response.status,
          responseTimeMs,
          message: null,
          payload,
          executedAt: new Date().toISOString(),
        };
      }

      if (response.status !== 404) {
        allResponsesWere404 = false;
        lastFailure = {
          status: "failed",
          httpStatus: response.status,
          responseTimeMs,
          message: readMessage(
            payload,
            `DIP request failed with status ${response.status}.`,
          ),
          payload,
          executedAt: new Date().toISOString(),
        };
        continue;
      }
    }

    if (allResponsesWere404) {
      return {
        status: "failed",
        httpStatus: 404,
        responseTimeMs: Math.round(performance.now() - startedAt),
        message: "Invalid API endpoint for gas.forecast.experiment.",
        payload: null,
        executedAt: new Date().toISOString(),
      };
    }

    if (lastFailure) {
      return lastFailure;
    }

    return {
      status: "failed",
      httpStatus: null,
      responseTimeMs: Math.round(performance.now() - startedAt),
      message: "DIP request failed before any response was received.",
      payload: null,
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "failed",
      httpStatus: null,
      responseTimeMs: Math.round(performance.now() - startedAt),
      message: error instanceof Error ? error.message : "Unexpected DIP error.",
      payload: null,
      executedAt: new Date().toISOString(),
    };
  }
}
