"use client";

import { CustomerOpportunitiesView } from "@/features/customer-opportunities/components/customer-opportunities-view";
import { useCustomerOpportunitiesViewModel } from "@/features/customer-opportunities/hooks/use-customer-opportunities-view-model";

export function CustomerOpportunityLab() {
  const viewModel = useCustomerOpportunitiesViewModel();
  return <CustomerOpportunitiesView vm={viewModel} />;
}
