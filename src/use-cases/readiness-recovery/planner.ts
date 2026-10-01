import type {
  Asset,
  BaselineKind,
  BaselineResult,
  CandidatePlan,
  FrontierComparison,
  PlannerDiagnostics,
  ReadinessRecoveryInput,
  ReadinessRecoveryResult,
  RecoveryAction,
  RecoveryScenario,
  ScenarioLabel,
} from './domain'
import {
  BoundedFeasibilityBackend,
  MATERIAL_ACTIONS,
  actionPartUnits,
  actionTechnicianHours,
  clamp01,
  createRng,
  emptyCandidate,
  expectedActionGain,
  extendCandidate,
  hoursBetween,
  type OptimizationBackend,
  round,
  sampleDistribution,
  sum,
  validateCompleteCandidate,
} from './optimization-backend'

type EvaluationDetails = {
  scenario: RecoveryScenario
  demandShortfallByCapability: Map<string, number>
}

type ActionOutcome = {
  reliability: number
  completionHours: number
  failed: boolean
  repeated: boolean
}

function percentile(values: number[], fraction: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(fraction * (sorted.length - 1))))
  return sorted[index]
}

function contributionValidAt(contribution: Asset['providedCapabilities'][number], deadline: string) {
  const at = Date.parse(deadline)
  if (contribution.validFrom && at < Date.parse(contribution.validFrom)) return false
  if (contribution.validTo && at > Date.parse(contribution.validTo)) return false
  return true
}

function initialReliability(asset: Asset) {
  return asset.currentState === 'FAILED' ? 0 : clamp01(asset.currentReliability)
}

function stableHash(value: string) {
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return hash >>> 0
}

function actionSampleRng(input: ReadinessRecoveryInput, actionId: string, sample: number) {
  return createRng((input.settings.seed ^ stableHash(actionId) ^ Math.imul(sample + 1, 2_654_435_761)) >>> 0)
}

function scarcePartsScore(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  return round(
    sum(
      Object.entries(candidate.partsConsumed).map(([partId, quantity]) => {
        const supply = (input.resources.spareParts[partId] ?? 0) + (candidate.partsProduced[partId] ?? 0)
        return quantity / Math.max(1, supply)
      })
    )
  )
}

function scenarioDrivers(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  return candidate.selectedActionIds
    .map((actionId) => input.recoveryActions.find((action) => action.actionId === actionId))
    .filter((action): action is RecoveryAction => Boolean(action))
    .map((action) => ({ actionId: action.actionId, gain: expectedActionGain(input, action) }))
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 3)
    .map((item) => item.actionId)
}

function evaluateActionOutcomes(
  input: ReadinessRecoveryInput,
  actions: RecoveryAction[],
  sample: number
): Map<string, ActionOutcome> {
  const actionById = new Map(actions.map((action) => [action.actionId, action]))
  const assetById = new Map(input.assets.map((asset) => [asset.assetId, asset]))
  const outcomes = new Map<string, ActionOutcome>()
  const visiting = new Set<string>()

  const evaluate = (action: RecoveryAction): ActionOutcome => {
    const cached = outcomes.get(action.actionId)
    if (cached) return cached
    if (visiting.has(action.actionId)) {
      return { reliability: 0, completionHours: Number.POSITIVE_INFINITY, failed: true, repeated: false }
    }
    visiting.add(action.actionId)
    const asset = assetById.get(action.assetId)
    const dependencies = (action.dependsOnActionIds ?? [])
      .map((id) => actionById.get(id))
      .filter((dependency): dependency is RecoveryAction => Boolean(dependency))
      .map(evaluate)
    const dependencyFailed = dependencies.some((outcome) => outcome.failed)
    const dependencyCompletion = dependencies.length
      ? Math.max(...dependencies.map((outcome) => outcome.completionHours))
      : 0
    const rng = actionSampleRng(input, action.actionId, sample)
    const duration = Math.max(0, sampleDistribution(action.durationDistribution, rng))
    const success = !dependencyFailed && rng() <= clamp01(action.successProbability)
    const repeated = success && MATERIAL_ACTIONS.has(action.type) && rng() <= clamp01(action.repeatFailureProbability)
    const completionHours = dependencyCompletion + duration
    let reliability = asset ? initialReliability(asset) : 0
    if (action.type === 'CANNIBALIZE') reliability = 0
    else if (MATERIAL_ACTIONS.has(action.type) && success && !repeated) {
      reliability = clamp01(sampleDistribution(action.resultingReliabilityDistribution, rng))
    }
    const outcome = { reliability, completionHours, failed: !success, repeated }
    outcomes.set(action.actionId, outcome)
    visiting.delete(action.actionId)
    return outcome
  }

  for (const action of actions) evaluate(action)
  return outcomes
}

function evaluateCandidate(
  input: ReadinessRecoveryInput,
  candidate: CandidatePlan,
  scenarioIndex: number
): EvaluationDetails {
  const actions = candidate.selectedActionIds
    .map((id) => input.recoveryActions.find((action) => action.actionId === id))
    .filter((action): action is RecoveryAction => Boolean(action))
  const actionByAsset = new Map(actions.map((action) => [action.assetId, action]))
  const samples = Math.max(1, input.settings.simulationSamples)
  const readinessSamples: number[] = []
  const shortfallSamples: number[] = []
  const recoveryTimes: number[] = []
  const demandShortfallByCapability = new Map<string, number>()
  let demandSatisfiedSamples = 0
  let anyFailureSamples = 0
  let anyRepeatFailureSamples = 0

  for (let sample = 0; sample < samples; sample += 1) {
    const actionOutcomes = evaluateActionOutcomes(input, actions, sample)
    const outcomes = new Map<string, ActionOutcome>()
    let maxCompletion = 0
    let anyFailure = false
    let anyRepeat = false

    for (const asset of input.assets) {
      const action = actionByAsset.get(asset.assetId)
      if (!action || action.type === 'DEFER' || action.type === 'DIAGNOSE') {
        outcomes.set(asset.assetId, {
          reliability: initialReliability(asset),
          completionHours: 0,
          failed: false,
          repeated: false,
        })
        continue
      }
      const outcome = actionOutcomes.get(action.actionId) ?? {
        reliability: initialReliability(asset),
        completionHours: Number.POSITIVE_INFINITY,
        failed: true,
        repeated: false,
      }
      outcomes.set(asset.assetId, outcome)
      maxCompletion = Math.max(maxCompletion, outcome.completionHours)
      anyFailure ||= outcome.failed
      anyRepeat ||= outcome.repeated
    }

    let allSatisfied = true
    let weightedFill = 0
    let totalWeight = 0
    let totalShortfall = 0

    for (const demand of input.capabilityDemand) {
      let provided = 0
      const deadlineHours = hoursBetween(input.asOf, demand.deadline)
      const availableDependencies = new Set<string>()
      const reliabilityByAsset = new Map<string, number>()
      for (const asset of input.assets) {
        const outcome = outcomes.get(asset.assetId)
        if (!outcome) continue
        const action = actionByAsset.get(asset.assetId)
        const effectiveReliability =
          action && MATERIAL_ACTIONS.has(action.type) && outcome.completionHours > deadlineHours
            ? initialReliability(asset)
            : outcome.reliability
        reliabilityByAsset.set(asset.assetId, effectiveReliability)
        if (effectiveReliability <= 0) continue
        for (const contribution of asset.providedCapabilities) {
          if (contributionValidAt(contribution, demand.deadline)) availableDependencies.add(contribution.capabilityId)
        }
      }

      for (const asset of input.assets) {
        const effectiveReliability = reliabilityByAsset.get(asset.assetId) ?? 0
        if (effectiveReliability < (demand.minimumReliability ?? 0)) continue
        for (const contribution of asset.providedCapabilities) {
          const matches =
            contribution.capabilityId === demand.capabilityId ||
            contribution.substitutableBy?.includes(demand.capabilityId)
          if (!matches || !contributionValidAt(contribution, demand.deadline)) continue
          if (
            contribution.dependsOnCapabilities?.length &&
            !contribution.dependsOnCapabilities.every((capability) => availableDependencies.has(capability))
          ) {
            continue
          }
          provided += contribution.quantity * (contribution.qualityFactor ?? 1) * effectiveReliability
        }
      }

      const shortfall = Math.max(0, demand.requiredQuantity - provided)
      const fill = demand.requiredQuantity > 0 ? Math.min(1, provided / demand.requiredQuantity) : 1
      const weight = Math.max(0.001, demand.priority ?? 1)
      weightedFill += fill * weight
      totalWeight += weight
      totalShortfall += shortfall
      demandShortfallByCapability.set(
        demand.capabilityId,
        (demandShortfallByCapability.get(demand.capabilityId) ?? 0) + shortfall / samples
      )
      allSatisfied &&= shortfall <= 1e-9
    }

    readinessSamples.push(totalWeight > 0 ? weightedFill / totalWeight : 1)
    shortfallSamples.push(totalShortfall)
    recoveryTimes.push(maxCompletion)
    if (allSatisfied) demandSatisfiedSamples += 1
    if (anyFailure) anyFailureSamples += 1
    if (anyRepeat) anyRepeatFailureSamples += 1
  }

  const bottlenecks = new Set<string>(candidate.bindingConstraints)
  const topShortfall = [...demandShortfallByCapability.entries()].sort((a, b) => b[1] - a[1])[0]
  if (topShortfall && topShortfall[1] > 0) bottlenecks.add(`CAPABILITY:${topShortfall[0]}`)

  return {
    scenario: {
      scenarioId: `${input.scenarioId}:scenario:${scenarioIndex + 1}`,
      label: 'BALANCED',
      selectedActions: candidate.selectedActionIds,
      expectedCapabilityReadiness: round(sum(readinessSamples) / samples),
      probabilityDemandSatisfied: round(demandSatisfiedSamples / samples),
      capabilityShortfall: round(sum(shortfallSamples) / samples),
      expectedRecoveryTimeHours: round(sum(recoveryTimes) / samples, 2),
      technicianHours: round(candidate.technicianHours, 2),
      scarcePartsConsumed: scarcePartsScore(input, candidate),
      recoveryFailureRisk: round(anyFailureSamples / samples),
      repeatFailureRisk: round(anyRepeatFailureSamples / samples),
      bottlenecks: [...bottlenecks],
      bindingConstraints: candidate.bindingConstraints,
      uncertaintySummary: {
        samples,
        seed: input.settings.seed,
        demandSatisfiedSamples,
        p10RecoveryTimeHours: round(percentile(recoveryTimes, 0.1), 2),
        p50RecoveryTimeHours: round(percentile(recoveryTimes, 0.5), 2),
        p90RecoveryTimeHours: round(percentile(recoveryTimes, 0.9), 2),
      },
      paretoExplanation: '',
      drivers: scenarioDrivers(input, candidate),
    },
    demandShortfallByCapability,
  }
}

type Objective = { value: (scenario: RecoveryScenario) => number; direction: 'MIN' | 'MAX' }
const OBJECTIVES: Objective[] = [
  { value: (scenario) => scenario.expectedCapabilityReadiness, direction: 'MAX' },
  { value: (scenario) => scenario.probabilityDemandSatisfied, direction: 'MAX' },
  { value: (scenario) => scenario.capabilityShortfall, direction: 'MIN' },
  { value: (scenario) => scenario.expectedRecoveryTimeHours, direction: 'MIN' },
  { value: (scenario) => scenario.scarcePartsConsumed, direction: 'MIN' },
  { value: (scenario) => scenario.technicianHours, direction: 'MIN' },
  { value: (scenario) => scenario.recoveryFailureRisk, direction: 'MIN' },
  { value: (scenario) => scenario.repeatFailureRisk, direction: 'MIN' },
]

function tolerance(value: number, epsilon: number) {
  return epsilon * Math.max(1, Math.abs(value))
}

export function epsilonDominates(a: RecoveryScenario, b: RecoveryScenario, epsilon: number) {
  let strictlyBetter = false
  for (const objective of OBJECTIVES) {
    const av = objective.value(a)
    const bv = objective.value(b)
    const tol = tolerance(bv, epsilon)
    if (objective.direction === 'MAX') {
      if (av < bv - tol) return false
      if (av > bv + tol) strictlyBetter = true
    } else {
      if (av > bv + tol) return false
      if (av < bv - tol) strictlyBetter = true
    }
  }
  return strictlyBetter
}

function objectiveKey(scenario: RecoveryScenario) {
  return [
    scenario.expectedCapabilityReadiness,
    scenario.probabilityDemandSatisfied,
    scenario.capabilityShortfall,
    scenario.expectedRecoveryTimeHours,
    scenario.scarcePartsConsumed,
    scenario.technicianHours,
    scenario.recoveryFailureRisk,
    scenario.repeatFailureRisk,
  ]
    .map((value) => round(value, 4))
    .join('|')
}

function deduplicateObjectivePoints(scenarios: RecoveryScenario[]) {
  const unique = new Map<string, RecoveryScenario>()
  for (const scenario of scenarios) {
    const key = objectiveKey(scenario)
    const existing = unique.get(key)
    if (!existing || scenario.selectedActions.length < existing.selectedActions.length) unique.set(key, scenario)
  }
  return [...unique.values()]
}

export function paretoFrontier(scenarios: RecoveryScenario[], epsilon: number) {
  const unique = deduplicateObjectivePoints(scenarios)
  return unique.filter(
    (candidate, candidateIndex) =>
      !unique.some((other, otherIndex) => otherIndex !== candidateIndex && epsilonDominates(other, candidate, epsilon))
  )
}

function normalizedDistanceFromIdeal(scenario: RecoveryScenario, frontier: RecoveryScenario[]) {
  const ranges = OBJECTIVES.map((objective) => {
    const values = frontier.map(objective.value)
    return { min: Math.min(...values), max: Math.max(...values), objective }
  })
  return sum(
    ranges.map(({ min, max, objective }) => {
      if (max === min) return 0
      const value = objective.value(scenario)
      const normalizedValue = (value - min) / (max - min)
      return objective.direction === 'MAX' ? 1 - normalizedValue : normalizedValue
    })
  )
}

function assignLabels(frontier: RecoveryScenario[]) {
  if (!frontier.length) return frontier
  const selected = new Map<string, ScenarioLabel>()
  const pick = (label: ScenarioLabel, compare: (a: RecoveryScenario, b: RecoveryScenario) => number) => {
    const candidate = [...frontier].sort(compare)[0]
    if (candidate && !selected.has(candidate.scenarioId)) selected.set(candidate.scenarioId, label)
  }
  pick(
    'MAXIMUM_READINESS',
    (a, b) =>
      b.probabilityDemandSatisfied - a.probabilityDemandSatisfied ||
      b.expectedCapabilityReadiness - a.expectedCapabilityReadiness
  )
  pick('FAST_RECOVERY', (a, b) => a.expectedRecoveryTimeHours - b.expectedRecoveryTimeHours)
  pick('PARTS_CONSERVATIVE', (a, b) => a.scarcePartsConsumed - b.scarcePartsConsumed)
  pick(
    'LOW_RISK',
    (a, b) => a.recoveryFailureRisk + a.repeatFailureRisk - (b.recoveryFailureRisk + b.repeatFailureRisk)
  )
  pick('BALANCED', (a, b) => normalizedDistanceFromIdeal(a, frontier) - normalizedDistanceFromIdeal(b, frontier))
  return frontier.map((scenario) => ({
    ...scenario,
    label: selected.get(scenario.scenarioId) ?? 'BALANCED',
    paretoExplanation:
      'Nondominated among the evaluated feasible plans: no retained plan improves every objective within the configured epsilon tolerance.',
  }))
}

function actionPriority(input: ReadinessRecoveryInput, action: RecoveryAction, kind: BaselineKind) {
  const asset = input.assets.find((item) => item.assetId === action.assetId)
  const faultOrder = asset?.faults[0]?.faultId ?? action.actionId
  const gain = expectedActionGain(input, action)
  if (kind === 'FIFO') return { primary: 0, secondary: faultOrder }
  if (kind === 'CRITICALITY') return { primary: -gain, secondary: action.actionId }
  const cost = Math.max(1, actionTechnicianHours(action) + action.workshopHours + actionPartUnits(action))
  return { primary: -(gain * action.successProbability) / cost, secondary: action.actionId }
}

function buildBaselineCandidate(
  input: ReadinessRecoveryInput,
  kind: BaselineKind
): { candidate: CandidatePlan; rejected: string[] } {
  const actionById = new Map(input.recoveryActions.map((action) => [action.actionId, action]))
  const actions = input.recoveryActions
    .filter((action) => MATERIAL_ACTIONS.has(action.type))
    .sort((a, b) => {
      const pa = actionPriority(input, a, kind)
      const pb = actionPriority(input, b, kind)
      return pa.primary - pb.primary || pa.secondary.localeCompare(pb.secondary)
    })
  let candidate = emptyCandidate()
  const selectedAssets = new Set<string>()
  const selectedActions = new Set<string>()
  const rejected: string[] = []

  const addWithDependencies = (action: RecoveryAction, stack = new Set<string>()): boolean => {
    if (selectedActions.has(action.actionId)) return true
    if (selectedAssets.has(action.assetId) || stack.has(action.actionId)) return false
    stack.add(action.actionId)
    for (const dependencyId of action.dependsOnActionIds ?? []) {
      const dependency = actionById.get(dependencyId)
      if (!dependency || !addWithDependencies(dependency, stack)) {
        stack.delete(action.actionId)
        return false
      }
    }
    stack.delete(action.actionId)
    const next = extendCandidate(input, candidate, action)
    if (!next) return false
    candidate = next
    selectedAssets.add(action.assetId)
    selectedActions.add(action.actionId)
    return true
  }

  for (const action of actions) {
    if (selectedAssets.has(action.assetId)) continue
    if (!addWithDependencies(action)) rejected.push(action.actionId)
  }
  return { candidate, rejected }
}

function evaluateBaselines(input: ReadinessRecoveryInput): BaselineResult[] {
  return (['FIFO', 'CRITICALITY', 'GREEDY_READINESS'] as const).map((kind, index) => {
    const { candidate, rejected } = buildBaselineCandidate(input, kind)
    return {
      kind,
      scenario: validateCompleteCandidate(input, candidate)
        ? evaluateCandidate(input, candidate, 10_000 + index).scenario
        : null,
      infeasibleActionIds: rejected,
    }
  })
}

function validateInput(input: ReadinessRecoveryInput) {
  if (!input.scenarioId) throw new Error('scenarioId is required')
  if (!Number.isFinite(Date.parse(input.asOf))) throw new Error('asOf must be a valid ISO datetime')
  if (!input.capabilityDemand.length) throw new Error('At least one capability demand is required')
  if (
    input.settings.maxCandidates < 1 ||
    input.settings.beamWidth < 1 ||
    input.settings.maxSearchNodes < 1 ||
    input.settings.maxSolveTimeMs < 1
  ) {
    throw new Error('Planner search budgets must be positive')
  }
  if (input.settings.simulationSamples < 1) throw new Error('simulationSamples must be positive')
  for (const demand of input.capabilityDemand) {
    if (demand.requiredQuantity < 0 || !Number.isFinite(Date.parse(demand.deadline))) {
      throw new Error('Invalid capability demand')
    }
  }
  for (const asset of input.assets) {
    if (asset.currentReliability < 0 || asset.currentReliability > 1) {
      throw new Error(`Invalid reliability for ${asset.assetId}`)
    }
  }
  for (const action of input.recoveryActions) {
    if (action.successProbability < 0 || action.successProbability > 1) {
      throw new Error(`Invalid success probability: ${action.actionId}`)
    }
    if (action.repeatFailureProbability < 0 || action.repeatFailureProbability > 1) {
      throw new Error(`Invalid repeat failure probability: ${action.actionId}`)
    }
  }
}

export function planReadinessRecovery(
  input: ReadinessRecoveryInput,
  backend: OptimizationBackend = new BoundedFeasibilityBackend()
): ReadinessRecoveryResult {
  validateInput(input)
  const started = Date.now()
  const generated = backend.generateCandidates(input)
  const evaluated: RecoveryScenario[] = []
  let truncatedByTimeBudget = generated.truncatedByTimeBudget
  for (let index = 0; index < generated.candidates.length; index += 1) {
    if (evaluated.length >= 3 && Date.now() - started >= input.settings.maxSolveTimeMs) {
      truncatedByTimeBudget = true
      break
    }
    evaluated.push(evaluateCandidate(input, generated.candidates[index], index).scenario)
  }
  const frontier = assignLabels(paretoFrontier(evaluated, input.settings.epsilon))
  const baselines = evaluateBaselines(input)
  const diagnostics: PlannerDiagnostics = {
    searchNodes: generated.searchNodes,
    generatedCandidates: generated.candidates.length,
    feasibleCandidates: generated.candidates.length,
    evaluatedCandidates: evaluated.length,
    dominatedPlansRemoved: evaluated.length - frontier.length,
    elapsedMs: Date.now() - started,
    truncatedByNodeBudget: generated.truncatedByNodeBudget,
    truncatedByTimeBudget,
  }
  return {
    scenarioId: input.scenarioId,
    frontier,
    baselines,
    diagnostics,
    inputSummary: {
      assets: input.assets.length,
      impairedAssets: input.assets.filter((asset) => asset.currentState !== 'READY').length,
      demands: input.capabilityDemand.length,
      actions: input.recoveryActions.length,
    },
  }
}

function frontierExtrema(frontier: RecoveryScenario[]) {
  if (!frontier.length) return { maxProbability: 0, maxReadiness: 0, minShortfall: 0, minTime: 0 }
  return {
    maxProbability: Math.max(...frontier.map((scenario) => scenario.probabilityDemandSatisfied)),
    maxReadiness: Math.max(...frontier.map((scenario) => scenario.expectedCapabilityReadiness)),
    minShortfall: Math.min(...frontier.map((scenario) => scenario.capabilityShortfall)),
    minTime: Math.min(...frontier.map((scenario) => scenario.expectedRecoveryTimeHours)),
  }
}

export function compareFrontiers(
  previous: ReadinessRecoveryResult,
  current: ReadinessRecoveryResult
): FrontierComparison {
  const before = frontierExtrema(previous.frontier)
  const after = frontierExtrema(current.frontier)
  const changes = [
    ['probabilityDemandSatisfied', before.maxProbability, after.maxProbability],
    ['expectedCapabilityReadiness', before.maxReadiness, after.maxReadiness],
    ['capabilityShortfall', before.minShortfall, after.minShortfall],
    ['expectedRecoveryTimeHours', before.minTime, after.minTime],
  ].map(([metric, oldValue, newValue]) => ({
    metric: metric as string,
    before: oldValue as number,
    after: newValue as number,
    delta: round((newValue as number) - (oldValue as number)),
  }))
  return {
    previousCount: previous.frontier.length,
    currentCount: current.frontier.length,
    changes,
    explanation: changes
      .filter((change) => Math.abs(change.delta) > 1e-9)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3)
      .map((change) => `${change.metric}:${change.delta > 0 ? '+' : ''}${change.delta}`),
  }
}
