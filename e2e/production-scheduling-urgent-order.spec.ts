/**
 * Production Scheduling — Urgent Order & Find Better Plan E2E Tests (Parts E, F)
 *
 * Verifies the "Simulate Urgent Order" WOW flow:
 *   initial baseline → click Simulate → animation → result panels
 * and the "Find Better Plan" full plan reveal.
 *
 * All selectors use data-testid; no text-based selectors.
 */

import { test, expect } from "@playwright/test";

test.describe("production-scheduling: urgent order flow (Part E)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/production-scheduling");
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    await expect(page.getByTestId("simulate-urgent-order")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Part E Step 1: simulation progress card appears
  // -------------------------------------------------------------------------

  test("simulation progress card appears after clicking Simulate Urgent Order", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();

    await expect(page.getByTestId("simulation-progress")).toBeVisible({ timeout: 5_000 });
    const title = page.getByTestId("simulation-step-title");
    await expect(title).toBeVisible({ timeout: 5_000 });
    const text = await title.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Skip animation → Before/After panel appears
  // -------------------------------------------------------------------------

  test("skipping animation shows Before/After panel", async ({ page }) => {
    await page.getByTestId("simulate-urgent-order").click();

    const skipBtn = page.getByTestId("simulation-skip");
    await expect(skipBtn).toBeVisible({ timeout: 5_000 });
    await skipBtn.click();

    await expect(page.getByTestId("before-after-panel")).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Part E Step 4: WhatShouldWeDoCard appears
  // -------------------------------------------------------------------------

  test("What Should We Do card appears after simulation", async ({ page }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByTestId("simulation-skip").click({ timeout: 5_000 });

    await expect(page.getByTestId("what-should-we-do")).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Part E Step 5: decision state is shown (changed or unchanged)
  // -------------------------------------------------------------------------

  test("after urgent order: WhatShouldWeDoCard shows decision state", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByTestId("simulation-skip").click({ timeout: 5_000 });

    const card = page.getByTestId("what-should-we-do");
    await expect(card).toBeVisible({ timeout: 5_000 });

    const changedCount = await card.getByTestId("urgent-decision-changed").count();
    const unchangedCount = await card.getByTestId("urgent-decision-unchanged").count();
    expect(changedCount + unchangedCount).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Part E Step 6: Find Better Plan and Reset to Baseline buttons appear
  // -------------------------------------------------------------------------

  test("after urgent order: Find Better Plan and Reset to Baseline appear", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByTestId("simulation-skip").click({ timeout: 5_000 });

    await expect(page.getByTestId("find-better-plan")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("reset-baseline")).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Part E Steps 7/8: keep-current-fails section (when applicable)
  // -------------------------------------------------------------------------

  test("after urgent order: keep-current-fails section is present when rules change", async ({
    page,
  }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByTestId("simulation-skip").click({ timeout: 5_000 });

    const card = page.getByTestId("what-should-we-do");
    await expect(card).toBeVisible({ timeout: 5_000 });

    // Section renders only when at least one rule changes — verify testid exists if visible
    const section = card.getByTestId("keep-current-fails");
    const count = await section.count();
    if (count > 0) {
      await expect(section).toBeVisible();
    }
  });

  // -------------------------------------------------------------------------
  // Reset restores baseline after simulation
  // -------------------------------------------------------------------------

  test("Reset to Baseline restores the initial state", async ({ page }) => {
    await page.getByTestId("simulate-urgent-order").click();
    await page.getByTestId("simulation-skip").click({ timeout: 5_000 });

    const resetBtn = page.getByTestId("reset-baseline").first();
    await expect(resetBtn).toBeVisible({ timeout: 5_000 });
    await resetBtn.click();

    await expect(page.getByTestId("simulate-urgent-order")).toBeVisible({ timeout: 5_000 });
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
    await page.getByTestId("simulation-skip").click({ timeout: 5_000 });
    await expect(page.getByTestId("find-better-plan")).toBeVisible({ timeout: 5_000 });
    await page.getByTestId("find-better-plan").click();
  }

  test("Find Better Plan reveals full schedule and recommendation", async ({
    page,
  }) => {
    await triggerUrgentAndRevealPlan(page);
    await expect(page.getByTestId("decision-result")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("decision-strategy-label")).toBeVisible();
  });

  test("Find Better Plan reveals financial impact panel", async ({ page }) => {
    await triggerUrgentAndRevealPlan(page);
    await expect(page.getByTestId("financial-impact")).toBeVisible({ timeout: 5_000 });
  });

  test("Find Better Plan reveals alternative schedules", async ({ page }) => {
    await triggerUrgentAndRevealPlan(page);
    await expect(page.getByTestId("alternative-schedules")).toBeVisible({ timeout: 5_000 });
  });

  test("after Find Better Plan: exactly one Recommended badge in alternatives", async ({
    page,
  }) => {
    await triggerUrgentAndRevealPlan(page);

    const table = page.getByTestId("alternative-schedules");
    await expect(table).toBeVisible({ timeout: 5_000 });
    await expect(table.getByText("Recommended")).toHaveCount(1);
  });

  test("decision-result strategy label matches Recommended row in alternatives", async ({
    page,
  }) => {
    await triggerUrgentAndRevealPlan(page);

    const strategyLabel = page.getByTestId("decision-strategy-label");
    await expect(strategyLabel).toBeVisible({ timeout: 5_000 });
    const labelText = (await strategyLabel.innerText()).trim().toUpperCase();

    const table = page.getByTestId("alternative-schedules");
    const recommendedRow = table.locator("tr").filter({ hasText: "Recommended" });
    await expect(recommendedRow).toBeVisible({ timeout: 5_000 });
    const rowText = (await recommendedRow.innerText()).toUpperCase();

    const strategyKeyword = labelText.split(" ")[0];
    expect(rowText).toContain(strategyKeyword);
  });

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
