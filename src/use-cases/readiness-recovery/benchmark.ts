import type { BaselineKind, ReadinessRecoveryResult, RecoveryScenario } from './domain'

export type BenchmarkVerdict = 'QDIP_ADVANTAGE' | 'HEURISTIC_PARITY' | 'HEURISTIC_ADVANTAGE' | 'INSUFFICIENT_EVIDENCE'

export type ReadinessBenchmark = {
  verdict: BenchmarkVerdict
  qdip: RecoveryScenario | null
  baseline: RecoveryScenario | null
  baselineKind: BaselineKind | null
  probabilityDelta: number
  readinessDelta: number
  shortfallReduction: number
  recoveryTimeDeltaHours: number
  technicianHoursDelta: number
  scarcePartsDelta: number
  failureRiskDelta: number
  material: boolean
  explanation: string[]
}

function stronger(a: RecoveryScenario, b: RecoveryScenario) {
  return (
    b.probabilityDemandSatisfied - a.probabilityDemandSatisfied ||
    b.expectedCapabilityReadiness - a.expectedCapabilityReadiness ||
    a.capabilityShortfall - b.capabilityShortfall ||
    a.recoveryFailureRisk - b.recoveryFailureRisk ||
    a.technicianHours - b.technicianHours
  )
}

const round = (value: number) => Number(value.toFixed(4))

export function benchmarkReadinessResult(result: ReadinessRecoveryResult): ReadinessBenchmark {
  const qdip = [...result.frontier].sort(stronger)[0] ?? null
  const baselines = result.baselines
    .filter((item): item is typeof item & { scenario: RecoveryScenario } => Boolean(item.scenario))
    .sort((a, b) => stronger(a.scenario, b.scenario))
  const bestBaseline = baselines[0] ?? null
  const baseline = bestBaseline?.scenario ?? null

  if (!qdip || !baseline) {
    return {
      verdict: 'INSUFFICIENT_EVIDENCE',
      qdip,
      baseline,
      baselineKind: bestBaseline?.kind ?? null,
      probabilityDelta: 0,
      readinessDelta: 0,
      shortfallReduction: 0,
      recoveryTimeDeltaHours: 0,
      technicianHoursDelta: 0,
      scarcePartsDelta: 0,
      failureRiskDelta: 0,
      material: false,
      explanation: ['A comparable QDIP scenario and feasible heuristic baseline are both required.'],
    }
  }

  const probabilityDelta = round(qdip.probabilityDemandSatisfied - baseline.probabilityDemandSatisfied)
  const readinessDelta = round(qdip.expectedCapabilityReadiness - baseline.expectedCapabilityReadiness)
  const shortfallReduction = round(baseline.capabilityShortfall - qdip.capabilityShortfall)
  const recoveryTimeDeltaHours = round(qdip.expectedRecoveryTimeHours - baseline.expectedRecoveryTimeHours)
  const technicianHoursDelta = round(qdip.technicianHours - baseline.technicianHours)
  const scarcePartsDelta = round(qdip.scarcePartsConsumed - baseline.scarcePartsConsumed)
  const failureRiskDelta = round(qdip.recoveryFailureRisk - baseline.recoveryFailureRisk)

  const qdipOperationalGain = probabilityDelta >= 0.05 || readinessDelta >= 0.03 || shortfallReduction >= 0.5
  const heuristicOperationalGain = probabilityDelta <= -0.05 || readinessDelta <= -0.03 || shortfallReduction <= -0.5
  const qdipResourceRegression = technicianHoursDelta > 8 || scarcePartsDelta > 0.75 || failureRiskDelta > 0.1
  const heuristicResourceRegression = technicianHoursDelta < -8 || scarcePartsDelta < -0.75 || failureRiskDelta < -0.1

  let verdict: BenchmarkVerdict = 'HEURISTIC_PARITY'
  if (qdipOperationalGain && !qdipResourceRegression) verdict = 'QDIP_ADVANTAGE'
  else if (heuristicOperationalGain && !heuristicResourceRegression) verdict = 'HEURISTIC_ADVANTAGE'

  const explanation = [
    `Compared with ${bestBaseline.kind} under the same normalized input and stochastic seed.`,
    `Δ P(demand satisfied) ${probabilityDelta >= 0 ? '+' : ''}${probabilityDelta.toFixed(3)}; Δ readiness ${readinessDelta >= 0 ? '+' : ''}${readinessDelta.toFixed(3)}; shortfall reduction ${shortfallReduction >= 0 ? '+' : ''}${shortfallReduction.toFixed(2)}.`,
    `Resource/risk check: technician-hours ${technicianHoursDelta >= 0 ? '+' : ''}${technicianHoursDelta.toFixed(1)}, scarce-parts ${scarcePartsDelta >= 0 ? '+' : ''}${scarcePartsDelta.toFixed(2)}, failure risk ${failureRiskDelta >= 0 ? '+' : ''}${failureRiskDelta.toFixed(3)}.`,
  ]

  return {
    verdict,
    qdip,
    baseline,
    baselineKind: bestBaseline.kind,
    probabilityDelta,
    readinessDelta,
    shortfallReduction,
    recoveryTimeDeltaHours,
    technicianHoursDelta,
    scarcePartsDelta,
    failureRiskDelta,
    material: verdict !== 'HEURISTIC_PARITY',
    explanation,
  }
}
