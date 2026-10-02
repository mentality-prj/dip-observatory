import type { RecoveryScenario, ScenarioLabel } from './domain'

const risk = (scenario: RecoveryScenario) => scenario.recoveryFailureRisk + scenario.repeatFailureRisk

function same(a: number, b: number) {
  return Math.abs(a - b) <= 1e-9
}

/**
 * Resource-oriented labels are meaningful only relative to plans that deliver the
 * best operational outcome available on the frontier. Otherwise a zero-action
 * plan would incorrectly become "fast recovery", "low risk", and
 * "parts conservative" simply because it performs no recovery at all.
 */
export function operationalFrontier(frontier: RecoveryScenario[]): RecoveryScenario[] {
  if (!frontier.length) return []
  const maxProbability = Math.max(...frontier.map((item) => item.probabilityDemandSatisfied))
  const probabilityWinners = frontier.filter((item) => same(item.probabilityDemandSatisfied, maxProbability))
  const maxReadiness = Math.max(...probabilityWinners.map((item) => item.expectedCapabilityReadiness))
  return probabilityWinners.filter((item) => same(item.expectedCapabilityReadiness, maxReadiness))
}

export function objectiveLabels(frontier: RecoveryScenario[], scenario: RecoveryScenario): ScenarioLabel[] {
  if (!frontier.length) return ['BALANCED']

  const labels: ScenarioLabel[] = []
  const operational = operationalFrontier(frontier)
  const isOperational = operational.some((item) => item.scenarioId === scenario.scenarioId)

  if (isOperational) labels.push('MAXIMUM_READINESS')

  if (
    isOperational &&
    same(scenario.expectedRecoveryTimeHours, Math.min(...operational.map((item) => item.expectedRecoveryTimeHours)))
  ) {
    labels.push('FAST_RECOVERY')
  }
  if (
    isOperational &&
    same(scenario.scarcePartsConsumed, Math.min(...operational.map((item) => item.scarcePartsConsumed)))
  ) {
    labels.push('PARTS_CONSERVATIVE')
  }
  if (isOperational && same(risk(scenario), Math.min(...operational.map(risk)))) {
    labels.push('LOW_RISK')
  }

  if (scenario.label === 'BALANCED' || labels.length === 0) labels.push('BALANCED')
  return [...new Set(labels)]
}

export function decorateObjectiveLabels(frontier: RecoveryScenario[]): RecoveryScenario[] {
  return frontier.map((scenario) => ({ ...scenario, labels: objectiveLabels(frontier, scenario) }))
}
