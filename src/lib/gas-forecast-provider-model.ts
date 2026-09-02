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
  httpStatus: number | null;
  provider: string;
  api: string | null;
  responseTimeMs: number | null;
  testedAt: string;
  message: string | null;
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

function pickString(
  source: unknown,
  paths: ReadonlyArray<readonly string[]>,
): string | null {
  const value = pickValue(source, paths);

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function pickNumber(
  source: unknown,
  paths: ReadonlyArray<readonly string[]>,
): number | null {
  const value = pickValue(source, paths);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
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

export function getGasForecastErrorMessage(
  payload: unknown,
  httpStatus: number | null,
) {
  const explicit = pickString(payload, [
    ["detail"],
    ["message"],
    ["error", "message"],
    ["error"],
    ["title"],
  ]);

  if (httpStatus === 404 && explicit?.toLowerCase() === "not found") {
    return "Invalid API endpoint";
  }

  if (explicit) {
    return explicit;
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
}) {
  const { providerId, httpStatus, payload, responseTimeMs, fallbackMessage } =
    params;
  const providerCard = pickProviderCard(providerId);

  return {
    providerId,
    status: "failed",
    connection: "FAILED",
    httpStatus,
    provider: providerCard.api ?? providerCard.title,
    api: providerCard.api,
    responseTimeMs,
    testedAt: new Date().toISOString(),
    message: fallbackMessage ?? getGasForecastErrorMessage(payload, httpStatus),
    dataset: null,
    sample: [],
  } satisfies GasForecastConnectionResult;
}
