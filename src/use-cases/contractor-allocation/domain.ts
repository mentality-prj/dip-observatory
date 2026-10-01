export type AllocationUnitType = 'WORK_ORDER' | 'WORK_PACKAGE' | 'CIRCUIT' | 'AWARDED_VOLUME'
export type PricingModel = 'UNIT_PRICE' | 'TIME_AND_EQUIPMENT'

export type FeasibilityReason =
  | 'CONTRACT_EXPIRED'
  | 'NOT_APPROVED'
  | 'TERRITORY_NOT_ALLOWED'
  | 'WORK_TYPE_NOT_ALLOWED'
  | 'NO_CAPACITY'
  | 'MISSING_EQUIPMENT'
  | 'MISSING_CERTIFICATION'
  | 'SLA_IMPOSSIBLE'
  | 'CONTRACT_VOLUME_LIMIT'
  | 'RATE_NOT_CONFIGURED'
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
}

export type Contractor = {
  id: string
  name: string
  /** Authoritative normalized workload capacity from Operations. */
  availableCapacity: number
  availableThrough: string
  equipment: string[]
  certifications: string[]
  contracts: ContractorContract[]
}

export type AllocationUnit = {
  id: string
  type: AllocationUnitType
  territory: string
  workType: string
  quantity: number
  quantityUnit: string
  /** Normalized operational workload consumed when this package is assigned. */
  capacityDemand: number
  /** Procurement volume consumed against min/max/awarded contract limits. */
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

export type AllocationSnapshotInput = {
  scenario: Pick<ContractorAllocationScenario, 'id' | 'asOf' | 'allocationLevel'>
  unit: AllocationUnit
  contractors: Contractor[]
  feasibleAlternatives: FeasibleAlternative[]
  rejectedAlternatives: RejectedAlternative[]
}

export type AllocationInputSnapshot = {
  id: string
  algorithm: 'SHA-256'
  canonicalInput: string
  input: AllocationSnapshotInput
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
  inputSnapshot: AllocationInputSnapshot
}

export type OptimizerStatus = 'OPTIMAL' | 'BOUNDED' | 'INFEASIBLE'

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
}
