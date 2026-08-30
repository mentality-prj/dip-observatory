/**
 * Production Scheduling — Baseline State E2E Tests (Part D)
 *
 * Verifies that the initial page renders a genuine baseline production
 * scenario: no urgent order active, baseline recommendation visible,
 * financial impact rendered correctly, and Scenario Lab in clean state.
 */

import { test, expect } from "@playwright/test";

test.describe("production-scheduling: baseline state", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/production-scheduling");
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // Part D Step 3: page title
  // -------------------------------------------------------------------------

  test("page title is Production Scheduling", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Production Scheduling/i }),
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Part D Step 4: synthetic-data disclaimer
  // -------------------------------------------------------------------------

  test("synthetic-data disclaimer is visible", async ({ page }) => {
    await expect(
      page.getByText(/synthetic/i).first(),
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Part D Step 5: production disruption visible
  // -------------------------------------------------------------------------

  test("production disruption panel is visible", async ({ page }) => {
    // Disruption always shown — Line B maintenance
    await expect(
      page.getByText(/Line B/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/disruption|maintenance|capacity/i).first(),
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Part D Step 6: urgent order is shown as a proposed scenario (not active)
  // -------------------------------------------------------------------------

  test("urgent order trigger card is visible as a proposed scenario", async ({
    page,
  }) => {
    const btn = page.getByTestId("simulate-urgent-order");
    await expect(btn).toBeVisible();
    // The card presents URGENT-201 as a proposed/what-if event
    await expect(page.getByText("URGENT-201")).toBeVisible();
    await expect(page.getByText(/Simulate Urgent Order/i)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Part D Step 7: baseline schedule does NOT include URGENT-201
  // -------------------------------------------------------------------------

  test("baseline recommendation card does not list URGENT-201 in the schedule", async ({
    page,
  }) => {
    const decisionCard = page.getByTestId("decision-result");
    await expect(decisionCard).toBeVisible();
    // URGENT-201 only appears in the trigger card info grid, not in the schedule
    // The schedule timeline is inside decision-result; that section should not
    // contain a task row labelled URGENT-201
    const scheduleText = await decisionCard.innerText();
    // URGENT-201 must not appear as a scheduled task inside the recommendation card
    expect(scheduleText).not.toContain("URGENT-201");
  });

  // -------------------------------------------------------------------------
  // Part D Step 8: baseline recommendation is visible
  // -------------------------------------------------------------------------

  test("baseline recommendation strategy is displayed", async ({ page }) => {
    const decisionCard = page.getByTestId("decision-result");
    await expect(decisionCard).toBeVisible();
    // Must show the strategy label
    const strategyLabel = page.getByTestId("decision-strategy-label");
    await expect(strategyLabel).toBeVisible();
    const text = await strategyLabel.innerText();
    // One of the known strategy labels must be shown
    expect(text.trim()).toMatch(
      /REDISTRIBUTE|PRIORITIS|KEEP CURRENT|DELAY|OVERTIME/i,
    );
  });

  // -------------------------------------------------------------------------
  // Part D Step 9: baseline financial impact is displayed
  // -------------------------------------------------------------------------

  test("baseline financial impact panel is visible", async ({ page }) => {
    const panel = page.getByTestId("financial-impact");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/Financial Impact/i);
  });

  test("financial values render as separate elements (Part B)", async ({
    page,
  }) => {
    const panel = page.getByTestId("financial-impact");
    await expect(panel).toBeVisible();

    // The delay-cost row recommended value must exist as its own element
    const delayRec = panel.getByTestId("financial-rec-delay-cost");
    await expect(delayRec).toBeVisible();
    const delayRecText = await delayRec.innerText();
    // Must match a euro amount: €X.XXX or €0
    expect(delayRecText.trim()).toMatch(/^€/);

    // The delay-cost keep value must exist as its own element
    const delayKeep = panel.getByTestId("financial-keep-delay-cost");
    await expect(delayKeep).toBeVisible();
    const delayKeepText = await delayKeep.innerText();
    expect(delayKeepText.trim()).toMatch(/^€/);

    // The two values must be distinct HTML elements — the delta (if present)
    // must be a sibling BLOCK element, not concatenated into delayRec's text
    // i.e. delayRec.innerText should contain only the value itself, no "−" suffix
    expect(delayRecText.trim()).not.toContain("−");
  });

  // -------------------------------------------------------------------------
  // Part D Step 10: Scenario Lab exists
  // -------------------------------------------------------------------------

  test("Scenario Lab is visible", async ({ page }) => {
    const lab = page.getByTestId("scenario-lab");
    await expect(lab).toBeVisible();
    await expect(lab).toContainText(/Scenario Lab/i);
  });

  // -------------------------------------------------------------------------
  // Part D Step 11: no active scenario delta in baseline
  // -------------------------------------------------------------------------

  test("Scenario Lab shows Decision unchanged in baseline", async ({ page }) => {
    const lab = page.getByTestId("scenario-lab");
    await expect(lab).toBeVisible();

    // In baseline state, the delta banner must say "Decision unchanged"
    const delta = lab.getByTestId("decision-delta");
    await expect(delta).toBeVisible();
    await expect(delta).toHaveAttribute("data-decision-changed", "false");
    await expect(delta).toContainText(/Decision unchanged/i);
  });

  // -------------------------------------------------------------------------
  // Part A: urgent order is NOT active before user clicks Simulate
  // -------------------------------------------------------------------------

  test("urgent order is NOT active in initial baseline state", async ({
    page,
  }) => {
    // showUrgentResult = false initially, so BeforeAfterPanel must not be visible
    // The "Find Better Plan" button only appears after simulation
    await expect(page.getByTestId("find-better-plan")).not.toBeVisible();

    // The main schedule panels ARE visible (not hidden behind simulation)
    await expect(page.getByTestId("decision-result")).toBeVisible();
    await expect(page.getByTestId("financial-impact")).toBeVisible();
    await expect(page.getByTestId("alternative-schedules")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Part P: no hardcoded UI — disruption value reflects the actual scenario
  // -------------------------------------------------------------------------

  test("baseline disruption shows 25% capacity reduction", async ({ page }) => {
    // BASELINE_WHAT_IF has lineBCapacityReductionPct = 25
    await expect(page.getByText(/25%/)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Alternative schedules table shows exactly one Recommended badge (Part C)
  // -------------------------------------------------------------------------

  test("alternative schedules table shows exactly one Recommended badge", async ({
    page,
  }) => {
    const table = page.getByTestId("alternative-schedules");
    await expect(table).toBeVisible();
    const recommendedBadges = table.getByText("Recommended");
    await expect(recommendedBadges).toHaveCount(1);
  });

  // -------------------------------------------------------------------------
  // Part N: page refresh returns to baseline
  // -------------------------------------------------------------------------

  test("page returns to baseline after reload", async ({ page }) => {
    // Verify baseline
    await expect(page.getByTestId("simulate-urgent-order")).toBeVisible();
    // Reload
    await page.reload();
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    // Should still be baseline
    await expect(page.getByTestId("simulate-urgent-order")).toBeVisible();
    await expect(page.getByTestId("find-better-plan")).not.toBeVisible();
  });
});
