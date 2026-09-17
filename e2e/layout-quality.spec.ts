import { expect, test } from "@playwright/test";

const mobileRoutes = [
  "/en",
  "/en/production-decision",
  "/en/resource-allocation",
  "/en/supplier-decision",
];

test.describe("responsive product shell", () => {
  for (const route of mobileRoutes) {
    test(`${route} fits a narrow mobile viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await page.goto(route);

      await expect(page.locator("#main-content")).toHaveCount(1);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("language navigation remains available and preserves the route", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/production-decision");

    const ukrainian = page.getByRole("button", {
      name: "Switch language to uk",
    });
    await expect(ukrainian).toBeVisible();
    await ukrainian.click();
    await expect(page).toHaveURL(/\/uk\/production-decision$/);
  });
});
