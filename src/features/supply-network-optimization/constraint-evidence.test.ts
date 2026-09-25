import { describe, expect, it } from 'vitest'
import { hardConstraintEvidence, softPreferenceEvidence } from './constraint-evidence'
import { SUPPLY_NETWORK_DEMO } from './demo-data'
import type { OptimizationResult } from './domain'

function result(overrides: Partial<OptimizationResult> = {}): OptimizationResult {
  return {
    ending_inventory: [],
    fulfillment: [],
    inbound_allocation: [],
    transfers: [],
    warehouse_utilization: [],
    demand_service: [],
    kpis: {
      service_level: 1,
      maximum_fulfillment_share: 0,
      maximum_inventory_share: 0,
      unserved_demand_units: 0,
      unserved_demand_value: 0,
      stockout_cost: 0,
      logistics_cost: 0,
      holding_cost: 0,
      facility_fixed_cost: 0,
      handling_cost: 0,
      reallocation_cost: 0,
      lead_time_penalty: 0,
      inbound_cancellation_cost: 0,
      inventory_value_at_risk: 0,
      objective_value: 0,
      estimated_business_impact: 0,
      business_loss: 0,
    },
    objective_components: {},
    candidate_warehouse_ids_used: [],
    binding_constraints: [],
    solver_status: 'optimal',
    solve_time_ms: 1,
    mip_gap: 0,
    optimal: true,
    ...overrides,
  }
}

describe('supply constraint evidence normalization', () => {
  it('moves legacy soft concentration evidence out of hard bottlenecks', () => {
    const optimized = result({
      binding_constraints: ['concentration-target:central-hub:0', 'warehouse-capacity:central-hub:0'],
    })

    expect(hardConstraintEvidence(optimized, SUPPLY_NETWORK_DEMO)).toEqual(['warehouse-capacity:central-hub:0'])
    expect(softPreferenceEvidence(optimized)).toEqual(['concentration-target:central-hub:0'])
  })

  it('does not treat an unused delivery route lower bound as a bottleneck', () => {
    const route = SUPPLY_NETWORK_DEMO.delivery_routes[0]
    const label = `delivery-route-capacity:${route.from_node_id}:${route.to_demand_point_id}:0`
    const optimized = result({ binding_constraints: [label] })

    expect(hardConstraintEvidence(optimized, SUPPLY_NETWORK_DEMO)).toEqual([])
  })

  it('keeps a delivery route when actual flow reaches its upper capacity', () => {
    const route = SUPPLY_NETWORK_DEMO.delivery_routes[0]
    const label = `delivery-route-capacity:${route.from_node_id}:${route.to_demand_point_id}:0`
    const optimized = result({
      binding_constraints: [label],
      fulfillment: [
        {
          warehouse_id: route.from_node_id,
          demand_point_id: route.to_demand_point_id,
          product_class_id: 'core',
          units: route.capacity_units_per_day,
          lead_time_days: route.lead_time_days,
          departure_period: 0,
          cost: 0,
        },
      ],
    })

    expect(hardConstraintEvidence(optimized, SUPPLY_NETWORK_DEMO)).toEqual([label])
  })
})
