export type Metrics = {
  priority_coverage: number;
  total_coverage: number;
  unmet_need: number;
  capacity_utilization: number;
  travel_cost: number;
  operating_cost?: number;
};

export type DayPlan = {
  day: string;
  status: string;
  recommended: {
    assignments: Record<string, string | null>;
    metrics: Metrics;
    evidence?: string[];
  };
  demand: { opening: number; served: number; closing_unmet: number };
};

export type PeriodPlan = {
  daily: DayPlan[];
  aggregate_metrics: Metrics;
  period_score: number;
  demand_summary: { total_available: number; served: number; closing_unmet: number };
};

export type Result = {
  status: string;
  daily: DayPlan[];
  aggregate_metrics: Metrics;
  demand_summary: PeriodPlan["demand_summary"];
  alternatives: PeriodPlan[];
  solver: string;
  search_space: number;
  evaluated_plans: number;
  engine_version: string;
  evidence: string[];
};

export type SimulationResponse = {
  operation: "simulate";
  scenario: {
    capacity_factor?: number;
    inaccessible_communities?: string[];
  };
  result: Result;
};
