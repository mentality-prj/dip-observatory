import { z } from 'zod'

export const semanticStatusSchema = z.enum([
  'inferred',
  'user_confirmed',
  'data_validated',
  'evidence_supported',
  'rejected',
])
export const availabilitySchema = z.enum(['available', 'not_available', 'unknown'])
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
  'evidence_reason.information_set_unresolved_or_unverified',
  'evidence_reason.minimum_verified_semantics_present',
])
export const nextStepCodeSchema = z.enum([
  'next_step.confirm_or_reject_inferred_critical_semantic',
  'next_step.confirm_controllable_action_and_business_objective',
  'next_step.verify_decision_time_availability',
  'next_step.compile_resource_allocation',
])
export const semanticParamsSchema = z.object({
  field: z.string().nullable(),
  role: semanticRoleSchema.nullable(),
}).strict()

const semanticMessage = <T extends z.ZodTypeAny>(code: T) => z.object({ code, params: semanticParamsSchema }).strict()
export const clarificationQuestionSchema = semanticMessage(clarificationQuestionCodeSchema)
export const semanticReasonSchema = semanticMessage(semanticReasonCodeSchema)
export const semanticAssumptionSchema = semanticMessage(semanticAssumptionCodeSchema)
export const evidenceReasonSchema = semanticMessage(evidenceReasonCodeSchema)
export const nextStepSchema = semanticMessage(nextStepCodeSchema)

const semanticCandidateSchema = z.object({
  field: z.string(),
  role: semanticRoleSchema,
  source_columns: z.array(z.string()),
  reason: semanticReasonSchema,
  status: semanticStatusSchema,
})
const evidenceGateSchema = z.object({
  status: z.enum([
    'no_opportunity','discovered','ready_for_decision','ready_for_historical_evaluation',
    'needs_more_data','needs_prospective_pilot','invalid',
  ]),
  reasons: z.array(evidenceReasonSchema),
  missing_evidence: z.array(z.string()),
  blocking_assumptions: z.array(semanticAssumptionSchema),
  recommended_next_step: nextStepSchema,
})
export const decisionContractSchema = z.object({
  schema_version: z.literal(2),
  contract_id: z.string(),
  version: z.number(),
  source_hash: z.string(),
  archetype: decisionArchetypeSchema,
  candidates: z.array(semanticCandidateSchema),
  information_set: z.array(z.object({
    field: z.string(),
    availability: availabilitySchema,
    status: semanticStatusSchema,
  })),
  assumptions: z.array(semanticAssumptionSchema),
  validation_status: z.string(),
}).passthrough()

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
    provider: z.string(),
    model: z.string().nullable(),
  }),
  contract: decisionContractSchema,
  evidence_gate: evidenceGateSchema,
})
export const contractResponseSchema = z.object({ contract: decisionContractSchema, evidence_gate: evidenceGateSchema })

const legacyCandidateSchema = z.object({
  field: z.string(), role: z.string(), source_columns: z.array(z.string()), reason: z.string(), status: semanticStatusSchema,
})
const legacyGateSchema = z.object({
  status: evidenceGateSchema.shape.status,
  reasons: z.array(z.string()),
  missing_evidence: z.array(z.string()),
  blocking_assumptions: z.array(z.string()),
  recommended_next_step: z.string(),
})
const legacyContractSchema = z.object({
  contract_id: z.string(),
  version: z.number(),
  source_hash: z.string(),
  archetype: z.string(),
  candidates: z.array(legacyCandidateSchema),
  information_set: z.array(z.object({ field: z.string(), availability: availabilitySchema, status: semanticStatusSchema })),
  assumptions: z.array(z.string()),
  unknowns: z.array(z.string()),
  validation_status: z.string(),
}).passthrough()
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

const role = (value: string) => semanticRoleSchema.safeParse(value).success ? semanticRoleSchema.parse(value) : 'information'
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
  'Confirm the controllable action and business objective.': 'next_step.confirm_controllable_action_and_business_objective',
  'Verify decision-time availability for every input field.': 'next_step.verify_decision_time_availability',
  'Compile through the constrained resource-allocation adapter.': 'next_step.compile_resource_allocation',
}
const reasonCode = (text: string): z.infer<typeof evidenceReasonCodeSchema> =>
  text.includes('AI-inferred') ? 'evidence_reason.critical_semantics_ai_inferred'
  : text.includes('information set') ? 'evidence_reason.information_set_unresolved_or_unverified'
  : text.includes('minimum verified') ? 'evidence_reason.minimum_verified_semantics_present'
  : 'evidence_reason.verified_critical_semantics_missing'

function legacyCandidate(value: z.infer<typeof legacyCandidateSchema>) {
  const semanticRole = role(value.role)
  return {
    ...value,
    role: semanticRole,
    reason: {
      code: 'semantic_reason.model_inference' as const,
      params: { field: value.field, role: semanticRole },
    },
  }
}
function legacyContract(value: z.infer<typeof legacyContractSchema>) {
  return {
    ...value,
    schema_version: 2 as const,
    archetype: decisionArchetypeSchema.safeParse(value.archetype).success
      ? decisionArchetypeSchema.parse(value.archetype)
      : 'generic_decision' as const,
    candidates: value.candidates.map(legacyCandidate),
    assumptions: value.assumptions.length
      ? [{ code: 'assumption.business_semantics_require_confirmation' as const, params: emptyParams }]
      : [],
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
      assumptions: legacy.interpretation.assumptions.length
        ? [{ code: 'assumption.business_semantics_require_confirmation', params: emptyParams }]
        : [],
      provider: legacy.interpretation.provider,
      model: legacy.interpretation.model,
    },
    contract,
    evidence_gate: legacyGate(legacy.evidence_gate),
  })
}
export function normalizeContractResponse(payload: unknown): ContractResponse {
  const v2 = contractResponseSchema.safeParse(payload)
  if (v2.success) return v2.data
  const legacy = legacyContractResponseSchema.parse(payload)
  return contractResponseSchema.parse({ contract: legacyContract(legacy.contract), evidence_gate: legacyGate(legacy.evidence_gate) })
}

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
