"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getEidosCopy,
  getEidosRiskLabel,
  getEidosStrategyLabel,
} from "@/eidos/lib/eidos-i18n";
import {
  RISK_TONE,
  formatEuroCompact,
  formatEuroFull,
  formatPercent,
} from "@/eidos/lib/eidos-format";
import type {
  ProcurementStrategy,
  StrategyEvaluation,
} from "@/eidos/types/eidos";
import type { Locale } from "@/lib/observatory-i18n";

type Props = {
  locale: Locale;
  evaluations: StrategyEvaluation[];
  recommendedStrategy: ProcurementStrategy;
  currentStrategy: ProcurementStrategy;
};

export function DecisionAlternatives({
  locale,
  evaluations,
  recommendedStrategy,
  currentStrategy,
}: Props) {
  const copy = getEidosCopy(locale);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-[18px] border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{copy.alternatives.caption}</caption>
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
              <th scope="col" className="px-3 py-2.5 font-medium">
                {copy.alternatives.headers.strategy}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                {copy.alternatives.expectedCost}
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                {copy.alternatives.headers.risk}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                {copy.alternatives.confidence}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                {copy.alternatives.downside}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                {copy.alternatives.savingsVsWorst}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                {copy.alternatives.rank}
              </th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((evaluation) => {
              const isRecommended = evaluation.strategy === recommendedStrategy;
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
                      {getEidosStrategyLabel(locale, evaluation.strategy)}
                      {isRecommended ? (
                        <Badge variant="cyan">
                          {copy.alternatives.recommendedBadge}
                        </Badge>
                      ) : null}
                      {isCurrent ? (
                        <Badge variant="neutral">
                          {copy.alternatives.currentBadge}
                        </Badge>
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
                      {getEidosRiskLabel(locale, evaluation.risk)}
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
        {copy.alternatives.summary(
          getEidosStrategyLabel(locale, recommendedStrategy),
        )}
      </p>
    </div>
  );
}
