import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { GasForecastProvidersPage } from "@/components/admin/gas-forecast-providers-page";

test("renders ENTSOG date pickers with local-today max constraints", () => {
  const html = renderToStaticMarkup(<GasForecastProvidersPage />);
  const fromMaxMatch = html.match(/id="entsog-from"[^>]*max="([^"]+)"/);
  const toMaxMatch = html.match(/id="entsog-to"[^>]*max="([^"]+)"/);

  assert.equal(html.includes(`id="entsog-from"`), true);
  assert.equal(html.includes(`id="entsog-to"`), true);
  assert.ok(fromMaxMatch);
  assert.ok(toMaxMatch);
  const fromMax = fromMaxMatch[1];
  const toMax = toMaxMatch[1];
  assert.equal(fromMax, toMax);
  assert.match(fromMax, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(html.includes(`min=""`), false);
});
