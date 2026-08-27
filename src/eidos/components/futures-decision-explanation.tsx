"use client";

/**
 * EIDOS Futures Opportunity — decision explanation panel.
 * Shows the deterministic reasons behind the hedge timing recommendation.
 */

import type { HedgeDecision } from "@/eidos/types/futures";

interface FuturesDecisionExplanationProps {
  decision: HedgeDecision;
}

export function FuturesDecisionExplanation({ decision }: FuturesDecisionExplanationProps) {
  const { curveMetrics, valuationRange, minimax, entryPrice } = decision;

  const structuralDiscount = valuationRange.central - entryPrice;
  // Price vs. worst-case valuation = currentPrice − worstCaseLow.
  // Positive = current price is above worst-case lower bound (WATCH case).
  // Negative = current price is below worst-case lower bound (BUY-territory).
  const priceVsWorstCase = entryPrice - minimax.worstCaseLow;
  const priceVsWorstCaseStr =
    priceVsWorstCase >= 0
      ? `+${priceVsWorstCase.toFixed(0)} PLN/MWh above worst-case valuation`
      : `${priceVsWorstCase.toFixed(0)} PLN/MWh below worst-case valuation`;

  const reasons: Array<{
    title: string;
    value: string;
    detail: string;
    positive?: boolean;
  }> = [
    {
      title: "Position on forward curve",
      value: `Normalised deviation: ${curveMetrics.normalisedDeviation.toFixed(2)} σ`,
      detail:
        curveMetrics.normalisedDeviation < -0.3
          ? "Contract is below local curve interpolation — structural cheapness."
          : curveMetrics.normalisedDeviation < 0
            ? "Contract trades slightly below local curve interpolation."
            : "Contract is near or above local curve fit.",
      positive: curveMetrics.normalisedDeviation < 0,
    },
    {
      title: "Adjacent contract spreads",
      value: `Prev: ${curveMetrics.spreadToPrevious.toFixed(0)} PLN · Next: ${curveMetrics.spreadToNext.toFixed(0)} PLN`,
      detail:
        curveMetrics.spreadToPrevious < 0 && curveMetrics.spreadToNext < 0
          ? "Contract is cheaper than both adjacent quarterly contracts — unusual local dip."
          : "Spread to adjacent quarterly contracts is within normal range.",
      positive: curveMetrics.spreadToPrevious < 0 || curveMetrics.spreadToNext < 0,
    },
    {
      title: "Annual vs quarterly relationship",
      value: `Spread to Cal: ${curveMetrics.spreadToAnnual.toFixed(0)} PLN/MWh`,
      detail:
        curveMetrics.spreadToAnnual < -10
          ? "Contract trades materially below the nearest annual (Cal) contract — structural discount."
          : curveMetrics.spreadToAnnual < 0
            ? "Contract trades slightly below annual proxy."
            : "Contract at or above annual proxy — no structural discount.",
      positive: curveMetrics.spreadToAnnual < 0,
    },
    {
      title: "Uncertainty interval",
      value: `±${(valuationRange.uncertaintyWidth / 2).toFixed(0)} PLN/MWh`,
      detail: `Derived from historical dispersion and local curve properties. Central estimate: ${valuationRange.central.toFixed(0)} PLN/MWh.`,
    },
    {
      title: "Central discount vs uncertainty",
      value: `${structuralDiscount >= 0 ? "+" : ""}${structuralDiscount.toFixed(0)} PLN vs ±${(valuationRange.uncertaintyWidth / 2).toFixed(0)} PLN`,
      detail:
        structuralDiscount > valuationRange.uncertaintyWidth / 2
          ? "Central discount exceeds uncertainty half-width — mispricing is robust."
          : "Central discount is within the uncertainty range — signal is tentative.",
      positive: structuralDiscount > valuationRange.uncertaintyWidth / 2,
    },
    {
      title: "Price vs. worst-case valuation",
      value: priceVsWorstCaseStr,
      detail:
        priceVsWorstCase < 0
          ? "Current price is below the worst-case lower bound — entry is robust under adversarial uncertainty."
          : "Current price is above the worst-case lower bound — entry is not yet robust under adversarial uncertainty.",
      positive: priceVsWorstCase < 0,
    },
  ];

  return (
    <div className="space-y-4" data-testid="decision-explanation">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Why this opportunity?
      </h3>

      {/* Decision summary — plain-language rationale */}
      <DecisionSummary decision={decision} structuralDiscount={structuralDiscount} />

      <div className="space-y-3">
        {reasons.map((r) => (
          <div
            key={r.title}
            className="rounded-lg bg-zinc-900 border border-zinc-800 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-300">{r.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{r.detail}</p>
              </div>
              <div className="sm:shrink-0 sm:text-right">
                <span
                  className={`text-sm font-mono font-semibold ${
                    r.positive === true
                      ? "text-emerald-400"
                      : r.positive === false
                        ? "text-zinc-400"
                        : "text-zinc-300"
                  }`}
                >
                  {r.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full rationale */}
      <details className="mt-4">
        <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
          Full model rationale
        </summary>
        <p className="mt-2 text-xs text-zinc-500 leading-relaxed bg-zinc-950 rounded-lg p-3 border border-zinc-800">
          {decision.rationale}
        </p>
      </details>

      {/* Methodology */}
      <details className="mt-2">
        <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
          Valuation methodology
        </summary>
        <p className="mt-2 text-xs text-zinc-500 leading-relaxed bg-zinc-950 rounded-lg p-3 border border-zinc-800">
          {valuationRange.methodology}
        </p>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision summary card — plain-language rationale
// ---------------------------------------------------------------------------

const DECISION_SEMANTICS: Record<string, { label: string; description: (discountPct: string) => string }> = {
  BUY: {
    label: "BUY / ENTER HEDGE",
    description: (discountPct) =>
      `Current price is sufficiently attractive relative to the central valuation (${discountPct} below) and the discount is robust against the current uncertainty range.`,
  },
  WATCH: {
    label: "WATCH",
    description: (discountPct) =>
      `The contract is ${discountPct} below the central valuation, but the discount is not robust against the current uncertainty range. Central valuation indicates potential attractiveness, but uncertainty is insufficient for a robust entry decision.`,
  },
  NO_ACTION: {
    label: "NO ACTION",
    description: () =>
      "There is insufficient evidence of attractive mispricing relative to the uncertainty range.",
  },
};

function DecisionSummary({
  decision,
  structuralDiscount,
}: {
  decision: HedgeDecision;
  structuralDiscount: number;
}) {
  const semantics = DECISION_SEMANTICS[decision.action] ?? DECISION_SEMANTICS.NO_ACTION;
  const discountPct =
    decision.valuationRange.central > 0
      ? ((structuralDiscount / decision.valuationRange.central) * 100).toFixed(1) + "%"
      : "0%";
  const description = semantics.description(discountPct);

  const actionColour =
    decision.action === "BUY"
      ? "border-emerald-700 bg-emerald-950/60 text-emerald-300"
      : decision.action === "WATCH"
        ? "border-amber-700 bg-amber-950/60 text-amber-300"
        : "border-zinc-700 bg-zinc-900 text-zinc-400";

  return (
    <div className={`rounded-lg border p-4 ${actionColour}`} data-testid="decision-summary">
      <p className="text-xs font-bold uppercase tracking-widest mb-1">{semantics.label}</p>
      <p className="text-sm leading-relaxed">{description}</p>
      <p className="mt-3 text-xs text-zinc-500">
        Decision calculated by DIP Core. Historical outcome is not used by the decision model.
      </p>
    </div>
  );
}
