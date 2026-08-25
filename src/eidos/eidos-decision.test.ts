import assert from "node:assert/strict";
import { test } from "node:test";

import {
  analyzeClient,
  bucketRisk,
  deriveStatus,
  evaluateStrategies,
  explainDecision,
  explainScenarioShift,
  recommendStrategy,
  resolveClient,
  SCENARIO_ORDER,
  STRATEGIES,
  summarizePortfolio,
} from "@/eidos/lib/eidos-decision";
import {
  buildDecisionHistory,
  buildDecisionOutcomes,
  EIDOS_CLIENT_SEEDS,
  EIDOS_DEMO_CLIENT_ID,
  EIDOS_REFERENCE_CLIENT_ID,
  getClientSeed,
  HISTORY_MONTHS,
} from "@/eidos/data/synthetic-eidos-data";
import {
  formatEuroCompact,
  formatPercent,
  formatSignedPercent,
  STRATEGY_LABEL,
} from "@/eidos/lib/eidos-format";
import type { EidosScenario, ProcurementStrategy } from "@/eidos/types/eidos";

const VALID_STRATEGIES: ProcurementStrategy[] = ["BUY_20", "BUY_40", "WAIT"];

// --- Data integrity -----------------------------------------------------------

test("dataset contains 20 clients with valid, unique data", () => {
  assert.equal(EIDOS_CLIENT_SEEDS.length, 20);

  const ids = new Set<string>();
  for (const seed of EIDOS_CLIENT_SEEDS) {
    assert.ok(seed.name.length > 0, `client ${seed.id} has a name`);
    assert.ok(
      seed.annualConsumptionMwh > 0,
      `client ${seed.id} has positive consumption`,
    );
    assert.ok(
      VALID_STRATEGIES.includes(seed.currentStrategy),
      `client ${seed.id} has a valid current strategy`,
    );
    assert.ok(!ids.has(seed.id), `client id ${seed.id} is unique`);
    ids.add(seed.id);
  }
});

test("all recommended strategies are valid across all scenarios", () => {
  for (const seed of EIDOS_CLIENT_SEEDS) {
    for (const scenario of SCENARIO_ORDER) {
      const recommended = recommendStrategy(seed, scenario);
      assert.ok(VALID_STRATEGIES.includes(recommended));
      const evaluations = evaluateStrategies(seed, scenario);
      assert.equal(evaluations.length, STRATEGIES.length);
      assert.deepEqual(
        evaluations.map((item) => item.rank),
        [1, 2, 3],
      );
    }
  }
});

// --- Determinism --------------------------------------------------------------

test("scenario transformations are deterministic", () => {
  const seed = getClientSeed(EIDOS_REFERENCE_CLIENT_ID)!;
  for (const scenario of SCENARIO_ORDER) {
    assert.deepEqual(
      evaluateStrategies(seed, scenario),
      evaluateStrategies(seed, scenario),
    );
  }
});

test("history and outcomes are deterministic and coherent", () => {
  const seed = getClientSeed(EIDOS_DEMO_CLIENT_ID)!;

  const historyA = buildDecisionHistory(seed);
  const historyB = buildDecisionHistory(seed);
  assert.deepEqual(historyA, historyB);
  assert.equal(historyA.length, 12);
  assert.equal(HISTORY_MONTHS.length, 12);
  // Final observation matches the live contract.
  assert.equal(historyA.at(-1)!.strategy, seed.currentStrategy);

  const outcomesA = buildDecisionOutcomes(seed);
  const outcomesB = buildDecisionOutcomes(seed);
  assert.deepEqual(outcomesA, outcomesB);
  assert.equal(outcomesA.length, 4);
  for (const outcome of outcomesA) {
    const expectedActual = outcome.expectedCost * (1 + outcome.variancePct);
    assert.ok(Math.abs(outcome.actualCost - expectedActual) < 1e-6);
    if (outcome.variancePct <= -0.01) assert.equal(outcome.outcome, "FAVOURABLE");
    else if (outcome.variancePct >= 0.02)
      assert.equal(outcome.outcome, "UNFAVOURABLE");
    else assert.equal(outcome.outcome, "NEUTRAL");
  }
});

// --- Decision logic (deterministic expected values) ---------------------------

test("reference client recommendations match expected scenario outcomes", () => {
  const seed = getClientSeed(EIDOS_REFERENCE_CLIENT_ID)!;
  const expected: Record<string, ProcurementStrategy> = {
    BASELINE: "BUY_40",
    HIGH_PRICE: "BUY_40",
    LOW_PRICE: "WAIT",
    HIGH_DEMAND: "BUY_40",
  };
  for (const [scenario, strategy] of Object.entries(expected)) {
    assert.equal(
      recommendStrategy(seed, scenario as EidosScenario),
      strategy,
      `${scenario} should recommend ${strategy}`,
    );
  }
});

test("switching scenario can change the preferred strategy (demo client)", () => {
  const seed = getClientSeed(EIDOS_DEMO_CLIENT_ID)!;
  assert.equal(recommendStrategy(seed, "BASELINE"), "BUY_40");
  assert.equal(recommendStrategy(seed, "HIGH_PRICE"), "WAIT");
  assert.notEqual(
    recommendStrategy(seed, "BASELINE"),
    recommendStrategy(seed, "HIGH_PRICE"),
  );
});

// --- Cost/risk trade-off model (improved demo behaviour) ----------------------

test("baseline returns three distinct expected costs (demo client)", () => {
  const seed = getClientSeed(EIDOS_DEMO_CLIENT_ID)!;
  const evaluations = evaluateStrategies(seed, "BASELINE");
  const costs = evaluations.map((item) => item.expectedCost);
  assert.equal(new Set(costs).size, 3, "all three costs are distinct");

  // Under central assumptions more hedging lowers the expected bill.
  const byStrategy = new Map(
    evaluations.map((item) => [item.strategy, item.expectedCost]),
  );
  assert.ok(byStrategy.get("BUY_40")! < byStrategy.get("BUY_20")!);
  assert.ok(byStrategy.get("BUY_20")! < byStrategy.get("WAIT")!);
  // Gaps are material (visibly different for the demo), not rounding noise.
  const spread =
    (byStrategy.get("WAIT")! - byStrategy.get("BUY_40")!) /
    byStrategy.get("BUY_40")!;
  assert.ok(spread > 0.02, `expected a >2% spread, got ${spread}`);
});

test("ranking is deterministic and ordered by risk-adjusted cost", () => {
  for (const seed of EIDOS_CLIENT_SEEDS) {
    for (const scenario of SCENARIO_ORDER) {
      const evaluations = evaluateStrategies(seed, scenario);
      assert.deepEqual(
        evaluations.map((item) => item.rank),
        [1, 2, 3],
        `${seed.id} @ ${scenario} ranks are 1..3`,
      );
      const costs = evaluations.map((item) => item.riskAdjustedCost);
      const sorted = [...costs].sort((a, b) => a - b);
      assert.deepEqual(costs, sorted, `${seed.id} @ ${scenario} is sorted`);
    }
  }
});

test("high-price scenario changes expected costs versus baseline", () => {
  const seed = getClientSeed(EIDOS_DEMO_CLIENT_ID)!;
  const base = evaluateStrategies(seed, "BASELINE");
  const high = evaluateStrategies(seed, "HIGH_PRICE");
  for (const strategy of STRATEGIES) {
    const b = base.find((item) => item.strategy === strategy)!.expectedCost;
    const h = high.find((item) => item.strategy === strategy)!.expectedCost;
    assert.notEqual(h, b, `${strategy} cost moves under HIGH_PRICE`);
  }
});

test("low-price scenario changes expected costs versus baseline", () => {
  const seed = getClientSeed(EIDOS_DEMO_CLIENT_ID)!;
  const base = evaluateStrategies(seed, "BASELINE");
  const low = evaluateStrategies(seed, "LOW_PRICE");
  for (const strategy of STRATEGIES) {
    const b = base.find((item) => item.strategy === strategy)!.expectedCost;
    const l = low.find((item) => item.strategy === strategy)!.expectedCost;
    assert.notEqual(l, b, `${strategy} cost moves under LOW_PRICE`);
  }
  // Low prices make waiting genuinely competitive for the neutral client.
  const reference = getClientSeed(EIDOS_REFERENCE_CLIENT_ID)!;
  assert.equal(recommendStrategy(reference, "BASELINE"), "BUY_40");
  assert.equal(recommendStrategy(reference, "LOW_PRICE"), "WAIT");
});

test("at least one scenario changes the preferred strategy across the portfolio", () => {
  const changed = EIDOS_CLIENT_SEEDS.filter((seed) => {
    const base = recommendStrategy(seed, "BASELINE");
    return SCENARIO_ORDER.some(
      (scenario) =>
        scenario !== "BASELINE" && recommendStrategy(seed, scenario) !== base,
    );
  });
  assert.ok(
    changed.length >= 1,
    "at least one client flips preferred strategy on a scenario change",
  );

  // At least two distinct scenarios must flip a preferred strategy.
  const flippingScenarios = new Set<EidosScenario>();
  for (const seed of EIDOS_CLIENT_SEEDS) {
    const base = recommendStrategy(seed, "BASELINE");
    for (const scenario of SCENARIO_ORDER) {
      if (scenario === "BASELINE") continue;
      if (recommendStrategy(seed, scenario) !== base) {
        flippingScenarios.add(scenario);
      }
    }
  }
  assert.ok(
    flippingScenarios.size >= 2,
    `expected >=2 flipping scenarios, got ${[...flippingScenarios].join(", ")}`,
  );
});

test("explanation contains multiple data-derived factors for a changed decision", () => {
  const seed = getClientSeed(EIDOS_DEMO_CLIENT_ID)!;
  const analysis = analyzeClient(seed, "BASELINE");
  assert.equal(analysis.client.decisionChanged, true);

  const factors = explainDecision(seed, "BASELINE");
  assert.ok(
    factors.length >= 3 && factors.length <= 4,
    `expected 3-4 factors, got ${factors.length}`,
  );

  const allowed = new Set([
    "Contract coverage vs target",
    "Expected cost",
    "Downside risk",
    "Forecast confidence",
    "TTF price forecast",
    "Demand forecast",
  ]);
  for (const factor of factors) {
    assert.ok(allowed.has(factor.label), `unknown factor ${factor.label}`);
    assert.ok(Math.abs(factor.delta) >= 0.005, "factors are material");
  }
  // Coverage gap for a BUY_20 client is a real 20pp shortfall.
  const coverage = factors.find(
    (factor) => factor.label === "Contract coverage vs target",
  );
  assert.ok(coverage && Math.abs(coverage.delta + 0.2) < 1e-9);
});

test("re-running the same scenario produces identical results", () => {
  for (const seed of EIDOS_CLIENT_SEEDS) {
    for (const scenario of SCENARIO_ORDER) {
      assert.deepEqual(
        evaluateStrategies(seed, scenario),
        evaluateStrategies(seed, scenario),
      );
      assert.deepEqual(
        explainDecision(seed, scenario),
        explainDecision(seed, scenario),
      );
      assert.deepEqual(
        analyzeClient(seed, scenario),
        analyzeClient(seed, scenario),
      );
    }
  }
});

test("risk buckets and status derivation follow the rules", () => {
  assert.equal(bucketRisk(0.2), "LOW");
  assert.equal(bucketRisk(0.5), "MEDIUM");
  assert.equal(bucketRisk(0.7), "HIGH");
  assert.equal(deriveStatus("HIGH", true), "ACTION_REQUIRED");
  assert.equal(deriveStatus("HIGH", false), "HIGH_RISK");
  assert.equal(deriveStatus("MEDIUM", true), "STRATEGY_CHANGED");
  assert.equal(deriveStatus("LOW", false), "STABLE");
});

// --- Portfolio summary --------------------------------------------------------

test("BASELINE portfolio summary matches the demo distribution", () => {
  const clients = EIDOS_CLIENT_SEEDS.map((seed) =>
    resolveClient(seed, "BASELINE"),
  );
  const summary = summarizePortfolio(clients);
  assert.deepEqual(summary, {
    total: 20,
    stable: 12,
    strategyChanged: 4,
    highRisk: 2,
    actionRequired: 2,
    needsAttention: 8,
  });
});

test("decision analysis exposes recommended and current evaluations", () => {
  const seed = getClientSeed(EIDOS_DEMO_CLIENT_ID)!;
  const analysis = analyzeClient(seed, "BASELINE");
  assert.equal(analysis.recommended.strategy, "BUY_40");
  assert.equal(analysis.current.strategy, seed.currentStrategy);
  assert.equal(analysis.recommended.rank, 1);
});

// --- Explanations & formatters ------------------------------------------------

test("scenario shift explanation is structured (non-LLM)", () => {
  const factors = explainScenarioShift("BASELINE", "HIGH_PRICE");
  assert.ok(factors.length > 0);
  const price = factors.find((factor) => factor.label === "TTF price forecast");
  assert.ok(price && price.delta > 0 && price.supportsHedging);
});

test("formatters render human-readable strings", () => {
  assert.equal(STRATEGY_LABEL.BUY_20, "BUY 20%");
  assert.equal(formatPercent(0.82), "82%");
  assert.equal(formatSignedPercent(-0.08), "-8%");
  assert.equal(formatSignedPercent(0.05), "+5%");
  assert.match(formatEuroCompact(1_020_000), /€1\.0\d?M/);
});
