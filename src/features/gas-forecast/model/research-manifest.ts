import { z } from 'zod'

const datasetSchema = z.object({
  version: z.string().min(1),
  hash: z.string().min(1),
  observation_window: z.string().min(1),
  sources: z.array(z.string().min(1)).min(1),
})

const manifestSchema = z.object({
  experiment_id: z.string().min(1),
  version: z.string().min(1),
  hypothesis: z.string().min(1),
  decision_problem: z.string().min(1),
  dataset: datasetSchema,
  prediction_tasks: z.array(z.string()),
  decision_alternatives: z.array(z.string()),
  horizons: z.array(z.number().int().positive()),
  baselines: z.array(z.string()),
  primary_metrics: z.array(z.string()),
  secondary_metrics: z.array(z.string()),
  status: z.enum(['DRAFT', 'FROZEN', 'RUNNING', 'COMPLETED']),
})

const payloadSchema = z.object({ research_manifest: manifestSchema }).passthrough()

export type ResearchManifest = z.infer<typeof manifestSchema>

export function parseResearchManifest(payload: unknown): ResearchManifest | null {
  const parsed = payloadSchema.safeParse(payload)
  return parsed.success ? parsed.data.research_manifest : null
}
