import type {
  AllocationAssignment,
  AllocationUnit,
  Contractor,
  ContractorAllocationResult,
  ContractorAllocationScenario,
  ContractorContract,
  DecisionSpaceMetrics,
  FeasibleAlternative,
  FeasibilityReason,
  InputProvenance,
  RejectedAlternative,
  SourceRole,
  UnitDecisionAnalysis,
} from './domain'
import { createScenarioInputSnapshot } from './snapshot'

export const CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION = 'contractor-allocation/6'
const DEFAULT_MAX_SEARCH_NODES = 750_000
const EPSILON = 1e-9

type CostedCandidate = FeasibleAlternative & { expectedCost: number }
type ContractLimit = { min: number; max: number }
type SearchUnit = {
  analysis: UnitDecisionAnalysis
  candidates: CostedCandidate[]
}
type OptimizerOptions = { maxSearchNodes?: number }

type SearchResult = {
  status: ContractorAllocationResult['status']
  selectedByUnit: Map<string, CostedCandidate>
  totalCost: number
  exploredNodes: number
  lowerBound: number | null
  optimalityGapPct: number | null
}

function includesAll(available: string[], required: string[]) {
  return required.every((value) => available.includes(value))
}

function isActive(contract: ContractorContract, asOf: string) {
  return contract.validFrom <= asOf && asOf <= contract.validTo
}

function isFiniteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0
}

function isTrustedSource(provenance: InputProvenance | undefined, expectedRole: SourceRole, asOf: string) {
  return Boolean(
    provenance &&
    provenance.sourceRole === expectedRole &&
    provenance.sourceSystem.trim() &&
    provenance.sourceRecordId.trim() &&
    provenance.capturedAt.slice(0, 10) <= asOf
  )
}

function unitInputsTrusted(unit: AllocationUnit, scenario: ContractorAllocationScenario) {
  const provenance = unit.provenance
  if (!provenance) return false

  const inspectorInputs = [
    provenance.scope,
    provenance.quantity,
    provenance.territory,
    provenance.workType,
    provenance.technicalRequirements,
  ]
  const operationsInputs = [provenance.deadline, provenance.capacityRequirements]

  if (!inspectorInputs.every((input) => isTrustedSource(input, 'INSPECTOR', scenario.asOf))) return false
  if (!operationsInputs.every((input) => isTrustedSource(input, 'OPERATIONS', scenario.asOf))) return false
  if (!isTrustedSource(provenance.contractVolume, 'PROCUREMENT', scenario.asOf)) return false
  if (
    (unit.expectedLaborHours != null || unit.expectedEquipmentHours != null) &&
    !isTrustedSource(provenance.teEstimate, 'OPERATIONS', scenario.asOf)
  ) {
    return false
  }
  if (!isFiniteNonNegative(unit.quantity) || !isFiniteNonNegative(unit.contractVolume)) return false
  if (!unit.capacityRequirements.length) return false
  if (
    unit.capacityRequirements.some(
      (requirement) =>
        !/^\d{4}-\d{2}$/.test(requirement.bucket) ||
        !Number.isFinite(requirement.demand) ||
        requirement.demand <= 0 ||
        requirement.bucket < scenario.asOf.slice(0, 7)
    )
  ) {
    return false
  }

  return true
}

function contractorInputsTrusted(contractor: Contractor, scenario: ContractorAllocationScenario) {
  const provenance = contractor.provenance
  if (!provenance) return false
  if (!isTrustedSource(provenance.capacityBuckets, 'OPERATIONS', scenario.asOf)) return false
  if (!isTrustedSource(provenance.equipment, 'OPERATIONS', scenario.asOf)) return false
  if (!isTrustedSource(provenance.certifications, 'OPERATIONS', scenario.asOf)) return false
  return contractor.capacityBuckets.every(
    (bucket) => /^\d{4}-\d{2}$/.test(bucket.bucket) && isFiniteNonNegative(bucket.availableCapacity)
  )
}

function contractInputsTrusted(contract: ContractorContract, scenario: ContractorAllocationScenario) {
  const provenance = contract.provenance
  if (!provenance) return false
  if (!isTrustedSource(provenance.eligibility, 'PROCUREMENT', scenario.asOf)) return false
  if (!isTrustedSource(provenance.rates, 'PROCUREMENT', scenario.asOf)) return false
  if (!isTrustedSource(provenance.volumeState, 'PROCUREMENT', scenario.asOf)) return false
  if (!isFiniteNonNegative(contract.consumedVolumeToDate)) return false
  if (!isFiniteNonNegative(contract.remainingMinVolume) || !isFiniteNonNegative(contract.remainingMaxVolume))
    return false
  return contract.remainingMinVolume <= contract.remainingMaxVolume + EPSILON
}

function matchingRate(contract: ContractorContract, unit: AllocationUnit) {
  return contract.rates.find((rate) => rate.workType === unit.workType && rate.quantityUnit === unit.quantityUnit)
}

function estimateCost(contract: ContractorContract, unit: AllocationUnit): number | null {
  const rate = matchingRate(contract, unit)
  if (!rate) return null
  const fixed = (rate.mobilizationCost ?? 0) + (rate.overtimeCost ?? 0)

  if (contract.pricingModel === 'UNIT_PRICE') {
    return rate.unitRate == null ? null : unit.quantity * rate.unitRate + fixed
  }

  if (unit.expectedLaborHours == null || unit.expectedEquipmentHours == null) return null
  if (rate.laborRate == null || rate.equipmentRate == null) return null
  return unit.expectedLaborHours * rate.laborRate + unit.expectedEquipmentHours * rate.equipmentRate + fixed
}

function remainingContractLimit(contract: ContractorContract): ContractLimit {
  return {
    min: contract.remainingMinVolume,
    max: contract.remainingMaxVolume,
  }
}

function contractorLevelReasons(
  contractor: Contractor,
  unit: AllocationUnit,
  scenario: ContractorAllocationScenario
): FeasibilityReason[] {
  const reasons: FeasibilityReason[] = []
  if (!unitInputsTrusted(unit, scenario) || !contractorInputsTrusted(contractor, scenario)) {
    reasons.push('UNTRUSTED_INPUT')
    return reasons
  }

  const capacity = new Map(contractor.capacityBuckets.map((bucket) => [bucket.bucket, bucket.availableCapacity]))
  for (const requirement of unit.capacityRequirements) {
    if (!capacity.has(requirement.bucket)) {
      reasons.push('CAPACITY_BUCKET_MISSING')
      continue
    }
    if ((capacity.get(requirement.bucket) ?? 0) + EPSILON < requirement.demand) reasons.push('NO_CAPACITY')
    if (requirement.bucket > unit.deadline.slice(0, 7)) reasons.push('SLA_IMPOSSIBLE')
  }

  if (!includesAll(contractor.equipment, unit.requiredEquipment)) reasons.push('MISSING_EQUIPMENT')
  if (!includesAll(contractor.certifications, unit.requiredCertifications)) reasons.push('MISSING_CERTIFICATION')
  return [...new Set(reasons)]
}

function evaluateContract(
  contractor: Contractor,
  contract: ContractorContract,
  unit: AllocationUnit,
  scenario: ContractorAllocationScenario
): FeasibleAlternative | RejectedAlternative {
  const reasons: FeasibilityReason[] = []
  if (!contractInputsTrusted(contract, scenario)) reasons.push('UNTRUSTED_INPUT')
  if (!contract.approved) reasons.push('NOT_APPROVED')
  if (contract.approved && !isActive(contract, scenario.asOf)) reasons.push('CONTRACT_EXPIRED')
  if (contract.approved && isActive(contract, scenario.asOf) && !contract.territories.includes(unit.territory)) {
    reasons.push('TERRITORY_NOT_ALLOWED')
  }
  if (
    contract.approved &&
    isActive(contract, scenario.asOf) &&
    contract.territories.includes(unit.territory) &&
    !contract.workTypes.includes(unit.workType)
  ) {
    reasons.push('WORK_TYPE_NOT_ALLOWED')
  }

  const remaining = remainingContractLimit(contract)
  if (remaining.max + EPSILON < unit.contractVolume) reasons.push('CONTRACT_VOLUME_LIMIT')

  const rate = matchingRate(contract, unit)
  if (!rate && !reasons.length) reasons.push('RATE_NOT_CONFIGURED')

  if (reasons.length) {
    return {
      contractorId: contractor.id,
      contractorName: contractor.name,
      contractId: contract.id,
      reasons: [...new Set(reasons)],
    }
  }

  const expectedCost = estimateCost(contract, unit)
  return {
    contractorId: contractor.id,
    contractorName: contractor.name,
    contractId: contract.id,
    pricingModel: contract.pricingModel,
    expectedCost,
    requiresException: contract.pricingModel === 'TIME_AND_EQUIPMENT' && expectedCost == null,
  }
}

function candidatesForContractor(
  contractor: Contractor,
  unit: AllocationUnit,
  scenario: ContractorAllocationScenario
): { feasible: FeasibleAlternative[]; rejected: RejectedAlternative[] } {
  const hardReasons = contractorLevelReasons(contractor, unit, scenario)
  if (hardReasons.length) {
    return {
      feasible: [],
      rejected: [
        {
          contractorId: contractor.id,
          contractorName: contractor.name,
          reasons: hardReasons,
        },
      ],
    }
  }

  const evaluated = contractor.contracts.map((contract) => evaluateContract(contractor, contract, unit, scenario))
  return {
    feasible: evaluated.filter((candidate): candidate is FeasibleAlternative => 'pricingModel' in candidate),
    rejected: evaluated.filter((candidate): candidate is RejectedAlternative => 'reasons' in candidate),
  }
}

export function analyzeAllocationUnit(
  scenario: ContractorAllocationScenario,
  unit: AllocationUnit
): UnitDecisionAnalysis {
  const candidates = scenario.contractors.map((contractor) => candidatesForContractor(contractor, unit, scenario))
  const feasible = candidates.flatMap((candidate) => candidate.feasible)
  const rejected = candidates.flatMap((candidate) => candidate.rejected)
  const costed = feasible.filter(
    (candidate): candidate is CostedCandidate => candidate.expectedCost != null && !candidate.requiresException
  )
  const costedContractors = new Set(costed.map((candidate) => candidate.contractorId))

  let type: UnitDecisionAnalysis['type']
  if (!feasible.length) type = 'INFEASIBLE'
  else if (!costed.length) type = 'EXCEPTION_REQUIRED'
  else if (costedContractors.size === 1) type = 'NO_CHOICE'
  else type = 'ALLOCATION_DECISION_REQUIRED'

  return { unit, type, feasible, rejected }
}

export function analyzeDecisionSpace(scenario: ContractorAllocationScenario) {
  return scenario.units.map((unit) => analyzeAllocationUnit(scenario, unit))
}

function relevantAnalyses(analyses: UnitDecisionAnalysis[]) {
  return analyses.filter(
    (analysis) => analysis.type === 'NO_CHOICE' || analysis.type === 'ALLOCATION_DECISION_REQUIRED'
  )
}

function buildSearchUnits(analyses: UnitDecisionAnalysis[]): SearchUnit[] {
  return relevantAnalyses(analyses)
    .map((analysis) => ({
      analysis,
      candidates: analysis.feasible
        .filter(
          (candidate): candidate is CostedCandidate => candidate.expectedCost != null && !candidate.requiresException
        )
        .sort(
          (left, right) =>
            left.expectedCost - right.expectedCost ||
            left.contractorId.localeCompare(right.contractorId) ||
            left.contractId.localeCompare(right.contractId)
        ),
    }))
    .sort((left, right) => {
      if (left.candidates.length !== right.candidates.length) return left.candidates.length - right.candidates.length
      const leftRegret =
        (left.candidates[1]?.expectedCost ?? left.candidates[0].expectedCost) - left.candidates[0].expectedCost
      const rightRegret =
        (right.candidates[1]?.expectedCost ?? right.candidates[0].expectedCost) - right.candidates[0].expectedCost
      if (Math.abs(leftRegret - rightRegret) > EPSILON) return rightRegret - leftRegret
      const leftDemand = left.analysis.unit.capacityRequirements.reduce((sum, item) => sum + item.demand, 0)
      const rightDemand = right.analysis.unit.capacityRequirements.reduce((sum, item) => sum + item.demand, 0)
      if (Math.abs(leftDemand - rightDemand) > EPSILON) return rightDemand - leftDemand
      return left.analysis.unit.id.localeCompare(right.analysis.unit.id)
    })
}

function buildContractLimits(scenario: ContractorAllocationScenario, units: SearchUnit[]) {
  const relevantContractIds = new Set(units.flatMap((unit) => unit.candidates.map((candidate) => candidate.contractId)))
  const limits = new Map<string, ContractLimit>()

  for (const contractor of scenario.contractors) {
    for (const contract of contractor.contracts) {
      if (!relevantContractIds.has(contract.id)) continue
      limits.set(contract.id, remainingContractLimit(contract))
    }
  }

  return limits
}

function capacityKey(contractorId: string, bucket: string) {
  return `${contractorId}|${bucket}`
}

function buildRemainingCapacity(scenario: ContractorAllocationScenario) {
  const remaining = new Map<string, number>()
  for (const contractor of scenario.contractors) {
    for (const bucket of contractor.capacityBuckets) {
      remaining.set(capacityKey(contractor.id, bucket.bucket), bucket.availableCapacity)
    }
  }
  return remaining
}

function canConsumeCapacity(remaining: Map<string, number>, contractorId: string, unit: AllocationUnit) {
  return unit.capacityRequirements.every(
    (requirement) =>
      (remaining.get(capacityKey(contractorId, requirement.bucket)) ?? Number.NEGATIVE_INFINITY) + EPSILON >=
      requirement.demand
  )
}

function consumeCapacity(
  remaining: Map<string, number>,
  contractorId: string,
  unit: AllocationUnit,
  direction: 1 | -1
) {
  for (const requirement of unit.capacityRequirements) {
    const key = capacityKey(contractorId, requirement.bucket)
    remaining.set(key, (remaining.get(key) ?? 0) - direction * requirement.demand)
  }
}

function stateNumber(value: number) {
  if (!Number.isFinite(value)) return value > 0 ? 'inf' : '-inf'
  return String(value)
}

function computeGapPct(bestCost: number, lowerBound: number) {
  if (!Number.isFinite(bestCost) || !Number.isFinite(lowerBound)) return null
  const denominator = Math.max(Math.abs(bestCost), EPSILON)
  return Math.max(0, ((bestCost - lowerBound) / denominator) * 100)
}

function optimizeDecisionUnits(
  scenario: ContractorAllocationScenario,
  analyses: UnitDecisionAnalysis[],
  options: OptimizerOptions
): SearchResult {
  const units = buildSearchUnits(analyses)
  if (!units.length) {
    return {
      status: 'OPTIMAL',
      selectedByUnit: new Map(),
      totalCost: 0,
      exploredNodes: 0,
      lowerBound: 0,
      optimalityGapPct: 0,
    }
  }
  if (units.some((unit) => !unit.candidates.length)) {
    return {
      status: 'INFEASIBLE',
      selectedByUnit: new Map(),
      totalCost: Number.POSITIVE_INFINITY,
      exploredNodes: 0,
      lowerBound: null,
      optimalityGapPct: null,
    }
  }

  const contractLimits = buildContractLimits(scenario, units)
  const contractIds = [...contractLimits.keys()].sort()
  const remainingCapacity = buildRemainingCapacity(scenario)
  const capacityKeys = [...remainingCapacity.keys()].sort()
  const contractUsedVolume = new Map<string, number>(contractIds.map((contractId) => [contractId, 0]))

  const suffixMinimum = new Array<number>(units.length + 1).fill(0)
  for (let index = units.length - 1; index >= 0; index -= 1) {
    suffixMinimum[index] = suffixMinimum[index + 1] + units[index].candidates[0].expectedCost
  }
  const rootLowerBound = suffixMinimum[0]

  const suffixContractPotential = new Map<string, number[]>()
  for (const contractId of contractIds) {
    const potential = new Array<number>(units.length + 1).fill(0)
    for (let index = units.length - 1; index >= 0; index -= 1) {
      potential[index] =
        potential[index + 1] +
        (units[index].candidates.some((candidate) => candidate.contractId === contractId)
          ? units[index].analysis.unit.contractVolume
          : 0)
    }
    suffixContractPotential.set(contractId, potential)
  }

  const validateContractMinimums = () =>
    contractIds.every((contractId) => {
      const limit = contractLimits.get(contractId)
      return !limit || (contractUsedVolume.get(contractId) ?? 0) + EPSILON >= limit.min
    })

  const cheapestSelection = new Map<string, CostedCandidate>()
  let cheapestCombinationFeasible = true
  for (const searchUnit of units) {
    const candidate = searchUnit.candidates[0]
    const limit = contractLimits.get(candidate.contractId)
    const used = contractUsedVolume.get(candidate.contractId) ?? 0
    if (!canConsumeCapacity(remainingCapacity, candidate.contractorId, searchUnit.analysis.unit)) {
      cheapestCombinationFeasible = false
      break
    }
    if (used + searchUnit.analysis.unit.contractVolume > (limit?.max ?? Number.POSITIVE_INFINITY) + EPSILON) {
      cheapestCombinationFeasible = false
      break
    }
    consumeCapacity(remainingCapacity, candidate.contractorId, searchUnit.analysis.unit, 1)
    contractUsedVolume.set(candidate.contractId, used + searchUnit.analysis.unit.contractVolume)
    cheapestSelection.set(searchUnit.analysis.unit.id, candidate)
  }

  if (cheapestCombinationFeasible && validateContractMinimums()) {
    return {
      status: 'OPTIMAL',
      selectedByUnit: cheapestSelection,
      totalCost: rootLowerBound,
      exploredNodes: units.length,
      lowerBound: rootLowerBound,
      optimalityGapPct: 0,
    }
  }

  remainingCapacity.clear()
  for (const [key, value] of buildRemainingCapacity(scenario)) remainingCapacity.set(key, value)
  contractUsedVolume.clear()
  for (const contractId of contractIds) contractUsedVolume.set(contractId, 0)

  let bestCost = Number.POSITIVE_INFINITY
  let best = new Map<string, CostedCandidate>()
  const selected = new Map<string, CostedCandidate>()
  const bestCostByState = new Map<string, number>()
  let exploredNodes = 0
  let truncated = false
  const maxSearchNodes = Math.max(0, options.maxSearchNodes ?? DEFAULT_MAX_SEARCH_NODES)

  const minimaCanStillBeMet = (index: number) => {
    for (const contractId of contractIds) {
      const limit = contractLimits.get(contractId)
      if (!limit || limit.min <= 0) continue
      const used = contractUsedVolume.get(contractId) ?? 0
      const potential = suffixContractPotential.get(contractId)?.[index] ?? 0
      if (used + potential + EPSILON < limit.min) return false
    }
    return true
  }

  const stateKey = (index: number) =>
    `${index}|${capacityKeys.map((key) => stateNumber(remainingCapacity.get(key) ?? 0)).join(',')}|${contractIds
      .map((id) => stateNumber(contractUsedVolume.get(id) ?? 0))
      .join(',')}`

  const visit = (index: number, cost: number) => {
    if (truncated) return
    exploredNodes += 1
    if (exploredNodes > maxSearchNodes) {
      truncated = true
      return
    }
    if (cost + suffixMinimum[index] >= bestCost - EPSILON) return
    if (!minimaCanStillBeMet(index)) return

    const key = stateKey(index)
    const previousBest = bestCostByState.get(key)
    if (previousBest != null && previousBest <= cost + EPSILON) return
    bestCostByState.set(key, cost)

    if (index === units.length) {
      if (!validateContractMinimums()) return
      bestCost = cost
      best = new Map(selected)
      return
    }

    const searchUnit = units[index]
    for (const candidate of searchUnit.candidates) {
      if (!canConsumeCapacity(remainingCapacity, candidate.contractorId, searchUnit.analysis.unit)) continue

      const limit = contractLimits.get(candidate.contractId)
      const currentVolume = contractUsedVolume.get(candidate.contractId) ?? 0
      if (
        currentVolume + searchUnit.analysis.unit.contractVolume >
        (limit?.max ?? Number.POSITIVE_INFINITY) + EPSILON
      ) {
        continue
      }

      consumeCapacity(remainingCapacity, candidate.contractorId, searchUnit.analysis.unit, 1)
      contractUsedVolume.set(candidate.contractId, currentVolume + searchUnit.analysis.unit.contractVolume)
      selected.set(searchUnit.analysis.unit.id, candidate)

      visit(index + 1, cost + candidate.expectedCost)

      selected.delete(searchUnit.analysis.unit.id)
      contractUsedVolume.set(candidate.contractId, currentVolume)
      consumeCapacity(remainingCapacity, candidate.contractorId, searchUnit.analysis.unit, -1)
    }
  }

  visit(0, 0)

  if (truncated) {
    if (Number.isFinite(bestCost)) {
      return {
        status: 'FEASIBLE_NOT_PROVEN',
        selectedByUnit: best,
        totalCost: bestCost,
        exploredNodes,
        lowerBound: rootLowerBound,
        optimalityGapPct: computeGapPct(bestCost, rootLowerBound),
      }
    }
    return {
      status: 'UNKNOWN',
      selectedByUnit: new Map(),
      totalCost: Number.POSITIVE_INFINITY,
      exploredNodes,
      lowerBound: rootLowerBound,
      optimalityGapPct: null,
    }
  }

  if (!Number.isFinite(bestCost)) {
    return {
      status: 'INFEASIBLE',
      selectedByUnit: new Map(),
      totalCost: Number.POSITIVE_INFINITY,
      exploredNodes,
      lowerBound: null,
      optimalityGapPct: null,
    }
  }

  return {
    status: 'OPTIMAL',
    selectedByUnit: best,
    totalCost: bestCost,
    exploredNodes,
    lowerBound: bestCost,
    optimalityGapPct: 0,
  }
}

function observedCandidate(analysis: UnitDecisionAnalysis) {
  if (!analysis.unit.observedContractorId) return undefined
  const costed = analysis.feasible.filter(
    (candidate): candidate is CostedCandidate =>
      candidate.expectedCost != null &&
      !candidate.requiresException &&
      candidate.contractorId === analysis.unit.observedContractorId
  )

  if (analysis.unit.observedContractId) {
    return costed.find((candidate) => candidate.contractId === analysis.unit.observedContractId)
  }

  return costed.length === 1 ? costed[0] : undefined
}

function validateObservedPortfolio(scenario: ContractorAllocationScenario, analyses: UnitDecisionAnalysis[]) {
  const invalid = new Set<string>()
  const capacityUsage = new Map<string, { total: number; unitIds: string[] }>()
  const contractUsage = new Map<string, { total: number; unitIds: string[] }>()
  const contractById = new Map<string, ContractorContract>()
  for (const contractor of scenario.contractors) {
    for (const contract of contractor.contracts) contractById.set(contract.id, contract)
  }

  for (const analysis of relevantAnalyses(analyses)) {
    const candidate = observedCandidate(analysis)
    if (!candidate) {
      invalid.add(analysis.unit.id)
      continue
    }
    for (const requirement of analysis.unit.capacityRequirements) {
      const key = capacityKey(candidate.contractorId, requirement.bucket)
      const entry = capacityUsage.get(key) ?? { total: 0, unitIds: [] }
      entry.total += requirement.demand
      entry.unitIds.push(analysis.unit.id)
      capacityUsage.set(key, entry)
    }
    const volume = contractUsage.get(candidate.contractId) ?? { total: 0, unitIds: [] }
    volume.total += analysis.unit.contractVolume
    volume.unitIds.push(analysis.unit.id)
    contractUsage.set(candidate.contractId, volume)
  }

  const availableCapacity = buildRemainingCapacity(scenario)
  for (const [key, usage] of capacityUsage) {
    if (usage.total > (availableCapacity.get(key) ?? 0) + EPSILON) {
      usage.unitIds.forEach((unitId) => invalid.add(unitId))
    }
  }

  for (const [contractId, usage] of contractUsage) {
    const contract = contractById.get(contractId)
    if (!contract) {
      usage.unitIds.forEach((unitId) => invalid.add(unitId))
      continue
    }
    const limit = remainingContractLimit(contract)
    if (usage.total > limit.max + EPSILON || usage.total + EPSILON < limit.min) {
      usage.unitIds.forEach((unitId) => invalid.add(unitId))
    }
  }

  return [...invalid].sort()
}

function decisionSpaceMetrics(analyses: UnitDecisionAnalysis[]): DecisionSpaceMetrics {
  let spendWithChoice = 0
  let spreadWeighted = 0
  let spreadWeight = 0

  for (const analysis of analyses) {
    if (analysis.type !== 'ALLOCATION_DECISION_REQUIRED') continue
    const observed = observedCandidate(analysis)
    if (!observed) continue

    const cheapestByContractor = new Map<string, number>()
    for (const candidate of analysis.feasible) {
      if (candidate.expectedCost == null || candidate.requiresException) continue
      const existing = cheapestByContractor.get(candidate.contractorId)
      if (existing == null || candidate.expectedCost < existing) {
        cheapestByContractor.set(candidate.contractorId, candidate.expectedCost)
      }
    }
    const costs = [...cheapestByContractor.values()]
    if (costs.length < 2) continue

    const minimum = Math.min(...costs)
    const maximum = Math.max(...costs)
    const spread = minimum > 0 ? (maximum - minimum) / minimum : 0
    spendWithChoice += observed.expectedCost
    spreadWeighted += observed.expectedCost * spread
    spreadWeight += observed.expectedCost
  }

  const totalUnits = analyses.length
  const decisionUnits = analyses.filter((analysis) => analysis.type === 'ALLOCATION_DECISION_REQUIRED').length
  return {
    totalUnits,
    infeasibleUnits: analyses.filter((analysis) => analysis.type === 'INFEASIBLE').length,
    noChoiceUnits: analyses.filter((analysis) => analysis.type === 'NO_CHOICE').length,
    decisionUnits,
    exceptionUnits: analyses.filter((analysis) => analysis.type === 'EXCEPTION_REQUIRED').length,
    decisionSpaceRatio: totalUnits ? decisionUnits / totalUnits : 0,
    spendWithChoice,
    weightedChoiceSpreadPct: spreadWeight ? (spreadWeighted / spreadWeight) * 100 : 0,
  }
}

export function optimizeContractorAllocation(
  scenario: ContractorAllocationScenario,
  options: OptimizerOptions = {}
): ContractorAllocationResult {
  const scenarioSnapshot = createScenarioInputSnapshot(scenario)
  const analyses = analyzeDecisionSpace(scenario)
  const search = optimizeDecisionUnits(scenario, analyses, options)
  const assignments: AllocationAssignment[] = []
  const unresolvedUnitIds = analyses
    .filter((analysis) => analysis.type === 'INFEASIBLE' || analysis.type === 'EXCEPTION_REQUIRED')
    .map((analysis) => analysis.unit.id)

  if (search.status === 'OPTIMAL' || search.status === 'FEASIBLE_NOT_PROVEN') {
    for (const analysis of relevantAnalyses(analyses)) {
      const selected = search.selectedByUnit.get(analysis.unit.id)
      if (!selected) continue
      const observed = observedCandidate(analysis)
      assignments.push({
        allocationUnitId: analysis.unit.id,
        contractorId: selected.contractorId,
        contractorName: selected.contractorName,
        contractId: selected.contractId,
        expectedCost: selected.expectedCost,
        observedContractorId: analysis.unit.observedContractorId,
        observedContractId: analysis.unit.observedContractId,
        observedExpectedCost: observed?.expectedCost,
        expectedDelta: observed ? observed.expectedCost - selected.expectedCost : undefined,
        inputSnapshotId: scenarioSnapshot.id,
      })
    }
  }

  const comparable = relevantAnalyses(analyses)
  const observedInvalidUnitIds = validateObservedPortfolio(scenario, analyses)
  const observedExpectedSpend = comparable.reduce(
    (sum, analysis) => sum + (observedCandidate(analysis)?.expectedCost ?? 0),
    0
  )
  const qdipExpectedSpend = assignments.reduce((sum, assignment) => sum + assignment.expectedCost, 0)
  const counterfactualAllocationAdvantage =
    search.status === 'OPTIMAL' && !observedInvalidUnitIds.length && assignments.length === comparable.length
      ? observedExpectedSpend - qdipExpectedSpend
      : null

  return {
    scenarioId: scenario.id,
    optimizerVersion: CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION,
    status: search.status,
    analyses,
    assignments: assignments.sort((left, right) => left.allocationUnitId.localeCompare(right.allocationUnitId)),
    unresolvedUnitIds,
    observedInvalidUnitIds,
    observedExpectedSpend,
    qdipExpectedSpend,
    counterfactualAllocationAdvantage,
    metrics: decisionSpaceMetrics(analyses),
    exploredNodes: search.exploredNodes,
    lowerBound: search.lowerBound,
    optimalityGapPct: search.optimalityGapPct,
    scenarioSnapshot,
  }
}
