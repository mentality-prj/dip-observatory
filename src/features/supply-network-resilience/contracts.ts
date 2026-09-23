export type ResilienceScenarioOutcome = {
  scenario_id: string
  service_level: number
  unserved_demand_units: number
  unserved_demand_value: number
  inventory_value_at_risk: number
  recovery_time_days: number | null
  recovery_status: string
  logistics_cost: number
  holding_cost: number
  business_loss: number
}

export type ResilienceAlternative = {
  id: string
  allocation: { node_id: string; product_class_id: string; units: number }[]
  transfers: { from_node_id: string; to_node_id: string; product_class_id: string; units: number; lead_time_days: number; cost: number }[]
  scenario_outcomes: ResilienceScenarioOutcome[]
  worst_case_business_loss: number
  incremental_logistics_cost: number
  maximum_node_inventory_exposure: number
  constraint_violations: string[]
}

export type SupplyResilienceResult = {
  status: 'ok' | 'partial'
  objective: string
  recommended: ResilienceAlternative
  alternatives: ResilienceAlternative[]
  validation_gate: { passes: boolean; dominates_baselines: boolean; constraint_violations: string[] }
  evidence: {
    scenario_count: number
    planning_horizon_days: number
    method: string
    engine_version: string
    global_optimum_guaranteed: boolean
    event_probabilities_used: boolean
  }
}

export type SupplyResilienceResponse = { result: SupplyResilienceResult }
