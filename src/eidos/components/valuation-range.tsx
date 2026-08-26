"use client";

/**
 * EIDOS Futures Opportunity — decision boundary visualisation.
 * Shows current price vs valuation range as a horizontal gauge.
 */

import type { ValuationRange } from "@/eidos/types/futures";

interface ValuationRangeProps {
  currentPrice: number;
  valuation: ValuationRange;
  worstCaseLow: number;
  worstCaseHigh: number;
  label?: string;
}

export function ValuationRangeBar({
  currentPrice,
  valuation,
  worstCaseLow,
  worstCaseHigh,
  label = "Decision Boundary",
}: ValuationRangeProps) {
  // Extend view by 10% on each side for context
  const min = Math.min(currentPrice, worstCaseLow) * 0.97;
  const max = Math.max(currentPrice, worstCaseHigh, valuation.upper) * 1.02;
  const range = max - min;

  function toPercent(v: number): string {
    return `${(((v - min) / range) * 100).toFixed(2)}%`;
  }

  const lowerPct = parseFloat(toPercent(valuation.lower));
  const upperPct = parseFloat(toPercent(valuation.upper));
  const widthPct = upperPct - lowerPct;
  const currentPct = parseFloat(toPercent(currentPrice));
  const wcLowPct = parseFloat(toPercent(worstCaseLow));

  const isCherry = currentPrice < worstCaseLow;
  const isWatch = currentPrice < valuation.central && !isCherry;

  return (
    <div className="space-y-3" data-testid="valuation-range-bar">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </h3>

      {/* Bar */}
      <div className="relative h-10 rounded-lg bg-zinc-800 overflow-visible">
        {/* Valuation range band */}
        <div
          className="absolute top-0 h-full rounded-lg bg-zinc-600/40 border border-zinc-600"
          style={{ left: `${lowerPct}%`, width: `${widthPct}%` }}
          title={`Valuation range: ${valuation.lower.toFixed(0)} – ${valuation.upper.toFixed(0)} PLN`}
        />

        {/* Worst-case lower line */}
        <div
          className="absolute top-0 h-full border-l-2 border-dashed border-amber-600/70"
          style={{ left: `${wcLowPct}%` }}
          title={`Worst-case lower: ${worstCaseLow.toFixed(0)} PLN`}
        />

        {/* Central estimate line */}
        <div
          className="absolute top-0 h-full border-l-2 border-zinc-400"
          style={{
            left: `${parseFloat(toPercent(valuation.central))}%`,
          }}
          title={`Central: ${valuation.central.toFixed(0)} PLN`}
        />

        {/* Current price marker */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg ${
            isCherry
              ? "bg-emerald-500"
              : isWatch
                ? "bg-amber-500"
                : "bg-zinc-400"
          }`}
          style={{ left: `calc(${currentPct}% - 8px)` }}
          title={`Current price: ${currentPrice.toFixed(0)} PLN`}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-zinc-500 flex-wrap">
        <LegendItem
          color="bg-emerald-500"
          circle
          label={`Current: ${currentPrice.toFixed(0)} PLN`}
        />
        <LegendItem
          color="bg-zinc-400"
          line
          label={`Central: ${valuation.central.toFixed(0)} PLN`}
        />
        <LegendItem
          color="bg-zinc-600/40 border border-zinc-600"
          rect
          label={`Valuation range: ${valuation.lower.toFixed(0)} – ${valuation.upper.toFixed(0)} PLN`}
        />
        <LegendItem
          color="border-amber-600/70"
          dash
          label={`Worst-case lower: ${worstCaseLow.toFixed(0)} PLN`}
        />
      </div>

      {/* Price labels */}
      <div className="flex justify-between text-xs text-zinc-600">
        <span>{min.toFixed(0)}</span>
        <span>{max.toFixed(0)}</span>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  circle,
  line,
  rect,
  dash,
}: {
  color: string;
  label: string;
  circle?: boolean;
  line?: boolean;
  rect?: boolean;
  dash?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {circle && (
        <span className={`inline-block w-3 h-3 rounded-full ${color}`} />
      )}
      {line && (
        <span className={`inline-block w-3 h-0.5 ${color}`} />
      )}
      {rect && (
        <span className={`inline-block w-4 h-3 rounded ${color}`} />
      )}
      {dash && (
        <span
          className={`inline-block w-3 h-0 border-t-2 border-dashed ${color}`}
        />
      )}
      <span>{label}</span>
    </div>
  );
}
