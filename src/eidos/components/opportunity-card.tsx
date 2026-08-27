"use client";

/**
 * EIDOS Futures Opportunity — compact summary card.
 * Shows the primary decision output for a single futures contract.
 */

import type { HedgeDecision } from "@/eidos/types/futures";

interface OpportunityCardProps {
  decision: HedgeDecision;
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  BUY: {
    bg: "bg-emerald-950 border border-emerald-700",
    text: "text-emerald-400",
    label: "BUY",
  },
  WATCH: {
    bg: "bg-amber-950 border border-amber-700",
    text: "text-amber-400",
    label: "WATCH",
  },
  NO_ACTION: {
    bg: "bg-zinc-900 border border-zinc-700",
    text: "text-zinc-400",
    label: "NO ACTION",
  },
};

const ROBUSTNESS_STYLES: Record<string, string> = {
  HIGH: "text-emerald-400",
  MEDIUM: "text-amber-400",
  LOW: "text-zinc-400",
};

function fmt(n: number, decimals = 0): string {
  return n.toFixed(decimals);
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(1)}%`;
}

export function OpportunityCard({ decision }: OpportunityCardProps) {
  const signal = SIGNAL_STYLES[decision.action] ?? SIGNAL_STYLES.NO_ACTION;
  const rob = ROBUSTNESS_STYLES[decision.robustness] ?? "text-zinc-400";

  // Central discount = central valuation − current price. Positive = attractive.
  const discountAbsolute = decision.valuationRange.central - decision.entryPrice;
  const discountPct =
    decision.valuationRange.central > 0
      ? discountAbsolute / decision.valuationRange.central
      : 0;
  const discountSign = discountAbsolute >= 0 ? "+" : "";

  return (
    <div className={`rounded-xl p-6 ${signal.bg}`} data-testid="opportunity-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
            Futures contract
          </p>
          <h2 className="text-2xl font-bold text-white">{decision.contract}</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Decision date:{" "}
            <span className="text-zinc-300">{decision.decisionDate}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
            Recommendation
          </p>
          <span
            className={`text-2xl font-bold tracking-wider ${signal.text}`}
            data-testid="recommendation-signal"
          >
            {signal.label}
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric
          label="Market price"
          value={`${fmt(decision.entryPrice)} PLN`}
          sub="at decision time"
        />
        <Metric
          label="Central valuation"
          value={`${fmt(decision.valuationRange.central)} PLN/MWh`}
          sub="model central estimate"
        />
        <Metric
          label="Central discount"
          value={`${discountSign}${fmt(discountAbsolute)} PLN/MWh`}
          sub={fmtPct(discountPct)}
          highlight={discountAbsolute > 0}
        />
        <Metric
          label="Uncertainty interval"
          value={`${fmt(decision.valuationRange.lower)}–${fmt(decision.valuationRange.upper)} PLN/MWh`}
          valueClass={rob}
          sub={`±${fmt(decision.valuationRange.uncertaintyWidth / 2, 0)} PLN/MWh`}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  highlight,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p
        className={`text-lg font-semibold ${highlight ? "text-emerald-400" : valueClass ?? "text-white"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
