export type AllocationUnitType = 'WORK_ORDER' | 'WORK_PACKAGE' | 'CIRCUIT' | 'AWARDED_VOLUME'
export type PricingModel = 'UNIT_PRICE' | 'TIME_AND_EQUIPMENT'
export type SourceRole = 'INSPECTOR' | 'PROCUREMENT' | 'OPERATIONS' | 'PLANNER'

export type InputProvenance<Role extends SourceRole = SourceRole> = {
  sourceRole: Role
  sourceSystem: string
  sourceRecordId: string
  capturedAt: string
}

export type AllocationUnitProvenance = {
  scope: InputProvenance<'INSPECTOR'>
  quantity: InputProvenance<'INSPECTOR'>
  territory: InputProvenance<'INSPECTOR'>
  workType: InputProvenance<'INSPECTOR'>
  technicalRequirements: InputProvenance<'INSPECTOR'>
  deadline: InputProvenance<'OPERATIONS'>
  capacityRequirements: InputProvenance<'OPERATIONS'>
  contractVolume: InputProvenance<'PROCUREMENT'>
  teEstimate?: InputProvenance<'OPERATIONS'>
}

export type ContractorProvenance = {
  capacityBuckets: InputProvenance<'OPERATIONS'>
  equipment: InputProvenance<'OPERATIONS'>
  certifications: InputProvenance<'OPERATIONS'>
}

export type ContractProvenance = {
  eligibility: InputProvenance<'PROCUREMENT'>
  rates: InputProvenance<'PROCUREMENT'>
  volumeState: InputProvenance<'PROCUREMENT'>
}

export type FeasibilityReason =
  | 'CONTRACT_EXPIRED'
  | 'NOT_APPROVED'
  | 'TERRITORY_NOT_ALLOWED'
  | 'WORK_TYPE_NOT_ALLOWED'
  | 'NO_CAPACITY'
  | 'CAPACITY_BUCKET_MISSING'
  | 'MISSING_EQUIPMENT'
  | 'MISSING_CERTIFICATION'
  | 'SLA_IMPOSSIBLE'
  | 'CONTRACT_VOLUME_LIMIT'
  | 'RATE_NOT_CONFIGURED'
  | 'UNTRUSTED_INPUT'
  | 'T&E_REQUIRES_EXCEPTION'

export type DecisionType = 'INFEASIBLE' | 'NO_CHOICE' | 'ALLOCATION_DECISION_REQUIRED' | 'EXCEPTION_REQUIRED'

export type ContractRate = {
  workType: string
  quantityUnit: string
  unitRate?: number
  laborRate?: number
  equipmentRate?: number
  mobilizationCost?: number
  overtimeCost?: number
}

export type ContractorContract = {
  id: string
  approved: boolean
  validFrom: string
  validTo: string
  territories: string[]
  workTypes: string[]
  pricingModel: PricingModel
  rates: ContractRate[]
  minVolume?: number
  maxVolume?: number
  awardedCapacity?: number
  /** Volume already consumed before scenario.asOf. */
  consumedVolumeToDate: number
  provenance: ContractProvenance
}

export type CapacityBucket = {
  /** ISO calendar bucket, YYYY-MM for the current Observatory model. */
  bucket: string
  /** Remaining normalized workload capacity in this bucket as of scenario.asOf. */
  availableCapacity: number
}

export type CapacityRequirement = {
  bucket: string
  demand: number
}

export type Contractor = {
  id: string
  name: string
  capacityBuckets: CapacityBucket[]
  equipment: string[]
  certifications: string[]
  contracts: ContractorContract[]
  provenance: ContractorProvenance
}

export type AllocationUnit = {
  id: string
  type: AllocationUnitType
  territory: string
  workType: string
  quantity: number
  quantityUnit: string
  /** Operational workload consumed in each execution bucket. */
  capacityRequirements: CapacityRequirement[]
  /** Procurement volume consumed against the selected contract. */
  contractVolume: number
  deadline: string
  priority: number
  requiredEquipment: string[]
  requiredCertifications: string[]
  scopeId: string
  scopeVersion: number
  expectedLaborHours?: number
  expectedEquipmentHours?: number
  observedContractorId?: string
  observedContractId?: string
  provenance: AllocationUnitProvenance
}

export type ContractorAllocationScenario = {
  id: string
  asOf: string
  allocationLevel: AllocationUnitType
  units: AllocationUnit[]
  contractors: Contractor[]
}

export type RejectedAlternative = {
  contractorId: string
  contractorName: string
  contractId?: string
  reasons: FeasibilityReason[]
}

export type FeasibleAlternative = {
  contractorId: string
  contractorName: string
  contractId: string
  pricingModel: PricingModel
  expectedCost: number | null
  requiresException: boolean
}

export type UnitDecisionAnalysis = {
  unit: AllocationUnit
  type: DecisionType
  feasible: FeasibleAlternative[]
  rejected: RejectedAlternative[]
}

export type ScenarioInputSnapshot = {
  id: string
  algorithm: 'SHA-256'
  canonicalInput: string
}

export type AllocationAssignment = {
  allocationUnitId: string
  contractorId: string
  contractorName: string
  contractId: string
  expectedCost: number
  observedContractorId?: string
  observedContractId?: string
  observedExpectedCost?: number
  expectedDelta?: number
  inputSnapshotId: string
}

export type OptimizerStatus = 'OPTIMAL' | 'FEASIBLE_NOT_PROVEN' | 'INFEASIBLE' | 'UNKNOWN'

export type DecisionSpaceMetrics = {
  totalUnits: number
  infeasibleUnits: number
  noChoiceUnits: number
  decisionUnits: number
  exceptionUnits: number
  decisionSpaceRatio: number
  spendWithChoice: number
  weightedChoiceSpreadPct: number
}

export type ContractorAllocationResult = {
  scenarioId: string
  optimizerVersion: string
  status: OptimizerStatus
  analyses: UnitDecisionAnalysis[]
  assignments: AllocationAssignment[]
  unresolvedUnitIds: string[]
  observedInvalidUnitIds: string[]
  observedExpectedSpend: number
  qdipExpectedSpend: number
  counterfactualAllocationAdvantage: number | null
  metrics: DecisionSpaceMetrics
  exploredNodes: number
  lowerBound: number | null
  optimalityGapPct: number | null
  scenarioSnapshot: ScenarioInputSnapshot
}
