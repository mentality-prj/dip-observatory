import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { GasForecastEidosPage } from "@/components/admin/gas-forecast-eidos-page";

test("renders gas forecast eidos experiment request fields", () => {
  const html = renderToStaticMarkup(<GasForecastEidosPage />);

  assert.equal(html.includes("Gas Forecast — EIDOS Experiment"), true);
  assert.equal(html.includes('id="start-date"'), true);
  assert.equal(html.includes('id="end-date"'), true);
  assert.equal(html.includes('id="forecast-horizon-days"'), true);
  assert.equal(html.includes('id="volume-mwh"'), true);
  assert.equal(html.includes('id="procurement-threshold"'), true);
  assert.equal(html.includes("Run experiment"), true);
});
