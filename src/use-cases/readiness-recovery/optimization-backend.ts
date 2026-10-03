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
function scarcePartsPressure(input: ReadinessRecoveryInput, candidate: CandidatePlan) {
  return sum(
    Object.entries(candidate.partsConsumed).map(([partId, quantity]) => {
      const supply = (input.resources.spareParts[partId] ?? 0) + (candidate.partsProduced[partId] ?? 0)
      return quantity / Math.max(1, supply)
    })
  )
}
export function retainDiverseBeam(candidates: MutableCandidate[], width: number, input?: ReadinessRecoveryInput) {
  if (candidates.length <= width) return candidates
  const unique = new Map<string, MutableCandidate>()
  const maxGain = Math.max(1, ...candidates.map((i) => i.scoreGain))
  const maxTime = Math.max(1, ...candidates.map((i) => i.scoreTime))
  const maxParts = Math.max(1, ...candidates.map((i) => i.scoreParts))
  const maxRisk = Math.max(1, ...candidates.map((i) => i.scoreRisk))
  const maxTechnicianHours = Math.max(1, ...candidates.map((i) => i.technicianHours))
  const maxScarcity = input ? Math.max(1, ...candidates.map((i) => scarcePartsPressure(input, i))) : maxParts
  const partsPressure = (candidate: MutableCandidate) =>
    input ? scarcePartsPressure(input, candidate) : candidate.scoreParts
  const objectiveProxy = (candidate: MutableCandidate) =>
    (normalized(candidate.scoreTime, maxTime) +
      normalized(candidate.scoreRisk, maxRisk) +
      normalized(candidate.technicianHours, maxTechnicianHours) +
      normalized(partsPressure(candidate), maxScarcity)) /
      4 -
    0.5 * normalized(candidate.scoreGain, maxGain)

  if (input) {
    const bestByCardinality = new Map<number, MutableCandidate[]>()
    for (const candidate of candidates) {
      const cardinality = candidate.selectedActionIds.length
      const representatives = bestByCardinality.get(cardinality) ?? []
      representatives.push(candidate)
      representatives.sort((a, b) => objectiveProxy(a) - objectiveProxy(b))
      if (representatives.length > 2) representatives.pop()
      bestByCardinality.set(cardinality, representatives)
    }
    for (const representatives of bestByCardinality.values()) {
      for (const candidate of representatives) unique.set(candidateKey(candidate), candidate)
    }
  }

  const remaining = Math.max(0, width - unique.size)
  const take = Math.max(1, Math.floor(remaining / 4))
  const rankings = [
    (i: MutableCandidate) => -normalized(i.scoreGain, maxGain) + 0.08 * normalized(i.scoreRisk, maxRisk),
    (i: MutableCandidate) => normalized(i.scoreTime, maxTime) - 0.25 * normalized(i.scoreGain, maxGain),
    (i: MutableCandidate) => normalized(partsPressure(i), maxScarcity) - 0.2 * normalized(i.scoreGain, maxGain),
    (i: MutableCandidate) => normalized(i.scoreRisk, maxRisk) - 0.2 * normalized(i.scoreGain, maxGain),
  ]
  for (const rank of rankings) {
    for (const candidate of [...candidates].sort((a, b) => rank(a) - rank(b)).slice(0, take)) {
      if (unique.size >= width) break
      unique.set(candidateKey(candidate), candidate)
    }
  }
  for (const candidate of [...candidates].sort((a, b) => b.scoreGain - a.scoreGain)) {
    if (unique.size >= width) break
    unique.set(candidateKey(candidate), candidate)
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
export class BoundedFeasibilityBackend implements OptimizationBackend {
  generateCandidates(input: ReadinessRecoveryInput): CandidateGenerationResult {
    const started = Date.now()
    const actionByAsset = new Map<string, RecoveryAction[]>()
    for (const action of input.recoveryActions) {
      if (action.type === 'DEFER') continue
      const list = actionByAsset.get(action.assetId) ?? []
      list.push(action)
      actionByAsset.set(action.assetId, list)
    }
    const impaired = input.assets
      .filter((a) => a.currentState !== 'READY')
      .sort((a, b) => a.assetId.localeCompare(b.assetId))
    let beam: MutableCandidate[] = [emptyCandidate()]
    let searchNodes = 0,
      truncatedByNodeBudget = false,
      truncatedByTimeBudget = false
    for (const asset of impaired) {
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
          searchNodes++
          const extended = extendCandidate(input, candidate, action)
          if (extended) next.push(extended)
        }
        if (truncatedByNodeBudget || truncatedByTimeBudget) break
      }
      beam = retainDiverseBeam(next, input.settings.beamWidth, input)
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
}
