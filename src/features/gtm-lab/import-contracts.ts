import { z } from 'zod'

export const prospectSeedSchema = z.object({
  name: z.string().min(1),
  domain: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  employee_count: z.number().int().nullable().optional(),
  revenue_eur: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export const commercialContextSchema = z.object({
  offering: z.string().min(3).max(1000),
  problems_solved: z.array(z.string().min(1)).min(1).max(10),
  target_industries: z.array(z.string()).max(10).default([]),
  target_company_sizes: z.array(z.string()).max(10).default([]),
  target_geographies: z.array(z.string()).max(10).default([]),
  target_roles: z.array(z.string()).max(10).default([]),
})

export const importTemplateSchema = z.object({
  format: z.literal('csv'),
  columns: z.array(z.string()),
  required_columns: z.array(z.string()),
  connector_id: z.string(),
  max_rows: z.number().int().positive(),
  evaluation_endpoint: z.string(),
  evaluation_request: z.record(z.string(), z.unknown()),
})

export const importValidationIssueSchema = z.object({ row: z.number().int().positive(), field: z.string().nullable().optional(), message: z.string() })
export const importValidationSchema = z.object({ valid: z.boolean(), total_rows: z.number().int().nonnegative(), valid_rows: z.number().int().nonnegative(), invalid_rows: z.number().int().nonnegative(), rows: z.array(prospectSeedSchema), issues: z.array(importValidationIssueSchema) })
export const pipelineDecisionSchema = z.enum(['PURSUE', 'RESEARCH', 'WATCH', 'SKIP'])
export const evidenceKindSchema = z.enum(['FACT', 'SIGNAL', 'HYPOTHESIS', 'UNKNOWN'])
export const nextActionTypeSchema = z.enum(['CONTACT', 'RESEARCH', 'WATCH', 'NONE'])

const pipelineEvidenceSchema = z.object({ id: z.string(), company_id: z.string(), kind: evidenceKindSchema.default('SIGNAL'), source: z.string(), source_type: z.string(), content: z.string(), url: z.string().nullable().optional(), observed_at: z.string().nullable().optional(), collected_at: z.string().optional(), credibility: z.number().min(0).max(1), freshness: z.number().min(0).max(1), relevance: z.number().min(0).max(1), confidence: z.number().min(0).max(1) })
const capabilityFitSchema = z.object({ capability_id: z.string(), capability_name: z.string(), fit: z.number().min(0).max(1), problem_statement: z.string().nullable().optional(), rationale: z.array(z.string()).default([]) })
const problemSchema = z.object({ id: z.string(), company_id: z.string(), title: z.string(), description: z.string(), decision_type: z.string(), current_process: z.string().nullable().optional(), suspected_pain: z.string().nullable().optional(), automation_potential: z.number().min(0).max(1), qdip_capability_fit: z.number().min(0).max(1), capability_fit: capabilityFitSchema.nullable().optional(), confidence: z.number().min(0).max(1), uncertainty: z.number().min(0).max(1), evidence_ids: z.array(z.string()).default([]) })
const opportunitySchema = z.object({ id: z.string(), company_id: z.string(), problem_id: z.string(), problem_probability: z.number().min(0).max(1), qdip_fit: z.number().min(0).max(1), capability_fit: capabilityFitSchema.nullable().optional(), purchase_probability: z.number().min(0).max(1).nullable().optional(), expected_contract_value_eur: z.number().nullable().optional(), expected_acquisition_cost_eur: z.number().nullable().optional(), expected_implementation_cost_eur: z.number().nullable().optional(), strategic_value: z.number().min(0).max(1).default(0.5), uncertainty: z.number().min(0).max(1), evidence_ids: z.array(z.string()).default([]) })
const decisionSchema = z.object({ opportunity_id: z.string(), decision: pipelineDecisionSchema, expected_opportunity_value_eur: z.number().nullable().optional(), uncertainty: z.number().min(0).max(1), evidence_quality: z.number().min(0).max(1), confidence: z.number().min(0).max(1), missing_information: z.array(z.string()).default([]), research_objectives: z.array(z.string()).default([]), explanation: z.array(z.string()).default([]), explanation_details: z.object({ reasons: z.array(z.string()).default([]), risks: z.array(z.string()).default([]), missing_information: z.array(z.string()).default([]), research_objectives: z.array(z.string()).default([]) }).optional(), qdip_capability_fit: capabilityFitSchema.nullable().optional(), next_action: z.object({ type: nextActionTypeSchema, title: z.string(), description: z.string().nullable().optional(), target_role: z.string().nullable().optional(), reason: z.string().nullable().optional() }).nullable().optional(), provenance: z.object({ decision_id: z.string(), executed_at: z.string().default(''), plugin_id: z.string().default('gtm-lab'), plugin_version: z.string().nullable().optional(), model_version: z.string().nullable().optional(), trace_id: z.string().nullable().optional(), evidence_ids: z.array(z.string()).default([]) }).optional() })
const companySchema = z.object({ id: z.string(), name: z.string(), domain: z.string().nullable().optional(), country: z.string().nullable().optional(), industry: z.string().nullable().optional(), employee_count: z.number().nullable().optional(), revenue_eur: z.number().nullable().optional(), description: z.string().nullable().optional() })
export const pipelineProspectSchema = z.object({ company: companySchema, problems: z.array(problemSchema).default([]), opportunities: z.array(opportunitySchema).default([]), decisions: z.array(decisionSchema).default([]), evidence: z.array(pipelineEvidenceSchema).default([]), evidence_count: z.number().int().nonnegative().default(0), error: z.string().nullable().optional() })
export const pipelineRunSchema = z.object({ run_id: z.string(), status: z.enum(['COMPLETED', 'PARTIAL', 'FAILED']), imported_rows: z.number().int().nonnegative(), deduplicated_rows: z.number().int().nonnegative(), summary: z.object({ total_prospects: z.number().int().nonnegative(), evaluated_prospects: z.number().int().nonnegative(), failed_prospects: z.number().int().nonnegative(), total_opportunities: z.number().int().nonnegative(), total_evidence: z.number().int().nonnegative(), decisions: z.record(z.string(), z.number().int().nonnegative()) }), prospects: z.array(pipelineProspectSchema) })

export type CommercialContext = z.infer<typeof commercialContextSchema>
export type ProspectSeed = z.infer<typeof prospectSeedSchema>
export type PipelineProspect = z.infer<typeof pipelineProspectSchema>
export type PipelineRun = z.infer<typeof pipelineRunSchema>
