import { describe, expect, it } from 'vitest'
import { buildEvidenceManifest } from './evidence-manifest'
import { exportAnalysis } from './data-workspace'
import type { ReadinessRecoveryInput, ReadinessRecoveryResult, RecoveryScenario } from './domain'
const selected = {
  scenarioId: 'a',
  expectedCapabilityReadiness: 0.9,
  probabilityDemandSatisfied: 0.7,
  capabilityShortfall: 0.1,
  expectedRecoveryTimeHours: 3,
  technicianHours: 4,
  scarcePartsConsumed: 0.2,
  recoveryFailureRisk: 0.3,
  repeatFailureRisk: 0.1,
  uncertaintySummary: {
    samples: 500,
    seed: 5,
    demandSatisfiedSamples: 350,
    p10RecoveryTimeHours: 1,
    p50RecoveryTimeHours: 2,
    p90RecoveryTimeHours: 4,
  },
} as RecoveryScenario
describe('evidence manifest', () => {
  it('distinguishes observed quantiles from statistical superiority', () => {
    const x = buildEvidenceManifest(
      { asOf: '2026-10-10T00:00:00Z' } as ReadinessRecoveryInput,
      { frontier: [selected] } as unknown as ReadinessRecoveryResult,
      selected
    )
    expect(x.quantiles).toEqual([1, 2, 4])
    expect(x.comparativeConclusion).toBe('NOT_ESTABLISHED')
    expect(x.selectionBias).toBe('NOT_CORRECTED')
    expect(x.authority).toBe('OBSERVATORY_SIMULATION')
    expect(x.metrics.find((m) => m.key === 'probabilityDemandSatisfied')?.definition).toContain('n=500')
  })
  it('exports only model-local evidence, never a verified Kernel claim', () => {
    const input = { asOf: '2026-10-10T00:00:00Z' } as ReadinessRecoveryInput
    const result = { frontier: [selected] } as unknown as ReadinessRecoveryResult
    const output = exportAnalysis(input, result, selected)
    expect(output.evidence?.authority).toBe('OBSERVATORY_SIMULATION')
    expect(output.evidence?.comparativeConclusion).toBe('NOT_ESTABLISHED')
    expect(output.evidence?.quantiles).toEqual([1, 2, 4])
  })
  it('does not fabricate metrics when no plan exists', () => {
    const x = buildEvidenceManifest(
      { asOf: '2026-10-10T00:00:00Z' } as ReadinessRecoveryInput,
      { frontier: [] } as unknown as ReadinessRecoveryResult,
      null
    )
    expect(x.metrics).toEqual([])
    expect(x.quantiles).toBeNull()
  })
})
