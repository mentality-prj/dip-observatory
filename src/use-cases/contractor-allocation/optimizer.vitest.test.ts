import { describe, expect, it } from 'vitest'

import { buildContractorAllocationDemoScenario } from './demo-data'
import type {
  AllocationUnit,
  Contractor,
  ContractorAllocationScenario,
  InputProvenance,
  SourceRole,
  TrustedAuthority,
} from './domain'
import { analyzeAllocationUnit, optimizeContractorAllocation, validateContractorAllocationScenario } from './optimizer'
import { sha256Hex } from './snapshot'

const capturedAt = '2026-10-01T00:00:00Z'
const trustedAuthorities: TrustedAuthority[] = [
  { id: 'inspector', sourceRole: 'INSPECTOR', sourceSystem: 'inspection', ingress: 'TRUSTED_ADAPTER' },
  { id: 'procurement', sourceRole: 'PROCUREMENT', sourceSystem: 'contracts', ingress: 'TRUSTED_ADAPTER' },
  { id: 'operations', sourceRole: 'OPERATIONS', sourceSystem: 'operations', ingress: 'TRUSTED_ADAPTER' },
  { id: 'planner', sourceRole: 'PLANNER', sourceSystem: 'planner', ingress: 'TRUSTED_ADAPTER' },
]

function source<Role extends SourceRole>(authorityId: string, id: string, at = capturedAt): InputProvenance<Role> {
  return { authorityId, sourceRecordId: id, sourceVersion: '1', capturedAt: at }
}

function unitProvenance(id: string) {
  return {
    scope: source<'INSPECTOR'>('inspector', `${id}:scope`),
    quantity: source<'INSPECTOR'>('inspector', `${id}:quantity`),
    territory: source<'INSPECTOR'>('inspector', `${id}:territory`),
    workType: source<'INSPECTOR'>('inspector', `${id}:work`),
    technicalRequirements: source<'INSPECTOR'>('inspector', `${id}:requirements`),
    executionWindow: source<'OPERATIONS'>('operations', `${id}:window`),
    deadline: source<'OPERATIONS'>('operations', `${id}:deadline`),
    capacityRequirements: source<'OPERATIONS'>('operations', `${id}:capacity`),
    contractVolume: source<'PROCUREMENT'>('procurement', `${id}:volume`),
    teEstimate: source<'OPERATIONS'>('operations', `${id}:te`),
  }
}

function contractProvenance(id: string) {
  return {
    eligibility: source<'PROCUREMENT'>('procurement', `${id}:eligibility`),
    rates: source<'PROCUREMENT'>('procurement', `${id}:rates`),
    volumeState: source<'PROCUREMENT'>('procurement', `${id}:volume-state`),
  }
}

function contractorProvenance(id: string) {
  return {
    capacityBuckets: source<'OPERATIONS'>('operations', `${id}:capacity`),
    equipment: source<'OPERATIONS'>('operations', `${id}:equipment`),
    certifications: source<'OPERATIONS'>('operations', `${id}:certifications`),
    executionProfiles: source<'OPERATIONS'>('operations', `${id}:profiles`),
  }
}

function unit(
  id: string,
  workType: string,
  demand: number,
  observedContractorId?: string,
  observedContractId?: string
): AllocationUnit {
  return {
    id,
    type: 'WORK_PACKAGE',
    territory: 'T',
    workType,
    quantity: 1,
    quantityUnit: 'job',
    executionStart: '2026-10-02',
    executionEnd: '2026-10-20',
    capacityRequirements: [{ bucket: '2026-10', demand }],
    contractVolume: 1,
    deadline: '2026-10-28',
    priority: 1,
    requiredEquipment: [],
    requiredCertifications: [],
    scopeId: `S-${id}`,
    scopeVersion: 1,
    observedContractorId,
    observedContractId,
    provenance: unitProvenance(id),
  }
}

function contractor(
  id: string,
  rates: { workType: string; unitRate?: number; laborRate?: number; equipmentRate?: number }[],
  capacity = 10
): Contractor {
  return {
    id,
    name: id,
    capacityBuckets: [{ bucket: '2026-10', availableCapacity: capacity }],
    equipment: [],
    certifications: [],
    executionProfiles: [
      { workType: 'X', capacityMultiplier: 1 },
      { workType: 'Y', capacityMultiplier: 1 },
      { workType: 'TE', capacityMultiplier: 1, laborHoursPerUnit: 1, equipmentHoursPerUnit: 1 },
    ],
    provenance: contractorProvenance(id),
    contracts: [
      {
        id: `${id}-contract`,
        approved: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        territories: ['T'],
        workTypes: [...new Set(rates.map((rate) => rate.workType))],
        pricingModel: rates.some((rate) => rate.laborRate != null) ? 'TIME_AND_EQUIPMENT' : 'UNIT_PRICE',
        rates: rates.map((rate) => ({ ...rate, quantityUnit: 'job' })),
        maxVolume: 20,
        consumedVolumeToDate: 0,
        remainingMinVolume: 0,
        remainingMaxVolume: 20,
        provenance: contractProvenance(`${id}-contract`),
      },
    ],
  }
}

function scenario(units: AllocationUnit[], contractors: Contractor[]): ContractorAllocationScenario {
  return {
    id: 'test',
    asOf: '2026-10-01',
    decisionAt: capturedAt,
    allocationLevel: 'WORK_PACKAGE',
    constraintCoverageStatus: 'COMPLETE',
    trustedAuthorities: trustedAuthorities.map((item) => ({ ...item })),
    units,
    contractors,
  }
}

describe('contractor allocation optimizer', () => {
  it('optimizes indivisible workload globally instead of greedily', () => {
    const a = contractor(
      'A',
      [
        { workType: 'X', unitRate: 1 },
        { workType: 'Y', unitRate: 2 },
      ],
      3
    )
    const b = contractor(
      'B',
      [
        { workType: 'X', unitRate: 2 },
        { workType: 'Y', unitRate: 100 },
      ],
      3
    )
    const input = scenario([unit('U1', 'X', 2, 'A', 'A-contract'), unit('U2', 'Y', 3, 'B', 'B-contract')], [a, b])
    const result = optimizeContractorAllocation(input)
    const repeated = optimizeContractorAllocation(input)

    expect(result.status).toBe('OPTIMAL')
    expect(result.qdipExpectedSpend).toBe(4)
    expect(repeated.assignments).toEqual(result.assignments)
    expect(result.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ allocationUnitId: 'U1', contractorId: 'B' }),
        expect.objectContaining({ allocationUnitId: 'U2', contractorId: 'A' }),
      ])
    )
  })

  it('uses contractor-specific capacity multipliers', () => {
    const a = contractor('A', [{ workType: 'X', unitRate: 1 }], 2)
    const b = contractor('B', [{ workType: 'X', unitRate: 2 }], 2)
    a.executionProfiles[0].capacityMultiplier = 2
    b.executionProfiles[0].capacityMultiplier = 1
    const input = scenario([unit('U1', 'X', 2, 'B', 'B-contract')], [a, b])
    const analysis = analyzeAllocationUnit(input, input.units[0])

    expect(analysis.feasible.some((candidate) => candidate.contractorId === 'A')).toBe(false)
    expect(
      analysis.feasible.find((candidate) => candidate.contractorId === 'B')?.executionEstimate.capacityRequirements[0]
        .demand
    ).toBe(2)
  })

  it('can select a higher hourly rate when contractor-specific T&E productivity makes it cheaper', () => {
    const a = contractor('A', [{ workType: 'TE', laborRate: 60, equipmentRate: 20 }])
    const b = contractor('B', [{ workType: 'TE', laborRate: 90, equipmentRate: 25 }])
    a.executionProfiles = [{ workType: 'TE', capacityMultiplier: 1, laborHoursPerUnit: 10, equipmentHoursPerUnit: 5 }]
    b.executionProfiles = [{ workType: 'TE', capacityMultiplier: 1, laborHoursPerUnit: 4, equipmentHoursPerUnit: 2 }]
    const input = scenario([unit('TE1', 'TE', 1, 'A', 'A-contract')], [a, b])
    const result = optimizeContractorAllocation(input)

    expect(result.status).toBe('OPTIMAL')
    expect(result.assignments[0]).toEqual(expect.objectContaining({ contractorId: 'B', expectedCost: 410 }))
  })

  it('uses the actually selected globally feasible contract in choice metrics and portfolio impacts', () => {
    const a = contractor('A', [
      { workType: 'X', unitRate: 1 },
      { workType: 'Y', unitRate: 1 },
    ])
    a.contracts[0].id = 'A-cheap'
    a.contracts[0].remainingMaxVolume = 1
    a.contracts.push({
      ...a.contracts[0],
      id: 'A-overflow',
      workTypes: ['X'],
      remainingMaxVolume: 10,
      rates: [{ workType: 'X', quantityUnit: 'job', unitRate: 5 }],
      provenance: contractProvenance('A-overflow'),
    })
    const b = contractor('B', [{ workType: 'X', unitRate: 4 }])
    const u1 = unit('U1', 'X', 1, 'B', 'B-contract')
    const u2 = unit('U2', 'Y', 1, 'A', 'A-cheap')
    const input = scenario([u1, u2], [a, b])
    const result = optimizeContractorAllocation(input)
    const impactA = result.portfolioImpacts.U1.find((impact) => impact.contractorId === 'A')

    expect(result.status).toBe('OPTIMAL')
    expect(impactA).toEqual(expect.objectContaining({ contractId: 'A-overflow', expectedCost: 5 }))
  })

  it('does not publish counterfactual advantage when decision-state constraint coverage is incomplete', () => {
    const input = scenario([unit('U1', 'X', 1, 'A', 'A-contract')], [contractor('A', [{ workType: 'X', unitRate: 2 }])])
    input.constraintCoverageStatus = 'INCOMPLETE'
    const result = optimizeContractorAllocation(input)
    expect(result.status).toBe('OPTIMAL')
    expect(result.counterfactualAllocationAdvantage).toBeNull()
  })

  it('reserves resources for unknown-cost T&E work and marks economic coverage partial', () => {
    const a = contractor('A', [{ workType: 'TE', laborRate: 60, equipmentRate: 20 }], 5)
    a.executionProfiles = [{ workType: 'TE', capacityMultiplier: 1 }]
    const input = scenario([unit('TE1', 'TE', 2, 'A', 'A-contract')], [a])
    const result = optimizeContractorAllocation(input)
    expect(result.status).toBe('PARTIAL_OPTIMAL')
    expect(result.reservations).toHaveLength(1)
    expect(result.coverage.coverageRatio).toBe(0)
    expect(result.counterfactualAllocationAdvantage).toBeNull()
  })

  it('requires contract validity to cover execution', () => {
    const a = contractor('A', [{ workType: 'X', unitRate: 1 }])
    a.contracts[0].validTo = '2026-10-10'
    const input = scenario([unit('U1', 'X', 1)], [a])
    const analysis = analyzeAllocationUnit(input, input.units[0])
    expect(analysis.type).toBe('INFEASIBLE')
    expect(analysis.rejected[0].reasons).toContain('CONTRACT_OUTSIDE_EXECUTION_WINDOW')
  })

  it('rejects inconsistent role ownership metadata and future information', () => {
    const input = scenario([unit('U1', 'X', 1)], [contractor('A', [{ workType: 'X', unitRate: 1 }])])
    input.units[0].provenance.deadline = source<'OPERATIONS'>('planner', 'bad')
    input.contractors[0].provenance.executionProfiles = source<'OPERATIONS'>(
      'operations',
      'future',
      '2026-10-01T00:00:01Z'
    )
    const result = optimizeContractorAllocation(input)
    expect(result.status).toBe('INVALID_INPUT')
    expect(result.validationIssues.some((issue) => issue.code === 'UNTRUSTED_INPUT')).toBe(true)
  })

  it('rejects duplicate capacity buckets and duplicate execution profiles', () => {
    const input = scenario([unit('U1', 'X', 1)], [contractor('A', [{ workType: 'X', unitRate: 1 }])])
    input.units[0].capacityRequirements.push({ bucket: '2026-10', demand: 1 })
    input.contractors[0].capacityBuckets.push({ bucket: '2026-10', availableCapacity: 1 })
    input.contractors[0].executionProfiles.push({ workType: 'X', capacityMultiplier: 1 })
    const codes = validateContractorAllocationScenario(input).map((issue) => issue.code)
    expect(codes).toEqual(
      expect.arrayContaining([
        'DUPLICATE_UNIT_CAPACITY_BUCKET',
        'DUPLICATE_CONTRACTOR_CAPACITY_BUCKET',
        'DUPLICATE_EXECUTION_PROFILE',
      ])
    )
  })

  it('reports UNKNOWN when proof search is cut off', () => {
    const a = contractor('A', [{ workType: 'X', unitRate: 1 }], 1)
    const b = contractor('B', [{ workType: 'X', unitRate: 2 }], 1)
    const input = scenario([unit('U1', 'X', 1), unit('U2', 'X', 1)], [a, b])
    const result = optimizeContractorAllocation(input, { maxSearchNodes: 0 })
    expect(result.status).toBe('UNKNOWN')
    expect(result.counterfactualAllocationAdvantage).toBeNull()
  })

  it('creates deterministic SHA-256 snapshots including contractor execution profiles', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    const input = scenario([unit('U1', 'X', 1, 'A', 'A-contract')], [contractor('A', [{ workType: 'X', unitRate: 1 }])])
    const first = optimizeContractorAllocation(input)
    const changed = JSON.parse(JSON.stringify(input)) as ContractorAllocationScenario
    changed.contractors[0].executionProfiles[0].capacityMultiplier = 2
    const second = optimizeContractorAllocation(changed)
    expect(first.scenarioSnapshot.canonicalInput).toContain('executionProfiles')
    expect(first.scenarioSnapshot.id).not.toBe(second.scenarioSnapshot.id)
  })

  it('keeps the default constrained 100-unit demo fully covered with real global choice', () => {
    const input = buildContractorAllocationDemoScenario('CAPACITY_CONSTRAINED')
    const first = optimizeContractorAllocation(input)

    expect(first.status).toBe('OPTIMAL')
    expect(first.metrics.totalUnits).toBe(100)
    expect(first.metrics.localDecisionUnits).toBeGreaterThan(0)
    expect(first.metrics.decisionUnits).toBeGreaterThan(0)
    expect(first.metrics.spendWithChoice).toBeGreaterThan(0)
    expect(first.coverage.coverageRatio).toBe(1)
    expect(first.observedInvalidUnitIds).toEqual([])
    expect(first.counterfactualAllocationAdvantage ?? 0).toBeGreaterThan(0)
    expect(first.portfolioImpacts['AU-001']?.length ?? 0).toBeGreaterThan(1)
  })

  it('exposes distinct preset semantics', () => {
    const normal = optimizeContractorAllocation(buildContractorAllocationDemoScenario('NORMAL'))
    const constrained = optimizeContractorAllocation(buildContractorAllocationDemoScenario('CAPACITY_CONSTRAINED'))
    const commitment = buildContractorAllocationDemoScenario('CONTRACT_COMMITMENT')
    const uncertainty = optimizeContractorAllocation(buildContractorAllocationDemoScenario('TE_UNCERTAINTY'))

    expect(normal.status).toBe('OPTIMAL')
    expect(constrained.status).toBe('OPTIMAL')
    expect(commitment.contractors.find((item) => item.id === 'canopy-works')?.contracts[0].remainingMinVolume).toBe(90)
    expect(uncertainty.status).toBe('PARTIAL_OPTIMAL')
    expect(uncertainty.reservations.length).toBeGreaterThan(0)
  })
})
