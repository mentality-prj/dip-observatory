import 'server-only'

import { z } from 'zod'
import { publicDipRequest } from '@/shared/dip/server-client'
import type { CandidateWarehouse, SupplyNetwork } from './domain'

const payloadSchema = z.object({
  result: z.record(z.string(), z.unknown()),
  evidence: z.record(z.string(), z.unknown()),
  decision_value: z.unknown().optional(),
})

export function optimizeSupplyNetwork(network: SupplyNetwork) {
  return publicDipRequest('/api/v1/supply-network/public/optimize', payloadSchema, {
    method: 'POST',
    body: JSON.stringify(network),
  })
}

export function makeWarehouseUnavailable(network: SupplyNetwork, warehouseId: string) {
  return publicDipRequest('/api/v1/supply-network/public/unavailable', payloadSchema, {
    method: 'POST',
    body: JSON.stringify({ network, warehouse_id: warehouseId }),
  })
}

export function evaluateCandidateAreas(network: SupplyNetwork) {
  return publicDipRequest('/api/v1/supply-network/public/candidates', payloadSchema, {
    method: 'POST',
    body: JSON.stringify({
      network,
      candidate_capacity_units: 1800,
      receiving_capacity_units_per_day: 340,
      dispatch_capacity_units_per_day: 380,
      supported_storage_classes: ['ambient', 'controlled'],
      operating_cost: 0,
      opening_cost: 1200000,
      opening_cost_amortization_days: 365,
      fixed_operating_cost_per_day: 22000,
      handling_cost_per_unit: 14,
      minimum_distance_from_existing_warehouse_km: 40,
      maximum_candidates: 5,
    }),
  })
}

export function evaluateManualCandidate(network: SupplyNetwork, candidate: CandidateWarehouse) {
  return publicDipRequest('/api/v1/supply-network/public/candidate', payloadSchema, {
    method: 'POST',
    body: JSON.stringify({ network, candidate }),
  })
}
