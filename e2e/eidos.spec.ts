import { test, expect } from "@playwright/test";

test.describe("EIDOS Decision Observatory prototype", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/eidos");
    await page.waitForURL(/\/en\/eidos/, { timeout: 10_000 });
  });

  test("language switcher is visible and only offers English and Polish", async ({
    page,
  }) => {
    const switcher = page.getByRole("combobox", { name: /language/i });
    await expect(switcher).toBeVisible();
    await expect(switcher).toHaveValue("en");

    const options = switcher.locator("option");
    await expect(options).toHaveCount(2);
    await expect(options.nth(0)).toHaveText("English");
    await expect(options.nth(1)).toHaveText("Polski");

    await switcher.selectOption("pl");
    await page.waitForURL(/\/pl\/eidos/, { timeout: 10_000 });
  });

  test("documentation page stays on documentation route when switching language", async ({
    page,
  }) => {
    await page.goto("/en/eidos/documentation");
    await page.waitForURL(/\/en\/eidos\/documentation/, { timeout: 10_000 });

    await expect(
      page.getByRole("heading", {
        name: /Management explanation for EIDOS/i,
        level: 1,
      }),
    ).toBeVisible();

    const switcher = page.getByRole("combobox", { name: /language/i });
    await expect(switcher).toBeVisible();

    await switcher.selectOption("pl");
    await page.waitForURL(/\/pl\/eidos\/documentation/, { timeout: 10_000 });

    await expect(
      page.getByRole("heading", {
        name: /Objaśnienie dla managera EIDOS/i,
        level: 1,
      }),
    ).toBeVisible();
  });

  test("unsupported EIDOS locales redirect to english", async ({ page }) => {
    await page.goto("/es/eidos");
    await page.waitForURL(/\/en\/eidos/, { timeout: 10_000 });

    await expect(
      page.getByRole("heading", {
        name: /Monitor procurement decisions, focus on what changed/i,
      }),
    ).toBeVisible();

    await page.goto("/uk/eidos/documentation");
    await page.waitForURL(/\/en\/eidos\/documentation/, { timeout: 10_000 });

    await expect(
      page.getByRole("heading", {
        name: /Management explanation for EIDOS/i,
        level: 1,
      }),
    ).toBeVisible();
  });

  test("page renders with the synthetic-data disclaimer and summary", async ({
    page,
  }) => {
    await expect(
      page.getByText("Prototype — synthetic data").first(),
    ).toBeVisible();

    // Total clients metric is derived from the dataset (20).
    const totalCard = page.getByRole("button", { name: /Total clients/i });
    await expect(totalCard).toContainText("20");

    // Exception metrics are present.
    await expect(
      page.getByRole("button", { name: /Action required/i }),
    ).toBeVisible();
  });

  test("search filters the client table", async ({ page }) => {
    const search = page.getByRole("searchbox", {
      name: /search clients by name/i,
    });
    await search.fill("Helios");
    const table = page.getByRole("table").first();
    await expect(table.getByText("Helios Ceramics")).toBeVisible();
    await expect(table.getByText("Northwind Foods")).toHaveCount(0);
  });

  test("status filter narrows the table", async ({ page }) => {
    await page
      .getByRole("button", { name: /Action required/i })
      .first()
      .click();
    const table = page.getByRole("table").first();
    // Only ACTION_REQUIRED clients remain; stable clients disappear.
    await expect(table.getByText("Orion Breweries")).toHaveCount(0);
  });

  test("selecting a client opens the decision detail", async ({ page }) => {
    await page.getByRole("button", { name: /Adriatic Textiles/i }).click();
    const detail = page.getByTestId("eidos-detail");
    await expect(detail).toBeVisible();
    await expect(detail.getByText("Adriatic Textiles")).toBeVisible();
    await expect(detail.getByText(/Recommended strategy/i)).toBeVisible();
  });

  test("scenario switching changes the recommendation and metrics", async ({
    page,
  }) => {
    // Demo client (eidos-03) is preselected: BASELINE -> BUY 40%, HIGH PRICE -> WAIT.
    const detail = page.getByTestId("eidos-detail");
    await expect(detail).toBeVisible();

    const altTable = detail.getByRole("table").first();
    const recommendedRow = altTable.locator("tr", {
      has: page.getByText("Recommended", { exact: true }),
    });
    await expect(recommendedRow).toContainText("BUY 40%");

    await detail.getByRole("radio", { name: /High price/i }).click();
    await expect(recommendedRow).toContainText("WAIT");
  });

  test("decision history and outcome tracking render", async ({ page }) => {
    const detail = page.getByTestId("eidos-detail");
    await expect(
      detail.getByRole("heading", { name: /Decision history/i }),
    ).toBeVisible();
    await expect(
      detail.getByRole("heading", { name: /Outcome tracking/i }),
    ).toBeVisible();

    // Replay is a UI-only interaction.
    await detail.getByRole("button", { name: /Replay decision/i }).click();
    await expect(
      detail.getByText("Original decision", { exact: true }),
    ).toBeVisible();
  });

  test("Polish locale shows localized UI and in-app documentation", async ({
    page,
  }) => {
    await page.goto("/pl/eidos");
    await page.waitForURL(/\/pl\/eidos/, { timeout: 10_000 });

    await expect(
      page.getByRole("heading", {
        name: /Monitoruj decyzje zakupowe i skupiaj się na tym, co się zmieniło/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Przejdź do dokumentacji/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Pokaż dokumentację/i }),
    ).toHaveCount(0);
  });
});
