import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import { emptyCandidate, extendCandidate, retainDiverseBeam, type MutableCandidate } from './optimization-backend'

const key = (ids: string[]) => [...ids].sort().join('|')
const normalized = (value: number, scale: number) => (scale > 0 ? value / scale : value)

function rank(
  candidates: MutableCandidate[],
  targetKey: string,
  score: (candidate: MutableCandidate) => number
) {
  return [...candidates].sort((a, b) => score(a) - score(b)).findIndex((candidate) => key(candidate.selectedActionIds) === targetKey) + 1
}

function traceSkipRanks(input: ReturnType<typeof buildReadinessRecoveryDemo>, targetActions: string[]) {
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
    .sort((a, b) => a.assetId.localeCompare(b.assetId))
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
    const retained = retainDiverseBeam(next, input.settings.beamWidth)

    if (target && !retained.some((candidate) => key(candidate.selectedActionIds) === targetKey)) {
      const skips = next.filter((candidate) => candidate.id.endsWith(':skip'))
      const maxGain = Math.max(1, ...next.map((candidate) => candidate.scoreGain))
      const maxTime = Math.max(1, ...next.map((candidate) => candidate.scoreTime))
      const maxParts = Math.max(1, ...next.map((candidate) => candidate.scoreParts))
      const maxRisk = Math.max(1, ...next.map((candidate) => candidate.scoreRisk))
      const maxTech = Math.max(1, ...next.map((candidate) => candidate.technicianHours))
      const economic = (candidate: MutableCandidate) =>
        (normalized(candidate.scoreTime, maxTime) +
          normalized(candidate.scoreParts, maxParts) +
          normalized(candidate.scoreRisk, maxRisk) +
          normalized(candidate.technicianHours, maxTech)) /
          4 -
        0.5 * normalized(candidate.scoreGain, maxGain)

      return {
        stage,
        assetId: asset.assetId,
        candidatesBeforePrune: next.length,
        skipCandidates: skips.length,
        perChannelQuota: Math.max(1, Math.floor(input.settings.beamWidth / 4)),
        ranks: {
          gainRisk: rank(
            skips,
            targetKey,
            (candidate) => -normalized(candidate.scoreGain, maxGain) + 0.08 * normalized(candidate.scoreRisk, maxRisk)
          ),
          timeGain: rank(
            skips,
            targetKey,
            (candidate) => normalized(candidate.scoreTime, maxTime) - 0.25 * normalized(candidate.scoreGain, maxGain)
          ),
          partsGain: rank(
            skips,
            targetKey,
            (candidate) => normalized(candidate.scoreParts, maxParts) - 0.2 * normalized(candidate.scoreGain, maxGain)
          ),
          riskGain: rank(
            skips,
            targetKey,
            (candidate) => normalized(candidate.scoreRisk, maxRisk) - 0.2 * normalized(candidate.scoreGain, maxGain)
          ),
          technicianGain: rank(
            skips,
            targetKey,
            (candidate) => normalized(candidate.technicianHours, maxTech) - 0.25 * normalized(candidate.scoreGain, maxGain)
          ),
          gainPerTechnician: rank(
            skips,
            targetKey,
            (candidate) => -candidate.scoreGain / Math.max(1, candidate.technicianHours)
          ),
          economic,
        },
        economicRank: rank(skips, targetKey, economic),
      }
    }

    beam = retained
  }

  return null
}

describe('Readiness Recovery skip-child retention diagnostics', () => {
  it('measures known superior prefixes inside the skip branch at their first legacy loss', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const benchmarked = planReadinessRecoveryWithBenchmarkSuite(input)
    const baseline = benchmarked.baselines.find((item) => item.kind === 'RISK_AWARE_GREEDY')?.scenario

    expect(baseline).toBeDefined()
    if (!baseline) return

    const traces = [
      traceSkipRanks(input, baseline.selectedActions.filter((id) => id !== 'ASSET-002:limited')),
      traceSkipRanks(input, baseline.selectedActions.filter((id) => id !== 'ASSET-022:full')),
    ]

    console.log('RR_SKIP_RETENTION_TRACE', JSON.stringify(traces))
    expect(traces.every(Boolean)).toBe(true)
  }, 20_000)
})
