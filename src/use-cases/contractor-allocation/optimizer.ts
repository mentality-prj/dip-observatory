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
  UnitDecisionAnalysis,
} from './domain'

export const CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION = 'contractor-allocation/1'
const MAX_SEARCH_NODES = 250_000

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

function reject(contractor: Contractor, reasons: FeasibilityReason[]) {
  return {
    contractorId: contractor.id,
    contractorName: contractor.name,
    reasons: [...new Set(reasons)],
  }
}

function candidateForContractor(
  contractor: Contractor,
  unit: AllocationUnit,
  scenario: ContractorAllocationScenario
): UnitDecisionAnalysis['feasible'][number] | UnitDecisionAnalysis['rejected'][number] {
  const reasons: FeasibilityReason[] = []
  const approved = contractor.contracts.filter((contract) => contract.approved)
  if (!approved.length) reasons.push('NOT_APPROVED')

  const active = approved.filter((contract) => isActive(contract, scenario.asOf))
  if (approved.length && !active.length) reasons.push('CONTRACT_EXPIRED')

  const inTerritory = active.filter((contract) => contract.territories.includes(unit.territory))
  if (active.length && !inTerritory.length) reasons.push('TERRITORY_NOT_ALLOWED')

  const forWorkType = inTerritory.filter((contract) => contract.workTypes.includes(unit.workType))
  if (inTerritory.length && !forWorkType.length) reasons.push('WORK_TYPE_NOT_ALLOWED')

  if (contractor.availableCapacity <= 0) reasons.push('NO_CAPACITY')
  if (contractor.availableThrough < unit.deadline) reasons.push('SLA_IMPOSSIBLE')
  if (!includesAll(contractor.equipment, unit.requiredEquipment)) reasons.push('MISSING_EQUIPMENT')
  if (!includesAll(contractor.certifications, unit.requiredCertifications)) reasons.push('MISSING_CERTIFICATION')

  const withVolume = forWorkType.filter(
    (contract) =>
      (contract.maxVolume ?? Number.POSITIVE_INFINITY) > 0 && (contract.awardedCapacity ?? Number.POSITIVE_INFINITY) > 0
  )
  if (forWorkType.length && !withVolume.length) reasons.push('CONTRACT_VOLUME_LIMIT')

  if (reasons.length) return reject(contractor, reasons)

  const costed = withVolume
    .map((contract) => ({ contract, cost: estimateCost(contract, unit) }))
    .filter(({ contract }) => matchingRate(contract, unit) != null)

  if (!costed.length) return reject(contractor, ['RATE_NOT_CONFIGURED'])

  const known = costed
    .filter((item): item is { contract: ContractorContract; cost: number } => item.cost != null)
    .sort((a, b) => a.cost - b.cost || a.contract.id.localeCompare(b.contract.id))

  if (known.length) {
    const selected = known[0]
    return {
      contractorId: contractor.id,
      contractorName: contractor.name,
      contractId: selected.contract.id,
      pricingModel: selected.contract.pricingModel,
      expectedCost: selected.cost,
      requiresException: false,
    }
  }

  const fallback = costed.sort((a, b) => a.contract.id.localeCompare(b.contract.id))[0]
  return {
    contractorId: contractor.id,
    contractorName: contractor.name,
    contractId: fallback.contract.id,
    pricingModel: fallback.contract.pricingModel,
    expectedCost: null,
    requiresException: true,
  }
}

export function analyzeAllocationUnit(
  scenario: ContractorAllocationScenario,
  unit: AllocationUnit
): UnitDecisionAnalysis {
  const candidates = scenario.contractors.map((contractor) => candidateForContractor(contractor, unit, scenario))
  const feasible = candidates.filter((candidate): candidate is FeasibleAlternative => 'contractId' in candidate)
  const rejected = candidates.filter(
    (candidate): candidate is UnitDecisionAnalysis['rejected'][number] => 'reasons' in candidate
  )

  let type: UnitDecisionAnalysis['type']
  if (!feasible.length) type = 'INFEASIBLE'
  else if (feasible.some((candidate) => candidate.requiresException || candidate.expectedCost == null))
    type = 'EXCEPTION_REQUIRED'
  else if (feasible.length === 1) type = 'NO_CHOICE'
  else type = 'ALLOCATION_DECISION_REQUIRED'

  return { unit, type, feasible, rejected }
}

export function analyzeDecisionSpace(scenario: ContractorAllocationScenario) {
  return scenario.units.map((unit) => analyzeAllocationUnit(scenario, unit))
}

function contractLimit(contract: ContractorContract) {
  return Math.min(contract.maxVolume ?? Number.POSITIVE_INFINITY, contract.awardedCapacity ?? Number.POSITIVE_INFINITY)
}

function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `ca-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function snapshotId(
  scenario: ContractorAllocationScenario,
  analysis: UnitDecisionAnalysis,
  selected: FeasibleAlternative
) {
  const alternatives = analysis.feasible
    .map((candidate) => `${candidate.contractorId}:${candidate.contractId}:${candidate.expectedCost ?? 'exception'}`)
    .sort()
    .join('|')
  return stableHash(
    `${scenario.id}|${scenario.asOf}|${analysis.unit.id}|${analysis.unit.scopeVersion}|${selected.contractorId}|${alternatives}`
  )
}

type ContractLimit = { min: number; max: number }
type SearchUnit = { analysis: UnitDecisionAnalysis; candidates: (FeasibleAlternative & { expectedCost: number })[] }

type SearchResult = {
  status: ContractorAllocationResult['status']
  selectedByUnit: Map<string, FeasibleAlternative & { expectedCost: number }>
  totalCost: number
  exploredNodes: number
}

function optimizeDecisionUnits(
  scenario: ContractorAllocationScenario,
  fixed: (FeasibleAlternative & { expectedCost: number; unitId: string })[],
  decisionAnalyses: UnitDecisionAnalysis[]
): SearchResult {
  const contractorCapacity = new Map(
    scenario.contractors.map((contractor) => [contractor.id, contractor.availableCapacity])
  )
  const relevantContractIds = new Set([
    ...fixed.map((assignment) => assignment.contractId),
    ...decisionAnalyses.flatMap((analysis) =>
      analysis.feasible.filter((candidate) => candidate.expectedCost != null).map((candidate) => candidate.contractId)
    ),
  ])
  const contractLimits = new Map<string, ContractLimit>()

  for (const contractor of scenario.contractors) {
    for (const contract of contractor.contracts) {
      if (!relevantContractIds.has(contract.id) || !contract.approved || !isActive(contract, scenario.asOf)) continue
      contractLimits.set(contract.id, { min: contract.minVolume ?? 0, max: contractLimit(contract) })
    }
  }

  const contractorCounts = new Map<string, number>()
  const contractCounts = new Map<string, number>()
  let fixedCost = 0

  for (const assignment of fixed) {
    contractorCounts.set(assignment.contractorId, (contractorCounts.get(assignment.contractorId) ?? 0) + 1)
    contractCounts.set(assignment.contractId, (contractCounts.get(assignment.contractId) ?? 0) + 1)
    fixedCost += assignment.expectedCost
  }

  for (const [contractorId, count] of contractorCounts) {
    if (count > (contractorCapacity.get(contractorId) ?? 0)) {
      return { status: 'INFEASIBLE', selectedByUnit: new Map(), totalCost: Number.POSITIVE_INFINITY, exploredNodes: 0 }
    }
  }
  for (const [contractId, count] of contractCounts) {
    if (count > (contractLimits.get(contractId)?.max ?? Number.POSITIVE_INFINITY)) {
      return { status: 'INFEASIBLE', selectedByUnit: new Map(), totalCost: Number.POSITIVE_INFINITY, exploredNodes: 0 }
    }
  }

  const units: SearchUnit[] = decisionAnalyses
    .map((analysis) => {
      const candidates = analysis.feasible
        .filter(
          (candidate): candidate is FeasibleAlternative & { expectedCost: number } => candidate.expectedCost != null
        )
        .sort((a, b) => a.expectedCost - b.expectedCost || a.contractorId.localeCompare(b.contractorId))
      return { analysis, candidates }
    })
    .sort((a, b) => {
      if (a.candidates.length !== b.candidates.length) return a.candidates.length - b.candidates.length
      const aRegret = (a.candidates[1]?.expectedCost ?? a.candidates[0].expectedCost) - a.candidates[0].expectedCost
      const bRegret = (b.candidates[1]?.expectedCost ?? b.candidates[0].expectedCost) - b.candidates[0].expectedCost
      return bRegret - aRegret || a.analysis.unit.id.localeCompare(b.analysis.unit.id)
    })

  const suffixMinimum = new Array<number>(units.length + 1).fill(0)
  for (let index = units.length - 1; index >= 0; index -= 1) {
    suffixMinimum[index] = suffixMinimum[index + 1] + units[index].candidates[0].expectedCost
  }

  const searchContractIds = [
    ...new Set(units.flatMap((unit) => unit.candidates.map((candidate) => candidate.contractId))),
  ]
  const suffixPotential = new Map<string, number[]>()
  for (const contractId of searchContractIds) {
    const values = new Array<number>(units.length + 1).fill(0)
    for (let index = units.length - 1; index >= 0; index -= 1) {
      values[index] =
        values[index + 1] + (units[index].candidates.some((candidate) => candidate.contractId === contractId) ? 1 : 0)
    }
    suffixPotential.set(contractId, values)
  }

  const remainingCapacity = new Map<string, number>()
  for (const [contractorId, capacity] of contractorCapacity) {
    remainingCapacity.set(contractorId, capacity - (contractorCounts.get(contractorId) ?? 0))
  }

  let bestCost = Number.POSITIVE_INFINITY
  let best = new Map<string, FeasibleAlternative & { expectedCost: number }>()
  const selected = new Map<string, FeasibleAlternative & { expectedCost: number }>()
  let exploredNodes = 0
  let truncated = false
  const bestCostByState = new Map<string, number>()
  const contractorIds = [...contractorCapacity.keys()].sort()
  const contractIds = [...contractLimits.keys()].sort()

  const minimaRemainFeasible = (index: number) => {
    for (const [contractId, limit] of contractLimits) {
      if (limit.min <= 0) continue
      const current = contractCounts.get(contractId) ?? 0
      const possible = suffixPotential.get(contractId)?.[index] ?? 0
      if (current + possible < limit.min) return false
    }
    return true
  }

  const stateKey = (index: number) =>
    `${index}|${contractorIds.map((id) => remainingCapacity.get(id) ?? 0).join(',')}|${contractIds
      .map((id) => contractCounts.get(id) ?? 0)
      .join(',')}`

  const visit = (index: number, cost: number) => {
    if (truncated) return
    exploredNodes += 1
    if (exploredNodes > MAX_SEARCH_NODES) {
      truncated = true
      return
    }
    if (cost + suffixMinimum[index] >= bestCost) return
    if (!minimaRemainFeasible(index)) return

    const key = stateKey(index)
    const previousBest = bestCostByState.get(key)
    if (previousBest != null && previousBest <= cost) return
    bestCostByState.set(key, cost)

    if (index === units.length) {
      for (const [contractId, limit] of contractLimits) {
        if ((contractCounts.get(contractId) ?? 0) < limit.min) return
      }
      bestCost = cost
      best = new Map(selected)
      return
    }

    const searchUnit = units[index]
    for (const candidate of searchUnit.candidates) {
      const capacity = remainingCapacity.get(candidate.contractorId) ?? 0
      if (capacity <= 0) continue
      const limit = contractLimits.get(candidate.contractId)
      const currentContractCount = contractCounts.get(candidate.contractId) ?? 0
      if (currentContractCount >= (limit?.max ?? Number.POSITIVE_INFINITY)) continue

      remainingCapacity.set(candidate.contractorId, capacity - 1)
      contractCounts.set(candidate.contractId, currentContractCount + 1)
      selected.set(searchUnit.analysis.unit.id, candidate)

      visit(index + 1, cost + candidate.expectedCost)

      selected.delete(searchUnit.analysis.unit.id)
      contractCounts.set(candidate.contractId, currentContractCount)
      remainingCapacity.set(candidate.contractorId, capacity)
    }
  }

  visit(0, fixedCost)

  if (!Number.isFinite(bestCost)) {
    return { status: 'INFEASIBLE', selectedByUnit: new Map(), totalCost: bestCost, exploredNodes }
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
  return analysis.feasible.find(
    (candidate) => candidate.contractorId === analysis.unit.observedContractorId && candidate.expectedCost != null
  ) as (FeasibleAlternative & { expectedCost: number }) | undefined
}

function decisionSpaceMetrics(analyses: UnitDecisionAnalysis[]): DecisionSpaceMetrics {
  let spendWithChoice = 0
  let spreadWeighted = 0
  let spreadWeight = 0

  for (const analysis of analyses) {
    if (analysis.type !== 'ALLOCATION_DECISION_REQUIRED') continue
    const costs = analysis.feasible
      .map((candidate) => candidate.expectedCost)
      .filter((cost): cost is number => cost != null)
    if (costs.length < 2) continue
    const baseline = observedCandidate(analysis)
    if (!baseline) continue
    const minimum = Math.min(...costs)
    const maximum = Math.max(...costs)
    const spread = minimum > 0 ? (maximum - minimum) / minimum : 0
    spendWithChoice += baseline.expectedCost
    spreadWeighted += baseline.expectedCost * spread
    spreadWeight += baseline.expectedCost
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
  const fixed = analyses
    .filter((analysis) => analysis.type === 'NO_CHOICE')
    .map((analysis) => {
      const candidate = analysis.feasible[0]
      if (candidate.expectedCost == null)
        throw new Error(`NO_CHOICE unit ${analysis.unit.id} is missing an expected cost.`)
      return { ...candidate, expectedCost: candidate.expectedCost, unitId: analysis.unit.id }
    })
  const decisions = analyses.filter((analysis) => analysis.type === 'ALLOCATION_DECISION_REQUIRED')
  const search = optimizeDecisionUnits(scenario, fixed, decisions)
  const assignments: AllocationAssignment[] = []
  const unresolvedUnitIds = analyses
    .filter((analysis) => analysis.type === 'INFEASIBLE' || analysis.type === 'EXCEPTION_REQUIRED')
    .map((analysis) => analysis.unit.id)

  if (search.status !== 'INFEASIBLE') {
    for (const analysis of analyses) {
      let selected: (FeasibleAlternative & { expectedCost: number }) | undefined
      if (analysis.type === 'NO_CHOICE') {
        const candidate = analysis.feasible[0]
        if (candidate.expectedCost != null) selected = { ...candidate, expectedCost: candidate.expectedCost }
      } else if (analysis.type === 'ALLOCATION_DECISION_REQUIRED') {
        selected = search.selectedByUnit.get(analysis.unit.id)
      }
      if (!selected) continue

      const observed = observedCandidate(analysis)
      assignments.push({
        allocationUnitId: analysis.unit.id,
        contractorId: selected.contractorId,
        contractorName: selected.contractorName,
        contractId: selected.contractId,
        expectedCost: selected.expectedCost,
        observedContractorId: analysis.unit.observedContractorId,
        observedExpectedCost: observed?.expectedCost,
        expectedDelta: observed ? observed.expectedCost - selected.expectedCost : undefined,
        inputSnapshotId: snapshotId(scenario, analysis, selected),
      })
    }
  }

  const comparable = analyses.filter(
    (analysis) => analysis.type === 'NO_CHOICE' || analysis.type === 'ALLOCATION_DECISION_REQUIRED'
  )
  const observedInvalidUnitIds = comparable
    .filter((analysis) => !observedCandidate(analysis))
    .map((analysis) => analysis.unit.id)
  const observedExpectedSpend = comparable.reduce(
    (sum, analysis) => sum + (observedCandidate(analysis)?.expectedCost ?? 0),
    0
  )
  const qdipExpectedSpend = assignments.reduce((sum, assignment) => sum + assignment.expectedCost, 0)
  const counterfactualAllocationAdvantage =
    search.status === 'INFEASIBLE' || observedInvalidUnitIds.length ? null : observedExpectedSpend - qdipExpectedSpend

  return {
    scenarioId: scenario.id,
    optimizerVersion: CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION,
    status: search.status,
    analyses,
    assignments: assignments.sort((a, b) => a.allocationUnitId.localeCompare(b.allocationUnitId)),
    unresolvedUnitIds,
    observedInvalidUnitIds,
    observedExpectedSpend,
    qdipExpectedSpend,
    counterfactualAllocationAdvantage,
    metrics: decisionSpaceMetrics(analyses),
    exploredNodes: search.exploredNodes,
  }
}
