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
    validation_status: z.string(),
  })
  .passthrough()
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
})
export const contractResponseSchema = z.object({
  contract: decisionContractSchema,
  evidence_gate: evidenceGateSchema,
})
export const compiledResourceAllocationSchema = z.object({
  archetype: z.literal('constrained_resource_allocation'),
  request: z.record(z.string(), z.unknown()),
})
export type IntakeAnalysis = z.infer<typeof intakeAnalysisSchema>
export type ContractResponse = z.infer<typeof contractResponseSchema>
