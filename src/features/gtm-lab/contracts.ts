import { z } from 'zod'

export const gtmDecisionSchema = z.enum(['PURSUE', 'RESEARCH', 'SKIP'])
export const evidenceSchema = z
  .object({
    id: z.string(),
    company_id: z.string(),
    source: z.string(),
    source_type: z.string(),
    content: z.string(),
    url: z.string().nullable().optional(),
    collected_at: z.string(),
    credibility: z.number().min(0).max(1),
    freshness: z.number().min(0).max(1),
    relevance: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    structured_data: z.record(z.string(), z.unknown()).default({}),
  })
  .passthrough()
export const companySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    domain: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
  })
  .passthrough()
export const opportunitySchema = z
  .object({
    id: z.string(),
    company_id: z.string(),
    problem_id: z.string(),
    problem_probability: z.number().min(0).max(1),
    qdip_fit: z.number().min(0).max(1),
    purchase_probability: z.number().min(0).max(1).nullable().optional(),
    expected_contract_value_eur: z.number().nonnegative().nullable().optional(),
    expected_acquisition_cost_eur: z.number().nonnegative().nullable().optional(),
    expected_implementation_cost_eur: z.number().nonnegative().nullable().optional(),
    strategic_value: z.number().min(0).max(1),
    uncertainty: z.number().min(0).max(1),
    evidence_ids: z.array(z.string()),
  })
  .passthrough()
export const evaluationSchema = z
  .object({
    opportunity_id: z.string(),
    decision: gtmDecisionSchema,
    expected_opportunity_value_eur: z.number().nullable(),
    uncertainty: z.number().min(0).max(1),
    evidence_quality: z.number().min(0).max(1),
    missing_information: z.array(z.string()),
    research_objectives: z.array(z.string()),
    explanation: z.array(z.string()),
    rejected_alternatives: z.array(gtmDecisionSchema),
    model_version: z.string(),
  })
  .passthrough()
export const outreachSchema = z.object({ subject: z.string(), body: z.string() }).passthrough().nullable()
export const demoProspectSchema = z
  .object({
    company: companySchema,
    evidence: z.array(evidenceSchema),
    opportunity: opportunitySchema,
    decision: evaluationSchema,
    outreach_draft: outreachSchema,
  })
  .strict()
export const gtmDemoSchema = z
  .object({
    dataset_id: z.string(),
    network_access: z.boolean(),
    persistence: z.boolean(),
    external_actions: z.boolean(),
    prospects: z.array(demoProspectSchema).min(1),
    summary: z.record(z.string(), z.number().int().nonnegative()),
  })
  .strict()
export type GtmDemo = z.infer<typeof gtmDemoSchema>
export type GtmProspect = z.infer<typeof demoProspectSchema>
