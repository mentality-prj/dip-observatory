import { expect, test } from "@playwright/test";

const demo = {
  dataset_id: "gtm-lab-demo-v1",
  network_access: false,
  persistence: false,
  external_actions: false,
  summary: { PURSUE: 1, RESEARCH: 1, SKIP: 1 },
  prospects: [
    {
      company: { id: "acme", name: "ACME Logistics", domain: "acme.example", country: "PL", industry: "Logistics" },
      evidence: [{ id: "e1", company_id: "acme", source: "Company website", source_type: "website", content: "Operates a distributed logistics network.", url: null, collected_at: "2026-09-20T00:00:00Z", credibility: 0.9, freshness: 0.9, relevance: 0.9, confidence: 0.9, structured_data: {} }],
      opportunity: { id: "o1", company_id: "acme", problem_id: "resource-allocation", problem_probability: 0.9, qdip_fit: 0.85, strategic_value: 0.8, uncertainty: 0.25, evidence_ids: ["e1"] },
      decision: { opportunity_id: "o1", decision: "PURSUE", expected_opportunity_value_eur: 50000, uncertainty: 0.25, evidence_quality: 0.9, missing_information: ["Existing planning tooling"], research_objectives: [], explanation: ["Operational allocation problem is supported by sourced evidence."], rejected_alternatives: ["RESEARCH", "SKIP"], model_version: "gtm-v1" },
      outreach_draft: { subject: "Validate resource allocation process", body: "Draft" },
    },
    {
      company: { id: "beta", name: "Beta Manufacturing", domain: "beta.example", country: "DE", industry: "Manufacturing" },
      evidence: [{ id: "e2", company_id: "beta", source: "Jobs page", source_type: "website", content: "Hiring planning coordinators.", url: null, collected_at: "2026-09-20T00:00:00Z", credibility: 0.8, freshness: 0.8, relevance: 0.8, confidence: 0.75, structured_data: {} }],
      opportunity: { id: "o2", company_id: "beta", problem_id: "planning", problem_probability: 0.75, qdip_fit: 0.7, strategic_value: 0.7, uncertainty: 0.8, evidence_ids: ["e2"] },
      decision: { opportunity_id: "o2", decision: "RESEARCH", expected_opportunity_value_eur: null, uncertainty: 0.8, evidence_quality: 0.6, missing_information: ["Current planning process"], research_objectives: ["Verify existing planning tooling"], explanation: ["Potential opportunity is material but uncertainty remains high."], rejected_alternatives: ["PURSUE", "SKIP"], model_version: "gtm-v1" },
      outreach_draft: null,
    },
    {
      company: { id: "gamma", name: "Gamma Studio", domain: "gamma.example", country: "PL", industry: "Creative" },
      evidence: [{ id: "e3", company_id: "gamma", source: "Company website", source_type: "website", content: "Small specialist studio.", url: null, collected_at: "2026-09-20T00:00:00Z", credibility: 0.9, freshness: 0.9, relevance: 0.7, confidence: 0.9, structured_data: {} }],
      opportunity: { id: "o3", company_id: "gamma", problem_id: "none", problem_probability: 0.15, qdip_fit: 0.1, strategic_value: 0.1, uncertainty: 0.2, evidence_ids: ["e3"] },
      decision: { opportunity_id: "o3", decision: "SKIP", expected_opportunity_value_eur: null, uncertainty: 0.2, evidence_quality: 0.8, missing_information: [], research_objectives: [], explanation: ["No relevant decision problem is supported by current evidence."], rejected_alternatives: ["PURSUE", "RESEARCH"], model_version: "gtm-v1" },
      outreach_draft: null,
    },
  ],
};

test("GTM Lab runs the demo and exposes decision evidence and next action", async ({ page }) => {
  await page.route("**/api/gtm-lab/demo", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(demo) }));
  await page.goto("/en/gtm-lab");
  await expect(page.getByRole("heading", { name: "GTM Lab" })).toBeVisible();
  await page.getByRole("button", { name: "Run evaluation" }).click();
  await expect(page.getByText("ACME Logistics").first()).toBeVisible();
  await expect(page.getByText("Operational allocation problem is supported by sourced evidence.")).toBeVisible();
  await expect(page.getByText("Operates a distributed logistics network.")).toBeVisible();
  await expect(page.getByText("Validate resource allocation process")).toBeVisible();
});

test("GTM Lab treats RESEARCH as a valid decision and supports search/filter", async ({ page }) => {
  await page.route("**/api/gtm-lab/demo", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(demo) }));
  await page.goto("/en/gtm-lab");
  await page.getByRole("button", { name: "Run evaluation" }).click();
  await page.getByRole("button", { name: /RESEARCH/ }).first().click();
  await page.getByRole("button", { name: /Beta Manufacturing/ }).click();
  await expect(page.getByText("Verify existing planning tooling").first()).toBeVisible();
  await expect(page.getByText("Current planning process")).toBeVisible();
  await page.getByPlaceholder("Search companies").fill("Beta");
  await expect(page.getByRole("button", { name: /Beta Manufacturing/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /ACME Logistics/ })).toHaveCount(0);
});
