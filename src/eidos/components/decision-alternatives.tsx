"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RISK_LABEL,
  RISK_TONE,
  STRATEGY_LABEL,
  formatEuroCompact,
  formatEuroFull,
  formatPercent,
} from "@/eidos/lib/eidos-format";
import type {
  ProcurementStrategy,
  StrategyEvaluation,
} from "@/eidos/types/eidos";

type Props = {
  evaluations: StrategyEvaluation[];
  recommendedStrategy: ProcurementStrategy;
  currentStrategy: ProcurementStrategy;
};

export function DecisionAlternatives({
  evaluations,
  recommendedStrategy,
  currentStrategy,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-[18px] border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Expected cost, risk and confidence for each procurement alternative
            under the selected scenario.
          </caption>
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
              <th scope="col" className="px-3 py-2.5 font-medium">
                Strategy
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                Expected cost
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Risk
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                Confidence
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                Downside
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                Savings vs worst
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                Rank
              </th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((evaluation) => {
              const isRecommended =
                evaluation.strategy === recommendedStrategy;
              const isCurrent = evaluation.strategy === currentStrategy;
              return (
                <tr
                  key={evaluation.strategy}
                  className={cn(
                    "border-b border-white/6 last:border-b-0",
                    isRecommended && "bg-cyan-300/8",
                  )}
                >
                  <th
                    scope="row"
                    className="px-3 py-3 text-left font-medium text-white"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      {STRATEGY_LABEL[evaluation.strategy]}
                      {isRecommended ? (
                        <Badge variant="cyan">Recommended</Badge>
                      ) : null}
                      {isCurrent ? (
                        <Badge variant="neutral">Current</Badge>
                      ) : null}
                    </span>
                  </th>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-200">
                    <span title={formatEuroFull(evaluation.expectedCost)}>
                      {formatEuroCompact(evaluation.expectedCost)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={RISK_TONE[evaluation.risk]}>
                      {RISK_LABEL[evaluation.risk]}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-300">
                    {formatPercent(evaluation.confidence)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-300">
                    {formatEuroCompact(evaluation.downside)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-200">
                    {evaluation.expectedSavings > 0
                      ? formatEuroCompact(evaluation.expectedSavings)
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-400">
                    #{evaluation.rank}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        {STRATEGY_LABEL[recommendedStrategy]} is{" "}
        <span className="text-slate-300">
          recommended under current assumptions
        </span>
        , not presented as an absolute optimum. Lower risk-adjusted cost wins;
        the trade-off is shown so a trader can override it.
      </p>
    </div>
  );
}
