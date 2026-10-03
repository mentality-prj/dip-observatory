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

function scarcityScore(input: ReturnType<typeof buildReadinessRecoveryDemo>, candidate: MutableCandidate) {
  return Object.entries(candidate.partsConsumed).reduce((total, [partId, quantity]) => {
    const supply = (input.resources.spareParts[partId] ?? 0) + (candidate.partsProduced[partId] ?? 0)
    return total + quantity / Math.max(1, supply)
  }, 0)
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
    for (const candidate of beam) {
      for (const action of [...(actionByAsset.get(asset.assetId) ?? []), null]) {
        const extended = extendCandidate(input, candidate, action)
        if (extended) next.push(extended)
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
      const maxWorkshopHours = Math.max(1, ...next.map((candidate) => candidate.workshopHours))
      const maxScarcity = Math.max(1, ...next.map((candidate) => scarcityScore(input, candidate)))
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
        workshopGain: (candidate: MutableCandidate) =>
          normalized(candidate.workshopHours, maxWorkshopHours) - 0.25 * normalized(candidate.scoreGain, maxGain),
        scarcityGain: (candidate: MutableCandidate) =>
          normalized(scarcityScore(input, candidate), maxScarcity) - 0.25 * normalized(candidate.scoreGain, maxGain),
        techScarcityGain: (candidate: MutableCandidate) =>
          (normalized(candidate.technicianHours, maxTechnicianHours) +
            normalized(scarcityScore(input, candidate), maxScarcity)) /
            2 -
          0.35 * normalized(candidate.scoreGain, maxGain),
        objectiveProxy: (candidate: MutableCandidate) =>
          (normalized(candidate.scoreTime, maxTime) +
            normalized(candidate.scoreRisk, maxRisk) +
            normalized(candidate.technicianHours, maxTechnicianHours) +
            normalized(scarcityScore(input, candidate), maxScarcity)) /
            4 -
          0.5 * normalized(candidate.scoreGain, maxGain),
        currentJoint: (candidate: MutableCandidate) =>
          (normalized(candidate.scoreTime, maxTime) +
            normalized(candidate.scoreParts, maxParts) +
            normalized(candidate.scoreRisk, maxRisk) +
            normalized(candidate.technicianHours, maxTechnicianHours) +
            normalized(candidate.workshopHours, maxWorkshopHours)) /
            5 -
          0.5 * normalized(candidate.scoreGain, maxGain),
        gainPerAction: (candidate: MutableCandidate) =>
          -candidate.scoreGain / Math.max(1, candidate.selectedActionIds.length),
        gainPerTechnician: (candidate: MutableCandidate) =>
          -candidate.scoreGain / Math.max(1, candidate.technicianHours),
        gainPerWorkshop: (candidate: MutableCandidate) =>
          -candidate.scoreGain / Math.max(1, candidate.workshopHours),
        gainPerScarcity: (candidate: MutableCandidate) =>
          -candidate.scoreGain / Math.max(1, scarcityScore(input, candidate)),
        gainOnly: (candidate: MutableCandidate) => -candidate.scoreGain,
      }
      const sameCardinality = next.filter(
        (candidate) => candidate.selectedActionIds.length === target.selectedActionIds.length
      )

      return {
        stageIndex,
        assetId: asset.assetId,
        candidatesBeforePrune: next.length,
        beamWidth: input.settings.beamWidth,
        perRankTake: Math.max(1, Math.floor(input.settings.beamWidth / 4)),
        actionCount: target.selectedActionIds.length,
        skipCount: stageIndex + 1 - target.selectedActionIds.length,
        sameCardinalityCandidates: sameCardinality.length,
        scores: {
          gain: target.scoreGain,
          time: target.scoreTime,
          parts: target.scoreParts,
          risk: target.scoreRisk,
          technicianHours: target.technicianHours,
          workshopHours: target.workshopHours,
          scarcity: scarcityScore(input, target),
        },
        rankPositions: {
          gainRisk: rankPosition(next, targetKey, ranks.gainRisk),
          timeGain: rankPosition(next, targetKey, ranks.timeGain),
          partsGain: rankPosition(next, targetKey, ranks.partsGain),
          riskGain: rankPosition(next, targetKey, ranks.riskGain),
          technicianGain: rankPosition(next, targetKey, ranks.technicianGain),
          workshopGain: rankPosition(next, targetKey, ranks.workshopGain),
          scarcityGain: rankPosition(next, targetKey, ranks.scarcityGain),
          techScarcityGain: rankPosition(next, targetKey, ranks.techScarcityGain),
          objectiveProxy: rankPosition(next, targetKey, ranks.objectiveProxy),
          currentJoint: rankPosition(next, targetKey, ranks.currentJoint),
          gainPerAction: rankPosition(next, targetKey, ranks.gainPerAction),
          gainPerTechnician: rankPosition(next, targetKey, ranks.gainPerTechnician),
          gainPerWorkshop: rankPosition(next, targetKey, ranks.gainPerWorkshop),
          gainPerScarcity: rankPosition(next, targetKey, ranks.gainPerScarcity),
          gainOnly: rankPosition(next, targetKey, ranks.gainOnly),
        },
        sameCardinalityRankPositions: {
          gainRisk: rankPosition(sameCardinality, targetKey, ranks.gainRisk),
          timeGain: rankPosition(sameCardinality, targetKey, ranks.timeGain),
          objectiveProxy: rankPosition(sameCardinality, targetKey, ranks.objectiveProxy),
          gainPerAction: rankPosition(sameCardinality, targetKey, ranks.gainPerAction),
          gainOnly: rankPosition(sameCardinality, targetKey, ranks.gainOnly),
        },
      }
    }

    beam = retained
  }

  return null
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
      rankAtFirstLoss: traceTargetRankAtFirstLoss(input, target.actions),
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
    expect(traces.every((trace) => trace.rankAtFirstLoss !== null)).toBe(true)
  }, 20_000)
})
