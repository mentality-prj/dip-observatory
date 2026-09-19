import type {
  ProductionDecisionResult,
  ProductionInputs,
} from "../model/contracts";

export async function runProductionDecision(
  inputs: ProductionInputs,
): Promise<ProductionDecisionResult> {
  const response = await fetch("/api/production-decision/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inputs),
  });
  const payload = (await response.json()) as ProductionDecisionResult & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error ?? "DIP execution failed.");
  }
  return payload;
}
