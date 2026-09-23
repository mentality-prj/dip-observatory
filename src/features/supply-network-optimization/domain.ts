export type StorageClass = 'ambient' | 'controlled'

export type ProductClass = {
  id: string
  unit_value: number
  holding_cost_per_unit_day: number
  storage_class: StorageClass
}

export type Warehouse = {
  id: string
  label?: string
  latitude: number
  longitude: number
  capacity_units: number
  receiving_capacity_units_per_day: number
  dispatch_capacity_units_per_day: number
  supported_storage_classes: StorageClass[]
  current_inventory: Record<string, number>
  operating_cost?: number
  is_candidate?: boolean
}

export type DemandPoint = {
  id: string
  latitude: number
  longitude: number
  region: string
  label: string
  demand_per_day: Record<string, number>
  priority_weight?: number
  minimum_service_level?: number
}

export type Supplier = {
  id: string
  label?: string
  latitude: number
  longitude: number
}

export type DeliveryRoute = {
  from_node_id: string
  to_demand_point_id: string
  lead_time_days: number
  capacity_units_per_day: number
  cost_per_unit: number
}

export type TransferRoute = {
  from_node_id: string
  to_node_id: string
  lead_time_days: number
  capacity_units_per_day: number
  cost_per_unit: number
}

export type InboundSupply = {
  id: string
  supplier_id: string
  product_class_id: string
  available_units: number
  must_allocate?: boolean
  routes: {
    to_warehouse_id: string
    transport_cost_per_unit: number
    lead_time_days: number
    capacity_units: number
  }[]
}

export type CurrentFlow = {
  warehouse_id: string
  demand_point_id: string
}

export type SupplyNetwork = {
  product_classes: ProductClass[]
  demand_points: DemandPoint[]
  warehouses: Warehouse[]
  suppliers: Supplier[]
  inbound_supply: InboundSupply[]
  delivery_routes: DeliveryRoute[]
  transfer_routes: TransferRoute[]
  unavailable_warehouse_ids: string[]
  policy: {
    planning_horizon_days: number
    minimum_service_level: number
    maximum_node_inventory_exposure: number
    solver_time_limit_seconds: number
    stockout_penalty_multiplier: number
    concentration_penalty_per_unit: number
    concentration_target_share: number
    lead_time_penalty_per_unit_day: number
  }
}

export type OptimizationResult = {
  inventory_placement: { warehouse_id: string; product_class_id: string; units: number }[]
  fulfillment: {
    warehouse_id: string
    demand_point_id: string
    product_class_id: string
    units: number
    lead_time_days: number
    cost: number
  }[]
  inbound_allocation: {
    supply_id: string
    supplier_id: string
    warehouse_id: string
    product_class_id: string
    units: number
    lead_time_days: number
    cost: number
  }[]
  transfers: {
    from_warehouse_id: string
    to_warehouse_id: string
    product_class_id: string
    units: number
    lead_time_days: number
    cost: number
  }[]
  warehouse_utilization: {
    warehouse_id: string
    used: boolean
    inventory_units: number
    capacity_units: number
    capacity_utilization: number
    receiving_units: number
    receiving_capacity_units: number
    dispatch_units: number
    dispatch_capacity_units: number
  }[]
  demand_service: {
    demand_point_id: string
    demand_units: number
    unserved_units: number
    service_level: number
    source_warehouse_ids: string[]
  }[]
  kpis: {
    service_level: number
    unserved_demand_units: number
    unserved_demand_value: number
    logistics_cost: number
    holding_cost: number
    inventory_value_at_risk: number
    objective_value: number
    business_loss: number
  }
  objective_components: Record<string, number>
  candidate_warehouse_ids_used: string[]
  binding_constraints: string[]
  solver_status: string
  solve_time_ms: number
  mip_gap: number | null
  optimal: boolean
}

export type CandidateWarehouse = {
  id: string
  label?: string
  latitude: number
  longitude: number
  capacity_units: number
  receiving_capacity_units_per_day: number
  dispatch_capacity_units_per_day: number
  supported_storage_classes: StorageClass[]
  operating_cost: number
}

export type CandidateResult = {
  candidate_id: string
  label?: string
  latitude: number
  longitude: number
  feasible: boolean
  used: boolean
  rank?: number
  objective_value?: number
  objective_improvement?: number
  required_capacity_units?: number
  configured_capacity_units?: number
  inventory_allocation?: OptimizationResult['inventory_placement']
  stores_served?: string[]
  logistics_cost?: number
  service_level?: number
  residual_concentration_risk?: number
  causes?: string[]
}

export type ScenarioComparison = {
  baseline: OptimizationResult
  disrupted: OptimizationResult
  unavailable_warehouse_id: string
  affected_demand_point_ids: string[]
  kpi_change: Record<string, number>
}
