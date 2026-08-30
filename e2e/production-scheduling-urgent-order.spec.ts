/**
 * Production Scheduling — Urgent Order & Find Better Plan E2E Tests (Parts E, F)
 *
 * Verifies the "Simulate Urgent Order" WOW flow:
 *   initial baseline → click Simulate → animation → result panels
 * and the "Find Better Plan" full plan reveal.
 */

import { test, expect } from "@playwright/test";

test.describe("production-scheduling: urgent order flow (Part E)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/production-scheduling");
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    // Verify we start from baseline
    await expect(page.getByTestId("simulate-urgent-order")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Part E Step 1: "NEW URGENT CUSTOMER ORDER" event appears
  // -------------------------------------------------------------------------

  test("simulation step 'New Urgent Customer Order' is shown during animation", async ({
    page,
  }) => {
    const simulateBtn = page.getByTestId("simulate-urgent-order");
    await simulateBtn.click();

    // The simulation progress card shows the "event" step first
    await expect(
      page.getByText(/New Urgent Customer Order/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Complete the simulation flow by skipping the animation
  // -------------------------------------------------------------------------

  test("simulation produces Before/After panel after skipping animation", async ({
    page,
  }) => {
    const simulateBtn = page.getByTestId("simulate-urgent-order");
    await simulateBtn.click();

    // Skip animation so we reach the result immediately
    const skipBtn = page.getByText(/Skip animation/i);
    await expect(skipBtn).toBeVisible({ timeout: 5_000 });
    await skipBtn.click();

    // BeforeAfterPanel must appear (shows URGENT-201 in scenario)
    await expect(page.getByText(/URGENT-201/i).first()).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Part E Step 4: new decision result appears
  // -------------------------------------------------------------------------

  test("new decision result appears after urgent order simulation", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();
    const skipBtn = page.getByText(/Skip animation/i);
    await skipBtn.click({ timeout: 5_000 });

    // WhatShouldWeDoCard must show the recommended strategy
    await expect(
      page.getByText(/Recommended strategy/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Part E Step 5: production schedule changes or engine reports unchanged
  // -------------------------------------------------------------------------

  test("after urgent order: decision outcome and financial impact are visible", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByText(/Skip animation/i).click({ timeout: 5_000 });

    // Financial impact stats are shown in BeforeAfterPanel
    await expect(page.getByText(/Total impact/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/Orders on time/i).first()).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Part E Step 6: financial impact panel updates
  // -------------------------------------------------------------------------

  test("after urgent order: Find Better Plan and Reset to Baseline buttons appear", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByText(/Skip animation/i).click({ timeout: 5_000 });

    await expect(page.getByTestId("find-better-plan")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("reset-baseline")).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Part E Step 7 & 8: explanation and trace diff update
  // -------------------------------------------------------------------------

  test("after urgent order: explanation reasons are visible", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByText(/Skip animation/i).click({ timeout: 5_000 });

    // WhatShouldWeDoCard shows "Why?" section
    await expect(page.getByText(/Why\?/i)).toBeVisible({ timeout: 5_000 });
  });

  test("after urgent order: keep-current trace diff is visible", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByText(/Skip animation/i).click({ timeout: 5_000 });

    // The BeforeAfterPanel shows "Why Keep Current fails"
    await expect(
      page.getByText(/Why Keep Current fails/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Part E: URGENT-201 is part of the scenario after simulation
  // -------------------------------------------------------------------------

  test("URGENT-201 is part of the scenario after triggering simulation", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByText(/Skip animation/i).click({ timeout: 5_000 });

    // The WhatShouldWeDoCard / BeforeAfterPanel mentions URGENT-201
    const pageText = await page.innerText("body");
    expect(pageText).toContain("URGENT-201");
  });

  // -------------------------------------------------------------------------
  // Reset restores baseline after simulation
  // -------------------------------------------------------------------------

  test("Reset to Baseline restores the initial state", async ({ page }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByText(/Skip animation/i).click({ timeout: 5_000 });

    const resetBtn = page.getByTestId("reset-baseline").first();
    await expect(resetBtn).toBeVisible({ timeout: 5_000 });
    await resetBtn.click();

    // Back to baseline: Simulate button re-appears
    await expect(page.getByTestId("simulate-urgent-order")).toBeVisible({ timeout: 5_000 });
    // Find Better Plan must be gone
    await expect(page.getByTestId("find-better-plan")).not.toBeVisible();
  });
});

test.describe("production-scheduling: Find Better Plan (Part F)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/production-scheduling");
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    await expect(page.getByTestId("simulate-urgent-order")).toBeVisible();
  });

  async function triggerUrgentAndRevealPlan(page: import("@playwright/test").Page) {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByText(/Skip animation/i).click({ timeout: 5_000 });
    await expect(page.getByTestId("find-better-plan")).toBeVisible({ timeout: 5_000 });
    await page.getByTestId("find-better-plan").click();
  }

  // -------------------------------------------------------------------------
  // Part F Step 5: recommendation is displayed after Find Better Plan
  // -------------------------------------------------------------------------

  test("Find Better Plan reveals full schedule and recommendation", async ({
    page,
  }) => {
    await triggerUrgentAndRevealPlan(page);

    // The full plan includes RecommendedStrategyCard
    await expect(page.getByTestId("decision-result")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("decision-strategy-label")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Part F Step 7: financial impact visible
  // -------------------------------------------------------------------------

  test("Find Better Plan reveals financial impact panel", async ({ page }) => {
    await triggerUrgentAndRevealPlan(page);

    await expect(page.getByTestId("financial-impact")).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Part F Step 8: explanation visible
  // -------------------------------------------------------------------------

  test("Find Better Plan reveals alternative schedules", async ({ page }) => {
    await triggerUrgentAndRevealPlan(page);

    await expect(page.getByTestId("alternative-schedules")).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Part F: only one Recommended badge in alternative schedules
  // -------------------------------------------------------------------------

  test("after Find Better Plan: exactly one Recommended badge in alternatives", async ({
    page,
  }) => {
    await triggerUrgentAndRevealPlan(page);

    const table = page.getByTestId("alternative-schedules");
    await expect(table).toBeVisible({ timeout: 5_000 });
    const badges = table.getByText("Recommended");
    await expect(badges).toHaveCount(1);
  });

  // -------------------------------------------------------------------------
  // Part F: decision-result strategy matches alternative-schedules Recommended
  // -------------------------------------------------------------------------

  test("decision-result strategy label matches Recommended row in alternatives", async ({
    page,
  }) => {
    await triggerUrgentAndRevealPlan(page);

    const strategyLabel = page.getByTestId("decision-strategy-label");
    await expect(strategyLabel).toBeVisible({ timeout: 5_000 });
    const labelText = (await strategyLabel.innerText()).trim().toUpperCase();

    // Find the recommended row in the alternatives table
    const table = page.getByTestId("alternative-schedules");
    const recommendedRow = table.locator("tr").filter({ hasText: "Recommended" });
    await expect(recommendedRow).toBeVisible({ timeout: 5_000 });
    const rowText = (await recommendedRow.innerText()).toUpperCase();

    // The strategy label must appear in the recommended row
    // (labels are like "REDISTRIBUTE TO OTHER LINES")
    const strategyKeyword = labelText.split(" ")[0];
    expect(rowText).toContain(strategyKeyword);
  });

  // -------------------------------------------------------------------------
  // Part F: Reset to Baseline after full plan
  // -------------------------------------------------------------------------

  test("Reset to Baseline after full plan view restores initial state", async ({
    page,
  }) => {
    await triggerUrgentAndRevealPlan(page);

    const resetBtn = page.getByTestId("reset-baseline").first();
    await expect(resetBtn).toBeVisible({ timeout: 5_000 });
    await resetBtn.click();

    await expect(page.getByTestId("simulate-urgent-order")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("find-better-plan")).not.toBeVisible();
  });
});
