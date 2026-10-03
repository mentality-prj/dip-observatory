import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import { actionPartUnits, actionTechnicianHours, expectedActionGain } from './optimization-backend'
import { epsilonDominates, planReadinessRecovery } from './planner'

function marginalScore(input: ReturnType<typeof buildReadinessRecoveryDemo>, actionId: string) {
  const action = input.recoveryActions.find((item) => item.actionId === actionId)
  if (!action) return Number.POSITIVE_INFINITY
  const gain = expectedActionGain(input, action)
  const reliability = action.successProbability * (1 - action.repeatFailureProbability)
  const cost = Math.max(1, actionTechnicianHours(action) + action.workshopHours + actionPartUnits(action))
  const dependencyPenalty = 1 + (action.dependsOnActionIds?.length ?? 0) * 0.12
  return (gain * reliability) / (cost * dependencyPenalty)
}

describe('Readiness Recovery incumbent polishing', () => {
  it('finds a native epsilon-dominator of the strong greedy baseline without search truncation', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const native = planReadinessRecovery(input)
    const result = planReadinessRecoveryWithBenchmarkSuite(input)
    const baseline = result.baselines.find((item) => item.kind === 'RISK_AWARE_GREEDY')?.scenario

    expect(baseline).toBeDefined()
    if (!baseline) return

    const dominators = result.frontier.filter((scenario) =>
      epsilonDominates(scenario, baseline, input.settings.epsilon)
    )
    const deletionPriority = [...baseline.selectedActions]
      .sort((a, b) => marginalScore(input, a) - marginalScore(input, b) || a.localeCompare(b))
      .map((actionId, index) => ({ actionId, rank: index + 1, score: marginalScore(input, actionId) }))

    console.log(
      'RR_INCUMBENT_POLISHING',
      JSON.stringify({
        native: {
          evaluatedCandidates: native.diagnostics.evaluatedCandidates,
          elapsedMs: native.diagnostics.elapsedMs,
        },
        polished: {
          evaluatedCandidates: result.diagnostics.evaluatedCandidates,
          elapsedMs: result.diagnostics.elapsedMs,
        },
        evaluatedCandidateRatio:
          result.diagnostics.evaluatedCandidates / Math.max(1, native.diagnostics.evaluatedCandidates),
        elapsedRatio: result.diagnostics.elapsedMs / Math.max(1, native.diagnostics.elapsedMs),
        truncatedByNodeBudget: result.diagnostics.truncatedByNodeBudget,
        truncatedByTimeBudget: result.diagnostics.truncatedByTimeBudget,
        frontierCount: result.frontier.length,
        dominatorCount: dominators.length,
        deletionPriority,
      })
    )

    expect(result.diagnostics.truncatedByNodeBudget).toBe(false)
    expect(result.diagnostics.truncatedByTimeBudget).toBe(false)
    expect(dominators.length).toBeGreaterThan(0)
  }, 30_000)
})
