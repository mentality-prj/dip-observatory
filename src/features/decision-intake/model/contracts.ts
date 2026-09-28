import { z } from 'zod'

export const semanticStatusSchema = z.enum([
  'inferred',
  'user_confirmed',
  'data_validated',
  'evidence_supported',
  'rejected',
])
export const availabilitySchema = z.enum(['available', 'not_available', 'unknown'])
export const evidenceGateSchema = z.object({
  status: z.enum([
    'no_opportunity',
    'discovered',
    'ready_for_decision',
    'ready_for_historical_evaluation',
    'needs_more_data',
    'needs_prospective_pilot',
    'invalid',
  ]),
  reasons: z.array(z.string()),
  missing_evidence: z.array(z.string()),
  blocking_assumptions: z.array(z.string()),
  recommended_next_step: z.string(),
})
const semanticCandidateSchema = z.object({
  field: z.string(),
  role: z.string(),
  source_columns: z.array(z.string()),
  reason: z.string(),
  status: semanticStatusSchema,
})
const causalEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.enum(['directed', 'bidirected']),
})

export const causalSpecificationSchema = z.object({
  graph: z.object({
    variables: z.array(z.string()),
    edges: z.array(causalEdgeSchema),
  }),
  query: z.object({
    treatments: z.array(z.string()),
    outcomes: z.array(z.string()),
    conditioning: z.array(z.string()),
  }),
  assumptions: z.array(z.string()),
  graph_status: semanticStatusSchema,
  query_status: semanticStatusSchema,
  assumptions_verified: z.boolean(),
})

export const decisionContractSchema = z
  .object({
    contract_id: z.string(),
    version: z.number(),
    source_hash: z.string(),
    archetype: z.string(),
    candidates: z.array(semanticCandidateSchema),
    information_set: z.array(
      z.object({
        field: z.string(),
        availability: availabilitySchema,
        status: semanticStatusSchema,
      })
    ),
    assumptions: z.array(z.string()),
    unknowns: z.array(z.string()),
    causal_specification: causalSpecificationSchema.nullable().optional(),
    validation_status: z.string(),
  })
  .passthrough()

export const requirementNodeSchema = z.object({
  id: z.string(),
  layer: z.enum(['structural', 'causal', 'statistical']),
  state: z.enum(['satisfied', 'blocked', 'waiting']),
  mode: z.enum(['all', 'any']),
  depends_on: z.array(z.string()),
  blockers: z.array(z.string()),
  evidence: z.array(z.string()),
  description: z.string(),
})

export const sufficiencyQuestionSchema = z.object({
  id: z.string(),
  kind: z.enum([
    'confirm_semantic',
    'select_field',
    'select_available_fields',
    'define_causal_model',
    'plan_causal_evidence',
  ]),
  role: z.string().nullable().optional(),
  field: z.string().nullable().optional(),
  options: z.array(z.string()),
  resolves: z.array(z.string()),
  effect: z.enum([
    'removes_blocker',
    'makes_structurally_decidable',
    'enables_causal_identification_test',
    'requires_interventional_evidence',
  ]),
  estimated_cost: z.number().int().positive(),
  priority_score: z.number(),
  rationale: z.string(),
  evidence_action_id: z.string().nullable().optional(),
  evidence_kind: z.enum(['verify_no_latent_confounding', 'randomized_intervention']).nullable().optional(),
  evidence_variables: z.array(z.string()),
  evidence_targets: z.array(z.string()),
})

export const sufficiencyCertificateSchema = z.object({
  issued: z.boolean(),
  scope: z.string(),
  satisfied_requirements: z.array(z.string()),
  blocking_requirements: z.array(z.string()),
  claim: z.string(),
})

export const estimandExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    kind: z.enum(['joint', 'sum', 'product', 'conditional', 'ratio']),
    variables: z.array(z.string()),
    target: z.string().nullable(),
    given: z.array(z.string()),
    children: z.array(estimandExpressionSchema),
  })
)

export const causalIdentificationCertificateSchema = z.object({
  issued: z.boolean(),
  status: z.enum(['requires_causal_model', 'requires_verification', 'identified', 'not_identified', 'invalid_model']),
  method: z.string(),
  estimand: z.string().nullable(),
  estimand_ast: estimandExpressionSchema.nullable(),
  proof_steps: z.array(z.string()),
  failure_witness: z
    .object({
      outer_component_nodes: z.array(z.string()),
      inner_component_nodes: z.array(z.string()),
      hedge_recoverable: z.boolean(),
      claim: z.string(),
    })
    .nullable(),
  assumptions: z.array(z.string()),
  scope: z.string(),
  claim: z.string(),
})

export const causalEvidencePlanSchema = z.object({
  actions: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['verify_no_latent_confounding', 'randomized_intervention']),
      variables: z.array(z.string()),
      targets: z.array(z.string()),
      question: z.string(),
      estimated_cost: z.number().int().positive(),
      resolves_observational_nonidentifiability: z.boolean(),
      rationale: z.string(),
    })
  ),
  preferred_action_id: z.string().nullable(),
  claim: z.string(),
})

export const estimandRequirementsSchema = z.object({
  obligations: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['observational_joint', 'conditional_kernel', 'normalization']),
      target: z.string().nullable(),
      given: z.array(z.string()),
      variables: z.array(z.string()),
      expression_path: z.string(),
      claim: z.string(),
    })
  ),
  scope: z.string(),
  claim: z.string(),
})

export const empiricalSupportSchema = z.object({
  status: z.enum(['not_assessed', 'basic_check_passed', 'basic_check_failed', 'requires_full_analysis']),
  treatment_levels: z.record(z.string(), z.number().int().nonnegative()),
  checked_strata: z.number().int().nonnegative(),
  missing_strata: z.array(z.string()),
  claim: z.string(),
})

export const decisionSufficiencySchema = z.object({
  structural_status: z.enum(['blocked', 'ready']),
  causal_identifiability: z.enum([
    'requires_causal_model',
    'requires_verification',
    'identified',
    'not_identified',
    'invalid_model',
  ]),
  blockers: z.array(z.string()),
  causal_blockers: z.array(z.string()),
  statistical_blockers: z.array(z.string()),
  requirements: z.array(requirementNodeSchema),
  questions: z.array(sufficiencyQuestionSchema).max(7),
  next_question: sufficiencyQuestionSchema.nullable(),
  certificate: sufficiencyCertificateSchema,
  causal_certificate: causalIdentificationCertificateSchema.nullable(),
  causal_evidence_plan: causalEvidencePlanSchema.nullable(),
  estimand_requirements: estimandRequirementsSchema.nullable(),
  empirical_support: empiricalSupportSchema.nullable(),
  planner_strategy: z.string(),
  proof_scope: z.string(),
})

export const intakeAnalysisSchema = z.object({
  profile: z.object({
    source_hash: z.string(),
    row_count: z.number(),
    column_count: z.number(),
    columns: z.array(z.record(z.string(), z.unknown())),
    candidate_entity_columns: z.array(z.string()),
    candidate_time_columns: z.array(z.string()),
    duplicate_rows: z.number(),
    warnings: z.array(z.string()),
  }),
  interpretation: z.object({
    candidates: z.array(semanticCandidateSchema),
    unknowns: z.array(z.string()),
    ambiguities: z.array(z.string()),
    clarification_questions: z.array(z.string()).max(7),
    assumptions: z.array(z.string()),
    provider: z.string(),
    model: z.string().nullable(),
  }),
  contract: decisionContractSchema,
  evidence_gate: evidenceGateSchema,
  sufficiency: decisionSufficiencySchema,
})
export const contractResponseSchema = z.object({
  contract: decisionContractSchema,
  evidence_gate: evidenceGateSchema,
  sufficiency: decisionSufficiencySchema,
})
export const compiledResourceAllocationSchema = z.object({
  archetype: z.literal('constrained_resource_allocation'),
  request: z.record(z.string(), z.unknown()),
})
export type IntakeAnalysis = z.infer<typeof intakeAnalysisSchema>
export type ContractResponse = z.infer<typeof contractResponseSchema>
export type SufficiencyQuestion = z.infer<typeof sufficiencyQuestionSchema>

export type CausalSpecification = z.infer<typeof causalSpecificationSchema>
