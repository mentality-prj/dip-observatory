import type { RecoveryScenario, ScenarioLabel } from './domain'

const risk = (scenario: RecoveryScenario) => scenario.recoveryFailureRisk + scenario.repeatFailureRisk

function same(a: number, b: number) {
  return Math.abs(a - b) <= 1e-9
}

export function objectiveLabels(frontier: RecoveryScenario[], scenario: RecoveryScenario): ScenarioLabel[] {
  if (!frontier.length) return ['BALANCED']

  const labels: ScenarioLabel[] = []
  const maxProbability = Math.max(...frontier.map((item) => item.probabilityDemandSatisfied))
  const maxReadinessAtProbability = Math.max(
    ...frontier
      .filter((item) => same(item.probabilityDemandSatisfied, maxProbability))
      .map((item) => item.expectedCapabilityReadiness)
  )
  if (
    same(scenario.probabilityDemandSatisfied, maxProbability) &&
    same(scenario.expectedCapabilityReadiness, maxReadinessAtProbability)
  ) {
    labels.push('MAXIMUM_READINESS')
  }

  if (same(scenario.expectedRecoveryTimeHours, Math.min(...frontier.map((item) => item.expectedRecoveryTimeHours)))) {
    labels.push('FAST_RECOVERY')
  }
  if (same(scenario.scarcePartsConsumed, Math.min(...frontier.map((item) => item.scarcePartsConsumed)))) {
    labels.push('PARTS_CONSERVATIVE')
  }
  if (same(risk(scenario), Math.min(...frontier.map(risk)))) {
    labels.push('LOW_RISK')
  }

  if (scenario.label === 'BALANCED' || labels.length === 0) labels.push('BALANCED')
  return [...new Set(labels)]
}

export function decorateObjectiveLabels(frontier: RecoveryScenario[]): RecoveryScenario[] {
  return frontier.map((scenario) => ({ ...scenario, labels: objectiveLabels(frontier, scenario) }))
}
