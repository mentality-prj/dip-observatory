import type { AllocationUnit, Contractor, ContractorAllocationScenario } from './domain'
import { analyzeAllocationUnit } from './optimizer'

const asOf = '2026-10-01'

const contractors: Contractor[] = [
  {
    id: 'arbor-north',
    name: 'Arbor North',
    availableCapacity: 28,
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
        minVolume: 5,
        maxVolume: 28,
        awardedCapacity: 28,
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
        maxVolume: 12,
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
    availableCapacity: 32,
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
        minVolume: 8,
        maxVolume: 32,
        awardedCapacity: 32,
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
        maxVolume: 12,
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
    availableCapacity: 24,
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
        minVolume: 5,
        maxVolume: 24,
        awardedCapacity: 24,
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
        maxVolume: 10,
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
    availableCapacity: 30,
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
        minVolume: 6,
        maxVolume: 30,
        awardedCapacity: 30,
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
        maxVolume: 14,
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
  const contractCounts = new Map<string, number>()
  const selectedByUnit = new Map<string, string>()
  const analyses = units
    .map((unit) => analyzeAllocationUnit(scenario, unit))
    .map((analysis) => ({
      analysis,
      costed: analysis.feasible.filter((candidate) => candidate.expectedCost != null),
    }))
    .filter(({ analysis }) => analysis.type === 'NO_CHOICE' || analysis.type === 'ALLOCATION_DECISION_REQUIRED')
    .sort((a, b) => a.costed.length - b.costed.length || a.analysis.unit.id.localeCompare(b.analysis.unit.id))

  for (const { analysis, costed } of analyses) {
    const choices = preference[analysis.unit.territory]
    const ordered = [...costed].sort((a, b) => {
      const contractorA = contractors.find((item) => item.id === a.contractorId)
      const contractorB = contractors.find((item) => item.id === b.contractorId)
      const contractA = contractorA?.contracts.find((item) => item.id === a.contractId)
      const contractB = contractorB?.contracts.find((item) => item.id === b.contractId)
      const remainingA = Math.min(
        contractorRemaining.get(a.contractorId) ?? 0,
        Math.max(
          0,
          Math.min(contractA?.maxVolume ?? Number.POSITIVE_INFINITY, contractA?.awardedCapacity ?? Number.POSITIVE_INFINITY) -
            (contractCounts.get(a.contractId) ?? 0)
        )
      )
      const remainingB = Math.min(
        contractorRemaining.get(b.contractorId) ?? 0,
        Math.max(
          0,
          Math.min(contractB?.maxVolume ?? Number.POSITIVE_INFINITY, contractB?.awardedCapacity ?? Number.POSITIVE_INFINITY) -
            (contractCounts.get(b.contractId) ?? 0)
        )
      )
      if (remainingA !== remainingB) return remainingB - remainingA
      return choices.indexOf(a.contractorId) - choices.indexOf(b.contractorId)
    })

    const selected = ordered.find((candidate) => {
      if ((contractorRemaining.get(candidate.contractorId) ?? 0) <= 0) return false
      const contractor = contractors.find((item) => item.id === candidate.contractorId)
      const contract = contractor?.contracts.find((item) => item.id === candidate.contractId)
      const max = Math.min(
        contract?.maxVolume ?? Number.POSITIVE_INFINITY,
        contract?.awardedCapacity ?? Number.POSITIVE_INFINITY
      )
      return (contractCounts.get(candidate.contractId) ?? 0) < max
    })

    if (!selected) continue
    contractorRemaining.set(selected.contractorId, (contractorRemaining.get(selected.contractorId) ?? 0) - 1)
    contractCounts.set(selected.contractId, (contractCounts.get(selected.contractId) ?? 0) + 1)
    selectedByUnit.set(analysis.unit.id, selected.contractorId)
  }

  return units.map((unit) => {
    const observedContractorId = selectedByUnit.get(unit.id)
    return observedContractorId ? { ...unit, observedContractorId } : unit
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
