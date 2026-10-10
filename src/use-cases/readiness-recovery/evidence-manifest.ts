import type { ReadinessRecoveryInput, ReadinessRecoveryResult, RecoveryScenario } from './domain'

export type EvidenceMetric = { key: string; value: string; definition: string }
export type EvidenceManifest = {
  schema: 'readiness-recovery.v1'
  authority: 'OBSERVATORY_SIMULATION'
  asOf: string
  scenarioId: string | null
  selectionBias: 'NOT_CORRECTED'
  comparativeConclusion: 'NOT_ESTABLISHED'
  quantiles: [number, number, number] | null
  metrics: EvidenceMetric[]
}
/** Untrusted imported results cannot determine provenance; values are derived from a trusted call site. */
export function buildEvidenceManifest(
  input: ReadinessRecoveryInput,
  result: ReadinessRecoveryResult,
  selected: RecoveryScenario | null
): EvidenceManifest {
  const metrics: EvidenceMetric[] = []
  if (selected) {
    const add = (key: string, value: number, definition: string) =>
      metrics.push({ key, value: String(value), definition })
    add(
      'expectedCapabilityReadiness',
      selected.expectedCapabilityReadiness,
      'Monte Carlo mean weighted capability fill (model-only)'
    )
    add(
      'probabilityDemandSatisfied',
      selected.probabilityDemandSatisfied,
      'Monte Carlo success fraction, n=' + selected.uncertaintySummary.samples
    )
    add('capabilityShortfall', selected.capabilityShortfall, 'Monte Carlo mean unmet capability quantity')
    add(
      'expectedRecoveryTimeHours',
      selected.expectedRecoveryTimeHours,
      'Monte Carlo mean maximum completion duration, hours'
    )
    add('technicianHours', selected.technicianHours, 'Candidate resource consumption, technician-hours')
    add('scarcePartsConsumed', selected.scarcePartsConsumed, 'Relative parts pressure score, not monetary cost')
    add('recoveryFailureRisk', selected.recoveryFailureRisk, 'Simulated probability of any action failure')
    add('repeatFailureRisk', selected.repeatFailureRisk, 'Simulated probability of repeat repair failure')
  }
  return {
    schema: 'readiness-recovery.v1',
    authority: 'OBSERVATORY_SIMULATION',
    asOf: input.asOf,
    scenarioId: selected?.scenarioId ?? null,
    selectionBias: 'NOT_CORRECTED',
    comparativeConclusion: 'NOT_ESTABLISHED',
    quantiles: selected
      ? [
          selected.uncertaintySummary.p10RecoveryTimeHours,
          selected.uncertaintySummary.p50RecoveryTimeHours,
          selected.uncertaintySummary.p90RecoveryTimeHours,
        ]
      : null,
    metrics,
  }
}
