// Static presets generated from a captured ENTSOG operatorpointdirections
// hasData=1 response snapshot because live transparency.entsog.eu access is
// unavailable in this sandbox.
export interface EntsogPointPreset {
  value: string;
  label: string;
  pointLabel: string;
  operatorLabel: string;
  direction: string;
  tsoCountry?: string;
  adjacentCountry?: string;
}

type EntsogPointPresetSource = Omit<EntsogPointPreset, "value" | "label"> & {
  operatorKey: string;
  pointKey: string;
};

const ENTSOG_POINT_PRESET_SOURCE: readonly EntsogPointPresetSource[] = [
  {
    operatorKey: "AL-TSO-0001",
    pointKey: "ITP-00008",
    pointLabel: "Melendugno - IT / TAP",
    operatorLabel: "TAP",
    direction: "entry",
    tsoCountry: "CH",
    adjacentCountry: "IT",
  },
  {
    operatorKey: "AL-TSO-0001",
    pointKey: "ITP-00008",
    pointLabel: "Melendugno - IT / TAP",
    operatorLabel: "TAP",
    direction: "exit",
    tsoCountry: "CH",
    adjacentCountry: "IT",
  },
  {
    operatorKey: "AL-TSO-0001",
    pointKey: "ITP-00274",
    pointLabel: "Kipoi",
    operatorLabel: "TAP",
    direction: "entry",
    tsoCountry: "CH",
    adjacentCountry: "TR",
  },
  {
    operatorKey: "AL-TSO-0001",
    pointKey: "ITP-00274",
    pointLabel: "Kipoi",
    operatorLabel: "TAP",
    direction: "exit",
    tsoCountry: "CH",
    adjacentCountry: "TR",
  },
  {
    operatorKey: "AL-TSO-0001",
    pointKey: "ITP-00427",
    pointLabel: "Nea Mesimvria",
    operatorLabel: "TAP",
    direction: "entry",
    tsoCountry: "CH",
    adjacentCountry: "GR",
  },
  {
    operatorKey: "AL-TSO-0001",
    pointKey: "ITP-00427",
    pointLabel: "Nea Mesimvria",
    operatorLabel: "TAP",
    direction: "exit",
    tsoCountry: "CH",
    adjacentCountry: "GR",
  },
  {
    operatorKey: "AL-TSO-0001",
    pointKey: "VTP-00044",
    pointLabel: "TAP Virtual Trading Point",
    operatorLabel: "TAP",
    direction: "entry",
    tsoCountry: "CH",
    adjacentCountry: "GR",
  },
  {
    operatorKey: "AL-TSO-0001",
    pointKey: "VTP-00044",
    pointLabel: "TAP Virtual Trading Point",
    operatorLabel: "TAP",
    direction: "exit",
    tsoCountry: "CH",
    adjacentCountry: "GR",
  },
] as const;

function formatDirection(direction: string) {
  return direction.charAt(0).toUpperCase() + direction.slice(1).toLowerCase();
}

function toPointDirectionValue({
  operatorKey,
  pointKey,
  direction,
}: Pick<EntsogPointPresetSource, "operatorKey" | "pointKey" | "direction">) {
  return `${operatorKey}${pointKey}${direction}`.toLowerCase();
}

function toPreset(source: EntsogPointPresetSource): EntsogPointPreset {
  return {
    value: toPointDirectionValue(source),
    label: `${source.pointLabel} · ${source.operatorLabel} · ${formatDirection(source.direction)}`,
    pointLabel: source.pointLabel,
    operatorLabel: source.operatorLabel,
    direction: source.direction,
    tsoCountry: source.tsoCountry,
    adjacentCountry: source.adjacentCountry,
  };
}

function sortPresets(presets: readonly EntsogPointPreset[]) {
  return [...presets].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

export const ENTSOG_POINT_PRESETS: readonly EntsogPointPreset[] = sortPresets(
  ENTSOG_POINT_PRESET_SOURCE.map(toPreset),
);
