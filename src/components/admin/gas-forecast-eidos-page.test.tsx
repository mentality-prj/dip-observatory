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

test("renders success execution state when result is present", () => {
  const html = renderToStaticMarkup(
    <GasForecastEidosPage
      initialResult={{
        status: "succeeded",
        httpStatus: 200,
        responseTimeMs: 123,
        message: null,
        payload: { execution_id: "exp-1" },
        executedAt: "2026-01-01T00:00:00.000Z",
      }}
    />,
  );

  assert.equal(html.includes("Execution result"), true);
  assert.equal(html.includes("SUCCEEDED"), true);
  assert.equal(html.includes('aria-label="Raw backend payload"'), true);
});

test("renders failure message when execution fails", () => {
  const html = renderToStaticMarkup(
    <GasForecastEidosPage
      initialResult={{
        status: "failed",
        httpStatus: 500,
        responseTimeMs: 321,
        message: "Provider timeout",
        payload: { detail: "Provider timeout" },
        executedAt: "2026-01-01T00:00:00.000Z",
      }}
    />,
  );

  assert.equal(html.includes("FAILED"), true);
  assert.equal(html.includes("Provider timeout"), true);
});
