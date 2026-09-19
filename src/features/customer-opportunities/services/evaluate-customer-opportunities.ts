import type { Customer } from "../model/csv";
import type { CustomerOpportunityEvaluation } from "../model/contracts";

export async function evaluateCustomerOpportunities(
  customers: Customer[],
): Promise<CustomerOpportunityEvaluation> {
  const response = await fetch("/api/customer-opportunities/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customers }),
  });

  const body = (await response.json()) as CustomerOpportunityEvaluation & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "DIP evaluation failed");
  return body;
}
