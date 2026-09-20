import { expect, test } from "@playwright/test";

const validation = {
  valid: true,
  total_rows: 2,
  valid_rows: 2,
  invalid_rows: 0,
  rows: [
    { name: "Acme", domain: "acme.example", industry: "Logistics", metadata: {} },
    { name: "Beta", domain: "beta.example", industry: "Energy", metadata: {} },
  ],
  issues: [],
};

const opportunity = (id: string, probability: number) => ({
  id,
  company_id: "company-acme",
  problem_id: `problem-${id}`,
  contact_ids: [],
  problem_probability: probability,
  qdip_fit: probability,
  capability_fit: null,
  strategic_value: 0.5,
  uncertainty: 0.3,
  evidence_ids: [],
  state: "EVALUATED",
});

const decision = (opportunityId: string, state: "PURSUE" | "WATCH") => ({
  opportunity_id: opportunityId,
  decision: state,
  expected_opportunity_value_eur: null,
  uncertainty: state === "WATCH" ? 0.6 : 0.2,
  evidence_quality: 0.8,
  confidence: 0.7,
  missing_information: [],
  research_objectives: [],
  explanation: [`${state} explanation`],
  explanation_details: {
    reasons: [`${state} grounded reason`],
    risks: [],
    missing_information: [],
    research_objectives: [],
  },
  qdip_capability_fit: null,
  next_action: {
    type: state === "WATCH" ? "WATCH" : "CONTACT",
    title: state === "WATCH" ? "Re-evaluate after expansion" : "Contact Operations Director",
  },
  provenance: {
    decision_id: `decision-${opportunityId}`,
    executed_at: "2026-09-21T00:00:00Z",
    plugin_id: "gtm-lab",
    plugin_version: "1.0",
    evidence_ids: [],
  },
  rejected_alternatives: [],
  model_version: "gtm-v1",
});

const pipeline = {
  run_id: "run-partial",
  status: "PARTIAL",
  imported_rows: 2,
  deduplicated_rows: 0,
  summary: {
    total_prospects: 2,
    evaluated_prospects: 1,
    failed_prospects: 1,
    total_opportunities: 2,
    total_evidence: 0,
    decisions: { PURSUE: 1, RESEARCH: 0, WATCH: 1, SKIP: 0 },
  },
  prospects: [
    {
      company: {
        id: "company-acme",
        name: "Acme",
        domain: "acme.example",
        industry: "Logistics",
      },
      lifecycle: null,
      problems: [],
      opportunities: [opportunity("opportunity-a", 0.9), opportunity("opportunity-b", 0.55)],
      decisions: [decision("opportunity-a", "PURSUE"), decision("opportunity-b", "WATCH")],
      evidence_count: 0,
      error: null,
    },
    {
      company: { id: "company-beta", name: "Beta", domain: "beta.example", industry: "Energy" },
      lifecycle: null,
      problems: [],
      opportunities: [],
      decisions: [],
      evidence_count: 0,
      error: "Provider unavailable",
    },
  ],
};

test("production import preserves multiple decisions, WATCH and partial success", async ({ page }) => {
  await page.route("**/api/gtm-lab/import/validate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(validation),
    });
  });
  await page.route("**/api/gtm-lab/pipeline", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(pipeline),
    });
  });

  await page.goto("/en/gtm-lab");
  await page.locator('input[type="file"]').setInputFiles({
    name: "prospects.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name,domain,industry\nAcme,acme.example,Logistics\nBeta,beta.example,Energy"),
  });

  await expect(page.getByText("2 prospects validated. Ready to run QDIP.")).toBeVisible();
  await page.getByRole("button", { name: "Run evaluation for 2 companies" }).click();

  await expect(page.getByText("1 records require correction; successful evaluations are preserved.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Acme/ })).toHaveCount(2);
  await expect(page.getByRole("button", { name: /WATCH/ }).first()).toContainText("1");

  await page.getByRole("button", { name: /WATCH/ }).first().click();
  await expect(page.getByText("WATCH grounded reason")).toBeVisible();
  await expect(page.getByText("Re-evaluate after expansion")).toBeVisible();
});
