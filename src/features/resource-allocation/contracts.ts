export type ResourceAllocationMetrics = {
  priority_coverage: number
  total_coverage: number
  unmet_need: number
  capacity_utilization: number
  travel_cost: number
  operating_cost?: number
}

export type ResourceAllocationDemandSummary = { total_available: number; served: number; closing_unmet: number }
export type ResourceAllocationBaseline = {
  metrics: ResourceAllocationMetrics
  summary: ResourceAllocationDemandSummary
}

export type ResourceAllocationAssignmentExplanation = {
  day?: string
  team_id: string
  from: string | null
  to: string | null
  matched_services: string[]
  priority_demand_units: number
  served_units: number
  priority_served_units: number
  travel_cost: number
  travel_time_minutes: number
  constraint_checks: Array<{
    code: string
    passed: boolean
    value?: number | string
  }>
  rationale_codes: string[]
}

export type ResourceAllocationDayPlan = {
  day: string
  status: string
  recommended: {
    assignments: Record<string, string | null>
    metrics: ResourceAllocationMetrics
    evidence?: Array<string | Record<string, unknown>>
    assignment_explanations?: ResourceAllocationAssignmentExplanation[]
  }
  demand: { opening: number; served: number; closing_unmet: number }
}

export type ResourceAllocationPeriodPlan = {
  daily: ResourceAllocationDayPlan[]
  aggregate_metrics: ResourceAllocationMetrics
  period_score: number
  demand_summary: ResourceAllocationDemandSummary
}

export type ResourceAllocationResult = {
  status: string
  daily: ResourceAllocationDayPlan[]
  aggregate_metrics: ResourceAllocationMetrics
  demand_summary: ResourceAllocationDemandSummary
  baseline?: ResourceAllocationBaseline | null
  alternatives: ResourceAllocationPeriodPlan[]
  solver: string
  search_space: number
  evaluated_plans: number
  engine_version: string
  evidence: string[]
}

export type ResourceAllocationScenario = {
  capacity_factor?: number
  inaccessible_communities?: string[]
}

export type ResourceAllocationSimulationResponse = {
  operation: 'simulate'
  scenario: ResourceAllocationScenario
  result: ResourceAllocationResult
}


export type ResourceAllocationPriority = 'critical' | 'high' | 'normal'

export type ResourceAllocationDemandInput = {
  service: string
  units: number
  priority: ResourceAllocationPriority
  program?: string | null
}

export type ResourceAllocationCommunityInput = {
  id: string
  accessible?: boolean
  max_teams?: number
  demand: ResourceAllocationDemandInput[]
  accessibility?: Record<string, boolean>
  daily_demand?: Record<string, ResourceAllocationDemandInput[]>
  allowed_programs?: string[] | null
}

export type ResourceAllocationTeamInput = {
  id: string
  current_community?: string | null
  skills: string[]
  capacity: number
  allowed_communities?: string[] | null
  availability?: Record<string, boolean>
  daily_capacity?: Record<string, number>
  max_daily_capacity?: number | null
  max_travel_cost?: number | null
  max_travel_minutes?: number | null
  cost_per_capacity?: number
  programs?: string[]
}

export type ResourceAllocationTravelEdgeInput = {
  from: string
  to: string
  minutes?: number | null
  cost?: number
}

export type ResourceAllocationInput = {
  operation?: 'optimize' | 'evaluate_manual' | 'simulate' | 'counterfactual' | 'capacity_gap'
  communities: ResourceAllocationCommunityInput[]
  teams: ResourceAllocationTeamInput[]
  travel_edges?: ResourceAllocationTravelEdgeInput[]
  current_allocation?: Record<string, string | null>
  manual_allocation?: Record<string, unknown> | null
  baseline_allocation?: Record<string, string | null> | null
  planning_period?: { days: string[] } | null
  scenario?: ResourceAllocationScenario | null
  budget?: number | null
  max_working_capacity_per_team?: number | null
  provenance?: {
    source: string
    imported_at?: string | null
    mapping_version?: string | null
  } | null
  marginal_team_capacity?: number
  target_priority_coverage?: number
}
