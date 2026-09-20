export type ResearchEvidence = {
  experimentVersion: "v0.3";
  researchGate: string;
  procurementEligible: boolean;
  procurementReason: string | null;
  baselineLastMae: number | null;
  ridgeMae: number | null;
  fallbackRate: number | null;
  leakageControls: string[];
};

export const V04_PROTOCOL = {
  version: "v0.4",
  hypothesis:
    "Using only information available at decision time, can QDIP produce procurement decisions with lower out-of-sample economic cost/regret than predefined non-forecasting procurement baselines?",
  evidence: ["Direction", "Conditional magnitude", "Uncertainty"],
  alternatives: ["BUY NOW", "WAIT"],
  primaryMetrics: ["Cost €/MWh", "Savings vs baseline", "Regret vs oracle", "Worst-case regret"],
  diagnosticMetrics: ["Balanced accuracy", "ROC AUC", "Brier score", "MAE", "RMSE"],
} as const;

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : null;
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function deriveResearchEvidence(payload: unknown): ResearchEvidence | null {
  const root = record(payload);
  const backtest = record(root?.backtest);
  const procurement = record(root?.procurement);
  if (!root || !backtest || !procurement) return null;

  const strategy = record(procurement.strategy);
  const gate = record(backtest.magnitude_gate);
  const rawRidge = record(backtest.raw_ridge_metrics);
  const metrics = Array.isArray(backtest.metrics) ? backtest.metrics : [];
  const baseline = metrics.map(record).find((entry) => entry?.model === "baseline_last") ?? null;
  const researchGate = record(backtest.magnitude_variants)?.research_gate;
  const leakageControls = Array.isArray(backtest.leakage_controls)
    ? backtest.leakage_controls.filter((item): item is string => typeof item === "string")
    : [];

  return {
    experimentVersion: "v0.3",
    researchGate: typeof researchGate === "string" ? researchGate : "FAIL",
    procurementEligible: strategy?.procurement_eligible === true,
    procurementReason: typeof strategy?.reason === "string" ? strategy.reason : null,
    baselineLastMae: number(baseline?.mae),
    ridgeMae: number(rawRidge?.mae),
    fallbackRate: number(gate?.fallback_rate),
    leakageControls,
  };
}
