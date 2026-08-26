"use client";

/**
 * EIDOS Futures Opportunity — primary research view.
 *
 * Orchestrates the full display pipeline:
 *   1. Decision summary (OpportunityCard)
 *   2. Forward Curve chart
 *   3. Why this opportunity (FuturesDecisionExplanation)
 *   4. Decision Boundary (ValuationRangeBar)
 *   5. Outcome section (post-decision, clearly separated)
 *
 * LOOK-AHEAD PROTECTION:
 *   The decision is computed purely from pre-decision snapshot data.
 *   The 558 PLN outcome is imported separately and rendered only AFTER
 *   the decision section, with explicit visual separation.
 */

import { useMemo } from "react";

import {
  EIDOS_DECISION_DATE,
  EIDOS_MARKET_SNAPSHOT,
  EIDOS_Q1_2027_HISTORY,
  EIDOS_Q1_2027_OUTCOME,
  EIDOS_TARGET_CONTRACT,
} from "@/eidos/data/synthetic-futures-data";
import { computeHedgeDecision, computeOutcome } from "@/eidos/lib/hedge-decision";
import { OpportunityCard } from "@/eidos/components/opportunity-card";
import { ForwardCurveChart } from "@/eidos/components/forward-curve-chart";
import { ValuationRangeBar } from "@/eidos/components/valuation-range";
import { FuturesDecisionExplanation } from "@/eidos/components/futures-decision-explanation";

// ---------------------------------------------------------------------------
// Outcome display
// ---------------------------------------------------------------------------

function OutcomeSection({
  decisionPrice,
  referencePrice,
}: {
  decisionPrice: number;
  referencePrice: number;
}) {
  const outcome = computeOutcome(decisionPrice, referencePrice);
  const sign = outcome.absoluteChange >= 0 ? "+" : "";
  const pct = (outcome.percentageChange * 100).toFixed(2);

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
            {sign}{outcome.absoluteChange.toFixed(0)} PLN
          </p>
          <p className="text-xs text-zinc-500">{sign}{pct}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Outcome</p>
          <p
            className={`text-xl font-bold ${
              outcome.outcomeStatus === "FAVOURABLE"
                ? "text-emerald-400"
                : outcome.outcomeStatus === "UNFAVOURABLE"
                  ? "text-red-400"
                  : "text-zinc-400"
            }`}
          >
            {outcome.outcomeStatus}
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

export function FuturesOpportunityView() {
  // Decision is computed exclusively from pre-decision snapshot
  const decision = useMemo(
    () =>
      computeHedgeDecision(
        EIDOS_MARKET_SNAPSHOT,
        EIDOS_TARGET_CONTRACT,
        EIDOS_Q1_2027_HISTORY,
        EIDOS_DECISION_DATE,
      ),
    [],
  );

  // Outcome data is extracted ONLY for the separate outcome section
  // It does NOT influence the decision above
  const { outcome } = EIDOS_Q1_2027_OUTCOME;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header>
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
              {EIDOS_DECISION_DATE}
            </span>
          </div>
        </header>

        {/* Primary decision card */}
        <OpportunityCard decision={decision} />

        {/* Forward curve */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Forward curve
          </h2>
          <p className="text-xs text-zinc-600 mb-4">
            Polish electricity quarterly forward contracts as of {EIDOS_DECISION_DATE}.
            Green marker = target contract ({EIDOS_TARGET_CONTRACT}). Purple = annual (Cal).
          </p>
          <ForwardCurveChart
            points={EIDOS_MARKET_SNAPSHOT.points}
            targetContract={EIDOS_TARGET_CONTRACT}
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
              label="Robust valuation"
              value={`${decision.valuationRange.lower.toFixed(0)} – ${decision.valuationRange.upper.toFixed(0)} PLN`}
            />
            <MiniMetric
              label="Upside to central"
              value={`${decision.upside.toFixed(0)} PLN`}
              highlight={decision.upside > 0}
            />
            <MiniMetric
              label="Worst-case low"
              value={`${decision.minimax.worstCaseLow.toFixed(0)} PLN`}
            />
            <MiniMetric
              label="Robust discount"
              value={`${decision.minimax.robustDiscount.toFixed(0)} PLN`}
              highlight={decision.minimax.robustDiscount > 0}
            />
            <MiniMetric
              label="Robustness"
              value={decision.robustness}
              highlight={decision.robustness === "HIGH"}
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
            ↓ post-decision information — not available at {EIDOS_DECISION_DATE} ↓
          </p>
          <OutcomeSection
            decisionPrice={outcome.decisionPrice}
            referencePrice={outcome.referencePrice}
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
