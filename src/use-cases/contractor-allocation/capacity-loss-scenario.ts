import type {
  AllocationUnit,
  Contractor,
  ContractorAllocationScenario,
  InputProvenance,
  SourceRole,
  TrustedAuthority,
} from './domain'

export const EVERSOURCE_CAPACITY_LOSS_SOURCE_URL =
  'https://www.puc.nh.gov/Regulatory/Docketbk/2019/19-057/LETTERS-MEMOS-TARIFFS/19-057_2021-11-20_EVERSOURCE_2022-VMP-PLAN.PDF'

export const EVERSOURCE_CAPACITY_LOSS_FACTS = {
  awc: 'NASHUA',
  circuitCount: 14,
  totalMiles: 266.21,
  smtMiles: 254.86,
  mettMiles: 11.35,
  returnedToBidRoundedMiles: 266,
} as const

export const EVERSOURCE_CAPACITY_LOSS_CIRCUITS = [
  { circuit: '3154X1_21', town: 'Nashua', totalMiles: 22.62, smtMiles: 21.47, mettMiles: 1.15 },
  { circuit: '3154X2_21', town: 'Hollis', totalMiles: 38.99, smtMiles: 34.76, mettMiles: 4.23 },
  { circuit: '314X4_22', town: 'Wilton', totalMiles: 97.5, smtMiles: 91.53, mettMiles: 5.97 },
  { circuit: '40W1_21', town: 'Nashua', totalMiles: 11.21, smtMiles: 11.21, mettMiles: 0 },
  { circuit: '3159X_21', town: 'Merrimack', totalMiles: 48.25, smtMiles: 48.25, mettMiles: 0 },
  { circuit: '353X3_21', town: 'Nashua', totalMiles: 3.37, smtMiles: 3.37, mettMiles: 0 },
  { circuit: '353X4_21', town: 'Nashua', totalMiles: 3.59, smtMiles: 3.59, mettMiles: 0 },
  { circuit: '353X5_21', town: 'Nashua', totalMiles: 4.72, smtMiles: 4.72, mettMiles: 0 },
  { circuit: '353X6_21', town: 'Nashua', totalMiles: 1.08, smtMiles: 1.08, mettMiles: 0 },
  { circuit: '383X2', town: 'Litchfield', totalMiles: 8.91, smtMiles: 8.91, mettMiles: 0 },
  { circuit: '389X8_21', town: 'Hudson', totalMiles: 1.17, smtMiles: 1.17, mettMiles: 0 },
  { circuit: '3175X3_21', town: 'Hudson', totalMiles: 1.72, smtMiles: 1.72, mettMiles: 0 },
  { circuit: '3175X5_21', town: 'Hudson', totalMiles: 1.89, smtMiles: 1.89, mettMiles: 0 },
  { circuit: '3168X_21', town: 'Nashua', totalMiles: 21.19, smtMiles: 21.19, mettMiles: 0 },
] as const

const asOf = '2022-01-01'
const decisionAt = '2022-01-01T00:00:00Z'
const capacityBucket = '2022'

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
  const contractId = `${id}-synthetic-bid`
  return {
    id,
    name,
    capacityBuckets: [{ bucket: capacityBucket, availableCapacity: capacity }],
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
        validFrom: '2022-01-01',
        validTo: '2022-12-31',
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
          { workType: 'SMT', quantityUnit: 'mile', unitRate: smtRate },
          { workType: 'METT', quantityUnit: 'mile', unitRate: mettRate },
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
  return EVERSOURCE_CAPACITY_LOSS_CIRCUITS.flatMap((row) => {
    const slices: AllocationUnit[] = []
    const addSlice = (workType: 'SMT' | 'METT', quantity: number) => {
      if (quantity <= 0) return
      const id = `${row.circuit}-${workType}`
      slices.push({
        id,
        type: 'AWARDED_VOLUME',
        territory: 'NASHUA_AWC',
        workType,
        quantity,
        quantityUnit: 'mile',
        executionStart: '2022-01-01',
        executionEnd: '2022-12-31',
        capacityRequirements: [{ bucket: capacityBucket, demand: quantity }],
        contractVolume: quantity,
        deadline: '2022-12-31',
        priority: 3,
        requiredEquipment: ['bucket-truck', 'chipper'],
        requiredCertifications: ['line-clearance'],
        scopeId: row.circuit,
        scopeVersion: 1,
        observedContractorId: 'synthetic-incumbent',
        observedContractId: 'synthetic-incumbent-synthetic-bid',
        provenance: unitProvenance(id),
      })
    }

    addSlice('SMT', row.smtMiles)
    addSlice('METT', row.mettMiles)
    return slices
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
      contractor('synthetic-incumbent', 'Synthetic incumbent', 0, 3200, 4400, 1, 1),
      contractor('synthetic-bidder-a', 'Synthetic bidder A', 90, 3300, 5200, 0.85, 0.9),
      contractor('synthetic-bidder-b', 'Synthetic bidder B', 100, 3500, 4600, 0.95, 0.8),
      contractor('synthetic-bidder-c', 'Synthetic bidder C', 120, 3700, 4900, 1, 0.9),
    ],
  }
}
