"use client";

import { Badge } from "@/components/ui/badge";
import {
  getEidosCopy,
  getEidosHistoryReason,
  getEidosRiskLabel,
  getEidosScenarioLabel,
  getEidosStrategyLabel,
} from "@/eidos/lib/eidos-i18n";
import { cn } from "@/lib/utils";
import { RISK_TONE } from "@/eidos/lib/eidos-format";
import type { DecisionHistoryEntry } from "@/eidos/types/eidos";
import type { Locale } from "@/lib/observatory-i18n";

type Props = {
  locale: Locale;
  entries: DecisionHistoryEntry[];
};

export function DecisionHistory({ locale, entries }: Props) {
  const copy = getEidosCopy(locale);

  return (
    <ol className="relative flex flex-col gap-3 border-l border-white/10 pl-5">
      {entries.map((entry, index) => {
        const previous = entries[index - 1];
        const strategyChanged =
          previous !== undefined && previous.strategy !== entry.strategy;
        return (
          <li key={entry.date} className="relative">
            <span
              className={cn(
                "absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-[#0a0f1c]",
                strategyChanged ? "bg-cyan-300" : "bg-slate-500",
              )}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-2">
              <time
                dateTime={entry.date}
                className="text-xs font-medium uppercase tracking-wide text-slate-400"
              >
                {entry.date}
              </time>
              <span className="text-sm font-medium text-white">
                {getEidosStrategyLabel(locale, entry.strategy)}
              </span>
              <Badge variant={RISK_TONE[entry.risk]}>
                {getEidosRiskLabel(locale, entry.risk)}
              </Badge>
              <span className="text-[11px] uppercase tracking-wide text-slate-500">
                {getEidosScenarioLabel(locale, entry.scenario)}
              </span>
            </div>
            {entry.reason ? (
              <p className="mt-0.5 text-xs text-slate-400">
                {copy.history.reasonPrefix}:{" "}
                {getEidosHistoryReason(locale, entry.reason)}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
