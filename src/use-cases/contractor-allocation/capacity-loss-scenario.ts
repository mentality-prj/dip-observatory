import type {
  AllocationUnit,
  Contractor,
  ContractorAllocationScenario,
  EvidenceKind,
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

export const CAPACITY_LOSS_MODEL_ASSUMPTIONS = {
  capacityHorizon: 'Synthetic aggregate recovery-capacity budget represented in optimizer bucket 2022-01',
  economics: 'Synthetic post-rebid rates, capacities and productivity; no historical savings claim',
  coverage: 'UNKNOWN',
} as const

const asOf = '2022-01-01'
const decisionAt = '2022-01-01T00:00:00Z'
const capacityBucket = '2022-01'

const authorities: TrustedAuthority[] = [
  {
    id: 'historical-public-scope',
    sourceRole: 'INSPECTOR',
    sourceSystem: 'public-eversource-vmp',
    ingress: 'TRUSTED_ADAPTER',
  },
  {
    id: 'synthetic-procurement',
    sourceRole: 'PROCUREMENT',
    sourceSystem: 'synthetic-rebid-model',
    ingress: 'TRUSTED_ADAPTER',
  },
  {
    id: 'synthetic-work',
    sourceRole: 'OPERATIONS',
    sourceSystem: 'synthetic-recovery-window',
    ingress: 'TRUSTED_ADAPTER',
  },
  {
    id: 'synthetic-capacity',
    sourceRole: 'OPERATIONS',
    sourceSystem: 'synthetic-capacity-model',
    ingress: 'TRUSTED_ADAPTER',
  },
  {
    id: 'synthetic-registry',
    sourceRole: 'OPERATIONS',
    sourceSystem: 'synthetic-resource-registry',
    ingress: 'TRUSTED_ADAPTER',
  },
  {
    id: 'synthetic-estimation',
    sourceRole: 'OPERATIONS',
    sourceSystem: 'synthetic-productivity-model',
    ingress: 'TRUSTED_ADAPTER',
  },
]

function provenance<Role extends SourceRole>(
  authorityId: string,
  sourceRecordId: string,
  evidenceKind: EvidenceKind
): InputProvenance<Role> {
  return { authorityId, sourceRecordId, sourceVersion: '1', capturedAt: decisionAt, evidenceKind }
}

function synthetic<Role extends SourceRole>(authorityId: string, sourceRecordId: string): InputProvenance<Role> {
  return provenance<Role>(authorityId, sourceRecordId, 'SYNTHETIC_ASSUMPTION')
}

function historical<Role extends SourceRole>(sourceRecordId: string): InputProvenance<Role> {
  return provenance<Role>('historical-public-scope', sourceRecordId, 'HISTORICAL_PUBLIC')
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
      capacityBuckets: synthetic<'OPERATIONS'>('synthetic-capacity', `${id}:capacity`),
      equipment: synthetic<'OPERATIONS'>('synthetic-registry', `${id}:equipment`),
      certifications: synthetic<'OPERATIONS'>('synthetic-registry', `${id}:certifications`),
      executionProfiles: synthetic<'OPERATIONS'>('synthetic-estimation', `${id}:execution-profile`),
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
          eligibility: synthetic<'PROCUREMENT'>('synthetic-procurement', `${contractId}:eligibility`),
          rates: synthetic<'PROCUREMENT'>('synthetic-procurement', `${contractId}:rates`),
          volumeState: synthetic<'PROCUREMENT'>('synthetic-procurement', `${contractId}:volume-state`),
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
    scope: historical<'INSPECTOR'>(`${id}:scope`),
    quantity: historical<'INSPECTOR'>(`${id}:quantity`),
    territory: historical<'INSPECTOR'>(`${id}:territory`),
    workType: historical<'INSPECTOR'>(`${id}:work-type`),
    technicalRequirements: synthetic<'INSPECTOR'>('historical-public-scope', `${id}:requirements`),
    executionWindow: synthetic<'OPERATIONS'>('synthetic-work', `${id}:execution-window`),
    deadline: synthetic<'OPERATIONS'>('synthetic-work', `${id}:deadline`),
    capacityRequirements: synthetic<'OPERATIONS'>('synthetic-capacity', `${id}:capacity-profile`),
    contractVolume: synthetic<'PROCUREMENT'>('synthetic-procurement', `${id}:contract-volume`),
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
    constraintCoverageStatus: 'UNKNOWN',
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
