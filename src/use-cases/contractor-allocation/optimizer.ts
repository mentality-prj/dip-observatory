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

export const CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION = 'contractor-allocation/3'

type CostedCandidate = FeasibleAlternative & { expectedCost: number }
type FixedAssignment = CostedCandidate & { unitId: string }
type ContractLimit = { min: number; max: number }
type SearchUnit = { analysis: UnitDecisionAnalysis; candidates: CostedCandidate[] }

type SearchResult = {
  status: ContractorAllocationResult['status']
  selectedByUnit: Map<string, CostedCandidate>
  totalCost: number
  exploredNodes: number
}

type FlowEdge = {
  to: number
  rev: number
  cap: number
  cost: number
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

function buildSearchUnits(decisionAnalyses: UnitDecisionAnalysis[]): SearchUnit[] {
  return decisionAnalyses
    .map((analysis) => ({
      analysis,
      candidates: analysis.feasible
        .filter((candidate): candidate is CostedCandidate => candidate.expectedCost != null)
        .sort((a, b) => a.expectedCost - b.expectedCost || a.contractorId.localeCompare(b.contractorId)),
    }))
    .sort((a, b) => a.analysis.unit.id.localeCompare(b.analysis.unit.id))
}

function buildContractLimits(scenario: ContractorAllocationScenario, fixed: FixedAssignment[], units: SearchUnit[]) {
  const relevantContractIds = new Set([
    ...fixed.map((assignment) => assignment.contractId),
    ...units.flatMap((unit) => unit.candidates.map((candidate) => candidate.contractId)),
  ])
  const limits = new Map<string, ContractLimit>()
  const owners = new Map<string, string>()

  for (const contractor of scenario.contractors) {
    for (const contract of contractor.contracts) {
      if (!relevantContractIds.has(contract.id) || !contract.approved || !isActive(contract, scenario.asOf)) continue
      limits.set(contract.id, { min: contract.minVolume ?? 0, max: contractLimit(contract) })
      owners.set(contract.id, contractor.id)
    }
  }

  return { limits, owners }
}

function fixedState(
  scenario: ContractorAllocationScenario,
  fixed: FixedAssignment[],
  contractLimits: Map<string, ContractLimit>
) {
  const contractorCapacity = new Map(
    scenario.contractors.map((contractor) => [contractor.id, contractor.availableCapacity])
  )
  const contractorCounts = new Map<string, number>()
  const contractCounts = new Map<string, number>()
  let fixedCost = 0

  for (const assignment of fixed) {
    contractorCounts.set(assignment.contractorId, (contractorCounts.get(assignment.contractorId) ?? 0) + 1)
    contractCounts.set(assignment.contractId, (contractCounts.get(assignment.contractId) ?? 0) + 1)
    fixedCost += assignment.expectedCost
  }

  for (const [contractorId, count] of contractorCounts) {
    if (count > (contractorCapacity.get(contractorId) ?? 0)) return null
  }
  for (const [contractId, count] of contractCounts) {
    if (count > (contractLimits.get(contractId)?.max ?? Number.POSITIVE_INFINITY)) return null
  }

  const remainingCapacity = new Map<string, number>()
  for (const [contractorId, capacity] of contractorCapacity) {
    remainingCapacity.set(contractorId, capacity - (contractorCounts.get(contractorId) ?? 0))
  }

  return { contractCounts, remainingCapacity, fixedCost }
}

function addFlowEdge(graph: FlowEdge[][], from: number, to: number, cap: number, cost: number) {
  const forward: FlowEdge = { to, rev: graph[to].length, cap, cost }
  const reverse: FlowEdge = { to: from, rev: graph[from].length, cap: 0, cost: -cost }
  graph[from].push(forward)
  graph[to].push(reverse)
  return forward
}

function addBoundedFlowEdge(
  graph: FlowEdge[][],
  balances: number[],
  from: number,
  to: number,
  lower: number,
  upper: number,
  cost: number
) {
  if (lower < 0 || upper < lower) return null
  balances[from] -= lower
  balances[to] += lower
  return addFlowEdge(graph, from, to, upper - lower, cost)
}

function minCostFlow(graph: FlowEdge[][], source: number, sink: number, requiredFlow: number) {
  let flow = 0
  let cost = 0
  let iterations = 0

  while (flow < requiredFlow) {
    const dist = new Array<number>(graph.length).fill(Number.POSITIVE_INFINITY)
    const prevNode = new Array<number>(graph.length).fill(-1)
    const prevEdge = new Array<number>(graph.length).fill(-1)
    const inQueue = new Array<boolean>(graph.length).fill(false)
    const queue: number[] = [source]
    let head = 0
    dist[source] = 0
    inQueue[source] = true

    while (head < queue.length) {
      const node = queue[head]
      head += 1
      inQueue[node] = false

      for (let edgeIndex = 0; edgeIndex < graph[node].length; edgeIndex += 1) {
        const edge = graph[node][edgeIndex]
        if (edge.cap <= 0) continue
        const candidateDistance = dist[node] + edge.cost
        if (candidateDistance >= dist[edge.to]) continue
        dist[edge.to] = candidateDistance
        prevNode[edge.to] = node
        prevEdge[edge.to] = edgeIndex
        if (!inQueue[edge.to]) {
          queue.push(edge.to)
          inQueue[edge.to] = true
        }
      }
    }

    if (!Number.isFinite(dist[sink])) break

    let augment = requiredFlow - flow
    for (let node = sink; node !== source; node = prevNode[node]) {
      const from = prevNode[node]
      if (from < 0) {
        augment = 0
        break
      }
      augment = Math.min(augment, graph[from][prevEdge[node]].cap)
    }
    if (augment <= 0) break

    for (let node = sink; node !== source; node = prevNode[node]) {
      const from = prevNode[node]
      const edge = graph[from][prevEdge[node]]
      edge.cap -= augment
      graph[node][edge.rev].cap += augment
    }

    flow += augment
    cost += augment * dist[sink]
    iterations += 1
  }

  return { flow, cost, iterations }
}

function optimizeWithMinCostCirculation(
  units: SearchUnit[],
  fixedCost: number,
  remainingCapacity: Map<string, number>,
  contractCounts: Map<string, number>,
  contractLimits: Map<string, ContractLimit>,
  contractOwners: Map<string, string>
): SearchResult {
  const source = 0
  const unitStart = 1
  const contractIds = [
    ...new Set(units.flatMap((unit) => unit.candidates.map((candidate) => candidate.contractId))),
  ].sort()
  const contractorIds = [
    ...new Set(contractIds.map((contractId) => contractOwners.get(contractId)).filter(Boolean) as string[]),
  ].sort()
  const contractStart = unitStart + units.length
  const contractorStart = contractStart + contractIds.length
  const sink = contractorStart + contractorIds.length
  const superSource = sink + 1
  const superSink = sink + 2
  const graph: FlowEdge[][] = Array.from({ length: superSink + 1 }, () => [])
  const balances = new Array<number>(superSink + 1).fill(0)
  const contractNode = new Map(contractIds.map((id, index) => [id, contractStart + index]))
  const contractorNode = new Map(contractorIds.map((id, index) => [id, contractorStart + index]))
  const candidateEdges = new Map<string, { candidate: CostedCandidate; edge: FlowEdge }[]>()
  let invalidBounds = false

  units.forEach((searchUnit, index) => {
    const unitNode = unitStart + index
    addBoundedFlowEdge(graph, balances, source, unitNode, 0, 1, 0)
    const refs: { candidate: CostedCandidate; edge: FlowEdge }[] = []
    for (const candidate of searchUnit.candidates) {
      const target = contractNode.get(candidate.contractId)
      if (target == null) continue
      const edge = addBoundedFlowEdge(graph, balances, unitNode, target, 0, 1, candidate.expectedCost)
      if (edge) refs.push({ candidate, edge })
    }
    candidateEdges.set(searchUnit.analysis.unit.id, refs)
  })

  for (const contractId of contractIds) {
    const ownerId = contractOwners.get(contractId)
    const from = contractNode.get(contractId)
    const to = ownerId ? contractorNode.get(ownerId) : undefined
    if (from == null || to == null) continue
    const limit = contractLimits.get(contractId)
    const fixedCount = contractCounts.get(contractId) ?? 0
    const lower = Math.max(0, Math.ceil((limit?.min ?? 0) - fixedCount))
    const upper = Math.max(0, Math.floor((limit?.max ?? units.length) - fixedCount))
    if (!addBoundedFlowEdge(graph, balances, from, to, lower, Math.min(upper, units.length), 0)) {
      invalidBounds = true
    }
  }

  for (const contractorId of contractorIds) {
    const from = contractorNode.get(contractorId)
    if (from == null) continue
    const capacity = Math.max(0, Math.floor(remainingCapacity.get(contractorId) ?? 0))
    addBoundedFlowEdge(graph, balances, from, sink, 0, capacity, 0)
  }

  if (!addBoundedFlowEdge(graph, balances, sink, source, units.length, units.length, 0)) {
    invalidBounds = true
  }

  if (invalidBounds) {
    return {
      status: 'INFEASIBLE',
      selectedByUnit: new Map(),
      totalCost: Number.POSITIVE_INFINITY,
      exploredNodes: 0,
    }
  }

  let requiredFlow = 0
  for (let node = 0; node <= sink; node += 1) {
    if (balances[node] > 0) {
      addFlowEdge(graph, superSource, node, balances[node], 0)
      requiredFlow += balances[node]
    } else if (balances[node] < 0) {
      addFlowEdge(graph, node, superSink, -balances[node], 0)
    }
  }

  const flow = minCostFlow(graph, superSource, superSink, requiredFlow)
  if (flow.flow !== requiredFlow) {
    return {
      status: 'INFEASIBLE',
      selectedByUnit: new Map(),
      totalCost: Number.POSITIVE_INFINITY,
      exploredNodes: flow.iterations,
    }
  }

  const selectedByUnit = new Map<string, CostedCandidate>()
  for (const searchUnit of units) {
    const selected = candidateEdges.get(searchUnit.analysis.unit.id)?.find(({ edge }) => edge.cap === 0)
    if (!selected) {
      return {
        status: 'INFEASIBLE',
        selectedByUnit: new Map(),
        totalCost: Number.POSITIVE_INFINITY,
        exploredNodes: flow.iterations,
      }
    }
    selectedByUnit.set(searchUnit.analysis.unit.id, selected.candidate)
  }

  return {
    status: 'OPTIMAL',
    selectedByUnit,
    totalCost: fixedCost + flow.cost,
    exploredNodes: flow.iterations,
  }
}

function optimizeDecisionUnits(
  scenario: ContractorAllocationScenario,
  fixed: FixedAssignment[],
  decisionAnalyses: UnitDecisionAnalysis[]
): SearchResult {
  const units = buildSearchUnits(decisionAnalyses)
  if (units.some((unit) => !unit.candidates.length)) {
    return {
      status: 'INFEASIBLE',
      selectedByUnit: new Map(),
      totalCost: Number.POSITIVE_INFINITY,
      exploredNodes: 0,
    }
  }

  const { limits: contractLimits, owners: contractOwners } = buildContractLimits(scenario, fixed, units)
  const state = fixedState(scenario, fixed, contractLimits)
  if (!state) {
    return {
      status: 'INFEASIBLE',
      selectedByUnit: new Map(),
      totalCost: Number.POSITIVE_INFINITY,
      exploredNodes: 0,
    }
  }

  return optimizeWithMinCostCirculation(
    units,
    state.fixedCost,
    state.remainingCapacity,
    state.contractCounts,
    contractLimits,
    contractOwners
  )
}

function observedCandidate(analysis: UnitDecisionAnalysis) {
  if (!analysis.unit.observedContractorId) return undefined
  return analysis.feasible.find(
    (candidate) => candidate.contractorId === analysis.unit.observedContractorId && candidate.expectedCost != null
  ) as CostedCandidate | undefined
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
      let selected: CostedCandidate | undefined
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
