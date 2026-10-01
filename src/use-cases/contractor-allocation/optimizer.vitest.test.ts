import { describe, expect, it } from 'vitest'

import { buildContractorAllocationDemoScenario } from './demo-data'
import type { ContractorAllocationScenario } from './domain'
import { analyzeAllocationUnit, optimizeContractorAllocation } from './optimizer'

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
        deadline: '2026-10-10',
        priority: 1,
        requiredEquipment: [],
        requiredCertifications: [],
        scopeId: 'S1',
        scopeVersion: 1,
        observedContractorId: 'A',
      },
      {
        id: 'U2',
        type: 'WORK_PACKAGE',
        territory: 'T',
        workType: 'Y',
        quantity: 1,
        quantityUnit: 'job',
        deadline: '2026-10-10',
        priority: 1,
        requiredEquipment: [],
        requiredCertifications: [],
        scopeId: 'S2',
        scopeVersion: 1,
        observedContractorId: 'B',
      },
    ],
    contractors: [
      {
        id: 'A',
        name: 'A',
        availableCapacity: 1,
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
        availableCapacity: 1,
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

describe('contractor allocation optimizer', () => {
  it('optimizes the portfolio globally instead of greedily assigning the cheapest contractor per unit', () => {
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

  it('marks time-and-equipment work as an exception when trusted hours are unavailable', () => {
    const scenario = globalChoiceScenario()
    const unit = {
      ...scenario.units[0],
      id: 'TE',
      workType: 'TE',
      quantityUnit: 'job',
      observedContractorId: undefined,
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

  it('rejects a contractor that cannot satisfy a hard equipment requirement', () => {
    const scenario = globalChoiceScenario()
    const unit = { ...scenario.units[0], requiredEquipment: ['crane'] }
    const analysis = analyzeAllocationUnit(scenario, unit)

    expect(analysis.type).toBe('INFEASIBLE')
    expect(analysis.rejected.every((candidate) => candidate.reasons.includes('MISSING_EQUIPMENT'))).toBe(true)
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
    expect(second.assignments).toEqual(first.assignments)
    expect(second.qdipExpectedSpend).toBe(first.qdipExpectedSpend)
  })
})
