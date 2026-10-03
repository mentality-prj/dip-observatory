import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import { BoundedFeasibilityBackend } from './optimization-backend'
import { epsilonDominates } from './planner'

function candidateKey(actionIds: string[]) {
  return [...actionIds].sort().join('|')
}

function actionDistance(left: string[], right: string[]) {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  return [...new Set([...left, ...right])].filter((actionId) => leftSet.has(actionId) !== rightSet.has(actionId)).length
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
      baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-002:limited'),
      baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-022:full'),
    ]
    const generatedKeys = new Set(generated.candidates.map((candidate) => candidateKey(candidate.selectedActionIds)))
    const retainedNeighbor = knownImprovingNeighbors.some((neighbor) => generatedKeys.has(candidateKey(neighbor)))
    const qdipDominatesBaseline = benchmarked.frontier.some((scenario) =>
      epsilonDominates(scenario, baseline, input.settings.epsilon)
    )
    const nearestDistances = knownImprovingNeighbors.map((neighbor) =>
      Math.min(...generated.candidates.map((candidate) => actionDistance(candidate.selectedActionIds, neighbor)))
    )

    console.log(
      'RR_RETENTION_REPAIR',
      JSON.stringify({
        generatedCandidates: generated.candidates.length,
        searchNodes: generated.searchNodes,
        truncatedByNodeBudget: generated.truncatedByNodeBudget,
        truncatedByTimeBudget: generated.truncatedByTimeBudget,
        retainedNeighbor,
        qdipDominatesBaseline,
        nearestDistances,
        frontierSize: benchmarked.frontier.length,
      })
    )

    expect(retainedNeighbor).toBe(true)
    expect(qdipDominatesBaseline).toBe(true)
  }, 20_000)
})
