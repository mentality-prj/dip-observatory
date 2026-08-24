"use client";

import { AlertTriangle, Filter, ShieldAlert, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DecisionStatus, PortfolioSummary } from "@/eidos/types/eidos";

type Props = {
  summary: PortfolioSummary;
  activeStatusFilter: DecisionStatus | "ALL";
  onSelectStatus: (status: DecisionStatus | "ALL") => void;
};

type Metric = {
  key: DecisionStatus | "ALL";
  label: string;
  value: number;
  tone: "neutral" | "emerald" | "cyan" | "amber" | "rose";
  hint: string;
  icon?: typeof AlertTriangle;
  emphasize?: boolean;
};

const toneRing: Record<Metric["tone"], string> = {
  neutral: "border-white/12",
  emerald: "border-emerald-300/30",
  cyan: "border-cyan-300/30",
  amber: "border-amber-300/40",
  rose: "border-rose-300/40",
};

const toneText: Record<Metric["tone"], string> = {
  neutral: "text-slate-100",
  emerald: "text-emerald-200",
  cyan: "text-cyan-100",
  amber: "text-amber-200",
  rose: "text-rose-200",
};

const toneActive: Record<Metric["tone"], string> = {
  neutral: "bg-white/10",
  emerald: "bg-emerald-300/10",
  cyan: "bg-cyan-300/10",
  amber: "bg-amber-300/12",
  rose: "bg-rose-300/12",
};

export function EidosOverview({
  summary,
  activeStatusFilter,
  onSelectStatus,
}: Props) {
  const metrics: Metric[] = [
    {
      key: "ALL",
      label: "Total clients",
      value: summary.total,
      tone: "neutral",
      hint: `${summary.needsAttention} need attention`,
      icon: Filter,
    },
    {
      key: "STABLE",
      label: "Stable",
      value: summary.stable,
      tone: "emerald",
      hint: "No change · not high risk",
    },
    {
      key: "STRATEGY_CHANGED",
      label: "Strategy changed",
      value: summary.strategyChanged,
      tone: "cyan",
      hint: "Recommendation differs from contract",
      icon: TrendingUp,
      emphasize: true,
    },
    {
      key: "HIGH_RISK",
      label: "High risk",
      value: summary.highRisk,
      tone: "rose",
      hint: "Elevated exposure",
      icon: ShieldAlert,
      emphasize: true,
    },
    {
      key: "ACTION_REQUIRED",
      label: "Action required",
      value: summary.actionRequired,
      tone: "amber",
      hint: "High risk · decision changed",
      icon: AlertTriangle,
      emphasize: true,
    },
  ];

  return (
    <section aria-label="Portfolio summary">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => {
          const isActive = activeStatusFilter === metric.key;
          const Icon = metric.icon;
          return (
            <Card
              key={metric.key}
              className={cn(
                "rounded-[20px] p-0 transition",
                toneRing[metric.tone],
                isActive && toneActive[metric.tone],
              )}
            >
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelectStatus(metric.key)}
                className={cn(
                  "flex h-full w-full flex-col gap-1 rounded-[20px] p-4 text-left outline-none transition",
                  "focus-visible:ring-2 focus-visible:ring-cyan-300/60",
                  "hover:bg-white/5",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {metric.label}
                  </span>
                  {Icon ? (
                    <Icon
                      className={cn("h-4 w-4", toneText[metric.tone])}
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-3xl font-semibold tabular-nums",
                    toneText[metric.tone],
                  )}
                >
                  {metric.value}
                </span>
                <span className="text-[11px] leading-4 text-slate-500">
                  {metric.hint}
                </span>
              </button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
