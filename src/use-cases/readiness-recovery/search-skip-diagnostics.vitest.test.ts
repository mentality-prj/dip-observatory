import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import { emptyCandidate, extendCandidate, retainDiverseBeam, type MutableCandidate } from './optimization-backend'

function key(actionIds: string[]) {
  return [...actionIds].sort().join('|')
}

function normalized(value: number, scale: number) {
  return scale > 0 ? value / scale : value
}

function scarcity(input: ReturnType<typeof buildReadinessRecoveryDemo>, candidate: MutableCandidate) {
  return Object.entries(candidate.partsConsumed).reduce((total, [partId, quantity]) => {
    const supply = (input.resources.spareParts[partId] ?? 0) + (candidate.partsProduced[partId] ?? 0)
    return total + quantity / Math.max(1, supply)
  }, 0)
}

function difference(left: string[], right: string[]) {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  return {
    addedVsTarget: left.filter((id) => !rightSet.has(id)),
    removedVsTarget: right.filter((id) => !leftSet.has(id)),
  }
}

function traceCompetitors(input: ReturnType<typeof buildReadinessRecoveryDemo>, targetActions: string[]) {
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
    const survives = retained.some((candidate) => key(candidate.selectedActionIds) === targetKey)

    if (target && !survives) {
      const same = next.filter((candidate) => candidate.selectedActionIds.length === target.selectedActionIds.length)
      const maxGain = Math.max(1, ...next.map((candidate) => candidate.scoreGain))
      const maxTime = Math.max(1, ...next.map((candidate) => candidate.scoreTime))
      const maxRisk = Math.max(1, ...next.map((candidate) => candidate.scoreRisk))
      const maxTech = Math.max(1, ...next.map((candidate) => candidate.technicianHours))
      const maxScarcity = Math.max(1, ...next.map((candidate) => scarcity(input, candidate)))
      const proxy = (candidate: MutableCandidate) =>
        (normalized(candidate.scoreTime, maxTime) +
          normalized(candidate.scoreRisk, maxRisk) +
          normalized(candidate.technicianHours, maxTech) +
          normalized(scarcity(input, candidate), maxScarcity)) /
          4 -
        0.5 * normalized(candidate.scoreGain, maxGain)
      const competitors = [...same]
        .sort((left, right) => proxy(left) - proxy(right))
        .slice(0, 5)
        .map((candidate, index) => ({
          rank: index + 1,
          isTarget: key(candidate.selectedActionIds) === targetKey,
          ...difference(candidate.selectedActionIds, target.selectedActionIds),
          actions: candidate.selectedActionIds,
          proxy: proxy(candidate),
          gain: candidate.scoreGain,
          time: candidate.scoreTime,
          technicianHours: candidate.technicianHours,
          scarcity: scarcity(input, candidate),
          risk: candidate.scoreRisk,
        }))

      return { stage, assetId: asset.assetId, targetActions: target.selectedActionIds, competitors }
    }
    beam = retained
  }
  return null
}

describe('Readiness Recovery skip/action diagnostics', () => {
  it('prints same-cardinality competitors that displace known superior neighbors', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const result = planReadinessRecoveryWithBenchmarkSuite(input)
    const baseline = result.baselines.find((item) => item.kind === 'RISK_AWARE_GREEDY')?.scenario
    expect(baseline).toBeDefined()
    if (!baseline) return

    const targets = [
      baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-002:limited'),
      baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-022:full'),
    ]
    const traces = targets.map((target) => traceCompetitors(input, target))
    console.log('RR_SKIP_COMPETITORS', JSON.stringify(traces))
    expect(traces.every(Boolean)).toBe(true)
  }, 20_000)
})
