import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import { emptyCandidate, extendCandidate, retainDiverseBeam, type MutableCandidate } from './optimization-backend'

const key = (ids: string[]) => [...ids].sort().join('|')
const normalized = (value: number, scale: number) => (scale > 0 ? value / scale : value)

function scarcity(input: ReturnType<typeof buildReadinessRecoveryDemo>, candidate: MutableCandidate) {
  return Object.entries(candidate.partsConsumed).reduce((total, [partId, quantity]) => {
    const supply = (input.resources.spareParts[partId] ?? 0) + (candidate.partsProduced[partId] ?? 0)
    return total + quantity / Math.max(1, supply)
  }, 0)
}

function traceSkipRank(input: ReturnType<typeof buildReadinessRecoveryDemo>, targetActions: string[]) {
  const byAsset = new Map<string, typeof input.recoveryActions>()
  const byId = new Map(input.recoveryActions.map((action) => [action.actionId, action]))
  for (const action of input.recoveryActions) {
    if (action.type === 'DEFER') continue
    const actions = byAsset.get(action.assetId) ?? []
    actions.push(action)
    byAsset.set(action.assetId, actions)
  }
  const targetByAsset = new Map<string, string>()
  for (const actionId of targetActions) {
    const action = byId.get(actionId)
    if (action) targetByAsset.set(action.assetId, actionId)
  }

  const impaired = input.assets
    .filter((asset) => asset.currentState !== 'READY')
    .sort((left, right) => left.assetId.localeCompare(right.assetId))
  const processed: string[] = []
  let beam: MutableCandidate[] = [emptyCandidate()]

  for (let stage = 0; stage < impaired.length; stage += 1) {
    const asset = impaired[stage]
    processed.push(asset.assetId)
    const next: MutableCandidate[] = []
    for (const candidate of beam) {
      for (const action of [...(byAsset.get(asset.assetId) ?? []), null]) {
        const extended = extendCandidate(input, candidate, action)
        if (extended) next.push(extended)
      }
    }
    const targetPrefix = processed
      .map((assetId) => targetByAsset.get(assetId))
      .filter((actionId): actionId is string => Boolean(actionId))
    const targetKey = key(targetPrefix)
    const target = next.find((candidate) => key(candidate.selectedActionIds) === targetKey)
    const retained = retainDiverseBeam(next, input.settings.beamWidth, input)
    if (target && !retained.some((candidate) => key(candidate.selectedActionIds) === targetKey)) {
      const skips = next.filter((candidate) => candidate.id.endsWith(':skip'))
      const maxGain = Math.max(1, ...next.map((candidate) => candidate.scoreGain))
      const maxTime = Math.max(1, ...next.map((candidate) => candidate.scoreTime))
      const maxRisk = Math.max(1, ...next.map((candidate) => candidate.scoreRisk))
      const maxTech = Math.max(1, ...next.map((candidate) => candidate.technicianHours))
      const maxScarcity = Math.max(1, ...next.map((candidate) => scarcity(input, candidate)))
      const objective = (candidate: MutableCandidate) =>
        (normalized(candidate.scoreTime, maxTime) +
          normalized(candidate.scoreRisk, maxRisk) +
          normalized(candidate.technicianHours, maxTech) +
          normalized(scarcity(input, candidate), maxScarcity)) /
          4 -
        0.5 * normalized(candidate.scoreGain, maxGain)
      const rank = (fn: (candidate: MutableCandidate) => number) =>
        [...skips].sort((a, b) => fn(a) - fn(b)).findIndex((candidate) => key(candidate.selectedActionIds) === targetKey) + 1
      return {
        stage,
        assetId: asset.assetId,
        skipCandidates: skips.length,
        objectiveRank: rank(objective),
        gainRiskRank: rank(
          (candidate) => -normalized(candidate.scoreGain, maxGain) + 0.08 * normalized(candidate.scoreRisk, maxRisk)
        ),
        timeGainRank: rank(
          (candidate) => normalized(candidate.scoreTime, maxTime) - 0.25 * normalized(candidate.scoreGain, maxGain)
        ),
        technicianEfficiencyRank: rank(
          (candidate) => -candidate.scoreGain / Math.max(1, candidate.technicianHours)
        ),
      }
    }
    beam = retained
  }
  return null
}

describe('Readiness Recovery skip branch rank', () => {
  it('measures known superior prefixes among skip children', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const result = planReadinessRecoveryWithBenchmarkSuite(input)
    const baseline = result.baselines.find((item) => item.kind === 'RISK_AWARE_GREEDY')?.scenario
    expect(baseline).toBeDefined()
    if (!baseline) return

    const traces = [
      traceSkipRank(input, baseline.selectedActions.filter((id) => id !== 'ASSET-002:limited')),
      traceSkipRank(input, baseline.selectedActions.filter((id) => id !== 'ASSET-022:full')),
    ]
    console.log('RR_SKIP_RANK', JSON.stringify(traces))
    expect(traces.every(Boolean)).toBe(true)
  }, 20_000)
})
