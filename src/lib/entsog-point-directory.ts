const ENTSOG_OPERATOR_POINT_DIRECTIONS_URL =
  "https://transparency.entsog.eu/api/v1/operatorpointdirections";
const ENTSOG_PAGE_SIZE = 1_000;
const ENTSOG_MAX_PAGES = 100;

type EntsogOperatorPointDirectionRecord = Record<string, unknown>;

export type EntsogPointPreset = {
  value: string;
  label: string;
  pointKey: string;
  pointLabel: string;
  operatorKey: string;
  operatorLabel: string;
  directionKey: string;
  tsoCountry?: string;
  adjacentCountry?: string;
  pointType?: string;
};

export type EntsogPointDirectory = {
  presets: EntsogPointPreset[];
  totalRecords: number | null;
  retrievedRecords: number;
  duplicatePointDirectionValues: number;
};

function asRecord(value: unknown): EntsogOperatorPointDirectionRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as EntsogOperatorPointDirectionRecord)
    : null;
}

function readString(
  record: EntsogOperatorPointDirectionRecord,
  keys: string[],
): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return "";
}

function readNumber(record: EntsogOperatorPointDirectionRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readArray(
  payload: unknown,
): { records: EntsogOperatorPointDirectionRecord[]; totalRecords: number | null } {
  if (Array.isArray(payload)) {
    return {
      records: payload
        .map((item) => asRecord(item))
        .filter((item): item is EntsogOperatorPointDirectionRecord => item !== null),
      totalRecords: null,
    };
  }

  const record = asRecord(payload);
  if (!record) {
    return { records: [], totalRecords: null };
  }

  const listCandidate = [
    record.operatorpointdirections,
    record.operatorPointDirections,
    record.data,
    record.items,
    record.results,
  ].find((candidate) => Array.isArray(candidate));

  const records = Array.isArray(listCandidate)
    ? listCandidate
        .map((item) => asRecord(item))
        .filter((item): item is EntsogOperatorPointDirectionRecord => item !== null)
    : [];

  const totalRecords = readNumber(record, [
    "total",
    "totalRecords",
    "totalrecords",
    "count",
    "recordsTotal",
  ]);

  return { records, totalRecords };
}

function formatDirection(directionKey: string) {
  const normalized = directionKey.trim().toLowerCase();

  if (normalized === "entry") {
    return "Entry";
  }

  if (normalized === "exit") {
    return "Exit";
  }

  return directionKey
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function withCountry(label: string, country?: string) {
  if (!label) {
    return "";
  }

  if (!country) {
    return label;
  }

  const normalizedCountry = country.trim().toUpperCase();
  if (!normalizedCountry) {
    return label;
  }

  return label.includes(`(${normalizedCountry})`)
    ? label
    : `${label} (${normalizedCountry})`;
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

function toPreset(record: EntsogOperatorPointDirectionRecord): EntsogPointPreset | null {
  const value = readString(record, [
    "pointDirection",
    "pointDirectionKey",
    "operatorPointDirection",
    "operatorPointDirectionKey",
  ]);

  if (!value) {
    return null;
  }

  const pointKey = readString(record, ["pointKey", "pointEicCode", "pointCode"]);
  const pointLabel = readString(record, [
    "pointLabel",
    "pointLabelEN",
    "pointName",
    "point",
  ]);
  const operatorKey = readString(record, ["operatorKey", "operatorEicCode"]);
  const operatorLabel = readString(record, [
    "operatorLabel",
    "operatorLabelEN",
    "operatorShortLabel",
    "operatorName",
  ]);
  const directionKey = readString(record, ["directionKey", "flowDirection", "direction"]);
  const tsoCountry = readString(record, [
    "tsoCountry",
    "operatorCountry",
    "operatorCountryKey",
    "country",
  ]);
  const adjacentCountry = readString(record, [
    "adjacentCountry",
    "adjacentCountryKey",
    "adjacentSystemCountry",
  ]);
  const pointType = readString(record, ["pointType", "pointTypeLabel"]);
  const adjacentPointLabel = readString(record, [
    "adjacentPointLabel",
    "adjacentPointName",
    "connectedPointLabel",
    "adjacentSystemLabel",
  ]);

  const primaryLabel = pointLabel
    ? adjacentPointLabel
      ? `${withCountry(pointLabel, tsoCountry || undefined)} → ${withCountry(adjacentPointLabel, adjacentCountry || undefined)}`
      : withCountry(pointLabel, tsoCountry || undefined)
    : pointKey;

  const labelParts = uniqueStrings([
    primaryLabel,
    operatorLabel || operatorKey,
    directionKey ? formatDirection(directionKey) : "",
  ]);

  if (labelParts.length === 0) {
    return null;
  }

  return {
    value,
    label: labelParts.join(" · "),
    pointKey,
    pointLabel,
    operatorKey,
    operatorLabel,
    directionKey,
    tsoCountry: tsoCountry || undefined,
    adjacentCountry: adjacentCountry || undefined,
    pointType: pointType || undefined,
  };
}

function sortPresets(presets: EntsogPointPreset[]) {
  return [...presets].sort((a, b) => {
    const compareKeys = [
      a.tsoCountry ?? "",
      a.adjacentCountry ?? "",
      a.pointLabel || a.pointKey,
      a.operatorLabel || a.operatorKey,
      a.directionKey,
      a.value,
    ];
    const otherKeys = [
      b.tsoCountry ?? "",
      b.adjacentCountry ?? "",
      b.pointLabel || b.pointKey,
      b.operatorLabel || b.operatorKey,
      b.directionKey,
      b.value,
    ];

    for (let index = 0; index < compareKeys.length; index += 1) {
      const compared = compareKeys[index]!.localeCompare(otherKeys[index]!, undefined, {
        sensitivity: "base",
      });
      if (compared !== 0) {
        return compared;
      }
    }

    return 0;
  });
}

async function fetchPage(offset: number) {
  const url = new URL(ENTSOG_OPERATOR_POINT_DIRECTIONS_URL);
  url.searchParams.set("hasData", "1");
  url.searchParams.set("limit", String(ENTSOG_PAGE_SIZE));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`ENTSOG directory request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as unknown;
  return readArray(payload);
}

export async function fetchEntsogPointDirectory(): Promise<EntsogPointDirectory> {
  const rawRecords: EntsogOperatorPointDirectionRecord[] = [];
  let totalRecords: number | null = null;

  for (let page = 0; page < ENTSOG_MAX_PAGES; page += 1) {
    const offset = page * ENTSOG_PAGE_SIZE;
    const { records, totalRecords: pageTotalRecords } = await fetchPage(offset);

    if (totalRecords === null && pageTotalRecords !== null) {
      totalRecords = pageTotalRecords;
    }

    if (records.length === 0) {
      break;
    }
    rawRecords.push(...records);

    if (totalRecords !== null && offset + ENTSOG_PAGE_SIZE >= totalRecords) {
      break;
    }

    if (records.length < ENTSOG_PAGE_SIZE && totalRecords === null) {
      break;
    }
  }

  const presets: EntsogPointPreset[] = [];
  const seenPointDirections = new Set<string>();
  let duplicatePointDirectionValues = 0;

  for (const record of rawRecords) {
    const preset = toPreset(record);
    if (!preset) {
      continue;
    }

    if (seenPointDirections.has(preset.value)) {
      duplicatePointDirectionValues += 1;
      continue;
    }

    seenPointDirections.add(preset.value);
    presets.push(preset);
  }

  return {
    presets: sortPresets(presets),
    totalRecords,
    retrievedRecords: rawRecords.length,
    duplicatePointDirectionValues,
  };
}
