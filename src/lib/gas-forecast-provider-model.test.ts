import assert from "node:assert/strict";
import test from "node:test";

import {
  GAS_FORECAST_PROVIDER_CARDS,
  mapGasForecastFailure,
  mapGasForecastSuccess,
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
