import "server-only";

import { z } from "zod";

import {
  type DipObservatoryApiInputField,
  type DipObservatoryApiRunResponse,
  type DipObservatoryApiRunResult,
  type DipObservatoryApiScenario,
  type DipObservatoryApiScenarioPreset,
  type ObservatoryBootstrapPayload,
  type ObservatoryInputField,
  type ObservatoryRunRequest,
  type ObservatoryRunResponse,
  type ObservatoryRunResult,
  type ObservatoryScenario,
  dipObservatoryApiRunResponseSchema,
  dipObservatoryApiScenariosResponseSchema,
  observatoryBootstrapPayloadSchema,
  observatoryRunResponseSchema,
} from "@/lib/dip-contracts";

class DipApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "DipApiError";
    this.status = status;
  }
}

type SafeDipResult<T> = {
  data: T | null;
  error: string | null;
  status: number | null;
};

function getDipBaseUrl() {
  const raw =
    process.env.DIP_API_BASE_URL ??
    process.env.DIP_URL ??
    process.env.NEXT_PUBLIC_DIP_API_BASE_URL ??
    "";

  return raw.trim().replace(/\/+$/, "");
}

function getDipApiKey() {
  const raw = process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? "";
  return raw.trim();
}

function buildDipUrl(path: string) {
  return `${getDipBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function mapScenarioField(
  field: DipObservatoryApiInputField,
): ObservatoryInputField {
  return {
    name: field.name,
    label: field.label,
    type: field.type,
    defaultValue: field.default_value,
    required: field.required,
    hint: field.hint,
    minValue: field.min_value,
    maxValue: field.max_value,
    step: field.step,
  };
}

function mapScenarioPreset(preset: DipObservatoryApiScenarioPreset) {
  return {
    id: preset.id,
    label: preset.label,
    description: preset.description,
    entityId: preset.entity_id,
    features: preset.features,
  };
}

function mapScenario(scenario: DipObservatoryApiScenario): ObservatoryScenario {
  return {
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    domain: scenario.domain,
    modelId: scenario.model_id,
    datasetId: scenario.dataset_id,
    stateAxes: scenario.state_axes,
    fields: scenario.fields.map(mapScenarioField),
    presets: scenario.presets.map(mapScenarioPreset),
  };
}

function mapRunResult(
  result: DipObservatoryApiRunResult,
): ObservatoryRunResult {
  return {
    id: result.id,
    label: result.label,
    entityId: result.entity_id,
    inputFeatures: result.input_features,
    prediction: result.prediction,
    decision: result.decision,
    matchedRule: result.matched_rule,
    confidence: result.confidence,
    uncertainty: {
      score: result.uncertainty.score,
      label: result.uncertainty.label,
      intervalLow: result.uncertainty.interval_low,
      intervalHigh: result.uncertainty.interval_high,
    },
    risk: result.risk,
    systemStability: result.system_stability,
    propagationRisk: result.propagation_risk,
    currentState: result.current_state,
    predictedState: result.predicted_state,
    feasibleStateSpace: result.feasible_state_space,
    trajectories: result.trajectories,
    alternativeDecisions: result.alternative_decisions,
    ruleTraces: result.rule_traces,
    explanation: result.explanation,
    executionTimeMs: result.execution_time_ms,
  };
}

function mapRunResponse(
  response: DipObservatoryApiRunResponse,
): ObservatoryRunResponse {
  return {
    scenario: mapScenario(response.scenario),
    executedAt: response.executed_at,
    results: response.results.map(mapRunResult),
    warnings: response.warnings,
  };
}

async function parseResponse<T>(response: Response, schema: z.ZodType<T>) {
  if (!response.ok) {
    let message = `DIP request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as {
        detail?: string;
        error?: { message?: string };
      };
      message = payload.detail ?? payload.error?.message ?? message;
    } catch {}

    throw new DipApiError(message, response.status);
  }

  return schema.parse(await response.json());
}

async function dipFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
) {
  const apiKey = getDipApiKey();
  const baseUrl = getDipBaseUrl();

  if (!baseUrl || !apiKey) {
    throw new DipApiError(
      "DIP API is not configured. Set DIP_API_BASE_URL and DIP_API_KEY.",
      503,
    );
  }

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-api-key", apiKey);

  const response = await fetch(buildDipUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  return parseResponse(response, schema);
}

async function safeDipFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<SafeDipResult<T>> {
  try {
    return {
      data: await dipFetch(path, schema, init),
      error: null,
      status: 200,
    };
  } catch (error) {
    if (error instanceof DipApiError) {
      return {
        data: null,
        error: error.message,
        status: error.status,
      };
    }

    return {
      data: null,
      error: error instanceof Error ? error.message : "Unexpected DIP error.",
      status: 500,
    };
  }
}

export function getDipConnectionState() {
  const baseUrl = getDipBaseUrl();
  const apiKey = getDipApiKey();

  return {
    configured: Boolean(baseUrl && apiKey),
    baseUrl: baseUrl || null,
  };
}

export async function getObservatoryBootstrapPayload(): Promise<ObservatoryBootstrapPayload> {
  const connection = getDipConnectionState();

  if (!connection.configured) {
    return observatoryBootstrapPayloadSchema.parse({
      connection: {
        configured: false,
        healthy: false,
        baseUrl: connection.baseUrl,
        scenarioCatalogAvailable: false,
        runSurfaceAvailable: false,
      },
      scenarios: [],
      selectedScenarioId: null,
      warnings: [
        "Set DIP_API_BASE_URL and DIP_API_KEY to connect Observatory to DIP.",
      ],
    });
  }

  const warnings: string[] = [];

  const [healthResult, scenariosResult] = await Promise.all([
    safeDipFetch("/health", z.object({ status: z.string() })),
    safeDipFetch(
      "/api/v1/observatory/scenarios",
      dipObservatoryApiScenariosResponseSchema,
    ),
  ]);

  if (scenariosResult.error) warnings.push(scenariosResult.error);

  const scenarios = scenariosResult.data?.items.map(mapScenario) ?? [];

  if (scenarios.length === 0) {
    warnings.push(
      "No DIP observatory scenarios are currently available from the API.",
    );
  }

  return observatoryBootstrapPayloadSchema.parse({
    connection: {
      configured: true,
      healthy: healthResult.data?.status === "ok",
      baseUrl: connection.baseUrl,
      scenarioCatalogAvailable: Boolean(scenariosResult.data),
      runSurfaceAvailable:
        healthResult.data?.status === "ok" && scenarios.length > 0,
    },
    scenarios,
    selectedScenarioId: scenarios[0]?.id ?? null,
    warnings,
  });
}

export async function runDipObservatoryScenario(
  request: ObservatoryRunRequest,
): Promise<ObservatoryRunResponse> {
  const response = await dipFetch(
    "/api/v1/observatory/run",
    dipObservatoryApiRunResponseSchema,
    {
      method: "POST",
      body: JSON.stringify({
        scenario_id: request.scenarioId,
        alternatives: request.alternatives.map((alternative) => ({
          id: alternative.id,
          label: alternative.label,
          entity_id: alternative.entityId,
          features: alternative.features,
        })),
      }),
    },
  );

  return observatoryRunResponseSchema.parse(mapRunResponse(response));
}

export { DipApiError };
