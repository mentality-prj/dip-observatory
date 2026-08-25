/**
 * EIDOS Decision Observatory — deterministic decision engine.
 *
 * A small, transparent, *synthetic* procurement model. Given a client seed and
 * a market scenario it evaluates three hedging alternatives (BUY_20, BUY_40,
 * WAIT), ranks them by risk-adjusted cost, and derives a recommendation, risk
 * bucket and exception status. Everything is pure and deterministic — there is
 * no randomness, no network access and no real market data.
 */

import type {
  ClientDecision,
  ClientRisk,
  DecisionFactor,
  DecisionStatus,
  EidosClient,
  EidosClientSeed,
  EidosScenario,
  PortfolioSummary,
  ProcurementStrategy,
  ScenarioParams,
  StrategyEvaluation,
} from "@/eidos/types/eidos";

/** Reference market forward price in €/MWh. */
const FORWARD_PRICE = 100;
/**
 * Fixed discount (€/MWh) applied to {@link FORWARD_PRICE} to derive the locked
 * forward. Because the forward sits below the reference forward, locking a larger
 * fraction of volume lowers the expected bill, so under central assumptions
 * BUY_40 < BUY_20 < WAIT. The discount itself is constant; what changes across
 * scenarios is the *relative hedging advantage*: when scenario spot falls below
 * the locked forward (LOW_PRICE), hedging increases cost rather than reducing it,
 * making WAIT genuinely competitive. Synthetic, deterministic, prototype-only.
 */
const FORWARD_HEDGE_DISCOUNT = 8;
/** Ordered list of the procurement alternatives. */
export const STRATEGIES: ProcurementStrategy[] = ["BUY_20", "BUY_40", "WAIT"];

/** Hedged fraction of volume locked at the forward price for each strategy. */
const HEDGE_FRACTION: Record<ProcurementStrategy, number> = {
  BUY_20: 0.2,
  BUY_40: 0.4,
  WAIT: 0,
};

/** Risk bucket thresholds on the continuous risk value. */
const RISK_MEDIUM_THRESHOLD = 0.34;
const RISK_HIGH_THRESHOLD = 0.62;

/** Ordered scenario definitions used across the UI. */
export const SCENARIOS: Record<EidosScenario, ScenarioParams> = {
  BASELINE: {
    id: "BASELINE",
    label: "Baseline",
    description: "Central market assumptions with no directional shock.",
    priceLevel: 1.0,
    demandLevel: 1.0,
    volatility: 1.0,
  },
  HIGH_PRICE: {
    id: "HIGH_PRICE",
    label: "High price",
    description: "Forward prices rise; spot exposure becomes more expensive.",
    priceLevel: 1.18,
    demandLevel: 1.0,
    volatility: 1.05,
  },
  LOW_PRICE: {
    id: "LOW_PRICE",
    label: "Low price",
    description: "Forward prices fall; waiting for spot is comparatively cheap.",
    priceLevel: 0.78,
    demandLevel: 1.0,
    volatility: 0.95,
  },
  HIGH_DEMAND: {
    id: "HIGH_DEMAND",
    label: "High demand",
    description: "Consumption and prices climb, raising exposed volume.",
    priceLevel: 1.06,
    demandLevel: 1.12,
    volatility: 1.05,
  },
  LOW_DEMAND: {
    id: "LOW_DEMAND",
    label: "Low demand",
    description: "Softer consumption relieves pressure on procurement.",
    priceLevel: 0.96,
    demandLevel: 0.9,
    volatility: 0.95,
  },
  HIGH_VOLATILITY: {
    id: "HIGH_VOLATILITY",
    label: "High volatility",
    description: "Prices are unstable; downside risk dominates the decision.",
    priceLevel: 1.02,
    demandLevel: 1.0,
    volatility: 1.6,
  },
};

/** Scenario ids in canonical display order. */
export const SCENARIO_ORDER: EidosScenario[] = [
  "BASELINE",
  "HIGH_PRICE",
  "LOW_PRICE",
  "HIGH_DEMAND",
  "LOW_DEMAND",
  "HIGH_VOLATILITY",
];

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Bucket a continuous risk value into a coarse label. */
export function bucketRisk(riskValue: number): ClientRisk {
  if (riskValue >= RISK_HIGH_THRESHOLD) return "HIGH";
  if (riskValue >= RISK_MEDIUM_THRESHOLD) return "MEDIUM";
  return "LOW";
}

/**
 * Effective forward price a client can lock for this decision.
 *
 * The forward is committed *before* the scenario resolves, so it does not scale
 * with `priceLevel` (which drives the realized spot in {@link spotPrice}). It is
 * anchored at the reference forward, discounted by {@link FORWARD_HEDGE_DISCOUNT}
 * (the hedging benefit of locking early), plus a client contango premium that
 * widens as prices rise. Hedging therefore lowers the expected bill whenever spot
 * settles above this locked level.
 */
function effectiveForward(seed: EidosClientSeed, params: ScenarioParams): number {
  const contango = seed.forwardPremium * Math.max(0, params.priceLevel - 1);
  return FORWARD_PRICE - FORWARD_HEDGE_DISCOUNT + contango;
}

/** Expected spot price for a client under a scenario. */
function spotPrice(seed: EidosClientSeed, params: ScenarioParams): number {
  return FORWARD_PRICE * params.priceLevel + seed.spotBias;
}

/** Continuous risk value in [0, 1] for a strategy under a scenario. */
function riskValueFor(
  seed: EidosClientSeed,
  params: ScenarioParams,
  strategy: ProcurementStrategy,
): number {
  const exposed = 1 - HEDGE_FRACTION[strategy];
  const structural = params.volatility * (0.15 + 0.55 * exposed) * params.demandLevel;
  return clamp01(structural + seed.baseRisk * 0.25);
}

/** Raw (unranked) evaluation for a single strategy. */
function rawEvaluation(
  seed: EidosClientSeed,
  params: ScenarioParams,
  strategy: ProcurementStrategy,
): Omit<StrategyEvaluation, "rank" | "expectedSavings"> {
  const hedge = HEDGE_FRACTION[strategy];
  const exposed = 1 - hedge;
  const volume = seed.annualConsumptionMwh * params.demandLevel;
  const forward = effectiveForward(seed, params);
  const spot = spotPrice(seed, params);

  const unitCost = hedge * forward + exposed * spot;
  const expectedCost = volume * unitCost;

  const riskValue = riskValueFor(seed, params, strategy);
  const confidence = clamp01(0.9 - params.volatility * 0.18 - exposed * 0.12);
  const downside = volume * exposed * spot * 0.25 * params.volatility;
  const riskAdjustedCost = expectedCost * (1 + seed.riskAversion * riskValue);

  return {
    strategy,
    expectedCost,
    riskValue,
    risk: bucketRisk(riskValue),
    confidence,
    downside,
    riskAdjustedCost,
  };
}

/**
 * Evaluate all three alternatives for a client under a scenario, ranked by
 * risk-adjusted cost (rank 1 = recommended under current assumptions).
 */
export function evaluateStrategies(
  seed: EidosClientSeed,
  scenario: EidosScenario,
): StrategyEvaluation[] {
  const params = SCENARIOS[scenario];
  const raw = STRATEGIES.map((strategy) => rawEvaluation(seed, params, strategy));

  const maxCost = Math.max(...raw.map((entry) => entry.expectedCost));

  const ranked = raw
    .map((entry) => ({
      ...entry,
      expectedSavings: maxCost - entry.expectedCost,
    }))
    .sort((a, b) => {
      if (a.riskAdjustedCost !== b.riskAdjustedCost) {
        return a.riskAdjustedCost - b.riskAdjustedCost;
      }
      // Stable, deterministic tie-break by strategy order.
      return STRATEGIES.indexOf(a.strategy) - STRATEGIES.indexOf(b.strategy);
    });

  return ranked.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** The recommended strategy for a client under a scenario. */
export function recommendStrategy(
  seed: EidosClientSeed,
  scenario: EidosScenario,
): ProcurementStrategy {
  return evaluateStrategies(seed, scenario)[0].strategy;
}

/** Derive the exception-oriented status from risk and decision change. */
export function deriveStatus(
  risk: ClientRisk,
  decisionChanged: boolean,
): DecisionStatus {
  if (risk === "HIGH" && decisionChanged) return "ACTION_REQUIRED";
  if (risk === "HIGH") return "HIGH_RISK";
  if (decisionChanged) return "STRATEGY_CHANGED";
  return "STABLE";
}

/** Resolve a client's scenario-dependent view (recommendation, risk, status). */
export function resolveClient(
  seed: EidosClientSeed,
  scenario: EidosScenario,
): EidosClient {
  const evaluations = evaluateStrategies(seed, scenario);
  const recommended = evaluations[0].strategy;
  const current = evaluations.find((entry) => entry.strategy === seed.currentStrategy);
  const risk = current ? current.risk : evaluations[0].risk;
  const decisionChanged = recommended !== seed.currentStrategy;

  return {
    id: seed.id,
    name: seed.name,
    annualConsumptionMwh: seed.annualConsumptionMwh,
    currentStrategy: seed.currentStrategy,
    recommendedStrategy: recommended,
    status: deriveStatus(risk, decisionChanged),
    risk,
    decisionChanged,
  };
}

/**
 * Structured (non-LLM) explanation of why the recommendation differs from the
 * client's current strategy. Factors are derived from the actual decision inputs:
 * the client's coverage gap, the cost / downside / confidence deltas between the
 * current contract and the recommended alternative, and the scenario's price and
 * demand moves relative to BASELINE. Only material factors are returned, ranked
 * by magnitude and capped so a meaningful change surfaces its 3–4 top drivers.
 * Everything is deterministic — no hardcoded copy, no randomness.
 */
export function explainDecision(
  seed: EidosClientSeed,
  scenario: EidosScenario,
): DecisionFactor[] {
  const params = SCENARIOS[scenario];
  const base = SCENARIOS.BASELINE;

  const evaluations = evaluateStrategies(seed, scenario);
  const recommended = evaluations[0];
  const current =
    evaluations.find((entry) => entry.strategy === seed.currentStrategy) ??
    recommended;

  // Scenario moves relative to central assumptions.
  const priceDelta = params.priceLevel / base.priceLevel - 1;
  const demandDelta = params.demandLevel / base.demandLevel - 1;

  // Coverage gap: how far current hedging sits below the 40% target.
  const coverageGap = 0.4 - HEDGE_FRACTION[seed.currentStrategy];

  // Data-derived deltas between the current contract and the recommended
  // alternative. These stay non-zero even under BASELINE assumptions, so a
  // changed decision always has several concrete drivers.
  const costDelta =
    current.expectedCost > 0
      ? recommended.expectedCost / current.expectedCost - 1
      : 0;
  const downsideDelta =
    current.downside > 0 ? recommended.downside / current.downside - 1 : 0;
  const confidenceDelta = recommended.confidence - current.confidence;

  const candidates: DecisionFactor[] = [
    {
      label: "Contract coverage vs target",
      delta: -coverageGap,
      supportsHedging: coverageGap > 0,
    },
    { label: "Expected cost", delta: costDelta, supportsHedging: costDelta > 0 },
    {
      label: "Downside risk",
      delta: downsideDelta,
      supportsHedging: downsideDelta > 0,
    },
    {
      label: "Forecast confidence",
      delta: confidenceDelta,
      supportsHedging: confidenceDelta < 0,
    },
    {
      label: "TTF price forecast",
      delta: priceDelta,
      supportsHedging: priceDelta > 0,
    },
    { label: "Demand forecast", delta: demandDelta, supportsHedging: demandDelta > 0 },
  ];

  return candidates
    .filter((factor) => Math.abs(factor.delta) >= 0.005)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);
}

/**
 * Structured explanation of what changed between two scenarios (used by the
 * decision replay). Non-LLM: derived purely from scenario parameter deltas.
 */
export function explainScenarioShift(
  from: EidosScenario,
  to: EidosScenario,
): DecisionFactor[] {
  const a = SCENARIOS[from];
  const b = SCENARIOS[to];

  const priceDelta = b.priceLevel / a.priceLevel - 1;
  const demandDelta = b.demandLevel / a.demandLevel - 1;
  const volatilityDelta = b.volatility / a.volatility - 1;
  const riskDelta = volatilityDelta * 0.6 + Math.max(0, priceDelta) * 0.4;

  return [
    { label: "TTF price forecast", delta: priceDelta, supportsHedging: priceDelta > 0 },
    { label: "Demand forecast", delta: demandDelta, supportsHedging: demandDelta > 0 },
    { label: "Downside risk", delta: riskDelta, supportsHedging: riskDelta > 0 },
  ].filter((factor) => Math.abs(factor.delta) >= 0.005);
}

/** Full decision analysis for a client under a scenario. */
export function analyzeClient(
  seed: EidosClientSeed,
  scenario: EidosScenario,
): ClientDecision {
  const evaluations = evaluateStrategies(seed, scenario);
  const client = resolveClient(seed, scenario);
  const recommended = evaluations.find(
    (entry) => entry.strategy === client.recommendedStrategy,
  )!;
  const current =
    evaluations.find((entry) => entry.strategy === client.currentStrategy) ??
    recommended;

  return {
    client,
    scenario,
    evaluations,
    recommended,
    current,
    factors: explainDecision(seed, scenario),
  };
}

/** Aggregate an exception-oriented portfolio summary from resolved clients. */
export function summarizePortfolio(clients: EidosClient[]): PortfolioSummary {
  const summary: PortfolioSummary = {
    total: clients.length,
    stable: 0,
    strategyChanged: 0,
    highRisk: 0,
    actionRequired: 0,
    needsAttention: 0,
  };

  for (const client of clients) {
    switch (client.status) {
      case "STABLE":
        summary.stable += 1;
        break;
      case "STRATEGY_CHANGED":
        summary.strategyChanged += 1;
        break;
      case "HIGH_RISK":
        summary.highRisk += 1;
        break;
      case "ACTION_REQUIRED":
        summary.actionRequired += 1;
        break;
    }
  }

  summary.needsAttention = summary.total - summary.stable;
  return summary;
}
