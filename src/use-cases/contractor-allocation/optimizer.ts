import type {
  AllocationAssignment,
  AllocationReservation,
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
  ScenarioValidationIssue,
  SourceRole,
  UnitDecisionAnalysis,
} from './domain'
import { createScenarioInputSnapshot } from './snapshot'

export const CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION = 'contractor-allocation/7'
const DEFAULT_MAX_SEARCH_NODES = 750_000
const GLOBAL_CHOICE_PROBE_NODES = 50_000
const EPSILON = 1e-9

type CostedCandidate = FeasibleAlternative & { expectedCost: number }
type SolverCandidate = {
  candidate: FeasibleAlternative
  objectiveCost: number
  reservation: boolean
}
type ContractLimit = { min: number; max: number }
type SearchUnit = {
  analysis: UnitDecisionAnalysis
  candidates: SolverCandidate[]
}
type OptimizerOptions = { maxSearchNodes?: number }
type SearchStatus = 'OPTIMAL' | 'FEASIBLE_NOT_PROVEN' | 'INFEASIBLE' | 'UNKNOWN'
type SearchOptions = OptimizerOptions & { forcedContractorByUnit?: Map<string, string> }

type SearchResult = {
  status: SearchStatus
  selectedByUnit: Map<string, SolverCandidate>
  totalCost: number
  exploredNodes: number
  lowerBound: number | null
  optimalityGapPct: number | null
}

function includesAll(available: string[], required: string[]) {
  return required.every((value) => available.includes(value))
}

function isFiniteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0
}

function isFinitePositive(value: number) {
  return Number.isFinite(value) && value > 0
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function isIsoDateTime(value: string) {
  return Number.isFinite(Date.parse(value)) && value.includes('T')
}

function monthOf(date: string) {
  return date.slice(0, 7)
}

function contractKey(contractorId: string, contractId: string) {
  return `${contractorId}::${contractId}`
}

function authorityById(scenario: ContractorAllocationScenario) {
  return new Map(scenario.trustedAuthorities.map((authority) => [authority.id, authority]))
}

function isTrustedSource(
  provenance: InputProvenance | undefined,
  expectedRole: SourceRole,
  scenario: ContractorAllocationScenario
) {
  if (!provenance) return false
  const authority = authorityById(scenario).get(provenance.authorityId)
  if (!authority) return false
  if (authority.ingress !== 'TRUSTED_ADAPTER' || authority.sourceRole !== expectedRole) return false
  if (!authority.sourceSystem.trim() || !provenance.sourceRecordId.trim() || !provenance.sourceVersion.trim()) return false
  if (!isIsoDateTime(provenance.capturedAt) || !isIsoDateTime(scenario.decisionAt)) return false
  return Date.parse(provenance.capturedAt) <= Date.parse(scenario.decisionAt)
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
  const operationsInputs = [
    provenance.executionWindow,
    provenance.deadline,
    provenance.capacityRequirements,
  ]

  if (!inspectorInputs.every((input) => isTrustedSource(input, 'INSPECTOR', scenario))) return false
  if (!operationsInputs.every((input) => isTrustedSource(input, 'OPERATIONS', scenario))) return false
  if (!isTrustedSource(provenance.contractVolume, 'PROCUREMENT', scenario)) return false
  if (
    (unit.expectedLaborHours != null || unit.expectedEquipmentHours != null) &&
    !isTrustedSource(provenance.teEstimate, 'OPERATIONS', scenario)
  ) {
    return false
  }
  return true
}

function contractorInputsTrusted(contractor: Contractor, scenario: ContractorAllocationScenario) {
  const provenance = contractor.provenance
  if (!provenance) return false
  if (!isTrustedSource(provenance.capacityBuckets, 'OPERATIONS', scenario)) return false
  if (!isTrustedSource(provenance.equipment, 'OPERATIONS', scenario)) return false
  if (!isTrustedSource(provenance.certifications, 'OPERATIONS', scenario)) return false
  return true
}

function contractInputsTrusted(contract: ContractorContract, scenario: ContractorAllocationScenario) {
  const provenance = contract.provenance
  if (!provenance) return false
  if (!isTrustedSource(provenance.eligibility, 'PROCUREMENT', scenario)) return false
  if (!isTrustedSource(provenance.rates, 'PROCUREMENT', scenario)) return false
  if (!isTrustedSource(provenance.volumeState, 'PROCUREMENT', scenario)) return false
  return true
}

function pushIssue(issues: ScenarioValidationIssue[], code: string, path: string, message: string) {
  issues.push({ code, path, message })
}

function duplicates(values: string[]) {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

function validateProvenance(
  issues: ScenarioValidationIssue[],
  path: string,
  provenance: InputProvenance | undefined,
  expectedRole: SourceRole,
  scenario: ContractorAllocationScenario
) {
  if (!isTrustedSource(provenance, expectedRole, scenario)) {
    pushIssue(issues, 'UNTRUSTED_INPUT', path, `Input must come from a trusted ${expectedRole} adapter before decision time.`)
  }
}

export function validateContractorAllocationScenario(
  scenario: ContractorAllocationScenario
): ScenarioValidationIssue[] {
  const issues: ScenarioValidationIssue[] = []

  if (!scenario.id.trim()) pushIssue(issues, 'EMPTY_SCENARIO_ID', 'id', 'Scenario id is required.')
  if (!isIsoDate(scenario.asOf)) pushIssue(issues, 'INVALID_AS_OF', 'asOf', 'asOf must be an ISO date.')
  if (!isIsoDateTime(scenario.decisionAt)) {
    pushIssue(issues, 'INVALID_DECISION_AT', 'decisionAt', 'decisionAt must be an ISO timestamp.')
  } else if (isIsoDate(scenario.asOf) && scenario.decisionAt.slice(0, 10) !== scenario.asOf) {
    pushIssue(issues, 'DECISION_DATE_MISMATCH', 'decisionAt', 'decisionAt must fall on scenario.asOf.')
  }

  for (const id of duplicates(scenario.trustedAuthorities.map((authority) => authority.id))) {
    pushIssue(issues, 'DUPLICATE_AUTHORITY_ID', 'trustedAuthorities', `Duplicate trusted authority id: ${id}`)
  }
  for (const [index, authority] of scenario.trustedAuthorities.entries()) {
    if (!authority.id.trim() || !authority.sourceSystem.trim() || authority.ingress !== 'TRUSTED_ADAPTER') {
      pushIssue(issues, 'INVALID_AUTHORITY', `trustedAuthorities[${index}]`, 'Trusted authority registry entry is invalid.')
    }
  }

  for (const id of duplicates(scenario.units.map((unit) => unit.id))) {
    pushIssue(issues, 'DUPLICATE_UNIT_ID', 'units', `Duplicate allocation unit id: ${id}`)
  }
  for (const id of duplicates(scenario.contractors.map((contractor) => contractor.id))) {
    pushIssue(issues, 'DUPLICATE_CONTRACTOR_ID', 'contractors', `Duplicate contractor id: ${id}`)
  }

  for (const [unitIndex, unit] of scenario.units.entries()) {
    const path = `units[${unitIndex}]`
    if (!unit.id.trim() || !unit.scopeId.trim() || !unit.workType.trim() || !unit.territory.trim()) {
      pushIssue(issues, 'INVALID_UNIT_IDENTITY', path, 'Unit identity, scope, territory and work type are required.')
    }
    if (!isFinitePositive(unit.quantity)) pushIssue(issues, 'INVALID_QUANTITY', `${path}.quantity`, 'Quantity must be positive.')
    if (!isFinitePositive(unit.contractVolume)) {
      pushIssue(issues, 'INVALID_CONTRACT_VOLUME', `${path}.contractVolume`, 'Contract volume must be positive.')
    }
    if (!Number.isFinite(unit.priority)) pushIssue(issues, 'INVALID_PRIORITY', `${path}.priority`, 'Priority must be finite.')

    if (!isIsoDate(unit.executionStart) || !isIsoDate(unit.executionEnd) || !isIsoDate(unit.deadline)) {
      pushIssue(issues, 'INVALID_EXECUTION_DATE', path, 'Execution start, execution end and deadline must be ISO dates.')
    } else {
      if (unit.executionStart < scenario.asOf) {
        pushIssue(issues, 'EXECUTION_BEFORE_DECISION', `${path}.executionStart`, 'Execution cannot start before the decision date.')
      }
      if (unit.executionStart > unit.executionEnd) {
        pushIssue(issues, 'INVALID_EXECUTION_WINDOW', path, 'executionStart must be on or before executionEnd.')
      }
      if (unit.executionEnd > unit.deadline) {
        pushIssue(issues, 'EXECUTION_AFTER_DEADLINE', path, 'Execution must finish by the operational deadline.')
      }
    }

    if (!unit.capacityRequirements.length) {
      pushIssue(issues, 'MISSING_CAPACITY_REQUIREMENTS', `${path}.capacityRequirements`, 'At least one capacity requirement is required.')
    }
    const requirementBuckets = unit.capacityRequirements.map((requirement) => requirement.bucket)
    for (const bucket of duplicates(requirementBuckets)) {
      pushIssue(issues, 'DUPLICATE_UNIT_CAPACITY_BUCKET', `${path}.capacityRequirements`, `Duplicate capacity bucket: ${bucket}`)
    }
    for (const [requirementIndex, requirement] of unit.capacityRequirements.entries()) {
      const requirementPath = `${path}.capacityRequirements[${requirementIndex}]`
      if (!/^\d{4}-\d{2}$/.test(requirement.bucket) || !isFinitePositive(requirement.demand)) {
        pushIssue(issues, 'INVALID_CAPACITY_REQUIREMENT', requirementPath, 'Capacity bucket and demand are invalid.')
      } else if (
        isIsoDate(unit.executionStart) &&
        isIsoDate(unit.executionEnd) &&
        (requirement.bucket < monthOf(unit.executionStart) || requirement.bucket > monthOf(unit.executionEnd))
      ) {
        pushIssue(issues, 'CAPACITY_OUTSIDE_EXECUTION_WINDOW', requirementPath, 'Capacity bucket must fall inside the execution window.')
      }
    }

    if ((unit.expectedLaborHours == null) !== (unit.expectedEquipmentHours == null)) {
      pushIssue(issues, 'INCOMPLETE_TE_ESTIMATE', path, 'T&E labor and equipment hours must be provided together.')
    }
    if (unit.expectedLaborHours != null && !isFiniteNonNegative(unit.expectedLaborHours)) {
      pushIssue(issues, 'INVALID_TE_ESTIMATE', `${path}.expectedLaborHours`, 'Labor hours must be non-negative.')
    }
    if (unit.expectedEquipmentHours != null && !isFiniteNonNegative(unit.expectedEquipmentHours)) {
      pushIssue(issues, 'INVALID_TE_ESTIMATE', `${path}.expectedEquipmentHours`, 'Equipment hours must be non-negative.')
    }

    validateProvenance(issues, `${path}.provenance.scope`, unit.provenance?.scope, 'INSPECTOR', scenario)
    validateProvenance(issues, `${path}.provenance.quantity`, unit.provenance?.quantity, 'INSPECTOR', scenario)
    validateProvenance(issues, `${path}.provenance.territory`, unit.provenance?.territory, 'INSPECTOR', scenario)
    validateProvenance(issues, `${path}.provenance.workType`, unit.provenance?.workType, 'INSPECTOR', scenario)
    validateProvenance(
      issues,
      `${path}.provenance.technicalRequirements`,
      unit.provenance?.technicalRequirements,
      'INSPECTOR',
      scenario
    )
    validateProvenance(issues, `${path}.provenance.executionWindow`, unit.provenance?.executionWindow, 'OPERATIONS', scenario)
    validateProvenance(issues, `${path}.provenance.deadline`, unit.provenance?.deadline, 'OPERATIONS', scenario)
    validateProvenance(
      issues,
      `${path}.provenance.capacityRequirements`,
      unit.provenance?.capacityRequirements,
      'OPERATIONS',
      scenario
    )
    validateProvenance(issues, `${path}.provenance.contractVolume`, unit.provenance?.contractVolume, 'PROCUREMENT', scenario)
    if (unit.expectedLaborHours != null || unit.expectedEquipmentHours != null) {
      validateProvenance(issues, `${path}.provenance.teEstimate`, unit.provenance?.teEstimate, 'OPERATIONS', scenario)
    }
  }

  for (const [contractorIndex, contractor] of scenario.contractors.entries()) {
    const path = `contractors[${contractorIndex}]`
    if (!contractor.id.trim()) pushIssue(issues, 'INVALID_CONTRACTOR_ID', `${path}.id`, 'Contractor id is required.')

    for (const bucket of duplicates(contractor.capacityBuckets.map((item) => item.bucket))) {
      pushIssue(issues, 'DUPLICATE_CONTRACTOR_CAPACITY_BUCKET', `${path}.capacityBuckets`, `Duplicate capacity bucket: ${bucket}`)
    }
    for (const [bucketIndex, bucket] of contractor.capacityBuckets.entries()) {
      if (!/^\d{4}-\d{2}$/.test(bucket.bucket) || !isFiniteNonNegative(bucket.availableCapacity)) {
        pushIssue(issues, 'INVALID_CAPACITY_BUCKET', `${path}.capacityBuckets[${bucketIndex}]`, 'Capacity bucket is invalid.')
      }
    }

    validateProvenance(issues, `${path}.provenance.capacityBuckets`, contractor.provenance?.capacityBuckets, 'OPERATIONS', scenario)
    validateProvenance(issues, `${path}.provenance.equipment`, contractor.provenance?.equipment, 'OPERATIONS', scenario)
    validateProvenance(issues, `${path}.provenance.certifications`, contractor.provenance?.certifications, 'OPERATIONS', scenario)

    for (const id of duplicates(contractor.contracts.map((contract) => contract.id))) {
      pushIssue(issues, 'DUPLICATE_CONTRACT_ID', `${path}.contracts`, `Duplicate contract id for contractor ${contractor.id}: ${id}`)
    }

    for (const [contractIndex, contract] of contractor.contracts.entries()) {
      const contractPath = `${path}.contracts[${contractIndex}]`
      if (!contract.id.trim()) pushIssue(issues, 'INVALID_CONTRACT_ID', `${contractPath}.id`, 'Contract id is required.')
      if (!isIsoDate(contract.validFrom) || !isIsoDate(contract.validTo) || contract.validFrom > contract.validTo) {
        pushIssue(issues, 'INVALID_CONTRACT_DATES', contractPath, 'Contract validity dates are invalid.')
      }
      if (!isFiniteNonNegative(contract.consumedVolumeToDate)) {
        pushIssue(issues, 'INVALID_CONSUMED_VOLUME', `${contractPath}.consumedVolumeToDate`, 'Consumed volume must be non-negative.')
      }
      if (!isFiniteNonNegative(contract.remainingMinVolume) || !isFiniteNonNegative(contract.remainingMaxVolume)) {
        pushIssue(issues, 'INVALID_REMAINING_VOLUME', contractPath, 'Remaining contract volume must be non-negative.')
      } else if (contract.remainingMinVolume > contract.remainingMaxVolume + EPSILON) {
        pushIssue(issues, 'INVALID_REMAINING_VOLUME', contractPath, 'remainingMinVolume cannot exceed remainingMaxVolume.')
      }
      if (contract.maxVolume != null && !isFiniteNonNegative(contract.maxVolume)) {
        pushIssue(issues, 'INVALID_MAX_VOLUME', `${contractPath}.maxVolume`, 'maxVolume must be non-negative.')
      }
      if (
        contract.maxVolume != null &&
        contract.consumedVolumeToDate + contract.remainingMaxVolume > contract.maxVolume + EPSILON
      ) {
        pushIssue(issues, 'INCONSISTENT_VOLUME_STATE', contractPath, 'Consumed plus remaining volume exceeds maxVolume.')
      }
      if (contract.awardedCapacity != null && !isFiniteNonNegative(contract.awardedCapacity)) {
        pushIssue(issues, 'INVALID_AWARDED_CAPACITY', `${contractPath}.awardedCapacity`, 'awardedCapacity must be non-negative.')
      }

      const rateKeys = contract.rates.map((rate) => `${rate.workType}::${rate.quantityUnit}`)
      for (const key of duplicates(rateKeys)) {
        pushIssue(issues, 'DUPLICATE_RATE', `${contractPath}.rates`, `Duplicate rate key: ${key}`)
      }
      for (const [rateIndex, rate] of contract.rates.entries()) {
        const numeric = [rate.unitRate, rate.laborRate, rate.equipmentRate, rate.mobilizationCost, rate.overtimeCost]
        if (numeric.some((value) => value != null && !isFiniteNonNegative(value))) {
          pushIssue(issues, 'INVALID_RATE', `${contractPath}.rates[${rateIndex}]`, 'Rate components must be finite and non-negative.')
        }
      }

      validateProvenance(issues, `${contractPath}.provenance.eligibility`, contract.provenance?.eligibility, 'PROCUREMENT', scenario)
      validateProvenance(issues, `${contractPath}.provenance.rates`, contract.provenance?.rates, 'PROCUREMENT', scenario)
      validateProvenance(issues, `${contractPath}.provenance.volumeState`, contract.provenance?.volumeState, 'PROCUREMENT', scenario)
    }
  }

  return issues
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
  return { min: contract.remainingMinVolume, max: contract.remainingMaxVolume }
}

function contractCoversExecution(contract: ContractorContract, unit: AllocationUnit) {
  return contract.validFrom <= unit.executionStart && contract.validTo >= unit.executionEnd
}

function contractorLevelReasons(
  contractor: Contractor,
  unit: AllocationUnit,
  scenario: ContractorAllocationScenario
): FeasibilityReason[] {
  const reasons: FeasibilityReason[] = []
  if (!unitInputsTrusted(unit, scenario) || !contractorInputsTrusted(contractor, scenario)) {
    return ['UNTRUSTED_INPUT']
  }

  const capacity = new Map(contractor.capacityBuckets.map((bucket) => [bucket.bucket, bucket.availableCapacity]))
  for (const requirement of unit.capacityRequirements) {
    if (!capacity.has(requirement.bucket)) {
      reasons.push('CAPACITY_BUCKET_MISSING')
      continue
    }
    if ((capacity.get(requirement.bucket) ?? 0) + EPSILON < requirement.demand) reasons.push('NO_CAPACITY')
  }
  if (unit.executionEnd > unit.deadline) reasons.push('SLA_IMPOSSIBLE')
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
  if (contract.approved && !contractCoversExecution(contract, unit)) reasons.push('CONTRACT_OUTSIDE_EXECUTION_WINDOW')
  if (contract.approved && contractCoversExecution(contract, unit) && !contract.territories.includes(unit.territory)) {
    reasons.push('TERRITORY_NOT_ALLOWED')
  }
  if (
    contract.approved &&
    contractCoversExecution(contract, unit) &&
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
      rejected: [{ contractorId: contractor.id, contractorName: contractor.name, reasons: hardReasons }],
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

function searchableAnalyses(analyses: UnitDecisionAnalysis[]) {
  return analyses.filter((analysis) => analysis.type !== 'INFEASIBLE')
}

function buildSearchUnits(analyses: UnitDecisionAnalysis[], forcedContractorByUnit?: Map<string, string>): SearchUnit[] {
  return searchableAnalyses(analyses)
    .map((analysis) => {
      const reservation = analysis.type === 'EXCEPTION_REQUIRED'
      let candidates: SolverCandidate[] = reservation
        ? analysis.feasible.map((candidate) => ({ candidate, objectiveCost: 0, reservation: true }))
        : analysis.feasible
            .filter(
              (candidate): candidate is CostedCandidate => candidate.expectedCost != null && !candidate.requiresException
            )
            .map((candidate) => ({ candidate, objectiveCost: candidate.expectedCost, reservation: false }))
      const forcedContractor = forcedContractorByUnit?.get(analysis.unit.id)
      if (forcedContractor) candidates = candidates.filter(({ candidate }) => candidate.contractorId === forcedContractor)
      candidates.sort(
        (left, right) =>
          left.objectiveCost - right.objectiveCost ||
          left.candidate.contractorId.localeCompare(right.candidate.contractorId) ||
          left.candidate.contractId.localeCompare(right.candidate.contractId)
      )
      return { analysis, candidates }
    })
    .sort((left, right) => {
      if (left.candidates.length !== right.candidates.length) return left.candidates.length - right.candidates.length
      const leftRegret =
        (left.candidates[1]?.objectiveCost ?? left.candidates[0]?.objectiveCost ?? 0) -
        (left.candidates[0]?.objectiveCost ?? 0)
      const rightRegret =
        (right.candidates[1]?.objectiveCost ?? right.candidates[0]?.objectiveCost ?? 0) -
        (right.candidates[0]?.objectiveCost ?? 0)
      if (Math.abs(leftRegret - rightRegret) > EPSILON) return rightRegret - leftRegret
      const leftDemand = left.analysis.unit.capacityRequirements.reduce((sum, item) => sum + item.demand, 0)
      const rightDemand = right.analysis.unit.capacityRequirements.reduce((sum, item) => sum + item.demand, 0)
      if (Math.abs(leftDemand - rightDemand) > EPSILON) return rightDemand - leftDemand
      return left.analysis.unit.id.localeCompare(right.analysis.unit.id)
    })
}

function buildContractIndex(scenario: ContractorAllocationScenario) {
  const index = new Map<string, ContractorContract>()
  for (const contractor of scenario.contractors) {
    for (const contract of contractor.contracts) index.set(contractKey(contractor.id, contract.id), contract)
  }
  return index
}

function buildContractLimits(scenario: ContractorAllocationScenario, units: SearchUnit[]) {
  const candidateKeys = new Set(
    units.flatMap((unit) =>
      unit.candidates.map(({ candidate }) => contractKey(candidate.contractorId, candidate.contractId))
    )
  )
  const limits = new Map<string, ContractLimit>()
  for (const contractor of scenario.contractors) {
    for (const contract of contractor.contracts) {
      const key = contractKey(contractor.id, contract.id)
      if (!candidateKeys.has(key) && contract.remainingMinVolume <= EPSILON) continue
      limits.set(key, remainingContractLimit(contract))
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
  options: SearchOptions
): SearchResult {
  const units = buildSearchUnits(analyses, options.forcedContractorByUnit)
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
  const contractUsedVolume = new Map<string, number>(contractIds.map((key) => [key, 0]))

  const suffixMinimum = new Array<number>(units.length + 1).fill(0)
  for (let index = units.length - 1; index >= 0; index -= 1) {
    suffixMinimum[index] = suffixMinimum[index + 1] + units[index].candidates[0].objectiveCost
  }
  const rootLowerBound = suffixMinimum[0]

  const suffixContractPotential = new Map<string, number[]>()
  for (const key of contractIds) {
    const potential = new Array<number>(units.length + 1).fill(0)
    for (let index = units.length - 1; index >= 0; index -= 1) {
      potential[index] =
        potential[index + 1] +
        (units[index].candidates.some(
          ({ candidate }) => contractKey(candidate.contractorId, candidate.contractId) === key
        )
          ? units[index].analysis.unit.contractVolume
          : 0)
    }
    suffixContractPotential.set(key, potential)
  }

  const validateContractMinimums = () =>
    contractIds.every((key) => {
      const limit = contractLimits.get(key)
      return !limit || (contractUsedVolume.get(key) ?? 0) + EPSILON >= limit.min
    })

  const cheapestSelection = new Map<string, SolverCandidate>()
  let cheapestCombinationFeasible = true
  for (const searchUnit of units) {
    const selected = searchUnit.candidates[0]
    const candidate = selected.candidate
    const key = contractKey(candidate.contractorId, candidate.contractId)
    const limit = contractLimits.get(key)
    const used = contractUsedVolume.get(key) ?? 0
    if (!canConsumeCapacity(remainingCapacity, candidate.contractorId, searchUnit.analysis.unit)) {
      cheapestCombinationFeasible = false
      break
    }
    if (used + searchUnit.analysis.unit.contractVolume > (limit?.max ?? Number.POSITIVE_INFINITY) + EPSILON) {
      cheapestCombinationFeasible = false
      break
    }
    consumeCapacity(remainingCapacity, candidate.contractorId, searchUnit.analysis.unit, 1)
    contractUsedVolume.set(key, used + searchUnit.analysis.unit.contractVolume)
    cheapestSelection.set(searchUnit.analysis.unit.id, selected)
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
  for (const key of contractIds) contractUsedVolume.set(key, 0)

  let bestCost = Number.POSITIVE_INFINITY
  let best = new Map<string, SolverCandidate>()
  const selected = new Map<string, SolverCandidate>()
  const bestCostByState = new Map<string, number>()
  let exploredNodes = 0
  let truncated = false
  const maxSearchNodes = Math.max(0, options.maxSearchNodes ?? DEFAULT_MAX_SEARCH_NODES)

  const minimaCanStillBeMet = (index: number) => {
    for (const key of contractIds) {
      const limit = contractLimits.get(key)
      if (!limit || limit.min <= 0) continue
      const used = contractUsedVolume.get(key) ?? 0
      const potential = suffixContractPotential.get(key)?.[index] ?? 0
      if (used + potential + EPSILON < limit.min) return false
    }
    return true
  }

  const stateKey = (index: number) =>
    `${index}|${capacityKeys.map((key) => stateNumber(remainingCapacity.get(key) ?? 0)).join(',')}|${contractIds
      .map((key) => stateNumber(contractUsedVolume.get(key) ?? 0))
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
    for (const solverCandidate of searchUnit.candidates) {
      const candidate = solverCandidate.candidate
      if (!canConsumeCapacity(remainingCapacity, candidate.contractorId, searchUnit.analysis.unit)) continue
      const key = contractKey(candidate.contractorId, candidate.contractId)
      const limit = contractLimits.get(key)
      const currentVolume = contractUsedVolume.get(key) ?? 0
      if (
        currentVolume + searchUnit.analysis.unit.contractVolume >
        (limit?.max ?? Number.POSITIVE_INFINITY) + EPSILON
      ) {
        continue
      }

      consumeCapacity(remainingCapacity, candidate.contractorId, searchUnit.analysis.unit, 1)
      contractUsedVolume.set(key, currentVolume + searchUnit.analysis.unit.contractVolume)
      selected.set(searchUnit.analysis.unit.id, solverCandidate)

      visit(index + 1, cost + solverCandidate.objectiveCost)

      selected.delete(searchUnit.analysis.unit.id)
      contractUsedVolume.set(key, currentVolume)
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

function observedFeasibleCandidate(analysis: UnitDecisionAnalysis) {
  if (!analysis.unit.observedContractorId) return undefined
  const candidates = analysis.feasible.filter(
    (candidate) => candidate.contractorId === analysis.unit.observedContractorId
  )
  if (analysis.unit.observedContractId) {
    return candidates.find((candidate) => candidate.contractId === analysis.unit.observedContractId)
  }
  return candidates.length === 1 ? candidates[0] : undefined
}

function observedCostedCandidate(analysis: UnitDecisionAnalysis) {
  const candidate = observedFeasibleCandidate(analysis)
  if (!candidate || candidate.expectedCost == null || candidate.requiresException) return undefined
  return candidate as CostedCandidate
}

function validateObservedPortfolio(scenario: ContractorAllocationScenario, analyses: UnitDecisionAnalysis[]) {
  const invalid = new Set<string>()
  const capacityUsage = new Map<string, { total: number; unitIds: string[] }>()
  const contractUsage = new Map<string, { total: number; unitIds: string[] }>()
  const contractIndex = buildContractIndex(scenario)

  for (const analysis of analyses) {
    if (analysis.type === 'INFEASIBLE') continue
    const candidate = observedFeasibleCandidate(analysis)
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
    const key = contractKey(candidate.contractorId, candidate.contractId)
    const volume = contractUsage.get(key) ?? { total: 0, unitIds: [] }
    volume.total += analysis.unit.contractVolume
    volume.unitIds.push(analysis.unit.id)
    contractUsage.set(key, volume)
  }

  const availableCapacity = buildRemainingCapacity(scenario)
  for (const [key, usage] of capacityUsage) {
    if (usage.total > (availableCapacity.get(key) ?? 0) + EPSILON) {
      usage.unitIds.forEach((unitId) => invalid.add(unitId))
    }
  }

  const allContractKeys = new Set([...contractIndex.keys(), ...contractUsage.keys()])
  for (const key of allContractKeys) {
    const contract = contractIndex.get(key)
    const usage = contractUsage.get(key) ?? { total: 0, unitIds: [] }
    if (!contract) {
      usage.unitIds.forEach((unitId) => invalid.add(unitId))
      continue
    }
    const limit = remainingContractLimit(contract)
    if (usage.total > limit.max + EPSILON || usage.total + EPSILON < limit.min) {
      usage.unitIds.forEach((unitId) => invalid.add(unitId))
      if (!usage.unitIds.length && limit.min > EPSILON) scenario.units.forEach((unit) => invalid.add(unit.id))
    }
  }

  return [...invalid].sort()
}

function globalDecisionSpaceMetrics(
  scenario: ContractorAllocationScenario,
  analyses: UnitDecisionAnalysis[],
  options: OptimizerOptions
): DecisionSpaceMetrics {
  let spendWithChoice = 0
  let spreadWeighted = 0
  let spreadWeight = 0
  let decisionUnits = 0
  let globalChoiceUnknownUnits = 0
  const localDecisionAnalyses = analyses.filter((analysis) => analysis.type === 'ALLOCATION_DECISION_REQUIRED')
  const portfolioHasInfeasible = analyses.some((analysis) => analysis.type === 'INFEASIBLE')

  if (!portfolioHasInfeasible) {
    for (const analysis of localDecisionAnalyses) {
      const contractorCosts = new Map<string, number>()
      for (const candidate of analysis.feasible) {
        if (candidate.expectedCost == null || candidate.requiresException) continue
        const current = contractorCosts.get(candidate.contractorId)
        if (current == null || candidate.expectedCost < current) contractorCosts.set(candidate.contractorId, candidate.expectedCost)
      }

      const globallyFeasible = new Map<string, number>()
      let unknown = false
      for (const [contractorId, cost] of contractorCosts) {
        const probe = optimizeDecisionUnits(scenario, analyses, {
          maxSearchNodes: Math.min(options.maxSearchNodes ?? GLOBAL_CHOICE_PROBE_NODES, GLOBAL_CHOICE_PROBE_NODES),
          forcedContractorByUnit: new Map([[analysis.unit.id, contractorId]]),
        })
        if (probe.status === 'OPTIMAL' || probe.status === 'FEASIBLE_NOT_PROVEN') {
          globallyFeasible.set(contractorId, cost)
        } else if (probe.status === 'UNKNOWN') {
          unknown = true
        }
      }

      if (globallyFeasible.size >= 2) {
        decisionUnits += 1
        const observed = observedCostedCandidate(analysis)
        if (observed) {
          const costs = [...globallyFeasible.values()]
          const minimum = Math.min(...costs)
          const maximum = Math.max(...costs)
          const spread = minimum > 0 ? (maximum - minimum) / minimum : 0
          spendWithChoice += observed.expectedCost
          spreadWeighted += observed.expectedCost * spread
          spreadWeight += observed.expectedCost
        }
      } else if (unknown) {
        globalChoiceUnknownUnits += 1
      }
    }
  }

  const totalUnits = analyses.length
  return {
    totalUnits,
    infeasibleUnits: analyses.filter((analysis) => analysis.type === 'INFEASIBLE').length,
    noChoiceUnits: analyses.filter((analysis) => analysis.type === 'NO_CHOICE').length,
    localDecisionUnits: localDecisionAnalyses.length,
    decisionUnits,
    globalChoiceUnknownUnits,
    decisionSpaceRatio: totalUnits ? decisionUnits / totalUnits : 0,
    spendWithChoice,
    weightedChoiceSpreadPct: spreadWeight ? (spreadWeighted / spreadWeight) * 100 : 0,
  }
}

function overallStatus(search: SearchResult, analyses: UnitDecisionAnalysis[]): ContractorAllocationResult['status'] {
  if (analyses.some((analysis) => analysis.type === 'INFEASIBLE')) return 'INFEASIBLE'
  const partial = analyses.some((analysis) => analysis.type === 'EXCEPTION_REQUIRED')
  if (search.status === 'OPTIMAL') return partial ? 'PARTIAL_OPTIMAL' : 'OPTIMAL'
  if (search.status === 'FEASIBLE_NOT_PROVEN') {
    return partial ? 'PARTIAL_FEASIBLE_NOT_PROVEN' : 'FEASIBLE_NOT_PROVEN'
  }
  return search.status
}

export function optimizeContractorAllocation(
  scenario: ContractorAllocationScenario,
  options: OptimizerOptions = {}
): ContractorAllocationResult {
  const scenarioSnapshot = createScenarioInputSnapshot(scenario)
  const validationIssues = validateContractorAllocationScenario(scenario)
  const analyses = analyzeDecisionSpace(scenario)
  const emptyCoverage = {
    totalUnits: analyses.length,
    coveredUnits: analyses.filter(
      (analysis) => analysis.type === 'NO_CHOICE' || analysis.type === 'ALLOCATION_DECISION_REQUIRED'
    ).length,
    exceptionUnits: analyses.filter((analysis) => analysis.type === 'EXCEPTION_REQUIRED').length,
    infeasibleUnits: analyses.filter((analysis) => analysis.type === 'INFEASIBLE').length,
    coverageRatio: analyses.length
      ? analyses.filter(
          (analysis) => analysis.type === 'NO_CHOICE' || analysis.type === 'ALLOCATION_DECISION_REQUIRED'
        ).length / analyses.length
      : 0,
    coveredObservedExpectedSpend: analyses.reduce(
      (sum, analysis) => sum + (observedCostedCandidate(analysis)?.expectedCost ?? 0),
      0
    ),
  }

  if (validationIssues.length) {
    return {
      scenarioId: scenario.id,
      optimizerVersion: CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION,
      status: 'INVALID_INPUT',
      analyses,
      assignments: [],
      reservations: [],
      unresolvedUnitIds: analyses.map((analysis) => analysis.unit.id),
      observedInvalidUnitIds: [],
      observedExpectedSpend: emptyCoverage.coveredObservedExpectedSpend,
      qdipExpectedSpend: 0,
      counterfactualAllocationAdvantage: null,
      coverage: emptyCoverage,
      metrics: {
        totalUnits: analyses.length,
        infeasibleUnits: emptyCoverage.infeasibleUnits,
        noChoiceUnits: 0,
        localDecisionUnits: 0,
        decisionUnits: 0,
        globalChoiceUnknownUnits: 0,
        decisionSpaceRatio: 0,
        spendWithChoice: 0,
        weightedChoiceSpreadPct: 0,
      },
      exploredNodes: 0,
      lowerBound: null,
      optimalityGapPct: null,
      validationIssues,
      scenarioSnapshot,
    }
  }

  const search = analyses.some((analysis) => analysis.type === 'INFEASIBLE')
    ? {
        status: 'INFEASIBLE' as const,
        selectedByUnit: new Map<string, SolverCandidate>(),
        totalCost: Number.POSITIVE_INFINITY,
        exploredNodes: 0,
        lowerBound: null,
        optimalityGapPct: null,
      }
    : optimizeDecisionUnits(scenario, analyses, options)
  const status = overallStatus(search, analyses)
  const assignments: AllocationAssignment[] = []
  const reservations: AllocationReservation[] = []
  const unresolvedUnitIds = analyses
    .filter((analysis) => analysis.type === 'INFEASIBLE' || analysis.type === 'EXCEPTION_REQUIRED')
    .map((analysis) => analysis.unit.id)

  if (
    status === 'OPTIMAL' ||
    status === 'PARTIAL_OPTIMAL' ||
    status === 'FEASIBLE_NOT_PROVEN' ||
    status === 'PARTIAL_FEASIBLE_NOT_PROVEN'
  ) {
    for (const analysis of searchableAnalyses(analyses)) {
      const selected = search.selectedByUnit.get(analysis.unit.id)
      if (!selected) continue
      const candidate = selected.candidate
      if (selected.reservation) {
        reservations.push({
          allocationUnitId: analysis.unit.id,
          contractorId: candidate.contractorId,
          contractorName: candidate.contractorName,
          contractId: candidate.contractId,
          reason: 'COST_UNCERTAIN',
          inputSnapshotId: scenarioSnapshot.id,
        })
        continue
      }
      if (candidate.expectedCost == null) continue
      const observed = observedCostedCandidate(analysis)
      assignments.push({
        allocationUnitId: analysis.unit.id,
        contractorId: candidate.contractorId,
        contractorName: candidate.contractorName,
        contractId: candidate.contractId,
        expectedCost: candidate.expectedCost,
        observedContractorId: analysis.unit.observedContractorId,
        observedContractId: analysis.unit.observedContractId,
        observedExpectedCost: observed?.expectedCost,
        expectedDelta: observed ? observed.expectedCost - candidate.expectedCost : undefined,
        inputSnapshotId: scenarioSnapshot.id,
      })
    }
  }

  const coveredAnalyses = analyses.filter(
    (analysis) => analysis.type === 'NO_CHOICE' || analysis.type === 'ALLOCATION_DECISION_REQUIRED'
  )
  const observedInvalidUnitIds = validateObservedPortfolio(scenario, analyses)
  const observedExpectedSpend = coveredAnalyses.reduce(
    (sum, analysis) => sum + (observedCostedCandidate(analysis)?.expectedCost ?? 0),
    0
  )
  const qdipExpectedSpend = assignments.reduce((sum, assignment) => sum + assignment.expectedCost, 0)
  const coverage = {
    totalUnits: analyses.length,
    coveredUnits: coveredAnalyses.length,
    exceptionUnits: analyses.filter((analysis) => analysis.type === 'EXCEPTION_REQUIRED').length,
    infeasibleUnits: analyses.filter((analysis) => analysis.type === 'INFEASIBLE').length,
    coverageRatio: analyses.length ? coveredAnalyses.length / analyses.length : 0,
    coveredObservedExpectedSpend: observedExpectedSpend,
  }
  const metrics = globalDecisionSpaceMetrics(scenario, analyses, options)
  const counterfactualAllocationAdvantage =
    status === 'OPTIMAL' &&
    coverage.coverageRatio === 1 &&
    !observedInvalidUnitIds.length &&
    assignments.length === coveredAnalyses.length
      ? observedExpectedSpend - qdipExpectedSpend
      : null

  return {
    scenarioId: scenario.id,
    optimizerVersion: CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION,
    status,
    analyses,
    assignments: assignments.sort((left, right) => left.allocationUnitId.localeCompare(right.allocationUnitId)),
    reservations: reservations.sort((left, right) => left.allocationUnitId.localeCompare(right.allocationUnitId)),
    unresolvedUnitIds,
    observedInvalidUnitIds,
    observedExpectedSpend,
    qdipExpectedSpend,
    counterfactualAllocationAdvantage,
    coverage,
    metrics,
    exploredNodes: search.exploredNodes,
    lowerBound: search.lowerBound,
    optimalityGapPct: search.optimalityGapPct,
    validationIssues,
    scenarioSnapshot,
  }
}
