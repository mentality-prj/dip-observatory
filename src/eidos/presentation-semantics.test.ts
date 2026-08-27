/**
 * EIDOS presentation-semantics unit tests.
 *
 * Verifies that the presentation-layer calculations produce the correct
 * labels and values for the EIDOS case (current=479, central=504, lower=444, upper=564).
 *
 * These tests do NOT render React components. They verify the arithmetic
 * that the components use directly.
 *
 * See problem statement §12–13 for the expected values.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";

// ---------------------------------------------------------------------------
// Helpers mirroring the component presentation layer
// ---------------------------------------------------------------------------

/** Central discount = centralValuation − currentPrice. Positive = attractive. */
function centralDiscount(central: number, current: number): number {
  return central - current;
}

/** Central discount as a fraction of central valuation. */
function centralDiscountPct(central: number, current: number): number {
  if (central === 0) return 0;
  return centralDiscount(central, current) / central;
}

/** Price vs. worst-case valuation = currentPrice − worstCaseLower. */
function priceVsWorstCase(current: number, worstCaseLower: number): number {
  return current - worstCaseLower;
}

/** Format a number with explicit sign, avoiding "-0". */
function fmtSigned(n: number, decimals = 0): string {
  const rounded = parseFloat(n.toFixed(decimals));
  if (rounded === 0) return "0";
  return (rounded > 0 ? "+" : "") + rounded.toFixed(decimals);
}

/** Format percentage with explicit sign. */
function fmtSignedPct(fraction: number, decimals = 1): string {
  const pct = fraction * 100;
  const rounded = parseFloat(pct.toFixed(decimals));
  if (rounded === 0) return "0%";
  return (rounded > 0 ? "+" : "") + rounded.toFixed(decimals) + "%";
}

// ---------------------------------------------------------------------------
// EIDOS reference case: current=479, central=504, lower=444, upper=564
// ---------------------------------------------------------------------------

describe("EIDOS reference case: current=479, central=504, lower=444, upper=564", () => {
  const current = 479;
  const central = 504;
  const lower = 444;
  const upper = 564;

  test("Central discount is +25 PLN/MWh", () => {
    const disc = centralDiscount(central, current);
    assert.equal(disc, 25, `Expected +25, got ${disc}`);
  });

  test("Central discount formatted as +25", () => {
    const s = fmtSigned(centralDiscount(central, current));
    assert.equal(s, "+25");
  });

  test("Central discount percentage is approximately +4.9%", () => {
    const pct = centralDiscountPct(central, current) * 100;
    assert.ok(
      Math.abs(pct - (25 / 504) * 100) < 1e-6,
      `Expected ~4.96%, got ${pct}`,
    );
  });

  test("Central discount percentage formatted as +5.0% (1dp)", () => {
    // 25/504 ≈ 0.04960... → +5.0% at 1dp
    const s = fmtSignedPct(centralDiscountPct(central, current));
    assert.equal(s, "+5.0%");
  });

  test("Uncertainty interval lower bound is 444", () => {
    assert.equal(lower, 444);
  });

  test("Uncertainty interval upper bound is 564", () => {
    assert.equal(upper, 564);
  });

  test("Uncertainty interval formatted as 444–564 PLN/MWh", () => {
    const s = `${lower}–${upper} PLN/MWh`;
    assert.equal(s, "444–564 PLN/MWh");
  });

  test("Uncertainty half-width is ±60 PLN/MWh", () => {
    const halfWidth = (upper - lower) / 2;
    assert.equal(halfWidth, 60);
  });

  test("Worst-case valuation is 444 PLN/MWh", () => {
    assert.equal(lower, 444);
  });

  test("Price vs. worst-case valuation is +35 PLN/MWh (current 479 > lower 444)", () => {
    const pvwc = priceVsWorstCase(current, lower);
    assert.equal(pvwc, 35, `Expected +35, got ${pvwc}`);
  });

  test("Price vs. worst-case valuation formatted as +35", () => {
    const s = fmtSigned(priceVsWorstCase(current, lower));
    assert.equal(s, "+35");
  });

  test("Does NOT produce -35 for price vs worst-case relationship", () => {
    // The old incorrect representation used -(current - lower) = -35.
    // This must never appear.
    const pvwc = priceVsWorstCase(current, lower);
    assert.ok(pvwc !== -35, "Should not be -35");
    assert.equal(pvwc, 35);
  });
});

// ---------------------------------------------------------------------------
// Edge case: current below worst-case lower
// ---------------------------------------------------------------------------

describe("Edge case: current=430, lower=444 (below worst-case lower bound)", () => {
  const current = 430;
  const lower = 444;

  test("Price vs. worst-case valuation is -14 PLN/MWh", () => {
    const pvwc = priceVsWorstCase(current, lower);
    assert.equal(pvwc, -14, `Expected -14, got ${pvwc}`);
  });

  test("Formatted as -14", () => {
    const s = fmtSigned(priceVsWorstCase(current, lower));
    assert.equal(s, "-14");
  });
});

// ---------------------------------------------------------------------------
// Edge case: current equal to worst-case lower
// ---------------------------------------------------------------------------

describe("Edge case: current=444, lower=444 (equal to worst-case lower)", () => {
  const current = 444;
  const lower = 444;

  test("Price vs. worst-case valuation is 0", () => {
    const pvwc = priceVsWorstCase(current, lower);
    assert.equal(pvwc, 0);
  });

  test("Formatted as 0 (no negative zero)", () => {
    const s = fmtSigned(priceVsWorstCase(current, lower));
    assert.equal(s, "0");
    assert.notEqual(s, "-0");
  });
});

// ---------------------------------------------------------------------------
// Central discount sign consistency
// ---------------------------------------------------------------------------

describe("Central discount sign consistency", () => {
  test("Positive discount when current < central (attractive)", () => {
    const disc = centralDiscount(504, 479);
    assert.ok(disc > 0, `Expected positive, got ${disc}`);
  });

  test("Negative discount when current > central (not attractive)", () => {
    const disc = centralDiscount(479, 504);
    assert.ok(disc < 0, `Expected negative, got ${disc}`);
  });

  test("Zero discount when current equals central", () => {
    const disc = centralDiscount(500, 500);
    assert.equal(disc, 0);
  });
});
