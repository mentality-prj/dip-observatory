import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import { BoundedFeasibilityBackend } from './optimization-backend'
import { traceStrongBaselineRetention } from './search-audit'

function actionDistance(left: string[], right: string[]) {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  return [...new Set([...left, ...right])].filter((actionId) => leftSet.has(actionId) !== rightSet.has(actionId)).length
}

describe('Readiness Recovery superior-neighbor retention', () => {
  it('localizes where legacy beam pruning loses the two known improving neighbors', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const benchmarked = planReadinessRecoveryWithBenchmarkSuite(input)
    const baseline = benchmarked.baselines.find((item) => item.kind === 'RISK_AWARE_GREEDY')?.scenario

    expect(baseline).toBeDefined()
    if (!baseline) return

    const targets = [
      {
        id: 'DROP_ASSET_002_LIMITED',
        actions: baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-002:limited'),
      },
      {
        id: 'DROP_ASSET_022_FULL',
        actions: baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-022:full'),
      },
    ]
    const generated = new BoundedFeasibilityBackend().generateCandidates(input)
    const traces = targets.map((target) => ({
      id: target.id,
      firstLoss: traceStrongBaselineRetention(input, target.actions).firstLoss,
      nearestFinalDistance: Math.min(
        ...generated.candidates.map((candidate) => actionDistance(candidate.selectedActionIds, target.actions))
      ),
    }))

    console.log(
      'RR_SUPERIOR_NEIGHBOR_TRACE',
      JSON.stringify({
        generatedCandidates: generated.candidates.length,
        searchNodes: generated.searchNodes,
        truncatedByNodeBudget: generated.truncatedByNodeBudget,
        truncatedByTimeBudget: generated.truncatedByTimeBudget,
        traces,
      })
    )

    expect(generated.truncatedByNodeBudget).toBe(false)
    expect(generated.truncatedByTimeBudget).toBe(false)
    expect(traces.every((trace) => trace.firstLoss !== null)).toBe(true)
  }, 20_000)
})
