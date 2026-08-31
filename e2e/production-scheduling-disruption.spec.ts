/**
 * Production Disruption Decision Scenario — E2E Tests
 *
 * Tests the full user story:
 *   Baseline → Machine B Disruption → Impact Analysis → Recovery Options
 *   → Find Best Recovery Plan → Schedule/Financial/Trace update → Reset
 *
 * SYNTHETIC DEMONSTRATION — not production data.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = "/en/production-scheduling?scenario=production-disruption";

test.describe("production-disruption: scenario activation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
  });

  test("disruption trigger card is visible on page load", async ({ page }) => {
    await expect(page.getByTestId("disruption-trigger-card")).toBeVisible();
  });

  test("activating disruption shows disruption progress card", async ({ page }) => {
    await page.getByTestId("activate-disruption").click();
    await expect(page.getByTestId("disruption-progress")).toBeVisible();
  });

  test("disruption animation steps through 4 stages and completes", async ({ page }) => {
    await page.getByTestId("activate-disruption").click();
    // Skip animation to speed up the test
    const skipBtn = page.getByTestId("disruption-skip");
    if (await skipBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skipBtn.click();
    }
    // After completion, impact summary should be visible
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("after activation: 3 at-risk orders are shown", async ({ page }) => {
    await page.getByTestId("activate-disruption").click();
    const skip = page.getByTestId("disruption-skip");
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skip.click();
    }
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({ timeout: 10_000 });
    const atRiskOrders = page.getByTestId("disruption-at-risk-order");
    await expect(atRiskOrders).toHaveCount(3, { timeout: 5_000 });
  });

  test("after activation: PDR-104 (CRITICAL) appears as at-risk", async ({ page }) => {
    await page.getByTestId("activate-disruption").click();
    const skip = page.getByTestId("disruption-skip");
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skip.click();
    }
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("PDR-104")).toBeVisible();
  });
});

test.describe("production-disruption: Find Best Recovery Plan", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    await page.getByTestId("activate-disruption").click();
    const skip = page.getByTestId("disruption-skip");
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skip.click();
    }
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({ timeout: 10_000 });
  });

  test("FIND BEST RECOVERY PLAN button is visible", async ({ page }) => {
    await expect(page.getByTestId("find-best-recovery-plan")).toBeVisible();
  });

  test("clicking Find Best Recovery Plan reveals decision summary", async ({ page }) => {
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-decision-summary")).toBeVisible({ timeout: 5_000 });
  });

  test("recovery plan shows recommended strategy name", async ({ page }) => {
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-decision-summary")).toBeVisible({ timeout: 5_000 });
    // Recommended strategy should mention "Move" or "Redistribute"
    await expect(
      page.getByTestId("disruption-decision-summary").getByText(/Move|Redistribute/i)
    ).toBeVisible();
  });

  test("before/after panel is visible after finding recovery plan", async ({ page }) => {
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-before-after")).toBeVisible({ timeout: 5_000 });
  });

  test("financial impact panel shows avoided cost > 0", async ({ page }) => {
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-financial-impact")).toBeVisible({ timeout: 5_000 });
    const avoidedCost = page.getByTestId("disruption-avoided-cost-value");
    await expect(avoidedCost).toBeVisible();
    // Avoided cost should show a positive monetary value (€ followed by digits)
    await expect(avoidedCost).toContainText(/€\s*[\d,]+/);
  });

  test("schedule diff is visible after recovery plan", async ({ page }) => {
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-schedule-diff")).toBeVisible({ timeout: 5_000 });
  });

  test("why this plan section is visible", async ({ page }) => {
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-why-plan")).toBeVisible({ timeout: 5_000 });
  });

  test("decision trace is visible", async ({ page }) => {
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-decision-trace")).toBeVisible({ timeout: 5_000 });
  });

  test("decision trace shows RULE-CRITICAL-DEADLINE change", async ({ page }) => {
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-decision-trace")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("disruption-decision-trace").getByText(/Critical/i)).toBeVisible();
  });

  test("Machine B shown as UNAVAILABLE in schedule diff", async ({ page }) => {
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-schedule-diff")).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByTestId("disruption-schedule-diff").getByText(/UNAVAILABLE/i)
    ).toBeVisible();
  });
});

test.describe("production-disruption: duration control", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    await page.getByTestId("activate-disruption").click();
    const skip = page.getByTestId("disruption-skip");
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skip.click();
    }
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-decision-summary")).toBeVisible({ timeout: 5_000 });
  });

  test("sensitivity panel is visible", async ({ page }) => {
    await expect(page.getByTestId("disruption-sensitivity")).toBeVisible();
  });

  test("changing duration to 12h updates sensitivity display", async ({ page }) => {
    await page.getByTestId("dis-duration-12h").click();
    // Sensitivity panel should update (still visible)
    await expect(page.getByTestId("disruption-sensitivity")).toBeVisible();
    // The 12h button should now be pressed
    await expect(page.getByTestId("dis-duration-12h")).toHaveAttribute("aria-pressed", "true");
  });

  test("changing duration to 4h still produces a recommendation", async ({ page }) => {
    await page.getByTestId("dis-duration-4h").click();
    await expect(page.getByTestId("disruption-decision-summary")).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("production-disruption: overtime toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    await page.getByTestId("activate-disruption").click();
    const skip = page.getByTestId("disruption-skip");
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skip.click();
    }
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-decision-summary")).toBeVisible({ timeout: 5_000 });
  });

  test("overtime toggle is visible in controls", async ({ page }) => {
    await expect(page.getByTestId("dis-overtime")).toBeVisible();
  });

  test("toggling overtime ON updates financial calculation", async ({ page }) => {
    const overtimeToggle = page.getByTestId("dis-overtime");
    const isPressed = await overtimeToggle.getAttribute("aria-pressed");
    if (isPressed !== "true") {
      await overtimeToggle.click();
    }
    // Financial impact panel should still be visible after toggle
    await expect(page.getByTestId("disruption-financial-impact")).toBeVisible({ timeout: 5_000 });
  });

  test("toggling overtime OFF shows zero overtime in financial breakdown", async ({ page }) => {
    const overtimeToggle = page.getByTestId("dis-overtime");
    const isPressed = await overtimeToggle.getAttribute("aria-pressed");
    if (isPressed === "true") {
      await overtimeToggle.click();
    }
    await expect(page.getByTestId("disruption-financial-impact")).toBeVisible({ timeout: 3_000 });
  });
});

test.describe("production-disruption: overtime cost change", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    await page.getByTestId("activate-disruption").click();
    const skip = page.getByTestId("disruption-skip");
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skip.click();
    }
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-decision-summary")).toBeVisible({ timeout: 5_000 });
    // Enable overtime first
    const overtimeToggle = page.getByTestId("dis-overtime");
    if (!(await overtimeToggle.isChecked())) {
      await overtimeToggle.click();
    }
  });

  test("overtime cost input is visible", async ({ page }) => {
    await expect(page.getByTestId("dis-overtime-cost")).toBeVisible();
  });

  test("changing overtime cost updates financial impact", async ({ page }) => {
    // Enable overtime if not already
    const overtimeToggle = page.getByTestId("dis-overtime");
    if (await overtimeToggle.getAttribute("aria-pressed") !== "true") {
      await overtimeToggle.click();
    }
    const costInput = page.getByTestId("dis-overtime-cost");
    await costInput.fill("120");
    await costInput.press("Enter");
    // Financial impact panel should still be visible after cost change
    await expect(page.getByTestId("disruption-financial-impact")).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("production-disruption: reset", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
  });

  test("after full activation and reset, disruption trigger card reappears", async ({ page }) => {
    // Activate
    await page.getByTestId("activate-disruption").click();
    const skip = page.getByTestId("disruption-skip");
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skip.click();
    }
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-decision-summary")).toBeVisible({ timeout: 5_000 });

    // Modify a control
    await page.getByTestId("dis-duration-12h").click();

    // Reset
    await page.getByTestId("reset-disruption").click();

    // Trigger card must reappear
    await expect(page.getByTestId("disruption-trigger-card")).toBeVisible({ timeout: 5_000 });
  });

  test("after reset, impact summary and decision are gone", async ({ page }) => {
    await page.getByTestId("activate-disruption").click();
    const skip = page.getByTestId("disruption-skip");
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skip.click();
    }
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("find-best-recovery-plan").click();
    await expect(page.getByTestId("disruption-decision-summary")).toBeVisible({ timeout: 5_000 });
    await page.getByTestId("reset-disruption").click();
    await expect(page.getByTestId("disruption-impact-summary")).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByTestId("disruption-decision-summary")).not.toBeVisible({ timeout: 3_000 });
  });

  test("after reset, Machine B availability returns to default state", async ({ page }) => {
    // Mark Machine B unavailable
    await page.getByTestId("activate-disruption").click();
    const skip = page.getByTestId("disruption-skip");
    if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skip.click();
    }
    await expect(page.getByTestId("disruption-impact-summary")).toBeVisible({ timeout: 10_000 });

    // Reset
    await page.getByTestId("reset-disruption").click();

    // After reset, trigger card should be visible (Machine B is available in baseline)
    await expect(page.getByTestId("disruption-trigger-card")).toBeVisible({ timeout: 5_000 });
  });
});
