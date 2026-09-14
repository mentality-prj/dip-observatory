import { expect, test, type Page } from "@playwright/test";

const custom = {
  id: "sustainability", name: "Sustainability", version: "1.0", type: "numeric", source: "logistics",
  evaluator_id: "logistics.sustainability", evaluator_version: "2.0", required: false, blocking: false,
  value_schema: { type: "number" },
  configuration_schema: { type: "object", additionalProperties: false, required: ["maximum_emissions"],
    properties: { maximum_emissions: { type: "number", minimum: 0, title: "Maximum emissions" } } },
};
const plugin = { name: "logistics", version: "2.0", enabled: true, description: "Delivery forecasts",
  capabilities: ["delivery.evaluate"], capability_versions: { "delivery.evaluate": "1.5" },
  dimension_outputs: [{ dimension_id: "sustainability", capability_id: "delivery.evaluate", source_path: "result.emissions", value_schema: { type: "number" }, description: "Emissions" }],
  dimension_bindings: [], ui: { label: "Logistics", category: "Operations" } };
const binding = { id: "emissions", version: "1.0", plugin_id: "logistics", plugin_version: "2.0",
  capability_id: "delivery.evaluate", capability_version: "1.5", dimension_id: "sustainability",
  dimension_version: "1.0", source_path: "result.emissions", mapping: null, required: true, enabled: true };

async function mockStudio(page: Page) {
  const profiles: Record<string, unknown>[] = [];
  const writes: Record<string, unknown>[] = [];
  await page.route("**/api/studio/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/studio/", "");
    if (path === "dimensions") return route.fulfill({ json: [custom] });
    if (path === "decision-studio/plugins") return route.fulfill({ json: [plugin] });
    if (path === "plugins/logistics/dimension-bindings") return route.fulfill({ json: [binding] });
    if (path === "decision-profiles" && route.request().method() === "POST") {
      const payload = route.request().postDataJSON();
      writes.push(payload);
      const saved = { ...payload, validation: { status: "VALID", errors: [], warnings: [] } };
      profiles.push(saved);
      return route.fulfill({ status: 201, json: saved });
    }
    if (path.startsWith("decision-profiles/") && route.request().method() === "PATCH") {
      const payload = route.request().postDataJSON();
      writes.push(payload);
      const index = profiles.findIndex((p) => p.id === payload.id);
      profiles[index] = { ...payload, validation: { status: "VALID", errors: [], warnings: [] } };
      return route.fulfill({ json: profiles[index] });
    }
    if (path === "decision-profiles") return route.fulfill({ json: profiles });
    return route.fulfill({ status: 404, json: { detail: "Unknown mocked route" } });
  });
  return writes;
}

test("a custom dimension renders from its schema and saves a versioned profile", async ({ page }) => {
  const writes = await mockStudio(page);
  await page.goto("/studio/profiles");
  await page.getByRole("button", { name: "Create profile", exact: true }).click();
  await page.getByLabel("Profile ID", { exact: true }).fill("delivery-options");
  await page.getByLabel("Name", { exact: true }).fill("Delivery options");
  await page.getByLabel("Sustainability", { exact: true }).check();
  await page.getByLabel("Maximum emissions", { exact: true }).fill("125");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("saved at version 1.0");
  expect(writes[0]).toMatchObject({ id: "delivery-options", plugin_id: "logistics",
    capability_version: "1.5", dimensions: [{ dimension_id: "sustainability", version: "1.0",
      configuration: { maximum_emissions: 125 } }] });
  expect(writes[0]).not.toHaveProperty("validation");
  await page.screenshot({ path: "test-results/decision-studio-profiles.png", fullPage: true });
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("textbox", { name: /New version/ }).fill("2.0");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("saved at version 2.0");
  expect(writes[1]).toMatchObject({ id: "delivery-options", version: "2.0" });
  expect(writes[1]).not.toHaveProperty("validation");
});

test("invalid JSON blocks saving and plugin metadata remains inspectable", async ({ page }) => {
  const writes = await mockStudio(page);
  await page.goto("/studio/profiles");
  await page.getByRole("button", { name: "Create profile", exact: true }).click();
  await page.getByLabel("Profile ID", { exact: true }).fill("invalid-attributes");
  await page.getByLabel("Name", { exact: true }).fill("Invalid attributes");
  await page.getByLabel("Sustainability", { exact: true }).check();
  await page.getByLabel("Maximum emissions", { exact: true }).fill("25");
  await page.getByRole("textbox", { name: "Attributes", exact: true }).fill("{");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Enter valid JSON");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  expect(writes).toHaveLength(0);
  await page.screenshot({ path: "test-results/decision-studio-schema.png", fullPage: true });
  await page.getByRole("link", { name: "Plugins & capabilities" }).click();
  await expect(page.getByRole("heading", { name: "Logistics", exact: true })).toBeVisible();
  await expect(page.getByText("result.emissions → sustainability")).toBeVisible();
});

test("binding editor shows the declared source and dimension version", async ({ page }) => {
  await mockStudio(page);
  await page.goto("/studio/bindings");
  await page.getByRole("combobox", { name: "Plugin", exact: true }).selectOption("logistics");
  await expect(page.getByRole("heading", { name: "result.emissions → sustainability" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Dimension version", exact: true })).toHaveValue("1.0");
  await expect(page.getByLabel("Required output")).toBeChecked();
});

test("backend errors are visible and can be retried", async ({ page }) => {
  await page.route("**/api/studio/**", (route) => route.fulfill({ status: 503, json: { error: "Storage unavailable" } }));
  await page.goto("/studio/profiles");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Storage unavailable");
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});
