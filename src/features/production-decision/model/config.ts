import type { ProductionInputs, ProductionInputKey } from "./contracts";

export const DEFAULT_PRODUCTION_INPUTS: ProductionInputs = {
  demand_change: 7,
  material_availability: 82,
  production_capacity: 86,
  machine_availability: 94,
};

export const PRODUCTION_INPUTS: {
  key: ProductionInputKey;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
  description: string;
}[] = [
  { key: "demand_change", label: "Demand change", min: -15, max: 15, step: 0.5, suffix: "%", description: "Change against the current demand plan" },
  { key: "material_availability", label: "Material availability", min: 50, max: 100, step: 1, suffix: "%", description: "Available critical production material" },
  { key: "production_capacity", label: "Production capacity", min: 60, max: 100, step: 1, suffix: "%", description: "Capacity available in the planning horizon" },
  { key: "machine_availability", label: "Machine availability", min: 60, max: 100, step: 1, suffix: "%", description: "Expected available machine time" },
];

export const PRODUCTION_FEATURE_LABELS: Record<string, string> = {
  demand_pressure: "Demand pressure",
  material_risk: "Material risk",
  capacity_risk: "Capacity risk",
  machine_risk: "Machine risk",
};

export function formatProductionPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
