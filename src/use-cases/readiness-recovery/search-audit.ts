import type { BaselineKind, CandidatePlan, ReadinessRecoveryInput, RecoveryScenario } from './domain'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import {
  BoundedFeasibilityBackend,
  emptyCandidate,
  extendCandidate,
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

    // Prepend the baseline so the planner evaluates it even if the wall-clock
    // evaluation budget is reached later in the candidate list.
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
