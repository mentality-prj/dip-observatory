import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import { BoundedFeasibilityBackend } from './optimization-backend'
import { epsilonDominates } from './planner'

describe('Readiness Recovery resource-aware beam retention', () => {
  it('finds a native plan that epsilon-dominates the strong greedy baseline without search truncation', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const generated = new BoundedFeasibilityBackend().generateCandidates(input)
    const result = planReadinessRecoveryWithBenchmarkSuite(input)
    const baseline = result.baselines.find((item) => item.kind === 'RISK_AWARE_GREEDY')?.scenario

    expect(generated.truncatedByNodeBudget).toBe(false)
    expect(generated.truncatedByTimeBudget).toBe(false)
    expect(baseline).toBeDefined()
    if (!baseline) return

    const dominators = result.frontier.filter((scenario) =>
      epsilonDominates(scenario, baseline, input.settings.epsilon)
    )

    expect(dominators.length).toBeGreaterThan(0)
  }, 20_000)
})
