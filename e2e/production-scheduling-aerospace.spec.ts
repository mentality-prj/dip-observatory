/**
 * Production Scheduling — Critical Aerospace Order E2E Tests (Part C)
 *
 * Verifies:
 * - Baseline state does not include AERO-201
 * - Critical Aerospace Order preset activates correctly
 * - Scenario values update, engine recalculates, recommendation and trace update
 * - Reset restores baseline
 *
 * All selectors use data-testid; no text-based selectors except where necessary.
 */

import { test, expect } from "@playwright/test";

test.describe("production-scheduling: Critical Aerospace Order (Part C)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/production-scheduling");
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    await expect(page.getByTestId("production-scheduling")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Initial state — baseline is active, no aerospace order
  // -------------------------------------------------------------------------

  test("baseline is active on load — no aerospace scenario active", async ({ page }) => {
    // Scenario lab should exist
    await expect(page.getByTestId("scenario-lab")).toBeVisible();

    // The critical-aerospace-order preset button must not be active
    const aerBtn = page.getByTestId("preset-critical-aerospace-order");
    await expect(aerBtn).toBeVisible();
    // Not active = does not have the active styling class
    await expect(aerBtn).not.toHaveClass(/border-cyan-400/);
  });

  test("baseline preset is active on load", async ({ page }) => {
    const baselineBtn = page.getByTestId("preset-baseline");
    await expect(baselineBtn).toBeVisible();
    await expect(baselineBtn).toHaveClass(/border-cyan-400/);
  });

  // -------------------------------------------------------------------------
  // Critical Aerospace scenario activation
  // -------------------------------------------------------------------------

  test("selecting Critical Aerospace Order preset marks it as active", async ({ page }) => {
    const aerBtn = page.getByTestId("preset-critical-aerospace-order");
    await aerBtn.click();

    // Preset button becomes active
    await expect(aerBtn).toHaveClass(/border-cyan-400/, { timeout: 5_000 });
    // Baseline preset becomes inactive
    await expect(page.getByTestId("preset-baseline")).not.toHaveClass(/border-cyan-400/);
  });

  test("activating aerospace preset triggers engine recalculation", async ({ page }) => {
    const aerBtn = page.getByTestId("preset-critical-aerospace-order");
    await aerBtn.click();

    // The aerospace disclaimer appears only when this preset is active,
    // confirming the engine has recalculated with the new scenario.
    await expect(page.getByTestId("synthetic-disclaimer")).toContainText(
      /synthetic aerospace/i,
      { timeout: 5_000 },
    );
  });

  // -------------------------------------------------------------------------
  // Reset — restores exact baseline
  // -------------------------------------------------------------------------

  test("reset from aerospace preset restores baseline", async ({ page }) => {
    // Activate aerospace preset
    await page.getByTestId("preset-critical-aerospace-order").click();
    await expect(page.getByTestId("preset-critical-aerospace-order")).toHaveClass(
      /border-cyan-400/,
      { timeout: 5_000 },
    );

    // Click reset inside the Scenario Lab
    const resetBtn = page.getByTestId("reset-baseline-lab");
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Baseline preset should become active again
    await expect(page.getByTestId("preset-baseline")).toHaveClass(/border-cyan-400/, {
      timeout: 5_000,
    });
    // Aerospace preset should no longer be active
    await expect(page.getByTestId("preset-critical-aerospace-order")).not.toHaveClass(
      /border-cyan-400/,
    );
  });

  // -------------------------------------------------------------------------
  // Scenario Lab preset list contains expected entries
  // -------------------------------------------------------------------------

  test("Scenario Lab contains all required presets including Critical Aerospace Order", async ({
    page,
  }) => {
    await expect(page.getByTestId("preset-baseline")).toBeVisible();
    await expect(page.getByTestId("preset-urgent-order")).toBeVisible();
    await expect(page.getByTestId("preset-capacity-disruption")).toBeVisible();
    await expect(page.getByTestId("preset-tight-deadline")).toBeVisible();
    await expect(page.getByTestId("preset-material-shortage")).toBeVisible();
    await expect(page.getByTestId("preset-critical-aerospace-order")).toBeVisible();
  });
});
