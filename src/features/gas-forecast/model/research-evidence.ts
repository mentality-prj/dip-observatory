import { z } from 'zod'

const metricSchema = z
  .object({
    model: z.string(),
    mae: z.number().finite().optional(),
  })
  .passthrough()

const experimentPayloadSchema = z
  .object({
    backtest: z
      .object({
        metrics: z.array(metricSchema).default([]),
        raw_ridge_metrics: z.object({ mae: z.number().finite().optional() }).passthrough().optional(),
        magnitude_gate: z.object({ fallback_rate: z.number().finite().optional() }).passthrough().optional(),
        magnitude_variants: z.object({ research_gate: z.string() }).passthrough(),
        leakage_controls: z.array(z.string()).default([]),
      })
      .passthrough(),
    procurement: z
      .object({
        strategy: z
          .object({
            procurement_eligible: z.boolean(),
            reason: z.string().nullable().optional(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough()

export type ResearchEvidence = Readonly<{
  experimentVersion: 'v0.3'
  researchGate: string
  procurementEligible: boolean
  procurementReason: string | null
  baselineLastMae: number | null
  ridgeMae: number | null
  fallbackRate: number | null
  leakageControls: readonly string[]
}>

export function deriveResearchEvidence(payload: unknown): ResearchEvidence | null {
  const parsed = experimentPayloadSchema.safeParse(payload)
  if (!parsed.success) return null

  const { backtest, procurement } = parsed.data
  const baseline = backtest.metrics.find(({ model }) => model === 'baseline_last')

  return Object.freeze({
    experimentVersion: 'v0.3' as const,
    researchGate: backtest.magnitude_variants.research_gate,
    procurementEligible: procurement.strategy.procurement_eligible,
    procurementReason: procurement.strategy.reason ?? null,
    baselineLastMae: baseline?.mae ?? null,
    ridgeMae: backtest.raw_ridge_metrics?.mae ?? null,
    fallbackRate: backtest.magnitude_gate?.fallback_rate ?? null,
    leakageControls: Object.freeze([...backtest.leakage_controls]),
  })
}
