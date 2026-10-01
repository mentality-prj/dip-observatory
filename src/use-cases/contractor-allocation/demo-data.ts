import type { AllocationUnit, Contractor, ContractorAllocationScenario } from './domain'
import { analyzeAllocationUnit } from './optimizer'

const asOf = '2026-10-01'

const contractors: Contractor[] = [
  {
    id: 'arbor-north',
    name: 'Arbor North',
    availableCapacity: 500,
    availableThrough: '2026-12-31',
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
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
    availableCapacity: 500,
    availableThrough: '2026-12-31',
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
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
    availableCapacity: 500,
    availableThrough: '2026-12-31',
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
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
    availableCapacity: 500,
    availableThrough: '2026-12-31',
    equipment: ['bucket-truck', 'chipper', 'crane'],
    certifications: ['line-clearance', 'arborist', 'crane-operator'],
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

function buildUnits(): AllocationUnit[] {
  return Array.from({ length: 100 }, (_, offset) => {
    const index = offset + 1
    const territory = ['NORTH', 'CENTRAL', 'SOUTH'][offset % 3]
    const emergency = index % 10 === 0
    const removal = !emergency && index % 4 === 0
    const workType = emergency ? 'EMERGENCY_CLEARANCE' : removal ? 'HAZARD_TREE_REMOVAL' : 'ROUTINE_TRIM'
    const crane = removal && index % 8 === 0
    const impossible = index % 37 === 0
    const quantity = emergency ? 1 : 2 + (index % 5)
    const uncertainTimeAndEquipment = emergency && index % 30 === 0

    return {
      id: `AU-${String(index).padStart(3, '0')}`,
      type: 'WORK_PACKAGE',
      territory,
      workType,
      quantity,
      quantityUnit: emergency ? 'job' : 'tree',
      capacityDemand: emergency ? 4 : quantity,
      contractVolume: emergency ? 1 : quantity,
      deadline: `2026-${index > 62 ? '11' : '10'}-${String((index % 27) + 2).padStart(2, '0')}`,
      priority: 1 + (index % 3),
      requiredEquipment: impossible ? ['helicopter'] : crane ? ['crane'] : ['bucket-truck', 'chipper'],
      requiredCertifications: crane ? ['line-clearance', 'crane-operator'] : ['line-clearance'],
      scopeId: `scope-${String(index).padStart(3, '0')}`,
      scopeVersion: 1,
      expectedLaborHours: emergency && !uncertainTimeAndEquipment ? 8 + (index % 4) : undefined,
      expectedEquipmentHours: emergency && !uncertainTimeAndEquipment ? 4 + (index % 3) : undefined,
    }
  })
}

const preference: Record<string, string[]> = {
  NORTH: ['arbor-north', 'line-safe', 'green-line', 'canopy-works'],
  CENTRAL: ['line-safe', 'arbor-north', 'canopy-works', 'green-line'],
  SOUTH: ['green-line', 'line-safe', 'canopy-works', 'arbor-north'],
}

function withObservedAllocation(units: AllocationUnit[]) {
  const scenario: ContractorAllocationScenario = {
    id: 'contractor-allocation-demo',
    asOf,
    allocationLevel: 'WORK_PACKAGE',
    units,
    contractors,
  }
  const contractorRemaining = new Map(contractors.map((contractor) => [contractor.id, contractor.availableCapacity]))
  const contractRemaining = new Map<string, number>()
  for (const contractor of contractors) {
    for (const contract of contractor.contracts) {
      contractRemaining.set(
        contract.id,
        Math.min(contract.maxVolume ?? Number.POSITIVE_INFINITY, contract.awardedCapacity ?? Number.POSITIVE_INFINITY)
      )
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
    .sort(
      (left, right) =>
        left.costed.length - right.costed.length ||
        right.analysis.unit.capacityDemand - left.analysis.unit.capacityDemand ||
        left.analysis.unit.id.localeCompare(right.analysis.unit.id)
    )

  for (const { analysis, costed } of analyses) {
    const choices = preference[analysis.unit.territory]
    const ordered = [...costed].sort((left, right) => {
      const contractorPreference = choices.indexOf(left.contractorId) - choices.indexOf(right.contractorId)
      if (contractorPreference !== 0) return contractorPreference
      return left.contractId.localeCompare(right.contractId)
    })

    const selected = ordered.find(
      (candidate) =>
        (contractorRemaining.get(candidate.contractorId) ?? 0) >= analysis.unit.capacityDemand &&
        (contractRemaining.get(candidate.contractId) ?? 0) >= analysis.unit.contractVolume
    )

    if (!selected) continue
    contractorRemaining.set(
      selected.contractorId,
      (contractorRemaining.get(selected.contractorId) ?? 0) - analysis.unit.capacityDemand
    )
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
      equipment: [...contractor.equipment],
      certifications: [...contractor.certifications],
      contracts: contractor.contracts.map((contract) => ({
        ...contract,
        territories: [...contract.territories],
        workTypes: [...contract.workTypes],
        rates: contract.rates.map((rate) => ({ ...rate })),
      })),
    })),
  }
}
