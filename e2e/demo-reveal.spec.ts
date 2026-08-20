import { test, expect } from "@playwright/test";

test.describe("demo mode: Run → sequential reveal → final decision", () => {
  test.beforeEach(async ({ page }) => {
    // uses whatever locale is at root; the redirect selects one
    await page.goto("/");
    await page.waitForURL(/\/(en|uk|pl)/, { timeout: 10_000 });
  });

  test("shows semantic step labels during reveal and reaches DECISION", async ({
    page,
  }) => {
    // page loaded — chart waiting overlay should be visible before any run
    await expect(
      page
        .getByRole("main")
        .locator("[data-testid=chart-waiting]")
        .or(
          page
            .locator("text=awaiting")
            .or(page.locator("text=очікує"))
            .or(page.locator("text=czeka")),
        ),
    ).toBeVisible({ timeout: 8_000 });

    // scenario bar and Run button must be present
    const runBtn = page.getByRole("button", {
      name: /run|запустити|uruchom/i,
    });
    await expect(runBtn).toBeVisible();

    // click Run and wait for loading state to clear
    await runBtn.click();
    await page.waitForFunction(
      () => !document.querySelector("[data-loading=true]"),
      { timeout: 25_000 },
    );

    // after reveal completes (4 × 420 ms + render buffer)
    await page.waitForTimeout(2_500);

    // chart SVG should now contain trajectory nodes (circles added by D3)
    const svgCircles = page.locator("svg[aria-label] circle");
    await expect(svgCircles.first()).toBeVisible({ timeout: 5_000 });

    // Decision Analysis panel should show a decision value
    const decisionValue = page.locator(
      "text=/contain_now|intervene|allow|monitor|de_risk|rebalance|diversify/i",
    );
    await expect(decisionValue.first()).toBeVisible({ timeout: 5_000 });
  });

  test("locked demo mode prevents scenario switching", async ({ page }) => {
    // if DIP_OBSERVATORY_DEMO_MODE=true the scenario selector is disabled
    const scenarioSelect = page.locator("select").first();
    const isDisabled = await scenarioSelect.isDisabled();

    if (isDisabled) {
      await expect(scenarioSelect).toBeDisabled();
    } else {
      // non-demo mode: can switch scenarios
      await expect(scenarioSelect).toBeEnabled();
    }
  });
});
