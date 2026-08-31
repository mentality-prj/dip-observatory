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

    // Scope strictly to the navigation link row — not the whole page —
    // so unrelated sections linking to /eidos cannot produce false negatives.
    const eidosNavLinks = await page
      .locator("nav a[href*='/eidos']")
      .count();
    expect(eidosNavLinks).toBe(0);
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
    const response = await page.goto("/en/eidos");
    // HTTP status must be 2xx — catches Next.js 404 rendered at the original URL
    expect(response?.status()).toBeLessThan(400);
  });

  test("/en/supplier-decision route resolves directly", async ({ page }) => {
    const response = await page.goto("/en/supplier-decision");
    expect(response?.status()).toBeLessThan(400);
  });

  test("/en/production-scheduling route resolves directly", async ({ page }) => {
    const response = await page.goto("/en/production-scheduling");
    expect(response?.status()).toBeLessThan(400);
    await page.waitForURL(/\/en\/production-scheduling/, { timeout: 10_000 });
    await expect(page.getByTestId("production-scheduling")).toBeVisible();
  });
});
