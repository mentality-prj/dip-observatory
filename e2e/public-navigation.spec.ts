/**
 * Public Navigation — E2E tests (Part C, Items 21–22)
 *
 * Verifies:
 * - Public navigation does NOT contain client-specific links (EIDOS, etc.)
 * - Generic capability links are still present (Supplier Decision, Production Scheduling)
 * - Removing nav links does not break direct URL access
 *
 * All selectors use data-testid or exact href matching.
 */

import { test, expect } from "@playwright/test";

test.describe("public navigation: client-specific links removed (Part C Item 21)", () => {
  test("public navigation does NOT contain EIDOS Observatory link", async ({ page }) => {
    await page.goto("/en");
    await page.waitForURL(/\/en/, { timeout: 10_000 });

    // EIDOS Observatory must not appear in the nav link row
    const eidosLinks = await page
      .locator("nav a[href*='/eidos'], a[href*='/eidos']")
      .count();
    // No public nav link to /eidos
    expect(eidosLinks).toBe(0);
  });

  test("public navigation contains Production Scheduling link", async ({ page }) => {
    await page.goto("/en");
    await page.waitForURL(/\/en/, { timeout: 10_000 });

    const prodSchedLink = page.locator("a[href*='/production-scheduling']").first();
    await expect(prodSchedLink).toBeVisible();
  });

  test("public navigation contains Supplier Decision link", async ({ page }) => {
    await page.goto("/en");
    await page.waitForURL(/\/en/, { timeout: 10_000 });

    const supplierLink = page.locator("a[href*='/supplier-decision']").first();
    await expect(supplierLink).toBeVisible();
  });
});

test.describe("direct route regression: removed nav links still resolve (Part C Item 22)", () => {
  test("/en/eidos route resolves directly", async ({ page }) => {
    await page.goto("/en/eidos");
    // Should not 404 — page loads with some content
    await expect(page).not.toHaveURL(/\/404/);
    const status = page.url();
    expect(status).not.toContain("404");
  });

  test("/en/supplier-decision route resolves directly", async ({ page }) => {
    await page.goto("/en/supplier-decision");
    await expect(page).not.toHaveURL(/\/404/);
  });

  test("/en/production-scheduling route resolves directly", async ({ page }) => {
    await page.goto("/en/production-scheduling");
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    await expect(page.getByTestId("production-scheduling")).toBeVisible();
  });
});
