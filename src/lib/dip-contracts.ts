import { z } from "zod";

const dipScalarSchema = z.union([z.number(), z.string(), z.boolean()]);

export const dipConditionEvidenceSchema = z.object({
  feature: z.string(),
  operator: z.string(),
  threshold: z.union([dipScalarSchema, z.array(dipScalarSchema)]),
  actual_value: dipScalarSchema.nullable(),
  passed: z.boolean(),
});

export const dipRuleExecutionTraceSchema = z.object({
  rule_name: z.string(),
  matched: z.boolean(),
  conditions_total: z.number(),
  conditions_matched: z.number(),
  evidence: z.array(dipConditionEvidenceSchema).default([]),
});

export const dipObservatoryApiStateAxisSchema = z.object({
  key: z.string(),
  label: z.string(),
});

export const dipObservatoryApiInputFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(["number", "boolean", "text"]),
  default_value: dipScalarSchema,
  required: z.boolean().default(true),
  hint: z.string().nullable().default(null),
  min_value: z.number().nullable().default(null),
  max_value: z.number().nullable().default(null),
  step: z.number().nullable().default(null),
});

export const dipObservatoryApiScenarioPresetSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  entity_id: z.string().nullable().default(null),
  features: z.record(z.string(), dipScalarSchema),
});

export const dipObservatoryApiScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  domain: z.string(),
  model_id: z.string(),
  dataset_id: z.string().nullable().default(null),
  state_axes: z.array(dipObservatoryApiStateAxisSchema).default([]),
  fields: z.array(dipObservatoryApiInputFieldSchema).default([]),
  presets: z.array(dipObservatoryApiScenarioPresetSchema).default([]),
});

export const dipObservatoryApiScenariosResponseSchema = z.object({
  items: z.array(dipObservatoryApiScenarioSchema).default([]),
  version: z.string().default("1.0"),
});

export const dipObservatoryApiStateRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
});

export const dipObservatoryApiStateSnapshotSchema = z.object({
  label: z.string(),
  summary: z.string(),
  values: z.record(z.string(), z.number()),
});

export const dipObservatoryApiUncertaintySchema = z.object({
  score: z.number(),
  label: z.enum(["low", "medium", "high"]),
  interval_low: z.number(),
  interval_high: z.number(),
});

export const dipObservatoryApiTrajectorySchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["current", "predicted", "optimistic", "conservative"]),
  state: dipObservatoryApiStateSnapshotSchema,
  risk: z.number(),
  confidence: z.number(),
  uncertainty: z.number(),
  decision: z.string().nullable().default(null),
  outcome: z.string(),
});

export const dipObservatoryApiAlternativeDecisionSchema = z.object({
  decision: z.string(),
  outcome: z.string(),
  risk: z.number(),
  confidence: z.number(),
  rationale: z.string(),
  rank: z.number(),
  selected: z.boolean().default(false),
});

export const dipObservatoryApiRunResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  entity_id: z.string().nullable().default(null),
  input_features: z.record(z.string(), dipScalarSchema),
  prediction: z.number(),
  decision: z.string(),
  matched_rule: z.string(),
  confidence: z.number(),
  uncertainty: dipObservatoryApiUncertaintySchema,
  risk: z.number(),
  system_stability: z.number(),
  propagation_risk: z.number(),
  current_state: dipObservatoryApiStateSnapshotSchema,
  predicted_state: dipObservatoryApiStateSnapshotSchema,
  feasible_state_space: z.record(z.string(), dipObservatoryApiStateRangeSchema),
  trajectories: z.array(dipObservatoryApiTrajectorySchema).default([]),
  alternative_decisions: z
    .array(dipObservatoryApiAlternativeDecisionSchema)
    .default([]),
  rule_traces: z.array(dipRuleExecutionTraceSchema).default([]),
  explanation: z.array(z.string()).default([]),
  execution_time_ms: z.number(),
});

export const dipObservatoryApiRunResponseSchema = z.object({
  scenario: dipObservatoryApiScenarioSchema,
  executed_at: z.string(),
  results: z.array(dipObservatoryApiRunResultSchema).default([]),
  warnings: z.array(z.string()).default([]),
  version: z.string().default("1.0"),
});

export const observatoryStateAxisSchema = z.object({
  key: z.string(),
  label: z.string(),
});

export const observatoryInputFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(["number", "boolean", "text"]),
  defaultValue: dipScalarSchema,
  required: z.boolean().default(true),
  hint: z.string().nullable().default(null),
  minValue: z.number().nullable().default(null),
  maxValue: z.number().nullable().default(null),
  step: z.number().nullable().default(null),
});

export const observatoryScenarioPresetSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  entityId: z.string().nullable().default(null),
  features: z.record(z.string(), dipScalarSchema),
});

export const observatoryScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  domain: z.string(),
  modelId: z.string(),
  datasetId: z.string().nullable().default(null),
  stateAxes: z.array(observatoryStateAxisSchema).default([]),
  fields: z.array(observatoryInputFieldSchema).default([]),
  presets: z.array(observatoryScenarioPresetSchema).default([]),
});

export const observatoryAlternativeInputSchema = z.object({
  id: z.string(),
  label: z.string(),
  entityId: z.string().nullable().default(null),
  features: z.record(z.string(), dipScalarSchema),
});

export const observatoryRunRequestSchema = z.object({
  scenarioId: z.string(),
  alternatives: z.array(observatoryAlternativeInputSchema).min(1).max(4),
});

export const observatoryStateRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
});

export const observatoryStateSnapshotSchema = z.object({
  label: z.string(),
  summary: z.string(),
  values: z.record(z.string(), z.number()),
});

export const observatoryUncertaintySchema = z.object({
  score: z.number(),
  label: z.enum(["low", "medium", "high"]),
  intervalLow: z.number(),
  intervalHigh: z.number(),
});

export const observatoryTrajectorySchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["current", "predicted", "optimistic", "conservative"]),
  state: observatoryStateSnapshotSchema,
  risk: z.number(),
  confidence: z.number(),
  uncertainty: z.number(),
  decision: z.string().nullable().default(null),
  outcome: z.string(),
});

export const observatoryAlternativeDecisionSchema = z.object({
  decision: z.string(),
  outcome: z.string(),
  risk: z.number(),
  confidence: z.number(),
  rationale: z.string(),
  rank: z.number(),
  selected: z.boolean().default(false),
});

export const observatoryRunResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  entityId: z.string().nullable().default(null),
  inputFeatures: z.record(z.string(), dipScalarSchema),
  prediction: z.number(),
  decision: z.string(),
  matchedRule: z.string(),
  confidence: z.number(),
  uncertainty: observatoryUncertaintySchema,
  risk: z.number(),
  systemStability: z.number(),
  propagationRisk: z.number(),
  currentState: observatoryStateSnapshotSchema,
  predictedState: observatoryStateSnapshotSchema,
  feasibleStateSpace: z.record(z.string(), observatoryStateRangeSchema),
  trajectories: z.array(observatoryTrajectorySchema).default([]),
  alternativeDecisions: z
    .array(observatoryAlternativeDecisionSchema)
    .default([]),
  ruleTraces: z.array(dipRuleExecutionTraceSchema).default([]),
  explanation: z.array(z.string()).default([]),
  executionTimeMs: z.number(),
});

export const observatoryRunResponseSchema = z.object({
  scenario: observatoryScenarioSchema,
  executedAt: z.string(),
  results: z.array(observatoryRunResultSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export const observatoryDemoModeSchema = z.object({
  enabled: z.boolean(),
  label: z.string(),
  scenarioId: z.string().nullable().default(null),
  lockScenario: z.boolean().default(false),
  lockAlternatives: z.boolean().default(false),
});

export const observatoryBootstrapPayloadSchema = z.object({
  connection: z.object({
    configured: z.boolean(),
    healthy: z.boolean(),
    baseUrl: z.string().nullable(),
    scenarioCatalogAvailable: z.boolean(),
    runSurfaceAvailable: z.boolean(),
  }),
  demoMode: observatoryDemoModeSchema,
  scenarios: z.array(observatoryScenarioSchema).default([]),
  selectedScenarioId: z.string().nullable().default(null),
  warnings: z.array(z.string()).default([]),
});

export type DipScalar = z.infer<typeof dipScalarSchema>;
export type DipConditionEvidence = z.infer<typeof dipConditionEvidenceSchema>;
export type DipRuleExecutionTrace = z.infer<typeof dipRuleExecutionTraceSchema>;
export type DipObservatoryApiInputField = z.infer<
  typeof dipObservatoryApiInputFieldSchema
>;
export type DipObservatoryApiScenarioPreset = z.infer<
  typeof dipObservatoryApiScenarioPresetSchema
>;
export type DipObservatoryApiScenario = z.infer<
  typeof dipObservatoryApiScenarioSchema
>;
export type DipObservatoryApiRunResult = z.infer<
  typeof dipObservatoryApiRunResultSchema
>;
export type DipObservatoryApiRunResponse = z.infer<
  typeof dipObservatoryApiRunResponseSchema
>;
export type ObservatoryStateAxis = z.infer<typeof observatoryStateAxisSchema>;
export type ObservatoryInputField = z.infer<typeof observatoryInputFieldSchema>;
export type ObservatoryScenarioPreset = z.infer<
  typeof observatoryScenarioPresetSchema
>;
export type ObservatoryScenario = z.infer<typeof observatoryScenarioSchema>;
export type ObservatoryAlternativeInput = z.infer<
  typeof observatoryAlternativeInputSchema
>;
export type ObservatoryRunRequest = z.infer<typeof observatoryRunRequestSchema>;
export type ObservatoryStateRange = z.infer<typeof observatoryStateRangeSchema>;
export type ObservatoryStateSnapshot = z.infer<
  typeof observatoryStateSnapshotSchema
>;
export type ObservatoryUncertainty = z.infer<
  typeof observatoryUncertaintySchema
>;
export type ObservatoryTrajectory = z.infer<typeof observatoryTrajectorySchema>;
export type ObservatoryAlternativeDecision = z.infer<
  typeof observatoryAlternativeDecisionSchema
>;
export type ObservatoryRunResult = z.infer<typeof observatoryRunResultSchema>;
export type ObservatoryRunResponse = z.infer<
  typeof observatoryRunResponseSchema
>;
export type ObservatoryDemoMode = z.infer<typeof observatoryDemoModeSchema>;
export type ObservatoryBootstrapPayload = z.infer<
  typeof observatoryBootstrapPayloadSchema
>;
