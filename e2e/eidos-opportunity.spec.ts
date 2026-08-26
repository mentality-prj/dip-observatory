import { test, expect } from "@playwright/test";

test.describe("EIDOS Futures Opportunity prototype", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/eidos/opportunity");
    await page.waitForURL(/\/en\/eidos\/opportunity/, { timeout: 10_000 });
  });

  test("page renders the opportunity title and subtitle", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /EIDOS — Futures Opportunity/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Robust hedge timing under market uncertainty/i),
    ).toBeVisible();
  });

  test("page shows the decision date 2026-05-26", async ({ page }) => {
    await expect(page.getByText("2026-05-26")).toBeVisible();
  });

  test("page shows the Q1-2027 contract", async ({ page }) => {
    await expect(page.getByTestId("opportunity-card")).toContainText("Q1-2027");
  });

  test("entry price is 479 PLN (decision-time price, not outcome)", async ({
    page,
  }) => {
    const card = page.getByTestId("opportunity-card");
    await expect(card).toContainText("479");
    // Verify the card header does NOT show 558 as the market price
    const cardText = await card.innerText();
    // 479 must appear as market/entry price
    expect(cardText).toContain("479");
  });

  test("recommendation signal is visible and is a valid value", async ({
    page,
  }) => {
    const signal = page.getByTestId("recommendation-signal");
    await expect(signal).toBeVisible();
    const text = await signal.innerText();
    expect(["BUY", "WATCH", "NO ACTION"]).toContain(text.trim());
  });

  test("forward curve chart renders", async ({ page }) => {
    await expect(page.getByTestId("forward-curve-chart")).toBeVisible();
    const svg = page.locator("[data-testid='forward-curve-chart'] svg");
    await expect(svg).toBeVisible();
  });

  test("valuation range bar renders", async ({ page }) => {
    await expect(page.getByTestId("valuation-range-bar")).toBeVisible();
  });

  test("decision explanation section renders", async ({ page }) => {
    await expect(page.getByTestId("decision-explanation")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Why this opportunity\?/i }),
    ).toBeVisible();
  });

  test("outcome section is visually separated and labelled correctly", async ({
    page,
  }) => {
    const separator = page.getByTestId("outcome-separator");
    await expect(separator).toBeVisible();
    await expect(separator).toContainText(/post-decision information/i);

    const outcome = page.getByTestId("outcome-section");
    await expect(outcome).toBeVisible();
    await expect(outcome).toContainText(/subsequent outcome — not used by decision model/i);
  });

  test("look-ahead: outcome 558 PLN appears ONLY in the outcome section, not in the decision card", async ({
    page,
  }) => {
    // The opportunity card (decision-time information) must not show 558 as a price
    const card = page.getByTestId("opportunity-card");
    const cardText = await card.innerText();
    // 558 should not appear in the decision card
    // (it may appear in the outcome section below)
    expect(cardText).not.toContain("558");

    // But 558 should appear somewhere on the page (in the outcome section)
    const fullText = await page.innerText("body");
    expect(fullText).toContain("558");
  });

  test("outcome section shows the historical EIDOS result", async ({ page }) => {
    const outcome = page.getByTestId("outcome-section");
    await expect(outcome).toContainText("479");
    await expect(outcome).toContainText("558");
    // Percentage change ~16.49%
    await expect(outcome).toContainText("16.");
  });
});
