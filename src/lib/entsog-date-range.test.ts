import assert from "node:assert/strict";
import test from "node:test";

import {
  getEntsogDatePickerBounds,
  getTodayLocalDateIso,
  validateEntsogHistoricalDateRange,
} from "@/lib/entsog-date-range";

test("today is accepted", () => {
  assert.equal(
    validateEntsogHistoricalDateRange(
      { from: "2026-09-05", to: "2026-09-05" },
      "2026-09-05",
    ),
    null,
  );
});

test("yesterday is accepted", () => {
  assert.equal(
    validateEntsogHistoricalDateRange(
      { from: "2026-09-04", to: "2026-09-04" },
      "2026-09-05",
    ),
    null,
  );
});

test("tomorrow is rejected", () => {
  assert.equal(
    validateEntsogHistoricalDateRange(
      { from: "2026-09-06", to: "2026-09-06" },
      "2026-09-05",
    ),
    "Future dates are not available.",
  );
});

test("from=today and to=today is accepted", () => {
  assert.equal(
    validateEntsogHistoricalDateRange(
      { from: "2026-09-05", to: "2026-09-05" },
      "2026-09-05",
    ),
    null,
  );
});

test("from=yesterday and to=today is accepted", () => {
  assert.equal(
    validateEntsogHistoricalDateRange(
      { from: "2026-09-04", to: "2026-09-05" },
      "2026-09-05",
    ),
    null,
  );
});

test("from=today and to=yesterday is rejected", () => {
  assert.equal(
    validateEntsogHistoricalDateRange(
      { from: "2026-09-05", to: "2026-09-04" },
      "2026-09-05",
    ),
    "From date must be on or before To date.",
  );
});

test("both future dates are rejected", () => {
  assert.equal(
    validateEntsogHistoricalDateRange(
      { from: "2026-09-07", to: "2026-09-08" },
      "2026-09-05",
    ),
    "Future dates are not available.",
  );
});

test("manual future-date input is rejected", () => {
  assert.equal(
    validateEntsogHistoricalDateRange(
      { from: "2026-09-05", to: "2026-09-06" },
      "2026-09-05",
    ),
    "Future dates are not available.",
  );
});

test("computes local calendar date from local time", () => {
  const date = new Date(2026, 8, 5, 23, 59, 59);
  assert.equal(getTodayLocalDateIso(date), "2026-09-05");
});

test("date picker bounds expose today as max and From as To.min", () => {
  assert.deepEqual(getEntsogDatePickerBounds("2026-09-04", "2026-09-05"), {
    fromMax: "2026-09-05",
    toMax: "2026-09-05",
    toMin: "2026-09-04",
  });
});
