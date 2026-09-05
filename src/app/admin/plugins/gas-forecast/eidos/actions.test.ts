import assert from "node:assert/strict";
import test from "node:test";

import { runGasForecastExperimentAction } from "@/app/admin/plugins/gas-forecast/eidos/actions";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  globalThis.fetch = ORIGINAL_FETCH;
});

test("returns validation error for invalid date range", async () => {
  const result = await runGasForecastExperimentAction({
    start_date: "2026-02-01",
    end_date: "2026-01-01",
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.httpStatus, 400);
  assert.equal(result.message, "start_date must be before or equal to end_date.");
});

test("runs the backend capability with validated payload", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";

  let requestBody = "";

  globalThis.fetch = (async (_input, init) => {
    requestBody = String(init?.body ?? "");
    return Response.json({ execution_id: "exp-1", status: "ok" });
  }) as typeof fetch;

  const result = await runGasForecastExperimentAction({
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  });

  assert.equal(result.status, "succeeded");
  assert.deepEqual(JSON.parse(requestBody), {
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  });
});
