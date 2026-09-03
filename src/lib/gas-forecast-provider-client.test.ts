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

test("classifies a network-level fetch failure as kind=network with the real error message", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("agsi");

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "network");
  assert.equal(result.httpStatus, null);
  assert.equal(result.message, "fetch failed");
});

test("classifies a request timeout as kind=network with a timeout message", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  process.env.DIP_GAS_FORECAST_TIMEOUT_MS = "5";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  globalThis.fetch = (async (_input, init) => {
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    });
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("agsi");

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "network");
  assert.equal(result.httpStatus, null);
  assert.match(result.message ?? "", /timed out/i);

  delete process.env.DIP_GAS_FORECAST_TIMEOUT_MS;
});

test("classifies a missing configuration failure as kind=configuration", async () => {
  delete process.env.DIP_API_BASE_URL;
  delete process.env.DIP_URL;
  delete process.env.NEXT_PUBLIC_DIP_API_BASE_URL;
  delete process.env.DIP_API_KEY;
  delete process.env.DIP_ADMIN_API_KEY;
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  const result = await testGasForecastProviderConnection("agsi");

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.equal(result.httpStatus, 503);
});

test("classifies a DIP authentication rejection (401) as kind=dip_auth, not generic dip_http", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  globalThis.fetch = (async () =>
    Response.json({ detail: "Invalid or missing API key" }, { status: 401 })) as typeof fetch;

  const result = await testGasForecastProviderConnection("agsi");

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "dip_auth");
  assert.equal(result.httpStatus, 401);
});

test("classifies a non-2xx, non-auth DIP HTTP response as kind=dip_http", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  globalThis.fetch = (async () =>
    Response.json({ detail: "Internal server error" }, { status: 500 })) as typeof fetch;

  const result = await testGasForecastProviderConnection("agsi");

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "dip_http");
  assert.equal(result.httpStatus, 500);
});
