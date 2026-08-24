"use client";

import { ArrowRight, Minus, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { STRATEGY_LABEL, formatSignedPercent } from "@/eidos/lib/eidos-format";
import type {
  DecisionFactor,
  ProcurementStrategy,
} from "@/eidos/types/eidos";

type Props = {
  factors: DecisionFactor[];
  currentStrategy: ProcurementStrategy;
  recommendedStrategy: ProcurementStrategy;
  decisionChanged: boolean;
};

export function DecisionExplanation({
  factors,
  currentStrategy,
  recommendedStrategy,
  decisionChanged,
}: Props) {
  const drivers = factors.filter((factor) => Math.abs(factor.delta) >= 0.005);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-6 text-slate-300">
        {decisionChanged ? (
          <>
            The recommendation moved from{" "}
            <span className="font-medium text-white">
              {STRATEGY_LABEL[currentStrategy]}
            </span>{" "}
            <ArrowRight
              className="mx-1 inline h-4 w-4 text-cyan-300"
              aria-hidden="true"
            />
            <span className="font-medium text-cyan-200">
              {STRATEGY_LABEL[recommendedStrategy]}
            </span>{" "}
            because of the following changes in assumptions:
          </>
        ) : (
          <>
            The current strategy{" "}
            <span className="font-medium text-white">
              {STRATEGY_LABEL[currentStrategy]}
            </span>{" "}
            remains recommended. The factors below did not move the decision:
          </>
        )}
      </p>

      <ul className="flex flex-col gap-2">
        {drivers.length === 0 ? (
          <li className="text-sm text-slate-400">
            No material changes versus the baseline assumptions.
          </li>
        ) : (
          drivers.map((factor) => {
            const rising = factor.delta > 0;
            const Icon = rising
              ? TrendingUp
              : factor.delta < 0
                ? TrendingDown
                : Minus;
            return (
              <li
                key={factor.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/4 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      factor.supportsHedging
                        ? "text-amber-300"
                        : "text-emerald-300",
                    )}
                    aria-hidden="true"
                  />
                  {factor.label}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    factor.supportsHedging ? "text-amber-200" : "text-emerald-200",
                  )}
                >
                  {formatSignedPercent(factor.delta)}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
