import { z } from 'zod'

export const semanticStatusSchema = z.enum([
  'inferred',
  'user_confirmed',
  'data_validated',
  'evidence_supported',
  'rejected',
])
export const availabilitySchema = z.enum(['available', 'not_available', 'unknown'])
export const contractValidationStatusSchema = z.enum(['inferred', 'needs_review', 'verified'])
export const decisionArchetypeSchema = z.enum(['generic_decision', 'constrained_resource_allocation'])
export const semanticRoleSchema = z.enum([
  'action',
  'objective',
  'constraint',
  'outcome',
  'information',
  'entity',
  'timestamp',
  'community_id',
  'team_id',
  'capacity',
  'demand',
  'service',
])
export const clarificationQuestionCodeSchema = z.enum([
  'clarification.controllable_action',
  'clarification.business_objective',
  'clarification.binding_constraints',
  'clarification.decision_time_information',
  'clarification.realized_outcome',
  'clarification.field_role',
  'clarification.field_meaning',
  'clarification.field_availability',
])
export const semanticReasonCodeSchema = z.enum([
  'semantic_reason.model_inference',
  'semantic_reason.field_name_match',
  'semantic_reason.data_profile_match',
  'semantic_reason.business_context_match',
  'semantic_reason.user_selection',
])
export const semanticAssumptionCodeSchema = z.enum([
  'assumption.business_semantics_require_confirmation',
  'assumption.field_role_inferred',
  'assumption.field_meaning_inferred',
  'assumption.field_availability_inferred',
  'assumption.business_context_inferred',
])
export const evidenceReasonCodeSchema = z.enum([
  'evidence_reason.critical_semantics_ai_inferred',
  'evidence_reason.verified_critical_semantics_missing',
  'evidence_reason.critical_semantics_ambiguous',
  'evidence_reason.archetype_requirements_unresolved',
  'evidence_reason.information_set_unresolved_or_unverified',
  'evidence_reason.minimum_verified_semantics_present',
])
export const nextStepCodeSchema = z.enum([
  'next_step.confirm_or_reject_inferred_critical_semantic',
  'next_step.confirm_controllable_action_and_business_objective',
  'next_step.resolve_critical_semantics',
  'next_step.verify_archetype_requirements',
  'next_step.verify_decision_time_availability',
  'next_step.compile_resource_allocation',
  'next_step.select_decision_adapter',
])
export const semanticParamsSchema = z
  .object({
    field: z.string().nullable(),
    role: semanticRoleSchema.nullable(),
  })
  .strict()

const semanticMessage = <T extends z.ZodTypeAny>(code: T) => z.object({ code, params: semanticParamsSchema }).strict()
export const clarificationQuestionSchema = semanticMessage(clarificationQuestionCodeSchema)
export const semanticReasonSchema = semanticMessage(semanticReasonCodeSchema)
export const semanticAssumptionSchema = semanticMessage(semanticAssumptionCodeSchema)
export const evidenceReasonSchema = semanticMessage(evidenceReasonCodeSchema)
export const nextStepSchema = semanticMessage(nextStepCodeSchema)

const semanticCandidateSchema = z.object({
  candidate_id: z.string(),
  field: z.string(),
  role: semanticRoleSchema,
  source_columns: z.array(z.string()),
  reason: semanticReasonSchema,
  legacy_reason: z.string().optional(),
  status: semanticStatusSchema,
})
const evidenceGateSchema = z.object({
  status: z.enum([
    'no_opportunity',
    'discovered',
    'ready_for_structural_intake',
    'ready_for_decision',
    'ready_for_historical_evaluation',
    'needs_more_data',
    'needs_prospective_pilot',
    'invalid',
  ]),
  reasons: z.array(evidenceReasonSchema),
  missing_evidence: z.array(z.string()),
  blocking_assumptions: z.array(semanticAssumptionSchema),
  recommended_next_step: nextStepSchema,
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
    schema_version: z.literal(2),
    contract_id: z.string(),
    version: z.number(),
    source_hash: z.string(),
    archetype: decisionArchetypeSchema,
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
  layer: z.enum(['structural', 'compilation', 'causal', 'statistical']),
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
    'select_archetype',
    'define_causal_model',
    'plan_causal_evidence',
    'assess_estimability',
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
    'enables_estimability_check',
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
  checked_obligations: z.array(z.string()),
  failed_obligations: z.array(z.string()),
  deferred_obligations: z.array(z.string()),
  claim: z.string(),
})

export const decisionSufficiencySchema = z.object({
  structural_status: z.enum(['blocked', 'ready']),
  compilation_status: z.enum(['blocked', 'ready', 'unsupported']),
  causal_identifiability: z.enum([
    'requires_causal_model',
    'requires_verification',
    'identified',
    'not_identified',
    'invalid_model',
  ]),
  blockers: z.array(z.string()),
  compilation_blockers: z.array(z.string()),
  causal_blockers: z.array(z.string()),
  statistical_blockers: z.array(z.string()),
  requirements: z.array(requirementNodeSchema),
  questions: z.array(sufficiencyQuestionSchema).max(7),
  next_question: sufficiencyQuestionSchema.nullable(),
  compilation_questions: z.array(sufficiencyQuestionSchema).max(7),
  compilation_next_question: sufficiencyQuestionSchema.nullable(),
  certificate: sufficiencyCertificateSchema,
  causal_certificate: causalIdentificationCertificateSchema.nullable(),
  causal_evidence_plan: causalEvidencePlanSchema.nullable(),
  estimand_requirements: estimandRequirementsSchema.nullable(),
  empirical_support: empiricalSupportSchema.nullable(),
  planner_strategy: z.string(),
  proof_scope: z.string(),
})

export const intakeAnalysisSchema = z.object({
  schema_version: z.literal(2),
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
    archetype: decisionArchetypeSchema,
    candidates: z.array(semanticCandidateSchema),
    clarifications: z.array(clarificationQuestionSchema).max(7),
    assumptions: z.array(semanticAssumptionSchema),
    legacy_clarifications: z.array(z.string()).default([]),
    legacy_assumptions: z.array(z.string()).default([]),
    legacy_unknowns: z.array(z.string()).default([]),
    legacy_ambiguities: z.array(z.string()).default([]),
    provider: z.string(),
    model: z.string().nullable(),
  }),
  contract: decisionContractSchema,
  evidence_gate: evidenceGateSchema,
})
export const contractResponseSchema = z.object({ contract: decisionContractSchema, evidence_gate: evidenceGateSchema })

export const intakeAnswersSchema = z
  .object({
    candidate_statuses_by_id: z.record(z.string(), z.enum(['user_confirmed', 'rejected'])).optional(),
    information_availability: z.record(z.string(), availabilitySchema).optional(),
    semantic_mappings: z
      .array(
        z
          .object({
            field: z.string(),
            role: semanticRoleSchema,
          })
          .strict()
      )
      .max(50)
      .optional(),
  })
  .strict()

const legacyCandidateSchema = z.object({
  field: z.string(),
  role: z.string(),
  source_columns: z.array(z.string()),
  reason: z.string(),
  status: semanticStatusSchema,
})
const legacyGateSchema = z.object({
  status: evidenceGateSchema.shape.status,
  reasons: z.array(z.string()),
  missing_evidence: z.array(z.string()),
  blocking_assumptions: z.array(z.string()),
  recommended_next_step: z.string(),
})
const legacyContractSchema = z
  .object({
    contract_id: z.string(),
    version: z.number(),
    source_hash: z.string(),
    archetype: z.string(),
    candidates: z.array(legacyCandidateSchema),
    information_set: z.array(
      z.object({ field: z.string(), availability: availabilitySchema, status: semanticStatusSchema })
    ),
    assumptions: z.array(z.string()),
    unknowns: z.array(z.string()),
    validation_status: z.string(),
  })
  .passthrough()
const legacyAnalysisSchema = z.object({
  profile: intakeAnalysisSchema.shape.profile,
  interpretation: z.object({
    candidates: z.array(legacyCandidateSchema),
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
export type SemanticParams = z.infer<typeof semanticParamsSchema>
export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>
export type SemanticReason = z.infer<typeof semanticReasonSchema>
export type SemanticAssumption = z.infer<typeof semanticAssumptionSchema>
export type EvidenceReason = z.infer<typeof evidenceReasonSchema>
export type NextStep = z.infer<typeof nextStepSchema>
export type IntakeAnalysis = z.infer<typeof intakeAnalysisSchema>
export type ContractResponse = z.infer<typeof contractResponseSchema>
export type SufficiencyQuestion = z.infer<typeof sufficiencyQuestionSchema>

export type CausalSpecification = z.infer<typeof causalSpecificationSchema>
