import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const FEATURE_PATH = "src/features/gas-forecast/components/gas-forecast-providers-page.tsx";
const LEGACY_PATH = "src/components/admin/gas-forecast-providers-page.tsx";

test("gas forecast providers page lives behind the feature boundary", () => {
  assert.equal(fs.existsSync(FEATURE_PATH), true);
  assert.equal(fs.existsSync(LEGACY_PATH), false);
});
