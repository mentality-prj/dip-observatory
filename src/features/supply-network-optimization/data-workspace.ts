import type { SupplyNetwork } from './domain'

export const SUPPLY_DATA_SCHEMA_VERSION = 'supply-network.v1' as const

export type SupplyDataPackage = {
  schemaVersion: typeof SUPPLY_DATA_SCHEMA_VERSION
  exportedAt: string
  input: SupplyNetwork
  result?: unknown
}

export type SupplyValidationIssue = { path: string; message: string }

export const SUPPLY_DATA_DICTIONARY = [
  ['product_classes[]', 'Products with value, holding cost and storage class', 'object[]', 'required'],
  ['demand_points[]', 'Demand locations and daily product demand', 'object[]', 'required'],
  ['warehouses[]', 'Warehouse location, storage/flow capacities and inventory', 'object[]', 'required'],
  ['suppliers[]', 'Supplier nodes', 'object[]', 'required'],
  ['inbound_supply[]', 'Available inbound supply and routes to warehouses', 'object[]', 'required'],
  ['delivery_routes[]', 'Warehouse-to-demand routes with lead time, capacity and cost', 'object[]', 'required'],
  ['transfer_routes[]', 'Inter-warehouse routes', 'object[]', 'required'],
  ['policy', 'Service floors, concentration limits, penalties and solver budget', 'object', 'required'],
] as const

function positive(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function validateSupplyNetwork(value: unknown): SupplyValidationIssue[] {
  if (!value || typeof value !== 'object') return [{ path: '$', message: 'Expected an object.' }]
  const input = value as Partial<SupplyNetwork>
  const issues: SupplyValidationIssue[] = []
  for (const field of [
    'product_classes',
    'demand_points',
    'warehouses',
    'suppliers',
    'inbound_supply',
    'delivery_routes',
    'transfer_routes',
  ] as const) {
    if (!Array.isArray(input[field])) issues.push({ path: field, message: 'Expected an array.' })
  }
  if (!input.policy || typeof input.policy !== 'object') issues.push({ path: 'policy', message: 'Required object.' })
  if (Array.isArray(input.warehouses)) {
    input.warehouses.forEach((warehouse, index) => {
      if (!warehouse.id?.trim()) issues.push({ path: `warehouses[${index}].id`, message: 'Required.' })
      if (!positive(warehouse.capacity_units))
        issues.push({ path: `warehouses[${index}].capacity_units`, message: 'Expected a positive number.' })
      if (!positive(warehouse.receiving_capacity_units_per_day))
        issues.push({
          path: `warehouses[${index}].receiving_capacity_units_per_day`,
          message: 'Expected a positive number.',
        })
      if (!positive(warehouse.dispatch_capacity_units_per_day))
        issues.push({
          path: `warehouses[${index}].dispatch_capacity_units_per_day`,
          message: 'Expected a positive number.',
        })
    })
  }
  if (input.policy) {
    if (!positive(input.policy.planning_horizon_days))
      issues.push({ path: 'policy.planning_horizon_days', message: 'Expected a positive number.' })
    if (
      typeof input.policy.minimum_service_level !== 'number' ||
      input.policy.minimum_service_level < 0 ||
      input.policy.minimum_service_level > 1
    ) {
      issues.push({ path: 'policy.minimum_service_level', message: 'Expected a value between 0 and 1.' })
    }
  }
  return issues
}

export function supplyExactTemplate(input: SupplyNetwork): SupplyDataPackage {
  return { schemaVersion: SUPPLY_DATA_SCHEMA_VERSION, exportedAt: new Date(0).toISOString(), input }
}

export function supplyExportAnalysis(input: SupplyNetwork, result?: unknown): SupplyDataPackage {
  return { schemaVersion: SUPPLY_DATA_SCHEMA_VERSION, exportedAt: new Date().toISOString(), input, result }
}

export function importSupplyExactPackage(value: unknown): { input?: SupplyNetwork; issues: SupplyValidationIssue[] } {
  if (!value || typeof value !== 'object') return { issues: [{ path: '$', message: 'Expected JSON object.' }] }
  const candidate = value as Partial<SupplyDataPackage>
  if (candidate.schemaVersion !== SUPPLY_DATA_SCHEMA_VERSION)
    return { issues: [{ path: 'schemaVersion', message: `Expected ${SUPPLY_DATA_SCHEMA_VERSION}.` }] }
  const issues = validateSupplyNetwork(candidate.input)
  return issues.length ? { issues } : { input: candidate.input as SupplyNetwork, issues: [] }
}

export function downloadSupplyJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
