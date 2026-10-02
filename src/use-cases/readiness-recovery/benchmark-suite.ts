import type {
  BaselineKind,
  BaselineResult,
  CandidatePlan,
  ReadinessRecoveryInput,
  ReadinessRecoveryResult,
  RecoveryAction,
  RecoveryScenario,
} from './domain'
import { benchmarkReadinessResult, type BenchmarkAdvantageKind, type BenchmarkVerdict } from './benchmark'
import { CASCADING_ROBUSTNESS_VARIANTS } from './cascading-resource-conflict'
import { planReadinessRecovery } from './planner'
import {
  MATERIAL_ACTIONS,
  actionPartUnits,
  actionTechnicianHours,
  emptyCandidate,
  expectedActionGain,
  extendCandidate,
  type CandidateGenerationResult,
  type MutableCandidate,
  type OptimizationBackend,
  validateCompleteCandidate,
} from './optimization-backend'

const STRONG_BASELINES: BaselineKind[] = ['RISK_AWARE_GREEDY', 'LOOKAHEAD_2']

function cloneInput(input: ReadinessRecoveryInput): ReadinessRecoveryInput {
  return structuredClone(input)
}

function riskAdjustedScore(input: ReadinessRecoveryInput, action: RecoveryAction) {
  const gain = expectedActionGain(input, action)
  const reliability = action.successProbability * (1 - action.repeatFailureProbability)
  const cost = Math.max(1, actionTechnicianHours(action) + action.workshopHours + actionPartUnits(action))
  const dependencyPenalty = 1 + (action.dependsOnActionIds?.length ?? 0) * 0.12
  return (gain * reliability) / (cost * dependencyPenalty)
}

function addWithDependencies(
  input: ReadinessRecoveryInput,
  current: MutableCandidate,
  action: RecoveryAction
): MutableCandidate | null {
  const actionById = new Map(input.recoveryActions.map((item) => [item.actionId, item]))
  let candidate = current
  const selectedActions = new Set(candidate.selectedActionIds)
  const selectedAssets = new Set(
    candidate.selectedActionIds.map((id) => actionById.get(id)?.assetId).filter((id): id is string => Boolean(id))
  )
  const visiting = new Set<string>()

  const add = (nextAction: RecoveryAction): boolean => {
    if (selectedActions.has(nextAction.actionId)) return true
    if (selectedAssets.has(nextAction.assetId) || visiting.has(nextAction.actionId)) return false
    visiting.add(nextAction.actionId)
    for (const dependencyId of nextAction.dependsOnActionIds ?? []) {
      const dependency = actionById.get(dependencyId)
      if (!dependency || !add(dependency)) return false
    }
    visiting.delete(nextAction.actionId)
    const extended = extendCandidate(input, candidate, nextAction)
    if (!extended) return false
    candidate = extended
    selectedActions.add(nextAction.actionId)
    selectedAssets.add(nextAction.assetId)
    return true
  }

  if (!add(action)) return null
  return validateCompleteCandidate(input, candidate) ? candidate : null
}

function riskAwareCandidate(input: ReadinessRecoveryInput) {
  let candidate = emptyCandidate()
  const rejected: string[] = []
  const actions = input.recoveryActions
    .filter((action) => MATERIAL_ACTIONS.has(action.type))
    .sort((a, b) => riskAdjustedScore(input, b) - riskAdjustedScore(input, a) || a.actionId.localeCompare(b.actionId))

  for (const action of actions) {
    if (candidate.selectedActionIds.includes(action.actionId)) continue
    const next = addWithDependencies(input, candidate, action)
    if (next) candidate = next
    else rejected.push(action.actionId)
  }
  return { candidate, rejected }
}

function pairScore(input: ReadinessRecoveryInput, a: RecoveryAction, b: RecoveryAction) {
  const base = riskAdjustedScore(input, a) + riskAdjustedScore(input, b)
  const assetA = input.assets.find((asset) => asset.assetId === a.assetId)
  const assetB = input.assets.find((asset) => asset.assetId === b.assetId)
  const capsA = new Set(assetA?.providedCapabilities.map((item) => item.capabilityId) ?? [])
  const capsB = new Set(assetB?.providedCapabilities.map((item) => item.capabilityId) ?? [])
  const diversification = [...capsA].some((capability) => !capsB.has(capability)) ? 0.15 : 0
  const dependencySynergy =
    a.dependsOnActionIds?.includes(b.actionId) || b.dependsOnActionIds?.includes(a.actionId) ? 0.2 : 0
  return base * (1 + diversification + dependencySynergy)
}

function lookaheadCandidate(input: ReadinessRecoveryInput) {
  let candidate = emptyCandidate()
  const rejected = new Set<string>()
  const remaining = input.recoveryActions.filter((action) => MATERIAL_ACTIONS.has(action.type))

  while (remaining.length) {
    const shortlist = remaining
      .filter((action) => !candidate.selectedActionIds.includes(action.actionId))
      .sort((a, b) => riskAdjustedScore(input, b) - riskAdjustedScore(input, a))
      .slice(0, 12)
    if (!shortlist.length) break

    let best: { candidate: MutableCandidate; actions: RecoveryAction[]; score: number } | null = null
    for (let i = 0; i < shortlist.length; i += 1) {
      const first = addWithDependencies(input, candidate, shortlist[i])
      if (first) {
        const score = riskAdjustedScore(input, shortlist[i])
        if (!best || score > best.score) best = { candidate: first, actions: [shortlist[i]], score }
      }
      for (let j = i + 1; j < shortlist.length; j += 1) {
        if (shortlist[i].assetId === shortlist[j].assetId) continue
        const afterFirst = addWithDependencies(input, candidate, shortlist[i])
        if (!afterFirst) continue
        const afterSecond = addWithDependencies(input, afterFirst, shortlist[j])
        if (!afterSecond) continue
        const score = pairScore(input, shortlist[i], shortlist[j])
        if (!best || score > best.score) {
          best = { candidate: afterSecond, actions: [shortlist[i], shortlist[j]], score }
        }
      }
    }

    if (!best) {
      shortlist.forEach((action) => rejected.add(action.actionId))
      break
    }
    candidate = best.candidate
    const chosen = new Set(best.actions.map((action) => action.actionId))
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (chosen.has(remaining[index].actionId) || candidate.selectedActionIds.includes(remaining[index].actionId)) {
        remaining.splice(index, 1)
      }
    }
  }

  for (const action of input.recoveryActions) {
    if (MATERIAL_ACTIONS.has(action.type) && !candidate.selectedActionIds.includes(action.actionId))
      rejected.add(action.actionId)
  }
  return { candidate, rejected: [...rejected] }
}

class FixedCandidateBackend implements OptimizationBackend {
  constructor(private readonly candidate: CandidatePlan) {}

  generateCandidates(): CandidateGenerationResult {
    return {
      candidates: [this.candidate],
      searchNodes: 1,
      truncatedByNodeBudget: false,
      truncatedByTimeBudget: false,
    }
  }
}

function evaluateStrongBaseline(
  input: ReadinessRecoveryInput,
  kind: (typeof STRONG_BASELINES)[number]
): BaselineResult {
  const built = kind === 'RISK_AWARE_GREEDY' ? riskAwareCandidate(input) : lookaheadCandidate(input)
  if (!validateCompleteCandidate(input, built.candidate)) {
    return { kind, scenario: null, infeasibleActionIds: built.rejected }
  }
  const evaluated = planReadinessRecovery(input, new FixedCandidateBackend(built.candidate))
  return {
    kind,
    scenario: evaluated.frontier[0] ?? null,
    infeasibleActionIds: built.rejected,
  }
}

export function planReadinessRecoveryWithBenchmarkSuite(input: ReadinessRecoveryInput): ReadinessRecoveryResult {
  const result = planReadinessRecovery(input)
  const strong = STRONG_BASELINES.map((kind) => evaluateStrongBaseline(input, kind))
  return { ...result, baselines: [...result.baselines, ...strong] }
}

export type RobustnessResult = {
  variantId: string
  verdict: BenchmarkVerdict
  advantageKind: BenchmarkAdvantageKind
  baselineKind: BaselineKind | null
  probabilityDelta: number
  shortfallReduction: number
}

function applyVariant(input: ReadinessRecoveryInput, variant: (typeof CASCADING_ROBUSTNESS_VARIANTS)[number]) {
  const changed = cloneInput(input)
  const deadlinePct = 'deadlinePct' in variant.changes ? variant.changes.deadlinePct : undefined
  const technicianPct = 'technicianPct' in variant.changes ? variant.changes.technicianPct : undefined
  const partsPct = 'partsPct' in variant.changes ? variant.changes.partsPct : undefined
  const successPct = 'successPct' in variant.changes ? variant.changes.successPct : undefined

  if (deadlinePct) {
    const asOf = Date.parse(changed.asOf)
    changed.capabilityDemand = changed.capabilityDemand.map((demand) => ({
      ...demand,
      deadline: new Date(asOf + (Date.parse(demand.deadline) - asOf) * (deadlinePct / 100)).toISOString(),
    }))
  }
  if (technicianPct) {
    changed.resources.technicianHours = Object.fromEntries(
      Object.entries(changed.resources.technicianHours).map(([key, value]) => [key, value * (technicianPct / 100)])
    )
  }
  if (partsPct) {
    changed.resources.spareParts = Object.fromEntries(
      Object.entries(changed.resources.spareParts).map(([key, value]) => [key, Math.floor(value * (partsPct / 100))])
    )
  }
  if (successPct) {
    changed.recoveryActions = changed.recoveryActions.map((action) => ({
      ...action,
      successProbability: Math.min(1, Math.max(0, action.successProbability * (successPct / 100))),
    }))
  }
  changed.scenarioId = `${input.scenarioId}:robustness:${variant.id}`
  return changed
}

export function runCascadingRobustnessSweep(input: ReadinessRecoveryInput): RobustnessResult[] {
  return CASCADING_ROBUSTNESS_VARIANTS.map((variant) => {
    const result = planReadinessRecoveryWithBenchmarkSuite(applyVariant(input, variant))
    const benchmark = benchmarkReadinessResult(result)
    return {
      variantId: variant.id,
      verdict: benchmark.verdict,
      advantageKind: benchmark.advantageKind,
      baselineKind: benchmark.baselineKind,
      probabilityDelta: benchmark.probabilityDelta,
      shortfallReduction: benchmark.shortfallReduction,
    }
  })
}

export function qdipAdvantageRetention(results: RobustnessResult[]) {
  return {
    retained: results.filter((result) => result.verdict === 'QDIP_ADVANTAGE').length,
    total: results.length,
  }
}

export function explainHeuristicMiss(qdip: RecoveryScenario | null, baseline: RecoveryScenario | null) {
  if (!qdip || !baseline) return []
  const baselineActions = new Set(baseline.selectedActions)
  const qdipOnly = qdip.selectedActions.filter((action) => !baselineActions.has(action))
  const qdipCannibalization = qdipOnly.filter((action) => action.includes('cannibalize'))
  const explanations: string[] = []
  if (qdipOnly.length)
    explanations.push(
      `QDIP selected ${qdipOnly.length} actions absent from the strongest heuristic plan: ${qdipOnly.slice(0, 4).join(', ')}.`
    )
  if (qdipCannibalization.length)
    explanations.push(`The QDIP-only portfolio uses donor dependencies: ${qdipCannibalization.join(', ')}.`)
  if (qdip.probabilityDemandSatisfied > baseline.probabilityDemandSatisfied)
    explanations.push('The portfolio difference increases the probability of satisfying all capability deadlines.')
  if (qdip.capabilityShortfall < baseline.capabilityShortfall)
    explanations.push('The portfolio difference reduces expected capability shortfall.')
  return explanations
}
