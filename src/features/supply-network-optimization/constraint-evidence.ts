import type { OptimizationResult, SupplyNetwork } from './domain'

const SOFT_PREFERENCE_PREFIXES = ['concentration-target:'] as const

function isSoftPreference(label: string) {
  return SOFT_PREFERENCE_PREFIXES.some((prefix) => label.startsWith(prefix))
}

function routeCapacityIsActuallyBinding(
  label: string,
  result: OptimizationResult,
  network: SupplyNetwork
) {
  const [kind, from, to, periodText] = label.split(':')
  const period = Number(periodText)
  if (!Number.isInteger(period) || period < 0 || !from || !to) return false

  if (kind === 'delivery-route-capacity') {
    const route = network.delivery_routes.find(
      (item) => item.from_node_id === from && item.to_demand_point_id === to
    )
    if (!route) return false
    const used = result.fulfillment
      .filter(
        (item) =>
          item.warehouse_id === from &&
          item.demand_point_id === to &&
          item.departure_period === period
      )
      .reduce((sum, item) => sum + item.units, 0)
    const tolerance = Math.max(1, route.capacity_units_per_day) * 1e-5
    return Math.abs(used - route.capacity_units_per_day) <= tolerance
  }

  if (kind === 'transfer-route-capacity') {
    const route = network.transfer_routes.find(
      (item) => item.from_node_id === from && item.to_node_id === to
    )
    if (!route) return false
    const used = result.transfers
      .filter(
        (item) =>
          item.from_warehouse_id === from &&
          item.to_warehouse_id === to &&
          item.departure_period === period
      )
      .reduce((sum, item) => sum + item.units, 0)
    const tolerance = Math.max(1, route.capacity_units_per_day) * 1e-5
    return Math.abs(used - route.capacity_units_per_day) <= tolerance
  }

  return true
}

export function hardConstraintEvidence(result: OptimizationResult, network: SupplyNetwork) {
  return result.binding_constraints.filter(
    (label) => !isSoftPreference(label) && routeCapacityIsActuallyBinding(label, result, network)
  )
}

export function softPreferenceEvidence(result: OptimizationResult) {
  const legacySoft = result.binding_constraints.filter(isSoftPreference)
  return Array.from(new Set([...(result.binding_preferences ?? []), ...legacySoft]))
}
