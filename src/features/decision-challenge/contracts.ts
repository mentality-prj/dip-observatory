import { z } from 'zod'

const assignmentSchema = z.record(z.string(), z.string().nullable())

export const challengeDefinitionSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  scenario: z.record(z.string(), z.unknown()),
  limitations: z.array(z.string()).default([]),
})

export const actionValidationSchema = z.object({
  feasible: z.boolean(),
  violations: z.array(z.string()).default([]),
})

const actionEvaluationSchema = z.object({
  feasible: z.boolean(),
  score: z.number().nullable().optional(),
  metrics: z.record(z.string(), z.number()).default({}),
  demand_summary: z.record(z.string(), z.unknown()).nullable().optional(),
  economic_inputs: z.record(z.string(), z.number()).default({}),
  constraint_violations: z.array(z.string()).default([]),
  evidence: z.array(z.record(z.string(), z.unknown())).default([]),
  evaluation_reproducibility: z.object({
    evaluator_id: z.string(),
    evaluator_version: z.string(),
    context_hash: z.string(),
    random_seed: z.number().nullable().optional(),
    sample_set_ref: z.string().nullable().optional(),
    common_random_numbers: z.boolean(),
  }),
  data_quality_warnings: z.array(z.string()).default([]),
})

const objectiveSchema = z.object({
  objective_id: z.string(),
  metric_id: z.string(),
  direction: z.string(),
  unit: z.string(),
  currency: z.string().nullable().optional(),
})

const economicOutcomeSchema = z.object({
  policy_id: z.string(),
  policy_version: z.string(),
  decision_id: z.string(),
  objective: objectiveSchema,
  nominal_value: z.number(),
  expected_value: z.number().nullable().optional(),
  downside_value: z.number().nullable().optional(),
  worst_case_observed_value: z.number().nullable().optional(),
  worst_case_value: z.number().nullable().optional(),
  realized_value: z.number().nullable().optional(),
})

const comparisonSchema = z.object({
  delta: z.object({
    nominal_delta: z.number(),
    expected_delta: z.number().nullable().optional(),
    downside_delta: z.number().nullable().optional(),
    worst_case_observed_delta: z.number().nullable().optional(),
    worst_case_delta: z.number().nullable().optional(),
    realized_delta: z.number().nullable().optional(),
  }),
}).passthrough()

const resultSchema = z.object({
  snapshot_id: z.string(),
  snapshot_hash: z.string(),
  problem_id: z.string(),
  problem_hash: z.string(),
  human_action_hash: z.string(),
  qdip_action: assignmentSchema,
  qdip_action_hash: z.string(),
  human_evaluation: actionEvaluationSchema,
  qdip_evaluation: actionEvaluationSchema,
  optimizer_score: z.number(),
  human_economic_outcome: economicOutcomeSchema,
  qdip_economic_outcome: economicOutcomeSchema,
  economic_comparison: comparisonSchema,
  available_economic_metrics: z.array(z.string()),
  explanation: z.array(z.record(z.string(), z.unknown())).default([]),
  reproducibility: z.object({
    solver: z.string(),
    solver_version: z.string(),
    solver_config: z.record(z.string(), z.unknown()),
    solver_config_hash: z.string(),
    deterministic: z.boolean(),
    random_seed: z.number().nullable().optional(),
    reproducibility_token: z.string(),
  }),
  data_quality_warnings: z.array(z.string()).default([]),
})

export const challengeRunSchema = z.object({
  id: z.string(),
  challenge_id: z.string(),
  challenge_version: z.string(),
  status: z.enum(['DECIDING', 'LOCKED', 'COMPLETED', 'FAILED']),
  snapshot: z.object({
    snapshot_id: z.string(),
    snapshot_hash: z.string(),
    problem_id: z.string(),
    problem_hash: z.string(),
    problem: z.record(z.string(), z.unknown()),
    evidence_refs: z.array(z.string()).default([]),
    evidence_revision: z.string(),
    economic_model_hash: z.string(),
    model_versions_hash: z.string(),
    created_at: z.string(),
  }),
  submission_id: z.string().nullable().optional(),
  human_action_hash: z.string().nullable().optional(),
  result: resultSchema.nullable().optional(),
  failure_code: z.string().nullable().optional(),
  failure_message: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ChallengeDefinition = z.infer<typeof challengeDefinitionSchema>
export type ChallengeRun = z.infer<typeof challengeRunSchema>
export type ActionValidation = z.infer<typeof actionValidationSchema>
export type ChallengeAssignment = z.infer<typeof assignmentSchema>
