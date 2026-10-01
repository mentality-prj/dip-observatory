import type { BaselineKind, ReadinessRecoveryResult, RecoveryScenario } from './domain'

export type BenchmarkVerdict = 'QDIP_ADVANTAGE' | 'HEURISTIC_PARITY' | 'HEURISTIC_ADVANTAGE' | 'INSUFFICIENT_EVIDENCE'
export type BenchmarkAdvantageKind = 'CAPABILITY' | 'EFFICIENCY' | 'NONE'

export type ReadinessBenchmark = {
  verdict: BenchmarkVerdict
  advantageKind: BenchmarkAdvantageKind
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
    a.expectedRecoveryTimeHours - b.expectedRecoveryTimeHours ||
    a.technicianHours - b.technicianHours ||
    a.scarcePartsConsumed - b.scarcePartsConsumed
  )
}

const round = (value: number) => Number(value.toFixed(4))
const atLeast = (value: number, threshold: number) => value >= threshold
const atMost = (value: number, threshold: number) => value <= threshold

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
      advantageKind: 'NONE',
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

  const qdipCapabilityGain = atLeast(probabilityDelta, 0.05) || atLeast(readinessDelta, 0.03) || atLeast(shortfallReduction, 0.5)
  const heuristicCapabilityGain = atMost(probabilityDelta, -0.05) || atMost(readinessDelta, -0.03) || atMost(shortfallReduction, -0.5)
  const qdipResourceRegression = technicianHoursDelta > 8 || scarcePartsDelta > 0.75 || failureRiskDelta > 0.1
  const heuristicResourceRegression = technicianHoursDelta < -8 || scarcePartsDelta < -0.75 || failureRiskDelta < -0.1

  const capabilityEquivalent =
    Math.abs(probabilityDelta) < 0.05 && Math.abs(readinessDelta) < 0.03 && Math.abs(shortfallReduction) < 0.5
  const qdipEfficiencyGain =
    capabilityEquivalent &&
    recoveryTimeDeltaHours <= 0 &&
    technicianHoursDelta <= 0 &&
    scarcePartsDelta <= 0 &&
    failureRiskDelta <= 0 &&
    (recoveryTimeDeltaHours <= -4 || technicianHoursDelta <= -4 || scarcePartsDelta <= -0.5 || failureRiskDelta <= -0.05)
  const heuristicEfficiencyGain =
    capabilityEquivalent &&
    recoveryTimeDeltaHours >= 0 &&
    technicianHoursDelta >= 0 &&
    scarcePartsDelta >= 0 &&
    failureRiskDelta >= 0 &&
    (recoveryTimeDeltaHours >= 4 || technicianHoursDelta >= 4 || scarcePartsDelta >= 0.5 || failureRiskDelta >= 0.05)

  let verdict: BenchmarkVerdict = 'HEURISTIC_PARITY'
  let advantageKind: BenchmarkAdvantageKind = 'NONE'
  if (qdipCapabilityGain && !qdipResourceRegression) {
    verdict = 'QDIP_ADVANTAGE'
    advantageKind = 'CAPABILITY'
  } else if (heuristicCapabilityGain && !heuristicResourceRegression) {
    verdict = 'HEURISTIC_ADVANTAGE'
    advantageKind = 'CAPABILITY'
  } else if (qdipEfficiencyGain) {
    verdict = 'QDIP_ADVANTAGE'
    advantageKind = 'EFFICIENCY'
  } else if (heuristicEfficiencyGain) {
    verdict = 'HEURISTIC_ADVANTAGE'
    advantageKind = 'EFFICIENCY'
  }

  const explanation = [
    `Compared with ${bestBaseline.kind} under the same normalized input and stochastic seed.`,
    `Δ P(demand satisfied) ${probabilityDelta >= 0 ? '+' : ''}${probabilityDelta.toFixed(3)}; Δ readiness ${readinessDelta >= 0 ? '+' : ''}${readinessDelta.toFixed(3)}; shortfall reduction ${shortfallReduction >= 0 ? '+' : ''}${shortfallReduction.toFixed(2)}.`,
    `Efficiency check: recovery-time ${recoveryTimeDeltaHours >= 0 ? '+' : ''}${recoveryTimeDeltaHours.toFixed(1)}h, technician-hours ${technicianHoursDelta >= 0 ? '+' : ''}${technicianHoursDelta.toFixed(1)}, scarce-parts ${scarcePartsDelta >= 0 ? '+' : ''}${scarcePartsDelta.toFixed(2)}, failure risk ${failureRiskDelta >= 0 ? '+' : ''}${failureRiskDelta.toFixed(3)}.`,
    `Evidence classification: ${verdict}${advantageKind === 'NONE' ? '' : ` (${advantageKind.toLowerCase()} advantage)`}.`,
  ]

  return {
    verdict,
    advantageKind,
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
