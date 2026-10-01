import { describe, expect, it } from 'vitest'

import { buildContractorAllocationDemoScenario } from './demo-data'
import type {
  AllocationUnit,
  ContractorAllocationScenario,
  InputProvenance,
  SourceRole,
  TrustedAuthority,
} from './domain'
import { analyzeAllocationUnit, optimizeContractorAllocation, validateContractorAllocationScenario } from './optimizer'
import { sha256Hex } from './snapshot'

const capturedAt = '2026-10-01T00:00:00Z'

const trustedAuthorities: TrustedAuthority[] = [
  { id: 'inspector-adapter', sourceRole: 'INSPECTOR', sourceSystem: 'inspector-system', ingress: 'TRUSTED_ADAPTER' },
  {
    id: 'procurement-adapter',
    sourceRole: 'PROCUREMENT',
    sourceSystem: 'procurement-system',
    ingress: 'TRUSTED_ADAPTER',
  },
  { id: 'operations-adapter', sourceRole: 'OPERATIONS', sourceSystem: 'operations-system', ingress: 'TRUSTED_ADAPTER' },
  { id: 'planner-adapter', sourceRole: 'PLANNER', sourceSystem: 'planner-system', ingress: 'TRUSTED_ADAPTER' },
]

function source<Role extends SourceRole>(authorityId: string, id: string, at = capturedAt): InputProvenance<Role> {
  return { authorityId, sourceRecordId: id, sourceVersion: '1', capturedAt: at }
}

function unitProvenance(id: string, te = false) {
  return {
    scope: source<'INSPECTOR'>('inspector-adapter', `${id}:scope`),
    quantity: source<'INSPECTOR'>('inspector-adapter', `${id}:quantity`),
    territory: source<'INSPECTOR'>('inspector-adapter', `${id}:territory`),
    workType: source<'INSPECTOR'>('inspector-adapter', `${id}:work-type`),
    technicalRequirements: source<'INSPECTOR'>('inspector-adapter', `${id}:requirements`),
    executionWindow: source<'OPERATIONS'>('operations-adapter', `${id}:window`),
    deadline: source<'OPERATIONS'>('operations-adapter', `${id}:deadline`),
    capacityRequirements: source<'OPERATIONS'>('operations-adapter', `${id}:capacity`),
    contractVolume: source<'PROCUREMENT'>('procurement-adapter', `${id}:volume`),
    ...(te ? { teEstimate: source<'OPERATIONS'>('operations-adapter', `${id}:te`) } : {}),
  }
}

function contractProvenance(id: string) {
  return {
    eligibility: source<'PROCUREMENT'>('procurement-adapter', `${id}:eligibility`),
    rates: source<'PROCUREMENT'>('procurement-adapter', `${id}:rates`),
    volumeState: source<'PROCUREMENT'>('procurement-adapter', `${id}:volume-state`),
  }
}

function contractorProvenance(id: string) {
  return {
    capacityBuckets: source<'OPERATIONS'>('operations-adapter', `${id}:capacity`),
    equipment: source<'OPERATIONS'>('operations-adapter', `${id}:equipment`),
    certifications: source<'OPERATIONS'>('operations-adapter', `${id}:certifications`),
  }
}

function unit(
  id: string,
  workType: string,
  demand: number,
  bucket: string,
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
    executionStart: `${bucket}-02`,
    executionEnd: `${bucket}-20`,
    capacityRequirements: [{ bucket, demand }],
    contractVolume: 1,
    deadline: `${bucket}-28`,
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

function globalChoiceScenario(): ContractorAllocationScenario {
  return {
    id: 'global-choice-test',
    asOf: '2026-10-01',
    decisionAt: capturedAt,
    allocationLevel: 'WORK_PACKAGE',
    trustedAuthorities: trustedAuthorities.map((authority) => ({ ...authority })),
    units: [unit('U1', 'X', 2, '2026-10', 'A', 'A-contract'), unit('U2', 'Y', 3, '2026-10', 'B', 'B-contract')],
    contractors: [
      {
        id: 'A',
        name: 'A',
        capacityBuckets: [{ bucket: '2026-10', availableCapacity: 3 }],
        equipment: [],
        certifications: [],
        provenance: contractorProvenance('A'),
        contracts: [
          {
            id: 'A-contract',
            approved: true,
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            territories: ['T'],
            workTypes: ['X', 'Y'],
            pricingModel: 'UNIT_PRICE',
            maxVolume: 2,
            consumedVolumeToDate: 0,
            remainingMinVolume: 0,
            remainingMaxVolume: 2,
            provenance: contractProvenance('A-contract'),
            rates: [
              { workType: 'X', quantityUnit: 'job', unitRate: 1 },
              { workType: 'Y', quantityUnit: 'job', unitRate: 2 },
            ],
          },
        ],
      },
      {
        id: 'B',
        name: 'B',
        capacityBuckets: [{ bucket: '2026-10', availableCapacity: 3 }],
        equipment: [],
        certifications: [],
        provenance: contractorProvenance('B'),
        contracts: [
          {
            id: 'B-contract',
            approved: true,
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            territories: ['T'],
            workTypes: ['X', 'Y'],
            pricingModel: 'UNIT_PRICE',
            maxVolume: 2,
            consumedVolumeToDate: 0,
            remainingMinVolume: 0,
            remainingMaxVolume: 2,
            provenance: contractProvenance('B-contract'),
            rates: [
              { workType: 'X', quantityUnit: 'job', unitRate: 2 },
              { workType: 'Y', quantityUnit: 'job', unitRate: 100 },
            ],
          },
        ],
      },
    ],
  }
}

function multiContractScenario(): ContractorAllocationScenario {
  const scenario = globalChoiceScenario()
  scenario.id = 'multi-contract-test'
  scenario.units = ['U1', 'U2'].map((id) => ({
    ...unit(id, 'X', 2, '2026-10'),
    quantity: 2,
    contractVolume: 2,
  }))
  scenario.contractors = [
    {
      id: 'A',
      name: 'A',
      capacityBuckets: [{ bucket: '2026-10', availableCapacity: 4 }],
      equipment: [],
      certifications: [],
      provenance: contractorProvenance('A'),
      contracts: [
        {
          id: 'A-cheap',
          approved: true,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          territories: ['T'],
          workTypes: ['X'],
          pricingModel: 'UNIT_PRICE',
          maxVolume: 4,
          consumedVolumeToDate: 2,
          remainingMinVolume: 0,
          remainingMaxVolume: 2,
          provenance: contractProvenance('A-cheap'),
          rates: [{ workType: 'X', quantityUnit: 'job', unitRate: 1 }],
        },
        {
          id: 'A-overflow',
          approved: true,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          territories: ['T'],
          workTypes: ['X'],
          pricingModel: 'UNIT_PRICE',
          maxVolume: 10,
          minVolume: 4,
          consumedVolumeToDate: 4,
          remainingMinVolume: 0,
          remainingMaxVolume: 6,
          provenance: contractProvenance('A-overflow'),
          rates: [{ workType: 'X', quantityUnit: 'job', unitRate: 3 }],
        },
      ],
    },
  ]
  return scenario
}

function globallyForcedScenario(): ContractorAllocationScenario {
  const scenario = globalChoiceScenario()
  scenario.id = 'global-decision-space-test'
  scenario.units = [
    unit('U1', 'X', 1, '2026-10', 'B', 'B-contract'),
    unit('U2', 'X', 1, '2026-11', 'A', 'A-contract'),
    unit('F1', 'FA', 1, '2026-10', 'A', 'A-contract'),
    unit('F2', 'FB', 1, '2026-11', 'B', 'B-contract'),
  ]
  scenario.contractors = scenario.contractors.map((contractor) => ({
    ...contractor,
    capacityBuckets: [
      { bucket: '2026-10', availableCapacity: 1 },
      { bucket: '2026-11', availableCapacity: 1 },
    ],
    contracts: contractor.contracts.map((contract) => ({
      ...contract,
      remainingMaxVolume: 4,
      maxVolume: 4,
      workTypes: contractor.id === 'A' ? ['X', 'FA'] : ['X', 'FB'],
      rates:
        contractor.id === 'A'
          ? [
              { workType: 'X', quantityUnit: 'job', unitRate: 1 },
              { workType: 'FA', quantityUnit: 'job', unitRate: 1 },
            ]
          : [
              { workType: 'X', quantityUnit: 'job', unitRate: 2 },
              { workType: 'FB', quantityUnit: 'job', unitRate: 1 },
            ],
    })),
  }))
  return scenario
}

describe('contractor allocation optimizer', () => {
  it('optimizes indivisible time-bucketed workload globally', () => {
    const result = optimizeContractorAllocation(globalChoiceScenario())

    expect(result.status).toBe('OPTIMAL')
    expect(result.qdipExpectedSpend).toBe(4)
    expect(result.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ allocationUnitId: 'U1', contractorId: 'B', expectedCost: 2 }),
        expect.objectContaining({ allocationUnitId: 'U2', contractorId: 'A', expectedCost: 2 }),
      ])
    )
    expect(result.counterfactualAllocationAdvantage).toBe(97)
    expect(result.optimalityGapPct).toBe(0)
    expect(result.coverage.coverageRatio).toBe(1)
  })

  it('uses authoritative remaining contract volume and does not re-impose fulfilled minimums', () => {
    const scenario = multiContractScenario()
    const analysis = analyzeAllocationUnit(scenario, scenario.units[0])
    const result = optimizeContractorAllocation(scenario)

    expect(analysis.type).toBe('NO_CHOICE')
    expect(analysis.feasible.map((candidate) => candidate.contractId)).toEqual(['A-cheap', 'A-overflow'])
    expect(result.status).toBe('OPTIMAL')
    expect(result.assignments.map((assignment) => assignment.contractId).sort()).toEqual(['A-cheap', 'A-overflow'])
    expect(result.qdipExpectedSpend).toBe(8)
  })

  it('keeps contractor capacity independent across execution buckets', () => {
    const scenario = globalChoiceScenario()
    scenario.units = [unit('OCT', 'X', 3, '2026-10'), unit('NOV', 'X', 3, '2026-11')]
    scenario.contractors = scenario.contractors.map((contractor, index) => ({
      ...contractor,
      capacityBuckets: [
        { bucket: '2026-10', availableCapacity: index === 0 ? 3 : 0 },
        { bucket: '2026-11', availableCapacity: index === 0 ? 0 : 3 },
      ],
      contracts: contractor.contracts.map((contract) => ({ ...contract, workTypes: ['X'] })),
    }))

    const result = optimizeContractorAllocation(scenario)
    expect(result.status).toBe('OPTIMAL')
    expect(result.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ allocationUnitId: 'OCT', contractorId: 'A' }),
        expect.objectContaining({ allocationUnitId: 'NOV', contractorId: 'B' }),
      ])
    )
  })

  it('requires contract validity to cover the actual execution window', () => {
    const scenario = globalChoiceScenario()
    scenario.units = [unit('NOV', 'X', 1, '2026-11')]
    scenario.contractors[0].contracts[0].validTo = '2026-10-15'

    const analysis = analyzeAllocationUnit(scenario, scenario.units[0])
    const rejectedA = analysis.rejected.find((candidate) => candidate.contractorId === 'A')
    expect(rejectedA?.reasons).toContain('CONTRACT_OUTSIDE_EXECUTION_WINDOW')
    expect(analysis.feasible.some((candidate) => candidate.contractorId === 'B')).toBe(true)
  })

  it('rejects planner authority even when provenance points to a registered adapter', () => {
    const scenario = globalChoiceScenario()
    scenario.units[0].provenance.deadline = source<'OPERATIONS'>('planner-adapter', 'planner:deadline')

    const analysis = analyzeAllocationUnit(scenario, scenario.units[0])
    const result = optimizeContractorAllocation(scenario)
    expect(analysis.type).toBe('INFEASIBLE')
    expect(analysis.rejected.every((candidate) => candidate.reasons.includes('UNTRUSTED_INPUT'))).toBe(true)
    expect(result.status).toBe('INVALID_INPUT')
    expect(result.validationIssues.some((issue) => issue.code === 'UNTRUSTED_INPUT')).toBe(true)
  })

  it('rejects future information that was not available at the exact decision timestamp', () => {
    const scenario = globalChoiceScenario()
    scenario.contractors[0].provenance.capacityBuckets = source<'OPERATIONS'>(
      'operations-adapter',
      'A:capacity',
      '2026-10-01T00:00:01Z'
    )

    const result = optimizeContractorAllocation(scenario)
    expect(result.status).toBe('INVALID_INPUT')
    expect(result.validationIssues.some((issue) => issue.code === 'UNTRUSTED_INPUT')).toBe(true)
  })

  it('reserves capacity and contract volume for unknown-cost exception work and reports partial optimization', () => {
    const scenario = globalChoiceScenario()
    const teUnit = {
      ...unit('TE', 'TE', 1, '2026-10', 'B', 'B-te'),
      provenance: unitProvenance('TE'),
    }
    scenario.units = [scenario.units[0], teUnit]
    scenario.contractors = scenario.contractors.map((contractor) => ({
      ...contractor,
      capacityBuckets: [{ bucket: '2026-10', availableCapacity: contractor.id === 'A' ? 2 : 2 }],
      contracts: [
        contractor.contracts[0],
        {
          id: `${contractor.id}-te`,
          approved: true,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          territories: ['T'],
          workTypes: ['TE'],
          pricingModel: 'TIME_AND_EQUIPMENT' as const,
          maxVolume: 2,
          consumedVolumeToDate: 0,
          remainingMinVolume: 0,
          remainingMaxVolume: 2,
          provenance: contractProvenance(`${contractor.id}-te`),
          rates: [{ workType: 'TE', quantityUnit: 'job', laborRate: 90, equipmentRate: 70 }],
        },
      ],
    }))

    const result = optimizeContractorAllocation(scenario)
    expect(result.status).toBe('PARTIAL_OPTIMAL')
    expect(result.reservations).toHaveLength(1)
    expect(result.reservations[0]).toEqual(
      expect.objectContaining({ allocationUnitId: 'TE', reason: 'COST_UNCERTAIN' })
    )
    expect(result.coverage.coverageRatio).toBe(0.5)
    expect(result.counterfactualAllocationAdvantage).toBeNull()
  })

  it('does not let an uncostable T&E candidate block a costable contractor', () => {
    const scenario = globalChoiceScenario()
    scenario.units = [scenario.units[0]]
    scenario.contractors[1] = {
      ...scenario.contractors[1],
      contracts: [
        {
          ...scenario.contractors[1].contracts[0],
          id: 'B-te',
          workTypes: ['X'],
          pricingModel: 'TIME_AND_EQUIPMENT' as const,
          provenance: contractProvenance('B-te'),
          rates: [{ workType: 'X', quantityUnit: 'job', laborRate: 90, equipmentRate: 70 }],
        },
      ],
    }

    const analysis = analyzeAllocationUnit(scenario, scenario.units[0])
    const result = optimizeContractorAllocation(scenario)
    expect(analysis.type).toBe('NO_CHOICE')
    expect(result.assignments).toEqual([expect.objectContaining({ contractorId: 'A', contractId: 'A-contract' })])
  })

  it('reports UNKNOWN instead of claiming an optimum when proof search is cut off', () => {
    const result = optimizeContractorAllocation(globalChoiceScenario(), { maxSearchNodes: 0 })

    expect(result.status).toBe('UNKNOWN')
    expect(result.lowerBound).toBe(3)
    expect(result.optimalityGapPct).toBeNull()
    expect(result.counterfactualAllocationAdvantage).toBeNull()
  })

  it('computes decision space from globally feasible portfolios, not local alternatives', () => {
    const scenario = globallyForcedScenario()
    const analyses = scenario.units.map((item) => analyzeAllocationUnit(scenario, item))
    expect(analyses.filter((analysis) => analysis.type === 'ALLOCATION_DECISION_REQUIRED')).toHaveLength(2)

    const result = optimizeContractorAllocation(scenario)
    expect(result.status).toBe('OPTIMAL')
    expect(result.metrics.localDecisionUnits).toBe(2)
    expect(result.metrics.decisionUnits).toBe(0)
    expect(result.metrics.spendWithChoice).toBe(0)
  })

  it('rejects duplicate capacity buckets and duplicate unit requirement buckets as invalid scenario input', () => {
    const scenario = globalChoiceScenario()
    scenario.contractors[0].capacityBuckets.push({ bucket: '2026-10', availableCapacity: 1 })
    scenario.units[0].capacityRequirements.push({ bucket: '2026-10', demand: 1 })

    const issues = validateContractorAllocationScenario(scenario)
    const result = optimizeContractorAllocation(scenario)
    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['DUPLICATE_CONTRACTOR_CAPACITY_BUCKET', 'DUPLICATE_UNIT_CAPACITY_BUCKET'])
    )
    expect(result.status).toBe('INVALID_INPUT')
  })

  it('keeps contract state isolated by contractor plus contract id', () => {
    const scenario = globalChoiceScenario()
    scenario.contractors[0].contracts[0].id = 'shared'
    scenario.contractors[1].contracts[0].id = 'shared'
    scenario.units[0].observedContractId = 'shared'
    scenario.units[1].observedContractId = 'shared'

    const result = optimizeContractorAllocation(scenario)
    expect(result.status).toBe('OPTIMAL')
    expect(result.assignments).toHaveLength(2)
  })

  it('creates one canonical SHA-256 scenario snapshot referenced by every assignment', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')

    const scenario = globalChoiceScenario()
    const first = optimizeContractorAllocation(scenario)
    const changed = JSON.parse(JSON.stringify(scenario)) as ContractorAllocationScenario
    changed.contractors[0].contracts[0].rates[0].unitRate = 7
    const second = optimizeContractorAllocation(changed)

    expect(first.scenarioSnapshot.algorithm).toBe('SHA-256')
    expect(first.scenarioSnapshot.id).toMatch(/^[a-f0-9]{64}$/)
    expect(first.scenarioSnapshot.canonicalInput).toContain('remainingMaxVolume')
    expect(first.scenarioSnapshot.canonicalInput).toContain('trustedAuthorities')
    expect(first.scenarioSnapshot.canonicalInput).toContain('sourceRecordId')
    expect(first.assignments.every((assignment) => assignment.inputSnapshotId === first.scenarioSnapshot.id)).toBe(true)
    expect(second.scenarioSnapshot.id).not.toBe(first.scenarioSnapshot.id)
  })

  it('produces a deterministic, fully covered economic replay for the synthetic portfolio', () => {
    const scenario = buildContractorAllocationDemoScenario()
    const first = optimizeContractorAllocation(scenario)
    const second = optimizeContractorAllocation(scenario)

    expect(first.status).toBe('OPTIMAL')
    expect(first.metrics.totalUnits).toBe(100)
    expect(first.metrics.decisionUnits).toBeGreaterThan(0)
    expect(first.metrics.spendWithChoice).toBeGreaterThan(0)
    expect(first.metrics.weightedChoiceSpreadPct).toBeGreaterThan(0)
    expect(first.unresolvedUnitIds).toEqual([])
    expect(first.coverage.coverageRatio).toBe(1)
    expect(first.observedInvalidUnitIds).toEqual([])
    expect(first.counterfactualAllocationAdvantage).not.toBeNull()
    expect(first.counterfactualAllocationAdvantage ?? 0).toBeGreaterThan(0)
    expect(first.assignments.every((assignment) => assignment.inputSnapshotId === first.scenarioSnapshot.id)).toBe(true)
    expect(second.assignments).toEqual(first.assignments)
    expect(second.qdipExpectedSpend).toBe(first.qdipExpectedSpend)
  })
})
