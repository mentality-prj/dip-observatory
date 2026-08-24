"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  OUTCOME_LABEL,
  OUTCOME_TONE,
  STRATEGY_LABEL,
  formatEuroCompact,
  formatSignedPercent,
} from "@/eidos/lib/eidos-format";
import type { DecisionOutcome } from "@/eidos/types/eidos";

type Props = {
  outcomes: DecisionOutcome[];
};

export function DecisionOutcomes({ outcomes }: Props) {
  if (outcomes.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No tracked outcomes yet for this client.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[18px] border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">
          Recommended versus executed strategy and expected versus actual cost
          for tracked historical decisions.
        </caption>
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <th scope="col" className="px-3 py-2.5 font-medium">
              Date
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Recommended
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Executed
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              Expected
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              Actual
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              Variance
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Outcome
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
                {STRATEGY_LABEL[outcome.recommendedStrategy]}
              </td>
              <td className="px-3 py-3 text-slate-200">
                {STRATEGY_LABEL[outcome.executedStrategy]}
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
                  {OUTCOME_LABEL[outcome.outcome]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
