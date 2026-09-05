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
  const requestBodies: string[] = [];

  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    requestedUrls.push(url);
    requestBodies.push(String(init?.body ?? ""));

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
    "https://dip.example.com/api/v1/plugin-runtime/plugins/gas-forecast/capabilities/gas.provider.check",
    "https://dip.example.com/api/v1/plugin-runtime/plugins/gas-forecast/capabilities/gas.provider.check/run",
  ]);
  const payload = JSON.parse(requestBodies[0] ?? "{}");

  assert.deepEqual(payload, {
    provider: "agsi",
    agsi: {
      start_date: "2025-01-01",
      end_date: "2025-01-07",
      type: "eu",
    },
  });
  assert.equal(payload.provider, "agsi");
  assert.equal(payload.agsi.start_date, "2025-01-01");
  assert.equal(payload.agsi.end_date, "2025-01-07");
  assert.equal(payload.agsi.type, "eu");
  assert.equal("scope" in payload.agsi, false);
  assert.equal((requestBodies[0] ?? "").includes("EU27"), false);
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

test("includes the matching provider-specific object key for non-AGSI providers", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let requestBody = "";

  globalThis.fetch = (async (_input, init) => {
    requestBody = String(init?.body ?? "");
    return Response.json({
      provider: { name: "TTF" },
      dataset: { records: 1, items: [{ date: "2026-01-01" }] },
    });
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("ttf");

  assert.equal(result.status, "connected");
  assert.deepEqual(JSON.parse(requestBody), {
    provider: "ttf",
    ttf: {},
  });
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

test("preserves the structured DIP plugin-execution error (500 upstream AGSI failure) instead of a generic message", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  globalThis.fetch = (async () =>
    Response.json(
      {
        error: {
          code: "PLUGIN_EXECUTION_ERROR",
          message: "Plugin execution failed",
          provider: "GIE AGSI+",
          plugin: "gas-forecast",
          upstreamStatus: 503,
          executionId: "exec-123",
          cause: { message: "AGSI request failed: service unavailable" },
        },
      },
      { status: 500 },
    )) as typeof fetch;

  const result = await testGasForecastProviderConnection("agsi");

  assert.equal(result.status, "failed");
  assert.equal(result.httpStatus, 500);
  assert.equal(result.kind, "upstream_provider");
  assert.equal(result.provider, "GIE AGSI+");
  assert.equal(result.message, "AGSI request failed: service unavailable");
  assert.equal(result.errorDetail?.code, "PLUGIN_EXECUTION_ERROR");
  assert.equal(result.errorDetail?.provider, "GIE AGSI+");
  assert.equal(result.errorDetail?.plugin, "gas-forecast");
  assert.equal(result.errorDetail?.upstreamStatus, 503);
  assert.equal(result.errorDetail?.executionId, "exec-123");
});

test("never surfaces the request's DIP_API_KEY in the failure message even if a non-JSON DIP body echoes it back", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "super-secret-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  globalThis.fetch = (async () =>
    new Response(
      "Internal Server Error: header x-api-key: super-secret-key rejected by upstream",
      { status: 500, headers: { "content-type": "text/plain" } },
    )) as typeof fetch;

  const result = await testGasForecastProviderConnection("agsi");

  assert.equal(result.status, "failed");
  assert.equal(result.httpStatus, 500);
  assert.ok(result.message);
  assert.ok(!result.message!.includes("super-secret-key"));
  assert.ok(result.message!.includes("[REDACTED]"));
});
