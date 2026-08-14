import {
  observatoryBootstrapPayloadSchema,
  observatoryRunResponseSchema,
  type DipObservatoryApiInputField,
  type DipObservatoryApiRunResponse,
  type DipObservatoryApiRunResult,
  type DipObservatoryApiScenario,
  type DipObservatoryApiScenarioPreset,
  type ObservatoryBootstrapPayload,
  type ObservatoryInputField,
  type ObservatoryRunResponse,
  type ObservatoryRunResult,
  type ObservatoryScenario,
} from "@/lib/dip-contracts";

type DemoConfig = {
  enabledRaw?: string;
  scenarioIdRaw?: string;
  labelRaw?: string;
};

type BootstrapParams = {
  connection: {
    configured: boolean;
    healthy: boolean;
    baseUrl: string | null;
    scenarioCatalogAvailable: boolean;
    runSurfaceAvailable: boolean;
  };
  apiScenarios: DipObservatoryApiScenario[];
  warnings?: string[];
  demoConfig?: DemoConfig;
};

function isTruthy(value: string | undefined) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function mapScenarioField(
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

export function mapScenarioPreset(preset: DipObservatoryApiScenarioPreset) {
  return {
    id: preset.id,
    label: preset.label,
    description: preset.description,
    entityId: preset.entity_id,
    features: preset.features,
  };
}

export function mapScenario(
  scenario: DipObservatoryApiScenario,
): ObservatoryScenario {
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

export function mapRunResult(
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

export function mapRunResponse(
  response: DipObservatoryApiRunResponse,
): ObservatoryRunResponse {
  return observatoryRunResponseSchema.parse({
    scenario: mapScenario(response.scenario),
    executedAt: response.executed_at,
    results: response.results.map(mapRunResult),
    warnings: response.warnings,
  });
}

export function buildObservatoryBootstrapPayload({
  connection,
  apiScenarios,
  warnings = [],
  demoConfig,
}: BootstrapParams): ObservatoryBootstrapPayload {
  const scenarios = apiScenarios.map(mapScenario);
  const demoModeEnabled = isTruthy(demoConfig?.enabledRaw);
  const requestedScenarioId = demoConfig?.scenarioIdRaw?.trim() || null;
  const scenarioId = demoModeEnabled
    ? scenarios.some((scenario) => scenario.id === requestedScenarioId)
      ? requestedScenarioId
      : (scenarios[0]?.id ?? null)
    : null;
  const nextWarnings = [...warnings];

  if (
    demoModeEnabled &&
    requestedScenarioId &&
    requestedScenarioId !== scenarioId
  ) {
    nextWarnings.push(
      `Requested demo scenario ${requestedScenarioId} was not found. Falling back to ${scenarioId ?? "the first available scenario"}.`,
    );
  }

  return observatoryBootstrapPayloadSchema.parse({
    connection,
    demoMode: {
      enabled: demoModeEnabled,
      label: demoConfig?.labelRaw?.trim() || "Deterministic Demo",
      scenarioId,
      lockScenario: demoModeEnabled,
      lockAlternatives: demoModeEnabled,
    },
    scenarios,
    selectedScenarioId: scenarioId ?? scenarios[0]?.id ?? null,
    warnings: nextWarnings,
  });
}
