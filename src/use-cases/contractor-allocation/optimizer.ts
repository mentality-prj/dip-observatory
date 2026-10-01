import type {
  AllocationAssignment,
  AllocationReservation,
  AllocationUnit,
  CandidateExecutionEstimate,
  Contractor,
  ContractorAllocationResult,
  ContractorAllocationScenario,
  ContractorContract,
  DecisionSpaceMetrics,
  FeasibleAlternative,
  FeasibilityReason,
  InputProvenance,
  PortfolioAlternativeImpact,
  RejectedAlternative,
  ScenarioValidationIssue,
  SourceRole,
  UnitDecisionAnalysis,
} from './domain'
import { createScenarioInputSnapshot } from './snapshot'

export const CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION = 'contractor-allocation/8'
const DEFAULT_MAX_SEARCH_NODES = 750_000
const GLOBAL_CHOICE_PROBE_NODES = 50_000
const EPSILON = 1e-9

type CostedCandidate = FeasibleAlternative & { expectedCost: number }
type SolverCandidate = { candidate: FeasibleAlternative; objectiveCost: number; reservation: boolean }
type ContractLimit = { min: number; max: number }
type SearchUnit = { analysis: UnitDecisionAnalysis; candidates: SolverCandidate[] }
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function isIsoDateTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
}

function monthOf(date: string) {
  return date.slice(0, 7)
}

function contractKey(contractorId: string, contractId: string) {
  return `${contractorId}::${contractId}`
}

function capacityKey(contractorId: string, bucket: string) {
  return `${contractorId}|${bucket}`
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
  if (!authority || authority.sourceRole !== expectedRole || !authority.sourceSystem.trim()) return false
  if (!provenance.sourceRecordId.trim() || !provenance.sourceVersion.trim()) return false
  if (!isIsoDateTime(provenance.capturedAt) || !isIsoDateTime(scenario.decisionAt)) return false
  return Date.parse(provenance.capturedAt) <= Date.parse(scenario.decisionAt)
}

function unitInputsTrusted(unit: AllocationUnit, scenario: ContractorAllocationScenario) {
  const p = unit.provenance
  const inspector = [p.scope, p.quantity, p.territory, p.workType, p.technicalRequirements]
  const operations = [p.executionWindow, p.deadline, p.capacityRequirements]
  if (!inspector.every((input) => isTrustedSource(input, 'INSPECTOR', scenario))) return false
  if (!operations.every((input) => isTrustedSource(input, 'OPERATIONS', scenario))) return false
  if (!isTrustedSource(p.contractVolume, 'PROCUREMENT', scenario)) return false
  if ((unit.expectedLaborHours != null || unit.expectedEquipmentHours != null) && !isTrustedSource(p.teEstimate, 'OPERATIONS', scenario)) return false
  return true
}

function contractorInputsTrusted(contractor: Contractor, scenario: ContractorAllocationScenario) {
  const p = contractor.provenance
  return (
    isTrustedSource(p.capacityBuckets, 'OPERATIONS', scenario) &&
    isTrustedSource(p.equipment, 'OPERATIONS', scenario) &&
    isTrustedSource(p.certifications, 'OPERATIONS', scenario) &&
    isTrustedSource(p.executionProfiles, 'OPERATIONS', scenario)
  )
}

function contractInputsTrusted(contract: ContractorContract, scenario: ContractorAllocationScenario) {
  const p = contract.provenance
  return (
    isTrustedSource(p.eligibility, 'PROCUREMENT', scenario) &&
    isTrustedSource(p.rates, 'PROCUREMENT', scenario) &&
    isTrustedSource(p.volumeState, 'PROCUREMENT', scenario)
  )
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

function pushIssue(issues: ScenarioValidationIssue[], code: string, path: string, message: string) {
  issues.push({ code, path, message })
}

function validateProvenance(
  issues: ScenarioValidationIssue[],
  path: string,
  provenance: InputProvenance | undefined,
  expectedRole: SourceRole,
  scenario: ContractorAllocationScenario
) {
  if (!isTrustedSource(provenance, expectedRole, scenario)) {
    pushIssue(issues, 'UNTRUSTED_INPUT', path, `Input ownership must resolve to ${expectedRole} before decision time.`)
  }
}

export function validateContractorAllocationScenario(scenario: ContractorAllocationScenario): ScenarioValidationIssue[] {
  const issues: ScenarioValidationIssue[] = []
  if (!scenario.id.trim()) pushIssue(issues, 'EMPTY_SCENARIO_ID', 'id', 'Scenario id is required.')
  if (!isIsoDate(scenario.asOf)) pushIssue(issues, 'INVALID_AS_OF', 'asOf', 'asOf must be an ISO date.')
  if (!isIsoDateTime(scenario.decisionAt)) pushIssue(issues, 'INVALID_DECISION_AT', 'decisionAt', 'decisionAt must be RFC3339 with timezone.')
  else if (isIsoDate(scenario.asOf) && scenario.decisionAt.slice(0, 10) !== scenario.asOf) pushIssue(issues, 'DECISION_DATE_MISMATCH', 'decisionAt', 'decisionAt must fall on scenario.asOf.')

  for (const id of duplicates(scenario.trustedAuthorities.map((authority) => authority.id))) pushIssue(issues, 'DUPLICATE_AUTHORITY_ID', 'trustedAuthorities', `Duplicate authority id: ${id}`)
  for (const id of duplicates(scenario.units.map((unit) => unit.id))) pushIssue(issues, 'DUPLICATE_UNIT_ID', 'units', `Duplicate allocation unit id: ${id}`)
  for (const id of duplicates(scenario.contractors.map((contractor) => contractor.id))) pushIssue(issues, 'DUPLICATE_CONTRACTOR_ID', 'contractors', `Duplicate contractor id: ${id}`)

  for (const [unitIndex, unit] of scenario.units.entries()) {
    const path = `units[${unitIndex}]`
    if (!unit.id.trim() || !unit.scopeId.trim() || !unit.workType.trim() || !unit.territory.trim()) pushIssue(issues, 'INVALID_UNIT_IDENTITY', path, 'Unit identity fields are required.')
    if (!isFinitePositive(unit.quantity)) pushIssue(issues, 'INVALID_QUANTITY', `${path}.quantity`, 'Quantity must be positive.')
    if (!isFinitePositive(unit.contractVolume)) pushIssue(issues, 'INVALID_CONTRACT_VOLUME', `${path}.contractVolume`, 'Contract volume must be positive.')
    if (!Number.isFinite(unit.priority)) pushIssue(issues, 'INVALID_PRIORITY', `${path}.priority`, 'Priority must be finite.')
    if (!isIsoDate(unit.executionStart) || !isIsoDate(unit.executionEnd) || !isIsoDate(unit.deadline)) pushIssue(issues, 'INVALID_EXECUTION_DATE', path, 'Execution dates must be valid ISO dates.')
    else {
      if (unit.executionStart < scenario.asOf) pushIssue(issues, 'EXECUTION_BEFORE_DECISION', `${path}.executionStart`, 'Execution cannot start before the decision date.')
      if (unit.executionStart > unit.executionEnd) pushIssue(issues, 'INVALID_EXECUTION_WINDOW', path, 'executionStart must be on or before executionEnd.')
      if (unit.executionEnd > unit.deadline) pushIssue(issues, 'EXECUTION_AFTER_DEADLINE', path, 'Execution must finish by the deadline.')
    }
    if (!unit.capacityRequirements.length) pushIssue(issues, 'MISSING_CAPACITY_REQUIREMENTS', `${path}.capacityRequirements`, 'At least one capacity requirement is required.')
    for (const bucket of duplicates(unit.capacityRequirements.map((requirement) => requirement.bucket))) pushIssue(issues, 'DUPLICATE_UNIT_CAPACITY_BUCKET', `${path}.capacityRequirements`, `Duplicate capacity bucket: ${bucket}`)
    for (const [index, requirement] of unit.capacityRequirements.entries()) {
      if (!/^\d{4}-\d{2}$/.test(requirement.bucket) || !isFinitePositive(requirement.demand)) pushIssue(issues, 'INVALID_CAPACITY_REQUIREMENT', `${path}.capacityRequirements[${index}]`, 'Capacity requirement is invalid.')
      else if (isIsoDate(unit.executionStart) && isIsoDate(unit.executionEnd) && (requirement.bucket < monthOf(unit.executionStart) || requirement.bucket > monthOf(unit.executionEnd))) pushIssue(issues, 'CAPACITY_OUTSIDE_EXECUTION_WINDOW', `${path}.capacityRequirements[${index}]`, 'Capacity bucket must fall inside execution window.')
    }
    if ((unit.expectedLaborHours == null) !== (unit.expectedEquipmentHours == null)) pushIssue(issues, 'INCOMPLETE_TE_ESTIMATE', path, 'Fallback T&E hours must be supplied together.')
    if (unit.expectedLaborHours != null && !isFiniteNonNegative(unit.expectedLaborHours)) pushIssue(issues, 'INVALID_TE_ESTIMATE', `${path}.expectedLaborHours`, 'Labor hours must be non-negative.')
    if (unit.expectedEquipmentHours != null && !isFiniteNonNegative(unit.expectedEquipmentHours)) pushIssue(issues, 'INVALID_TE_ESTIMATE', `${path}.expectedEquipmentHours`, 'Equipment hours must be non-negative.')

    validateProvenance(issues, `${path}.provenance.scope`, unit.provenance?.scope, 'INSPECTOR', scenario)
    validateProvenance(issues, `${path}.provenance.quantity`, unit.provenance?.quantity, 'INSPECTOR', scenario)
    validateProvenance(issues, `${path}.provenance.territory`, unit.provenance?.territory, 'INSPECTOR', scenario)
    validateProvenance(issues, `${path}.provenance.workType`, unit.provenance?.workType, 'INSPECTOR', scenario)
    validateProvenance(issues, `${path}.provenance.technicalRequirements`, unit.provenance?.technicalRequirements, 'INSPECTOR', scenario)
    validateProvenance(issues, `${path}.provenance.executionWindow`, unit.provenance?.executionWindow, 'OPERATIONS', scenario)
    validateProvenance(issues, `${path}.provenance.deadline`, unit.provenance?.deadline, 'OPERATIONS', scenario)
    validateProvenance(issues, `${path}.provenance.capacityRequirements`, unit.provenance?.capacityRequirements, 'OPERATIONS', scenario)
    validateProvenance(issues, `${path}.provenance.contractVolume`, unit.provenance?.contractVolume, 'PROCUREMENT', scenario)
  }

  for (const [contractorIndex, contractor] of scenario.contractors.entries()) {
    const path = `contractors[${contractorIndex}]`
    if (!contractor.id.trim()) pushIssue(issues, 'INVALID_CONTRACTOR_ID', `${path}.id`, 'Contractor id is required.')
    for (const bucket of duplicates(contractor.capacityBuckets.map((item) => item.bucket))) pushIssue(issues, 'DUPLICATE_CONTRACTOR_CAPACITY_BUCKET', `${path}.capacityBuckets`, `Duplicate capacity bucket: ${bucket}`)
    for (const [index, bucket] of contractor.capacityBuckets.entries()) if (!/^\d{4}-\d{2}$/.test(bucket.bucket) || !isFiniteNonNegative(bucket.availableCapacity)) pushIssue(issues, 'INVALID_CAPACITY_BUCKET', `${path}.capacityBuckets[${index}]`, 'Capacity bucket is invalid.')
    for (const workType of duplicates(contractor.executionProfiles.map((profile) => profile.workType))) pushIssue(issues, 'DUPLICATE_EXECUTION_PROFILE', `${path}.executionProfiles`, `Duplicate execution profile: ${workType}`)
    for (const [index, profile] of contractor.executionProfiles.entries()) {
      if (!profile.workType.trim() || !isFinitePositive(profile.capacityMultiplier)) pushIssue(issues, 'INVALID_EXECUTION_PROFILE', `${path}.executionProfiles[${index}]`, 'Execution profile requires work type and positive capacity multiplier.')
      if (profile.laborHoursPerUnit != null && !isFiniteNonNegative(profile.laborHoursPerUnit)) pushIssue(issues, 'INVALID_EXECUTION_PROFILE', `${path}.executionProfiles[${index}].laborHoursPerUnit`, 'Labor hours per unit must be non-negative.')
      if (profile.equipmentHoursPerUnit != null && !isFiniteNonNegative(profile.equipmentHoursPerUnit)) pushIssue(issues, 'INVALID_EXECUTION_PROFILE', `${path}.executionProfiles[${index}].equipmentHoursPerUnit`, 'Equipment hours per unit must be non-negative.')
    }
    validateProvenance(issues, `${path}.provenance.capacityBuckets`, contractor.provenance?.capacityBuckets, 'OPERATIONS', scenario)
    validateProvenance(issues, `${path}.provenance.equipment`, contractor.provenance?.equipment, 'OPERATIONS', scenario)
    validateProvenance(issues, `${path}.provenance.certifications`, contractor.provenance?.certifications, 'OPERATIONS', scenario)
    validateProvenance(issues, `${path}.provenance.executionProfiles`, contractor.provenance?.executionProfiles, 'OPERATIONS', scenario)

    for (const id of duplicates(contractor.contracts.map((contract) => contract.id))) pushIssue(issues, 'DUPLICATE_CONTRACT_ID', `${path}.contracts`, `Duplicate contract id for ${contractor.id}: ${id}`)
    for (const [contractIndex, contract] of contractor.contracts.entries()) {
      const contractPath = `${path}.contracts[${contractIndex}]`
      if (!contract.id.trim()) pushIssue(issues, 'INVALID_CONTRACT_ID', `${contractPath}.id`, 'Contract id is required.')
      if (!isIsoDate(contract.validFrom) || !isIsoDate(contract.validTo) || contract.validFrom > contract.validTo) pushIssue(issues, 'INVALID_CONTRACT_DATES', contractPath, 'Contract dates are invalid.')
      if (!isFiniteNonNegative(contract.consumedVolumeToDate)) pushIssue(issues, 'INVALID_CONSUMED_VOLUME', `${contractPath}.consumedVolumeToDate`, 'Consumed volume must be non-negative.')
      if (!isFiniteNonNegative(contract.remainingMinVolume) || !isFiniteNonNegative(contract.remainingMaxVolume) || contract.remainingMinVolume > contract.remainingMaxVolume + EPSILON) pushIssue(issues, 'INVALID_REMAINING_VOLUME', contractPath, 'Remaining contract volume is invalid.')
      if (contract.maxVolume != null && (!isFiniteNonNegative(contract.maxVolume) || contract.consumedVolumeToDate + contract.remainingMaxVolume > contract.maxVolume + EPSILON)) pushIssue(issues, 'INCONSISTENT_VOLUME_STATE', contractPath, 'Contract volume state is inconsistent.')
      const rateKeys = contract.rates.map((rate) => `${rate.workType}::${rate.quantityUnit}`)
      for (const key of duplicates(rateKeys)) pushIssue(issues, 'DUPLICATE_RATE', `${contractPath}.rates`, `Duplicate rate key: ${key}`)
      for (const [rateIndex, rate] of contract.rates.entries()) {
        const numeric = [rate.unitRate, rate.laborRate, rate.equipmentRate, rate.mobilizationCost, rate.overtimeCost]
        if (numeric.some((value) => value != null && !isFiniteNonNegative(value))) pushIssue(issues, 'INVALID_RATE', `${contractPath}.rates[${rateIndex}]`, 'Rate components must be finite and non-negative.')
      }
      validateProvenance(issues, `${contractPath}.provenance.eligibility`, contract.provenance?.eligibility, 'PROCUREMENT', scenario)
      validateProvenance(issues, `${contractPath}.provenance.rates`, contract.provenance?.rates, 'PROCUREMENT', scenario)
      validateProvenance(issues, `${contractPath}.provenance.volumeState`, contract.provenance?.volumeState, 'PROCUREMENT', scenario)
    }
  }
  return issues
}

function executionEstimate(contractor: Contractor, unit: AllocationUnit): CandidateExecutionEstimate {
  const profile = contractor.executionProfiles.find((item) => item.workType === unit.workType)
  const multiplier = profile?.capacityMultiplier ?? 1
  return {
    capacityRequirements: unit.capacityRequirements.map((requirement) => ({
      bucket: requirement.bucket,
      demand: requirement.demand * multiplier,
    })),
    expectedLaborHours:
      profile?.laborHoursPerUnit != null ? profile.laborHoursPerUnit * unit.quantity : (unit.expectedLaborHours ?? null),
    expectedEquipmentHours:
      profile?.equipmentHoursPerUnit != null
        ? profile.equipmentHoursPerUnit * unit.quantity
        : (unit.expectedEquipmentHours ?? null),
  }
}

function matchingRate(contract: ContractorContract, unit: AllocationUnit) {
  return contract.rates.find((rate) => rate.workType === unit.workType && rate.quantityUnit === unit.quantityUnit)
}

function estimateCost(contract: ContractorContract, unit: AllocationUnit, estimate: CandidateExecutionEstimate): number | null {
  const rate = matchingRate(contract, unit)
  if (!rate) return null
  const fixed = (rate.mobilizationCost ?? 0) + (rate.overtimeCost ?? 0)
  if (contract.pricingModel === 'UNIT_PRICE') return rate.unitRate == null ? null : unit.quantity * rate.unitRate + fixed
  if (estimate.expectedLaborHours == null || estimate.expectedEquipmentHours == null) return null
  if (rate.laborRate == null || rate.equipmentRate == null) return null
  return estimate.expectedLaborHours * rate.laborRate + estimate.expectedEquipmentHours * rate.equipmentRate + fixed
}

function contractCoversExecution(contract: ContractorContract, unit: AllocationUnit) {
  return contract.validFrom <= unit.executionStart && contract.validTo >= unit.executionEnd
}

function contractorLevelReasons(contractor: Contractor, unit: AllocationUnit, scenario: ContractorAllocationScenario, estimate: CandidateExecutionEstimate): FeasibilityReason[] {
  if (!unitInputsTrusted(unit, scenario) || !contractorInputsTrusted(contractor, scenario)) return ['UNTRUSTED_INPUT']
  const reasons: FeasibilityReason[] = []
  const capacity = new Map(contractor.capacityBuckets.map((bucket) => [bucket.bucket, bucket.availableCapacity]))
  for (const requirement of estimate.capacityRequirements) {
    if (!capacity.has(requirement.bucket)) reasons.push('CAPACITY_BUCKET_MISSING')
    else if ((capacity.get(requirement.bucket) ?? 0) + EPSILON < requirement.demand) reasons.push('NO_CAPACITY')
  }
  if (unit.executionEnd > unit.deadline) reasons.push('SLA_IMPOSSIBLE')
  if (!includesAll(contractor.equipment, unit.requiredEquipment)) reasons.push('MISSING_EQUIPMENT')
  if (!includesAll(contractor.certifications, unit.requiredCertifications)) reasons.push('MISSING_CERTIFICATION')
  return [...new Set(reasons)]
}

function evaluateContract(contractor: Contractor, contract: ContractorContract, unit: AllocationUnit, scenario: ContractorAllocationScenario, estimate: CandidateExecutionEstimate): FeasibleAlternative | RejectedAlternative {
  const reasons: FeasibilityReason[] = []
  if (!contractInputsTrusted(contract, scenario)) reasons.push('UNTRUSTED_INPUT')
  if (!contract.approved) reasons.push('NOT_APPROVED')
  if (contract.approved && !contractCoversExecution(contract, unit)) reasons.push('CONTRACT_OUTSIDE_EXECUTION_WINDOW')
  if (contract.approved && contractCoversExecution(contract, unit) && !contract.territories.includes(unit.territory)) reasons.push('TERRITORY_NOT_ALLOWED')
  if (contract.approved && contractCoversExecution(contract, unit) && contract.territories.includes(unit.territory) && !contract.workTypes.includes(unit.workType)) reasons.push('WORK_TYPE_NOT_ALLOWED')
  if (contract.remainingMaxVolume + EPSILON < unit.contractVolume) reasons.push('CONTRACT_VOLUME_LIMIT')
  if (!matchingRate(contract, unit) && !reasons.length) reasons.push('RATE_NOT_CONFIGURED')
  if (reasons.length) return { contractorId: contractor.id, contractorName: contractor.name, contractId: contract.id, reasons: [...new Set(reasons)] }
  const expectedCost = estimateCost(contract, unit, estimate)
  return {
    contractorId: contractor.id,
    contractorName: contractor.name,
    contractId: contract.id,
    pricingModel: contract.pricingModel,
    expectedCost,
    requiresException: contract.pricingModel === 'TIME_AND_EQUIPMENT' && expectedCost == null,
    executionEstimate: estimate,
  }
}

function candidatesForContractor(contractor: Contractor, unit: AllocationUnit, scenario: ContractorAllocationScenario) {
  const estimate = executionEstimate(contractor, unit)
  const hardReasons = contractorLevelReasons(contractor, unit, scenario, estimate)
  if (hardReasons.length) return { feasible: [] as FeasibleAlternative[], rejected: [{ contractorId: contractor.id, contractorName: contractor.name, reasons: hardReasons }] as RejectedAlternative[] }
  const evaluated = contractor.contracts.map((contract) => evaluateContract(contractor, contract, unit, scenario, estimate))
  return {
    feasible: evaluated.filter((candidate): candidate is FeasibleAlternative => 'pricingModel' in candidate),
    rejected: evaluated.filter((candidate): candidate is RejectedAlternative => 'reasons' in candidate),
  }
}

export function analyzeAllocationUnit(scenario: ContractorAllocationScenario, unit: AllocationUnit): UnitDecisionAnalysis {
  const candidates = scenario.contractors.map((contractor) => candidatesForContractor(contractor, unit, scenario))
  const feasible = candidates.flatMap((candidate) => candidate.feasible)
  const rejected = candidates.flatMap((candidate) => candidate.rejected)
  const costed = feasible.filter((candidate): candidate is CostedCandidate => candidate.expectedCost != null && !candidate.requiresException)
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
            .filter((candidate): candidate is CostedCandidate => candidate.expectedCost != null && !candidate.requiresException)
            .map((candidate) => ({ candidate, objectiveCost: candidate.expectedCost, reservation: false }))
      const forced = forcedContractorByUnit?.get(analysis.unit.id)
      if (forced) candidates = candidates.filter(({ candidate }) => candidate.contractorId === forced)
      candidates.sort((a, b) => a.objectiveCost - b.objectiveCost || a.candidate.contractorId.localeCompare(b.candidate.contractorId) || a.candidate.contractId.localeCompare(b.candidate.contractId))
      return { analysis, candidates }
    })
    .sort((a, b) => a.candidates.length - b.candidates.length || b.analysis.unit.priority - a.analysis.unit.priority || a.analysis.unit.id.localeCompare(b.analysis.unit.id))
}

function buildContractLimits(scenario: ContractorAllocationScenario, units: SearchUnit[]) {
  const candidateKeys = new Set(units.flatMap((unit) => unit.candidates.map(({ candidate }) => contractKey(candidate.contractorId, candidate.contractId))))
  const limits = new Map<string, ContractLimit>()
  for (const contractor of scenario.contractors) {
    for (const contract of contractor.contracts) {
      const key = contractKey(contractor.id, contract.id)
      if (candidateKeys.has(key) || contract.remainingMinVolume > EPSILON) limits.set(key, { min: contract.remainingMinVolume, max: contract.remainingMaxVolume })
    }
  }
  return limits
}

function buildRemainingCapacity(scenario: ContractorAllocationScenario) {
  const remaining = new Map<string, number>()
  for (const contractor of scenario.contractors) for (const bucket of contractor.capacityBuckets) remaining.set(capacityKey(contractor.id, bucket.bucket), bucket.availableCapacity)
  return remaining
}

function canConsumeCapacity(remaining: Map<string, number>, candidate: FeasibleAlternative) {
  return candidate.executionEstimate.capacityRequirements.every((requirement) => (remaining.get(capacityKey(candidate.contractorId, requirement.bucket)) ?? Number.NEGATIVE_INFINITY) + EPSILON >= requirement.demand)
}

function consumeCapacity(remaining: Map<string, number>, candidate: FeasibleAlternative, direction: 1 | -1) {
  for (const requirement of candidate.executionEstimate.capacityRequirements) {
    const key = capacityKey(candidate.contractorId, requirement.bucket)
    remaining.set(key, (remaining.get(key) ?? 0) - direction * requirement.demand)
  }
}

function computeGapPct(bestCost: number, lowerBound: number) {
  if (!Number.isFinite(bestCost) || !Number.isFinite(lowerBound)) return null
  return Math.max(0, ((bestCost - lowerBound) / Math.max(Math.abs(bestCost), EPSILON)) * 100)
}

function optimizeDecisionUnits(scenario: ContractorAllocationScenario, analyses: UnitDecisionAnalysis[], options: SearchOptions): SearchResult {
  const units = buildSearchUnits(analyses, options.forcedContractorByUnit)
  if (!units.length) return { status: 'OPTIMAL', selectedByUnit: new Map(), totalCost: 0, exploredNodes: 0, lowerBound: 0, optimalityGapPct: 0 }
  if (units.some((unit) => !unit.candidates.length)) return { status: 'INFEASIBLE', selectedByUnit: new Map(), totalCost: Number.POSITIVE_INFINITY, exploredNodes: 0, lowerBound: null, optimalityGapPct: null }

  const contractLimits = buildContractLimits(scenario, units)
  const contractIds = [...contractLimits.keys()].sort()
  const remainingCapacity = buildRemainingCapacity(scenario)
  const contractUsedVolume = new Map<string, number>(contractIds.map((key) => [key, 0]))
  const suffixMinimum = new Array<number>(units.length + 1).fill(0)
  for (let i = units.length - 1; i >= 0; i -= 1) suffixMinimum[i] = suffixMinimum[i + 1] + units[i].candidates[0].objectiveCost
  const rootLowerBound = suffixMinimum[0]
  const suffixContractPotential = new Map<string, number[]>()
  for (const key of contractIds) {
    const potential = new Array<number>(units.length + 1).fill(0)
    for (let i = units.length - 1; i >= 0; i -= 1) potential[i] = potential[i + 1] + (units[i].candidates.some(({ candidate }) => contractKey(candidate.contractorId, candidate.contractId) === key) ? units[i].analysis.unit.contractVolume : 0)
    suffixContractPotential.set(key, potential)
  }
  const minimaCanStillBeMet = (index: number) => contractIds.every((key) => {
    const limit = contractLimits.get(key)
    if (!limit || limit.min <= 0) return true
    return (contractUsedVolume.get(key) ?? 0) + (suffixContractPotential.get(key)?.[index] ?? 0) + EPSILON >= limit.min
  })
  const validateMinimums = () => contractIds.every((key) => {
    const limit = contractLimits.get(key)
    return !limit || (contractUsedVolume.get(key) ?? 0) + EPSILON >= limit.min
  })

  const cheapestSelection = new Map<string, SolverCandidate>()
  let cheapestFeasible = true
  for (const unit of units) {
    const selected = unit.candidates[0]
    const candidate = selected.candidate
    const key = contractKey(candidate.contractorId, candidate.contractId)
    const used = contractUsedVolume.get(key) ?? 0
    const limit = contractLimits.get(key)
    if (!canConsumeCapacity(remainingCapacity, candidate) || used + unit.analysis.unit.contractVolume > (limit?.max ?? Number.POSITIVE_INFINITY) + EPSILON) {
      cheapestFeasible = false
      break
    }
    consumeCapacity(remainingCapacity, candidate, 1)
    contractUsedVolume.set(key, used + unit.analysis.unit.contractVolume)
    cheapestSelection.set(unit.analysis.unit.id, selected)
  }
  if (cheapestFeasible && validateMinimums()) return { status: 'OPTIMAL', selectedByUnit: cheapestSelection, totalCost: rootLowerBound, exploredNodes: units.length, lowerBound: rootLowerBound, optimalityGapPct: 0 }

  const resetCapacity = buildRemainingCapacity(scenario)
  remainingCapacity.clear()
  for (const [key, value] of resetCapacity) remainingCapacity.set(key, value)
  contractUsedVolume.clear()
  for (const key of contractIds) contractUsedVolume.set(key, 0)

  let bestCost = Number.POSITIVE_INFINITY
  let best = new Map<string, SolverCandidate>()
  const selected = new Map<string, SolverCandidate>()
  let exploredNodes = 0
  let truncated = false
  const maxNodes = Math.max(0, options.maxSearchNodes ?? DEFAULT_MAX_SEARCH_NODES)

  const visit = (index: number, cost: number) => {
    if (truncated) return
    exploredNodes += 1
    if (exploredNodes > maxNodes) {
      truncated = true
      return
    }
    if (cost + suffixMinimum[index] >= bestCost - EPSILON || !minimaCanStillBeMet(index)) return
    if (index === units.length) {
      if (!validateMinimums()) return
      bestCost = cost
      best = new Map(selected)
      return
    }
    const unit = units[index]
    for (const solverCandidate of unit.candidates) {
      const candidate = solverCandidate.candidate
      if (!canConsumeCapacity(remainingCapacity, candidate)) continue
      const key = contractKey(candidate.contractorId, candidate.contractId)
      const limit = contractLimits.get(key)
      const currentVolume = contractUsedVolume.get(key) ?? 0
      if (currentVolume + unit.analysis.unit.contractVolume > (limit?.max ?? Number.POSITIVE_INFINITY) + EPSILON) continue
      consumeCapacity(remainingCapacity, candidate, 1)
      contractUsedVolume.set(key, currentVolume + unit.analysis.unit.contractVolume)
      selected.set(unit.analysis.unit.id, solverCandidate)
      visit(index + 1, cost + solverCandidate.objectiveCost)
      selected.delete(unit.analysis.unit.id)
      contractUsedVolume.set(key, currentVolume)
      consumeCapacity(remainingCapacity, candidate, -1)
    }
  }
  visit(0, 0)

  if (truncated) {
    if (Number.isFinite(bestCost)) return { status: 'FEASIBLE_NOT_PROVEN', selectedByUnit: best, totalCost: bestCost, exploredNodes, lowerBound: rootLowerBound, optimalityGapPct: computeGapPct(bestCost, rootLowerBound) }
    return { status: 'UNKNOWN', selectedByUnit: new Map(), totalCost: Number.POSITIVE_INFINITY, exploredNodes, lowerBound: rootLowerBound, optimalityGapPct: null }
  }
  if (!Number.isFinite(bestCost)) return { status: 'INFEASIBLE', selectedByUnit: new Map(), totalCost: Number.POSITIVE_INFINITY, exploredNodes, lowerBound: null, optimalityGapPct: null }
  return { status: 'OPTIMAL', selectedByUnit: best, totalCost: bestCost, exploredNodes, lowerBound: bestCost, optimalityGapPct: 0 }
}

function observedFeasibleCandidate(analysis: UnitDecisionAnalysis) {
  if (!analysis.unit.observedContractorId) return undefined
  const candidates = analysis.feasible.filter((candidate) => candidate.contractorId === analysis.unit.observedContractorId)
  if (analysis.unit.observedContractId) return candidates.find((candidate) => candidate.contractId === analysis.unit.observedContractId)
  return candidates.length === 1 ? candidates[0] : undefined
}

function observedCostedCandidate(analysis: UnitDecisionAnalysis) {
  const candidate = observedFeasibleCandidate(analysis)
  if (!candidate || candidate.expectedCost == null || candidate.requiresException) return undefined
  return candidate as CostedCandidate
}

function validateObservedPortfolio(scenario: ContractorAllocationScenario, analyses: UnitDecisionAnalysis[]) {
  const invalid = new Set<string>()
  const capacityUsage = new Map<string, number>()
  const contractUsage = new Map<string, number>()
  for (const analysis of analyses) {
    if (analysis.type === 'INFEASIBLE') continue
    const candidate = observedFeasibleCandidate(analysis)
    if (!candidate) {
      invalid.add(analysis.unit.id)
      continue
    }
    for (const requirement of candidate.executionEstimate.capacityRequirements) {
      const key = capacityKey(candidate.contractorId, requirement.bucket)
      capacityUsage.set(key, (capacityUsage.get(key) ?? 0) + requirement.demand)
    }
    const key = contractKey(candidate.contractorId, candidate.contractId)
    contractUsage.set(key, (contractUsage.get(key) ?? 0) + analysis.unit.contractVolume)
  }
  const availableCapacity = buildRemainingCapacity(scenario)
  for (const analysis of analyses) {
    const candidate = observedFeasibleCandidate(analysis)
    if (!candidate) continue
    if (candidate.executionEstimate.capacityRequirements.some((requirement) => (capacityUsage.get(capacityKey(candidate.contractorId, requirement.bucket)) ?? 0) > (availableCapacity.get(capacityKey(candidate.contractorId, requirement.bucket)) ?? 0) + EPSILON)) invalid.add(analysis.unit.id)
  }
  for (const contractor of scenario.contractors) {
    for (const contract of contractor.contracts) {
      const key = contractKey(contractor.id, contract.id)
      const usage = contractUsage.get(key) ?? 0
      if (usage > contract.remainingMaxVolume + EPSILON || usage + EPSILON < contract.remainingMinVolume) {
        for (const analysis of analyses) {
          const candidate = observedFeasibleCandidate(analysis)
          if (candidate && contractKey(candidate.contractorId, candidate.contractId) === key) invalid.add(analysis.unit.id)
        }
      }
    }
  }
  return [...invalid].sort()
}

function globalMetricsAndImpacts(
  scenario: ContractorAllocationScenario,
  analyses: UnitDecisionAnalysis[],
  baseSearch: SearchResult,
  options: OptimizerOptions
): { metrics: DecisionSpaceMetrics; impacts: Record<string, PortfolioAlternativeImpact[]> } {
  let spendWithChoice = 0
  let spreadWeighted = 0
  let spreadWeight = 0
  let decisionUnits = 0
  let globalChoiceUnknownUnits = 0
  const impacts: Record<string, PortfolioAlternativeImpact[]> = {}
  const localDecisions = analyses.filter((analysis) => analysis.type === 'ALLOCATION_DECISION_REQUIRED')
  if (!analyses.some((analysis) => analysis.type === 'INFEASIBLE')) {
    for (const analysis of localDecisions) {
      const contractorIds = [...new Set(analysis.feasible.filter((candidate) => candidate.expectedCost != null && !candidate.requiresException).map((candidate) => candidate.contractorId))]
      const unitImpacts: PortfolioAlternativeImpact[] = []
      for (const contractorId of contractorIds) {
        const probe = optimizeDecisionUnits(scenario, analyses, {
          maxSearchNodes: Math.min(options.maxSearchNodes ?? GLOBAL_CHOICE_PROBE_NODES, GLOBAL_CHOICE_PROBE_NODES),
          forcedContractorByUnit: new Map([[analysis.unit.id, contractorId]]),
        })
        if (probe.status === 'OPTIMAL' || probe.status === 'FEASIBLE_NOT_PROVEN') {
          const selected = probe.selectedByUnit.get(analysis.unit.id)?.candidate
          unitImpacts.push({
            contractorId,
            contractorName: selected?.contractorName ?? contractorId,
            contractId: selected?.contractId ?? null,
            expectedCost: selected?.expectedCost ?? null,
            portfolioExpectedCost: probe.totalCost,
            portfolioDelta: Number.isFinite(baseSearch.totalCost) ? probe.totalCost - baseSearch.totalCost : null,
            status: baseSearch.selectedByUnit.get(analysis.unit.id)?.candidate.contractorId === contractorId ? 'SELECTED' : 'FEASIBLE',
          })
        } else {
          unitImpacts.push({
            contractorId,
            contractorName: analysis.feasible.find((candidate) => candidate.contractorId === contractorId)?.contractorName ?? contractorId,
            contractId: null,
            expectedCost: null,
            portfolioExpectedCost: null,
            portfolioDelta: null,
            status: probe.status === 'UNKNOWN' ? 'UNKNOWN' : 'INFEASIBLE',
          })
        }
      }
      impacts[analysis.unit.id] = unitImpacts.sort((a, b) => (a.portfolioDelta ?? Number.POSITIVE_INFINITY) - (b.portfolioDelta ?? Number.POSITIVE_INFINITY) || a.contractorId.localeCompare(b.contractorId))
      const feasible = unitImpacts.filter((impact) => impact.status === 'SELECTED' || impact.status === 'FEASIBLE')
      if (feasible.length >= 2) {
        decisionUnits += 1
        const observed = observedCostedCandidate(analysis)
        if (observed) {
          const costs = feasible.map((impact) => impact.expectedCost).filter((cost): cost is number => cost != null)
          if (costs.length >= 2) {
            const min = Math.min(...costs)
            const max = Math.max(...costs)
            const spread = min > 0 ? (max - min) / min : 0
            spendWithChoice += observed.expectedCost
            spreadWeighted += observed.expectedCost * spread
            spreadWeight += observed.expectedCost
          }
        }
      } else if (unitImpacts.some((impact) => impact.status === 'UNKNOWN')) globalChoiceUnknownUnits += 1
    }
  }
  const totalUnits = analyses.length
  return {
    impacts,
    metrics: {
      totalUnits,
      infeasibleUnits: analyses.filter((analysis) => analysis.type === 'INFEASIBLE').length,
      noChoiceUnits: analyses.filter((analysis) => analysis.type === 'NO_CHOICE').length,
      localDecisionUnits: localDecisions.length,
      decisionUnits,
      globalChoiceUnknownUnits,
      decisionSpaceRatio: totalUnits ? decisionUnits / totalUnits : 0,
      spendWithChoice,
      weightedChoiceSpreadPct: spreadWeight ? (spreadWeighted / spreadWeight) * 100 : 0,
    },
  }
}

function overallStatus(search: SearchResult, analyses: UnitDecisionAnalysis[]): ContractorAllocationResult['status'] {
  if (analyses.some((analysis) => analysis.type === 'INFEASIBLE')) return 'INFEASIBLE'
  const partial = analyses.some((analysis) => analysis.type === 'EXCEPTION_REQUIRED')
  if (search.status === 'OPTIMAL') return partial ? 'PARTIAL_OPTIMAL' : 'OPTIMAL'
  if (search.status === 'FEASIBLE_NOT_PROVEN') return partial ? 'PARTIAL_FEASIBLE_NOT_PROVEN' : 'FEASIBLE_NOT_PROVEN'
  return search.status
}

export function optimizeContractorAllocation(scenario: ContractorAllocationScenario, options: OptimizerOptions = {}): ContractorAllocationResult {
  const scenarioSnapshot = createScenarioInputSnapshot(scenario)
  const validationIssues = validateContractorAllocationScenario(scenario)
  const analyses = analyzeDecisionSpace(scenario)
  const coveredAnalyses = analyses.filter((analysis) => analysis.type === 'NO_CHOICE' || analysis.type === 'ALLOCATION_DECISION_REQUIRED')
  const observedExpectedSpend = coveredAnalyses.reduce((sum, analysis) => sum + (observedCostedCandidate(analysis)?.expectedCost ?? 0), 0)
  const coverage = {
    totalUnits: analyses.length,
    coveredUnits: coveredAnalyses.length,
    exceptionUnits: analyses.filter((analysis) => analysis.type === 'EXCEPTION_REQUIRED').length,
    infeasibleUnits: analyses.filter((analysis) => analysis.type === 'INFEASIBLE').length,
    coverageRatio: analyses.length ? coveredAnalyses.length / analyses.length : 0,
    coveredObservedExpectedSpend: observedExpectedSpend,
  }

  if (validationIssues.length) {
    return {
      scenarioId: scenario.id,
      optimizerVersion: CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION,
      status: 'INVALID_INPUT',
      analyses,
      assignments: [],
      reservations: [],
      portfolioImpacts: {},
      unresolvedUnitIds: analyses.map((analysis) => analysis.unit.id),
      observedInvalidUnitIds: [],
      observedExpectedSpend,
      qdipExpectedSpend: 0,
      counterfactualAllocationAdvantage: null,
      coverage,
      metrics: { totalUnits: analyses.length, infeasibleUnits: coverage.infeasibleUnits, noChoiceUnits: 0, localDecisionUnits: 0, decisionUnits: 0, globalChoiceUnknownUnits: 0, decisionSpaceRatio: 0, spendWithChoice: 0, weightedChoiceSpreadPct: 0 },
      exploredNodes: 0,
      lowerBound: null,
      optimalityGapPct: null,
      validationIssues,
      scenarioSnapshot,
    }
  }

  const search = analyses.some((analysis) => analysis.type === 'INFEASIBLE')
    ? { status: 'INFEASIBLE' as const, selectedByUnit: new Map<string, SolverCandidate>(), totalCost: Number.POSITIVE_INFINITY, exploredNodes: 0, lowerBound: null, optimalityGapPct: null }
    : optimizeDecisionUnits(scenario, analyses, options)
  const status = overallStatus(search, analyses)
  const assignments: AllocationAssignment[] = []
  const reservations: AllocationReservation[] = []
  if (['OPTIMAL', 'PARTIAL_OPTIMAL', 'FEASIBLE_NOT_PROVEN', 'PARTIAL_FEASIBLE_NOT_PROVEN'].includes(status)) {
    for (const analysis of searchableAnalyses(analyses)) {
      const selected = search.selectedByUnit.get(analysis.unit.id)
      if (!selected) continue
      const candidate = selected.candidate
      if (selected.reservation) {
        reservations.push({ allocationUnitId: analysis.unit.id, contractorId: candidate.contractorId, contractorName: candidate.contractorName, contractId: candidate.contractId, reason: 'COST_UNCERTAIN', inputSnapshotId: scenarioSnapshot.id })
      } else if (candidate.expectedCost != null) {
        const observed = observedCostedCandidate(analysis)
        assignments.push({ allocationUnitId: analysis.unit.id, contractorId: candidate.contractorId, contractorName: candidate.contractorName, contractId: candidate.contractId, expectedCost: candidate.expectedCost, observedContractorId: analysis.unit.observedContractorId, observedContractId: analysis.unit.observedContractId, observedExpectedCost: observed?.expectedCost, expectedDelta: observed ? observed.expectedCost - candidate.expectedCost : undefined, inputSnapshotId: scenarioSnapshot.id })
      }
    }
  }

  const observedInvalidUnitIds = validateObservedPortfolio(scenario, analyses)
  const qdipExpectedSpend = assignments.reduce((sum, assignment) => sum + assignment.expectedCost, 0)
  const { metrics, impacts } = globalMetricsAndImpacts(scenario, analyses, search, options)
  const counterfactualAllocationAdvantage =
    status === 'OPTIMAL' &&
    coverage.coverageRatio === 1 &&
    scenario.constraintCoverageStatus === 'COMPLETE' &&
    !observedInvalidUnitIds.length &&
    assignments.length === coveredAnalyses.length
      ? observedExpectedSpend - qdipExpectedSpend
      : null

  return {
    scenarioId: scenario.id,
    optimizerVersion: CONTRACTOR_ALLOCATION_OPTIMIZER_VERSION,
    status,
    analyses,
    assignments: assignments.sort((a, b) => a.allocationUnitId.localeCompare(b.allocationUnitId)),
    reservations: reservations.sort((a, b) => a.allocationUnitId.localeCompare(b.allocationUnitId)),
    portfolioImpacts: impacts,
    unresolvedUnitIds: analyses.filter((analysis) => analysis.type === 'INFEASIBLE' || analysis.type === 'EXCEPTION_REQUIRED').map((analysis) => analysis.unit.id),
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
