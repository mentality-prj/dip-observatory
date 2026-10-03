import { benchmarkReadinessResult } from './benchmark'
import type { CandidatePlan, ReadinessRecoveryInput, RecoveryAction } from './domain'
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

export type BaselineNeighborhoodAudit = {
  candidateCount: number
  evaluatedCandidates: number
  frontierCount: number
  baselineInFrontier: boolean
  dominatingScenarioIds: string[]
  verdict: ReturnType<typeof benchmarkReadinessResult>['verdict']
  advantageKind: ReturnType<typeof benchmarkReadinessResult>['advantageKind']
  probabilityDelta: number
  readinessDelta: number
  shortfallReduction: number
  qdipSelectedActions: string[]
  baselineSelectedActions: string[]
}

export function auditOneAssetNeighborhood(
  input: ReadinessRecoveryInput,
  baselineSelectedActions: string[]
): BaselineNeighborhoodAudit {
  const candidates = buildOneAssetNeighborhood(input, baselineSelectedActions)
  const diagnosticInput = structuredClone(input)
  diagnosticInput.settings.maxSolveTimeMs = Math.max(diagnosticInput.settings.maxSolveTimeMs, 30_000)
  diagnosticInput.settings.maxCandidates = Math.max(diagnosticInput.settings.maxCandidates, candidates.length)

  const result = planReadinessRecovery(diagnosticInput, new CandidateListBackend(candidates))
  const benchmark = benchmarkReadinessResult(result)
  const baseline = result.baselines.find((item) => item.kind === 'RISK_AWARE_GREEDY')?.scenario ?? null
  const baselineKey = candidateKey(baselineSelectedActions)
  const baselineInFrontier = result.frontier.some((scenario) => candidateKey(scenario.selectedActions) === baselineKey)
  const dominators = baseline
    ? result.frontier.filter((scenario) => epsilonDominates(scenario, baseline, diagnosticInput.settings.epsilon))
    : []

  return {
    candidateCount: candidates.length,
    evaluatedCandidates: result.diagnostics.evaluatedCandidates,
    frontierCount: result.frontier.length,
    baselineInFrontier,
    dominatingScenarioIds: dominators.map((scenario) => scenario.scenarioId),
    verdict: benchmark.verdict,
    advantageKind: benchmark.advantageKind,
    probabilityDelta: benchmark.probabilityDelta,
    readinessDelta: benchmark.readinessDelta,
    shortfallReduction: benchmark.shortfallReduction,
    qdipSelectedActions: benchmark.qdip?.selectedActions ?? [],
    baselineSelectedActions,
  }
}
