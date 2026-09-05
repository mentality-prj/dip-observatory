import assert from "node:assert/strict";
import fs from "node:fs";
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

test("uses gas.provider.check with the exact TTF payload", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  const requestedUrls: string[] = [];
  let requestBody = "";

  globalThis.fetch = (async (input, init) => {
    requestedUrls.push(String(input));
    requestBody = String(init?.body ?? "");
    return Response.json({
      provider: { name: "TTF" },
      dataset: { records: 1, items: [{ date: "2026-01-01" }] },
    });
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("ttf", {
    ttf: {
      start_date: "2026-01-01",
      end_date: "2026-01-07",
      instrument: "front_month",
    },
  });

  assert.equal(result.status, "connected");
  assert.equal(requestedUrls.length, 1);
  assert.equal(requestedUrls[0]?.includes("gas.provider.check"), true);
  assert.deepEqual(JSON.parse(requestBody), {
    provider: "ttf",
    ttf: {
      start_date: "2026-01-01",
      end_date: "2026-01-07",
      instrument: "front_month",
    },
  });
});

test("uses gas.provider.check with the exact ENTSOG payload and no unsupported fields", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  const requestedUrls: string[] = [];
  let requestBody = "";

  globalThis.fetch = (async (input, init) => {
    requestedUrls.push(String(input));
    requestBody = String(init?.body ?? "");
    return Response.json({ provider: { name: "ENTSOG" }, dataset: {} });
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("entsog", {
    entsog: {
      pointDirection: "POINT_A%2BPOINT_B",
      from: "2026-01-01",
      to: "2026-01-07",
      indicator: "Physical Flow",
      periodType: "day",
    },
  });

  assert.equal(result.status, "connected");
  assert.equal(requestedUrls.length, 1);
  assert.equal(requestedUrls[0]?.includes("gas.provider.check"), true);
  assert.equal(requestedUrls[0]?.includes("gas.dataset.build"), false);
  const payload = JSON.parse(requestBody);
  assert.deepEqual(payload, {
    provider: "entsog",
    entsog: {
      pointDirection: "POINT_A%2BPOINT_B",
      from: "2026-01-01",
      to: "2026-01-07",
      indicator: "Physical Flow",
      periodType: "day",
    },
  });
  assert.equal(payload.provider, "entsog");
  assert.equal(payload.entsog.pointDirection, "POINT_A%2BPOINT_B");
  assert.equal(payload.entsog.from, "2026-01-01");
  assert.equal(payload.entsog.to, "2026-01-07");
  assert.equal(payload.entsog.indicator, "Physical Flow");
  assert.equal(payload.entsog.periodType, "day");
  assert.equal("scope" in payload.entsog, false);
  assert.equal("EU27" in payload.entsog, false);
  assert.equal("region" in payload.entsog, false);
  assert.equal("balancing_zone" in payload.entsog, false);
  assert.equal("start_date" in payload.entsog, false);
  assert.equal("end_date" in payload.entsog, false);
  assert.equal("point" in payload.entsog, false);
  assert.equal("connection" in payload.entsog, false);
  assert.equal("corridor" in payload.entsog, false);
  assert.equal("flow" in payload.entsog, false);
  assert.equal(requestBody.includes("EU27"), false);
  assert.equal(requestBody.includes("\"DE\""), false);
  assert.equal(requestBody.includes("\"TTF\""), false);
  assert.equal(requestBody.includes("default"), false);
});

test("uses gas.provider.check with the exact Weather payload and array regions", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  const requestedUrls: string[] = [];
  let requestBody = "";

  globalThis.fetch = (async (input, init) => {
    requestedUrls.push(String(input));
    requestBody = String(init?.body ?? "");
    return Response.json({ provider: { name: "WEATHER" }, dataset: {} });
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("weather", {
    weather: {
      start_date: "2026-01-01",
      end_date: "2026-01-07",
      regions: ["Germany", "Italy"],
      metric: "temperature_c",
    },
  });

  assert.equal(result.status, "connected");
  assert.equal(requestedUrls.length, 1);
  assert.equal(requestedUrls[0]?.includes("gas.provider.check"), true);
  const payload = JSON.parse(requestBody);
  assert.deepEqual(payload, {
    provider: "weather",
    weather: {
      start_date: "2026-01-01",
      end_date: "2026-01-07",
      regions: ["Germany", "Italy"],
      metric: "temperature_c",
    },
  });
  assert.deepEqual(payload.weather.regions, ["Germany", "Italy"]);
  assert.equal(typeof payload.weather.regions, "object");
  assert.equal(Array.isArray(payload.weather.regions), true);
  assert.equal(payload.weather.metric, "temperature_c");
  assert.equal(requestBody.includes("Germany,Italy"), false);
});

test("fails ENTSOG check configuration when UI query inputs are missing and does not send a request", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("entsog");

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.equal(result.httpStatus, 503);
  assert.equal(fetchCalls, 0);
  assert.match(result.message ?? "", /pointDirection/);
  assert.match(result.message ?? "", /from/);
  assert.match(result.message ?? "", /to/);
  assert.match(result.message ?? "", /Physical Flow/);
  assert.match(result.message ?? "", /periodType/);
});

test("does not read ENTSOG query fields from environment variables", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  process.env.DIP_ENTSOG_POINT_DIRECTION = "FROM_ENV";
  process.env.DIP_ENTSOG_FROM = "2026-01-01";
  process.env.DIP_ENTSOG_TO = "2026-01-07";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("entsog");

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.equal(result.httpStatus, 503);
  assert.equal(fetchCalls, 0);
});

test("does not read Weather query fields from environment variables", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  process.env.DIP_WEATHER_START_DATE = "2026-01-01";
  process.env.DIP_WEATHER_END_DATE = "2026-01-07";
  process.env.DIP_WEATHER_REGIONS = "Germany,Italy";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("weather");

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.equal(result.httpStatus, 503);
  assert.equal(fetchCalls, 0);
});

test("fails TTF check configuration when UI query inputs are missing and does not send a request", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("ttf");

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.equal(result.httpStatus, 503);
  assert.equal(fetchCalls, 0);
  assert.match(result.message ?? "", /start_date/);
  assert.match(result.message ?? "", /end_date/);
  assert.match(result.message ?? "", /instrument/);
});

test("does not read TTF query fields from environment variables", async () => {
  const previousBaseUrl = process.env.DIP_API_BASE_URL;
  const previousApiKey = process.env.DIP_API_KEY;
  const previousStartDate = process.env.DIP_TTF_START_DATE;
  const previousEndDate = process.env.DIP_TTF_END_DATE;
  const previousInstrument = process.env.DIP_TTF_INSTRUMENT;
  const previousCapabilityPath = process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  const previousLegacyCapabilityPath = process.env.GAS_FORECAST_CAPABILITY_PATH;

  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  process.env.DIP_TTF_START_DATE = "2026-01-01";
  process.env.DIP_TTF_END_DATE = "2026-01-07";
  process.env.DIP_TTF_INSTRUMENT = "front_month";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  try {
    const result = await testGasForecastProviderConnection("ttf");

    assert.equal(result.status, "failed");
    assert.equal(result.kind, "configuration");
    assert.equal(result.httpStatus, 503);
    assert.equal(fetchCalls, 0);
  } finally {
    if (previousStartDate === undefined) {
      delete process.env.DIP_TTF_START_DATE;
    } else {
      process.env.DIP_TTF_START_DATE = previousStartDate;
    }

    if (previousBaseUrl === undefined) {
      delete process.env.DIP_API_BASE_URL;
    } else {
      process.env.DIP_API_BASE_URL = previousBaseUrl;
    }

    if (previousApiKey === undefined) {
      delete process.env.DIP_API_KEY;
    } else {
      process.env.DIP_API_KEY = previousApiKey;
    }

    if (previousEndDate === undefined) {
      delete process.env.DIP_TTF_END_DATE;
    } else {
      process.env.DIP_TTF_END_DATE = previousEndDate;
    }

    if (previousInstrument === undefined) {
      delete process.env.DIP_TTF_INSTRUMENT;
    } else {
      process.env.DIP_TTF_INSTRUMENT = previousInstrument;
    }

    if (previousCapabilityPath === undefined) {
      delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
    } else {
      process.env.DIP_GAS_FORECAST_CAPABILITY_PATH = previousCapabilityPath;
    }

    if (previousLegacyCapabilityPath === undefined) {
      delete process.env.GAS_FORECAST_CAPABILITY_PATH;
    } else {
      process.env.GAS_FORECAST_CAPABILITY_PATH = previousLegacyCapabilityPath;
    }
  }
});

test("frontend source does not call upstream providers directly from browser code", () => {
  const browserUiSource = fs.readFileSync(
    "/home/runner/work/dip-observatory/dip-observatory/src/components/admin/gas-forecast-providers-page.tsx",
    "utf8",
  );

  assert.equal(browserUiSource.includes("transparency.entsog.eu"), false);
  assert.equal(browserUiSource.includes("open-meteo"), false);
  assert.equal(browserUiSource.includes("gas.dataset.build"), false);
  assert.equal(browserUiSource.includes("DIP_API_KEY"), false);
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

test("rejects future ENTSOG dates and never sends a backend request", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("entsog", {
    entsog: {
      pointDirection: "RAW_POINT",
      from: "2999-01-01",
      to: "2999-01-02",
      indicator: "Physical Flow",
      periodType: "day",
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.equal(result.message, "Future dates are not available.");
  assert.equal(fetchCalls, 0);
});

test("rejects ENTSOG from>to and never sends a backend request", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("entsog", {
    entsog: {
      pointDirection: "RAW_POINT",
      from: "2026-01-07",
      to: "2026-01-01",
      indicator: "Physical Flow",
      periodType: "day",
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.equal(result.message, "From date must be on or before To date.");
  assert.equal(fetchCalls, 0);
});

test("rejects future Weather dates and never sends a backend request", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("weather", {
    weather: {
      start_date: "2999-01-01",
      end_date: "2999-01-02",
      regions: ["Germany"],
      metric: "temperature_c",
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.equal(result.message, "Future dates are not available.");
  assert.equal(fetchCalls, 0);
});

test("rejects future TTF dates and never sends a backend request", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("ttf", {
    ttf: {
      start_date: "2999-01-01",
      end_date: "2999-01-02",
      instrument: "front_month",
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.equal(result.message, "Future dates are not available.");
  assert.equal(fetchCalls, 0);
});

test("rejects Weather requests without regions and never sends a backend request", async () => {
  process.env.DIP_API_BASE_URL = "https://dip.example.com";
  process.env.DIP_API_KEY = "test-key";
  delete process.env.DIP_GAS_FORECAST_CAPABILITY_PATH;
  delete process.env.GAS_FORECAST_CAPABILITY_PATH;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return Response.json({});
  }) as typeof fetch;

  const result = await testGasForecastProviderConnection("weather", {
    weather: {
      start_date: "2026-01-01",
      end_date: "2026-01-07",
      regions: [],
      metric: "temperature_c",
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.kind, "configuration");
  assert.match(result.message ?? "", /regions/);
  assert.equal(fetchCalls, 0);
});
