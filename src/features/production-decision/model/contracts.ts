export type ProductionInputKey =
  | "demand_change"
  | "material_availability"
  | "production_capacity"
  | "machine_availability";

export type ProductionInputs = Record<ProductionInputKey, number>;

export type ProductionDecisionResult = {
  decision: string;
  action: string;
  risk: number;
  confidence: number;
  uncertainty: number;
  state: Record<string, number>;
  drivers: { feature: string; value: number }[];
  explanation: string[];
  model_version: string;
  execution_time_ms: number;
};

export type ProductionDecisionHistoryItem = {
  id: number;
  inputs: ProductionInputs;
  result: ProductionDecisionResult;
};
