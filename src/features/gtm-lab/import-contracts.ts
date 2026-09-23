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

export const importTemplateSchema = z.object({
  format: z.literal('csv'),
  columns: z.array(z.string()),
  required_columns: z.array(z.string()),
  connector_id: z.string(),
  max_rows: z.number().int().positive(),
  evaluation_endpoint: z.string(),
  evaluation_request: z.record(z.string(), z.unknown()),
})

export const importValidationIssueSchema = z.object({
  row: z.number().int().positive(),
  field: z.string().nullable().optional(),
  message: z.string(),
})

export const importValidationSchema = z.object({
  valid: z.boolean(),
  total_rows: z.number().int().nonnegative(),
  valid_rows: z.number().int().nonnegative(),
  invalid_rows: z.number().int().nonnegative(),
  rows: z.array(prospectSeedSchema),
  issues: z.array(importValidationIssueSchema),
})

export const pipelineDecisionSchema = z.enum(['PURSUE', 'RESEARCH', 'WATCH', 'SKIP'])
export const evidenceKindSchema = z.enum(['FACT', 'SIGNAL', 'HYPOTHESIS', 'UNKNOWN'])
export const nextActionTypeSchema = z.enum(['CONTACT', 'RESEARCH', 'WATCH', 'NONE'])

const pipelineEvidenceSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  kind: evidenceKindSchema.default('SIGNAL'),
  source: z.string(),
  source_type: z.string(),
  content: z.string(),
  url: z.string().nullable().optional(),
  observed_at: z.string().nullable().optional(),
  collected_at: z.string().optional(),
  credibility: z.number().min(0).max(1),
  freshness: z.number().min(0).max(1),
  relevance: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
})

const capabilityFitSchema = z.object({
  capability_id: z.string(),
  capability_name: z.string(),
  fit: z.number().min(0).max(1),
  problem_statement: z.string().nullable().optional(),
  rationale: z.array(z.string()).default([]),
})

const problemSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  title: z.string(),
  description: z.string(),
  decision_type: z.string(),
  current_process: z.string().nullable().optional(),
  suspected_pain: z.string().nullable().optional(),
  decision_frequency: z.number().min(0).max(1).nullable().optional(),
  estimated_cost_of_wrong_decision_eur: z.number().nonnegative().nullable().optional(),
  automation_potential: z.number().min(0).max(1),
  qdip_capability_fit: z.number().min(0).max(1),
  capability_fit: capabilityFitSchema.nullable().optional(),
  evidence_ids: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  uncertainty: z.number().min(0).max(1),
  status: z.enum(['HYPOTHESIS', 'EVIDENCED', 'VALIDATED', 'REJECTED']),
})

const opportunitySchema = z.object({
  id: z.string(),
  company_id: z.string(),
  problem_id: z.string(),
  contact_ids: z.array(z.string()).default([]),
  problem_probability: z.number().min(0).max(1),
  qdip_fit: z.number().min(0).max(1),
  capability_fit: capabilityFitSchema.nullable().optional(),
  purchase_probability: z.number().min(0).max(1).nullable().optional(),
  expected_contract_value_eur: z.number().nonnegative().nullable().optional(),
  expected_acquisition_cost_eur: z.number().nonnegative().nullable().optional(),
  expected_implementation_cost_eur: z.number().nonnegative().nullable().optional(),
  strategic_value: z.number().min(0).max(1),
  uncertainty: z.number().min(0).max(1),
  evidence_ids: z.array(z.string()).default([]),
  state: z.string(),
})

const decisionSchema = z.object({
  opportunity_id: z.string(),
  decision: pipelineDecisionSchema,
  expected_opportunity_value_eur: z.number().nullable(),
  uncertainty: z.number().min(0).max(1),
  evidence_quality: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1).nullable().optional(),
  missing_information: z.array(z.string()),
  research_objectives: z.array(z.string()),
  explanation: z.array(z.string()),
  explanation_details: z
    .object({
      reasons: z.array(z.string()).default([]),
      risks: z.array(z.string()).default([]),
      missing_information: z.array(z.string()).default([]),
      research_objectives: z.array(z.string()).default([]),
    })
    .nullable()
    .optional(),
  qdip_capability_fit: capabilityFitSchema.nullable().optional(),
  next_action: z
    .object({
      type: nextActionTypeSchema,
      title: z.string(),
      description: z.string().nullable().optional(),
      target_role: z.string().nullable().optional(),
      reason: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  provenance: z
    .object({
      decision_id: z.string(),
      executed_at: z.string(),
      execution_id: z.string().nullable().optional(),
      plugin_id: z.string(),
      plugin_version: z.string().nullable().optional(),
      model_version: z.string().nullable().optional(),
      policy_version: z.string().nullable().optional(),
      evidence_ids: z.array(z.string()).default([]),
      evidence_version: z.string().nullable().optional(),
      input_version: z.string().nullable().optional(),
      dataset_id: z.string().nullable().optional(),
      trace_id: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  rejected_alternatives: z.array(pipelineDecisionSchema),
  model_version: z.string(),
})

export const pipelineProspectSchema = z.object({
  company: z.object({
    id: z.string(),
    name: z.string(),
    domain: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    employee_count: z.number().int().nonnegative().nullable().optional(),
    revenue_eur: z.number().nonnegative().nullable().optional(),
    description: z.string().nullable().optional(),
    technologies: z.array(z.string()).default([]),
    products: z.array(z.string()).default([]),
    locations: z.array(z.string()).default([]),
    source_refs: z.array(z.string()).default([]),
  }),
  lifecycle: z.unknown().nullable().optional(),
  problems: z.array(problemSchema),
  opportunities: z.array(opportunitySchema),
  decisions: z.array(decisionSchema),
  evidence: z.array(pipelineEvidenceSchema).default([]),
  evidence_count: z.number().int().nonnegative(),
  error: z.string().nullable().optional(),
})

export const pipelineRunSchema = z.object({
  run_id: z.string(),
  status: z.string(),
  imported_rows: z.number().int().nonnegative(),
  deduplicated_rows: z.number().int().nonnegative(),
  summary: z.object({
    total_prospects: z.number().int().nonnegative(),
    evaluated_prospects: z.number().int().nonnegative(),
    failed_prospects: z.number().int().nonnegative(),
    total_opportunities: z.number().int().nonnegative(),
    total_evidence: z.number().int().nonnegative(),
    decisions: z.record(pipelineDecisionSchema, z.number().int().nonnegative()),
  }),
  prospects: z.array(pipelineProspectSchema),
})

export type ProspectSeed = z.infer<typeof prospectSeedSchema>
export type ImportValidation = z.infer<typeof importValidationSchema>
export type PipelineProspect = z.infer<typeof pipelineProspectSchema>
export type PipelineRun = z.infer<typeof pipelineRunSchema>
