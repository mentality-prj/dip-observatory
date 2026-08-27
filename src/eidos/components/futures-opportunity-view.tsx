"use client";

/**
 * EIDOS Futures Opportunity — primary research view (presentation only).
 *
 * This component performs NO decision computation. The hedge decision is
 * produced by the local futures-mispricing plugin (see `src/dip/plugins/futures-mispricing/`) and passed
 * in as a prop. This view is a pure presentation layer that renders:
 *   1. Decision summary (OpportunityCard)
 *   2. Forward Curve chart
 *   3. Why this opportunity (FuturesDecisionExplanation)
 *   4. Decision Boundary (ValuationRangeBar)
 *   5. Outcome section (post-decision, clearly separated)
 *
 * LOOK-AHEAD PROTECTION:
 *   The decision is computed by the local futures-mispricing plugin purely from pre-decision snapshot data.
 *   The 558 PLN outcome is rendered only AFTER the decision section, with
 *   explicit visual separation, and is NEVER fed into the decision.
 */

import type {
  HedgeDecision,
  MarketSnapshot,
  OutcomeData,
} from "@/eidos/types/futures";
import { OpportunityCard } from "@/eidos/components/opportunity-card";
import { ForwardCurveChart } from "@/eidos/components/forward-curve-chart";
import { ValuationRangeBar } from "@/eidos/components/valuation-range";
import { FuturesDecisionExplanation } from "@/eidos/components/futures-decision-explanation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import { getEidosCopy } from "@/eidos/lib/eidos-i18n";

// ---------------------------------------------------------------------------
// Outcome display
// ---------------------------------------------------------------------------

function OutcomeSection({
  decisionPrice,
  referencePrice,
  absoluteChange,
  percentageChange,
  outcomeStatus,
}: {
  decisionPrice: number;
  referencePrice: number;
  absoluteChange: number;
  percentageChange: number;
  outcomeStatus: "FAVOURABLE" | "NEUTRAL" | "UNFAVOURABLE";
}) {
  const sign = absoluteChange >= 0 ? "+" : "";
  const pct = (percentageChange * 100).toFixed(2);

  return (
    <section
      className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-6"
      data-testid="outcome-section"
    >
      {/* Explicit label preventing look-ahead confusion */}
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-block rounded-full bg-zinc-800 border border-zinc-600 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Subsequent outcome — not used by decision model
        </span>
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-4">
        Outcome after decision
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Entry price</p>
          <p className="text-xl font-bold text-white">{decisionPrice.toFixed(0)} PLN</p>
          <p className="text-xs text-zinc-500">at decision time</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Reference price</p>
          <p className="text-xl font-bold text-zinc-300">{referencePrice.toFixed(0)} PLN</p>
          <p className="text-xs text-zinc-500">subsequent market price</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Change</p>
          <p className="text-xl font-bold text-emerald-400">
            {sign}{absoluteChange.toFixed(0)} PLN
          </p>
          <p className="text-xs text-zinc-500">{sign}{pct}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Outcome</p>
          <p
            className={`text-xl font-bold ${
              outcomeStatus === "FAVOURABLE"
                ? "text-emerald-400"
                : outcomeStatus === "UNFAVOURABLE"
                  ? "text-red-400"
                  : "text-zinc-400"
            }`}
          >
            {outcomeStatus}
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-zinc-600 leading-relaxed border-t border-zinc-800 pt-4">
        ⚠️{" "}
        <strong className="text-zinc-500">Historical case study — not statistical validation.</strong>{" "}
        This single case does not prove the methodology is generally effective. The 558 PLN
        price was NOT used in any valuation calculation above. Multiple out-of-sample cases
        are required before any effectiveness claim can be made.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function FuturesOpportunityView({
  decision,
  decisionDate,
  marketSnapshot,
  outcome: outcomeData,
  targetContract,
  pluginStatus,
  locale = "en",
}: {
  decision: HedgeDecision;
  decisionDate: string;
  marketSnapshot: MarketSnapshot;
  outcome: OutcomeData;
  targetContract: string;
  pluginStatus?: { pluginVersion: string; modelVersion: string; configurationVersion: string };
  locale?: Locale;
}) {
  // Outcome data is used ONLY for the separate outcome section below.
  // It does NOT influence the decision, which is computed by the local futures-mispricing plugin.
  const { outcome } = outcomeData;
  const copy = getEidosCopy(locale);

  // Pre-computed presentation values used in the metrics summary grid.
  const centralDiscount = decision.valuationRange.central - decision.entryPrice;
  const centralDiscountSign = centralDiscount >= 0 ? "+" : "";
  const priceVsWorstCase = decision.entryPrice - decision.minimax.worstCaseLow;
  const priceVsWorstCaseSign = priceVsWorstCase >= 0 ? "+" : "";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
              EIDOS Research Prototype
            </p>
            <h1 className="text-3xl font-bold text-white">
              EIDOS — Futures Opportunity
            </h1>
            <p className="text-zinc-400 mt-2">
              Robust hedge timing under market uncertainty
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-700 px-3 py-1">
              <span className="text-xs text-zinc-500">
                Information available at decision time:
              </span>
              <span className="text-xs font-semibold text-zinc-300">
                {decisionDate}
              </span>
            </div>
            {pluginStatus && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-950 border border-emerald-800 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
                <span className="text-xs text-emerald-400 font-medium">Plugin connected</span>
                <span className="text-xs text-zinc-500">·</span>
                <span className="text-xs text-zinc-400">
                  plugin v{pluginStatus.pluginVersion} · model v{pluginStatus.modelVersion}
                </span>
              </div>
            )}
          </div>
          <Link
            href={buildLocalePath("/eidos/opportunity/documentation", locale)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3.5 py-2 text-sm text-emerald-100 outline-none transition hover:border-emerald-200/60 hover:bg-emerald-300/16 focus-visible:ring-2 focus-visible:ring-emerald-300/60"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {copy.header.openOpportunityDocumentation}
          </Link>
        </header>

        {/* Primary decision card */}
        <OpportunityCard decision={decision} />

        {/* Forward curve */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Forward curve
          </h2>
          <p className="text-xs text-zinc-600 mb-4">
            Polish electricity quarterly forward contracts as of {decisionDate}.
            Green marker = target contract ({targetContract}). Purple = annual (Cal).
          </p>
          <ForwardCurveChart
            points={marketSnapshot.points}
            targetContract={targetContract}
          />
        </section>

        {/* Decision boundary */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <ValuationRangeBar
            currentPrice={decision.entryPrice}
            valuation={decision.valuationRange}
            worstCaseLow={decision.minimax.worstCaseLow}
            worstCaseHigh={decision.minimax.worstCaseHigh}
          />

          {/* Metrics summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
            <MiniMetric
              label="Entry price"
              value={`${decision.entryPrice.toFixed(0)} PLN/MWh`}
            />
            <MiniMetric
              label="Central valuation"
              value={`${decision.valuationRange.central.toFixed(0)} PLN/MWh`}
            />
            <MiniMetric
              label="Central discount"
              value={`${centralDiscountSign}${centralDiscount.toFixed(0)} PLN/MWh`}
              highlight={centralDiscount > 0}
            />
            <MiniMetric
              label="Uncertainty interval"
              value={`${decision.valuationRange.lower.toFixed(0)}–${decision.valuationRange.upper.toFixed(0)} PLN/MWh`}
            />
            <MiniMetric
              label="Worst-case valuation"
              value={`${decision.minimax.worstCaseLow.toFixed(0)} PLN/MWh`}
            />
            <MiniMetric
              label="Price vs. worst-case valuation"
              value={`${priceVsWorstCaseSign}${priceVsWorstCase.toFixed(0)} PLN/MWh`}
              highlight={priceVsWorstCase < 0}
            />
          </div>
        </section>

        {/* Why section */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <FuturesDecisionExplanation decision={decision} />
        </section>

        {/* ======================================================= */}
        {/* OUTCOME SECTION — separated from decision               */}
        {/* ======================================================= */}
        <div
          className="border-t-2 border-dashed border-zinc-700 pt-8"
          data-testid="outcome-separator"
        >
          <p className="text-xs uppercase tracking-widest text-zinc-600 mb-6 text-center">
            ↓ post-decision information — not available at {decisionDate} ↓
          </p>
          <OutcomeSection
            decisionPrice={outcome.decisionPrice}
            referencePrice={outcome.referencePrice}
            absoluteChange={outcome.absoluteChange}
            percentageChange={outcome.percentageChange}
            outcomeStatus={outcome.outcomeStatus}
          />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
