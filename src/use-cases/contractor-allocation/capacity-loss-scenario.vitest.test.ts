import { describe, expect, it } from 'vitest'

import { buildContractorCapacityLossScenario } from './capacity-loss-scenario'
import { optimizeContractorAllocation } from './optimizer'

describe('contractor capacity loss recovery scenario', () => {
  it('reallocates all 266 awarded miles after the incumbent loses executable capacity', () => {
    const scenario = buildContractorCapacityLossScenario()
    const result = optimizeContractorAllocation(scenario)
    const unitById = new Map(scenario.units.map((unit) => [unit.id, unit]))
    const recoveredMiles = result.assignments.reduce(
      (sum, assignment) => sum + (unitById.get(assignment.allocationUnitId)?.quantity ?? 0),
      0
    )

    expect(scenario.allocationLevel).toBe('AWARDED_VOLUME')
    expect(scenario.units.reduce((sum, unit) => sum + unit.quantity, 0)).toBe(266)
    expect(scenario.units.every((unit) => unit.quantityUnit === 'mile')).toBe(true)
    expect(scenario.units.every((unit) => unit.observedContractorId === 'arbor-north')).toBe(true)
    expect(
      scenario.contractors
        .find((contractor) => contractor.id === 'arbor-north')
        ?.capacityBuckets.find((bucket) => bucket.bucket === '2026-10')?.availableCapacity
    ).toBe(0)

    expect(result.status).toBe('OPTIMAL')
    expect(result.assignments).toHaveLength(scenario.units.length)
    expect(result.assignments.every((assignment) => assignment.contractorId !== 'arbor-north')).toBe(true)
    expect(recoveredMiles).toBe(266)
    expect(result.observedInvalidUnitIds).toHaveLength(scenario.units.length)
    expect(result.counterfactualAllocationAdvantage).toBeNull()
    expect(result.qdipExpectedSpend).toBeGreaterThan(0)
  })

  it('uses multiple recovery contractors instead of overloading one substitute', () => {
    const result = optimizeContractorAllocation(buildContractorCapacityLossScenario())
    expect(new Set(result.assignments.map((assignment) => assignment.contractorId)).size).toBeGreaterThan(1)
  })
})
