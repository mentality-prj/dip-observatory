"use client";

import { CustomerOpportunitiesView } from "../components/customer-opportunities-view";
import { useCustomerOpportunitiesViewModel } from "../hooks/use-customer-opportunities-view-model";

export function CustomerOpportunitiesContainer() {
  const viewModel = useCustomerOpportunitiesViewModel();
  return <CustomerOpportunitiesView vm={viewModel} />;
}
