/**
 * EIDOS Futures Mispricing Research Prototype — synthetic market data.
 *
 * CRITICAL: This fixture represents information available on 2026-05-26 ONLY.
 * The subsequent 558 PLN outcome is in a SEPARATE object (EIDOS_Q1_2027_OUTCOME)
 * and MUST NOT be imported into any valuation calculation.
 *
 * Historical Polish electricity forward prices are sourced from publicly
 * available TGE (Polish Power Exchange) data patterns, adjusted for a
 * synthetic prototype. All values are approximate/illustrative.
 */

import type {
  FuturesContract,
  MarketSnapshot,
  OutcomeData,
} from "@/eidos/types/futures";

/** The decision date for the historical EIDOS case study. */
export const EIDOS_DECISION_DATE = "2026-05-26";

/** The target contract for the historical EIDOS case study. */
export const EIDOS_TARGET_CONTRACT = "Q1-2027";

/**
 * Polish electricity forward curve snapshot as of 2026-05-26.
 * Prices in PLN/MWh.
 *
 * INFORMATION CUTOFF: All prices reflect market data available NO LATER than 2026-05-26.
 * The subsequent price of 558 PLN (observed after 2026-05-26) is NOT included here.
 */
export const EIDOS_FUTURES_SNAPSHOT: FuturesContract[] = [
  {
    id: "Q3-2025",
    product: "Polish Electricity",
    deliveryPeriod: "Q3 2025",
    deliveryOrdinal: 1,
    decisionDate: EIDOS_DECISION_DATE,
    price: 388.0,
    bid: 385.0,
    ask: 391.0,
    settlementPrice: 388.0,
  },
  {
    id: "Q4-2025",
    product: "Polish Electricity",
    deliveryPeriod: "Q4 2025",
    deliveryOrdinal: 2,
    decisionDate: EIDOS_DECISION_DATE,
    price: 405.0,
    bid: 402.0,
    ask: 408.0,
    settlementPrice: 405.0,
  },
  {
    id: "Q1-2026",
    product: "Polish Electricity",
    deliveryPeriod: "Q1 2026",
    deliveryOrdinal: 3,
    decisionDate: EIDOS_DECISION_DATE,
    price: 430.0,
    bid: 427.0,
    ask: 433.0,
    settlementPrice: 430.0,
  },
  {
    id: "Q2-2026",
    product: "Polish Electricity",
    deliveryPeriod: "Q2 2026",
    deliveryOrdinal: 4,
    decisionDate: EIDOS_DECISION_DATE,
    price: 418.0,
    bid: 415.0,
    ask: 421.0,
    settlementPrice: 418.0,
  },
  {
    id: "Q3-2026",
    product: "Polish Electricity",
    deliveryPeriod: "Q3 2026",
    deliveryOrdinal: 5,
    decisionDate: EIDOS_DECISION_DATE,
    price: 445.0,
    bid: 442.0,
    ask: 448.0,
    settlementPrice: 445.0,
  },
  {
    id: "Q4-2026",
    product: "Polish Electricity",
    deliveryPeriod: "Q4 2026",
    deliveryOrdinal: 6,
    decisionDate: EIDOS_DECISION_DATE,
    price: 508.0,
    bid: 504.0,
    ask: 512.0,
    settlementPrice: 508.0,
  },
  {
    id: "Q1-2027",
    product: "Polish Electricity",
    deliveryPeriod: "Q1 2027",
    deliveryOrdinal: 7,
    decisionDate: EIDOS_DECISION_DATE,
    // TARGET CONTRACT — this is the price at decision time
    // SUBSEQUENT PRICE (558 PLN) IS NOT HERE — see EIDOS_Q1_2027_OUTCOME
    price: 479.0,
    bid: 476.0,
    ask: 482.0,
    settlementPrice: 479.0,
  },
  {
    id: "Q2-2027",
    product: "Polish Electricity",
    deliveryPeriod: "Q2 2027",
    deliveryOrdinal: 8,
    decisionDate: EIDOS_DECISION_DATE,
    price: 498.0,
    bid: 495.0,
    ask: 501.0,
    settlementPrice: 498.0,
  },
  {
    id: "Q3-2027",
    product: "Polish Electricity",
    deliveryPeriod: "Q3 2027",
    deliveryOrdinal: 9,
    decisionDate: EIDOS_DECISION_DATE,
    price: 512.0,
    bid: 508.0,
    ask: 516.0,
    settlementPrice: 512.0,
  },
  {
    id: "Q4-2027",
    product: "Polish Electricity",
    deliveryPeriod: "Q4 2027",
    deliveryOrdinal: 10,
    decisionDate: EIDOS_DECISION_DATE,
    price: 525.0,
    bid: 521.0,
    ask: 529.0,
    settlementPrice: 525.0,
  },
  {
    id: "Cal-2026",
    product: "Polish Electricity",
    deliveryPeriod: "Calendar 2026",
    deliveryOrdinal: 3.5,
    decisionDate: EIDOS_DECISION_DATE,
    price: 432.0,
    bid: 428.0,
    ask: 436.0,
    settlementPrice: 432.0,
  },
  {
    id: "Cal-2027",
    product: "Polish Electricity",
    deliveryPeriod: "Calendar 2027",
    deliveryOrdinal: 7.5,
    decisionDate: EIDOS_DECISION_DATE,
    // Cal-2027 reflects weighted average of Q1-Q4 2027.
    // At 479 PLN Q1-2027 appears discounted versus Cal-2027.
    price: 506.0,
    bid: 502.0,
    ask: 510.0,
    settlementPrice: 506.0,
  },
  {
    id: "Cal-2028",
    product: "Polish Electricity",
    deliveryPeriod: "Calendar 2028",
    deliveryOrdinal: 11.5,
    decisionDate: EIDOS_DECISION_DATE,
    price: 520.0,
    bid: 515.0,
    ask: 525.0,
    settlementPrice: 520.0,
  },
  {
    id: "Cal-2029",
    product: "Polish Electricity",
    deliveryPeriod: "Calendar 2029",
    deliveryOrdinal: 15.5,
    decisionDate: EIDOS_DECISION_DATE,
    price: 534.0,
    bid: 529.0,
    ask: 539.0,
    settlementPrice: 534.0,
  },
];

/**
 * Market snapshot for the decision date.
 * Contains ONLY quarterly and annual contracts (no outcome data).
 */
export const EIDOS_MARKET_SNAPSHOT: MarketSnapshot = {
  timestamp: `${EIDOS_DECISION_DATE}T09:00:00Z`,
  points: EIDOS_FUTURES_SNAPSHOT.map((contract) => ({
    contract: contract.id,
    deliveryPeriod: contract.deliveryPeriod,
    deliveryOrdinal: contract.deliveryOrdinal,
    price: contract.price,
    timestamp: `${EIDOS_DECISION_DATE}T09:00:00Z`,
    isTarget: contract.id === EIDOS_TARGET_CONTRACT,
  })),
};

/**
 * Historical price observations for Q1-2027 available before 2026-05-26.
 * Used to compute historical price dispersion for the uncertainty model.
 * All observations are at or before the decision date.
 */
export const EIDOS_Q1_2027_HISTORY: Array<{ date: string; price: number }> = [
  { date: "2025-11-26", price: 461.0 },
  { date: "2025-12-26", price: 468.0 },
  { date: "2026-01-26", price: 455.0 },
  { date: "2026-02-26", price: 472.0 },
  { date: "2026-03-26", price: 465.0 },
  { date: "2026-04-26", price: 471.0 },
  { date: "2026-05-26", price: 479.0 },
];

/**
 * SUBSEQUENT OUTCOME — MUST NOT be imported into valuation calculations.
 *
 * This object is sealed with a discriminant label to make accidental use
 * in the decision pipeline an explicit TypeScript error.
 *
 * "HISTORICAL CASE STUDY — NOT STATISTICAL VALIDATION"
 * A single successful case does not prove the methodology works generally.
 */
export const EIDOS_Q1_2027_OUTCOME: OutcomeData = {
  _label: "SUBSEQUENT_OUTCOME_NOT_AVAILABLE_AT_DECISION_TIME",
  outcome: {
    decisionPrice: 479.0,
    referencePrice: 558.0,
    absoluteChange: 79.0,
    percentageChange: 0.16492,
    outcomeStatus: "FAVOURABLE",
  },
};

/** Convenience: get a futures contract from the snapshot by id. */
export function getFuturesContract(id: string): FuturesContract | undefined {
  return EIDOS_FUTURES_SNAPSHOT.find((c) => c.id === id);
}

/** Return only quarterly contracts (Q-prefixed) sorted by ordinal. */
export function getQuarterlyContracts(): FuturesContract[] {
  return EIDOS_FUTURES_SNAPSHOT.filter((c) => c.id.startsWith("Q")).sort(
    (a, b) => a.deliveryOrdinal - b.deliveryOrdinal,
  );
}

/** Return only annual (Cal) contracts sorted by ordinal. */
export function getAnnualContracts(): FuturesContract[] {
  return EIDOS_FUTURES_SNAPSHOT.filter((c) => c.id.startsWith("Cal")).sort(
    (a, b) => a.deliveryOrdinal - b.deliveryOrdinal,
  );
}
