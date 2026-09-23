import { describe, expect, it } from 'vitest'
import { SUPPLY_RESILIENCE_DEMO } from './demo-data'
import { toDipSupplyResilienceInput } from './mapper'

describe('supply resilience API mapping', () => {
  it('maps UI domain to backend contract without customer identifiers', () => {
    const mapped = toDipSupplyResilienceInput(SUPPLY_RESILIENCE_DEMO)
    expect(mapped.product_classes[0]).toHaveProperty('unit_value')
    expect(mapped.nodes[0]).toHaveProperty('capacity_units')
    expect(mapped.routes[0]).toHaveProperty('capacity_units_per_day')
    expect(mapped.policy.planning_horizon_days).toBe(14)
    expect(JSON.stringify(mapped).toLowerCase()).not.toContain('winetime')
  })
})
