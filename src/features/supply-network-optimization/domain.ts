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
  opening_cost?: number
  opening_cost_amortization_days?: number
  fixed_operating_cost_per_day?: number
  handling_cost_per_unit?: number
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
  transport_mode?: string
}

export type TransferRoute = {
  from_node_id: string
  to_node_id: string
  lead_time_days: number
  capacity_units_per_day: number
  cost_per_unit: number
  transport_mode?: string
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
    transport_mode?: string
  }[]
}

export type BaselineFulfillment = {
  warehouse_id: string
  demand_point_id: string
  product_class_id: string
  units_per_day: number
}

export type SupplyNetwork = {
  product_classes: ProductClass[]
  demand_points: DemandPoint[]
  warehouses: Warehouse[]
  suppliers: Supplier[]
  inbound_supply: InboundSupply[]
  delivery_routes: DeliveryRoute[]
  transfer_routes: TransferRoute[]
  baseline_fulfillment: BaselineFulfillment[]
  unavailable_warehouse_ids: string[]
  policy: {
    planning_horizon_days: number
    minimum_service_level: number
    maximum_node_inventory_exposure: number
    maximum_node_fulfillment_share: number
    emergency_maximum_node_fulfillment_share: number
    service_objective_mode: 'economic-with-service-floor' | 'lexicographic-service-then-cost'
    reallocation_cost_per_unit: number
    inbound_cancellation_penalty_per_unit: number
    solver_time_limit_seconds: number
    stockout_penalty_multiplier: number
    concentration_penalty_per_unit: number
    concentration_target_share: number
    lead_time_penalty_per_unit_day: number
  }
}

export type OptimizationResult = {
  ending_inventory: { warehouse_id: string; product_class_id: string; units: number }[]
  fulfillment: {
    warehouse_id: string
    demand_point_id: string
    product_class_id: string
    units: number
    lead_time_days: number
    departure_period: number
    cost: number
    transport_mode?: string
  }[]
  inbound_allocation: {
    supply_id: string
    supplier_id: string
    warehouse_id: string
    product_class_id: string
    units: number
    lead_time_days: number
    cost: number
    transport_mode?: string
  }[]
  transfers: {
    from_warehouse_id: string
    to_warehouse_id: string
    product_class_id: string
    units: number
    lead_time_days: number
    departure_period: number
    cost: number
    transport_mode?: string
  }[]
  warehouse_utilization: {
    warehouse_id: string
    used: boolean
    inventory_units: number
    peak_storage_units: number
    capacity_units: number
    capacity_utilization: number
    receiving_units: number
    receiving_capacity_units: number
    peak_receiving_units_per_day: number
    receiving_capacity_units_per_day: number
    dispatch_units: number
    dispatch_capacity_units: number
    peak_dispatch_units_per_day: number
    dispatch_capacity_units_per_day: number
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
    maximum_fulfillment_share: number
    maximum_inventory_share: number
    unserved_demand_units: number
    unserved_demand_value: number
    stockout_cost: number
    logistics_cost: number
    holding_cost: number
    facility_fixed_cost: number
    handling_cost: number
    reallocation_cost: number
    lead_time_penalty: number
    inbound_cancellation_cost: number
    inventory_value_at_risk: number
    objective_value: number
    estimated_business_impact: number
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
  opening_cost: number
  opening_cost_amortization_days: number
  fixed_operating_cost_per_day: number
  handling_cost_per_unit: number
}

export type CandidateResult = {
  candidate_id: string
  label?: string
  latitude: number
  longitude: number
  feasible: boolean
  used: boolean
  pareto_efficient?: boolean
  objective_value?: number
  objective_improvement?: number
  required_capacity_units?: number
  configured_capacity_units?: number
  required_receiving_capacity_units_per_day?: number
  required_dispatch_capacity_units_per_day?: number
  configured_receiving_capacity_units_per_day?: number
  configured_dispatch_capacity_units_per_day?: number
  inventory_allocation?: OptimizationResult['ending_inventory']
  stores_served?: string[]
  logistics_cost?: number
  service_level?: number
  residual_concentration_risk?: number
  causes?: string[]
  resilience?: ResilienceReport
  resilience_delta?: {
    worst_case_service_loss: number | null
    worst_case_unserved_demand_units: number | null
    worst_case_economic_loss: number | null
  }
}

export type WorstCaseMetric = {
  scenario_type: string
  scenario_id: string
  value: number
}

export type ResilienceReport = {
  baseline: OptimizationResult
  scenarios: {
    scenario_type: string
    scenario_id: string
    feasible: boolean
    service_level?: number
    service_loss?: number
    unserved_demand_units?: number
    economic_loss?: number
    causes?: string[]
  }[]
  all_scenarios_feasible: boolean
  infeasible_scenarios: {
    scenario_type: string
    scenario_id: string
    causes: string[]
  }[]
  worst_case_service_loss: WorstCaseMetric | null
  worst_case_unserved_demand_units: WorstCaseMetric | null
  worst_case_economic_loss: WorstCaseMetric | null
}

export type ScenarioComparison = {
  baseline: OptimizationResult
  disrupted: OptimizationResult
  unavailable_warehouse_id: string
  affected_demand_point_ids: string[]
  kpi_change: Record<string, number>
}


export type EconomicStateOutcome = {
  state_id: string
  value: number
  probability: number | null
  evidence_refs: string[]
}

export type EconomicOutcome = {
  policy_id: string
  policy_version: string
  decision_id: string
  nominal_value: number
  expected_value: number | null
  downside_value: number | null
  downside_measure_id: string | null
  worst_case_observed_value: number | null
  worst_case_value: number | null
  realized_value: number | null
  state_outcomes: EconomicStateOutcome[]
  scenario_set_id: string | null
  probability_model_id: string | null
}

export type EconomicComparison = {
  baseline: EconomicOutcome
  candidate: EconomicOutcome
  delta: {
    nominal_delta: number
    expected_delta: number | null
    downside_delta: number | null
    worst_case_observed_delta: number | null
    worst_case_delta: number | null
    realized_delta: number | null
  }
  regret: {
    max_observed_regret: number | null
    mean_observed_regret: number | null
    expected_regret: number | null
    max_regret: number | null
  } | null
  value_stability: {
    nominal_advantage: number
    minimum_observed_advantage: number | null
    maximum_observed_advantage: number | null
    positive_advantage_frequency: number | null
    positive_advantage_probability: number | null
    economically_material_threshold: number | null
    materially_positive_frequency: number | null
  } | null
}
