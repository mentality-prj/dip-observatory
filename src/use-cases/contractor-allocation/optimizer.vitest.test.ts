import { describe, expect, it } from 'vitest'

import { buildContractorAllocationDemoScenario } from './demo-data'
import type { AllocationUnit, ContractorAllocationScenario, InputProvenance, SourceRole } from './domain'
import { analyzeAllocationUnit, optimizeContractorAllocation } from './optimizer'
import { sha256Hex } from './snapshot'

const capturedAt = '2026-10-01T00:00:00Z'

function source<Role extends SourceRole>(role: Role, id: string): InputProvenance<Role> {
  return { sourceRole: role, sourceSystem: `${role.toLowerCase()}-system`, sourceRecordId: id, capturedAt }
}

function unitProvenance(id: string, te = false) {
  return {
    scope: source('INSPECTOR', `${id}:scope`),
    quantity: source('INSPECTOR', `${id}:quantity`),
    territory: source('INSPECTOR', `${id}:territory`),
    workType: source('INSPECTOR', `${id}:work-type`),
    technicalRequirements: source('INSPECTOR', `${id}:requirements`),
    deadline: source('OPERATIONS', `${id}:deadline`),
    capacityRequirements: source('OPERATIONS', `${id}:capacity`),
    contractVolume: source('PROCUREMENT', `${id}:volume`),
    ...(te ? { teEstimate: source('OPERATIONS', `${id}:te`) } : {}),
  }
}

function contractProvenance(id: string) {
  return {
    eligibility: source('PROCUREMENT', `${id}:eligibility`),
    rates: source('PROCUREMENT', `${id}:rates`),
    volumeState: source('PROCUREMENT', `${id}:volume-state`),
  }
}

function contractorProvenance(id: string) {
  return {
    capacityBuckets: source('OPERATIONS', `${id}:capacity`),
    equipment: source('OPERATIONS', `${id}:equipment`),
    certifications: source('OPERATIONS', `${id}:certifications`),
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
    allocationLevel: 'WORK_PACKAGE',
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
  return {
    id: 'multi-contract-test',
    asOf: '2026-10-01',
    allocationLevel: 'WORK_PACKAGE',
    units: ['U1', 'U2'].map((id) => ({
      ...unit(id, 'X', 2, '2026-10'),
      quantity: 2,
      contractVolume: 2,
    })),
    contractors: [
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
    ],
  }
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

  it('rejects decision-driving inputs when planner provenance replaces the authoritative owner', () => {
    const scenario = globalChoiceScenario()
    scenario.units[0].provenance.deadline = source('PLANNER', 'planner:deadline') as never

    const analysis = analyzeAllocationUnit(scenario, scenario.units[0])
    expect(analysis.type).toBe('INFEASIBLE')
    expect(analysis.rejected.every((candidate) => candidate.reasons.includes('UNTRUSTED_INPUT'))).toBe(true)
  })

  it('rejects future information that was not available at decision time', () => {
    const scenario = globalChoiceScenario()
    scenario.contractors[0].provenance.capacityBuckets = {
      ...scenario.contractors[0].provenance.capacityBuckets,
      capturedAt: '2026-10-02T00:00:00Z',
    }

    const analysis = analyzeAllocationUnit(scenario, scenario.units[0])
    const rejectedA = analysis.rejected.find((candidate) => candidate.contractorId === 'A')
    expect(rejectedA?.reasons).toContain('UNTRUSTED_INPUT')
  })

  it('marks time-and-equipment work as an exception when no costable alternative exists', () => {
    const scenario = globalChoiceScenario()
    const teUnit = {
      ...scenario.units[0],
      id: 'TE',
      workType: 'TE',
      observedContractorId: undefined,
      observedContractId: undefined,
      provenance: unitProvenance('TE'),
    }
    scenario.units = [teUnit]
    scenario.contractors = scenario.contractors.map((contractor) => ({
      ...contractor,
      contracts: [
        {
          ...contractor.contracts[0],
          workTypes: ['TE'],
          pricingModel: 'TIME_AND_EQUIPMENT' as const,
          rates: [{ workType: 'TE', quantityUnit: 'job', laborRate: 90, equipmentRate: 70 }],
        },
      ],
    }))

    expect(analyzeAllocationUnit(scenario, teUnit).type).toBe('EXCEPTION_REQUIRED')
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
          pricingModel: 'TIME_AND_EQUIPMENT',
          provenance: contractProvenance('B-te'),
          rates: [{ workType: 'X', quantityUnit: 'job', laborRate: 90, equipmentRate: 70 }],
        },
      ],
    }

    const analysis = analyzeAllocationUnit(scenario, scenario.units[0])
    const result = optimizeContractorAllocation(scenario)

    expect(analysis.type).toBe('NO_CHOICE')
    expect(analysis.feasible).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ contractorId: 'A', expectedCost: 1, requiresException: false }),
        expect.objectContaining({ contractorId: 'B', expectedCost: null, requiresException: true }),
      ])
    )
    expect(result.assignments).toEqual([expect.objectContaining({ contractorId: 'A', contractId: 'A-contract' })])
  })

  it('reports UNKNOWN instead of claiming a bounded optimum when proof search is cut off', () => {
    const result = optimizeContractorAllocation(globalChoiceScenario(), { maxSearchNodes: 0 })

    expect(result.status).toBe('UNKNOWN')
    expect(result.lowerBound).toBe(3)
    expect(result.optimalityGapPct).toBeNull()
    expect(result.counterfactualAllocationAdvantage).toBeNull()
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
    expect(first.scenarioSnapshot.canonicalInput).toContain('consumedVolumeToDate')
    expect(first.scenarioSnapshot.canonicalInput).toContain('remainingMaxVolume')
    expect(first.scenarioSnapshot.canonicalInput).toContain('sourceRecordId')
    expect(first.assignments.every((assignment) => assignment.inputSnapshotId === first.scenarioSnapshot.id)).toBe(true)
    expect(second.scenarioSnapshot.id).not.toBe(first.scenarioSnapshot.id)
  })

  it('produces a deterministic economic replay for the synthetic portfolio', () => {
    const scenario = buildContractorAllocationDemoScenario()
    const first = optimizeContractorAllocation(scenario)
    const second = optimizeContractorAllocation(scenario)

    expect(first.status).toBe('OPTIMAL')
    expect(first.metrics.totalUnits).toBe(100)
    expect(first.metrics.decisionUnits).toBeGreaterThan(0)
    expect(first.metrics.spendWithChoice).toBeGreaterThan(0)
    expect(first.metrics.weightedChoiceSpreadPct).toBeGreaterThan(0)
    expect(first.unresolvedUnitIds.length).toBeGreaterThan(0)
    expect(first.observedInvalidUnitIds).toEqual([])
    expect(first.counterfactualAllocationAdvantage).not.toBeNull()
    expect(first.counterfactualAllocationAdvantage ?? 0).toBeGreaterThan(0)
    expect(first.assignments.every((assignment) => assignment.inputSnapshotId === first.scenarioSnapshot.id)).toBe(true)
    expect(second.assignments).toEqual(first.assignments)
    expect(second.qdipExpectedSpend).toBe(first.qdipExpectedSpend)
  })
})
