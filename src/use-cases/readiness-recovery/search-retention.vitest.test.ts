import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import { BoundedFeasibilityBackend } from './optimization-backend'
import { epsilonDominates } from './planner'

function candidateKey(actionIds: string[]) {
  return [...actionIds].sort().join('|')
}

describe('Readiness Recovery epsilon-Pareto search retention', () => {
  it('retains a known improving neighbor and exposes an evaluated plan that dominates the strong baseline', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const benchmarked = planReadinessRecoveryWithBenchmarkSuite(input)
    const baseline = benchmarked.baselines.find((item) => item.kind === 'RISK_AWARE_GREEDY')?.scenario

    expect(baseline).toBeDefined()
    if (!baseline) return

    const generated = new BoundedFeasibilityBackend().generateCandidates(input)
    const knownImprovingNeighbors = [
      candidateKey(baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-002:limited')),
      candidateKey(baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-022:full')),
    ]
    const generatedKeys = new Set(generated.candidates.map((candidate) => candidateKey(candidate.selectedActionIds)))

    expect(knownImprovingNeighbors.some((key) => generatedKeys.has(key))).toBe(true)
    expect(benchmarked.frontier.some((scenario) => epsilonDominates(scenario, baseline, input.settings.epsilon))).toBe(
      true
    )
  }, 20_000)
})
