import type {
  AllocationUnit,
  Contractor,
  ContractorAllocationScenario,
  InputProvenance,
  SourceRole,
  TrustedAuthority,
} from './domain'
import { analyzeAllocationUnit } from './optimizer'

export type ContractorAllocationDemoPreset =
  'NORMAL' | 'CAPACITY_CONSTRAINED' | 'CONTRACT_COMMITMENT' | 'TE_UNCERTAINTY'

export const CONTRACTOR_ALLOCATION_DEMO_PRESETS: ContractorAllocationDemoPreset[] = [
  'CAPACITY_CONSTRAINED',
  'NORMAL',
  'CONTRACT_COMMITMENT',
  'TE_UNCERTAINTY',
]

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
    executionProfiles: provenance<'OPERATIONS'>('operations-estimation', `${contractorId}:execution-profiles`),
  }
}

type ContractorSpec = {
  id: string
  name: string
  homeTerritory: string
  routineRate: number
  removalRate: number
  teLaborRate: number
  teEquipmentRate: number
  mobilization: number
  routineCapacityMultiplier: number
  removalCapacityMultiplier: number
  emergencyCapacityMultiplier: number
  emergencyLaborHours: number
  emergencyEquipmentHours: number
  equipment: string[]
  certifications: string[]
}

const specs: ContractorSpec[] = [
  {
    id: 'arbor-north',
    name: 'Arbor North',
    homeTerritory: 'ZONE_A',
    routineRate: 96,
    removalRate: 210,
    teLaborRate: 72,
    teEquipmentRate: 68,
    mobilization: 110,
    routineCapacityMultiplier: 1.2,
    removalCapacityMultiplier: 1.25,
    emergencyCapacityMultiplier: 1.15,
    emergencyLaborHours: 10,
    emergencyEquipmentHours: 5,
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
  },
  {
    id: 'green-line',
    name: 'Green Line Services',
    homeTerritory: 'ZONE_B',
    routineRate: 103,
    removalRate: 220,
    teLaborRate: 92,
    teEquipmentRate: 78,
    mobilization: 145,
    routineCapacityMultiplier: 0.8,
    removalCapacityMultiplier: 1.05,
    emergencyCapacityMultiplier: 0.85,
    emergencyLaborHours: 6,
    emergencyEquipmentHours: 3.5,
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
  },
  {
    id: 'canopy-works',
    name: 'Canopy Works',
    homeTerritory: 'ZONE_C',
    routineRate: 106,
    removalRate: 182,
    teLaborRate: 84,
    teEquipmentRate: 70,
    mobilization: 95,
    routineCapacityMultiplier: 0.95,
    removalCapacityMultiplier: 0.78,
    emergencyCapacityMultiplier: 0.95,
    emergencyLaborHours: 8,
    emergencyEquipmentHours: 4,
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
  },
  {
    id: 'line-safe',
    name: 'Line Safe Vegetation',
    homeTerritory: 'ZONE_D',
    routineRate: 109,
    removalRate: 198,
    teLaborRate: 88,
    teEquipmentRate: 72,
    mobilization: 125,
    routineCapacityMultiplier: 1,
    removalCapacityMultiplier: 0.9,
    emergencyCapacityMultiplier: 0.9,
    emergencyLaborHours: 7,
    emergencyEquipmentHours: 3.8,
    equipment: ['bucket-truck', 'chipper', 'crane'],
    certifications: ['line-clearance', 'arborist', 'crane-operator'],
  },
]

function capacityFor(spec: ContractorSpec, preset: ContractorAllocationDemoPreset) {
  if (preset === 'CAPACITY_CONSTRAINED') {
    const october: Record<string, number> = {
      'arbor-north': 75,
      'green-line': 65,
      'canopy-works': 70,
      'line-safe': 80,
    }
    return [
      { bucket: '2026-10', availableCapacity: october[spec.id] },
      { bucket: '2026-11', availableCapacity: 120 },
    ]
  }
  return [
    { bucket: '2026-10', availableCapacity: 260 },
    { bucket: '2026-11', availableCapacity: 220 },
  ]
}

function makeContractor(spec: ContractorSpec, preset: ContractorAllocationDemoPreset): Contractor {
  const unknownTe = preset === 'TE_UNCERTAINTY'
  const unitContractId = `${spec.id}-unit-2026`
  const teContractId = `${spec.id}-te-2026`
  return {
    id: spec.id,
    name: spec.name,
    capacityBuckets: capacityFor(spec, preset),
    equipment: spec.equipment,
    certifications: spec.certifications,
    executionProfiles: [
      { workType: 'ROUTINE_TRIM', capacityMultiplier: spec.routineCapacityMultiplier },
      { workType: 'HAZARD_TREE_REMOVAL', capacityMultiplier: spec.removalCapacityMultiplier },
      {
        workType: 'EMERGENCY_CLEARANCE',
        capacityMultiplier: spec.emergencyCapacityMultiplier,
        laborHoursPerUnit: unknownTe ? undefined : spec.emergencyLaborHours,
        equipmentHoursPerUnit: unknownTe ? undefined : spec.emergencyEquipmentHours,
      },
    ],
    provenance: contractorProvenance(spec.id),
    contracts: [
      {
        id: unitContractId,
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['SHARED', spec.homeTerritory],
        workTypes: ['ROUTINE_TRIM', 'HAZARD_TREE_REMOVAL'],
        pricingModel: 'UNIT_PRICE',
        maxVolume: 700,
        awardedCapacity: 700,
        consumedVolumeToDate: 100,
        remainingMinVolume: preset === 'CONTRACT_COMMITMENT' && spec.id === 'canopy-works' ? 90 : 0,
        remainingMaxVolume: 600,
        provenance: contractProvenance(unitContractId),
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
            mobilizationCost: spec.mobilization + 45,
          },
        ],
      },
      {
        id: teContractId,
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['SHARED', spec.homeTerritory],
        workTypes: ['EMERGENCY_CLEARANCE'],
        pricingModel: 'TIME_AND_EQUIPMENT',
        maxVolume: 200,
        consumedVolumeToDate: 20,
        remainingMinVolume: 0,
        remainingMaxVolume: 180,
        provenance: contractProvenance(teContractId),
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

function buildUnits(preset: ContractorAllocationDemoPreset): AllocationUnit[] {
  return Array.from({ length: 100 }, (_, offset) => {
    const index = offset + 1
    const id = `AU-${String(index).padStart(3, '0')}`
    const shared = index <= 12
    const owner = specs[(index - 13 + specs.length * 100) % specs.length]
    const territory = shared ? 'SHARED' : owner.homeTerritory
    const emergency = preset === 'TE_UNCERTAINTY' ? index <= 4 : !shared && index % 17 === 0
    const removal = !emergency && !shared && index % 5 === 0
    const workType = emergency ? 'EMERGENCY_CLEARANCE' : removal ? 'HAZARD_TREE_REMOVAL' : 'ROUTINE_TRIM'
    const quantity = emergency ? 1 : 2 + (index % 5)
    const bucket = index > 62 ? '2026-11' : '2026-10'
    const day = String((index % 24) + 3).padStart(2, '0')
    const crane = !shared && owner.id === 'line-safe' && removal && index % 10 === 0
    return {
      id,
      type: 'WORK_PACKAGE',
      territory,
      workType,
      quantity,
      quantityUnit: emergency ? 'job' : 'tree',
      executionStart: `${bucket}-02`,
      executionEnd: `${bucket}-${day}`,
      capacityRequirements: [{ bucket, demand: emergency ? 4 : quantity }],
      contractVolume: emergency ? 1 : quantity,
      deadline: `${bucket}-28`,
      priority: shared ? 3 : 1 + (index % 2),
      requiredEquipment: crane ? ['crane'] : ['bucket-truck', 'chipper'],
      requiredCertifications: crane ? ['line-clearance', 'crane-operator'] : ['line-clearance'],
      scopeId: `scope-${String(index).padStart(3, '0')}`,
      scopeVersion: 1,
      provenance: unitProvenance(id),
    }
  })
}

const defaultPreference = ['arbor-north', 'line-safe', 'canopy-works', 'green-line']
const commitmentPreference = ['canopy-works', 'arbor-north', 'line-safe', 'green-line']

function capacityKey(contractorId: string, bucket: string) {
  return `${contractorId}|${bucket}`
}

function contractKey(contractorId: string, contractId: string) {
  return `${contractorId}::${contractId}`
}

function withObservedAllocation(
  units: AllocationUnit[],
  contractors: Contractor[],
  preset: ContractorAllocationDemoPreset
) {
  const scenario: ContractorAllocationScenario = {
    id: `contractor-allocation-${preset.toLowerCase()}`,
    asOf,
    decisionAt,
    allocationLevel: 'WORK_PACKAGE',
    constraintCoverageStatus: 'COMPLETE',
    trustedAuthorities,
    units,
    contractors,
  }
  const capacityRemaining = new Map<string, number>()
  const contractRemaining = new Map<string, number>()
  for (const contractor of contractors) {
    for (const bucket of contractor.capacityBuckets)
      capacityRemaining.set(capacityKey(contractor.id, bucket.bucket), bucket.availableCapacity)
    for (const contract of contractor.contracts)
      contractRemaining.set(contractKey(contractor.id, contract.id), contract.remainingMaxVolume)
  }
  const preference = preset === 'CONTRACT_COMMITMENT' ? commitmentPreference : defaultPreference

  return units.map((unit) => {
    const analysis = analyzeAllocationUnit(scenario, unit)
    const ordered = analysis.feasible
      .filter((candidate) => candidate.expectedCost != null && !candidate.requiresException)
      .sort(
        (left, right) =>
          preference.indexOf(left.contractorId) - preference.indexOf(right.contractorId) ||
          left.contractId.localeCompare(right.contractId)
      )
    const selected = ordered.find((candidate) => {
      if ((contractRemaining.get(contractKey(candidate.contractorId, candidate.contractId)) ?? 0) < unit.contractVolume)
        return false
      return candidate.executionEstimate.capacityRequirements.every(
        (requirement) =>
          (capacityRemaining.get(capacityKey(candidate.contractorId, requirement.bucket)) ?? 0) >= requirement.demand
      )
    })
    if (!selected) return unit
    for (const requirement of selected.executionEstimate.capacityRequirements) {
      const key = capacityKey(selected.contractorId, requirement.bucket)
      capacityRemaining.set(key, (capacityRemaining.get(key) ?? 0) - requirement.demand)
    }
    const volumeKey = contractKey(selected.contractorId, selected.contractId)
    contractRemaining.set(volumeKey, (contractRemaining.get(volumeKey) ?? 0) - unit.contractVolume)
    return { ...unit, observedContractorId: selected.contractorId, observedContractId: selected.contractId }
  })
}

export function buildContractorAllocationDemoScenario(
  preset: ContractorAllocationDemoPreset = 'CAPACITY_CONSTRAINED'
): ContractorAllocationScenario {
  const contractors = specs.map((spec) => makeContractor(spec, preset))
  const units = buildUnits(preset)
  return {
    id: `contractor-allocation-${preset.toLowerCase()}`,
    asOf,
    decisionAt,
    allocationLevel: 'WORK_PACKAGE',
    constraintCoverageStatus: 'COMPLETE',
    trustedAuthorities: trustedAuthorities.map((authority) => ({ ...authority })),
    units: withObservedAllocation(units, contractors, preset),
    contractors: contractors.map((contractor) => ({
      ...contractor,
      capacityBuckets: contractor.capacityBuckets.map((bucket) => ({ ...bucket })),
      equipment: [...contractor.equipment],
      certifications: [...contractor.certifications],
      executionProfiles: contractor.executionProfiles.map((profile) => ({ ...profile })),
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
