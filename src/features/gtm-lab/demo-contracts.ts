import { z } from 'zod'

// Contract boundary for the deterministic public GTM demo returned by
// backend capability gtm.demo.run. Keep this aligned with backend models;
// demo data remains backend-owned and contains no frontend decision logic.
export const gtmDemoDecisionSchema = z.enum(['PURSUE', 'RESEARCH', 'WATCH', 'SKIP'])

const demoCompanySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    domain: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
  })
  .passthrough()

const demoEvidenceSchema = z
  .object({
    id: z.string(),
    company_id: z.string(),
    source: z.string(),
    source_type: z.string(),
    content: z.string(),
    url: z.string().nullable().optional(),
    observed_at: z.string().nullable().optional(),
    collected_at: z.string().nullable().optional(),
    credibility: z.number().min(0).max(1),
    freshness: z.number().min(0).max(1),
    relevance: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    structured_data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()

const demoOpportunitySchema = z
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

const demoEvaluationSchema = z
  .object({
    opportunity_id: z.string(),
    decision: gtmDemoDecisionSchema,
    expected_opportunity_value_eur: z.number().nullable().optional(),
    uncertainty: z.number().min(0).max(1),
    evidence_quality: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1).optional(),
    missing_information: z.array(z.string()).default([]),
    research_objectives: z.array(z.string()).default([]),
    explanation: z.array(z.string()).default([]),
    rejected_alternatives: z.array(gtmDemoDecisionSchema).default([]),
    model_version: z.string().optional(),
  })
  .passthrough()

const demoOutreachSchema = z.object({ subject: z.string(), body: z.string() }).passthrough().nullable()

export const gtmDemoProspectSchema = z
  .object({
    company: demoCompanySchema,
    evidence: z.array(demoEvidenceSchema),
    opportunity: demoOpportunitySchema,
    decision: demoEvaluationSchema,
    outreach_draft: demoOutreachSchema.optional(),
  })
  .passthrough()

export const gtmDemoSchema = z
  .object({
    dataset_id: z.string(),
    network_access: z.boolean(),
    persistence: z.boolean(),
    external_actions: z.boolean(),
    prospects: z.array(gtmDemoProspectSchema).min(1),
    summary: z.record(z.string(), z.number().int().nonnegative()),
  })
  .passthrough()

export type GtmDemo = z.infer<typeof gtmDemoSchema>
export type GtmProspect = z.infer<typeof gtmDemoProspectSchema>
