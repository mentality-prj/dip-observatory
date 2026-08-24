"use client";

import { useState } from "react";
import { History, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SCENARIO_LABEL,
  STRATEGY_LABEL,
  formatSignedPercent,
} from "@/eidos/lib/eidos-format";
import type {
  DecisionFactor,
  EidosScenario,
  ProcurementStrategy,
} from "@/eidos/types/eidos";

type ReplaySide = {
  scenario: EidosScenario;
  strategy: ProcurementStrategy;
};

type Props = {
  original: ReplaySide;
  current: ReplaySide;
  factors: DecisionFactor[];
};

export function DecisionReplay({ original, current, factors }: Props) {
  const [open, setOpen] = useState(false);
  const changed = original.strategy !== current.strategy;

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="self-start"
      >
        {open ? (
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        ) : (
          <History className="h-4 w-4" aria-hidden="true" />
        )}
        {open ? "Hide replay" : "Replay decision"}
      </Button>

      {open ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ReplayCard
            title="Original decision"
            scenario={original.scenario}
            strategy={original.strategy}
          />
          <ReplayCard
            title="Current scenario"
            scenario={current.scenario}
            strategy={current.strategy}
            highlight
          />
          <div className="sm:col-span-2 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              {changed
                ? "Changed because"
                : "Recommendation held despite"}
            </p>
            {factors.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">
                Assumptions are unchanged from the original decision.
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                {factors.map((factor) => (
                  <li
                    key={factor.label}
                    className="flex items-center gap-2 text-sm text-slate-200"
                  >
                    <span>{factor.label}</span>
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        factor.delta > 0
                          ? "text-amber-200"
                          : "text-emerald-200",
                      )}
                    >
                      {formatSignedPercent(factor.delta)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReplayCard({
  title,
  scenario,
  strategy,
  highlight,
}: {
  title: string;
  scenario: EidosScenario;
  strategy: ProcurementStrategy;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        highlight
          ? "border-cyan-300/30 bg-cyan-300/8"
          : "border-white/8 bg-white/4",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">
        {STRATEGY_LABEL[strategy]}
      </p>
      <p className="text-xs text-slate-500">{SCENARIO_LABEL[scenario]}</p>
    </div>
  );
}
