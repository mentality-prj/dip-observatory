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
type ProxyPoint = {
  candidate: MutableCandidate
  key: string
  gain: number
  time: number
  parts: number
  risk: number
  gainBox: number
  timeBox: number
  partsBox: number
  riskBox: number
  structuralKey: string
}
function structuralCandidateKey(candidate: MutableCandidate) {
  const produced = Object.entries(candidate.partsProduced)
    .filter(([, quantity]) => quantity > 0)
    .map(([partId, quantity]) => `${partId}:${round(quantity, 3)}`)
    .sort()
    .join(',')
  const replacements = Object.entries(candidate.replacementAssetsConsumed)
    .filter(([, quantity]) => quantity > 0)
    .map(([assetType, quantity]) => `${assetType}:${quantity}`)
    .sort()
    .join(',')
  const bindings = [...candidate.bindingConstraints].sort().join(',')
  return `${candidate.selectedActionIds.length}|p:${produced}|r:${replacements}|b:${bindings}`
}
function epsilonBox(value: number, epsilon: number) {
  return Math.floor(value / Math.max(epsilon, 1e-9) + 1e-12)
}
function proxyPoint(
  candidate: MutableCandidate,
  scales: { gain: number; time: number; parts: number; risk: number },
  epsilon: number
): ProxyPoint {
  const gain = normalized(candidate.scoreGain, scales.gain)
  const time = normalized(candidate.scoreTime, scales.time)
  const parts = normalized(candidate.scoreParts, scales.parts)
  const risk = normalized(candidate.scoreRisk, scales.risk)
  return {
    candidate,
    key: candidateKey(candidate),
    gain,
    time,
    parts,
    risk,
    gainBox: epsilonBox(gain, epsilon),
    timeBox: epsilonBox(time, epsilon),
    partsBox: epsilonBox(parts, epsilon),
    riskBox: epsilonBox(risk, epsilon),
    structuralKey: structuralCandidateKey(candidate),
  }
}
function proxyDominates(a: ProxyPoint, b: ProxyPoint) {
  const noWorse =
    a.gainBox >= b.gainBox && a.timeBox <= b.timeBox && a.partsBox <= b.partsBox && a.riskBox <= b.riskBox
  if (!noWorse) return false
  return (
    a.gainBox > b.gainBox || a.timeBox < b.timeBox || a.partsBox < b.partsBox || a.riskBox < b.riskBox
  )
}
function paretoLayers(points: ProxyPoint[]) {
  const dominates = points.map(() => [] as number[])
  const dominatedByCount = points.map(() => 0)
  for (let left = 0; left < points.length; left += 1) {
    for (let right = left + 1; right < points.length; right += 1) {
      if (proxyDominates(points[left], points[right])) {
        dominates[left].push(right)
        dominatedByCount[right] += 1
      } else if (proxyDominates(points[right], points[left])) {
        dominates[right].push(left)
        dominatedByCount[left] += 1
      }
    }
  }
  const layers: ProxyPoint[][] = []
  let current = dominatedByCount.flatMap((count, index) => (count === 0 ? [index] : []))
  const assigned = new Set(current)
  while (current.length) {
    layers.push(current.map((index) => points[index]))
    const next: number[] = []
    for (const index of current) {
      for (const dominatedIndex of dominates[index]) {
        dominatedByCount[dominatedIndex] -= 1
        if (dominatedByCount[dominatedIndex] === 0 && !assigned.has(dominatedIndex)) {
          assigned.add(dominatedIndex)
          next.push(dominatedIndex)
        }
      }
    }
    current = next
  }
  if (assigned.size < points.length) {
    layers.push(points.filter((_, index) => !assigned.has(index)))
  }
  return layers
}
function crowdingDistance(layer: ProxyPoint[]) {
  const distances = new Map<string, number>(layer.map((point) => [point.key, 0]))
  const objectives: Array<(point: ProxyPoint) => number> = [
    (point) => point.gain,
    (point) => point.time,
    (point) => point.parts,
    (point) => point.risk,
  ]
  if (layer.length <= 2) {
    for (const point of layer) distances.set(point.key, Number.POSITIVE_INFINITY)
    return distances
  }
  for (const objective of objectives) {
    const ordered = [...layer].sort((a, b) => objective(a) - objective(b) || a.key.localeCompare(b.key))
    const min = objective(ordered[0])
    const max = objective(ordered[ordered.length - 1])
    distances.set(ordered[0].key, Number.POSITIVE_INFINITY)
    distances.set(ordered[ordered.length - 1].key, Number.POSITIVE_INFINITY)
    if (max <= min) continue
    for (let index = 1; index < ordered.length - 1; index += 1) {
      const point = ordered[index]
      if (!Number.isFinite(distances.get(point.key) ?? 0)) continue
      const distance = (objective(ordered[index + 1]) - objective(ordered[index - 1])) / (max - min)
      distances.set(point.key, (distances.get(point.key) ?? 0) + distance)
    }
  }
  return distances
}
function actionSetDistance(a: ProxyPoint, b: ProxyPoint) {
  const left = new Set(a.candidate.selectedActionIds)
  const right = new Set(b.candidate.selectedActionIds)
  const union = new Set([...left, ...right])
  if (!union.size) return 0
  let intersection = 0
  for (const actionId of left) if (right.has(actionId)) intersection += 1
  return 1 - intersection / union.size
}
function structuralNovelty(point: ProxyPoint, selected: ProxyPoint[]) {
  if (!selected.length) return 1
  return Math.min(...selected.map((other) => actionSetDistance(point, other)))
}
function balancedProxyLoss(point: ProxyPoint) {
  return -point.gain + point.time + point.parts + point.risk
}
function chooseDiverseLayerSubset(layer: ProxyPoint[], count: number, selected: ProxyPoint[]) {
  if (layer.length <= count) return layer
  const crowding = crowdingDistance(layer)
  const buckets = new Map<string, ProxyPoint[]>()
  for (const point of layer) {
    const bucket = buckets.get(point.structuralKey) ?? []
    bucket.push(point)
    buckets.set(point.structuralKey, bucket)
  }
  const representatives = [...buckets.values()].map((bucket) =>
    [...bucket].sort((a, b) => {
      const crowdingA = crowding.get(a.key) ?? 0
      const crowdingB = crowding.get(b.key) ?? 0
      if (crowdingA !== crowdingB) return crowdingB - crowdingA
      return balancedProxyLoss(a) - balancedProxyLoss(b) || a.key.localeCompare(b.key)
    })[0]
  )
  const chosen: ProxyPoint[] = []
  const availableRepresentatives = [...representatives]
  const chooseNext = (available: ProxyPoint[]) => {
    return [...available].sort((a, b) => {
      const crowdingA = crowding.get(a.key) ?? 0
      const crowdingB = crowding.get(b.key) ?? 0
      const boundaryA = Number.isFinite(crowdingA) ? 0 : 1
      const boundaryB = Number.isFinite(crowdingB) ? 0 : 1
      if (boundaryA !== boundaryB) return boundaryB - boundaryA
      const noveltyA = structuralNovelty(a, [...selected, ...chosen])
      const noveltyB = structuralNovelty(b, [...selected, ...chosen])
      if (noveltyA !== noveltyB) return noveltyB - noveltyA
      if (crowdingA !== crowdingB) return crowdingB - crowdingA
      return balancedProxyLoss(a) - balancedProxyLoss(b) || a.key.localeCompare(b.key)
    })[0]
  }
  while (chosen.length < count && availableRepresentatives.length) {
    const next = chooseNext(availableRepresentatives)
    chosen.push(next)
    availableRepresentatives.splice(
      availableRepresentatives.findIndex((point) => point.key === next.key),
      1
    )
  }
  const chosenKeys = new Set(chosen.map((point) => point.key))
  const remaining = layer.filter((point) => !chosenKeys.has(point.key))
  while (chosen.length < count && remaining.length) {
    const next = chooseNext(remaining)
    chosen.push(next)
    remaining.splice(
      remaining.findIndex((point) => point.key === next.key),
      1
    )
  }
  return chosen
}
export function retainDiverseBeam(candidates: MutableCandidate[], width: number, epsilon = 0.015) {
  if (candidates.length <= width) return candidates
  const unique = new Map<string, MutableCandidate>()
  for (const candidate of candidates) unique.set(candidateKey(candidate), candidate)
  const deduplicated = [...unique.values()].sort((a, b) => candidateKey(a).localeCompare(candidateKey(b)))
  if (deduplicated.length <= width) return deduplicated
  const scales = {
    gain: Math.max(1, ...deduplicated.map((candidate) => candidate.scoreGain)),
    time: Math.max(1, ...deduplicated.map((candidate) => candidate.scoreTime)),
    parts: Math.max(1, ...deduplicated.map((candidate) => candidate.scoreParts)),
    risk: Math.max(1, ...deduplicated.map((candidate) => candidate.scoreRisk)),
  }
  const points = deduplicated.map((candidate) => proxyPoint(candidate, scales, epsilon))
  const layers = paretoLayers(points)
  const selected: ProxyPoint[] = []
  for (const layer of layers) {
    const remaining = width - selected.length
    if (remaining <= 0) break
    if (layer.length <= remaining) selected.push(...layer)
    else selected.push(...chooseDiverseLayerSubset(layer, remaining, selected))
  }
  return selected.slice(0, width).map((point) => point.candidate)
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
      beam = retainDiverseBeam(next, input.settings.beamWidth, input.settings.epsilon)
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