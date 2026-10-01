import { describe, expect, it } from 'vitest'

import {
  buildContractorCapacityLossScenario,
  EVERSOURCE_CAPACITY_LOSS_CIRCUITS,
  EVERSOURCE_CAPACITY_LOSS_FACTS,
} from './capacity-loss-scenario'
import { optimizeContractorAllocation } from './optimizer'

describe('contractor capacity loss recovery scenario', () => {
  it('uses the published Nashua AWC circuit scope and SMT/METT split', () => {
    const scenario = buildContractorCapacityLossScenario()
    const smtMiles = scenario.units
      .filter((unit) => unit.workType === 'SMT')
      .reduce((sum, unit) => sum + unit.quantity, 0)
    const mettMiles = scenario.units
      .filter((unit) => unit.workType === 'METT')
      .reduce((sum, unit) => sum + unit.quantity, 0)
    const totalMiles = scenario.units.reduce((sum, unit) => sum + unit.quantity, 0)

    expect(EVERSOURCE_CAPACITY_LOSS_CIRCUITS).toHaveLength(14)
    expect(new Set(EVERSOURCE_CAPACITY_LOSS_CIRCUITS.map((row) => row.circuit)).size).toBe(14)
    expect(scenario.units).toHaveLength(17)
    expect(smtMiles).toBeCloseTo(EVERSOURCE_CAPACITY_LOSS_FACTS.smtMiles, 6)
    expect(mettMiles).toBeCloseTo(EVERSOURCE_CAPACITY_LOSS_FACTS.mettMiles, 6)
    expect(totalMiles).toBeCloseTo(EVERSOURCE_CAPACITY_LOSS_FACTS.totalMiles, 6)
    expect(scenario.units.some((unit) => unit.id === '314X4_22-SMT' && unit.quantity === 91.53)).toBe(true)
    expect(scenario.units.some((unit) => unit.id === '314X4_22-METT' && unit.quantity === 5.97)).toBe(true)
  })

  it('models procurement as a completed synthetic rebid handoff without per-slice mobilization artifacts', () => {
    const scenario = buildContractorCapacityLossScenario()
    const recoveryBidders = scenario.contractors.filter((contractor) => contractor.id !== 'synthetic-incumbent')

    expect(recoveryBidders).toHaveLength(3)
    expect(recoveryBidders.every((contractor) => contractor.name.startsWith('Synthetic bidder '))).toBe(true)
    expect(
      scenario.contractors.every((contractor) =>
        contractor.contracts.every((contract) =>
          contract.rates.every((rate) => rate.mobilizationCost == null && rate.overtimeCost == null)
        )
      )
    ).toBe(true)
  })

  it('reallocates the full 266.21-mile published scope after the incumbent loses capacity for the returned work', () => {
    const scenario = buildContractorCapacityLossScenario()
    const result = optimizeContractorAllocation(scenario)
    const unitById = new Map(scenario.units.map((unit) => [unit.id, unit]))
    const reallocatedMiles = result.assignments.reduce(
      (sum, assignment) => sum + (unitById.get(assignment.allocationUnitId)?.quantity ?? 0),
      0
    )

    expect(scenario.allocationLevel).toBe('AWARDED_VOLUME')
    expect(scenario.units.every((unit) => unit.quantityUnit === 'mile')).toBe(true)
    expect(scenario.units.every((unit) => unit.observedContractorId === 'synthetic-incumbent')).toBe(true)
    expect(
      scenario.contractors
        .find((contractor) => contractor.id === 'synthetic-incumbent')
        ?.capacityBuckets.find((bucket) => bucket.bucket === '2022')?.availableCapacity
    ).toBe(0)

    expect(result.status).toBe('OPTIMAL')
    expect(result.assignments).toHaveLength(scenario.units.length)
    expect(result.assignments.every((assignment) => assignment.contractorId !== 'synthetic-incumbent')).toBe(true)
    expect(reallocatedMiles).toBeCloseTo(EVERSOURCE_CAPACITY_LOSS_FACTS.totalMiles, 6)
    expect(result.observedInvalidUnitIds).toHaveLength(scenario.units.length)
    expect(result.counterfactualAllocationAdvantage).toBeNull()
    expect(result.qdipExpectedSpend).toBeGreaterThan(0)
  })

  it('uses multiple recovery bidders instead of overloading one substitute', () => {
    const result = optimizeContractorAllocation(buildContractorCapacityLossScenario())
    expect(new Set(result.assignments.map((assignment) => assignment.contractorId)).size).toBeGreaterThan(1)
  })
})
