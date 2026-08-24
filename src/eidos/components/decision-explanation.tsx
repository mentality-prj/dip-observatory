"use client";

import { ArrowRight, Minus, TrendingDown, TrendingUp } from "lucide-react";

import {
  getEidosCopy,
  getEidosDecisionFactorLabel,
  getEidosStrategyLabel,
} from "@/eidos/lib/eidos-i18n";
import { cn } from "@/lib/utils";
import { formatSignedPercent } from "@/eidos/lib/eidos-format";
import type { DecisionFactor, ProcurementStrategy } from "@/eidos/types/eidos";
import type { Locale } from "@/lib/observatory-i18n";

type Props = {
  locale: Locale;
  factors: DecisionFactor[];
  currentStrategy: ProcurementStrategy;
  recommendedStrategy: ProcurementStrategy;
  decisionChanged: boolean;
};

export function DecisionExplanation({
  locale,
  factors,
  currentStrategy,
  recommendedStrategy,
  decisionChanged,
}: Props) {
  const copy = getEidosCopy(locale);
  const drivers = factors.filter((factor) => Math.abs(factor.delta) >= 0.005);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-6 text-slate-300">
        {decisionChanged ? (
          <>
            {copy.explanation.changedLead}{" "}
            <span className="font-medium text-white">
              {getEidosStrategyLabel(locale, currentStrategy)}
            </span>{" "}
            <ArrowRight
              className="mx-1 inline h-4 w-4 text-cyan-300"
              aria-hidden="true"
            />
            <span className="font-medium text-cyan-200">
              {getEidosStrategyLabel(locale, recommendedStrategy)}
            </span>{" "}
            {copy.explanation.changedTail}
          </>
        ) : (
          <>
            {copy.explanation.stableLead}{" "}
            <span className="font-medium text-white">
              {getEidosStrategyLabel(locale, currentStrategy)}
            </span>{" "}
            {copy.explanation.stableTail}
          </>
        )}
      </p>

      <ul className="flex flex-col gap-2">
        {drivers.length === 0 ? (
          <li className="text-sm text-slate-400">
            {copy.explanation.noMaterialChanges}
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
                  {getEidosDecisionFactorLabel(locale, factor.label)}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    factor.supportsHedging
                      ? "text-amber-200"
                      : "text-emerald-200",
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
