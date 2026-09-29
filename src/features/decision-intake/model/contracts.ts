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
export const decisionArchetypeSchema = z.enum(['unclassified', 'generic_decision', 'constrained_resource_allocation'])
export const decisionVariableKindSchema = z.enum(['allocation', 'selection', 'quantity', 'routing', 'generic'])
export const objectiveSenseSchema = z.enum(['maximize', 'minimize'])
export const constraintKindSchema = z.enum(['hard', 'soft', 'ambiguous'])
export const formalizationAssumptionProvenanceSchema = z.enum([
  'dataset',
  'business_context',
  'user_confirmed',
  'system_default',
  'compiler_default',
])
export const formalizationAssumptionImpactSchema = z.enum([
  'decision_neutral',
  'decision_relevant',
])
export const decisionTimingSchema = z.enum(['pre_decision', 'post_decision', 'decision_variable', 'ambiguous'])
export const formalizationQuestionKindSchema = z.enum([
  'confirm_decision_variable',
  'select_objective',
  'confirm_constraints',
  'confirm_timing',
  'confirm_compiler_mapping',
])
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

const semanticScopeSchema = z.object({
  field: z.string(),
  values: z.array(z.string()).min(1),
})

const semanticCandidateSchema = z.object({
  candidate_id: z.string(),
  field: z.string(),
  role: semanticRoleSchema,
  source_columns: z.array(z.string()),
  reason: semanticReasonSchema,
  scope: semanticScopeSchema.nullable().optional(),
  legacy_reason: z.string().optional(),
  status: semanticStatusSchema,
})

export const problemFormalizationSchema = z.object({
  version: z.literal(1),
  archetype_hypotheses: z.array(
    z.object({
      archetype: decisionArchetypeSchema,
      score: z.number().min(0).max(1),
      evidence: z.array(z.string()),
    })
  ),
  row_subtypes: z.array(
    z.object({
      discriminator: z.string(),
      value: z.string(),
      semantic_type: z.string(),
      score: z.number().min(0).max(1),
    })
  ),
  decision_variables: z.array(
    z.object({
      id: z.string(),
      kind: decisionVariableKindSchema,
      expression: z.string(),
      indexed_by: z.array(z.string()),
      value_field: z.string().nullable(),
      score: z.number().min(0).max(1),
      evidence: z.array(z.string()),
      supported_compilers: z.array(z.string()),
      status: semanticStatusSchema,
    })
  ),
  objectives: z.array(
    z.object({
      id: z.string(),
      sense: objectiveSenseSchema,
      expression: z.string(),
      field: z.string().nullable(),
      score: z.number().min(0).max(1),
      evidence: z.array(z.string()),
      supported_compilers: z.array(z.string()),
      status: semanticStatusSchema,
    })
  ),
  constraints: z.array(
    z.object({
      id: z.string(),
      kind: constraintKindSchema,
      expression: z.string(),
      parameter: z.string().nullable(),
      field: z.string().nullable(),
      operator: z.string().nullable(),
      value: z.union([z.number(), z.string(), z.boolean()]).nullable(),
      score: z.number().min(0).max(1),
      evidence: z.array(z.string()),
      supported_compilers: z.array(z.string()),
      status: semanticStatusSchema,
    })
  ),
  assumptions: z
    .array(
      z.object({
        id: z.string(),
        parameter: z.string(),
        value: z.union([z.number(), z.string(), z.boolean()]).nullable(),
        provenance: formalizationAssumptionProvenanceSchema,
        impact: formalizationAssumptionImpactSchema,
        rationale: z.string(),
        supported_compilers: z.array(z.string()),
        status: semanticStatusSchema,
      })
    )
    .default([]),
  timing: z.array(
    z.object({
      field: z.string(),
      timing: decisionTimingSchema,
      score: z.number().min(0).max(1),
      evidence: z.array(z.string()),
      status: semanticStatusSchema,
    })
  ),
  questions: z
    .array(
      z.object({
        id: z.string(),
        kind: formalizationQuestionKindSchema,
        hypothesis_ids: z.array(z.string()),
        field: z.string().nullable(),
        options: z.array(z.string()),
        score: z.number().nonnegative(),
        rationale: z.string(),
      })
    )
    .max(12),
  completeness_score: z.number().min(0).max(1),
  claim: z.string(),
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
    assumptions: z.array(semanticAssumptionSchema),
    formalization: problemFormalizationSchema.nullable().optional(),
    legacy_assumptions: z.array(z.string()).default([]),
    legacy_unknowns: z.array(z.string()).default([]),
    causal_specification: causalSpecificationSchema.nullable().optional(),
    validation_status: contractValidationStatusSchema,
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
    'select_objective',
    'select_available_fields',
    'select_archetype',
    'define_causal_model',
    'plan_causal_evidence',
    'assess_estimability',
  ]),
  role: z.string().nullable().optional(),
  field: z.string().nullable().optional(),
  hypothesis_id: z.string().nullable().optional(),
  hypothesis_ids: z.array(z.string()).optional().default([]),
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
  compilation_validation_error: z.string().nullable(),
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
    formalization: problemFormalizationSchema.nullable().optional(),
    legacy_clarifications: z.array(z.string()).default([]),
    legacy_assumptions: z.array(z.string()).default([]),
    legacy_unknowns: z.array(z.string()).default([]),
    legacy_ambiguities: z.array(z.string()).default([]),
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

export const intakeAnswersSchema = z
  .object({
    candidate_statuses_by_id: z.record(z.string(), z.enum(['user_confirmed', 'rejected'])).optional(),
    information_availability: z.record(z.string(), availabilitySchema).optional(),
    formalization_statuses: z.record(z.string(), z.enum(['user_confirmed', 'rejected'])).optional(),
    decision_variable_overrides: z
      .record(
        z.string(),
        z.object({
          expression: z.string().optional(),
          indexed_by: z.array(z.string()).optional(),
        })
      )
      .optional(),
    objective_overrides: z
      .record(
        z.string(),
        z.object({
          sense: objectiveSenseSchema.optional(),
          expression: z.string().optional(),
        })
      )
      .optional(),
    constraint_overrides: z
      .record(
        z.string(),
        z.object({
          kind: constraintKindSchema.optional(),
          expression: z.string().optional(),
          operator: z.string().optional(),
          value: z.union([z.number(), z.string(), z.boolean()]).optional(),
        })
      )
      .optional(),
    candidate_scope_overrides: z.record(z.string(), semanticScopeSchema.nullable()).optional(),
    accept_timing_suggestions: z.boolean().optional(),
    candidate_statuses: z.record(z.string(), z.enum(['user_confirmed', 'rejected'])).optional(),
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
    archetype: decisionArchetypeSchema.optional(),
    causal_specification: causalSpecificationSchema.optional(),
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
  contract: legacyContractSchema,
  evidence_gate: legacyGateSchema,
})
const legacyContractResponseSchema = z.object({ contract: legacyContractSchema, evidence_gate: legacyGateSchema })

const legacySufficiency = {
  structural_status: 'blocked' as const,
  compilation_status: 'unsupported' as const,
  causal_identifiability: 'requires_causal_model' as const,
  blockers: ['legacy_v1:structural_sufficiency_not_available'],
  compilation_blockers: ['legacy_v1:compiler_readiness_not_available'],
  compilation_validation_error: null,
  causal_blockers: ['legacy_v1:causal_model_not_available'],
  statistical_blockers: ['legacy_v1:statistical_support_not_available'],
  requirements: [],
  questions: [],
  next_question: null,
  compilation_questions: [],
  compilation_next_question: null,
  certificate: {
    issued: false,
    scope: 'legacy-v1-compatibility',
    satisfied_requirements: [],
    blocking_requirements: ['legacy_v1'],
    claim: 'Legacy Decision Intake v1 does not carry a deterministic sufficiency certificate.',
  },
  causal_certificate: null,
  causal_evidence_plan: null,
  estimand_requirements: null,
  empirical_support: null,
  planner_strategy: 'legacy-v1-compatibility',
  proof_scope: 'legacy-v1-compatibility',
} as const

const role = (value: string) =>
  semanticRoleSchema.safeParse(value).success ? semanticRoleSchema.parse(value) : 'information'
const emptyParams = { field: null, role: null } as const
const questionCode: Record<string, z.infer<typeof clarificationQuestionCodeSchema>> = {
  'Which field represents the action a decision maker can control?': 'clarification.controllable_action',
  'What business objective should QDIP optimize?': 'clarification.business_objective',
  'Which constraints were known and binding at decision time?': 'clarification.binding_constraints',
  'Which fields were available before the action was chosen?': 'clarification.decision_time_information',
  'Which field records the realized outcome?': 'clarification.realized_outcome',
}
const nextCode: Record<string, z.infer<typeof nextStepCodeSchema>> = {
  'Confirm or reject every inferred critical semantic.': 'next_step.confirm_or_reject_inferred_critical_semantic',
  'Confirm the controllable action and business objective.':
    'next_step.confirm_controllable_action_and_business_objective',
  'Resolve competing controllable-action or business-objective semantics.': 'next_step.resolve_critical_semantics',
  'Verify the required semantic mappings for the selected decision archetype.':
    'next_step.verify_archetype_requirements',
  'Verify decision-time availability for every input field.': 'next_step.verify_decision_time_availability',
  'Compile through the constrained resource-allocation adapter.': 'next_step.compile_resource_allocation',
  'Select a compatible decision adapter for this contract.': 'next_step.select_decision_adapter',
}
const reasonCode = (text: string): z.infer<typeof evidenceReasonCodeSchema> =>
  text.includes('AI-inferred')
    ? 'evidence_reason.critical_semantics_ai_inferred'
    : text.includes('archetype mappings')
      ? 'evidence_reason.archetype_requirements_unresolved'
      : text.includes('ambiguous')
        ? 'evidence_reason.critical_semantics_ambiguous'
        : text.includes('information set')
          ? 'evidence_reason.information_set_unresolved_or_unverified'
          : text.includes('minimum verified')
            ? 'evidence_reason.minimum_verified_semantics_present'
            : 'evidence_reason.verified_critical_semantics_missing'

function legacyCandidate(value: z.infer<typeof legacyCandidateSchema>) {
  const semanticRole = role(value.role)
  return {
    ...value,
    candidate_id: `semantic:${semanticRole}:${value.field}`,
    role: semanticRole,
    reason: {
      code: 'semantic_reason.model_inference' as const,
      params: { field: value.field, role: semanticRole },
    },
    legacy_reason: value.reason,
  }
}
function legacyContract(value: z.infer<typeof legacyContractSchema>) {
  return {
    ...value,
    schema_version: 2 as const,
    archetype: decisionArchetypeSchema.safeParse(value.archetype).success
      ? decisionArchetypeSchema.parse(value.archetype)
      : ('generic_decision' as const),
    candidates: value.candidates.map(legacyCandidate),
    assumptions: value.assumptions.length
      ? [{ code: 'assumption.business_semantics_require_confirmation' as const, params: emptyParams }]
      : [],
    legacy_assumptions: value.assumptions,
    legacy_unknowns: value.unknowns,
  }
}
function legacyGate(value: z.infer<typeof legacyGateSchema>) {
  return {
    ...value,
    reasons: value.reasons.map((text) => ({ code: reasonCode(text), params: emptyParams })),
    blocking_assumptions: value.blocking_assumptions.length
      ? [{ code: 'assumption.business_semantics_require_confirmation' as const, params: emptyParams }]
      : [],
    recommended_next_step: {
      code: nextCode[value.recommended_next_step] ?? 'next_step.confirm_controllable_action_and_business_objective',
      params: emptyParams,
    },
  }
}
export function normalizeIntakeAnalysis(payload: unknown): IntakeAnalysis {
  const v2 = intakeAnalysisSchema.safeParse(payload)
  if (v2.success) return v2.data
  const legacy = legacyAnalysisSchema.parse(payload)
  const contract = legacyContract(legacy.contract)
  return intakeAnalysisSchema.parse({
    schema_version: 2,
    profile: legacy.profile,
    interpretation: {
      archetype: contract.archetype,
      candidates: legacy.interpretation.candidates.map(legacyCandidate),
      clarifications: legacy.interpretation.clarification_questions
        .map((text) => questionCode[text])
        .filter((code): code is z.infer<typeof clarificationQuestionCodeSchema> => Boolean(code))
        .map((code) => ({ code, params: emptyParams })),
      legacy_clarifications: legacy.interpretation.clarification_questions.filter((text) => !questionCode[text]),
      legacy_assumptions: legacy.interpretation.assumptions,
      legacy_unknowns: legacy.interpretation.unknowns,
      legacy_ambiguities: legacy.interpretation.ambiguities,
      assumptions: legacy.interpretation.assumptions.length
        ? [{ code: 'assumption.business_semantics_require_confirmation', params: emptyParams }]
        : [],
      provider: legacy.interpretation.provider,
      model: legacy.interpretation.model,
    },
    contract,
    evidence_gate: legacyGate(legacy.evidence_gate),
    sufficiency: legacySufficiency,
  })
}
export function normalizeContractResponse(payload: unknown): ContractResponse {
  const v2 = contractResponseSchema.safeParse(payload)
  if (v2.success) return v2.data
  const legacy = legacyContractResponseSchema.parse(payload)
  return contractResponseSchema.parse({
    contract: legacyContract(legacy.contract),
    evidence_gate: legacyGate(legacy.evidence_gate),
    sufficiency: legacySufficiency,
  })
}

export const compiledResourceAllocationSchema = z.object({
  archetype: z.literal('constrained_resource_allocation'),
  request: z.record(z.string(), z.unknown()),
})

export const executedDecisionIntakeSchema = compiledResourceAllocationSchema.extend({
  result: z.record(z.string(), z.unknown()),
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
export type IntakeAnswers = z.infer<typeof intakeAnswersSchema>
export type ProblemFormalization = z.infer<typeof problemFormalizationSchema>
export type CompiledResourceAllocation = z.infer<typeof compiledResourceAllocationSchema>
export type ExecutedDecisionIntake = z.infer<typeof executedDecisionIntakeSchema>
