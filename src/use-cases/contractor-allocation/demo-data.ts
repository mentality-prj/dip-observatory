import type {
  AllocationUnit,
  Contractor,
  ContractorAllocationScenario,
  InputProvenance,
  SourceRole,
  TrustedAuthority,
} from './domain'
import { analyzeAllocationUnit } from './optimizer'

const asOf = '2026-10-01'
const decisionAt = '2026-10-01T00:00:00Z'

const trustedAuthorities: TrustedAuthority[] = [
  { id: 'inspector-field', sourceRole: 'INSPECTOR', sourceSystem: 'field-inspection', ingress: 'TRUSTED_ADAPTER' },
  {
    id: 'procurement-contracts',
    sourceRole: 'PROCUREMENT',
    sourceSystem: 'procurement-contracts',
    ingress: 'TRUSTED_ADAPTER',
  },
  { id: 'operations-work', sourceRole: 'OPERATIONS', sourceSystem: 'work-management', ingress: 'TRUSTED_ADAPTER' },
  {
    id: 'operations-capacity',
    sourceRole: 'OPERATIONS',
    sourceSystem: 'resource-planning',
    ingress: 'TRUSTED_ADAPTER',
  },
  {
    id: 'operations-registry',
    sourceRole: 'OPERATIONS',
    sourceSystem: 'resource-registry',
    ingress: 'TRUSTED_ADAPTER',
  },
  {
    id: 'operations-estimation',
    sourceRole: 'OPERATIONS',
    sourceSystem: 'work-estimation',
    ingress: 'TRUSTED_ADAPTER',
  },
]

function provenance<Role extends SourceRole>(authorityId: string, sourceRecordId: string): InputProvenance<Role> {
  return { authorityId, sourceRecordId, sourceVersion: '1', capturedAt: decisionAt }
}

function contractProvenance(contractId: string) {
  return {
    eligibility: provenance<'PROCUREMENT'>('procurement-contracts', `${contractId}:eligibility`),
    rates: provenance<'PROCUREMENT'>('procurement-contracts', `${contractId}:rates`),
    volumeState: provenance<'PROCUREMENT'>('procurement-contracts', `${contractId}:volume-state`),
  }
}

function contractorProvenance(contractorId: string) {
  return {
    capacityBuckets: provenance<'OPERATIONS'>('operations-capacity', `${contractorId}:capacity`),
    equipment: provenance<'OPERATIONS'>('operations-registry', `${contractorId}:equipment`),
    certifications: provenance<'OPERATIONS'>('operations-registry', `${contractorId}:certifications`),
  }
}

type ContractorSpec = {
  id: string
  name: string
  territories: string[]
  equipment: string[]
  certifications: string[]
  routineRate: number
  removalRate: number
  teLaborRate: number
  teEquipmentRate: number
  mobilization: number
}

function makeContractor(spec: ContractorSpec): Contractor {
  return {
    id: spec.id,
    name: spec.name,
    capacityBuckets: [
      { bucket: '2026-10', availableCapacity: 500 },
      { bucket: '2026-11', availableCapacity: 500 },
    ],
    equipment: spec.equipment,
    certifications: spec.certifications,
    provenance: contractorProvenance(spec.id),
    contracts: [
      {
        id: `${spec.id}-unit-2026`,
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: spec.territories,
        workTypes: ['ROUTINE_TRIM', 'HAZARD_TREE_REMOVAL'],
        pricingModel: 'UNIT_PRICE',
        maxVolume: 700,
        awardedCapacity: 700,
        consumedVolumeToDate: 100,
        remainingMinVolume: 0,
        remainingMaxVolume: 600,
        provenance: contractProvenance(`${spec.id}-unit-2026`),
        rates: [
          {
            workType: 'ROUTINE_TRIM',
            quantityUnit: 'tree',
            unitRate: spec.routineRate,
            mobilizationCost: spec.mobilization,
          },
          {
            workType: 'HAZARD_TREE_REMOVAL',
            quantityUnit: 'tree',
            unitRate: spec.removalRate,
            mobilizationCost: spec.mobilization + 50,
          },
        ],
      },
      {
        id: `${spec.id}-te-2026`,
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: spec.territories,
        workTypes: ['EMERGENCY_CLEARANCE'],
        pricingModel: 'TIME_AND_EQUIPMENT',
        maxVolume: 200,
        consumedVolumeToDate: 20,
        remainingMinVolume: 0,
        remainingMaxVolume: 180,
        provenance: contractProvenance(`${spec.id}-te-2026`),
        rates: [
          {
            workType: 'EMERGENCY_CLEARANCE',
            quantityUnit: 'job',
            laborRate: spec.teLaborRate,
            equipmentRate: spec.teEquipmentRate,
            mobilizationCost: spec.mobilization,
          },
        ],
      },
    ],
  }
}

const contractors: Contractor[] = [
  makeContractor({
    id: 'arbor-north',
    name: 'Arbor North',
    territories: ['NORTH', 'CENTRAL'],
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
    routineRate: 115,
    removalRate: 230,
    teLaborRate: 90,
    teEquipmentRate: 75,
    mobilization: 120,
  }),
  makeContractor({
    id: 'green-line',
    name: 'Green Line Services',
    territories: ['NORTH', 'CENTRAL', 'SOUTH'],
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
    routineRate: 96,
    removalRate: 218,
    teLaborRate: 95,
    teEquipmentRate: 80,
    mobilization: 160,
  }),
  makeContractor({
    id: 'canopy-works',
    name: 'Canopy Works',
    territories: ['CENTRAL', 'SOUTH'],
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
    routineRate: 102,
    removalRate: 185,
    teLaborRate: 88,
    teEquipmentRate: 72,
    mobilization: 100,
  }),
  makeContractor({
    id: 'line-safe',
    name: 'Line Safe Vegetation',
    territories: ['NORTH', 'CENTRAL', 'SOUTH'],
    equipment: ['bucket-truck', 'chipper', 'crane'],
    certifications: ['line-clearance', 'arborist', 'crane-operator'],
    routineRate: 108,
    removalRate: 205,
    teLaborRate: 100,
    teEquipmentRate: 70,
    mobilization: 140,
  }),
]

function unitProvenance(unitId: string) {
  return {
    scope: provenance<'INSPECTOR'>('inspector-field', `${unitId}:scope`),
    quantity: provenance<'INSPECTOR'>('inspector-field', `${unitId}:quantity`),
    territory: provenance<'INSPECTOR'>('inspector-field', `${unitId}:territory`),
    workType: provenance<'INSPECTOR'>('inspector-field', `${unitId}:work-type`),
    technicalRequirements: provenance<'INSPECTOR'>('inspector-field', `${unitId}:requirements`),
    executionWindow: provenance<'OPERATIONS'>('operations-work', `${unitId}:execution-window`),
    deadline: provenance<'OPERATIONS'>('operations-work', `${unitId}:deadline`),
    capacityRequirements: provenance<'OPERATIONS'>('operations-capacity', `${unitId}:capacity-profile`),
    contractVolume: provenance<'PROCUREMENT'>('procurement-contracts', `${unitId}:contract-volume`),
    teEstimate: provenance<'OPERATIONS'>('operations-estimation', `${unitId}:te-estimate`),
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
    const quantity = emergency ? 1 : 2 + (index % 5)
    const bucket = index > 62 ? '2026-11' : '2026-10'
    const day = String((index % 24) + 3).padStart(2, '0')
    const executionStart = `${bucket}-02`
    const executionEnd = `${bucket}-${day}`

    return {
      id,
      type: 'WORK_PACKAGE',
      territory,
      workType,
      quantity,
      quantityUnit: emergency ? 'job' : 'tree',
      executionStart,
      executionEnd,
      capacityRequirements: [{ bucket, demand: emergency ? 4 : quantity }],
      contractVolume: emergency ? 1 : quantity,
      deadline: `${bucket}-28`,
      priority: 1 + (index % 3),
      requiredEquipment: crane ? ['crane'] : ['bucket-truck', 'chipper'],
      requiredCertifications: crane ? ['line-clearance', 'crane-operator'] : ['line-clearance'],
      scopeId: `scope-${String(index).padStart(3, '0')}`,
      scopeVersion: 1,
      expectedLaborHours: emergency ? 8 + (index % 4) : undefined,
      expectedEquipmentHours: emergency ? 4 + (index % 3) : undefined,
      provenance: unitProvenance(id),
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

function contractKey(contractorId: string, contractId: string) {
  return `${contractorId}::${contractId}`
}

function withObservedAllocation(units: AllocationUnit[]) {
  const scenario: ContractorAllocationScenario = {
    id: 'contractor-allocation-demo',
    asOf,
    decisionAt,
    allocationLevel: 'WORK_PACKAGE',
    trustedAuthorities,
    units,
    contractors,
  }
  const capacityRemaining = new Map<string, number>()
  const contractRemaining = new Map<string, number>()
  for (const contractor of contractors) {
    for (const bucket of contractor.capacityBuckets) {
      capacityRemaining.set(capacityKey(contractor.id, bucket.bucket), bucket.availableCapacity)
    }
    for (const contract of contractor.contracts) {
      contractRemaining.set(contractKey(contractor.id, contract.id), contract.remainingMaxVolume)
    }
  }

  return units.map((unit) => {
    const analysis = analyzeAllocationUnit(scenario, unit)
    const choices = preference[unit.territory]
    const ordered = analysis.feasible
      .filter((candidate) => candidate.expectedCost != null && !candidate.requiresException)
      .sort((left, right) => {
        const contractorPreference = choices.indexOf(left.contractorId) - choices.indexOf(right.contractorId)
        return contractorPreference || left.contractId.localeCompare(right.contractId)
      })
    const selected = ordered.find((candidate) => {
      const volumeKey = contractKey(candidate.contractorId, candidate.contractId)
      if ((contractRemaining.get(volumeKey) ?? 0) < unit.contractVolume) return false
      return unit.capacityRequirements.every(
        (requirement) =>
          (capacityRemaining.get(capacityKey(candidate.contractorId, requirement.bucket)) ?? 0) >= requirement.demand
      )
    })
    if (!selected) return unit

    for (const requirement of unit.capacityRequirements) {
      const key = capacityKey(selected.contractorId, requirement.bucket)
      capacityRemaining.set(key, (capacityRemaining.get(key) ?? 0) - requirement.demand)
    }
    const volumeKey = contractKey(selected.contractorId, selected.contractId)
    contractRemaining.set(volumeKey, (contractRemaining.get(volumeKey) ?? 0) - unit.contractVolume)
    return { ...unit, observedContractorId: selected.contractorId, observedContractId: selected.contractId }
  })
}

export function buildContractorAllocationDemoScenario(): ContractorAllocationScenario {
  return {
    id: 'contractor-allocation-demo',
    asOf,
    decisionAt,
    allocationLevel: 'WORK_PACKAGE',
    trustedAuthorities: trustedAuthorities.map((authority) => ({ ...authority })),
    units: withObservedAllocation(buildUnits()),
    contractors: contractors.map((contractor) => ({
      ...contractor,
      capacityBuckets: contractor.capacityBuckets.map((bucket) => ({ ...bucket })),
      equipment: [...contractor.equipment],
      certifications: [...contractor.certifications],
      provenance: { ...contractor.provenance },
      contracts: contractor.contracts.map((contract) => ({
        ...contract,
        territories: [...contract.territories],
        workTypes: [...contract.workTypes],
        rates: contract.rates.map((rate) => ({ ...rate })),
        provenance: { ...contract.provenance },
      })),
    })),
  }
}
