import type { BaselineKind, CandidatePlan, ReadinessRecoveryInput, RecoveryScenario } from './domain'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import {
  BoundedFeasibilityBackend,
  emptyCandidate,
  extendCandidate,
  retainDiverseBeam,
  type CandidateGenerationResult,
  type MutableCandidate,
  type OptimizationBackend,
  validateCompleteCandidate,
} from './optimization-backend'
import { epsilonDominates, planReadinessRecovery } from './planner'

export type StrongBaselineKind = Extract<BaselineKind, 'RISK_AWARE_GREEDY' | 'LOOKAHEAD_2'>

export type SearchAuditClassification =
  | 'BASELINE_NOT_AVAILABLE'
  | 'BASELINE_RECONSTRUCTION_FAILED'
  | 'NATIVE_SEARCH_RETAINED_BASELINE'
  | 'BASELINE_SURVIVES_AFTER_INJECTION'
  | 'BASELINE_DOMINATED_AFTER_INJECTION'
  | 'BASELINE_REMOVED_BY_FRONTIER_SELECTION'

export type StrongBaselineInjectionAudit = {
  baselineKind: StrongBaselineKind
  classification: SearchAuditClassification
  baselineCandidateKey: string | null
  baselineSelectedActions: string[]
  nativeSearchRetained: boolean
  injectedFrontierRetained: boolean
  dominatingScenarioIds: string[]
  nativeGeneratedCandidates: number
  injectedEvaluatedCandidates: number
  nativeSearchNodes: number
  nativeTruncatedByNodeBudget: boolean
  nativeTruncatedByTimeBudget: boolean
}

export type BaselineRetentionStage = {
  stageIndex: number
  assetId: string
  targetPrefixKey: string
  candidatesBeforePrune: number
  candidatesAfterPrune: number
  targetPresentBeforePrune: boolean
  targetPresentAfterPrune: boolean
  status: 'RETAINED' | 'BEAM_PRUNED' | 'EXTENSION_REJECTED_OR_NOT_GENERATED' | 'ALREADY_LOST'
}

export type BaselineRetentionTrace = {
  stages: BaselineRetentionStage[]
  firstLoss: BaselineRetentionStage | null
  searchNodes: number
  truncatedByNodeBudget: boolean
  truncatedByTimeBudget: boolean
  finalBeamRetained: boolean
  finalCandidateRetained: boolean
}

export type SearchBudgetSweepPoint = {
  beamWidth: number
  maxCandidates: number
  searchNodes: number
  generatedCandidates: number
  baselineRetained: boolean
  truncatedByNodeBudget: boolean
  truncatedByTimeBudget: boolean
}

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

class BaselineInjectedBackend implements OptimizationBackend {
  constructor(private readonly baselineCandidate: CandidatePlan) {}

  generateCandidates(input: ReadinessRecoveryInput): CandidateGenerationResult {
    const native = new BoundedFeasibilityBackend().generateCandidates(input)
    const unique = new Map<string, CandidatePlan>()

    unique.set(candidateKey(this.baselineCandidate.selectedActionIds), this.baselineCandidate)
    for (const candidate of native.candidates) {
      unique.set(candidateKey(candidate.selectedActionIds), candidate)
    }

    return {
      ...native,
      candidates: [...unique.values()],
    }
  }
}

function scenarioKey(scenario: RecoveryScenario) {
  return candidateKey(scenario.selectedActions)
}

export function auditStrongBaselineInjection(
  input: ReadinessRecoveryInput,
  baselineKind: StrongBaselineKind = 'RISK_AWARE_GREEDY'
): StrongBaselineInjectionAudit {
  const benchmarked = planReadinessRecoveryWithBenchmarkSuite(input)
  const baseline = benchmarked.baselines.find((item) => item.kind === baselineKind)
  const native = new BoundedFeasibilityBackend().generateCandidates(input)

  const base = {
    baselineKind,
    nativeGeneratedCandidates: native.candidates.length,
    injectedEvaluatedCandidates: 0,
    nativeSearchNodes: native.searchNodes,
    nativeTruncatedByNodeBudget: native.truncatedByNodeBudget,
    nativeTruncatedByTimeBudget: native.truncatedByTimeBudget,
  }

  if (!baseline?.scenario) {
    return {
      ...base,
      classification: 'BASELINE_NOT_AVAILABLE',
      baselineCandidateKey: null,
      baselineSelectedActions: [],
      nativeSearchRetained: false,
      injectedFrontierRetained: false,
      dominatingScenarioIds: [],
    }
  }

  const baselineCandidate = rebuildCandidate(input, baseline.scenario.selectedActions)
  if (!baselineCandidate) {
    return {
      ...base,
      classification: 'BASELINE_RECONSTRUCTION_FAILED',
      baselineCandidateKey: candidateKey(baseline.scenario.selectedActions),
      baselineSelectedActions: baseline.scenario.selectedActions,
      nativeSearchRetained: false,
      injectedFrontierRetained: false,
      dominatingScenarioIds: [],
    }
  }

  const baselineCandidateKey = candidateKey(baselineCandidate.selectedActionIds)
  const nativeSearchRetained = native.candidates.some(
    (candidate) => candidateKey(candidate.selectedActionIds) === baselineCandidateKey
  )

  const injected = planReadinessRecovery(input, new BaselineInjectedBackend(baselineCandidate))
  const injectedBaseline = injected.frontier.find((scenario) => scenarioKey(scenario) === baselineCandidateKey)
  const dominators = injected.frontier.filter((scenario) =>
    epsilonDominates(scenario, baseline.scenario!, input.settings.epsilon)
  )

  let classification: SearchAuditClassification
  if (nativeSearchRetained) classification = 'NATIVE_SEARCH_RETAINED_BASELINE'
  else if (injectedBaseline) classification = 'BASELINE_SURVIVES_AFTER_INJECTION'
  else if (dominators.length) classification = 'BASELINE_DOMINATED_AFTER_INJECTION'
  else classification = 'BASELINE_REMOVED_BY_FRONTIER_SELECTION'

  return {
    ...base,
    classification,
    baselineCandidateKey,
    baselineSelectedActions: baselineCandidate.selectedActionIds,
    nativeSearchRetained,
    injectedFrontierRetained: Boolean(injectedBaseline),
    dominatingScenarioIds: dominators.map((scenario) => scenario.scenarioId),
    injectedEvaluatedCandidates: injected.diagnostics.evaluatedCandidates,
  }
}

export function traceStrongBaselineRetention(
  input: ReadinessRecoveryInput,
  baselineSelectedActions: string[]
): BaselineRetentionTrace {
  const started = Date.now()
  const actionByAsset = new Map<string, typeof input.recoveryActions>()
  const actionById = new Map(input.recoveryActions.map((action) => [action.actionId, action]))
  for (const action of input.recoveryActions) {
    if (action.type === 'DEFER') continue
    const list = actionByAsset.get(action.assetId) ?? []
    list.push(action)
    actionByAsset.set(action.assetId, list)
  }
  const baselineActionByAsset = new Map<string, string>()
  for (const actionId of baselineSelectedActions) {
    const action = actionById.get(actionId)
    if (action) baselineActionByAsset.set(action.assetId, actionId)
  }
  const impaired = input.assets
    .filter((asset) => asset.currentState !== 'READY')
    .sort((a, b) => a.assetId.localeCompare(b.assetId))

  let beam: MutableCandidate[] = [emptyCandidate()]
  let searchNodes = 0
  let truncatedByNodeBudget = false
  let truncatedByTimeBudget = false
  let previouslyRetained = true
  const processedAssets: string[] = []
  const stages: BaselineRetentionStage[] = []

  for (let stageIndex = 0; stageIndex < impaired.length; stageIndex += 1) {
    const asset = impaired[stageIndex]
    processedAssets.push(asset.assetId)
    const options = [...(actionByAsset.get(asset.assetId) ?? []), null]
    const next: MutableCandidate[] = []

    for (const candidate of beam) {
      for (const action of options) {
        if (searchNodes >= input.settings.maxSearchNodes) {
          truncatedByNodeBudget = true
          break
        }
        if (Date.now() - started >= input.settings.maxSolveTimeMs) {
          truncatedByTimeBudget = true
          break
        }
        searchNodes += 1
        const extended = extendCandidate(input, candidate, action)
        if (extended) next.push(extended)
      }
      if (truncatedByNodeBudget || truncatedByTimeBudget) break
    }

    const targetPrefix = processedAssets
      .map((assetId) => baselineActionByAsset.get(assetId))
      .filter((actionId): actionId is string => Boolean(actionId))
    const targetPrefixKey = candidateKey(targetPrefix)
    const targetPresentBeforePrune = next.some(
      (candidate) => candidateKey(candidate.selectedActionIds) === targetPrefixKey
    )
    const retained = retainDiverseBeam(next, input.settings.beamWidth)
    const targetPresentAfterPrune = retained.some(
      (candidate) => candidateKey(candidate.selectedActionIds) === targetPrefixKey
    )

    let status: BaselineRetentionStage['status']
    if (!previouslyRetained) status = 'ALREADY_LOST'
    else if (!targetPresentBeforePrune) status = 'EXTENSION_REJECTED_OR_NOT_GENERATED'
    else if (!targetPresentAfterPrune) status = 'BEAM_PRUNED'
    else status = 'RETAINED'

    stages.push({
      stageIndex,
      assetId: asset.assetId,
      targetPrefixKey,
      candidatesBeforePrune: next.length,
      candidatesAfterPrune: retained.length,
      targetPresentBeforePrune,
      targetPresentAfterPrune,
      status,
    })

    beam = retained
    previouslyRetained = targetPresentAfterPrune
    if (!beam.length || truncatedByNodeBudget || truncatedByTimeBudget) break
  }

  const baselineKey = candidateKey(baselineSelectedActions)
  const finalBeamRetained = beam.some((candidate) => candidateKey(candidate.selectedActionIds) === baselineKey)
  const finalCandidates = beam
    .filter((candidate) => validateCompleteCandidate(input, candidate))
    .slice(0, input.settings.maxCandidates)
  const finalCandidateRetained = finalCandidates.some(
    (candidate) => candidateKey(candidate.selectedActionIds) === baselineKey
  )

  return {
    stages,
    firstLoss: stages.find((stage) => stage.status === 'BEAM_PRUNED' || stage.status === 'EXTENSION_REJECTED_OR_NOT_GENERATED') ?? null,
    searchNodes,
    truncatedByNodeBudget,
    truncatedByTimeBudget,
    finalBeamRetained,
    finalCandidateRetained,
  }
}

export function sweepStrongBaselineRetention(
  input: ReadinessRecoveryInput,
  baselineSelectedActions: string[],
  beamWidths: number[]
): SearchBudgetSweepPoint[] {
  const baselineKey = candidateKey(baselineSelectedActions)
  return beamWidths.map((beamWidth) => {
    const changed = structuredClone(input)
    changed.settings.beamWidth = beamWidth
    changed.settings.maxCandidates = Math.max(changed.settings.maxCandidates, beamWidth)
    changed.settings.maxSearchNodes = Math.max(changed.settings.maxSearchNodes, 1_000_000)
    changed.settings.maxSolveTimeMs = Math.max(changed.settings.maxSolveTimeMs, 30_000)
    const generated = new BoundedFeasibilityBackend().generateCandidates(changed)
    return {
      beamWidth,
      maxCandidates: changed.settings.maxCandidates,
      searchNodes: generated.searchNodes,
      generatedCandidates: generated.candidates.length,
      baselineRetained: generated.candidates.some(
        (candidate) => candidateKey(candidate.selectedActionIds) === baselineKey
      ),
      truncatedByNodeBudget: generated.truncatedByNodeBudget,
      truncatedByTimeBudget: generated.truncatedByTimeBudget,
    }
  })
}
