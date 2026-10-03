import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import { epsilonDominates, planReadinessRecovery } from './planner'

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
      })
    )

    expect(result.diagnostics.truncatedByNodeBudget).toBe(false)
    expect(result.diagnostics.truncatedByTimeBudget).toBe(false)
    expect(dominators.length).toBeGreaterThan(0)
  }, 30_000)
})
