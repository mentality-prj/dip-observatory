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
  RejectedAlternative,
  UnitDecisionAnalysis,
} from './domain'
import { createAllocationInputSnapshot } from './snapshot'

export const CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION = 'contractor-allocation/4'
const MAX_SEARCH_NODES = 750_000
const EPSILON = 1e-9

type CostedCandidate = FeasibleAlternative & { expectedCost: number }
type ContractLimit = { min: number; max: number }
type SearchUnit = {
  analysis: UnitDecisionAnalysis
  candidates: CostedCandidate[]
}

type SearchResult = {
  status: ContractorAllocationResult['status']
  selectedByUnit: Map<string, CostedCandidate>
  totalCost: number
  exploredNodes: number
}

function includesAll(available: string[], required: string[]) {
  return required.every((value) => available.includes(value))
}

function isActive(contract: ContractorContract, asOf: string) {
  return contract.validFrom <= asOf && asOf <= contract.validTo
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

function contractVolumeLimit(contract: ContractorContract) {
  return Math.min(contract.maxVolume ?? Number.POSITIVE_INFINITY, contract.awardedCapacity ?? Number.POSITIVE_INFINITY)
}

function contractorLevelReasons(contractor: Contractor, unit: AllocationUnit): FeasibilityReason[] {
  const reasons: FeasibilityReason[] = []
  if (contractor.availableCapacity + EPSILON < unit.capacityDemand) reasons.push('NO_CAPACITY')
  if (contractor.availableThrough < unit.deadline) reasons.push('SLA_IMPOSSIBLE')
  if (!includesAll(contractor.equipment, unit.requiredEquipment)) reasons.push('MISSING_EQUIPMENT')
  if (!includesAll(contractor.certifications, unit.requiredCertifications)) reasons.push('MISSING_CERTIFICATION')
  return reasons
}

function evaluateContract(
  contractor: Contractor,
  contract: ContractorContract,
  unit: AllocationUnit,
  scenario: ContractorAllocationScenario
): FeasibleAlternative | RejectedAlternative {
  const reasons: FeasibilityReason[] = []
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
  if (contractVolumeLimit(contract) + EPSILON < unit.contractVolume) reasons.push('CONTRACT_VOLUME_LIMIT')

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
  const hardReasons = contractorLevelReasons(contractor, unit)
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
      if (Math.abs(left.analysis.unit.capacityDemand - right.analysis.unit.capacityDemand) > EPSILON) {
        return right.analysis.unit.capacityDemand - left.analysis.unit.capacityDemand
      }
      return left.analysis.unit.id.localeCompare(right.analysis.unit.id)
    })
}

function buildContractLimits(scenario: ContractorAllocationScenario, units: SearchUnit[]) {
  const relevantContractIds = new Set(units.flatMap((unit) => unit.candidates.map((candidate) => candidate.contractId)))
  const limits = new Map<string, ContractLimit>()

  for (const contractor of scenario.contractors) {
    for (const contract of contractor.contracts) {
      if (!relevantContractIds.has(contract.id)) continue
      limits.set(contract.id, {
        min: contract.minVolume ?? 0,
        max: contractVolumeLimit(contract),
      })
    }
  }

  return limits
}

function numericState(value: number) {
  if (!Number.isFinite(value)) return 'inf'
  return Number(value.toFixed(6)).toString()
}

function optimizeDecisionUnits(scenario: ContractorAllocationScenario, analyses: UnitDecisionAnalysis[]): SearchResult {
  const units = buildSearchUnits(analyses)
  if (!units.length) {
    return { status: 'OPTIMAL', selectedByUnit: new Map(), totalCost: 0, exploredNodes: 0 }
  }
  if (units.some((unit) => !unit.candidates.length)) {
    return {
      status: 'INFEASIBLE',
      selectedByUnit: new Map(),
      totalCost: Number.POSITIVE_INFINITY,
      exploredNodes: 0,
    }
  }

  const contractorIds = [
    ...new Set(units.flatMap((unit) => unit.candidates.map((candidate) => candidate.contractorId))),
  ].sort()
  const contractLimits = buildContractLimits(scenario, units)
  const contractIds = [...contractLimits.keys()].sort()
  const remainingCapacity = new Map(
    scenario.contractors.map((contractor) => [contractor.id, contractor.availableCapacity])
  )
  const contractUsedVolume = new Map<string, number>(contractIds.map((contractId) => [contractId, 0]))

  const suffixMinimum = new Array<number>(units.length + 1).fill(0)
  for (let index = units.length - 1; index >= 0; index -= 1) {
    suffixMinimum[index] = suffixMinimum[index + 1] + units[index].candidates[0].expectedCost
  }

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

  const suffixCapacityDemand = new Array<number>(units.length + 1).fill(0)
  for (let index = units.length - 1; index >= 0; index -= 1) {
    suffixCapacityDemand[index] = suffixCapacityDemand[index + 1] + units[index].analysis.unit.capacityDemand
  }

  let bestCost = Number.POSITIVE_INFINITY
  let best = new Map<string, CostedCandidate>()
  const selected = new Map<string, CostedCandidate>()
  const bestCostByState = new Map<string, number>()
  let exploredNodes = 0
  let truncated = false

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

  const totalCapacityCanCoverRemainder = (index: number) => {
    const capacity = contractorIds.reduce((sum, contractorId) => sum + (remainingCapacity.get(contractorId) ?? 0), 0)
    return capacity + EPSILON >= suffixCapacityDemand[index]
  }

  const stateKey = (index: number) =>
    `${index}|${contractorIds.map((id) => numericState(remainingCapacity.get(id) ?? 0)).join(',')}|${contractIds
      .map((id) => numericState(contractUsedVolume.get(id) ?? 0))
      .join(',')}`

  const visit = (index: number, cost: number) => {
    if (truncated) return
    exploredNodes += 1
    if (exploredNodes > MAX_SEARCH_NODES) {
      truncated = true
      return
    }
    if (cost + suffixMinimum[index] >= bestCost - EPSILON) return
    if (!minimaCanStillBeMet(index)) return
    if (!totalCapacityCanCoverRemainder(index)) return

    const key = stateKey(index)
    const previousBest = bestCostByState.get(key)
    if (previousBest != null && previousBest <= cost + EPSILON) return
    bestCostByState.set(key, cost)

    if (index === units.length) {
      for (const contractId of contractIds) {
        const limit = contractLimits.get(contractId)
        const used = contractUsedVolume.get(contractId) ?? 0
        if (limit && used + EPSILON < limit.min) return
      }
      bestCost = cost
      best = new Map(selected)
      return
    }

    const searchUnit = units[index]
    const { capacityDemand, contractVolume } = searchUnit.analysis.unit

    for (const candidate of searchUnit.candidates) {
      const capacity = remainingCapacity.get(candidate.contractorId) ?? 0
      if (capacity + EPSILON < capacityDemand) continue

      const limit = contractLimits.get(candidate.contractId)
      const currentVolume = contractUsedVolume.get(candidate.contractId) ?? 0
      if (currentVolume + contractVolume > (limit?.max ?? Number.POSITIVE_INFINITY) + EPSILON) continue

      remainingCapacity.set(candidate.contractorId, capacity - capacityDemand)
      contractUsedVolume.set(candidate.contractId, currentVolume + contractVolume)
      selected.set(searchUnit.analysis.unit.id, candidate)

      visit(index + 1, cost + candidate.expectedCost)

      selected.delete(searchUnit.analysis.unit.id)
      contractUsedVolume.set(candidate.contractId, currentVolume)
      remainingCapacity.set(candidate.contractorId, capacity)
    }
  }

  visit(0, 0)

  if (!Number.isFinite(bestCost)) {
    return {
      status: truncated ? 'BOUNDED' : 'INFEASIBLE',
      selectedByUnit: best,
      totalCost: bestCost,
      exploredNodes,
    }
  }

  return {
    status: truncated ? 'BOUNDED' : 'OPTIMAL',
    selectedByUnit: best,
    totalCost: bestCost,
    exploredNodes,
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

export function optimizeContractorAllocation(scenario: ContractorAllocationScenario): ContractorAllocationResult {
  const analyses = analyzeDecisionSpace(scenario)
  const search = optimizeDecisionUnits(scenario, analyses)
  const assignments: AllocationAssignment[] = []
  const unresolvedUnitIds = analyses
    .filter((analysis) => analysis.type === 'INFEASIBLE' || analysis.type === 'EXCEPTION_REQUIRED')
    .map((analysis) => analysis.unit.id)

  if (search.status !== 'INFEASIBLE') {
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
        inputSnapshot: createAllocationInputSnapshot(scenario, analysis),
      })
    }
  }

  const comparable = relevantAnalyses(analyses)
  const observedInvalidUnitIds = comparable
    .filter((analysis) => !observedCandidate(analysis))
    .map((analysis) => analysis.unit.id)
  const observedExpectedSpend = comparable.reduce(
    (sum, analysis) => sum + (observedCandidate(analysis)?.expectedCost ?? 0),
    0
  )
  const qdipExpectedSpend = assignments.reduce((sum, assignment) => sum + assignment.expectedCost, 0)
  const counterfactualAllocationAdvantage =
    search.status === 'INFEASIBLE' || observedInvalidUnitIds.length || assignments.length !== comparable.length
      ? null
      : observedExpectedSpend - qdipExpectedSpend

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
  }
}
