/**
 * EIDOS Decision Observatory — presentation helpers (labels, formatters, tones).
 * Pure and framework-agnostic so they can be unit-tested and reused by charts.
 */

import type {
  ClientRisk,
  DecisionStatus,
  EidosScenario,
  OutcomeStatus,
  ProcurementStrategy,
} from "@/eidos/types/eidos";

export type BadgeTone = "neutral" | "cyan" | "emerald" | "amber" | "rose";

/** Human-readable procurement strategy label, e.g. "BUY 20%". */
export const STRATEGY_LABEL: Record<ProcurementStrategy, string> = {
  BUY_20: "BUY 20%",
  BUY_40: "BUY 40%",
  WAIT: "WAIT",
};

export const STATUS_LABEL: Record<DecisionStatus, string> = {
  STABLE: "Stable",
  STRATEGY_CHANGED: "Strategy changed",
  HIGH_RISK: "High risk",
  ACTION_REQUIRED: "Action required",
};

export const RISK_LABEL: Record<ClientRisk, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const OUTCOME_LABEL: Record<OutcomeStatus, string> = {
  FAVOURABLE: "Favourable",
  NEUTRAL: "Neutral",
  UNFAVOURABLE: "Unfavourable",
};

export const SCENARIO_LABEL: Record<EidosScenario, string> = {
  BASELINE: "Baseline",
  HIGH_PRICE: "High price",
  LOW_PRICE: "Low price",
  HIGH_DEMAND: "High demand",
  LOW_DEMAND: "Low demand",
  HIGH_VOLATILITY: "High volatility",
};

export const RISK_TONE: Record<ClientRisk, BadgeTone> = {
  LOW: "emerald",
  MEDIUM: "amber",
  HIGH: "rose",
};

export const STATUS_TONE: Record<DecisionStatus, BadgeTone> = {
  STABLE: "emerald",
  STRATEGY_CHANGED: "cyan",
  HIGH_RISK: "rose",
  ACTION_REQUIRED: "amber",
};

export const OUTCOME_TONE: Record<OutcomeStatus, BadgeTone> = {
  FAVOURABLE: "emerald",
  NEUTRAL: "neutral",
  UNFAVOURABLE: "rose",
};

/** Exception priority for sorting: higher = more urgent. STABLE is lowest. */
export const STATUS_PRIORITY: Record<DecisionStatus, number> = {
  ACTION_REQUIRED: 3,
  HIGH_RISK: 2,
  STRATEGY_CHANGED: 1,
  STABLE: 0,
};

const eurCompact = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 2,
});

const eurFull = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const mwhFormat = new Intl.NumberFormat("en-IE", {
  maximumFractionDigits: 0,
});

/** Format euros compactly, e.g. €1.02M. */
export function formatEuroCompact(value: number): string {
  return eurCompact.format(value);
}

/** Format euros with full digits, e.g. €1,020,000. */
export function formatEuroFull(value: number): string {
  return eurFull.format(value);
}

/** Format a MWh volume, e.g. "18,000 MWh". */
export function formatMwh(value: number): string {
  return `${mwhFormat.format(value)} MWh`;
}

/** Format a fraction in [0,1] as a percentage, e.g. 0.82 -> "82%". */
export function formatPercent(value: number, fractionDigits = 0): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/** Format a signed fractional delta, e.g. -0.08 -> "-8%". */
export function formatSignedPercent(value: number, fractionDigits = 0): string {
  const percent = value * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(fractionDigits)}%`;
}
