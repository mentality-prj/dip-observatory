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
  const robustDiscountStr =
    minimax.robustDiscount > 0
      ? `${minimax.robustDiscount.toFixed(0)} PLN below worst-case lower bound`
      : `${Math.abs(minimax.robustDiscount).toFixed(0)} PLN above worst-case lower bound`;

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
      title: "Uncertainty range",
      value: `±${(valuationRange.uncertaintyWidth / 2).toFixed(0)} PLN/MWh`,
      detail: `Derived from historical dispersion and local curve properties. Central estimate: ${valuationRange.central.toFixed(0)} PLN/MWh.`,
    },
    {
      title: "Structural discount vs uncertainty",
      value: `${structuralDiscount.toFixed(0)} PLN vs ±${(valuationRange.uncertaintyWidth / 2).toFixed(0)} PLN`,
      detail:
        structuralDiscount > valuationRange.uncertaintyWidth / 2
          ? "Discount exceeds uncertainty half-width — mispricing is robust."
          : "Discount is within the uncertainty range — signal is tentative.",
      positive: structuralDiscount > valuationRange.uncertaintyWidth / 2,
    },
    {
      title: "Minimax robustness",
      value: robustDiscountStr,
      detail:
        minimax.robustDiscount > 0
          ? "Even in the adversarial worst-case scenario, the contract still trades below the lower valuation bound."
          : "In the adversarial worst-case, the current price is within the valuation range.",
      positive: minimax.robustDiscount > 0,
    },
  ];

  return (
    <div className="space-y-4" data-testid="decision-explanation">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Why this opportunity?
      </h3>

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
