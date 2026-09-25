import { describe, expect, it } from 'vitest'
import { SUPPLY_NETWORK_CURRENT_FLOWS, SUPPLY_NETWORK_DEMO } from './demo-data'
import { buildFlowSegments } from './network-map'
import type { OptimizationResult } from './domain'

const result = {
  fulfillment: [
    { warehouse_id: 'north-hub', demand_point_id: 'north-east', product_class_id: 'core', units: 120 },
  ],
  transfers: [
    { from_warehouse_id: 'west-hub', to_warehouse_id: 'central-hub', product_class_id: 'core', units: 40 },
  ],
  inbound_allocation: [
    { supply_id: 'incoming-core', supplier_id: 'supplier-main', warehouse_id: 'west-hub', product_class_id: 'core', units: 80 },
  ],
} as OptimizationResult

describe('buildFlowSegments', () => {
  it('builds visible current network flows before optimization', () => {
    const segments = buildFlowSegments(SUPPLY_NETWORK_DEMO, SUPPLY_NETWORK_CURRENT_FLOWS, null, null, [])
    expect(segments.filter((item) => item.kind === 'current').length).toBeGreaterThan(0)
  })

  it('builds QDIP fulfillment, transfer and supplier inbound flows from the result', () => {
    const segments = buildFlowSegments(SUPPLY_NETWORK_DEMO, SUPPLY_NETWORK_CURRENT_FLOWS, result, null, [])
    expect(segments.some((item) => item.kind === 'recommended')).toBe(true)
    expect(segments.some((item) => item.kind === 'transfer')).toBe(true)
    expect(segments.some((item) => item.kind === 'inbound')).toBe(true)
  })
})
