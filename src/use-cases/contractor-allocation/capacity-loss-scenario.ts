import type {
  AllocationUnit,
  Contractor,
  ContractorAllocationScenario,
  InputProvenance,
  SourceRole,
  TrustedAuthority,
} from './domain'

const asOf = '2026-10-01'
const decisionAt = '2026-10-01T00:00:00Z'

const authorities: TrustedAuthority[] = [
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

function contractor(
  id: string,
  name: string,
  capacity: number,
  smtRate: number,
  mettRate: number,
  smtMultiplier: number,
  mettMultiplier: number
): Contractor {
  const contractId = `${id}-2026`
  return {
    id,
    name,
    capacityBuckets: [{ bucket: '2026-10', availableCapacity: capacity }],
    equipment: ['bucket-truck', 'chipper'],
    certifications: ['line-clearance', 'arborist'],
    executionProfiles: [
      { workType: 'SMT', capacityMultiplier: smtMultiplier },
      { workType: 'METT', capacityMultiplier: mettMultiplier },
    ],
    provenance: {
      capacityBuckets: provenance<'OPERATIONS'>('operations-capacity', `${id}:capacity`),
      equipment: provenance<'OPERATIONS'>('operations-registry', `${id}:equipment`),
      certifications: provenance<'OPERATIONS'>('operations-registry', `${id}:certifications`),
      executionProfiles: provenance<'OPERATIONS'>('operations-estimation', `${id}:execution-profile`),
    },
    contracts: [
      {
        id: contractId,
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['NASHUA_AWC'],
        workTypes: ['SMT', 'METT'],
        pricingModel: 'UNIT_PRICE',
        maxVolume: 500,
        awardedCapacity: 500,
        consumedVolumeToDate: 0,
        remainingMinVolume: 0,
        remainingMaxVolume: 500,
        provenance: {
          eligibility: provenance<'PROCUREMENT'>('procurement-contracts', `${contractId}:eligibility`),
          rates: provenance<'PROCUREMENT'>('procurement-contracts', `${contractId}:rates`),
          volumeState: provenance<'PROCUREMENT'>('procurement-contracts', `${contractId}:volume-state`),
        },
        rates: [
          { workType: 'SMT', quantityUnit: 'mile', unitRate: smtRate, mobilizationCost: 2000 },
          { workType: 'METT', quantityUnit: 'mile', unitRate: mettRate, mobilizationCost: 3000 },
        ],
      },
    ],
  }
}

function unitProvenance(id: string) {
  return {
    scope: provenance<'INSPECTOR'>('inspector-field', `${id}:scope`),
    quantity: provenance<'INSPECTOR'>('inspector-field', `${id}:quantity`),
    territory: provenance<'INSPECTOR'>('inspector-field', `${id}:territory`),
    workType: provenance<'INSPECTOR'>('inspector-field', `${id}:work-type`),
    technicalRequirements: provenance<'INSPECTOR'>('inspector-field', `${id}:requirements`),
    executionWindow: provenance<'OPERATIONS'>('operations-work', `${id}:execution-window`),
    deadline: provenance<'OPERATIONS'>('operations-work', `${id}:deadline`),
    capacityRequirements: provenance<'OPERATIONS'>('operations-capacity', `${id}:capacity-profile`),
    contractVolume: provenance<'PROCUREMENT'>('procurement-contracts', `${id}:contract-volume`),
  }
}

function awardedMiles(): AllocationUnit[] {
  const batches = [42, 38, 36, 34, 32, 30, 28, 26]
  return batches.map((quantity, offset) => {
    const index = offset + 1
    const id = `NASHUA-${String(index).padStart(2, '0')}`
    const workType = index <= 6 ? 'SMT' : 'METT'
    return {
      id,
      type: 'AWARDED_VOLUME',
      territory: 'NASHUA_AWC',
      workType,
      quantity,
      quantityUnit: 'mile',
      executionStart: '2026-10-02',
      executionEnd: '2026-10-28',
      capacityRequirements: [{ bucket: '2026-10', demand: quantity }],
      contractVolume: quantity,
      deadline: '2026-10-31',
      priority: 3,
      requiredEquipment: ['bucket-truck', 'chipper'],
      requiredCertifications: ['line-clearance'],
      scopeId: `nashua-awc-${String(index).padStart(2, '0')}`,
      scopeVersion: 1,
      observedContractorId: 'arbor-north',
      observedContractId: 'arbor-north-2026',
      provenance: unitProvenance(id),
    }
  })
}

export function buildContractorCapacityLossScenario(): ContractorAllocationScenario {
  return {
    id: 'eversource-2022-capacity-loss-recovery',
    asOf,
    decisionAt,
    allocationLevel: 'AWARDED_VOLUME',
    constraintCoverageStatus: 'COMPLETE',
    trustedAuthorities: authorities.map((authority) => ({ ...authority })),
    units: awardedMiles(),
    contractors: [
      contractor('arbor-north', 'Arbor North', 0, 3200, 4400, 1, 1),
      contractor('green-line', 'Green Line Services', 90, 3300, 5200, 0.85, 0.9),
      contractor('canopy-works', 'Canopy Works', 90, 3500, 4600, 0.95, 0.8),
      contractor('line-safe', 'Line Safe Vegetation', 100, 3700, 4900, 1, 0.9),
    ],
  }
}
