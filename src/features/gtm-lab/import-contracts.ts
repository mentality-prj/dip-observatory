import { z } from "zod";

export const prospectSeedSchema = z.object({
  name: z.string().min(1),
  domain: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  employee_count: z.number().int().nullable().optional(),
  revenue_eur: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const importTemplateSchema = z.object({
  format: z.literal("csv"),
  columns: z.array(z.string()),
  required_columns: z.array(z.string()),
  connector_id: z.string(),
  max_rows: z.number().int().positive(),
  evaluation_endpoint: z.string(),
  evaluation_request: z.record(z.string(), z.unknown()),
});

export const importValidationIssueSchema = z.object({
  row: z.number().int().positive(),
  field: z.string().nullable().optional(),
  message: z.string(),
});

export const importValidationSchema = z.object({
  valid: z.boolean(),
  total_rows: z.number().int().nonnegative(),
  valid_rows: z.number().int().nonnegative(),
  invalid_rows: z.number().int().nonnegative(),
  rows: z.array(prospectSeedSchema),
  issues: z.array(importValidationIssueSchema),
});

export const pipelineDecisionSchema = z.enum(["PURSUE", "RESEARCH", "SKIP"]);

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
  prospects: z.array(z.object({
    company: z.object({ id: z.string(), name: z.string() }).passthrough(),
    lifecycle: z.unknown().nullable().optional(),
    problems: z.array(z.unknown()),
    opportunities: z.array(z.unknown()),
    decisions: z.array(z.unknown()),
    evidence_count: z.number().int().nonnegative(),
    error: z.string().nullable().optional(),
  }).passthrough()),
});

export type ProspectSeed = z.infer<typeof prospectSeedSchema>;
export type ImportValidation = z.infer<typeof importValidationSchema>;
export type PipelineRun = z.infer<typeof pipelineRunSchema>;
