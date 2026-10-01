import { describe, expect, it } from 'vitest'

import { buildContractorAllocationDemoScenario } from './demo-data'
import type { ContractorAllocationScenario } from './domain'
import { analyzeAllocationUnit, optimizeContractorAllocation } from './optimizer'
import { sha256Hex } from './snapshot'

function globalChoiceScenario(): ContractorAllocationScenario {
  return {
    id: 'global-choice-test',
    asOf: '2026-10-01',
    allocationLevel: 'WORK_PACKAGE',
    units: [
      {
        id: 'U1',
        type: 'WORK_PACKAGE',
        territory: 'T',
        workType: 'X',
        quantity: 1,
        quantityUnit: 'job',
        capacityDemand: 2,
        contractVolume: 1,
        deadline: '2026-10-10',
        priority: 1,
        requiredEquipment: [],
        requiredCertifications: [],
        scopeId: 'S1',
        scopeVersion: 1,
        observedContractorId: 'A',
        observedContractId: 'A-contract',
      },
      {
        id: 'U2',
        type: 'WORK_PACKAGE',
        territory: 'T',
        workType: 'Y',
        quantity: 1,
        quantityUnit: 'job',
        capacityDemand: 3,
        contractVolume: 1,
        deadline: '2026-10-10',
        priority: 1,
        requiredEquipment: [],
        requiredCertifications: [],
        scopeId: 'S2',
        scopeVersion: 1,
        observedContractorId: 'B',
        observedContractId: 'B-contract',
      },
    ],
    contractors: [
      {
        id: 'A',
        name: 'A',
        availableCapacity: 3,
        availableThrough: '2026-12-31',
        equipment: [],
        certifications: [],
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
        availableCapacity: 2,
        availableThrough: '2026-12-31',
        equipment: [],
        certifications: [],
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
    units: ['U1', 'U2'].map((id, index) => ({
      id,
      type: 'WORK_PACKAGE' as const,
      territory: 'T',
      workType: 'X',
      quantity: 2,
      quantityUnit: 'job',
      capacityDemand: 2,
      contractVolume: 2,
      deadline: '2026-10-10',
      priority: 1,
      requiredEquipment: [],
      requiredCertifications: [],
      scopeId: `S${index + 1}`,
      scopeVersion: 1,
    })),
    contractors: [
      {
        id: 'A',
        name: 'A',
        availableCapacity: 4,
        availableThrough: '2026-12-31',
        equipment: [],
        certifications: [],
        contracts: [
          {
            id: 'A-cheap',
            approved: true,
            validFrom: '2026-01-01',
            validTo: '2026-12-31',
            territories: ['T'],
            workTypes: ['X'],
            pricingModel: 'UNIT_PRICE',
            maxVolume: 2,
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
            maxVolume: 4,
            rates: [{ workType: 'X', quantityUnit: 'job', unitRate: 3 }],
          },
        ],
      },
    ],
  }
}

describe('contractor allocation optimizer', () => {
  it('optimizes indivisible workload globally instead of counting packages as equal capacity', () => {
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
  })

  it('consumes contract volume and preserves multiple contracts for the same contractor', () => {
    const scenario = multiContractScenario()
    const analysis = analyzeAllocationUnit(scenario, scenario.units[0])
    const result = optimizeContractorAllocation(scenario)

    expect(analysis.type).toBe('NO_CHOICE')
    expect(analysis.feasible.map((candidate) => candidate.contractId)).toEqual(['A-cheap', 'A-overflow'])
    expect(result.status).toBe('OPTIMAL')
    expect(result.assignments.map((assignment) => assignment.contractId).sort()).toEqual(['A-cheap', 'A-overflow'])
    expect(result.qdipExpectedSpend).toBe(8)
  })

  it('marks time-and-equipment work as an exception when no costable alternative exists', () => {
    const scenario = globalChoiceScenario()
    const unit = {
      ...scenario.units[0],
      id: 'TE',
      workType: 'TE',
      quantityUnit: 'job',
      observedContractorId: undefined,
      observedContractId: undefined,
    }
    scenario.units = [unit]
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

    expect(analyzeAllocationUnit(scenario, unit).type).toBe('EXCEPTION_REQUIRED')
  })

  it('does not let an uncostable T&E candidate block a costable contractor', () => {
    const scenario = globalChoiceScenario()
    scenario.units = [{ ...scenario.units[0], observedContractorId: 'A', observedContractId: 'A-contract' }]
    scenario.contractors[1] = {
      ...scenario.contractors[1],
      contracts: [
        {
          ...scenario.contractors[1].contracts[0],
          id: 'B-te',
          workTypes: ['X'],
          pricingModel: 'TIME_AND_EQUIPMENT',
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

  it('rejects a contractor that cannot satisfy weighted capacity or equipment requirements', () => {
    const scenario = globalChoiceScenario()
    const capacityAnalysis = analyzeAllocationUnit(scenario, {
      ...scenario.units[0],
      capacityDemand: 4,
    })
    const equipmentAnalysis = analyzeAllocationUnit(scenario, {
      ...scenario.units[0],
      requiredEquipment: ['crane'],
    })

    expect(capacityAnalysis.type).toBe('INFEASIBLE')
    expect(capacityAnalysis.rejected.every((candidate) => candidate.reasons.includes('NO_CAPACITY'))).toBe(true)
    expect(equipmentAnalysis.type).toBe('INFEASIBLE')
    expect(equipmentAnalysis.rejected.every((candidate) => candidate.reasons.includes('MISSING_EQUIPMENT'))).toBe(true)
  })

  it('creates a canonical SHA-256 snapshot that changes with authoritative inputs', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')

    const scenario = globalChoiceScenario()
    const first = optimizeContractorAllocation(scenario)
    const changed = JSON.parse(JSON.stringify(scenario)) as ContractorAllocationScenario
    changed.contractors[0].contracts[0].rates[0].unitRate = 7
    const second = optimizeContractorAllocation(changed)

    const firstSnapshot = first.assignments.find((assignment) => assignment.allocationUnitId === 'U1')?.inputSnapshot
    const secondSnapshot = second.assignments.find((assignment) => assignment.allocationUnitId === 'U1')?.inputSnapshot

    expect(firstSnapshot?.algorithm).toBe('SHA-256')
    expect(firstSnapshot?.id).toMatch(/^[a-f0-9]{64}$/)
    expect(firstSnapshot?.canonicalInput).toContain('availableCapacity')
    expect(firstSnapshot?.canonicalInput).toContain('unitRate')
    expect(secondSnapshot?.id).not.toBe(firstSnapshot?.id)
  })

  it('produces a deterministic weighted economic replay for the synthetic portfolio', () => {
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
    expect(first.assignments.every((assignment) => assignment.inputSnapshot.id.length === 64)).toBe(true)
    expect(second.assignments).toEqual(first.assignments)
    expect(second.qdipExpectedSpend).toBe(first.qdipExpectedSpend)
  })
})
