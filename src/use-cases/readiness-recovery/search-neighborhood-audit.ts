import { benchmarkReadinessResult, type ReadinessBenchmark } from './benchmark'
import type { CandidatePlan, ReadinessRecoveryInput, RecoveryAction, RecoveryScenario } from './domain'
import {
  emptyCandidate,
  extendCandidate,
  type CandidateGenerationResult,
  type MutableCandidate,
  type OptimizationBackend,
  validateCompleteCandidate,
} from './optimization-backend'
import { epsilonDominates, planReadinessRecovery } from './planner'

function candidateKey(actionIds: string[]) {
  return [...actionIds].sort().join('|')
}

function rebuildCandidate(input: ReadinessRecoveryInput, actionIds: string[]): CandidatePlan | null {
  const actionById = new Map(input.recoveryActions.map((action) => [action.actionId, action]))
  let candidate: MutableCandidate = emptyCandidate()
  for (const actionId of actionIds) {
    const action = actionById.get(actionId)
    if (!action) return null
    const next = extendCandidate(input, candidate, action)
    if (!next) return null
    candidate = next
  }
  return validateCompleteCandidate(input, candidate) ? candidate : null
}

class CandidateListBackend implements OptimizationBackend {
  constructor(private readonly candidates: CandidatePlan[]) {}

  generateCandidates(): CandidateGenerationResult {
    return {
      candidates: this.candidates,
      searchNodes: this.candidates.length,
      truncatedByNodeBudget: false,
      truncatedByTimeBudget: false,
    }
  }
}

function buildOneAssetNeighborhood(input: ReadinessRecoveryInput, baselineSelectedActions: string[]) {
  const actionById = new Map(input.recoveryActions.map((action) => [action.actionId, action]))
  const baselineByAsset = new Map<string, string>()
  for (const actionId of baselineSelectedActions) {
    const action = actionById.get(actionId)
    if (action) baselineByAsset.set(action.assetId, actionId)
  }

  const actionsByAsset = new Map<string, RecoveryAction[]>()
  for (const action of input.recoveryActions) {
    if (action.type === 'DEFER') continue
    const list = actionsByAsset.get(action.assetId) ?? []
    list.push(action)
    actionsByAsset.set(action.assetId, list)
  }

  const unique = new Map<string, CandidatePlan>()
  const baselineCandidate = rebuildCandidate(input, baselineSelectedActions)
  if (baselineCandidate) unique.set(candidateKey(baselineCandidate.selectedActionIds), baselineCandidate)

  for (const [assetId, alternatives] of actionsByAsset) {
    const currentActionId = baselineByAsset.get(assetId)
    const replacementOptions: Array<RecoveryAction | null> = [null, ...alternatives]
    for (const replacement of replacementOptions) {
      if (replacement?.actionId === currentActionId) continue

      const nextActionIds: string[] = []
      let replaced = false
      for (const actionId of baselineSelectedActions) {
        const action = actionById.get(actionId)
        if (action?.assetId !== assetId) {
          nextActionIds.push(actionId)
          continue
        }
        if (replacement) nextActionIds.push(replacement.actionId)
        replaced = true
      }
      if (!replaced && replacement) nextActionIds.push(replacement.actionId)

      const candidate = rebuildCandidate(input, nextActionIds)
      if (candidate) unique.set(candidateKey(candidate.selectedActionIds), candidate)
    }
  }

  return [...unique.values()]
}

function compareAgainstBaseline(
  result: ReturnType<typeof planReadinessRecovery>,
  scenario: RecoveryScenario,
  baseline: RecoveryScenario
): ReadinessBenchmark {
  return benchmarkReadinessResult({
    ...result,
    frontier: [scenario],
    baselines: [{ kind: 'RISK_AWARE_GREEDY', scenario: baseline, infeasibleActionIds: [] }],
  })
}

export type DominatingNeighbor = {
  scenarioId: string
  addedActions: string[]
  removedActions: string[]
  selectedActions: string[]
  metrics: {
    probabilityDemandSatisfied: number
    expectedCapabilityReadiness: number
    capabilityShortfall: number
    expectedRecoveryTimeHours: number
    technicianHours: number
    scarcePartsConsumed: number
    recoveryFailureRisk: number
  }
  deltasVsBaseline: {
    probabilityDelta: number
    readinessDelta: number
    shortfallReduction: number
    recoveryTimeReductionHours: number
    technicianHoursReduction: number
    scarcePartsReduction: number
    failureRiskReduction: number
  }
}

function describeDominator(scenario: RecoveryScenario, baseline: RecoveryScenario): DominatingNeighbor {
  const selected = new Set(scenario.selectedActions)
  const baselineSelected = new Set(baseline.selectedActions)
  return {
    scenarioId: scenario.scenarioId,
    addedActions: scenario.selectedActions.filter((action) => !baselineSelected.has(action)),
    removedActions: baseline.selectedActions.filter((action) => !selected.has(action)),
    selectedActions: scenario.selectedActions,
    metrics: {
      probabilityDemandSatisfied: scenario.probabilityDemandSatisfied,
      expectedCapabilityReadiness: scenario.expectedCapabilityReadiness,
      capabilityShortfall: scenario.capabilityShortfall,
      expectedRecoveryTimeHours: scenario.expectedRecoveryTimeHours,
      technicianHours: scenario.technicianHours,
      scarcePartsConsumed: scenario.scarcePartsConsumed,
      recoveryFailureRisk: scenario.recoveryFailureRisk,
    },
    deltasVsBaseline: {
      probabilityDelta: scenario.probabilityDemandSatisfied - baseline.probabilityDemandSatisfied,
      readinessDelta: scenario.expectedCapabilityReadiness - baseline.expectedCapabilityReadiness,
      shortfallReduction: baseline.capabilityShortfall - scenario.capabilityShortfall,
      recoveryTimeReductionHours: baseline.expectedRecoveryTimeHours - scenario.expectedRecoveryTimeHours,
      technicianHoursReduction: baseline.technicianHours - scenario.technicianHours,
      scarcePartsReduction: baseline.scarcePartsConsumed - scenario.scarcePartsConsumed,
      failureRiskReduction: baseline.recoveryFailureRisk - scenario.recoveryFailureRisk,
    },
  }
}

export type BaselineNeighborhoodAudit = {
  candidateCount: number
  evaluatedCandidates: number
  frontierCount: number
  baselineInFrontier: boolean
  baselineScenarioFound: boolean
  dominatingScenarioIds: string[]
  dominatingNeighbors: DominatingNeighbor[]
  materialAdvantageScenarioIds: string[]
  bestMaterialAdvantage: {
    scenarioId: string
    probabilityDelta: number
    readinessDelta: number
    shortfallReduction: number
    advantageKind: ReadinessBenchmark['advantageKind']
  } | null
  baselineSelectedActions: string[]
}

export function auditOneAssetNeighborhood(
  input: ReadinessRecoveryInput,
  baselineSelectedActions: string[]
): BaselineNeighborhoodAudit {
  const candidates = buildOneAssetNeighborhood(input, baselineSelectedActions)
  const baselineCandidate = rebuildCandidate(input, baselineSelectedActions)
  const diagnosticInput = structuredClone(input)
  diagnosticInput.settings.maxSolveTimeMs = Math.max(diagnosticInput.settings.maxSolveTimeMs, 30_000)
  diagnosticInput.settings.maxCandidates = Math.max(diagnosticInput.settings.maxCandidates, candidates.length)

  if (!baselineCandidate) {
    return {
      candidateCount: candidates.length,
      evaluatedCandidates: 0,
      frontierCount: 0,
      baselineInFrontier: false,
      baselineScenarioFound: false,
      dominatingScenarioIds: [],
      dominatingNeighbors: [],
      materialAdvantageScenarioIds: [],
      bestMaterialAdvantage: null,
      baselineSelectedActions,
    }
  }

  const baselineResult = planReadinessRecovery(diagnosticInput, new CandidateListBackend([baselineCandidate]))
  const baselineKey = candidateKey(baselineSelectedActions)
  const baselineScenario = baselineResult.frontier.find(
    (scenario) => candidateKey(scenario.selectedActions) === baselineKey
  )
  const result = planReadinessRecovery(diagnosticInput, new CandidateListBackend(candidates))
  const baselineInFrontier = result.frontier.some((scenario) => candidateKey(scenario.selectedActions) === baselineKey)

  if (!baselineScenario) {
    return {
      candidateCount: candidates.length,
      evaluatedCandidates: result.diagnostics.evaluatedCandidates,
      frontierCount: result.frontier.length,
      baselineInFrontier,
      baselineScenarioFound: false,
      dominatingScenarioIds: [],
      dominatingNeighbors: [],
      materialAdvantageScenarioIds: [],
      bestMaterialAdvantage: null,
      baselineSelectedActions,
    }
  }

  const dominators = result.frontier.filter((scenario) =>
    epsilonDominates(scenario, baselineScenario, diagnosticInput.settings.epsilon)
  )
  const materialAdvantages = result.frontier
    .map((scenario) => ({ scenario, comparison: compareAgainstBaseline(result, scenario, baselineScenario) }))
    .filter(({ comparison }) => comparison.verdict === 'QDIP_ADVANTAGE')
  const bestMaterial = [...materialAdvantages].sort((a, b) => {
    return (
      b.comparison.probabilityDelta - a.comparison.probabilityDelta ||
      b.comparison.readinessDelta - a.comparison.readinessDelta ||
      b.comparison.shortfallReduction - a.comparison.shortfallReduction
    )
  })[0]

  return {
    candidateCount: candidates.length,
    evaluatedCandidates: result.diagnostics.evaluatedCandidates,
    frontierCount: result.frontier.length,
    baselineInFrontier,
    baselineScenarioFound: true,
    dominatingScenarioIds: dominators.map((scenario) => scenario.scenarioId),
    dominatingNeighbors: dominators.map((scenario) => describeDominator(scenario, baselineScenario)),
    materialAdvantageScenarioIds: materialAdvantages.map(({ scenario }) => scenario.scenarioId),
    bestMaterialAdvantage: bestMaterial
      ? {
          scenarioId: bestMaterial.scenario.scenarioId,
          probabilityDelta: bestMaterial.comparison.probabilityDelta,
          readinessDelta: bestMaterial.comparison.readinessDelta,
          shortfallReduction: bestMaterial.comparison.shortfallReduction,
          advantageKind: bestMaterial.comparison.advantageKind,
        }
      : null,
    baselineSelectedActions,
  }
}
