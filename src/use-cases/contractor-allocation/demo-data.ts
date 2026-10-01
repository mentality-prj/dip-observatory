import type {
  AllocationUnit,
  Contractor,
  ContractorAllocationScenario,
  InputProvenance,
  SourceRole,
} from './domain'
import { analyzeAllocationUnit } from './optimizer'

const asOf = '2026-10-01'
const capturedAt = '2026-10-01T00:00:00Z'

function source<Role extends SourceRole>(
  sourceRole: Role,
  sourceSystem: string,
  sourceRecordId: string
): InputProvenance<Role> {
  return { sourceRole, sourceSystem, sourceRecordId, capturedAt }
}

function contractProvenance(contractId: string) {
  return {
    eligibility: source('PROCUREMENT', 'procurement-contracts', `${contractId}:eligibility`),
    rates: source('PROCUREMENT', 'procurement-contracts', `${contractId}:rates`),
    volumeState: source('PROCUREMENT', 'procurement-contracts', `${contractId}:volume-state`),
  }
}

function contractorProvenance(contractorId: string) {
  return {
    capacityBuckets: source('OPERATIONS', 'resource-capacity', `${contractorId}:capacity`),
    equipment: source('OPERATIONS', 'resource-registry', `${contractorId}:equipment`),
    certifications: source('OPERATIONS', 'resource-registry', `${contractorId}:certifications`),
  }
}

const contractors: Contractor[] = [
  {
    id: 'arbor-north',
    name: 'Arbor North',
    capacityBuckets: [
      { bucket: '2026-10', availableCapacity: 500 },
      { bucket: '2026-11', availableCapacity: 500 },
    ],
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
    provenance: contractorProvenance('arbor-north'),
    contracts: [
      {
        id: 'an-unit-2026',
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['NORTH', 'CENTRAL'],
        workTypes: ['ROUTINE_TRIM', 'HAZARD_TREE_REMOVAL'],
        pricingModel: 'UNIT_PRICE',
        maxVolume: 500,
        awardedCapacity: 500,
        consumedVolumeToDate: 120,
        provenance: contractProvenance('an-unit-2026'),
        rates: [
          { workType: 'ROUTINE_TRIM', quantityUnit: 'tree', unitRate: 115, mobilizationCost: 120 },
          { workType: 'HAZARD_TREE_REMOVAL', quantityUnit: 'tree', unitRate: 230, mobilizationCost: 180 },
        ],
      },
      {
        id: 'an-te-2026',
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['NORTH', 'CENTRAL'],
        workTypes: ['EMERGENCY_CLEARANCE'],
        pricingModel: 'TIME_AND_EQUIPMENT',
        maxVolume: 100,
        consumedVolumeToDate: 20,
        provenance: contractProvenance('an-te-2026'),
        rates: [
          {
            workType: 'EMERGENCY_CLEARANCE',
            quantityUnit: 'job',
            laborRate: 90,
            equipmentRate: 75,
            mobilizationCost: 150,
          },
        ],
      },
    ],
  },
  {
    id: 'green-line',
    name: 'Green Line Services',
    capacityBuckets: [
      { bucket: '2026-10', availableCapacity: 500 },
      { bucket: '2026-11', availableCapacity: 500 },
    ],
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
    provenance: contractorProvenance('green-line'),
    contracts: [
      {
        id: 'gl-unit-2026',
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['NORTH', 'CENTRAL', 'SOUTH'],
        workTypes: ['ROUTINE_TRIM', 'HAZARD_TREE_REMOVAL'],
        pricingModel: 'UNIT_PRICE',
        maxVolume: 500,
        awardedCapacity: 500,
        consumedVolumeToDate: 140,
        provenance: contractProvenance('gl-unit-2026'),
        rates: [
          { workType: 'ROUTINE_TRIM', quantityUnit: 'tree', unitRate: 96, mobilizationCost: 160 },
          { workType: 'HAZARD_TREE_REMOVAL', quantityUnit: 'tree', unitRate: 218, mobilizationCost: 190 },
        ],
      },
      {
        id: 'gl-te-2026',
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['NORTH', 'CENTRAL', 'SOUTH'],
        workTypes: ['EMERGENCY_CLEARANCE'],
        pricingModel: 'TIME_AND_EQUIPMENT',
        maxVolume: 100,
        consumedVolumeToDate: 15,
        provenance: contractProvenance('gl-te-2026'),
        rates: [
          {
            workType: 'EMERGENCY_CLEARANCE',
            quantityUnit: 'job',
            laborRate: 95,
            equipmentRate: 80,
            mobilizationCost: 165,
          },
        ],
      },
    ],
  },
  {
    id: 'canopy-works',
    name: 'Canopy Works',
    capacityBuckets: [
      { bucket: '2026-10', availableCapacity: 500 },
      { bucket: '2026-11', availableCapacity: 500 },
    ],
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
    provenance: contractorProvenance('canopy-works'),
    contracts: [
      {
        id: 'cw-unit-2026',
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['CENTRAL', 'SOUTH'],
        workTypes: ['ROUTINE_TRIM', 'HAZARD_TREE_REMOVAL'],
        pricingModel: 'UNIT_PRICE',
        maxVolume: 500,
        awardedCapacity: 500,
        consumedVolumeToDate: 110,
        provenance: contractProvenance('cw-unit-2026'),
        rates: [
          { workType: 'ROUTINE_TRIM', quantityUnit: 'tree', unitRate: 102, mobilizationCost: 100 },
          { workType: 'HAZARD_TREE_REMOVAL', quantityUnit: 'tree', unitRate: 185, mobilizationCost: 135 },
        ],
      },
      {
        id: 'cw-te-2026',
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['CENTRAL', 'SOUTH'],
        workTypes: ['EMERGENCY_CLEARANCE'],
        pricingModel: 'TIME_AND_EQUIPMENT',
        maxVolume: 100,
        consumedVolumeToDate: 10,
        provenance: contractProvenance('cw-te-2026'),
        rates: [
          {
            workType: 'EMERGENCY_CLEARANCE',
            quantityUnit: 'job',
            laborRate: 88,
            equipmentRate: 72,
            mobilizationCost: 125,
          },
        ],
      },
    ],
  },
  {
    id: 'line-safe',
    name: 'Line Safe Vegetation',
    capacityBuckets: [
      { bucket: '2026-10', availableCapacity: 500 },
      { bucket: '2026-11', availableCapacity: 500 },
    ],
    equipment: ['bucket-truck', 'chipper', 'crane'],
    certifications: ['line-clearance', 'arborist', 'crane-operator'],
    provenance: contractorProvenance('line-safe'),
    contracts: [
      {
        id: 'ls-unit-2026',
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['NORTH', 'CENTRAL', 'SOUTH'],
        workTypes: ['ROUTINE_TRIM', 'HAZARD_TREE_REMOVAL'],
        pricingModel: 'UNIT_PRICE',
        maxVolume: 500,
        awardedCapacity: 500,
        consumedVolumeToDate: 130,
        provenance: contractProvenance('ls-unit-2026'),
        rates: [
          { workType: 'ROUTINE_TRIM', quantityUnit: 'tree', unitRate: 108, mobilizationCost: 140 },
          { workType: 'HAZARD_TREE_REMOVAL', quantityUnit: 'tree', unitRate: 205, mobilizationCost: 160 },
        ],
      },
      {
        id: 'ls-te-2026',
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['NORTH', 'CENTRAL', 'SOUTH'],
        workTypes: ['EMERGENCY_CLEARANCE'],
        pricingModel: 'TIME_AND_EQUIPMENT',
        maxVolume: 100,
        consumedVolumeToDate: 18,
        provenance: contractProvenance('ls-te-2026'),
        rates: [
          {
            workType: 'EMERGENCY_CLEARANCE',
            quantityUnit: 'job',
            laborRate: 100,
            equipmentRate: 70,
            mobilizationCost: 145,
          },
        ],
      },
    ],
  },
]

function unitProvenance(unitId: string, hasTeEstimate: boolean) {
  return {
    scope: source('INSPECTOR', 'field-inspection', `${unitId}:scope`),
    quantity: source('INSPECTOR', 'field-inspection', `${unitId}:quantity`),
    territory: source('INSPECTOR', 'field-inspection', `${unitId}:territory`),
    workType: source('INSPECTOR', 'field-inspection', `${unitId}:work-type`),
    technicalRequirements: source('INSPECTOR', 'field-inspection', `${unitId}:requirements`),
    deadline: source('OPERATIONS', 'work-management', `${unitId}:deadline`),
    capacityRequirements: source('OPERATIONS', 'resource-planning', `${unitId}:capacity-profile`),
    contractVolume: source('PROCUREMENT', 'procurement-contracts', `${unitId}:contract-volume`),
    ...(hasTeEstimate
      ? { teEstimate: source('OPERATIONS', 'work-estimation', `${unitId}:te-estimate`) }
      : {}),
  }
}

function buildUnits(): AllocationUnit[] {
  return Array.from({ length: 100 }, (_, offset) => {
    const index = offset + 1
    const id = `AU-${String(index).padStart(3, '0')}`
    const territory = ['NORTH', 'CENTRAL', 'SOUTH'][offset % 3]
    const emergency = index % 10 === 0
    const removal = !emergency && index % 4 === 0
    const workType = emergency ? 'EMERGENCY_CLEARANCE' : removal ? 'HAZARD_TREE_REMOVAL' : 'ROUTINE_TRIM'
    const crane = removal && index % 8 === 0
    const impossible = index % 37 === 0
    const quantity = emergency ? 1 : 2 + (index % 5)
    const uncertainTimeAndEquipment = emergency && index % 30 === 0
    const bucket = index > 62 ? '2026-11' : '2026-10'
    const hasTeEstimate = emergency && !uncertainTimeAndEquipment

    return {
      id,
      type: 'WORK_PACKAGE',
      territory,
      workType,
      quantity,
      quantityUnit: emergency ? 'job' : 'tree',
      capacityRequirements: [{ bucket, demand: emergency ? 4 : quantity }],
      contractVolume: emergency ? 1 : quantity,
      deadline: `${bucket}-${String((index % 27) + 2).padStart(2, '0')}`,
      priority: 1 + (index % 3),
      requiredEquipment: impossible ? ['helicopter'] : crane ? ['crane'] : ['bucket-truck', 'chipper'],
      requiredCertifications: crane ? ['line-clearance', 'crane-operator'] : ['line-clearance'],
      scopeId: `scope-${String(index).padStart(3, '0')}`,
      scopeVersion: 1,
      expectedLaborHours: hasTeEstimate ? 8 + (index % 4) : undefined,
      expectedEquipmentHours: hasTeEstimate ? 4 + (index % 3) : undefined,
      provenance: unitProvenance(id, hasTeEstimate),
    }
  })
}

const preference: Record<string, string[]> = {
  NORTH: ['arbor-north', 'line-safe', 'green-line', 'canopy-works'],
  CENTRAL: ['line-safe', 'arbor-north', 'canopy-works', 'green-line'],
  SOUTH: ['green-line', 'line-safe', 'canopy-works', 'arbor-north'],
}

function capacityKey(contractorId: string, bucket: string) {
  return `${contractorId}|${bucket}`
}

function withObservedAllocation(units: AllocationUnit[]) {
  const scenario: ContractorAllocationScenario = {
    id: 'contractor-allocation-demo',
    asOf,
    allocationLevel: 'WORK_PACKAGE',
    units,
    contractors,
  }
  const capacityRemaining = new Map<string, number>()
  for (const contractor of contractors) {
    for (const bucket of contractor.capacityBuckets) {
      capacityRemaining.set(capacityKey(contractor.id, bucket.bucket), bucket.availableCapacity)
    }
  }
  const contractRemaining = new Map<string, number>()
  for (const contractor of contractors) {
    for (const contract of contractor.contracts) {
      const grossMax = Math.min(
        contract.maxVolume ?? Number.POSITIVE_INFINITY,
        contract.awardedCapacity ?? Number.POSITIVE_INFINITY
      )
      contractRemaining.set(contract.id, Math.max(0, grossMax - contract.consumedVolumeToDate))
    }
  }

  const selectedByUnit = new Map<string, { contractorId: string; contractId: string }>()
  const analyses = units
    .map((unit) => analyzeAllocationUnit(scenario, unit))
    .map((analysis) => ({
      analysis,
      costed: analysis.feasible.filter((candidate) => candidate.expectedCost != null && !candidate.requiresException),
    }))
    .filter(({ analysis }) => analysis.type === 'NO_CHOICE' || analysis.type === 'ALLOCATION_DECISION_REQUIRED')
    .sort((left, right) => {
      const leftDemand = left.analysis.unit.capacityRequirements.reduce((sum, item) => sum + item.demand, 0)
      const rightDemand = right.analysis.unit.capacityRequirements.reduce((sum, item) => sum + item.demand, 0)
      return (
        left.costed.length - right.costed.length ||
        rightDemand - leftDemand ||
        left.analysis.unit.id.localeCompare(right.analysis.unit.id)
      )
    })

  for (const { analysis, costed } of analyses) {
    const choices = preference[analysis.unit.territory]
    const ordered = [...costed].sort((left, right) => {
      const contractorPreference = choices.indexOf(left.contractorId) - choices.indexOf(right.contractorId)
      if (contractorPreference !== 0) return contractorPreference
      return left.contractId.localeCompare(right.contractId)
    })

    const selected = ordered.find((candidate) => {
      const capacityFits = analysis.unit.capacityRequirements.every(
        (requirement) =>
          (capacityRemaining.get(capacityKey(candidate.contractorId, requirement.bucket)) ?? 0) >= requirement.demand
      )
      return capacityFits && (contractRemaining.get(candidate.contractId) ?? 0) >= analysis.unit.contractVolume
    })

    if (!selected) continue
    for (const requirement of analysis.unit.capacityRequirements) {
      const key = capacityKey(selected.contractorId, requirement.bucket)
      capacityRemaining.set(key, (capacityRemaining.get(key) ?? 0) - requirement.demand)
    }
    contractRemaining.set(
      selected.contractId,
      (contractRemaining.get(selected.contractId) ?? 0) - analysis.unit.contractVolume
    )
    selectedByUnit.set(analysis.unit.id, {
      contractorId: selected.contractorId,
      contractId: selected.contractId,
    })
  }

  return units.map((unit) => {
    const observed = selectedByUnit.get(unit.id)
    return observed
      ? {
          ...unit,
          observedContractorId: observed.contractorId,
          observedContractId: observed.contractId,
        }
      : unit
  })
}

export function buildContractorAllocationDemoScenario(): ContractorAllocationScenario {
  const units = withObservedAllocation(buildUnits())
  return {
    id: 'contractor-allocation-demo',
    asOf,
    allocationLevel: 'WORK_PACKAGE',
    units,
    contractors: contractors.map((contractor) => ({
      ...contractor,
      capacityBuckets: contractor.capacityBuckets.map((bucket) => ({ ...bucket })),
      equipment: [...contractor.equipment],
      certifications: [...contractor.certifications],
      contracts: contractor.contracts.map((contract) => ({
        ...contract,
        territories: [...contract.territories],
        workTypes: [...contract.workTypes],
        rates: contract.rates.map((rate) => ({ ...rate })),
        provenance: { ...contract.provenance },
      })),
      provenance: { ...contractor.provenance },
    })),
  }
}
