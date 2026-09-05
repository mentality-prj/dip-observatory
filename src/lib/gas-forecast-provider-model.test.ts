import assert from "node:assert/strict";
import test from "node:test";

import {
  GAS_FORECAST_PROVIDER_CARDS,
  classifyGasForecastFailureKind,
  extractStructuredError,
  mapGasForecastFailure,
  mapGasForecastSuccess,
  redactSecrets,
  toSafeRawBody,
} from "@/lib/gas-forecast-provider-model";

test("AGSI provider card keeps the expected API label", () => {
  const agsi = GAS_FORECAST_PROVIDER_CARDS.find((card) => card.id === "agsi");

  assert.ok(agsi);
  assert.equal(agsi.api, "GIE AGSI+");
  assert.equal(agsi.initialStatus, "not_tested");
});

test("maps a successful provider payload into dataset summary and sample rows", () => {
  const result = mapGasForecastSuccess({
    providerId: "agsi",
    httpStatus: 200,
    responseTimeMs: 420,
    payload: {
      provider: { name: "GIE AGSI+" },
      dataset: {
        records: 365,
        facility: "UA / Bilche-Volytsko-Uherske",
        items: [
          {
            date: "2026-01-01",
            gasInStorage: 12.3,
            injection: 0.4,
            withdrawal: 0.1,
            workingGasVolume: 13.7,
          },
          {
            date: "2026-12-31",
            gasInStorage: 10.3,
            injection: 0.2,
            withdrawal: 0.6,
            workingGasVolume: 13.7,
          },
        ],
      },
    },
  });

  assert.equal(result.status, "connected");
  assert.equal(result.connection, "OK");
  assert.equal(result.httpStatus, 200);
  assert.equal(result.provider, "GIE AGSI+");
  assert.equal(result.api, "GIE AGSI+");
  assert.equal(result.responseTimeMs, 420);
  assert.equal(result.dataset?.records, 365);
  assert.equal(result.dataset?.firstDate, "2026-01-01");
  assert.equal(result.dataset?.lastDate, "2026-12-31");
  assert.equal(result.dataset?.countryOrFacility, "UA / Bilche-Volytsko-Uherske");
  assert.deepEqual(result.sample[0], {
    date: "2026-01-01",
    gasInStorage: "12.3",
    injection: "0.4",
    withdrawal: "0.1",
    workingGasVolume: "13.7",
  });
});

test("keeps records nullable when backend does not provide a count and no sample rows exist", () => {
  const result = mapGasForecastSuccess({
    providerId: "entsog",
    httpStatus: 200,
    responseTimeMs: 120,
    payload: {
      provider: { name: "ENTSOG" },
      dataset: {},
    },
  });

  assert.equal(result.status, "connected");
  assert.equal(result.dataset?.records, null);
});

test("maps provider failure payloads into operator-facing error messages", () => {
  const result = mapGasForecastFailure({
    providerId: "agsi",
    httpStatus: 401,
    responseTimeMs: 84,
    payload: {
      detail: "Invalid or missing API key",
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.connection, "FAILED");
  assert.equal(result.httpStatus, 401);
  assert.equal(result.message, "Invalid or missing API key");
  assert.equal(result.dataset, null);
  assert.deepEqual(result.sample, []);
});

test("maps missing DIP connectivity config into the updated 503 operator message", () => {
  const result = mapGasForecastFailure({
    providerId: "agsi",
    httpStatus: 503,
    responseTimeMs: null,
    payload: null,
  });

  assert.equal(
    result.message,
    "DIP gas forecast connectivity is not configured. Set DIP_API_KEY and either DIP_API_BASE_URL or an absolute DIP_GAS_FORECAST_CAPABILITY_PATH.",
  );
});

test("extracts structured DIP error fields (code, provider, plugin, upstream status, execution id)", () => {
  const structured = extractStructuredError({
    error: {
      code: "PLUGIN_EXECUTION_ERROR",
      message: "Plugin execution failed",
      provider: "GIE AGSI+",
      plugin: "gas-forecast",
      upstreamStatus: 503,
      executionId: "exec-123",
    },
  });

  assert.deepEqual(structured, {
    code: "PLUGIN_EXECUTION_ERROR",
    provider: "GIE AGSI+",
    plugin: "gas-forecast",
    upstreamStatus: 503,
    executionId: "exec-123",
    rawBody: null,
  });
});

test("returns null structured error for a plain unstructured payload", () => {
  assert.equal(extractStructuredError({ message: "boom" }), null);
  assert.equal(extractStructuredError(null), null);
});

test("sanitizes and truncates structured rawBody", () => {
  const rawBody = `x-api-key: super-secret ${"x".repeat(5000)}`;
  const structured = extractStructuredError({ rawBody });

  assert.ok(structured);
  assert.ok(structured.rawBody);
  assert.equal(structured.rawBody, toSafeRawBody(rawBody));
  assert.ok(!structured.rawBody?.includes("super-secret"));
  assert.ok(structured.rawBody?.includes("[REDACTED]"));
  assert.ok(structured.rawBody?.endsWith("[truncated]"));
});

test("prefers the deepest cause message over the generic wrapper message", () => {
  const result = mapGasForecastFailure({
    providerId: "agsi",
    httpStatus: 500,
    responseTimeMs: 6095,
    payload: {
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
  });

  assert.equal(result.kind, "upstream_provider");
  assert.equal(result.provider, "GIE AGSI+");
  assert.equal(result.message, "AGSI request failed: service unavailable");
  assert.equal(result.errorDetail?.code, "PLUGIN_EXECUTION_ERROR");
  assert.equal(result.errorDetail?.executionId, "exec-123");
});

test("classifyGasForecastFailureKind returns plugin_execution for a plugin-scoped structured error without a provider", () => {
  const kind = classifyGasForecastFailureKind({
    httpStatus: 500,
    payload: {
      error: {
        code: "PLUGIN_RUNTIME_ERROR",
        message: "Plugin crashed",
        plugin: "gas-forecast",
      },
    },
  });

  assert.equal(kind, "plugin_execution");
});

test("classifyGasForecastFailureKind returns timeout for a structured timeout error", () => {
  const kind = classifyGasForecastFailureKind({
    httpStatus: 500,
    payload: {
      error: {
        code: "UPSTREAM_TIMEOUT",
        message: "AGSI request timed out after 15000ms",
      },
    },
  });

  assert.equal(kind, "timeout");
});

test("redactSecrets masks API keys and Authorization headers but keeps the rest of the text", () => {
  const redacted = redactSecrets(
    "rejected: x-api-key: super-secret-value, Authorization: ******",
  );

  assert.ok(!redacted.includes("super-secret-value"));
  assert.ok(redacted.includes("[REDACTED]"));
  assert.ok(redacted.includes("rejected:"));
});

test("toSafeRawBody truncates long raw response bodies", () => {
  const longBody = "x".repeat(5000);
  const safe = toSafeRawBody(longBody);

  assert.ok(safe.length < longBody.length);
  assert.ok(safe.endsWith("[truncated]"));
});
