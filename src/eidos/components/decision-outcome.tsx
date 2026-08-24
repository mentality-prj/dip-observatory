"use client";

import { Badge } from "@/components/ui/badge";
import {
  getEidosCopy,
  getEidosOutcomeLabel,
  getEidosStrategyLabel,
} from "@/eidos/lib/eidos-i18n";
import { cn } from "@/lib/utils";
import {
  OUTCOME_TONE,
  formatEuroCompact,
  formatSignedPercent,
} from "@/eidos/lib/eidos-format";
import type { DecisionOutcome } from "@/eidos/types/eidos";
import type { Locale } from "@/lib/observatory-i18n";

type Props = {
  locale: Locale;
  outcomes: DecisionOutcome[];
};

export function DecisionOutcomes({ locale, outcomes }: Props) {
  const copy = getEidosCopy(locale);

  if (outcomes.length === 0) {
    return <p className="text-sm text-slate-400">{copy.outcomes.empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[18px] border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{copy.outcomes.caption}</caption>
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <th scope="col" className="px-3 py-2.5 font-medium">
              {copy.outcomes.headers.date}
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              {copy.outcomes.headers.recommended}
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              {copy.outcomes.headers.executed}
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              {copy.outcomes.headers.expected}
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              {copy.outcomes.headers.actual}
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              {copy.outcomes.headers.variance}
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              {copy.outcomes.headers.outcome}
            </th>
          </tr>
        </thead>
        <tbody>
          {outcomes.map((outcome) => (
            <tr
              key={outcome.date}
              className="border-b border-white/6 last:border-b-0"
            >
              <th
                scope="row"
                className="px-3 py-3 text-left font-normal text-slate-300"
              >
                <time dateTime={outcome.date}>{outcome.date}</time>
              </th>
              <td className="px-3 py-3 text-slate-200">
                {getEidosStrategyLabel(locale, outcome.recommendedStrategy)}
              </td>
              <td className="px-3 py-3 text-slate-200">
                {getEidosStrategyLabel(locale, outcome.executedStrategy)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-slate-300">
                {formatEuroCompact(outcome.expectedCost)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-slate-300">
                {formatEuroCompact(outcome.actualCost)}
              </td>
              <td
                className={cn(
                  "px-3 py-3 text-right tabular-nums",
                  outcome.variancePct > 0
                    ? "text-rose-200"
                    : "text-emerald-200",
                )}
              >
                {formatSignedPercent(outcome.variancePct, 1)}
              </td>
              <td className="px-3 py-3">
                <Badge variant={OUTCOME_TONE[outcome.outcome]}>
                  {getEidosOutcomeLabel(locale, outcome.outcome)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
