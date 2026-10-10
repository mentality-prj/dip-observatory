import type { ReadinessRecoveryResult, RecoveryScenario } from './domain'

/** Viewing priorities are sorting aids, NOT a business utility function or optimizer inputs. */
export type ViewingPriority = 'READINESS' | 'RECOVERY_TIME' | 'PARTS' | 'FAILURE_RISK'
const risk = (s: RecoveryScenario) => s.recoveryFailureRisk + s.repeatFailureRisk

export function orderReviewAlternatives(
  result: ReadinessRecoveryResult | null,
  priority: ViewingPriority
): RecoveryScenario[] {
  if (!result) return []
  const frontier = result.frontier.filter((s) => Number.isFinite(s.probabilityDemandSatisfied))
  return [...frontier].sort((a, b) => {
    const primary = priority === 'RECOVERY_TIME' ? a.expectedRecoveryTimeHours - b.expectedRecoveryTimeHours
      : priority === 'PARTS' ? a.scarcePartsConsumed - b.scarcePartsConsumed
      : priority === 'FAILURE_RISK' ? risk(a) - risk(b)
      : b.expectedCapabilityReadiness - a.expectedCapabilityReadiness
    // Readiness probability is a secondary display metric only, not a global utility.
    return primary || b.probabilityDemandSatisfied - a.probabilityDemandSatisfied ||
      a.scenarioId.localeCompare(b.scenarioId)
  })
}

export function explainReviewDifference(selected: RecoveryScenario, comparator: RecoveryScenario) {
  return {
    recoveryHours: selected.expectedRecoveryTimeHours - comparator.expectedRecoveryTimeHours,
    readiness: selected.expectedCapabilityReadiness - comparator.expectedCapabilityReadiness,
    probability: selected.probabilityDemandSatisfied - comparator.probabilityDemandSatisfied,
    scarceParts: selected.scarcePartsConsumed - comparator.scarcePartsConsumed,
    failureRisk: selected.recoveryFailureRisk - comparator.recoveryFailureRisk,
  }
}
