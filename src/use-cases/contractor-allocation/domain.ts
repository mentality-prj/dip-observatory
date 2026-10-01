export type AllocationUnitType = 'WORK_ORDER' | 'WORK_PACKAGE' | 'CIRCUIT' | 'AWARDED_VOLUME'
export type PricingModel = 'UNIT_PRICE' | 'TIME_AND_EQUIPMENT'
export type SourceRole = 'INSPECTOR' | 'PROCUREMENT' | 'OPERATIONS' | 'PLANNER'
export type ConstraintCoverageStatus = 'COMPLETE' | 'INCOMPLETE' | 'UNKNOWN'

export type TrustedAuthority<Role extends SourceRole = SourceRole> = {
  id: string
  sourceRole: Role
  sourceSystem: string
  ingress: 'TRUSTED_ADAPTER'
}

export type InputProvenance<Role extends SourceRole = SourceRole> = {
  authorityId: string
  sourceRecordId: string
  sourceVersion: string
  capturedAt: string
  readonly __role?: Role
}

export type AllocationUnitProvenance = {
  scope: InputProvenance<'INSPECTOR'>
  quantity: InputProvenance<'INSPECTOR'>
  territory: InputProvenance<'INSPECTOR'>
  workType: InputProvenance<'INSPECTOR'>
  technicalRequirements: InputProvenance<'INSPECTOR'>
  executionWindow: InputProvenance<'OPERATIONS'>
  deadline: InputProvenance<'OPERATIONS'>
  capacityRequirements: InputProvenance<'OPERATIONS'>
  contractVolume: InputProvenance<'PROCUREMENT'>
  teEstimate?: InputProvenance<'OPERATIONS'>
}

export type ContractorProvenance = {
  capacityBuckets: InputProvenance<'OPERATIONS'>
  equipment: InputProvenance<'OPERATIONS'>
  certifications: InputProvenance<'OPERATIONS'>
  executionProfiles: InputProvenance<'OPERATIONS'>
}

export type ContractProvenance = {
  eligibility: InputProvenance<'PROCUREMENT'>
  rates: InputProvenance<'PROCUREMENT'>
  volumeState: InputProvenance<'PROCUREMENT'>
}

export type FeasibilityReason =
  | 'CONTRACT_OUTSIDE_EXECUTION_WINDOW'
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
  | 'INVALID_SCENARIO_INPUT'
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
  consumedVolumeToDate: number
  remainingMinVolume: number
  remainingMaxVolume: number
  provenance: ContractProvenance
}

export type CapacityBucket = {
  bucket: string
  availableCapacity: number
}

export type CapacityRequirement = {
  bucket: string
  demand: number
}

export type ContractorExecutionProfile = {
  workType: string
  capacityMultiplier: number
  laborHoursPerUnit?: number
  equipmentHoursPerUnit?: number
}

export type CandidateExecutionEstimate = {
  capacityRequirements: CapacityRequirement[]
  expectedLaborHours: number | null
  expectedEquipmentHours: number | null
}

export type Contractor = {
  id: string
  name: string
  capacityBuckets: CapacityBucket[]
  equipment: string[]
  certifications: string[]
  executionProfiles: ContractorExecutionProfile[]
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
  executionStart: string
  executionEnd: string
  capacityRequirements: CapacityRequirement[]
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
  decisionAt: string
  allocationLevel: AllocationUnitType
  constraintCoverageStatus: ConstraintCoverageStatus
  trustedAuthorities: TrustedAuthority[]
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
  executionEstimate: CandidateExecutionEstimate
}

export type UnitDecisionAnalysis = {
  unit: AllocationUnit
  type: DecisionType
  feasible: FeasibleAlternative[]
  rejected: RejectedAlternative[]
}

export type PortfolioAlternativeImpact = {
  contractorId: string
  contractorName: string
  contractId: string | null
  expectedCost: number | null
  portfolioExpectedCost: number | null
  portfolioDelta: number | null
  status: 'SELECTED' | 'FEASIBLE' | 'INFEASIBLE' | 'UNKNOWN'
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

export type AllocationReservation = {
  allocationUnitId: string
  contractorId: string
  contractorName: string
  contractId: string
  reason: 'COST_UNCERTAIN'
  inputSnapshotId: string
}

export type OptimizerStatus =
  | 'OPTIMAL'
  | 'PARTIAL_OPTIMAL'
  | 'FEASIBLE_NOT_PROVEN'
  | 'PARTIAL_FEASIBLE_NOT_PROVEN'
  | 'INFEASIBLE'
  | 'UNKNOWN'
  | 'INVALID_INPUT'

export type ScenarioValidationIssue = {
  code: string
  path: string
  message: string
}

export type PortfolioCoverage = {
  totalUnits: number
  coveredUnits: number
  exceptionUnits: number
  infeasibleUnits: number
  coverageRatio: number
  coveredObservedExpectedSpend: number
}

export type DecisionSpaceMetrics = {
  totalUnits: number
  infeasibleUnits: number
  noChoiceUnits: number
  localDecisionUnits: number
  decisionUnits: number
  globalChoiceUnknownUnits: number
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
  reservations: AllocationReservation[]
  portfolioImpacts: Record<string, PortfolioAlternativeImpact[]>
  unresolvedUnitIds: string[]
  observedInvalidUnitIds: string[]
  observedExpectedSpend: number
  qdipExpectedSpend: number
  counterfactualAllocationAdvantage: number | null
  coverage: PortfolioCoverage
  metrics: DecisionSpaceMetrics
  exploredNodes: number
  lowerBound: number | null
  optimalityGapPct: number | null
  validationIssues: ScenarioValidationIssue[]
  scenarioSnapshot: ScenarioInputSnapshot
}
