import type { SupplyResilienceInput } from './domain'

export function toDipSupplyResilienceInput(input: SupplyResilienceInput) {
  return {
    product_classes: input.productClasses.map((product) => ({ id: product.id, unit_value: product.unitValue.amount, holding_cost_per_unit_day: product.holdingCostPerUnitDay.amount, storage_class: product.storageClass })),
    demand_points: input.demandPoints.map((point) => ({ id: point.id, demand_per_day: point.demandPerDay })),
    nodes: input.nodes.map((node) => ({ id: node.id, capacity_units: node.capacityUnits, supported_storage_classes: node.supportedStorageClasses, inventory_units: node.inventoryUnits })),
    routes: input.routes.map((route) => ({ from_node_id: route.fromNodeId, to_demand_point_id: route.toDemandPointId, lead_time_days: route.leadTimeDays, capacity_units_per_day: route.capacityUnitsPerDay, cost_per_unit: route.costPerUnit.amount })),
    transfer_routes: input.transferRoutes.map((route) => ({ from_node_id: route.fromNodeId, to_node_id: route.toNodeId, lead_time_days: route.leadTimeDays, capacity_units_per_day: route.capacityUnitsPerDay, cost_per_unit: route.costPerUnit.amount })),
    scenarios: input.scenarios.map((scenario) => ({ id: scenario.id, unavailable_node_ids: scenario.unavailableNodeIds })),
    policy: { planning_horizon_days: input.policy.planningHorizonDays, minimum_service_level: input.policy.minimumServiceLevel, maximum_node_inventory_exposure: input.policy.maximumNodeInventoryExposure, maximum_incremental_logistics_cost: input.policy.maximumIncrementalLogisticsCost.amount },
  }
}
