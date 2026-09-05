import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { GasForecastProvidersPage } from "@/components/admin/gas-forecast-providers-page";
import { getTodayLocalDateIso } from "@/lib/entsog-date-range";

test("renders ENTSOG date pickers with local-today max constraints", () => {
  const today = getTodayLocalDateIso();
  const html = renderToStaticMarkup(<GasForecastProvidersPage />);

  assert.equal(html.includes(`id="entsog-from"`), true);
  assert.equal(html.includes(`id="entsog-to"`), true);
  assert.equal(html.includes(`max="${today}"`), true);
  assert.equal(html.includes(`min=""`), false);
});
