import assert from "node:assert/strict";
import { test } from "node:test";

import {
  analyzeClient,
  bucketRisk,
  deriveStatus,
  evaluateStrategies,
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
