import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'
import {
  BoundedFeasibilityBackend,
  emptyCandidate,
  extendCandidate,
  retainDiverseBeam,
  type MutableCandidate,
} from './optimization-backend'
import { traceStrongBaselineRetention } from './search-audit'

function actionDistance(left: string[], right: string[]) {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  return [...new Set([...left, ...right])].filter((actionId) => leftSet.has(actionId) !== rightSet.has(actionId)).length
}

function candidateKey(actionIds: string[]) {
  return [...actionIds].sort().join('|')
}

function normalized(value: number, scale: number) {
  return scale > 0 ? value / scale : value
}

function rankPosition(
  candidates: MutableCandidate[],
  targetKey: string,
  rank: (candidate: MutableCandidate) => number
) {
  return (
    [...candidates]
      .sort((left, right) => rank(left) - rank(right))
      .findIndex((candidate) => candidateKey(candidate.selectedActionIds) === targetKey) + 1
  )
}

function lineageRank(
  candidates: MutableCandidate[],
  parentByChildKey: Map<string, string>,
  targetKey: string,
  rank: (candidate: MutableCandidate) => number
) {
  const targetParentKey = parentByChildKey.get(targetKey)
  if (!targetParentKey) return { isParentBest: false, rank: 0 }

  const bestByParent = new Map<string, MutableCandidate>()
  for (const candidate of candidates) {
    const childKey = candidateKey(candidate.selectedActionIds)
    const parentKey = parentByChildKey.get(childKey)
    if (!parentKey) continue
    const current = bestByParent.get(parentKey)
    if (!current || rank(candidate) < rank(current)) bestByParent.set(parentKey, candidate)
  }

  const targetBest = bestByParent.get(targetParentKey)
  return {
    isParentBest: targetBest ? candidateKey(targetBest.selectedActionIds) === targetKey : false,
    rank: targetBest ? rankPosition([...bestByParent.values()], candidateKey(targetBest.selectedActionIds), rank) : 0,
  }
}

function traceTargetRankAtFirstLoss(input: ReturnType<typeof buildReadinessRecoveryDemo>, targetActions: string[]) {
  const actionByAsset = new Map<string, typeof input.recoveryActions>()
  const actionById = new Map(input.recoveryActions.map((action) => [action.actionId, action]))
  for (const action of input.recoveryActions) {
    if (action.type === 'DEFER') continue
    const list = actionByAsset.get(action.assetId) ?? []
    list.push(action)
    actionByAsset.set(action.assetId, list)
  }

  const targetActionByAsset = new Map<string, string>()
  for (const actionId of targetActions) {
    const action = actionById.get(actionId)
    if (action) targetActionByAsset.set(action.assetId, actionId)
  }

  const impaired = input.assets
    .filter((asset) => asset.currentState !== 'READY')
    .sort((left, right) => left.assetId.localeCompare(right.assetId))
  const processedAssets: string[] = []
  let beam: MutableCandidate[] = [emptyCandidate()]

  for (let stageIndex = 0; stageIndex < impaired.length; stageIndex += 1) {
    const asset = impaired[stageIndex]
    processedAssets.push(asset.assetId)
    const next: MutableCandidate[] = []
    const parentByChildKey = new Map<string, string>()
    for (const candidate of beam) {
      const parentKey = candidateKey(candidate.selectedActionIds)
      for (const action of [...(actionByAsset.get(asset.assetId) ?? []), null]) {
        const extended = extendCandidate(input, candidate, action)
        if (extended) {
          next.push(extended)
          parentByChildKey.set(candidateKey(extended.selectedActionIds), parentKey)
        }
      }
    }

    const targetPrefix = processedAssets
      .map((assetId) => targetActionByAsset.get(assetId))
      .filter((actionId): actionId is string => Boolean(actionId))
    const targetKey = candidateKey(targetPrefix)
    const target = next.find((candidate) => candidateKey(candidate.selectedActionIds) === targetKey)
    const retained = retainDiverseBeam(next, input.settings.beamWidth)
    const targetRetained = retained.some((candidate) => candidateKey(candidate.selectedActionIds) === targetKey)

    if (target && !targetRetained) {
      const maxGain = Math.max(1, ...next.map((candidate) => candidate.scoreGain))
      const maxTime = Math.max(1, ...next.map((candidate) => candidate.scoreTime))
      const maxParts = Math.max(1, ...next.map((candidate) => candidate.scoreParts))
      const maxRisk = Math.max(1, ...next.map((candidate) => candidate.scoreRisk))
      const maxTechnicianHours = Math.max(1, ...next.map((candidate) => candidate.technicianHours))
      const ranks = {
        gainRisk: (candidate: MutableCandidate) =>
          -normalized(candidate.scoreGain, maxGain) + 0.08 * normalized(candidate.scoreRisk, maxRisk),
        timeGain: (candidate: MutableCandidate) =>
          normalized(candidate.scoreTime, maxTime) - 0.25 * normalized(candidate.scoreGain, maxGain),
        partsGain: (candidate: MutableCandidate) =>
          normalized(candidate.scoreParts, maxParts) - 0.2 * normalized(candidate.scoreGain, maxGain),
        riskGain: (candidate: MutableCandidate) =>
          normalized(candidate.scoreRisk, maxRisk) - 0.2 * normalized(candidate.scoreGain, maxGain),
        technicianGain: (candidate: MutableCandidate) =>
          normalized(candidate.technicianHours, maxTechnicianHours) - 0.25 * normalized(candidate.scoreGain, maxGain),
        gainOnly: (candidate: MutableCandidate) => -candidate.scoreGain,
      }

      return {
        stageIndex,
        assetId: asset.assetId,
        candidatesBeforePrune: next.length,
        parentCount: beam.length,
        beamWidth: input.settings.beamWidth,
        perRankTake: Math.max(1, Math.floor(input.settings.beamWidth / 4)),
        targetParentRetainedBeforeExpansion: parentByChildKey.has(targetKey),
        rankPositions: {
          gainRisk: rankPosition(next, targetKey, ranks.gainRisk),
          timeGain: rankPosition(next, targetKey, ranks.timeGain),
          partsGain: rankPosition(next, targetKey, ranks.partsGain),
          riskGain: rankPosition(next, targetKey, ranks.riskGain),
          technicianGain: rankPosition(next, targetKey, ranks.technicianGain),
          gainOnly: rankPosition(next, targetKey, ranks.gainOnly),
        },
        lineageRankPositions: {
          gainRisk: lineageRank(next, parentByChildKey, targetKey, ranks.gainRisk),
          timeGain: lineageRank(next, parentByChildKey, targetKey, ranks.timeGain),
          partsGain: lineageRank(next, parentByChildKey, targetKey, ranks.partsGain),
          riskGain: lineageRank(next, parentByChildKey, targetKey, ranks.riskGain),
          technicianGain: lineageRank(next, parentByChildKey, targetKey, ranks.technicianGain),
          gainOnly: lineageRank(next, parentByChildKey, targetKey, ranks.gainOnly),
        },
      }
    }

    beam = retained
  }

  return null
}

describe('Readiness Recovery superior-neighbor retention', () => {
  it('localizes lineage collapse for the two known improving neighbors', () => {
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
      rankAtFirstLoss: traceTargetRankAtFirstLoss(input, target.actions),
      nearestFinalDistance: Math.min(
        ...generated.candidates.map((candidate) => actionDistance(candidate.selectedActionIds, target.actions))
      ),
    }))

    console.log(
      'RR_LINEAGE_RETENTION_TRACE',
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
    expect(traces.every((trace) => trace.rankAtFirstLoss !== null)).toBe(true)
  }, 20_000)
})
