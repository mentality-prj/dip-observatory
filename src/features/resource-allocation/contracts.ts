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

export type ResourceAllocationDayPlan = {
  day: string
  status: string
  recommended: {
    assignments: Record<string, string | null>
    metrics: ResourceAllocationMetrics
    evidence?: string[]
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
