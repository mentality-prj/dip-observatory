import assert from "node:assert/strict";
import test from "node:test";

import {
  getGasForecastExperimentCapabilityPaths,
  runGasForecastExperiment,
} from "@/lib/gas-forecast-experiment-client";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  globalThis.fetch = ORIGINAL_FETCH;
});

test("uses gas.forecast.experiment with the exact request payload", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;

  const requestedUrls: string[] = [];
  let requestBody = "";

  globalThis.fetch = (async (input, init) => {
    requestedUrls.push(String(input));
    requestBody = String(init?.body ?? "");
    return Response.json({ ok: true, records: 7 });
  }) as typeof fetch;

  const result = await runGasForecastExperiment({
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  });

  assert.equal(result.status, "succeeded");
  assert.equal(requestedUrls.length, 1);
  assert.equal(requestedUrls[0]?.includes("gas.forecast.experiment"), true);
  assert.deepEqual(JSON.parse(requestBody), {
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  });
});

test("tries fallback paths until a non-404 response", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;

  const requestedUrls: string[] = [];

  globalThis.fetch = (async (input) => {
    requestedUrls.push(String(input));

    if (requestedUrls.length === 1) {
      return new Response("Not Found", { status: 404 });
    }

    return Response.json({ ok: true });
  }) as typeof fetch;

  const result = await runGasForecastExperiment({
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  });

  assert.equal(result.status, "succeeded");
  assert.deepEqual(requestedUrls, [
    "https://dip.example.com/api/v1/plugin-runtime/plugins/gas-forecast/capabilities/gas.forecast.experiment",
    "https://dip.example.com/api/v1/plugin-runtime/plugins/gas-forecast/capabilities/gas.forecast.experiment/run",
  ]);
});

test("continues probing fallback paths after a network failure", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;

  const requestedUrls: string[] = [];

  globalThis.fetch = (async (input) => {
    requestedUrls.push(String(input));

    if (requestedUrls.length === 1) {
      throw new TypeError("fetch failed");
    }

    return Response.json({ ok: true });
  }) as typeof fetch;

  const result = await runGasForecastExperiment({
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  });

  assert.equal(result.status, "succeeded");
  assert.equal(requestedUrls.length, 2);
});

test("prefers invalid-endpoint result when probes include 404 responses", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;

  let calls = 0;

  globalThis.fetch = (async () => {
    calls += 1;

    if (calls === 1) {
      return new Response("Not Found", { status: 404 });
    }

    throw new TypeError("fetch failed");
  }) as typeof fetch;

  const result = await runGasForecastExperiment({
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.httpStatus, 404);
  assert.match(result.message ?? "", /Invalid API endpoint/);
});

test("returns a clear configuration failure when DIP credentials are missing", async () => {
  delete process.env.DIP_API_BASE_URL;
  delete process.env.DIP_API_KEY;
  delete process.env.DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH;

  const result = await runGasForecastExperiment({
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    forecast_horizon_days: 7,
    volume_mwh: 10_000_000,
    procurement_threshold_eur_per_mwh: 85,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.httpStatus, 503);
  assert.match(result.message ?? "", /DIP gas forecast experiment is not configured/);
  assert.equal(getGasForecastExperimentCapabilityPaths().length > 0, true);
});
