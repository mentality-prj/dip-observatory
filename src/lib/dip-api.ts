import "server-only";

import { z } from "zod";

import {
  type DipObservatoryApiRunResponse,
  type DipObservatoryApiScenario,
  type ObservatoryBootstrapPayload,
  type ObservatoryRunRequest,
  type ObservatoryRunResponse,
  dipObservatoryApiRunResponseSchema,
  dipObservatoryApiScenariosResponseSchema,
} from "@/lib/dip-contracts";
import {
  buildObservatoryBootstrapPayload,
  mapRunResponse,
} from "@/lib/observatory-adapter";
import { normalizeDipBaseUrl } from "@/lib/dip-url";

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

  return normalizeDipBaseUrl(raw);
}

function getDipApiKey() {
  const raw = process.env.DIP_API_KEY ?? process.env.DIP_ADMIN_API_KEY ?? "";
  return raw.trim();
}

function buildDipUrl(path: string) {
  return `${getDipBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
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
    return buildObservatoryBootstrapPayload({
      connection: {
        configured: false,
        healthy: false,
        baseUrl: connection.baseUrl,
        scenarioCatalogAvailable: false,
        runSurfaceAvailable: false,
      },
      apiScenarios: [],
      warnings: [
        "Set DIP_API_BASE_URL and DIP_API_KEY to connect Observatory to DIP.",
      ],
      demoConfig: {
        enabledRaw: process.env.DIP_OBSERVATORY_DEMO_MODE,
        scenarioIdRaw: process.env.DIP_OBSERVATORY_DEMO_SCENARIO_ID,
        labelRaw: process.env.DIP_OBSERVATORY_DEMO_LABEL,
      },
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

  const scenarios: DipObservatoryApiScenario[] =
    scenariosResult.data?.items ?? [];

  if (scenarios.length === 0) {
    warnings.push(
      "No DIP observatory scenarios are currently available from the API.",
    );
  }

  return buildObservatoryBootstrapPayload({
    connection: {
      configured: true,
      healthy: healthResult.data?.status === "ok",
      baseUrl: connection.baseUrl,
      scenarioCatalogAvailable: Boolean(scenariosResult.data),
      runSurfaceAvailable:
        healthResult.data?.status === "ok" && scenarios.length > 0,
    },
    apiScenarios: scenarios,
    warnings,
    demoConfig: {
      enabledRaw: process.env.DIP_OBSERVATORY_DEMO_MODE,
      scenarioIdRaw: process.env.DIP_OBSERVATORY_DEMO_SCENARIO_ID,
      labelRaw: process.env.DIP_OBSERVATORY_DEMO_LABEL,
    },
  });
}

export async function runDipObservatoryScenario(
  request: ObservatoryRunRequest,
): Promise<ObservatoryRunResponse> {
  const response: DipObservatoryApiRunResponse = await dipFetch(
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

  return mapRunResponse(response);
}

export { DipApiError };
