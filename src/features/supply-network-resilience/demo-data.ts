import type { SupplyResilienceInput } from './domain'

/**
 * Synthetic distribution network for a multi-region specialty retailer.
 * Names and values are intentionally generic; the shape represents a realistic
 * import -> distribution hubs -> regional retail network decision.
 */
export const SUPPLY_RESILIENCE_DEMO: SupplyResilienceInput = {
  nodes: [
    { id: 'west-hub', label: 'West hub', capacity: 0.82, inventoryValue: 18.4 },
    { id: 'central-hub', label: 'Central hub', capacity: 0.94, inventoryValue: 42.8 },
    { id: 'south-hub', label: 'South hub', capacity: 0.67, inventoryValue: 12.6 },
  ],
  flows: [
    { from: 'west-hub', to: 'central-hub', share: 0.38 },
    { from: 'central-hub', to: 'west-hub', share: 0.12 },
    { from: 'central-hub', to: 'south-hub', share: 0.24 },
    { from: 'south-hub', to: 'central-hub', share: 0.08 },
  ],
  scenarios: [
    { id: 'normal', label: 'Normal operation', unavailableNodeId: null },
    { id: 'central-unavailable', label: 'Primary node unavailable', unavailableNodeId: 'central-hub' },
    { id: 'west-unavailable', label: 'West node unavailable', unavailableNodeId: 'west-hub' },
    { id: 'south-unavailable', label: 'South node unavailable', unavailableNodeId: 'south-hub' },
  ],
  maxNodeExposure: 0.45,
  serviceLevelTarget: 0.92,
}
