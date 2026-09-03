export const GAS_FORECAST_PROVIDER_IDS = [
  "ttf",
  "agsi",
  "entsog",
  "weather",
] as const;

export type GasForecastProviderId =
  (typeof GAS_FORECAST_PROVIDER_IDS)[number];

export type GasForecastProviderCard = {
  id: GasForecastProviderId;
  title: string;
  api: string | null;
  initialStatus: "not_configured" | "not_tested";
};

export type GasForecastFailureKind =
  | "configuration"
  | "network"
  | "dip_auth"
  | "dip_http"
  | "plugin_execution"
  | "upstream_provider"
  | "timeout"
  | "parse"
  | "unknown";

/**
 * Structured DIP error detail preserved from a non-2xx DIP response so the UI
 * can show the real underlying cause (code, provider/plugin, upstream
 * status, execution/correlation id) instead of a generic message. Never
 * populated with API keys, header values, or other secrets — only fields
 * parsed from the DIP response body.
 */
export type GasForecastStructuredError = {
  code: string | null;
  provider: string | null;
  plugin: string | null;
  upstreamStatus: number | null;
  executionId: string | null;
  rawBody: string | null;
};

export type GasForecastSampleRecord = {
  date: string | null;
  gasInStorage: string | null;
  injection: string | null;
  withdrawal: string | null;
  workingGasVolume: string | null;
};

export type GasForecastConnectionResult = {
  providerId: GasForecastProviderId;
  status: "connected" | "failed";
  connection: "OK" | "FAILED";
  kind?: GasForecastFailureKind;
  httpStatus: number | null;
  provider: string;
  api: string | null;
  responseTimeMs: number | null;
  testedAt: string;
  message: string | null;
  errorDetail?: GasForecastStructuredError | null;
  dataset: {
    records: number | null;
    firstDate: string | null;
    lastDate: string | null;
    countryOrFacility: string | null;
  } | null;
  sample: GasForecastSampleRecord[];
};

export const GAS_FORECAST_PROVIDER_CARDS: GasForecastProviderCard[] = [
  {
    id: "ttf",
    title: "TTF",
    api: null,
    initialStatus: "not_configured",
  },
  {
    id: "agsi",
    title: "AGSI",
    api: "GIE AGSI+",
    initialStatus: "not_tested",
  },
  {
    id: "entsog",
    title: "ENTSOG",
    api: null,
    initialStatus: "not_tested",
  },
  {
    id: "weather",
    title: "WEATHER",
    api: null,
    initialStatus: "not_configured",
  },
];

export const DEFAULT_GAS_FORECAST_CAPABILITY_PATHS = [
  "/api/v1/plugin-runtime/plugins/gas-forecast/capabilities/gas.dataset.build",
  "/api/v1/plugin-runtime/plugins/gas-forecast/capabilities/gas.dataset.build/run",
  "/api/v1/plugins/gas-forecast/capabilities/gas.dataset.build",
  "/api/v1/plugin-runtime/gas-forecast/capabilities/gas.dataset.build",
  "/api/v1/plugin-runtime/capabilities/gas.dataset.build?plugin=gas-forecast",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPathValue(source: unknown, path: readonly string[]) {
  let current: unknown = source;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function pickValue(source: unknown, paths: ReadonlyArray<readonly string[]>) {
  for (const path of paths) {
    const value = getPathValue(source, path);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

/**
 * Reads the first path whose value can be rendered as a string. Unlike a
 * naive "first defined value wins" lookup, this keeps trying later
 * candidate paths when an earlier one resolves to a non-scalar (e.g. a
 * nested error object such as `{ detail: { message: "..." } }`) so a
 * structured wrapper never silently swallows a usable string found deeper
 * in the candidate list.
 */
function pickString(
  source: unknown,
  paths: ReadonlyArray<readonly string[]>,
): string | null {
  for (const path of paths) {
    const value = getPathValue(source, path);

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }

  return null;
}

function pickNumber(
  source: unknown,
  paths: ReadonlyArray<readonly string[]>,
): number | null {
  for (const path of paths) {
    const value = getPathValue(source, path);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function pickArray(
  source: unknown,
  paths: ReadonlyArray<readonly string[]>,
): unknown[] {
  const value = pickValue(source, paths);
  return Array.isArray(value) ? value : [];
}

function pickProviderCard(providerId: GasForecastProviderId) {
  return (
    GAS_FORECAST_PROVIDER_CARDS.find((card) => card.id === providerId) ??
    GAS_FORECAST_PROVIDER_CARDS[0]
  );
}

const MAX_SAFE_TEXT_LENGTH = 2000;

/**
 * Masks credential-shaped values (API keys, `x-api-key`/`Authorization`
 * headers, bearer tokens, secrets) that may appear inside a DIP error body
 * or raw response text before it is surfaced to the UI or logged. DIP error
 * responses should never contain secrets, but this is a defensive
 * last-resort guard so a misbehaving upstream can never leak one through
 * the Observatory UI or diagnostics log.
 */
export function redactSecrets(text: string): string {
  return text
    .replace(
      /((?:x-)?api[-_]?key\s*[:=]\s*)("?)([^\s,"'&]+)("?)/gi,
      "$1$2[REDACTED]$4",
    )
    .replace(/(authorization\s*:\s*)(\S+)/gi, "$1[REDACTED]")
    .replace(/(bearer\s+)(\S+)/gi, "$1[REDACTED]")
    .replace(
      /("(?:api[_-]?key|token|secret)"\s*:\s*")([^"]*)(")/gi,
      "$1[REDACTED]$3",
    );
}

/**
 * Truncates a raw (non-JSON) DIP response body to a safe length for display
 * and logging, after redacting any credential-shaped substrings.
 */
export function toSafeRawBody(text: string): string {
  const redacted = redactSecrets(text);

  if (redacted.length <= MAX_SAFE_TEXT_LENGTH) {
    return redacted;
  }

  return `${redacted.slice(0, MAX_SAFE_TEXT_LENGTH)}… [truncated]`;
}

function toDisplayValue(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function findDatasetRows(payload: unknown) {
  return pickArray(payload, [
    ["sample"],
    ["dataset", "sample"],
    ["payload", "sample"],
    ["items"],
    ["data"],
    ["records"],
    ["dataset", "items"],
    ["dataset", "data"],
    ["dataset", "records"],
    ["payload", "items"],
    ["payload", "data"],
    ["payload", "records"],
    ["result", "items"],
    ["result", "data"],
    ["result", "records"],
  ]).filter(isRecord);
}

function readRecordField(
  row: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = toDisplayValue(row[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function extractDate(row: Record<string, unknown>) {
  return readRecordField(row, [
    "date",
    "gasDay",
    "gas_day",
    "gasDayStart",
    "gas_day_start",
    "day",
  ]);
}

function extractCountryOrFacility(
  payload: unknown,
  firstRow: Record<string, unknown> | undefined,
) {
  const explicit = pickString(payload, [
    ["dataset", "countryOrFacility"],
    ["countryOrFacility"],
    ["dataset", "country"],
    ["country"],
    ["dataset", "facility"],
    ["facility"],
    ["meta", "country"],
    ["meta", "facility"],
    ["metadata", "country"],
    ["metadata", "facility"],
  ]);

  if (explicit) {
    return explicit;
  }

  if (!firstRow) {
    return null;
  }

  const country = readRecordField(firstRow, ["country", "countryCode"]);
  const facility = readRecordField(firstRow, [
    "facility",
    "facilityName",
    "name",
  ]);

  if (country && facility) {
    return `${country} / ${facility}`;
  }

  return facility ?? country;
}

function buildSample(rows: Array<Record<string, unknown>>) {
  return rows.slice(0, 5).map((row) => ({
    date: extractDate(row),
    gasInStorage: readRecordField(row, [
      "gasInStorage",
      "gas_in_storage",
      "gasInStorageValue",
    ]),
    injection: readRecordField(row, [
      "injection",
      "injectionValue",
      "injection_volume",
    ]),
    withdrawal: readRecordField(row, [
      "withdrawal",
      "withdrawalValue",
      "withdrawal_volume",
    ]),
    workingGasVolume: readRecordField(row, [
      "workingGasVolume",
      "working_gas_volume",
      "workingGas",
    ]),
  }));
}

const ERROR_CONTAINER_PATHS: ReadonlyArray<readonly string[]> = [
  ["error"],
  ["detail"],
  [],
];

/**
 * Parses a DIP error response body into structured fields (error code,
 * provider/plugin identifiers, upstream HTTP status, execution/correlation
 * id) so the real DIP plugin/provider error is preserved instead of being
 * collapsed into a single generic string. Returns `null` when nothing
 * structured can be found (e.g. a plain string body). Never reads or
 * returns request headers or credentials — only fields already present in
 * the DIP response body.
 */
export function extractStructuredError(
  payload: unknown,
): GasForecastStructuredError | null {
  if (!isRecord(payload)) {
    return null;
  }

  const withContainer = (keys: readonly string[]) =>
    ERROR_CONTAINER_PATHS.map((prefix) => [...prefix, ...keys]);

  const code = pickString(payload, [
    ...withContainer(["code"]),
    ...withContainer(["errorCode"]),
    ...withContainer(["error_code"]),
  ]);

  const provider = pickString(payload, [
    ...withContainer(["provider", "name"]),
    ...withContainer(["provider"]),
    ...withContainer(["providerName"]),
    ...withContainer(["provider_name"]),
  ]);

  const plugin = pickString(payload, [
    ...withContainer(["plugin", "name"]),
    ...withContainer(["plugin"]),
    ...withContainer(["pluginId"]),
    ...withContainer(["plugin_id"]),
  ]);

  const upstreamStatus = pickNumber(payload, [
    ...withContainer(["upstreamStatus"]),
    ...withContainer(["upstream_status"]),
    ...withContainer(["providerStatus"]),
    ...withContainer(["provider_status"]),
  ]);

  const executionId = pickString(payload, [
    ...withContainer(["executionId"]),
    ...withContainer(["execution_id"]),
    ...withContainer(["correlationId"]),
    ...withContainer(["correlation_id"]),
    ...withContainer(["traceId"]),
    ...withContainer(["trace_id"]),
    ...withContainer(["requestId"]),
    ...withContainer(["request_id"]),
  ]);

  const rawBody = pickString(payload, [["rawBody"]]);

  if (
    code === null &&
    provider === null &&
    plugin === null &&
    upstreamStatus === null &&
    executionId === null &&
    rawBody === null
  ) {
    return null;
  }

  return { code, provider, plugin, upstreamStatus, executionId, rawBody };
}

export function getGasForecastErrorMessage(
  payload: unknown,
  httpStatus: number | null,
) {
  // Prefer the most specific/deepest cause message (e.g. the actual AGSI
  // upstream error) over a generic top-level wrapper message such as
  // "Plugin execution failed", so the real underlying error is never
  // discarded.
  const explicit = pickString(payload, [
    ["error", "cause", "message"],
    ["error", "upstreamError", "message"],
    ["error", "providerError", "message"],
    ["error", "originalError", "message"],
    ["cause", "message"],
    ["upstreamError", "message"],
    ["providerError", "message"],
    ["detail", "message"],
    ["detail"],
    ["message"],
    ["error", "message"],
    ["error"],
    ["title"],
    ["rawBody"],
  ]);

  if (httpStatus === 404 && explicit?.toLowerCase() === "not found") {
    return "Invalid API endpoint";
  }

  if (explicit) {
    return redactSecrets(explicit);
  }

  if (httpStatus === 401) {
    return "Invalid or missing API key";
  }

  if (httpStatus === 404) {
    return "Invalid API endpoint";
  }

  if (httpStatus === 503) {
    return "DIP gas forecast connectivity is not configured. Set DIP_API_KEY and either DIP_API_BASE_URL or an absolute DIP_GAS_FORECAST_CAPABILITY_PATH.";
  }

  return "Provider request failed";
}

/**
 * Classifies a gas forecast provider failure into a structured `kind` so the
 * UI can show the real failure category instead of a generic "Load failed".
 *
 * `stage` identifies where in the request lifecycle the failure happened when
 * no HTTP status is available (missing configuration, network-level fetch
 * failure, or response body parsing failure). When an HTTP status is
 * available, the payload is inspected for an explicit hint, then for
 * structured DIP error fields (code/provider/plugin/upstream status),
 * before falling back to status-code heuristics.
 */
export function classifyGasForecastFailureKind(params: {
  httpStatus: number | null;
  payload: unknown;
  stage?: "configuration" | "network" | "dip_http" | "parse" | null;
}): GasForecastFailureKind {
  const { httpStatus, payload, stage } = params;

  if (stage === "configuration") {
    return "configuration";
  }

  if (stage === "network") {
    return "network";
  }

  if (stage === "parse") {
    return "parse";
  }

  const hinted = pickString(payload, [
    ["kind"],
    ["errorKind"],
    ["error", "kind"],
    ["stage"],
    ["source"],
    ["error", "source"],
  ]);

  const validKinds: GasForecastFailureKind[] = [
    "configuration",
    "network",
    "dip_auth",
    "dip_http",
    "plugin_execution",
    "upstream_provider",
    "timeout",
    "parse",
    "unknown",
  ];

  if (hinted && (validKinds as string[]).includes(hinted)) {
    return hinted as GasForecastFailureKind;
  }

  if (httpStatus === null) {
    return "unknown";
  }

  // 401/403 responses mean the request never reached PluginRuntime/AGSI: DIP
  // itself rejected the DIP_API_KEY. Keep this distinct from generic
  // "dip_http" so the UI never masks an authentication failure as an
  // unrelated HTTP error.
  if (httpStatus === 401 || httpStatus === 403) {
    return "dip_auth";
  }

  const structuredError = extractStructuredError(payload);
  const structuredCode = structuredError?.code?.toLowerCase() ?? "";
  const errorText = pickString(payload, [
    ["error", "message"],
    ["message"],
    ["detail", "message"],
  ])?.toLowerCase();

  if (structuredError) {
    if (
      structuredCode.includes("timeout") ||
      errorText?.includes("timed out") ||
      errorText?.includes("timeout")
    ) {
      return "timeout";
    }

    // A structured error naming the upstream provider (or carrying its HTTP
    // status) means the plugin ran and the failure happened calling AGSI —
    // this must be surfaced as "upstream_provider", not folded into the
    // generic "dip_http" or "plugin_execution" buckets.
    if (structuredError.upstreamStatus !== null || structuredError.provider) {
      return "upstream_provider";
    }

    if (structuredError.plugin || structuredCode.includes("plugin")) {
      return "plugin_execution";
    }
  }

  if (httpStatus === 502 || httpStatus === 504) {
    return "upstream_provider";
  }

  if (httpStatus === 422) {
    return "plugin_execution";
  }

  if (httpStatus >= 400 && httpStatus < 600) {
    return "dip_http";
  }

  return "unknown";
}

export function mapGasForecastSuccess(params: {
  providerId: GasForecastProviderId;
  httpStatus: number;
  responseTimeMs: number | null;
  payload: unknown;
}) {
  const { providerId, httpStatus, payload, responseTimeMs } = params;
  const providerCard = pickProviderCard(providerId);
  const datasetRows = findDatasetRows(payload);
  const firstRow = datasetRows[0];
  const lastRow = datasetRows[datasetRows.length - 1];
  const provider =
    pickString(payload, [
      ["provider", "name"],
      ["providerName"],
      ["provider"],
      ["meta", "provider"],
      ["metadata", "provider"],
    ]) ?? providerCard.api ?? providerCard.title;
  const api =
    pickString(payload, [
      ["api"],
      ["provider", "api"],
      ["meta", "api"],
      ["metadata", "api"],
    ]) ?? providerCard.api;
  const records =
    pickNumber(payload, [
      ["dataset", "recordCount"],
      ["dataset", "recordsCount"],
      ["dataset", "records"],
      ["recordCount"],
      ["recordsCount"],
      ["records"],
      ["count"],
      ["total"],
    ]) ?? datasetRows.length;

  return {
    providerId,
    status: "connected",
    connection: "OK",
    httpStatus,
    provider,
    api,
    responseTimeMs,
    testedAt: new Date().toISOString(),
    message: null,
    dataset: {
      records,
      firstDate:
        pickString(payload, [
          ["dataset", "firstDate"],
          ["firstDate"],
          ["meta", "firstDate"],
          ["metadata", "firstDate"],
        ]) ?? (firstRow ? extractDate(firstRow) : null),
      lastDate:
        pickString(payload, [
          ["dataset", "lastDate"],
          ["lastDate"],
          ["meta", "lastDate"],
          ["metadata", "lastDate"],
        ]) ?? (lastRow ? extractDate(lastRow) : null),
      countryOrFacility: extractCountryOrFacility(payload, firstRow),
    },
    sample: buildSample(datasetRows),
  } satisfies GasForecastConnectionResult;
}

export function mapGasForecastFailure(params: {
  providerId: GasForecastProviderId;
  httpStatus: number | null;
  responseTimeMs: number | null;
  payload: unknown;
  fallbackMessage?: string;
  kind?: GasForecastFailureKind;
  stage?: "configuration" | "network" | "dip_http" | "parse" | null;
}) {
  const {
    providerId,
    httpStatus,
    payload,
    responseTimeMs,
    fallbackMessage,
    kind,
    stage,
  } = params;
  const providerCard = pickProviderCard(providerId);
  const structuredError = extractStructuredError(payload);

  return {
    providerId,
    status: "failed",
    connection: "FAILED",
    kind: kind ?? classifyGasForecastFailureKind({ httpStatus, payload, stage }),
    httpStatus,
    provider: structuredError?.provider ?? providerCard.api ?? providerCard.title,
    api: providerCard.api,
    responseTimeMs,
    testedAt: new Date().toISOString(),
    message: fallbackMessage ?? getGasForecastErrorMessage(payload, httpStatus),
    errorDetail: structuredError,
    dataset: null,
    sample: [],
  } satisfies GasForecastConnectionResult;
}
