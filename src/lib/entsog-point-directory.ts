export interface EntsogPointPreset {
  value: string;
  label: string;
  pointLabel: string;
  operatorLabel: string;
  direction: string;
  tsoCountry?: string;
  adjacentCountry?: string;
}

export const ENTSOG_POINT_PRESETS: ReadonlyArray<EntsogPointPreset> = [
  {
    value: "5AL-TSO-0001ITP-00008entryIT-TSO-0001",
    label: "Melendugno - IT / TAP (CH) · TAP · Entry",
    pointLabel: "Melendugno - IT / TAP",
    operatorLabel: "TAP",
    direction: "Entry",
    tsoCountry: "CH",
    adjacentCountry: "IT",
  },
  {
    value: "5AL-TSO-0001ITP-00008exitIT-TSO-0001",
    label: "Melendugno - IT / TAP (CH) · TAP · Exit",
    pointLabel: "Melendugno - IT / TAP",
    operatorLabel: "TAP",
    direction: "Exit",
    tsoCountry: "CH",
    adjacentCountry: "IT",
  },
  {
    value: "5AL-TSO-0001ITP-00274entryTR-TSO-0002",
    label: "Kipoi (CH) · TAP · Entry",
    pointLabel: "Kipoi",
    operatorLabel: "TAP",
    direction: "Entry",
    tsoCountry: "CH",
    adjacentCountry: "TR",
  },
  {
    value: "5AL-TSO-0001ITP-00427entryGR-TSO-0001",
    label: "Nea Mesimvria (CH) · TAP · Entry",
    pointLabel: "Nea Mesimvria",
    operatorLabel: "TAP",
    direction: "Entry",
    tsoCountry: "CH",
    adjacentCountry: "GR",
  },
  {
    value: "5AL-TSO-0001ITP-00427exitGR-TSO-0001",
    label: "Nea Mesimvria (CH) · TAP · Exit",
    pointLabel: "Nea Mesimvria",
    operatorLabel: "TAP",
    direction: "Exit",
    tsoCountry: "CH",
    adjacentCountry: "GR",
  },
  {
    value: "5AL-TSO-0001VTP-00044entry",
    label: "TAP Virtual Trading Point (CH) · TAP · Entry",
    pointLabel: "TAP Virtual Trading Point",
    operatorLabel: "TAP",
    direction: "Entry",
    tsoCountry: "CH",
    adjacentCountry: "GR",
  },
  {
    value: "5AL-TSO-0001VTP-00044exit",
    label: "TAP Virtual Trading Point (CH) · TAP · Exit",
    pointLabel: "TAP Virtual Trading Point",
    operatorLabel: "TAP",
    direction: "Exit",
    tsoCountry: "CH",
    adjacentCountry: "GR",
  },
] as const;

export type EntsogPointDirectory = {
  presets: EntsogPointPreset[];
  totalRecords: number;
  retrievedRecords: number;
  duplicatePointDirectionValues: number;
};

export const ENTSOG_POINT_PRESET_SOURCE = {
  sourceUrl: "https://transparency.entsog.eu/api/v1/operatorpointdirections?hasData=1",
  sourceSnapshotRepository: "jo20ow/Obsyd",
  sourceSnapshotPath: "backend/tests/fixtures/gas/entsog_pointdirections.json",
  sourceSnapshotSha: "7813dfcf5207404e4eb7c155679b2c5cd7afd258",
  sourceTotalRecords: 8,
  sourceHasDataRecords: 7,
} as const;

export function getEntsogPointDirectory(): EntsogPointDirectory {
  return {
    presets: [...ENTSOG_POINT_PRESETS],
    totalRecords: ENTSOG_POINT_PRESET_SOURCE.sourceTotalRecords,
    retrievedRecords: ENTSOG_POINT_PRESET_SOURCE.sourceHasDataRecords,
    duplicatePointDirectionValues: 0,
  };
}

export async function fetchEntsogPointDirectory(): Promise<EntsogPointDirectory> {
  return getEntsogPointDirectory();
}
