/**
 * EIDOS Decision Observatory — synthetic dataset.
 *
 * Deterministic, seeded, prototype-only data. Approximately 20 clients, each
 * with 12 months of history and tracked outcomes. There is NO runtime
 * randomness: all "random-looking" values come from a fixed per-client seed via
 * a small pure PRNG. This data does not represent any real client, market or
 * EIDOS system.
 */

import {
  analyzeClient,
  bucketRisk,
  evaluateStrategies,
  recommendStrategy,
  SCENARIO_ORDER,
} from "@/eidos/lib/eidos-decision";
import type {
  DecisionHistoryEntry,
  DecisionOutcome,
  EidosClientSeed,
  EidosScenario,
  OutcomeStatus,
  ProcurementStrategy,
} from "@/eidos/types/eidos";

/** The client used by the deterministic demo walkthrough. */
export const EIDOS_DEMO_CLIENT_ID = "eidos-03";
/** A neutral reference client with the canonical scenario behaviour. */
export const EIDOS_REFERENCE_CLIENT_ID = "eidos-04";

/**
 * The 20 authored client seeds. Archetypes are chosen so that under BASELINE the
 * portfolio resolves to exactly: 12 STABLE, 4 STRATEGY_CHANGED, 2 HIGH_RISK,
 * 2 ACTION_REQUIRED (verified by tests).
 */
export const EIDOS_CLIENT_SEEDS: EidosClientSeed[] = [
  // --- ACTION REQUIRED: exposed (WAIT) and the model wants to hedge ---
  seed("eidos-01", "Northwind Foods", 84000, "WAIT", { spotBias: 0 }),
  seed("eidos-02", "Rhine Metalworks", 61000, "WAIT", { spotBias: 0 }),
  // --- STRATEGY CHANGED (demo client + three peers) ---
  seed("eidos-03", "Helios Ceramics", 18000, "BUY_20", { forwardPremium: 400 }),
  seed("eidos-04", "Adriatic Textiles", 12000, "BUY_20", {}),
  seed("eidos-05", "Baltic Paper Mills", 44000, "BUY_20", {}),
  seed("eidos-06", "Carpathian Glass", 27000, "BUY_20", {}),
  // --- HIGH RISK: exposed (WAIT) but local spot keeps WAIT preferred ---
  seed("eidos-07", "Vega Data Centres", 95000, "WAIT", { spotBias: -28 }),
  seed("eidos-08", "Aegean Cold Chain", 33000, "WAIT", { spotBias: -28 }),
  // --- STABLE: already at the 40% target ---
  seed("eidos-09", "Orion Breweries", 22000, "BUY_40", {}),
  seed("eidos-10", "Danube Logistics", 15000, "BUY_40", { baseRisk: 0.1 }),
  seed("eidos-11", "Nordic Steel", 78000, "BUY_40", {}),
  seed("eidos-12", "Iberia Chemicals", 54000, "BUY_40", { baseRisk: 0.2 }),
  seed("eidos-13", "Alpine Dairy", 9000, "BUY_40", {}),
  seed("eidos-14", "Saxon Automotive", 67000, "BUY_40", {}),
  seed("eidos-15", "Ligurian Plastics", 31000, "BUY_40", { baseRisk: 0.15 }),
  seed("eidos-16", "Baltic Shipyards", 48000, "BUY_40", {}),
  seed("eidos-17", "Tatra Pharma", 13000, "BUY_40", {}),
  seed("eidos-18", "Pannonia Cement", 72000, "BUY_40", { baseRisk: 0.05 }),
  seed("eidos-19", "Bohemia Electronics", 26000, "BUY_40", {}),
  seed("eidos-20", "Gdansk Refinery", 90000, "BUY_40", {}),
];

function seed(
  id: string,
  name: string,
  annualConsumptionMwh: number,
  currentStrategy: ProcurementStrategy,
  overrides: Partial<EidosClientSeed>,
): EidosClientSeed {
  return {
    id,
    name,
    annualConsumptionMwh,
    currentStrategy,
    riskAversion: 0.35,
    spotBias: 0,
    forwardPremium: 0,
    baseRisk: 0,
    // Stable, human-independent seed derived from the id.
    historySeed: hashSeed(id),
    ...overrides,
  };
}

/** Deterministic 32-bit hash of a string, used only to seed the PRNG. */
function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small, fast, fully deterministic PRNG (mulberry32). */
function mulberry32(seedValue: number): () => number {
  let state = seedValue >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Get a client seed by id. */
export function getClientSeed(id: string): EidosClientSeed | undefined {
  return EIDOS_CLIENT_SEEDS.find((client) => client.id === id);
}

/** The 12 month labels ending in the "current" month (2026-08), oldest first. */
export const HISTORY_MONTHS: string[] = buildMonths("2026-08", 12);

function buildMonths(endIso: string, count: number): string[] {
  const [endYear, endMonth] = endIso.split("-").map(Number);
  const months: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const monthIndex = endMonth - 1 - offset;
    const date = new Date(Date.UTC(endYear, monthIndex, 12));
    months.push(date.toISOString().slice(0, 10));
  }
  return months;
}

/** Scenario pool the synthetic history "walks" through over 12 months. */
const HISTORY_SCENARIO_POOL: EidosScenario[] = SCENARIO_ORDER;

/**
 * Build a deterministic 12-month decision history for a client. The final entry
 * always matches the client's current contract so the timeline is coherent with
 * the live table.
 */
export function buildDecisionHistory(
  seedInput: EidosClientSeed,
): DecisionHistoryEntry[] {
  const random = mulberry32(seedInput.historySeed);
  const entries: DecisionHistoryEntry[] = [];
  let previousStrategy: ProcurementStrategy | null = null;
  let previousScenario: EidosScenario | null = null;

  HISTORY_MONTHS.forEach((date, index) => {
    const isLast = index === HISTORY_MONTHS.length - 1;
    // Occasionally shift the prevailing market scenario.
    let scenario = previousScenario ?? "BASELINE";
    if (previousScenario === null || random() < 0.28) {
      scenario =
        HISTORY_SCENARIO_POOL[
          Math.floor(random() * HISTORY_SCENARIO_POOL.length)
        ];
    }

    const strategy: ProcurementStrategy = isLast
      ? seedInput.currentStrategy
      : recommendStrategy(seedInput, scenario);
    const evaluation = evaluateStrategies(seedInput, scenario).find(
      (item) => item.strategy === strategy,
    );
    const risk = evaluation ? evaluation.risk : bucketRisk(0.5);

    const scenarioChanged = scenario !== previousScenario;
    const strategyChanged =
      previousStrategy !== null && strategy !== previousStrategy;

    entries.push({
      date,
      strategy,
      risk,
      scenario,
      reason: strategyChanged
        ? scenarioChanged
          ? "Market scenario changed"
          : "Coverage rebalanced toward target"
        : undefined,
    });

    previousStrategy = strategy;
    previousScenario = scenario;
  });

  return entries;
}

/**
 * Build deterministic tracked outcomes for a client's most recent executed
 * decisions (the last few months of the history).
 */
export function buildDecisionOutcomes(
  seedInput: EidosClientSeed,
): DecisionOutcome[] {
  const history = buildDecisionHistory(seedInput);
  const random = mulberry32(seedInput.historySeed ^ 0x9e3779b9);
  // Track the four most recent decisions that have a realized outcome.
  const tracked = history.slice(-5, -1);

  return tracked.map((entry) => {
    const analysis = analyzeClient(seedInput, entry.scenario);
    const executed = entry.strategy;
    const recommended = analysis.recommended.strategy;
    const evaluation =
      analysis.evaluations.find((item) => item.strategy === executed) ??
      analysis.recommended;

    const expectedCost = evaluation.expectedCost;
    // Deterministic variance in roughly [-4%, +4%].
    const variancePct = (random() - 0.5) * 0.08;
    const actualCost = expectedCost * (1 + variancePct);
    const outcome = classifyOutcome(variancePct);

    return {
      date: entry.date,
      recommendedStrategy: recommended,
      executedStrategy: executed,
      expectedCost,
      actualCost,
      variancePct,
      outcome,
    };
  });
}

function classifyOutcome(variancePct: number): OutcomeStatus {
  if (variancePct <= -0.01) return "FAVOURABLE";
  if (variancePct >= 0.02) return "UNFAVOURABLE";
  return "NEUTRAL";
}
