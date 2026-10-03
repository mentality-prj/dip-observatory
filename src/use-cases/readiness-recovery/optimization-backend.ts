import type { Asset, CandidatePlan, NumericDistribution, ReadinessRecoveryInput, RecoveryAction } from './domain'

export const MATERIAL_ACTIONS = new Set<RecoveryAction['type']>([
  'LIMITED_REPAIR',
  'FULL_REPAIR',
  'EXTERNAL_REPAIR',
  'REPLACE',
])
export const ENABLING_ACTIONS = new Set<RecoveryAction['type']>(['CANNIBALIZE', 'DIAGNOSE'])
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
export const round = (value: number, digits = 4) => Number(value.toFixed(digits))
export function hoursBetween(from: string, to: string) {
  return Math.max(0, (Date.parse(to) - Date.parse(from)) / 3_600_000)
}
export function distributionMean(distribution: NumericDistribution): number {
  switch (distribution.kind) {
    case 'DETERMINISTIC':
      return distribution.value
    case 'TRIANGULAR':
      return (distribution.min + distribution.mode + distribution.max) / 3
    case 'LOG_NORMAL':
      return Math.exp(distribution.mu + (distribution.sigma * distribution.sigma) / 2)
    case 'EMPIRICAL':
      return distribution.values.length ? sum(distribution.values) / distribution.values.length : 0
  }
}
export function createRng(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}
function normalSample(rng: () => number) {
  const u1 = Math.max(rng(), Number.EPSILON)
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}
export function sampleDistribution(distribution: NumericDistribution, rng: () => number): number {
  switch (distribution.kind) {
    case 'DETERMINISTIC': {
      return distribution.value
    }
    case 'TRIANGULAR': {
      const { min, mode, max } = distribution
      if (max <= min) return min
      const u = rng()
      const split = (mode - min) / (max - min)
      return u <= split
        ? min + Math.sqrt(u * (max - min) * (mode - min))
        : max - Math.sqrt((1 - u) * (max - min) * (max - mode))
    }
    case 'LOG_NORMAL':
      return Math.exp(distribution.mu + distribution.sigma * normalSample(rng))
    case 'EMPIRICAL':
      return distribution.values.length
        ? distribution.values[Math.min(distribution.values.length - 1, Math.floor(rng() * distribution.values.length))]
        : 0
  }
}
function assetDemandDeadlineHours(input: ReadinessRecoveryInput, asset: Asset) {
  const capabilities = new Set(
    asset.providedCapabilities.flatMap((item) => [item.capabilityId, ...(item.substitutableBy ?? [])])
  )
  const deadlines = input.capabilityDemand
    .filter((d) => capabilities.has(d.capabilityId))
    .map((d) => hoursBetween(input.asOf, d.deadline))
  return deadlines.length ? Math.max(...deadlines) : Number.POSITIVE_INFINITY
}
export function expectedActionGain(input: ReadinessRecoveryInput, action: RecoveryAction) {
  if (!MATERIAL_ACTIONS.has(action.type)) return 0
  const asset = input.assets.find((item) => item.assetId === action.assetId)
  if (!asset) return 0
  const expectedReliability = clamp01(distributionMean(action.resultingReliabilityDistribution))
  const current = asset.currentState === 'FAILED' ? 0 : clamp01(asset.currentReliability)
  const delta = Math.max(0, expectedReliability * action.successProbability - current)
  const demands = new Map(input.capabilityDemand.map((d) => [d.capabilityId, d]))
  return sum(
    asset.providedCapabilities.map((c) => {
      const d = demands.get(c.capabilityId)
      return d ? c.quantity * (c.qualityFactor ?? 1) * delta * (d.priority ?? 1) : 0
    })
  )
}
export const actionPartUnits = (action: RecoveryAction) => sum(action.requiredParts.map((part) => part.quantity))
export const actionTechnicianHours = (action: RecoveryAction) =>
  sum(action.requiredSkills.map((skill) => skill.technicianHours))
function actionRisk(action: RecoveryAction) {
  return MATERIAL_ACTIONS.has(action.type) ? 1 - action.successProbability * (1 - action.repeatFailureProbability) : 0
}
export type MutableCandidate = CandidatePlan & {
  scoreGain: number
  scoreTime: number
  scoreParts: number
  scoreRisk: number
}
export function emptyCandidate(): MutableCandidate {
  return {
    id: 'candidate-root',
    selectedActionIds: [],
    proxyReadinessGain: 0,
    technicianHours: 0,
    workshopHours: 0,
    partsConsumed: {},
    partsProduced: {},
    replacementAssetsConsumed: {},
    bindingConstraints: [],
    scoreGain: 0,
    scoreTime: 0,
    scoreParts: 0,
    scoreRisk: 0,
  }
}
const copyRecord = (record: Record<string, number>) => ({ ...record })
function utilizationRatio(used: number, available: number) {
  if (available <= 0) return used > 0 ? Number.POSITIVE_INFINITY : 0
  return used / available
}
function selectedActions(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  return candidate.selectedActionIds
    .map((id) => input.recoveryActions.find((a) => a.actionId === id))
    .filter((a): a is RecoveryAction => Boolean(a))
}
function aggregateParts(input: ReadinessRecoveryInput, actions: RecoveryAction[]) {
  const consumed: Record<string, number> = {}
  const produced: Record<string, number> = {}
  for (const action of actions) {
    for (const part of action.requiredParts) consumed[part.partId] = (consumed[part.partId] ?? 0) + part.quantity
    for (const part of action.producedParts ?? []) produced[part.partId] = (produced[part.partId] ?? 0) + part.quantity
  }
  for (const [partId, quantity] of Object.entries(consumed)) {
    if (quantity > (input.resources.spareParts[partId] ?? 0) + (produced[partId] ?? 0)) return null
  }
  return { consumed, produced }
}
function hasDependencyCycle(actions: RecoveryAction[]) {
  const selected = new Map(actions.map((a) => [a.actionId, a]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const dep of selected.get(id)?.dependsOnActionIds ?? []) {
      if (selected.has(dep) && visit(dep)) return true
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }
  return actions.some((a) => visit(a.actionId))
}
export function validateCompleteCandidate(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  const actions = selectedActions(input, candidate)
  const selected = new Set(candidate.selectedActionIds)
  if (actions.length !== candidate.selectedActionIds.length || hasDependencyCycle(actions)) return false
  const assets = new Set<string>()
  for (const action of actions) {
    if (assets.has(action.assetId)) return false
    assets.add(action.assetId)
    if (action.dependsOnActionIds?.some((id) => !selected.has(id))) return false
    if (action.incompatibleActionIds?.some((id) => selected.has(id))) return false
  }
  return aggregateParts(input, actions) !== null
}
export function extendCandidate(
  input: ReadinessRecoveryInput,
  candidate: MutableCandidate,
  action: RecoveryAction | null
): MutableCandidate | null {
  if (!action)
    return {
      ...candidate,
      id: `${candidate.id}:skip`,
      selectedActionIds: [...candidate.selectedActionIds],
      partsConsumed: copyRecord(candidate.partsConsumed),
      partsProduced: copyRecord(candidate.partsProduced),
      replacementAssetsConsumed: copyRecord(candidate.replacementAssetsConsumed),
      bindingConstraints: [...candidate.bindingConstraints],
    }
  const existing = selectedActions(input, candidate)
  if (existing.some((item) => item.assetId === action.assetId)) return null
  if (
    action.incompatibleActionIds?.some((id) => candidate.selectedActionIds.includes(id)) ||
    existing.some((item) => item.incompatibleActionIds?.includes(action.actionId))
  )
    return null
  const asset = input.assets.find((item) => item.assetId === action.assetId)
  if (!asset) return null
  if (action.type === 'REPLACE') {
    const replacementType = action.replacementAssetType ?? asset.type
    if (replacementType !== asset.type) return null
    const next = (candidate.replacementAssetsConsumed[replacementType] ?? 0) + 1
    if (next > (input.resources.replacementAssets[replacementType] ?? 0)) return null
  }
  if (
    MATERIAL_ACTIONS.has(action.type) &&
    distributionMean(action.durationDistribution) > assetDemandDeadlineHours(input, asset)
  )
    return null
  const nextActions = [...existing, action]
  const technicianBySkill: Record<string, number> = {}
  for (const item of nextActions)
    for (const req of item.requiredSkills)
      technicianBySkill[req.skillId] = (technicianBySkill[req.skillId] ?? 0) + req.technicianHours
  for (const [skill, hours] of Object.entries(technicianBySkill))
    if (hours > (input.resources.technicianHours[skill] ?? 0)) return null
  const workshopHours = sum(nextActions.map((item) => item.workshopHours))
  if (workshopHours > input.resources.workshopHours) return null
  const parts = aggregateParts(
    input,
    nextActions
  ) /* partial candidates may temporarily lack a producer selected later */
  const consumed =
    parts?.consumed ??
    Object.fromEntries(
      nextActions
        .flatMap((item) => item.requiredParts.map((p) => p.partId))
        .map((id) => [
          id,
          sum(
            nextActions
              .flatMap((item) => item.requiredParts)
              .filter((p) => p.partId === id)
              .map((p) => p.quantity)
          ),
        ])
    )
  const produced =
    parts?.produced ??
    Object.fromEntries(
      nextActions
        .flatMap((item) => item.producedParts ?? [])
        .map((p) => p.partId)
        .map((id) => [
          id,
          sum(
            nextActions
              .flatMap((item) => item.producedParts ?? [])
              .filter((p) => p.partId === id)
              .map((p) => p.quantity)
          ),
        ])
    )
  const replacements = copyRecord(candidate.replacementAssetsConsumed)
  if (action.type === 'REPLACE') {
    const type = action.replacementAssetType ?? asset.type
    replacements[type] = (replacements[type] ?? 0) + 1
  }
  const binding = new Set(candidate.bindingConstraints)
  if (utilizationRatio(workshopHours, input.resources.workshopHours) >= 0.9) binding.add('WORKSHOP_CAPACITY')
  for (const [skill, hours] of Object.entries(technicianBySkill))
    if (utilizationRatio(hours, input.resources.technicianHours[skill] ?? 0) >= 0.9)
      binding.add(`TECHNICIAN_SKILL:${skill}`)
  return {
    id: `${candidate.id}:${action.actionId}`,
    selectedActionIds: [...candidate.selectedActionIds, action.actionId],
    proxyReadinessGain: candidate.proxyReadinessGain + expectedActionGain(input, action),
    technicianHours: sum(nextActions.map(actionTechnicianHours)),
    workshopHours,
    partsConsumed: consumed,
    partsProduced: produced,
    replacementAssetsConsumed: replacements,
    bindingConstraints: [...binding],
    scoreGain: candidate.scoreGain + expectedActionGain(input, action),
    scoreTime: candidate.scoreTime + distributionMean(action.durationDistribution),
    scoreParts: candidate.scoreParts + actionPartUnits(action),
    scoreRisk: candidate.scoreRisk + actionRisk(action),
  }
}
function candidateKey(candidate: CandidatePlan) {
  return [...candidate.selectedActionIds].sort().join('|')
}
function normalized(value: number, scale: number) {
  return scale > 0 ? value / scale : value
}
function compareCandidateKeys(left: CandidatePlan, right: CandidatePlan) {
  const leftKey = candidateKey(left)
  const rightKey = candidateKey(right)
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
}

/** Legacy four-channel retention, preserved as a test control and for diagnostic tracing. */
export function retainDiverseBeam(candidates: MutableCandidate[], width: number) {
  if (candidates.length <= width) return candidates
  const unique = new Map<string, MutableCandidate>()
  const take = Math.max(1, Math.floor(width / 4))
  const maxGain = Math.max(1, ...candidates.map((i) => i.scoreGain))
  const maxTime = Math.max(1, ...candidates.map((i) => i.scoreTime))
  const maxParts = Math.max(1, ...candidates.map((i) => i.scoreParts))
  const maxRisk = Math.max(1, ...candidates.map((i) => i.scoreRisk))
  const rankings = [
    (i: MutableCandidate) => -normalized(i.scoreGain, maxGain) + 0.08 * normalized(i.scoreRisk, maxRisk),
    (i: MutableCandidate) => normalized(i.scoreTime, maxTime) - 0.25 * normalized(i.scoreGain, maxGain),
    (i: MutableCandidate) => normalized(i.scoreParts, maxParts) - 0.2 * normalized(i.scoreGain, maxGain),
    (i: MutableCandidate) => normalized(i.scoreRisk, maxRisk) - 0.2 * normalized(i.scoreGain, maxGain),
  ]
  for (const rank of rankings)
    for (const candidate of [...candidates]
      .sort((a, b) => rank(a) - rank(b) || compareCandidateKeys(a, b))
      .slice(0, take))
      unique.set(candidateKey(candidate), candidate)
  for (const candidate of [...candidates].sort((a, b) => b.scoreGain - a.scoreGain || compareCandidateKeys(a, b))) {
    if (unique.size >= width) break
    unique.set(candidateKey(candidate), candidate)
  }
  return [...unique.values()].slice(0, width)
}

export function hasUnresolvedDependency(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  const selected = new Set(candidate.selectedActionIds)
  return selectedActions(input, candidate).some((action) =>
    (action.dependsOnActionIds ?? []).some((dependencyId) => !selected.has(dependencyId))
  )
}

export function bindingResourceSignature(candidate: CandidatePlan) {
  return [...candidate.bindingConstraints].sort().join('|')
}

function producesParts(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  return selectedActions(input, candidate).some((action) => (action.producedParts?.length ?? 0) > 0)
}

function technicianPressure(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  const usedBySkill: Record<string, number> = {}
  for (const action of selectedActions(input, candidate))
    for (const requirement of action.requiredSkills)
      usedBySkill[requirement.skillId] = (usedBySkill[requirement.skillId] ?? 0) + requirement.technicianHours
  const utilizations = Object.entries(usedBySkill).map(([skillId, used]) => {
    const available = input.resources.technicianHours[skillId] ?? 0
    if (available <= 0) return used > 0 ? 1 : 0
    return clamp01(used / available)
  })
  return utilizations.length ? Math.max(...utilizations) : 0
}

function workshopPressure(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  const available = input.resources.workshopHours
  if (available <= 0) return candidate.workshopHours > 0 ? 1 : 0
  return clamp01(candidate.workshopHours / available)
}

function partPressure(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  const utilizations = Object.entries(candidate.partsConsumed)
    .filter(([, consumed]) => consumed > 0)
    .map(([partId, consumed]) => {
      const effectiveAvailable = (input.resources.spareParts[partId] ?? 0) + (candidate.partsProduced[partId] ?? 0)
      return effectiveAvailable > 0 ? clamp01(consumed / effectiveAvailable) : 1
    })
  return utilizations.length ? Math.max(...utilizations) : 0
}

function stageScores(input: ReadinessRecoveryInput, candidates: MutableCandidate[]) {
  const maxGain = Math.max(0, ...candidates.map((candidate) => candidate.scoreGain))
  const maxRisk = Math.max(0, ...candidates.map((candidate) => candidate.scoreRisk))
  return new Map(
    candidates.map((candidate) => {
      const gainUtil = maxGain > 0 ? candidate.scoreGain / maxGain : 0
      const riskPressure = maxRisk > 0 ? clamp01(candidate.scoreRisk / maxRisk) : 0
      const resourcePressure =
        (technicianPressure(input, candidate) +
          workshopPressure(input, candidate) +
          partPressure(input, candidate) +
          riskPressure) /
        4
      return [candidateKey(candidate), gainUtil - resourcePressure]
    })
  )
}

function structuralKey(input: ReadinessRecoveryInput, candidate: MutableCandidate, processedAssetCount: number) {
  const actionCount = candidate.selectedActionIds.length
  const skipCount = Math.max(0, processedAssetCount - actionCount)
  return JSON.stringify([
    actionCount,
    skipCount,
    hasUnresolvedDependency(input, candidate),
    producesParts(input, candidate),
    bindingResourceSignature(candidate),
  ])
}

/** Frozen 50/25/25 resource-aware retention; at width 72 this is exactly 36/18/18. */
export function retainResourceAwareBeam(
  candidates: MutableCandidate[],
  width: number,
  input: ReadinessRecoveryInput,
  processedAssetCount: number
) {
  if (candidates.length <= width) return [...candidates].sort(compareCandidateKeys)

  const primaryTake = Math.floor(width / 2)
  const operationalTake = Math.floor(width / 4)
  const structuralTake = width - primaryTake - operationalTake
  const scores = stageScores(input, candidates)
  const scoreOf = (candidate: MutableCandidate) => scores.get(candidateKey(candidate)) ?? Number.NEGATIVE_INFINITY
  const byPrimary = [...candidates].sort((a, b) => scoreOf(b) - scoreOf(a) || compareCandidateKeys(a, b))

  const maxGain = Math.max(1, ...candidates.map((candidate) => candidate.scoreGain))
  const maxRisk = Math.max(1, ...candidates.map((candidate) => candidate.scoreRisk))
  const operationalRank = (candidate: MutableCandidate) =>
    -normalized(candidate.scoreGain, maxGain) + 0.08 * normalized(candidate.scoreRisk, maxRisk)
  const byOperational = [...candidates].sort(
    (a, b) => operationalRank(a) - operationalRank(b) || compareCandidateKeys(a, b)
  )

  const bestByStructuralKey = new Map<string, MutableCandidate>()
  for (const candidate of byPrimary) {
    const key = structuralKey(input, candidate, processedAssetCount)
    if (!bestByStructuralKey.has(key)) bestByStructuralKey.set(key, candidate)
  }
  const byStructural = [...bestByStructuralKey.values()].sort(
    (a, b) => scoreOf(b) - scoreOf(a) || compareCandidateKeys(a, b)
  )

  const unique = new Map<string, MutableCandidate>()
  const add = (candidate: MutableCandidate) => unique.set(candidateKey(candidate), candidate)
  byPrimary.slice(0, primaryTake).forEach(add)
  byOperational.slice(0, operationalTake).forEach(add)
  byStructural.slice(0, structuralTake).forEach(add)
  for (const candidate of byPrimary) {
    if (unique.size >= width) break
    add(candidate)
  }
  return [...unique.values()].slice(0, width)
}

export type CandidateGenerationResult = {
  candidates: CandidatePlan[]
  searchNodes: number
  truncatedByNodeBudget: boolean
  truncatedByTimeBudget: boolean
}
export interface OptimizationBackend {
  generateCandidates(input: ReadinessRecoveryInput): CandidateGenerationResult
}

type BeamRetainer = (
  candidates: MutableCandidate[],
  width: number,
  input: ReadinessRecoveryInput,
  processedAssetCount: number
) => MutableCandidate[]

function generateCandidatesWithRetention(
  input: ReadinessRecoveryInput,
  retain: BeamRetainer
): CandidateGenerationResult {
  const started = Date.now()
  const actionByAsset = new Map<string, RecoveryAction[]>()
  for (const action of input.recoveryActions) {
    if (action.type === 'DEFER') continue
    const list = actionByAsset.get(action.assetId) ?? []
    list.push(action)
    actionByAsset.set(action.assetId, list)
  }
  const impaired = input.assets
    .filter((asset) => asset.currentState !== 'READY')
    .sort((a, b) => a.assetId.localeCompare(b.assetId))
  let beam: MutableCandidate[] = [emptyCandidate()]
  let searchNodes = 0
  let truncatedByNodeBudget = false
  let truncatedByTimeBudget = false
  for (let stageIndex = 0; stageIndex < impaired.length; stageIndex += 1) {
    const asset = impaired[stageIndex]
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
    beam = retain(next, input.settings.beamWidth, input, stageIndex + 1)
    if (!beam.length || truncatedByNodeBudget || truncatedByTimeBudget) break
  }
  const unique = new Map<string, CandidatePlan>()
  for (const candidate of beam) {
    if (validateCompleteCandidate(input, candidate)) unique.set(candidateKey(candidate), candidate)
  }
  return {
    candidates: [...unique.values()].slice(0, input.settings.maxCandidates),
    searchNodes,
    truncatedByNodeBudget,
    truncatedByTimeBudget,
  }
}

export class LegacyBoundedFeasibilityBackend implements OptimizationBackend {
  generateCandidates(input: ReadinessRecoveryInput): CandidateGenerationResult {
    return generateCandidatesWithRetention(input, (candidates, width) => retainDiverseBeam(candidates, width))
  }
}

export class BoundedFeasibilityBackend implements OptimizationBackend {
  generateCandidates(input: ReadinessRecoveryInput): CandidateGenerationResult {
    return generateCandidatesWithRetention(input, retainResourceAwareBeam)
  }
}
