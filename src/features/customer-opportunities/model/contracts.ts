export type CustomerOpportunityResult = {
  customer_id: string;
  company_name: string;
  decision: string;
  opportunity_score: number;
  uncertainty: number;
  expected_effect_eur: number | null;
  explanation: string[];
  missing_information: string[];
  signals: Record<string, number>;
};

export type CustomerOpportunityEvaluation = {
  results: CustomerOpportunityResult[];
  counts: Record<string, number>;
};
