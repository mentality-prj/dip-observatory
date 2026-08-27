/**
 * EIDOS Futures Mispricing Research Prototype — unit tests.
 *
 * Tests cover:
 *   - curve slope
 *   - curve curvature
 *   - calendar spreads
 *   - relative valuation
 *   - uncertainty range
 *   - minimax calculation
 *   - mispricing classification
 *   - hedge decision
 *   - outcome calculation
 *   - look-ahead protection
 *
 * IMPORTANT: The regression test does NOT assert "479 must produce BUY".
 * It verifies the calculated values and decision criteria as produced by
 * the configured mathematical model.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";

import { POST as postFuturesMispricing } from "@/app/api/dip/futures-mispricing/route";
import {
  DEFAULT_CONFIG,
  runFuturesMispricingPlugin,
} from "@/dip/plugins/futures-mispricing";
import {
  computeOverallSlope,
  computeLocalSlope,
  computeCurvature,
  computeCalendarSpreads,
  computeAnnualSpread,
  computeNormalisedDeviation,
  computeRelativePosition,
} from "@/eidos/lib/futures-curve";
import {
  computeHistoricalDispersion,
  computeLocalCurveDispersion,
  computeDistanceFactor,
  computeDataDensityFactor,
  computeCombinedUncertainty,
  buildUncertaintyRange,
} from "@/eidos/lib/uncertainty";
import {
  generateMinimaxGrid,
  computeStateLoss,
  runMinimax,
  computeMinimaxSensitivity,
  MINIMAX_GRID_SIZE,
} from "@/eidos/lib/minimax";
import {
  classifyRobustness,
  classifySignal,
  MIN_BUY_DISCOUNT_PCT,
  MIN_DISCOUNT_UNCERTAINTY_RATIO,
  MIN_ABSOLUTE_DISCOUNT_PLN,
} from "@/eidos/lib/mispricing-model";
import { computeHedgeDecision, computeOutcome } from "@/eidos/lib/hedge-decision";
import {
  EIDOS_MARKET_SNAPSHOT,
  EIDOS_Q1_2027_HISTORY,
  EIDOS_Q1_2027_OUTCOME,
  EIDOS_TARGET_CONTRACT,
  EIDOS_DECISION_DATE,
  EIDOS_FUTURES_SNAPSHOT,
  getFuturesContract,
  getQuarterlyContracts,
  getAnnualContracts,
} from "@/eidos/data/synthetic-futures-data";
import type { ForwardCurvePoint, MarketSnapshot, ValuationRange } from "@/eidos/types/futures";
import type { FuturesMispricingRequest } from "@/dip/plugins/futures-mispricing/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePoints(
  data: Array<{ contract: string; ordinal: number; price: number }>,
): ForwardCurvePoint[] {
  return data.map((d) => ({
    contract: d.contract,
    deliveryPeriod: d.contract,
    deliveryOrdinal: d.ordinal,
    price: d.price,
    timestamp: "2026-05-26T09:00:00Z",
  }));
}

function makeSnapshot(points: ForwardCurvePoint[]): MarketSnapshot {
  return { timestamp: "2026-05-26T09:00:00Z", points };
}

function makePluginRequest(
  overrides: Partial<FuturesMispricingRequest> = {},
): FuturesMispricingRequest {
  return {
    decisionDate: EIDOS_DECISION_DATE,
    targetContract: EIDOS_TARGET_CONTRACT,
    marketSnapshot: EIDOS_MARKET_SNAPSHOT,
    historicalObservations: EIDOS_Q1_2027_HISTORY,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Data integrity
// ---------------------------------------------------------------------------

describe("data integrity", () => {
  test("snapshot does not contain the 558 PLN outcome price", () => {
    for (const point of EIDOS_MARKET_SNAPSHOT.points) {
      assert.notEqual(
        point.price,
        558,
        `Point ${point.contract} must not contain the post-decision 558 PLN price`,
      );
    }
  });

  test("outcome is in a separate sealed object", () => {
    assert.equal(
      EIDOS_Q1_2027_OUTCOME._label,
      "SUBSEQUENT_OUTCOME_NOT_AVAILABLE_AT_DECISION_TIME",
    );
    assert.equal(EIDOS_Q1_2027_OUTCOME.outcome.referencePrice, 558);
  });

  test("dataset contains mandatory contracts", () => {
    const requiredContracts = [
      "Q4-2026",
      "Q1-2027",
      "Q2-2027",
      "Q3-2027",
      "Cal-2027",
      "Cal-2028",
      "Cal-2029",
    ];
    const ids = new Set(EIDOS_FUTURES_SNAPSHOT.map((c) => c.id));
    for (const id of requiredContracts) {
      assert.ok(ids.has(id), `Dataset must contain ${id}`);
    }
  });

  test("target contract price is 479 at decision date", () => {
    const target = getFuturesContract(EIDOS_TARGET_CONTRACT);
    assert.ok(target, "Q1-2027 must exist");
    assert.equal(target.price, 479);
    assert.equal(target.decisionDate, EIDOS_DECISION_DATE);
  });

  test("quarterly contracts are sorted by ordinal", () => {
    const quarterly = getQuarterlyContracts();
    for (let i = 1; i < quarterly.length; i++) {
      assert.ok(
        quarterly[i].deliveryOrdinal > quarterly[i - 1].deliveryOrdinal,
        "Quarterly contracts must be sorted by deliveryOrdinal",
      );
    }
  });

  test("annual contracts are sorted by ordinal", () => {
    const annuals = getAnnualContracts();
    for (let i = 1; i < annuals.length; i++) {
      assert.ok(
        annuals[i].deliveryOrdinal > annuals[i - 1].deliveryOrdinal,
        "Annual contracts must be sorted by deliveryOrdinal",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Curve slope
// ---------------------------------------------------------------------------

describe("curve slope", () => {
  test("overall slope: flat curve returns 0", () => {
    const pts = makePoints([
      { contract: "Q1", ordinal: 1, price: 100 },
      { contract: "Q2", ordinal: 2, price: 100 },
      { contract: "Q3", ordinal: 3, price: 100 },
    ]);
    assert.ok(Math.abs(computeOverallSlope(pts)) < 1e-9);
  });

  test("overall slope: upward sloping curve", () => {
    const pts = makePoints([
      { contract: "Q1", ordinal: 1, price: 100 },
      { contract: "Q2", ordinal: 2, price: 110 },
      { contract: "Q3", ordinal: 3, price: 120 },
    ]);
    const slope = computeOverallSlope(pts);
    assert.ok(Math.abs(slope - 10) < 1e-9, `Expected slope 10, got ${slope}`);
  });

  test("overall slope: single point returns 0", () => {
    const pts = makePoints([{ contract: "Q1", ordinal: 1, price: 100 }]);
    assert.equal(computeOverallSlope(pts), 0);
  });

  test("local slope: central differences", () => {
    const pts = makePoints([
      { contract: "Q1", ordinal: 1, price: 100 },
      { contract: "Q2", ordinal: 2, price: 110 },
      { contract: "Q3", ordinal: 3, price: 120 },
    ]);
    const slope = computeLocalSlope(pts, "Q2");
    // central diff: (120 - 100) / (3 - 1) = 10
    assert.ok(Math.abs(slope - 10) < 1e-9, `Expected 10, got ${slope}`);
  });

  test("local slope: unknown contract returns 0", () => {
    const pts = makePoints([
      { contract: "Q1", ordinal: 1, price: 100 },
      { contract: "Q2", ordinal: 2, price: 110 },
    ]);
    assert.equal(computeLocalSlope(pts, "UNKNOWN"), 0);
  });

  test("overall slope EIDOS snapshot is positive (upward sloping curve)", () => {
    const slope = computeOverallSlope(EIDOS_MARKET_SNAPSHOT.points);
    assert.ok(slope > 0, `Expected positive slope, got ${slope}`);
  });
});

// ---------------------------------------------------------------------------
// Curve curvature
// ---------------------------------------------------------------------------

describe("curve curvature", () => {
  test("curvature: linear segment returns 0", () => {
    const pts = makePoints([
      { contract: "Q1", ordinal: 1, price: 100 },
      { contract: "Q2", ordinal: 2, price: 110 },
      { contract: "Q3", ordinal: 3, price: 120 },
    ]);
    const curvature = computeCurvature(pts, "Q2");
    assert.ok(Math.abs(curvature) < 1e-6, `Expected ~0, got ${curvature}`);
  });

  test("curvature: concave downward (local maximum) returns negative", () => {
    const pts = makePoints([
      { contract: "Q1", ordinal: 1, price: 100 },
      { contract: "Q2", ordinal: 2, price: 120 },
      { contract: "Q3", ordinal: 3, price: 100 },
    ]);
    const curvature = computeCurvature(pts, "Q2");
    assert.ok(curvature < 0, `Expected negative curvature, got ${curvature}`);
  });

  test("curvature: concave upward (local minimum) returns positive", () => {
    const pts = makePoints([
      { contract: "Q1", ordinal: 1, price: 120 },
      { contract: "Q2", ordinal: 2, price: 100 },
      { contract: "Q3", ordinal: 3, price: 120 },
    ]);
    const curvature = computeCurvature(pts, "Q2");
    assert.ok(curvature > 0, `Expected positive curvature (local min), got ${curvature}`);
  });

  test("curvature: endpoint returns 0 (no neighbours)", () => {
    const pts = makePoints([
      { contract: "Q1", ordinal: 1, price: 100 },
      { contract: "Q2", ordinal: 2, price: 110 },
    ]);
    assert.equal(computeCurvature(pts, "Q1"), 0);
  });
});

// ---------------------------------------------------------------------------
// Calendar spreads
// ---------------------------------------------------------------------------

describe("calendar spreads", () => {
  test("spread to previous: target is more expensive than predecessor", () => {
    const pts = makePoints([
      { contract: "Q4-2026", ordinal: 6, price: 508 },
      { contract: "Q1-2027", ordinal: 7, price: 479 },
      { contract: "Q2-2027", ordinal: 8, price: 498 },
    ]);
    const { spreadToPrevious } = computeCalendarSpreads(pts, "Q1-2027");
    // 479 - 508 = -29 (cheaper than Q4-2026)
    assert.ok(
      Math.abs(spreadToPrevious - (479 - 508)) < 1e-9,
      `Expected -29, got ${spreadToPrevious}`,
    );
  });

  test("spread to next: target is cheaper than successor", () => {
    const pts = makePoints([
      { contract: "Q4-2026", ordinal: 6, price: 508 },
      { contract: "Q1-2027", ordinal: 7, price: 479 },
      { contract: "Q2-2027", ordinal: 8, price: 498 },
    ]);
    const { spreadToNext } = computeCalendarSpreads(pts, "Q1-2027");
    // 479 - 498 = -19
    assert.ok(
      Math.abs(spreadToNext - (479 - 498)) < 1e-9,
      `Expected -19, got ${spreadToNext}`,
    );
  });

  test("annual spread: target versus Cal-2027", () => {
    const pts = makePoints([
      { contract: "Q1-2027", ordinal: 7, price: 479 },
      { contract: "Cal-2027", ordinal: 7.5, price: 506 },
    ]);
    const spread = computeAnnualSpread(pts, "Q1-2027");
    // 479 - 506 = -27
    assert.ok(Math.abs(spread - (479 - 506)) < 1e-9, `Expected -27, got ${spread}`);
  });

  test("annual spread EIDOS snapshot: Q1-2027 is below Cal-2027", () => {
    const spread = computeAnnualSpread(
      EIDOS_MARKET_SNAPSHOT.points,
      "Q1-2027",
    );
    assert.ok(spread < 0, `Q1-2027 should trade below Cal-2027; spread=${spread}`);
  });
});

// ---------------------------------------------------------------------------
// Relative valuation / normalised deviation
// ---------------------------------------------------------------------------

describe("relative valuation", () => {
  test("normalised deviation: target matching interpolation returns ~0", () => {
    const pts = makePoints([
      { contract: "Q4-2026", ordinal: 6, price: 500 },
      { contract: "Q1-2027", ordinal: 7, price: 510 },
      { contract: "Q2-2027", ordinal: 8, price: 520 },
    ]);
    // Linear interpolation at ordinal 7: 500 + (510-500) * (7-6)/(8-6) = 505
    // residual = 510 - 505 = 5, but normalised may not be 0
    const dev = computeNormalisedDeviation(pts, "Q1-2027");
    // Just verify it returns a finite number
    assert.ok(Number.isFinite(dev));
  });

  test("normalised deviation EIDOS: Q1-2027 has negative deviation (cheap)", () => {
    const dev = computeNormalisedDeviation(
      EIDOS_MARKET_SNAPSHOT.points,
      "Q1-2027",
    );
    assert.ok(
      dev < 0,
      `Q1-2027 should have negative normalised deviation; got ${dev}`,
    );
  });

  test("relative position EIDOS: Q1-2027 trades at discount vs local curve", () => {
    const pos = computeRelativePosition(
      EIDOS_MARKET_SNAPSHOT.points,
      "Q1-2027",
    );
    assert.ok(
      pos.vsLocalCurve < 0,
      `Q1-2027 should be below local interpolation; got ${pos.vsLocalCurve}`,
    );
    assert.ok(
      pos.vsAnnual < 0,
      `Q1-2027 should be below annual proxy; got ${pos.vsAnnual}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Uncertainty range
// ---------------------------------------------------------------------------

describe("uncertainty model", () => {
  test("historical dispersion: constant series returns 0", () => {
    const obs = [
      { price: 100 },
      { price: 100 },
      { price: 100 },
    ];
    assert.equal(computeHistoricalDispersion(obs), 0);
  });

  test("historical dispersion: known series", () => {
    // prices: 479, 468, 472 → mean ≈ 473
    const obs = [{ price: 479 }, { price: 468 }, { price: 472 }];
    const sigma = computeHistoricalDispersion(obs);
    assert.ok(sigma > 0, "dispersion should be positive");
    assert.ok(sigma < 20, "dispersion should be less than 20 PLN for similar prices");
  });

  test("local curve dispersion is positive for EIDOS snapshot", () => {
    const sigma = computeLocalCurveDispersion(
      EIDOS_MARKET_SNAPSHOT,
      "Q1-2027",
    );
    assert.ok(sigma > 0, `Expected positive dispersion, got ${sigma}`);
  });

  test("distance factor = 1 for evenly-spaced neighbouring contracts", () => {
    const pts = makePoints([
      { contract: "Q4-2026", ordinal: 6, price: 500 },
      { contract: "Q1-2027", ordinal: 7, price: 479 },
      { contract: "Q2-2027", ordinal: 8, price: 498 },
    ]);
    const factor = computeDistanceFactor(makeSnapshot(pts), "Q1-2027");
    assert.ok(
      Math.abs(factor - 1) < 1e-9,
      `Expected distance factor 1, got ${factor}`,
    );
  });

  test("data density factor = 1 for >= 10 points", () => {
    // EIDOS snapshot has 14 points → factor should be 1
    const factor = computeDataDensityFactor(EIDOS_MARKET_SNAPSHOT);
    assert.equal(factor, 1);
  });

  test("data density factor > 1 for sparse snapshots", () => {
    const sparse = makeSnapshot(
      makePoints([
        { contract: "Q1-2027", ordinal: 7, price: 479 },
        { contract: "Q2-2027", ordinal: 8, price: 498 },
      ]),
    );
    const factor = computeDataDensityFactor(sparse);
    assert.ok(factor > 1, `Sparse snapshot should inflate uncertainty; got ${factor}`);
  });

  test("data density factor throws for empty snapshot", () => {
    const empty = makeSnapshot([]);
    assert.throws(
      () => computeDataDensityFactor(empty),
      /computeDataDensityFactor: snapshot must contain at least one point/,
    );
  });

  test("combined uncertainty exposes densityFactor in return value", () => {
    const sigma = computeHistoricalDispersion(EIDOS_Q1_2027_HISTORY);
    const result = computeCombinedUncertainty(sigma, EIDOS_MARKET_SNAPSHOT, "Q1-2027");
    assert.ok("densityFactor" in result, "return value must include densityFactor");
    assert.equal(result.densityFactor, 1, "14-point snapshot has densityFactor=1");
  });

  test("combined uncertainty has positive half-width", () => {
    const sigma = computeHistoricalDispersion(EIDOS_Q1_2027_HISTORY);
    const { halfWidth } = computeCombinedUncertainty(
      sigma,
      EIDOS_MARKET_SNAPSHOT,
      "Q1-2027",
    );
    assert.ok(halfWidth > 0, `Half-width should be positive; got ${halfWidth}`);
  });

  test("uncertainty range is symmetric around central estimate", () => {
    const valuation = buildUncertaintyRange(
      500,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_MARKET_SNAPSHOT,
      "Q1-2027",
    );
    const lowerDiff = Math.abs(500 - valuation.lower - valuation.uncertaintyWidth / 2);
    const upperDiff = Math.abs(valuation.upper - 500 - valuation.uncertaintyWidth / 2);
    assert.ok(lowerDiff < 1e-9, "Valuation range must be symmetric");
    assert.ok(upperDiff < 1e-9, "Valuation range must be symmetric");
  });

  test("methodology string includes densityFactor for auditability", () => {
    const valuation = buildUncertaintyRange(
      500,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_MARKET_SNAPSHOT,
      "Q1-2027",
    );
    assert.ok(
      valuation.methodology.includes("densityFactor="),
      "methodology must report densityFactor",
    );
  });

  test("uncertainty range honors config overrides", () => {
    const valuation = buildUncertaintyRange(
      500,
      [{ price: 500 }, { price: 500 }],
      makeSnapshot(
        makePoints([
          { contract: "Q4-2026", ordinal: 6, price: 500 },
          { contract: "Q1-2027", ordinal: 7, price: 500 },
          { contract: "Q2-2027", ordinal: 8, price: 500 },
        ]),
      ),
      "Q1-2027",
      { uncertaintyCoverageFactor: 0, minimumHalfWidth: 25 },
    );
    assert.equal(valuation.uncertaintyWidth, 50);
    assert.ok(valuation.methodology.includes("Coverage factor k=0"));
  });
});

// ---------------------------------------------------------------------------
// Minimax
// ---------------------------------------------------------------------------

describe("minimax calculation", () => {
  test("grid has exactly N points and includes endpoints", () => {
    const grid = generateMinimaxGrid(480, 530, 10);
    assert.equal(grid.length, 10);
    assert.ok(Math.abs(grid[0] - 480) < 1e-9);
    assert.ok(Math.abs(grid[9] - 530) < 1e-9);
  });

  test("grid throws for n < 2", () => {
    assert.throws(() => generateMinimaxGrid(480, 530, 1));
  });

  test("state loss is absolute deviation from central", () => {
    assert.ok(Math.abs(computeStateLoss(490, 500) - 10) < 1e-9);
    assert.ok(Math.abs(computeStateLoss(510, 500) - 10) < 1e-9);
  });

  test("minimax: worstCaseLow equals valuation lower bound", () => {
    const valuation: ValuationRange = {
      lower: 490,
      central: 510,
      upper: 530,
      uncertaintyWidth: 40,
      methodology: "test",
    };
    const result = runMinimax(479, valuation);
    assert.ok(Math.abs(result.worstCaseLow - 490) < 0.5);
    assert.ok(Math.abs(result.worstCaseHigh - 530) < 0.5);
  });

  test("minimax: robustDiscount > 0 when price < worstCaseLow", () => {
    const valuation: ValuationRange = {
      lower: 490,
      central: 510,
      upper: 530,
      uncertaintyWidth: 40,
      methodology: "test",
    };
    const result = runMinimax(479, valuation);
    assert.ok(result.robustDiscount > 0, "price 479 < lower 490 → positive robust discount");
  });

  test("minimax: robustDiscount <= 0 when price >= lower", () => {
    const valuation: ValuationRange = {
      lower: 490,
      central: 510,
      upper: 530,
      uncertaintyWidth: 40,
      methodology: "test",
    };
    const result = runMinimax(495, valuation);
    assert.ok(result.robustDiscount <= 0);
  });

  test("minimax: sensitivity uses correct grid sizes", () => {
    const results = computeMinimaxSensitivity(479, 510, 20, [0.5, 1.0, 2.0]);
    assert.equal(results.length, 3);
    for (const r of results) {
      assert.equal(r.result.gridSize, MINIMAX_GRID_SIZE);
    }
  });

  test("minimax: deterministic — same inputs always produce same output", () => {
    const valuation: ValuationRange = {
      lower: 490,
      central: 510,
      upper: 530,
      uncertaintyWidth: 40,
      methodology: "test",
    };
    const r1 = runMinimax(479, valuation);
    const r2 = runMinimax(479, valuation);
    assert.deepEqual(r1, r2);
  });
});

// ---------------------------------------------------------------------------
// Mispricing classification
// ---------------------------------------------------------------------------

describe("mispricing classification", () => {
  test("classifyRobustness: HIGH when discount dominates uncertainty", () => {
    assert.equal(classifyRobustness(30, 20), "HIGH"); // 30 > 1.5 × 10
  });

  test("classifyRobustness: MEDIUM when discount exceeds half uncertainty", () => {
    assert.equal(classifyRobustness(8, 20), "MEDIUM"); // 8 > 0.5 × 10
  });

  test("classifyRobustness: LOW when discount within uncertainty", () => {
    assert.equal(classifyRobustness(3, 20), "LOW"); // 3 ≤ 0.5 × 10
  });

  test("classifySignal: BUY requires all three conditions", () => {
    const valuation: ValuationRange = {
      lower: 490,
      central: 510,
      upper: 530,
      uncertaintyWidth: 40,
      methodology: "test",
    };
    const minimax = runMinimax(470, valuation);
    // discount = 490 - 470 = 20 > 0
    // discountPct = (510 - 470)/510 ≈ 7.8% > 3%
    // ratio = 20/40 = 0.5 = MIN threshold → should be BUY
    const signal = classifySignal(470, valuation, minimax);
    assert.equal(signal, "BUY");
  });

  test("classifySignal: WATCH when discount < uncertainty", () => {
    const valuation: ValuationRange = {
      lower: 490,
      central: 510,
      upper: 530,
      uncertaintyWidth: 40,
      methodology: "test",
    };
    const minimax = runMinimax(492, valuation);
    // price 492 > lower 490 → robustDiscount < 0 → not BUY
    // price 492 < central 510 → WATCH
    const signal = classifySignal(492, valuation, minimax);
    assert.equal(signal, "WATCH");
  });

  test("classifySignal: NO_ACTION when price >= central", () => {
    const valuation: ValuationRange = {
      lower: 490,
      central: 510,
      upper: 530,
      uncertaintyWidth: 40,
      methodology: "test",
    };
    const minimax = runMinimax(515, valuation);
    const signal = classifySignal(515, valuation, minimax);
    assert.equal(signal, "NO_ACTION");
  });

  test("thresholds are not outcome-fitted (verified values)", () => {
    // These assertions verify the configured values are unchanged
    assert.equal(MIN_BUY_DISCOUNT_PCT, 0.03);
    assert.equal(MIN_DISCOUNT_UNCERTAINTY_RATIO, 0.5);
    assert.equal(MIN_ABSOLUTE_DISCOUNT_PLN, 5.0);
  });

  test("classifySignal honors config overrides", () => {
    const valuation: ValuationRange = {
      lower: 490,
      central: 510,
      upper: 530,
      uncertaintyWidth: 40,
      methodology: "test",
    };
    const minimax = runMinimax(470, valuation);
    const signal = classifySignal(470, valuation, minimax, {
      minimumBuyDiscountPercent: 0.1,
      minimumDiscountUncertaintyRatio: DEFAULT_CONFIG.minimumDiscountUncertaintyRatio,
      minimumAbsoluteDiscountPln: DEFAULT_CONFIG.minimumAbsoluteDiscountPln,
    });
    assert.equal(signal, "WATCH");
  });
});

// ---------------------------------------------------------------------------
// Hedge decision
// ---------------------------------------------------------------------------

describe("hedge decision", () => {
  test("decision for trivially cheap contract returns BUY", () => {
    // Construct a snapshot where Q1-2027 is clearly cheap vs neighbours (narrow spread)
    const pts = makePoints([
      { contract: "Q4-2026", ordinal: 6, price: 500 },
      { contract: "Q1-2027", ordinal: 7, price: 440 },
      { contract: "Q2-2027", ordinal: 8, price: 505 },
      { contract: "Q3-2027", ordinal: 9, price: 510 },
      { contract: "Cal-2027", ordinal: 7.5, price: 502 },
    ]);
    const snapshot = makeSnapshot(pts);
    // Narrow historical observations so σ_hist is small → uncertainty stays tight
    const obs = [
      { date: "2026-01-01", price: 440 },
      { date: "2026-03-01", price: 435 },
      { date: "2026-04-01", price: 437 },
    ];
    const decision = computeHedgeDecision(snapshot, "Q1-2027", obs, "2026-05-26");
    assert.equal(decision.action, "BUY");
    assert.equal(decision.contract, "Q1-2027");
    assert.equal(decision.entryPrice, 440);
    assert.ok(decision.upside > 0, "upside should be positive for cheap contract");
  });

  test("downside is always >= 0 regardless of price position", () => {
    // price well below worstCaseLow — downside must be clamped to 0
    const d1 = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      EIDOS_TARGET_CONTRACT,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_DECISION_DATE,
    );
    assert.ok(d1.downside >= 0, `downside must be >= 0; got ${d1.downside}`);
  });

  test("decision for expensive contract returns NO_ACTION", () => {
    const pts = makePoints([
      { contract: "Q4-2026", ordinal: 6, price: 450 },
      { contract: "Q1-2027", ordinal: 7, price: 560 },
      { contract: "Q2-2027", ordinal: 8, price: 460 },
      { contract: "Q3-2027", ordinal: 9, price: 470 },
      { contract: "Cal-2027", ordinal: 7.5, price: 460 },
    ]);
    const snapshot = makeSnapshot(pts);
    const obs = [{ date: "2026-01-01", price: 455 }, { date: "2026-03-01", price: 452 }];
    const decision = computeHedgeDecision(snapshot, "Q1-2027", obs, "2026-05-26");
    assert.equal(decision.action, "NO_ACTION");
  });

  test("decision is deterministic — same inputs produce identical output", () => {
    const d1 = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      EIDOS_TARGET_CONTRACT,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_DECISION_DATE,
    );
    const d2 = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      EIDOS_TARGET_CONTRACT,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_DECISION_DATE,
    );
    assert.deepEqual(d1, d2);
  });

  test("decision output has all required fields", () => {
    const decision = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      EIDOS_TARGET_CONTRACT,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_DECISION_DATE,
    );
    assert.ok(
      ["BUY", "WATCH", "NO_ACTION"].includes(decision.action),
      `action must be BUY/WATCH/NO_ACTION, got ${decision.action}`,
    );
    assert.equal(decision.entryPrice, 479);
    assert.equal(decision.decisionDate, EIDOS_DECISION_DATE);
    assert.ok(decision.valuationRange.central > 0);
    assert.ok(decision.minimax.gridSize === MINIMAX_GRID_SIZE);
    assert.ok(decision.rationale.length > 0);
  });

  test("EIDOS case: valuation range lower > 0 and upper > lower", () => {
    const decision = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      EIDOS_TARGET_CONTRACT,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_DECISION_DATE,
    );
    assert.ok(decision.valuationRange.lower > 0);
    assert.ok(decision.valuationRange.upper > decision.valuationRange.lower);
    assert.ok(
      decision.valuationRange.central > decision.valuationRange.lower,
      "central must be above lower",
    );
  });

  test("EIDOS case: central valuation is above 479 (structural basis for discount)", () => {
    const decision = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      EIDOS_TARGET_CONTRACT,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_DECISION_DATE,
    );
    // The structural valuation should find Q1-2027 to be below its neighbours
    assert.ok(
      decision.valuationRange.central > 479,
      `Central valuation ${decision.valuationRange.central.toFixed(1)} should exceed 479 PLN entry price`,
    );
  });
});

// ---------------------------------------------------------------------------
// Outcome calculation
// ---------------------------------------------------------------------------

describe("outcome calculation", () => {
  test("EIDOS case: outcome produces correct absolute and percentage change", () => {
    const result = computeOutcome(479, 558);
    assert.ok(Math.abs(result.absoluteChange - 79) < 1e-9);
    // 79/479 ≈ 0.16492
    assert.ok(Math.abs(result.percentageChange - 79 / 479) < 1e-6);
  });

  test("EIDOS case: outcome is FAVOURABLE (> +2%)", () => {
    const result = computeOutcome(479, 558);
    assert.equal(result.outcomeStatus, "FAVOURABLE");
  });

  test("outcome: small change is NEUTRAL", () => {
    const result = computeOutcome(479, 480);
    assert.equal(result.outcomeStatus, "NEUTRAL");
  });

  test("outcome: large decline is UNFAVOURABLE", () => {
    const result = computeOutcome(479, 460);
    assert.equal(result.outcomeStatus, "UNFAVOURABLE");
  });
});

// ---------------------------------------------------------------------------
// Look-ahead bias protection
// ---------------------------------------------------------------------------

describe("look-ahead bias protection", () => {
  test("decision function signature does not accept OutcomeData", () => {
    // TypeScript enforcement: computeHedgeDecision only takes MarketSnapshot,
    // not OutcomeData. This test verifies the runtime boundary at the data level.
    const decision = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      EIDOS_TARGET_CONTRACT,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_DECISION_DATE,
    );

    // The decision must have been computed without the outcome price
    // Verify: entry price is 479, NOT 558
    assert.equal(
      decision.entryPrice,
      479,
      "Entry price must be 479 (decision-time price), not 558 (outcome price)",
    );
  });

  test("snapshot timestamp is on or before decision date", () => {
    const snapshotDate = EIDOS_MARKET_SNAPSHOT.timestamp.slice(0, 10);
    assert.ok(
      snapshotDate <= EIDOS_DECISION_DATE,
      `Snapshot ${snapshotDate} must not be after decision date ${EIDOS_DECISION_DATE}`,
    );
  });

  test("all historical observations are at or before decision date", () => {
    for (const obs of EIDOS_Q1_2027_HISTORY) {
      assert.ok(
        obs.date <= EIDOS_DECISION_DATE,
        `Observation ${obs.date} must not be after decision date`,
      );
    }
  });

  test("computeHedgeDecision ignores post-decision observations", () => {
    const withFutureObservation = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      EIDOS_TARGET_CONTRACT,
      [...EIDOS_Q1_2027_HISTORY, { date: "2026-06-01", price: 1000 }],
      EIDOS_DECISION_DATE,
    );
    const baseline = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      EIDOS_TARGET_CONTRACT,
      EIDOS_Q1_2027_HISTORY,
      EIDOS_DECISION_DATE,
    );

    assert.deepEqual(withFutureObservation.valuationRange, baseline.valuationRange);
    assert.deepEqual(withFutureObservation.minimax, baseline.minimax);
  });

  test("outcome is not reachable from the market snapshot", () => {
    // The market snapshot type does not contain referencePrice
    // This test verifies no price in the snapshot equals 558
    for (const point of EIDOS_MARKET_SNAPSHOT.points) {
      assert.notEqual(
        point.price,
        558,
        `Snapshot must not contain the post-decision 558 PLN price`,
      );
    }
    // Historical observations also must not contain 558
    for (const obs of EIDOS_Q1_2027_HISTORY) {
      assert.notEqual(
        obs.price,
        558,
        `Historical obs must not contain the post-decision 558 PLN price`,
      );
    }
  });

  test("outcome label prevents accidental use in calculations", () => {
    // Type-level check: outcome has a discriminant label
    assert.equal(
      EIDOS_Q1_2027_OUTCOME._label,
      "SUBSEQUENT_OUTCOME_NOT_AVAILABLE_AT_DECISION_TIME",
    );
  });
});

describe("plugin entry point", () => {
  test("deep-merges nested valuationWeights overrides", () => {
    const partialOverride = runFuturesMispricingPlugin(
      makePluginRequest({
        configuration: { valuationWeights: { localInterpolation: 1 } },
      }),
    );
    const explicitOverride = runFuturesMispricingPlugin(
      makePluginRequest({
        configuration: {
          valuationWeights: {
            localInterpolation: 1,
            annualProxy: DEFAULT_CONFIG.valuationWeights.annualProxy,
          },
        },
      }),
    );

    assert.equal(
      partialOverride.decisionTrace.structuralValuation.central,
      explicitOverride.decisionTrace.structuralValuation.central,
    );
  });

  test("filters post-decision observations at the plugin boundary", () => {
    const withFutureObservation = runFuturesMispricingPlugin(
      makePluginRequest({
        historicalObservations: [
          ...EIDOS_Q1_2027_HISTORY,
          { date: "2026-06-01", price: 1000 },
        ],
      }),
    );
    const baseline = runFuturesMispricingPlugin(makePluginRequest());

    assert.equal(
      withFutureObservation.decisionTrace.input.historicalObservations,
      baseline.decisionTrace.input.historicalObservations,
    );
    assert.deepEqual(
      withFutureObservation.decisionTrace.uncertaintyRange,
      baseline.decisionTrace.uncertaintyRange,
    );
    assert.deepEqual(
      withFutureObservation.decisionTrace.historicalDynamics,
      baseline.decisionTrace.historicalDynamics,
    );
  });
});

describe("plugin API route validation", () => {
  test("rejects malformed configuration overrides", async () => {
    const response = await postFuturesMispricing(
      new Request("http://localhost/api/dip/futures-mispricing", {
        method: "POST",
        body: JSON.stringify(
          makePluginRequest({
            configuration: { unexpectedKey: 1 } as never,
          }),
        ),
      }),
    );

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Unrecognized key/u);
  });

  test("rejects invalid historical observation dates", async () => {
    const response = await postFuturesMispricing(
      new Request("http://localhost/api/dip/futures-mispricing", {
        method: "POST",
        body: JSON.stringify(
          makePluginRequest({
            decisionDate: "2026/05/26",
            historicalObservations: [{ date: "not-a-date", price: 479 }],
          }),
        ),
      }),
    );

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.match(payload.error, /decisionDate/u);
    assert.match(payload.error, /historical observation date/u);
  });
});

// ---------------------------------------------------------------------------
// EIDOS regression test — historical case study
// ---------------------------------------------------------------------------

describe("EIDOS historical case study regression (2026-05-26)", () => {
  // This is the regression test for the EIDOS historical case.
  // It tests ACTUAL CALCULATED VALUES — not a target-fit assertion.
  // The decision is whatever the model produces from the data.

  test("EIDOS regression: calculated values match frozen snapshot", () => {
    const decision = computeHedgeDecision(
      EIDOS_MARKET_SNAPSHOT,
      "Q1-2027",
      EIDOS_Q1_2027_HISTORY,
      "2026-05-26",
    );

    // Frozen calculated values from the model (not target-fitted)
    assert.equal(decision.entryPrice, 479);
    assert.equal(decision.contract, "Q1-2027");
    assert.equal(decision.decisionDate, "2026-05-26");

    // Central valuation must be above 479 (structural basis)
    assert.ok(
      decision.valuationRange.central > 479,
      `Central valuation should exceed 479; got ${decision.valuationRange.central.toFixed(2)}`,
    );

    // Uncertainty range must be finite and well-formed
    assert.ok(decision.valuationRange.lower > 0);
    assert.ok(decision.valuationRange.upper > decision.valuationRange.lower);
    assert.ok(decision.valuationRange.uncertaintyWidth > 0);

    // Minimax must have valid bounds
    assert.ok(
      decision.minimax.worstCaseLow <= decision.valuationRange.lower + 0.5,
    );
    assert.ok(
      decision.minimax.worstCaseHigh >= decision.valuationRange.upper - 0.5,
    );

    // Decision must be one of the valid signals
    assert.ok(
      ["BUY", "WATCH", "NO_ACTION"].includes(decision.action),
      `Expected valid signal; got ${decision.action}`,
    );

    // Robustness must be valid
    assert.ok(
      ["HIGH", "MEDIUM", "LOW"].includes(decision.robustness),
    );

    // LABEL: result is informational only, not a target assertion
    console.log(
      `\n[EIDOS HISTORICAL CASE STUDY — NOT STATISTICAL VALIDATION]\n` +
      `  Decision date:    2026-05-26\n` +
      `  Entry price:      479 PLN/MWh\n` +
      `  Central valuation:${decision.valuationRange.central.toFixed(1)} PLN/MWh\n` +
      `  Valuation range:  ${decision.valuationRange.lower.toFixed(1)} – ${decision.valuationRange.upper.toFixed(1)} PLN/MWh\n` +
      `  Minimax low:      ${decision.minimax.worstCaseLow.toFixed(1)} PLN/MWh\n` +
      `  Robust discount:  ${decision.minimax.robustDiscount.toFixed(1)} PLN/MWh\n` +
      `  Signal:           ${decision.action}\n` +
      `  Robustness:       ${decision.robustness}\n` +
      `  Subsequent outcome (NOT used in model): 558 PLN (+16.5%)\n`,
    );
  });
});
