import assert from "node:assert/strict";
import test from "node:test";

import {
  getGasForecastCapabilityPaths,
  testGasForecastProviderConnection,
} from "@/lib/gas-forecast-provider-client";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  globalThis.fetch = ORIGINAL_FETCH;
});

test("tries the fallback capability paths until a non-404 response succeeds", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  const requestedUrls: string[] = [];

  globalThis.fetch = (async (input) => {
    const url = String(input);
    requestedUrls.push(url);

    if (requestedUrls.length === 1) {
      return new Response("Not Found", { status: 404 });
    }

    return Response.json({
      provider: { name: "GIE AGSI+" },
      dataset: {
        records: 365,
        items: [{ date: "2026-01-01", gasInStorage: 12.3 }],
      },
    });
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("agsi");

  assert.equal(result.status, "connected");
  assert.equal(result.httpStatus, 200);
  assert.equal(result.dataset?.records, 365);
  assert.deepEqual(requestedUrls, [
    "https://dip.example.com/api/v1/plugin-runtime/plugins/gas-forecast/capabilities/gas.dataset.build",
    "https://dip.example.com/api/v1/plugin-runtime/plugins/gas-forecast/capabilities/gas.dataset.build/run",
  ]);
});

test("returns a clear invalid-endpoint message after all fallback paths return 404", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  globalThis.fetch = (async () =>
    new Response("Not Found", { status: 404 })) as typeof fetch;

  const result = await testGasForecastProviderConnection("agsi");

  assert.equal(result.status, "failed");
  assert.equal(result.httpStatus, 404);
  assert.match(result.message ?? "", /^Invalid API endpoint\. Tried:/);
  assert.equal(
    getGasForecastCapabilityPaths().every((path) =>
      (result.message ?? "").includes(path),
    ),
    true,
  );
});
