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

async function mockStudio(page: Page, initial: Record<string, unknown>[] = [], dimensions: unknown[] = [custom]) {
  const profiles: Record<string, unknown>[] = [...initial];
  const writes: Record<string, unknown>[] = [];
  await page.route("**/api/studio/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/studio/", "");
    if (path === "dimensions") return route.fulfill({ json: dimensions });
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
    if (path.startsWith("decision-profiles/") && route.request().method() === "GET") return route.fulfill({ json: profiles.find((p) => p.id === path.split("/")[1]) });
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
  await page.getByRole("link", { name: "Open profile", exact: true }).click();
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
  await page.getByRole("link", { name: "Plugins & Capabilities" }).click();
  await expect(page.getByRole("heading", { name: "Logistics", exact: true })).toBeVisible();
  await expect(page.getByText("delivery.evaluate.emissions → Sustainability")).toBeVisible();
});

test("binding editor shows the declared source and dimension version", async ({ page }) => {
  await mockStudio(page);
  await page.goto("/studio/bindings");
  await page.getByRole("combobox", { name: "Plugin", exact: true }).selectOption("logistics");
  await expect(page.getByRole("heading", { name: "delivery.evaluate.emissions → Sustainability" })).toBeVisible();
  await page.getByText("Advanced details", { exact: true }).click();
  await expect(page.getByText("result.emissions", { exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Dimension version", exact: true })).toHaveValue("1.0");
  await expect(page.getByLabel("Required output")).toBeChecked();
});

test("backend errors are visible and can be retried", async ({ page }) => {
  await page.route("**/api/studio/**", (route) => route.fulfill({ status: 503, json: { error: "Storage unavailable" } }));
  await page.goto("/studio/profiles");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Storage unavailable");
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("profile sections preserve the versioned profile and scope rule editing", async ({ page }) => {
  const constraints = { ...custom, id: "constraints", name: "Constraints", type: "rules", blocking: true,
    configuration_schema: { type: "object", required: ["rules"], properties: { rules: { type: "array", items: {
      type: "object", required: ["id", "path", "operator", "limit"], properties: {
        id: { type: "string" }, path: { type: "string" }, operator: { enum: ["lte"] }, limit: { type: "number" },
      },
    } } } } };
  const profile = { id: "delivery", name: "Delivery options", version: "1.0", active: false,
    plugin_id: "logistics", plugin_version: "2.0", capability_id: "delivery.evaluate", capability_version: "1.5",
    alternatives: [{ id: "BUY_NOW", label: "Buy now", attributes: { purchase_ratio: 1 } }],
    dimensions: [{ dimension_id: "constraints", version: "1.0", required: true, weight: 0, binding_id: null, binding_version: null,
      configuration: { rules: [{ id: "maximum_purchase", path: "alternative.attributes.purchase_ratio", operator: "lte", limit: 0.5 }] } },
    { dimension_id: "sustainability", version: "1.0", required: true, weight: 1, binding_id: "emissions", binding_version: "1.0", configuration: { maximum_emissions: 125 } }],
    context_schema: { type: "object" }, metadata: { preserved: true }, validation: { status: "VALID", errors: [], warnings: [] } };
  const writes = await mockStudio(page, [profile], [custom, constraints]);
  await page.goto("/studio/profiles/delivery/constraints");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Delivery options");
  await expect(page.getByRole("navigation", { name: "Decision Studio", exact: true }).getByRole("link", { name: "Constraints" })).toHaveCount(0);
  await expect(page.getByText("purchase ratio ≤ 0.5", { exact: true })).toBeVisible();
  await expect(page.getByText(/Blocking: Yes/)).toBeVisible();
  await expect(page.getByLabel("Maximum emissions", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Alternative ID", { exact: true })).toHaveCount(0);
  await page.getByRole("textbox", { name: /New version/ }).fill("2.0");
  await page.getByRole("spinbutton", { name: "limit", exact: true }).fill("0.75");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("saved at version 2.0");
  expect(writes[0]).toMatchObject({ version: "2.0", alternatives: profile.alternatives, metadata: profile.metadata });
  expect((writes[0].dimensions as unknown[])[1]).toEqual(profile.dimensions[1]);
  expect(writes[0]).not.toHaveProperty("validation");
  await page.getByRole("navigation", { name: "Profile sections" }).getByRole("link", { name: "Dimensions", exact: true }).click();
  await expect(page.getByRole("table")).toContainText("Plugin supplied · Logistics");
  await expect(page.getByRole("table")).toContainText("Business configured");
  await page.getByRole("navigation", { name: "Profile sections" }).getByRole("link", { name: "Alternatives" }).click();
  await expect(page.getByLabel("Alternative ID", { exact: true })).toHaveValue("BUY_NOW");
  await page.screenshot({ path: "test-results/profile-alternatives.png", fullPage: true });
  await page.getByRole("navigation", { name: "Profile sections" }).getByRole("link", { name: "Policies" }).click();
  await expect(page.getByText("Policies may require actions or approvals without necessarily making an alternative infeasible.")).toBeVisible();
  await expect(page.getByLabel("Alternative ID", { exact: true })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Profile sections" }).getByRole("link", { name: "Compliance" }).click();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Delivery options / Compliance");
  await expect(page.getByText(/A framework such as GDPR is a ruleset/)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/profile-mobile.png", fullPage: true });
  await page.goto("/studio/constraints");
  await expect(page).toHaveURL(/\/studio\/profiles$/);
});

test("global registries do not load profile configuration", async ({ page }) => {
  let profileRequests = 0;
  await mockStudio(page);
  page.on("request", (request) => { if (request.url().includes("/api/studio/decision-profiles")) profileRequests++; });
  await page.goto("/studio/dimensions");
  await expect(page.getByRole("heading", { name: "Sustainability" })).toBeVisible();
  await expect(page.getByText("logistics.sustainability@2.0", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create profile" })).toHaveCount(0);
  await page.getByRole("link", { name: "Plugins & Capabilities" }).click();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Plugin Registry");
  expect(profileRequests).toBe(0);
});
