"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RISK_LABEL,
  RISK_TONE,
  SCENARIO_LABEL,
  STRATEGY_LABEL,
} from "@/eidos/lib/eidos-format";
import type { DecisionHistoryEntry } from "@/eidos/types/eidos";

type Props = {
  entries: DecisionHistoryEntry[];
};

export function DecisionHistory({ entries }: Props) {
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
                {STRATEGY_LABEL[entry.strategy]}
              </span>
              <Badge variant={RISK_TONE[entry.risk]}>
                {RISK_LABEL[entry.risk]}
              </Badge>
              <span className="text-[11px] uppercase tracking-wide text-slate-500">
                {SCENARIO_LABEL[entry.scenario]}
              </span>
            </div>
            {entry.reason ? (
              <p className="mt-0.5 text-xs text-slate-400">
                Reason: {entry.reason}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
