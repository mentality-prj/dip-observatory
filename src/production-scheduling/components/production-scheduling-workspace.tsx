"use client";

import { useState, useMemo, useRef, useEffect, useContext, createContext, useTransition, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  RotateCcw,
  Zap,
  Play,
  Siren,
  Search,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { buildLocalePath, SUPPORTED_LOCALES, type Locale } from "@/lib/observatory-i18n";
import {
  getProductionSchedulingCopy,
  type ProductionSchedulingCopy,
} from "@/production-scheduling/lib/production-scheduling-i18n";
import {
  runSchedulingEngine,
  DEFAULT_COST_CONFIG,
  CONSTRAINT_RULES,
} from "@/production-scheduling/lib/engine";
import { DEFAULT_SCENARIO, URGENT_ORDER } from "@/production-scheduling/data/scenario";
import {
  computeSchedulingSensitivity,
  computeSchedulingTraceDiff,
  computeSchedulingDecisionDelta,
  computeKeepCurrentTraceDiff,
} from "@/production-scheduling/lib/scenario-lab-helpers";
import {
  buildSchedulingScenario,
  buildCostConfigOverride,
  BASELINE_WHAT_IF,
  SCENARIO_PRESETS,
  type WhatIfState,
} from "@/production-scheduling/lib/what-if";
import {
  buildPdrScenario,
  getPdrPreDisruptionDecision,
  getOrdersAtRisk,
  computeDisruptionSensitivity,
  BASELINE_DISRUPTION_WHAT_IF,
  PDR_MACHINE_B_ORDER_IDS,
  type DisruptionWhatIfState,
} from "@/production-scheduling/data/production-disruption-scenario";
import type {
  FeasibilityStatus,
  ScheduledTask,
  SchedulingDecisionResponse,
  SchedulingScenario,
  StrategyEvaluation,
  StrategyId,
} from "@/production-scheduling/types";

// ---------------------------------------------------------------------------
// i18n context — all sub-components read copy via usePSCopy()
// ---------------------------------------------------------------------------

const PSCopyContext = createContext<ProductionSchedulingCopy>(
  getProductionSchedulingCopy("en"),
);

function usePSCopy() {
  return useContext(PSCopyContext);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function eur(v: number) {
  return `€${Math.round(v).toLocaleString("en-US")}`;
}

function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

function hrs(v: number) {
  return `${v.toFixed(1)}h`;
}

// ---------------------------------------------------------------------------
// Colour maps
// ---------------------------------------------------------------------------

/** Static Tailwind class strings per strategy — avoids purged dynamic classes. */
const STRATEGY_CLASSES: Record<StrategyId, { border: string; headerText: string; titleText: string }> = {
  REDISTRIBUTE_TO_OTHER_LINES: {
    border: "border-emerald-300/20",
    headerText: "text-emerald-400",
    titleText: "text-emerald-200",
  },
  PRIORITIZE_URGENT_ORDERS: {
    border: "border-cyan-300/20",
    headerText: "text-cyan-400",
    titleText: "text-cyan-200",
  },
  DELAY_LOW_PRIORITY_ORDERS: {
    border: "border-amber-300/20",
    headerText: "text-amber-400",
    titleText: "text-amber-200",
  },
  KEEP_CURRENT_SCHEDULE: {
    border: "border-rose-300/20",
    headerText: "text-rose-400",
    titleText: "text-rose-200",
  },
  USE_OVERTIME: {
    border: "border-violet-300/20",
    headerText: "text-violet-400",
    titleText: "text-violet-200",
  },
};

/** Static cell text class per strategy for the alternatives table. */
const STRATEGY_CELL_TEXT: Record<StrategyId, string> = {
  REDISTRIBUTE_TO_OTHER_LINES: "text-emerald-300",
  PRIORITIZE_URGENT_ORDERS: "text-cyan-300",
  DELAY_LOW_PRIORITY_ORDERS: "text-amber-300",
  KEEP_CURRENT_SCHEDULE: "text-rose-300",
  USE_OVERTIME: "text-violet-300",
};

const FEASIBILITY_COLOUR: Record<FeasibilityStatus, "emerald" | "rose"> = {
  FEASIBLE: "emerald",
  INFEASIBLE: "rose",
};

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
      {children}
    </p>
  );
}

function Disclaimer({ text }: { text?: string }) {
  const copy = usePSCopy();
  return (
    <div
      data-testid="synthetic-disclaimer"
      className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-2"
    >
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-amber-200/80">
        {text ?? copy.disclaimer.default}
      </p>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent = "neutral",
  sub,
}: {
  label: string;
  value: string;
  accent?: "rose" | "amber" | "emerald" | "cyan" | "violet" | "neutral";
  sub?: string;
}) {
  const c = {
    rose: "text-rose-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    cyan: "text-cyan-300",
    violet: "text-violet-300",
    neutral: "text-white",
  }[accent];
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold", c)}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function CollapseSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-900/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && <div className="border-t border-white/8 px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Disruption panel
// ---------------------------------------------------------------------------

function DisruptionPanel({ scenario }: { scenario: SchedulingScenario }) {
  const copy = usePSCopy();
  const line = scenario.lines.find((l) => l.id === scenario.disruption.affectedLineId);
  const before = line?.normalHoursPerDay ?? 8;
  const after = before * (1 - scenario.disruption.capacityReductionFactor);
  const hoursLost =
    (before - after) * scenario.disruption.durationDays;
  const hoursRemaining = after * scenario.disruption.durationDays;

  return (
    <Card className="border-rose-300/20 bg-rose-900/10" data-testid="disruption-panel">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <span className="text-sm font-semibold uppercase tracking-widest text-rose-300">
            {copy.disruption.eyebrow}
          </span>
          <Badge variant="rose">{copy.disruption.badge}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox
            label={`${line?.name ?? "Affected line"}`}
            value={`${before}h → ${after.toFixed(0)}h/day`}
            accent="rose"
          />
          <StatBox
            label={copy.disruption.capacityReduction}
            value={`−${(scenario.disruption.capacityReductionFactor * 100).toFixed(0)}%`}
            accent="rose"
          />
          <StatBox
            label={copy.disruption.duration}
            value={`${scenario.disruption.durationDays} ${copy.scenarioLab.controls.dayUnit}`}
            sub={`= ${hoursLost.toFixed(0)}h machine-hours lost`}
            accent="amber"
          />
          <StatBox
            label={copy.disruption.hoursLost}
            value={`${hoursLost.toFixed(0)}h`}
            accent="amber"
            sub={`${hoursRemaining.toFixed(0)}h ${copy.disruption.hoursRemaining}`}
          />
        </div>
        {scenario.disruption.reason && (
          <p className="mt-3 text-xs text-slate-500">
            {copy.disruption.reason}: {scenario.disruption.reason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Schedule visualisation (compact timeline per line)
// ---------------------------------------------------------------------------

const LINE_TASK_COLOURS: Record<string, string> = {
  CRITICAL: "bg-rose-500/70 border-rose-400/50",
  HIGH: "bg-cyan-500/60 border-cyan-400/50",
  NORMAL: "bg-slate-600/70 border-slate-500/50",
  LOW: "bg-slate-700/70 border-slate-600/50",
};

function TaskBlock({ task, maxHours }: { task: ScheduledTask; maxHours: number }) {
  const left = (task.startHour / maxHours) * 100;
  const width = ((task.endHour - task.startHour) / maxHours) * 100;
  const color = LINE_TASK_COLOURS[task.priority] ?? "bg-slate-600/70";
  const isDelayed = task.status === "DELAYED";

  return (
    <div
      className={cn(
        "absolute top-1 bottom-1 rounded border text-[9px] font-medium leading-tight overflow-hidden px-1 flex flex-col justify-center",
        color,
        isDelayed && "ring-1 ring-rose-500/60",
      )}
      style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
      title={`${task.orderName} (${task.priority}) — Day ${task.day} ${task.startHour.toFixed(1)}h–${task.endHour.toFixed(1)}h${isDelayed ? ` ⚠ ${task.daysLate}d late` : ""}`}
    >
      <span className="truncate text-white/90">{task.orderId.replace("ORDER-", "#")}</span>
      {isDelayed && <span className="text-rose-300">⚠</span>}
    </div>
  );
}

function ScheduleTimeline({ tasks, lineIds, days, maxHoursPerDay }: {
  tasks: ScheduledTask[];
  lineIds: string[];
  days: number;
  maxHoursPerDay: number;
}) {
  const lineNames: Record<string, string> = {
    "LINE-A": "Line A",
    "LINE-B": "Line B",
    "LINE-C": "Line C",
  };

  return (
    <div className="space-y-4">
      {lineIds.map((lineId) => {
        return (
          <div key={lineId}>
            <p className="mb-1 text-xs font-semibold text-slate-400">
              {lineNames[lineId] ?? lineId}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
                const dayTasks = tasks.filter(
                  (t) => t.lineId === lineId && t.day === day,
                );
                return (
                  <div key={day} className="flex-1">
                    <p className="mb-0.5 text-center text-[9px] text-slate-600">D{day}</p>
                    <div className="relative h-8 rounded bg-slate-800/60">
                      {dayTasks.map((t) => (
                        <TaskBlock key={t.orderId} task={t} maxHours={maxHoursPerDay} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-rose-500/70" />CRITICAL</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-cyan-500/60" />HIGH</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-slate-600/70" />NORMAL</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-slate-700/70" />LOW</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-3 rounded ring-1 ring-rose-500/60" />Delayed ⚠</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recommended strategy card
// ---------------------------------------------------------------------------

function RecommendedStrategyCard({
  result,
}: {
  result: SchedulingDecisionResponse;
}) {
  const copy = usePSCopy();
  const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
  const baseline = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
  if (!rec) return null;

  const cls = STRATEGY_CLASSES[result.recommendedStrategy];
  const lineIds = [...new Set(rec.schedule.map((t) => t.lineId))].sort();

  return (
    <Card className={cls.border} data-testid="decision-result">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${cls.headerText}`}>
              {copy.recommended.eyebrow}
            </p>
            <CardTitle className={`mt-1 text-xl ${cls.titleText}`} data-testid="decision-strategy-label">
              {rec.strategyLabel.toUpperCase()}
            </CardTitle>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{copy.recommended.avoidedCostLabel}</p>
            <p className="text-2xl font-bold text-emerald-300">{eur(result.avoidedCostVsBaseline)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox
            label={copy.recommended.ordersOnTime}
            value={`${rec.onTimeCount} / ${rec.totalOrders}`}
            accent="emerald"
          />
          <StatBox
            label={copy.recommended.ordersDelayed}
            value={`${rec.delayedCount}`}
            accent={rec.delayedCount > 0 ? "amber" : "emerald"}
          />
          <StatBox
            label={copy.recommended.totalImpact}
            value={eur(rec.financialImpact.totalCost)}
            accent="amber"
            sub={`vs ${baseline ? eur(baseline.financialImpact.totalCost) : "—"} current`}
          />
          <StatBox
            label={copy.recommended.capacityUtilisation}
            value={pct(rec.score.capacityUtilization)}
            accent="cyan"
          />
        </div>

        <div>
          <SectionLabel>{copy.recommended.productionSchedule}</SectionLabel>
          <ScheduleTimeline
            tasks={rec.schedule}
            lineIds={lineIds}
            days={DEFAULT_SCENARIO.planningHorizonDays}
            maxHoursPerDay={10}
          />
        </div>

        {result.avoidedCostVsBaseline > 0 && (
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-900/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              {copy.recommended.avoidedCostHeading}
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">
              {eur(result.avoidedCostVsBaseline)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {copy.recommended.avoidedCostComparedTo}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Financial impact comparison
// ---------------------------------------------------------------------------

function FinancialImpactPanel({ result }: { result: SchedulingDecisionResponse }) {
  const keep = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
  const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
  if (!rec) return null;

  const copy = usePSCopy();
  const r = copy.financial.rows;
  const rows: Array<{ label: string; keep: number; rec: number }> = [
    { label: r.delayCost, keep: keep?.financialImpact.delayCost ?? 0, rec: rec.financialImpact.delayCost },
    { label: r.overtimeCost, keep: keep?.financialImpact.overtimeCost ?? 0, rec: rec.financialImpact.overtimeCost },
    { label: r.setupCost, keep: keep?.financialImpact.setupCost ?? 0, rec: rec.financialImpact.setupCost },
    { label: r.unusedCapacityCost, keep: keep?.financialImpact.unusedCapacityCost ?? 0, rec: rec.financialImpact.unusedCapacityCost },
    { label: r.totalCost, keep: keep?.financialImpact.totalCost ?? 0, rec: rec.financialImpact.totalCost },
    { label: r.revenueAtRisk, keep: keep?.financialImpact.revenueAtRisk ?? 0, rec: rec.financialImpact.revenueAtRisk },
  ];

  return (
    <Card data-testid="financial-impact">
      <CardHeader>
        <CardTitle className="text-base">{copy.financial.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 text-left text-xs text-slate-400" />
                <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-rose-400">
                  {copy.financial.currentPlan}
                </th>
                <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  {rec.strategyLabel}
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {copy.financial.delta}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const delta = Math.round(row.rec) - Math.round(row.keep);
                const isBetter = delta < 0;
                const isTotal = i === rows.length - 2;
                const isRevenue = i === rows.length - 1;
                const slug = row.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                const deltaText = delta === 0 ? eur(0) : `${delta < 0 ? "−" : "+"}${eur(Math.abs(delta))}`;
                return (
                  <tr
                    key={slug}
                    className={cn(
                      "border-b border-white/5",
                      isTotal && "font-semibold",
                      isRevenue && "text-amber-300/80",
                    )}
                  >
                    <td className="py-2 pr-4 text-slate-400">{row.label}</td>
                    <td className="py-2 pr-4 text-right text-rose-300">
                      <span data-testid={`financial-keep-${slug}`}>
                        {eur(row.keep)}
                      </span>
                    </td>
                    <td className={cn("py-2 pr-4 text-right", isBetter ? "text-emerald-300" : "text-slate-300")}>
                      <span data-testid={`financial-rec-${slug}`}>
                        {eur(row.rec)}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-2 text-right text-xs",
                        isBetter ? "text-emerald-400" : delta > 0 ? "text-rose-400" : "text-slate-500",
                      )}
                    >
                      <span data-testid={`financial-delta-${slug}`}>
                        {deltaText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Alternative schedules comparison
// ---------------------------------------------------------------------------

function AlternativesTable({ result }: { result: SchedulingDecisionResponse }) {
  const copy = usePSCopy();
  const h = copy.alternatives.headers;
  return (
    <Card data-testid="alternative-schedules">
      <CardHeader>
        <CardTitle className="text-base">{copy.alternatives.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {[h.strategy, h.feasibility, h.ordersOnTime, h.delayed, h.totalImpact, h.score, ""].map((hdr) => (
                  <th key={hdr} className="py-2 pr-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {hdr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.strategies.map((s) => {
                const isRec = s.strategyId === result.recommendedStrategy;
                return (
                  <tr
                    key={s.strategyId}
                    className="border-b border-white/5"
                    data-testid={isRec ? "alternative-recommended-row" : undefined}
                  >
                    <td className={cn("py-2 pr-3 font-medium", isRec && STRATEGY_CELL_TEXT[s.strategyId])}>
                      {s.strategyLabel}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant={FEASIBILITY_COLOUR[s.feasibility]}>
                        {s.feasibility === "FEASIBLE" ? copy.alternatives.feasible : copy.alternatives.infeasible}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-slate-300">
                      {s.feasibility === "FEASIBLE" ? `${s.onTimeCount}/${s.totalOrders}` : "—"}
                    </td>
                    <td className={cn("py-2 pr-3", s.delayedCount > 0 ? "text-amber-300" : "text-slate-400")}>
                      {s.feasibility === "FEASIBLE" ? s.delayedCount : "—"}
                    </td>
                    <td className="py-2 pr-3 text-slate-300">
                      {s.feasibility === "FEASIBLE" ? eur(s.financialImpact.totalCost) : "—"}
                    </td>
                    <td className="py-2 pr-3 text-slate-300">
                      {s.feasibility === "FEASIBLE" ? s.score.composite.toFixed(4) : "—"}
                    </td>
                    <td className="py-2">
                      {isRec ? (
                        <Badge variant="emerald" data-testid="alternative-recommended-badge">
                          {copy.alternatives.recommended}
                        </Badge>
                      ) : s.feasibility === "INFEASIBLE" ? (
                        <span className="text-xs text-rose-400">
                          {s.blockingConstraints[0] ?? copy.alternatives.blocking}
                        </span>
                      ) : (() => {
                          const recStrategy = result.strategies.find(
                            (x) => x.strategyId === result.recommendedStrategy,
                          );
                          const costDiff =
                            Math.round(s.financialImpact.totalCost) -
                            Math.round(recStrategy?.financialImpact.totalCost ?? 0);
                          if (costDiff === 0) {
                            const altScore = s.score.composite;
                            const recScore = recStrategy?.score.composite ?? 0;
                            if (altScore < recScore) {
                              return (
                                <span
                                  className="text-xs text-slate-500"
                                  data-testid="alternative-same-cost"
                                >
                                  Same total impact · score {altScore.toFixed(4)} vs{" "}
                                  {recScore.toFixed(4)}
                                </span>
                              );
                            }
                            return (
                              <span
                                className="text-xs text-slate-500"
                                data-testid="alternative-same-cost"
                              >
                                Same total impact
                              </span>
                            );
                          }
                          return (
                            <span className="text-xs text-slate-500">
                              {costDiff > 0 ? `${eur(costDiff)} higher cost` : `${eur(-costDiff)} lower cost`}
                            </span>
                          );
                        })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Why this schedule?
// ---------------------------------------------------------------------------

function WhyThisSchedule({ result }: { result: SchedulingDecisionResponse }) {
  const copy = usePSCopy();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{copy.alternatives.whyTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.explanation.reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-3">
            {r.direction === "positive" ? (
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-200">{r.label}</p>
              <p className="text-xs text-slate-500">{r.evidence}</p>
            </div>
          </div>
        ))}
        {result.explanation.rejectedStrategies.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-white/8 pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Rejected alternatives
            </p>
            {result.explanation.rejectedStrategies.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-500/60" />
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-400">{r.strategyId.replace(/_/g, " ")}: </span>
                  {r.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Assumptions panel
// ---------------------------------------------------------------------------

function AssumptionsPanel({ isDisruptionScenario = false }: { isDisruptionScenario?: boolean }) {
  const copy = usePSCopy();
  const criticalRows: [string, string][] = isDisruptionScenario
    ? [
        ["Critical order (PDR-101)", "Double Carport Frame, deadline: Day 2, penalty €1,500/day"],
        ["Critical order (PDR-104)", "Pergola Assembly, deadline: Day 1, penalty €2,000/day"],
        ["Disruption (scenario)", "Machine B fully offline — Day 1 equipment failure"],
      ]
    : [
        ["Critical order (#101)", "Premium Pergola, deadline: Day 1, penalty €2,000/day"],
        ["Critical order (#102)", "Double Carport, deadline: Day 2, penalty €1,500/day"],
        ["Disruption (baseline)", "Line B −25% for 2 days (maintenance)"],
      ];
  return (
    <CollapseSection title={copy.assumptions.title}>
      <div className="space-y-3 text-xs text-slate-400">
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-amber-200/80">
          {copy.disclaimer.default}
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-white/5">
            {[
              ["Planning horizon", "5 production days"],
              ["Shift length (normal)", "8 hours / line / day"],
              ["Overtime capacity", "+2 hours / line / day (if enabled)"],
              ["Line operating cost", "€120 / hour"],
              ["Overtime cost", "€180 / hour (configurable in Scenario Lab)"],
              ["Setup / changeover cost", "€80 / hour"],
              ["Unused capacity cost (opportunity)", "€40 / hour"],
              ["Line A compatible products", "Pergola, Carport"],
              ["Line B compatible products", "Pergola, Awning, Screen"],
              ["Line C compatible products", "All product types"],
              ["Delay penalties", "Order-specific (€60 – €2,000 / day)"],
              ...criticalRows,
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="py-1.5 pr-4 text-slate-500">{k}</td>
                <td className="py-1.5 font-medium text-slate-300">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapseSection>
  );
}

// ---------------------------------------------------------------------------
// Audit trail panel
// ---------------------------------------------------------------------------

function AuditTrailPanel({ result }: { result: SchedulingDecisionResponse }) {
  const copy = usePSCopy();
  const a = result.auditTrail;
  const f = copy.audit.fields;
  return (
    <CollapseSection title={copy.audit.title}>
      <div className="space-y-2 font-mono text-[11px] text-slate-400">
        {[
          [f.decisionId, a.decisionId],
          [f.scenarioId, a.scenarioId],
          [f.computedAt, a.computedAt],
          [f.engineVersion, a.engineVersion],
          [f.configVersion, a.configVersion],
          [f.decisionStatus, a.decisionStatus],
          [f.recommendedStrategy, a.recommendedStrategy],
          [f.strategiesEvaluated, a.strategiesEvaluated.join(", ")],
          [f.rulesExecuted, a.rulesExecuted.join(", ")],
          [f.totalImpact, eur(a.totalFinancialImpact)],
          [f.avoidedCost, eur(a.avoidedCostVsBaseline)],
          [f.source, a.source],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-4">
            <span className="w-48 flex-shrink-0 text-slate-600">{k}</span>
            <span className="break-all text-slate-300">{v}</span>
          </div>
        ))}
      </div>
    </CollapseSection>
  );
}

// ---------------------------------------------------------------------------
// Decision trace panel
// ---------------------------------------------------------------------------

function DecisionTracePanel({ result }: { result: SchedulingDecisionResponse }) {
  const copy = usePSCopy();
  const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
  if (!rec) return null;

  return (
    <CollapseSection title={copy.decisionTrace.title}>
      <div className="space-y-2">
        <p className="text-xs text-slate-500 mb-4">
          Constraint evaluation for the recommended strategy:{" "}
          <span className="font-semibold text-slate-300">{rec.strategyLabel}</span>
        </p>
        {rec.constraintResults.map((r) => {
          const rule = CONSTRAINT_RULES.find((cr) => cr.id === r.ruleId);
          return (
            <div
              key={r.ruleId}
              className={cn(
                "rounded-xl border px-4 py-3",
                r.passed
                  ? "border-emerald-300/20 bg-emerald-900/10"
                  : "border-rose-300/20 bg-rose-900/10",
              )}
            >
              <div className="flex items-start gap-3">
                {r.passed ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">{r.ruleName}</p>
                    <span className="text-xs text-slate-500">{r.ruleId}</span>
                    {rule?.hard && (
                      <Badge variant="rose" className="text-[9px]">
                        Hard
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{r.evidence}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CollapseSection>
  );
}

// ---------------------------------------------------------------------------
// WHAT IF? — Simulation trigger card
// ---------------------------------------------------------------------------

type SimulationStep = "idle" | "event" | "impact" | "decision" | "complete";

function UrgentOrderTriggerCard({ onSimulate }: { onSimulate: () => void }) {
  const copy = usePSCopy();
  const u = copy.urgentOrder;
  return (
    <Card className="border-violet-300/20 bg-violet-900/10">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-400">
              {u.eyebrow}
            </p>
            <h2 className="text-lg font-bold text-white">
              {u.title}
            </h2>
            <p className="text-sm text-slate-400">
              {u.description}
            </p>
          </div>
          <button
            onClick={onSimulate}
            data-testid="simulate-urgent-order"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/20 px-5 py-2.5 text-sm font-semibold text-violet-200 outline-none transition hover:border-violet-400/60 hover:bg-violet-500/30 focus-visible:ring-2 focus-visible:ring-violet-400/60"
          >
            <Play className="h-4 w-4" />
            {u.button}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-white/8 bg-white/4 p-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] text-slate-500">{u.fields.order}</p>
            <p className="mt-0.5 text-sm font-semibold text-violet-300">
              {URGENT_ORDER.id}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">{u.fields.priority}</p>
            <p className="mt-0.5 text-sm font-semibold text-rose-300">
              {URGENT_ORDER.priority}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">{u.fields.deadline}</p>
            <p className="mt-0.5 text-sm font-semibold text-rose-300">
              Day {URGENT_ORDER.deadlineDays}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">{u.fields.duration}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {URGENT_ORDER.durationHours}h
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">{u.fields.product}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {URGENT_ORDER.name.split("(")[0].trim()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">{u.fields.compatibleLines}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {URGENT_ORDER.compatibleLines.join(", ").replace(/LINE-/g, "")}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">{u.fields.revenue}</p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-300">
              {eur(URGENT_ORDER.revenueEur)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">{u.fields.delayPenalty}</p>
            <p className="mt-0.5 text-sm font-semibold text-amber-300">
              {eur(URGENT_ORDER.delayPenaltyPerDay)}/day
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Simulation progress (animation steps 1–3)
// ---------------------------------------------------------------------------

function SimulationProgressCard({
  step,
  onSkip,
}: {
  step: Exclude<SimulationStep, "idle" | "complete">;
  onSkip: () => void;
}) {
  const copy = usePSCopy();
  const info = copy.simulation.steps[step];
  const colourMap: Record<Exclude<SimulationStep, "idle" | "complete">, string> = {
    event: "border-violet-300/30 bg-violet-900/20",
    impact: "border-amber-300/30 bg-amber-900/10",
    decision: "border-cyan-300/30 bg-cyan-900/10",
  };
  return (
    <Card className={cn("border", colourMap[step])} data-testid="simulation-progress">
      <CardContent className="pt-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <Zap className="h-8 w-8 text-violet-400 animate-pulse" />
          </div>
          <div>
            <p
              className="text-base font-bold text-white"
              data-testid="simulation-step-title"
            >
              {info.title}
            </p>
            <p className="mt-1 text-sm text-slate-400">{info.desc}</p>
          </div>
          {step === "decision" && (
            <div className="mx-auto max-w-xs space-y-1 text-left text-xs text-slate-500">
              {(Object.values(copy.strategyLabels) as string[]).map((s) => (
                <p key={s} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-cyan-400" />
                  {s}
                </p>
              ))}
            </div>
          )}
          <button
            onClick={onSkip}
            data-testid="simulation-skip"
            className="text-xs text-slate-600 transition hover:text-slate-400"
          >
            {copy.simulation.skipAnimation}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Before / After panel
// ---------------------------------------------------------------------------

function BeforeAfterPanel({
  baselineResult,
  urgentResult,
}: {
  baselineResult: SchedulingDecisionResponse;
  urgentResult: SchedulingDecisionResponse;
}) {
  const copy = usePSCopy();
  const ba = copy.beforeAfter;
  const baseRec = baselineResult.strategies.find(
    (s) => s.strategyId === baselineResult.recommendedStrategy,
  );
  const urgRec = urgentResult.strategies.find(
    (s) => s.strategyId === urgentResult.recommendedStrategy,
  );
  const keepCurrent = urgentResult.strategies.find(
    (s) => s.strategyId === "KEEP_CURRENT_SCHEDULE",
  );

  const avoidedByOptimising = Math.max(
    0,
    (keepCurrent?.financialImpact.totalCost ?? 0) -
      (urgRec?.financialImpact.totalCost ?? 0),
  );

  return (
    <Card className="border-violet-300/20" data-testid="before-after-panel">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-violet-400" />
          <CardTitle className="text-base text-violet-200">
            {ba.cardTitle}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Before */}
          <div className="rounded-xl border border-white/10 bg-white/4 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {ba.before}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {baseRec?.totalOrders ?? 0} {ba.orders}
            </p>
            <div className="mt-3 space-y-2">
              <StatBox
                label={ba.onTime}
                value={`${baseRec?.onTimeCount ?? 0} / ${baseRec?.totalOrders ?? 0}`}
                accent="emerald"
              />
              <StatBox
                label={ba.estimatedImpact}
                value={eur(baseRec?.financialImpact.totalCost ?? 0)}
                accent="amber"
              />
            </div>
          </div>

          {/* After — keep current */}
          <div className="rounded-xl border border-rose-300/20 bg-rose-900/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">
              {ba.acceptKeepCurrent}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {keepCurrent?.totalOrders ?? 0} {ba.orders} · {ba.notOptimised}
            </p>
            <div className="mt-3 space-y-2">
              <StatBox
                label={ba.onTime}
                value={
                  keepCurrent
                    ? `${keepCurrent.onTimeCount} / ${keepCurrent.totalOrders}`
                    : "—"
                }
                accent="rose"
              />
              <StatBox
                label={ba.estimatedImpact}
                value={eur(keepCurrent?.financialImpact.totalCost ?? 0)}
                accent="rose"
              />
            </div>
          </div>

          {/* After — recommended */}
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-900/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              {ba.acceptRecommended}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {urgRec?.totalOrders ?? 0} {ba.orders} · {ba.optimised}
            </p>
            <div className="mt-3 space-y-2">
              <StatBox
                label={ba.onTime}
                value={`${urgRec?.onTimeCount ?? 0} / ${urgRec?.totalOrders ?? 0}`}
                accent="emerald"
              />
              <StatBox
                label={ba.estimatedImpact}
                value={eur(urgRec?.financialImpact.totalCost ?? 0)}
                accent="emerald"
              />
            </div>
          </div>
        </div>

        {/* Avoided cost by optimising */}
        {avoidedByOptimising > 0 && (
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-900/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              {ba.avoidedByOptimising}
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">
              {eur(avoidedByOptimising)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {ba.avoidedByComparison}
            </p>
          </div>
        )}

        {/* Impact summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs text-slate-400">
          <p>+1 {ba.order}</p>
          <p>+{URGENT_ORDER.durationHours}h {ba.productionHours}</p>
          <p>{ba.revenue}: {eur(URGENT_ORDER.revenueEur)}</p>
          <p>{ba.riskIfLate}: {eur(URGENT_ORDER.delayPenaltyPerDay)}/day</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// What Should We Do? card
// ---------------------------------------------------------------------------

function WhatShouldWeDoCard({
  baselineResult,
  urgentResult,
}: {
  baselineResult: SchedulingDecisionResponse;
  urgentResult: SchedulingDecisionResponse;
}) {
  const copy = usePSCopy();
  const delta = useMemo(
    () =>
      computeSchedulingDecisionDelta(
        baselineResult,
        urgentResult,
        { ...BASELINE_WHAT_IF, includeUrgentOrder: true },
        BASELINE_WHAT_IF,
      ),
    [baselineResult, urgentResult],
  );
  const keepCurrentDiff = useMemo(
    () => computeKeepCurrentTraceDiff(baselineResult, urgentResult),
    [baselineResult, urgentResult],
  );

  const rec = urgentResult.strategies.find(
    (s) => s.strategyId === urgentResult.recommendedStrategy,
  );

  return (
    <Card className="border-violet-300/20" data-testid="what-should-we-do">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-400">
          {copy.whatShouldWeDo.eyebrow}
        </p>
        <CardTitle className="text-violet-200">
          {copy.whatShouldWeDo.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Decision changed / unchanged */}
        {delta.changed ? (
          <div className="rounded-xl border border-cyan-300/30 bg-cyan-900/20 px-4 py-3" data-testid="urgent-decision-changed">
            <p className="text-sm font-semibold text-cyan-300">
              {copy.whatShouldWeDo.decisionChanged}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <span className="text-rose-300 line-through">
                {delta.baselineDecision.replace(/_/g, " ")}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-emerald-300">
                {delta.scenarioDecision.replace(/_/g, " ")}
              </span>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-900/10 px-4 py-3" data-testid="urgent-decision-unchanged">
            <p className="text-sm font-semibold text-emerald-300">
              {copy.whatShouldWeDo.decisionUnchanged}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {copy.whatShouldWeDo.additionalOrderAbsorbed}{" "}
              <span className="font-medium text-emerald-300">
                {delta.scenarioDecision.replace(/_/g, " ")}
              </span>
            </p>
          </div>
        )}

        {/* Recommended strategy details */}
        {rec && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {copy.whatShouldWeDo.recommendedStrategy}
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {rec.strategyLabel.toUpperCase()}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox
                label={copy.whatShouldWeDo.ordersOnTime}
                value={`${rec.onTimeCount} / ${rec.totalOrders}`}
                accent="emerald"
              />
              <StatBox
                label={copy.whatShouldWeDo.delayed}
                value={`${rec.delayedCount}`}
                accent={rec.delayedCount > 0 ? "amber" : "emerald"}
              />
              <StatBox
                label={copy.whatShouldWeDo.totalImpact}
                value={eur(rec.financialImpact.totalCost)}
                accent="amber"
              />
              <StatBox
                label={copy.whatShouldWeDo.score}
                value={rec.score.composite.toFixed(4)}
                accent="cyan"
              />
            </div>
          </div>
        )}

        {/* Explanation reasons */}
        {urgentResult.explanation.reasons.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {copy.whatShouldWeDo.why}
            </p>
            <div className="space-y-2">
              {urgentResult.explanation.reasons.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {r.direction === "positive" ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <div>
                    <p className="font-medium text-slate-200">{r.label}</p>
                    <p className="text-xs text-slate-500">{r.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keep-current comparison — show how it worsens */}
        {keepCurrentDiff.some((d) => d.changed) && (
          <div data-testid="keep-current-fails">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {copy.whatShouldWeDo.keepCurrentFails}
            </p>
            <div className="space-y-1">
              {keepCurrentDiff
                .filter((d) => d.changed || d.scenarioResult === "FAIL")
                .map((d) => (
                  <div
                    key={d.ruleId}
                    className="rounded-lg border border-rose-300/20 bg-rose-900/10 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-rose-300">
                      {d.ruleName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {d.changed
                        ? `${d.baselineResult} → ${d.scenarioResult}`
                        : d.scenarioResult}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {d.scenarioEvidence}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Scenario Lab — what-if controls
// ---------------------------------------------------------------------------

function ScenarioLabControls({
  what,
  onChange,
}: {
  what: WhatIfState;
  onChange: (patch: Partial<WhatIfState>) => void;
}) {
  const copy = usePSCopy();
  const ctrl = copy.scenarioLab.controls;
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs text-slate-400">
          {ctrl.lineBCapacity}:{" "}
          <span data-testid="lab-capacity-value">{what.lineBCapacityReductionPct}</span>%
        </Label>
        <input
          type="range"
          min={0}
          max={60}
          step={5}
          value={what.lineBCapacityReductionPct}
          onChange={(e) =>
            onChange({ lineBCapacityReductionPct: Number(e.target.value) })
          }
          data-testid="scenario-line-b-capacity"
          aria-label={`${ctrl.lineBCapacity}: ${what.lineBCapacityReductionPct}%`}
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>0%</span><span>60%</span>
        </div>
      </div>

      <div>
        <Label className="text-xs text-slate-400">
          {ctrl.disruptionDuration}:{" "}
          <span data-testid="lab-duration-value">{what.disruptionDurationDays}</span> {ctrl.dayUnit}
        </Label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={what.disruptionDurationDays}
          onChange={(e) =>
            onChange({ disruptionDurationDays: Number(e.target.value) })
          }
          data-testid="scenario-duration"
          aria-label={`${ctrl.disruptionDuration}: ${what.disruptionDurationDays} ${ctrl.dayUnit}`}
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>1 {ctrl.dayUnit}</span><span>5 {ctrl.dayUnit}</span>
        </div>
      </div>

      <div>
        <Label className="text-xs text-slate-400">
          {ctrl.criticalDeadline}{" "}
          <span data-testid="lab-deadline-value">{what.criticalOrderDeadlineDays}</span>
        </Label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={what.criticalOrderDeadlineDays}
          onChange={(e) =>
            onChange({ criticalOrderDeadlineDays: Number(e.target.value) })
          }
          data-testid="scenario-critical-deadline"
          aria-label={`Critical order deadline: Day ${what.criticalOrderDeadlineDays}`}
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>{ctrl.day} 1</span><span>{ctrl.day} 5</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-400">
          {ctrl.materialAvailable}
        </Label>
        <button
          onClick={() =>
            onChange({ order103MaterialAvailable: !what.order103MaterialAvailable })
          }
          data-testid="scenario-material"
          className={cn(
            "relative h-5 w-10 shrink-0 overflow-hidden rounded-full transition",
            what.order103MaterialAvailable ? "bg-emerald-500" : "bg-slate-700",
          )}
          aria-pressed={what.order103MaterialAvailable}
          aria-label={ctrl.materialAvailable}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              what.order103MaterialAvailable ? "translate-x-[22px]" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-400">{ctrl.overtimeEnabled}</Label>
        <button
          onClick={() => onChange({ overtimeAvailable: !what.overtimeAvailable })}
          data-testid="scenario-overtime"
          className={cn(
            "relative h-5 w-10 shrink-0 overflow-hidden rounded-full transition",
            what.overtimeAvailable ? "bg-emerald-500" : "bg-slate-700",
          )}
          aria-pressed={what.overtimeAvailable}
          aria-label={ctrl.overtimeEnabled}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              what.overtimeAvailable ? "translate-x-[22px]" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div>
        <Label className="text-xs text-slate-400">
          {ctrl.overtimeCost}: €<span data-testid="lab-overtime-cost-value">{what.overtimeCostPerHour}</span>/h
        </Label>
        <input
          type="range"
          min={50}
          max={400}
          step={10}
          value={what.overtimeCostPerHour}
          onChange={(e) =>
            onChange({ overtimeCostPerHour: Number(e.target.value) })
          }
          data-testid="scenario-overtime-cost"
          aria-label={`${ctrl.overtimeCost}: €${what.overtimeCostPerHour}/h`}
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>€50/h</span><span>€400/h</span>
        </div>
      </div>

      <div>
        <Label className="text-xs text-slate-400 mb-2 block">
          {ctrl.order116Priority}
        </Label>
        <div className="flex gap-2" data-testid="scenario-order-priority">
          {(["HIGH", "NORMAL", "LOW"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onChange({ order116Priority: p })}
              data-testid={`priority-${p.toLowerCase()}`}
              aria-pressed={what.order116Priority === p}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                what.order116Priority === p
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                  : "border-white/10 text-slate-500 hover:border-white/20",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario Lab result display
// ---------------------------------------------------------------------------

function ScenarioLabResult({
  baseResult,
  scenResult,
  what,
}: {
  baseResult: SchedulingDecisionResponse;
  scenResult: SchedulingDecisionResponse;
  what: WhatIfState;
}) {
  const copy = usePSCopy();
  const labR = copy.scenarioLab.scenLabResult;
  const delta = useMemo(
    () =>
      computeSchedulingDecisionDelta(baseResult, scenResult, what, BASELINE_WHAT_IF),
    [baseResult, scenResult, what],
  );
  const traceDiff = useMemo(
    () => computeSchedulingTraceDiff(baseResult, scenResult),
    [baseResult, scenResult],
  );
  const sensitivity = useMemo(
    () => computeSchedulingSensitivity({ scenario: DEFAULT_SCENARIO, costConfig: DEFAULT_COST_CONFIG }),
    [],
  );

  const recStrategy = scenResult.strategies.find(
    (s) => s.strategyId === scenResult.recommendedStrategy,
  );

  return (
    <div className="space-y-5">
      {/* Decision change banner */}
      {delta.changed ? (
        <div className="rounded-2xl border border-cyan-300/30 bg-cyan-900/20 px-4 py-3" data-testid="decision-delta" data-decision-changed="true">
          <p className="text-sm font-semibold text-cyan-300">{copy.whatShouldWeDo.decisionChanged}</p>
          <p className="mt-1 text-sm text-slate-300">
            <span className="text-rose-300 line-through mr-2">{delta.baselineDecision.replace(/_/g, " ")}</span>
            →
            <span className="text-emerald-300 ml-2">{delta.scenarioDecision.replace(/_/g, " ")}</span>
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-600/30 bg-slate-800/30 px-4 py-3" data-testid="decision-delta" data-decision-changed="false">
          <p className="text-sm font-medium text-slate-400">
            {copy.whatShouldWeDo.decisionUnchanged}: <span className="text-slate-300">{delta.scenarioDecision.replace(/_/g, " ")}</span>
          </p>
        </div>
      )}

      {/* Changed inputs */}
      {delta.changedReasons.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Changed inputs
          </p>
          <div className="space-y-1">
            {delta.changedReasons.map((r, i) => (
              <p key={i} className="rounded bg-slate-800/40 px-3 py-1 text-xs text-slate-300">
                {r}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Financial delta */}
      {recStrategy && (
        <div className="grid grid-cols-2 gap-4">
          <StatBox
            label={labR.totalImpact}
            value={eur(recStrategy.financialImpact.totalCost)}
            accent="amber"
          />
          <StatBox
            label={labR.avoidedCost}
            value={`${delta.financialDelta >= 0 ? "+" : ""}${eur(delta.financialDelta)}`}
            accent={delta.financialDelta <= 0 ? "emerald" : "rose"}
          />
        </div>
      )}

      {/* Why did it change? */}
      {delta.changed && scenResult.explanation.reasons.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {copy.whatShouldWeDo.why}
          </p>
          <div className="space-y-2">
            {scenResult.explanation.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {r.direction === "positive" ? (
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                )}
                <span className="text-slate-300">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trace diff */}
      {traceDiff.length > 0 && (
        <div data-testid="decision-trace-diff">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {copy.decisionTrace.changedOnly}
          </p>
          <div className="space-y-1">
            {traceDiff
              .filter((d) => d.changed)
              .map((d) => (
                <div
                  key={d.ruleId}
                  className="rounded-lg border border-amber-300/20 bg-amber-900/10 px-3 py-2"
                >
                  <p className="text-xs font-medium text-amber-300">{d.ruleName}</p>
                  <p className="text-[10px] text-slate-400">
                    {d.baselineResult} → {d.scenarioResult}
                  </p>
                </div>
              ))}
            {traceDiff.filter((d) => d.changed).length === 0 && (
              <p className="text-xs text-slate-500">No rule-level changes in the recommended strategy.</p>
            )}
          </div>
        </div>
      )}

      {/* Decision sensitivity */}
      <div data-testid="decision-sensitivity">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {labR.sensitivity}
        </p>
        <div className="space-y-1">
          {sensitivity.map((s) => (
            <div key={s.variable} className="flex items-start justify-between gap-3 py-1">
              <p className="text-xs text-slate-300">{s.variable}</p>
              <Badge
                variant={
                  s.level === "HIGH" ? "rose" : s.level === "MEDIUM" ? "amber" : "neutral"
                }
                className="flex-shrink-0 text-[9px]"
              >
                {labR.sensitivityLevels[s.level]}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — type
// ---------------------------------------------------------------------------

type DisruptionSimStep = "idle" | "detected" | "impact" | "evaluating" | "complete";

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Trigger card
// ---------------------------------------------------------------------------

function DisruptionTriggerCard({ onActivate }: { onActivate: () => void }) {
  return (
    <Card className="border-rose-300/30 bg-rose-900/10" data-testid="disruption-trigger-card">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-400">
              PRODUCTION DISRUPTION
            </p>
            <h2 className="text-lg font-bold text-white">
              Machine B — Equipment Failure
            </h2>
            <p className="text-sm text-slate-400">
              Machine B is reporting an equipment failure and will be unavailable for 8 hours.
              Evaluate recovery options and determine the best operational response.
            </p>
          </div>
          <button
            onClick={onActivate}
            data-testid="activate-disruption"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/20 px-5 py-2.5 text-sm font-semibold text-rose-200 outline-none transition hover:border-rose-400/60 hover:bg-rose-500/30 focus-visible:ring-2 focus-visible:ring-rose-400/60"
          >
            <Siren className="h-4 w-4" />
            ACTIVATE DISRUPTION
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-white/8 bg-white/4 p-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] text-slate-500">Machine</p>
            <p className="mt-0.5 text-sm font-semibold text-rose-300">Machine B</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Duration</p>
            <p className="mt-0.5 text-sm font-semibold text-rose-300">8 hours</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Orders on Machine B</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {PDR_MACHINE_B_ORDER_IDS.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Compatible alternative</p>
            <p className="mt-0.5 text-sm font-semibold text-amber-300">Machine C</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Step progress card
// ---------------------------------------------------------------------------

const DISRUPTION_STEP_INFO: Record<
  Exclude<DisruptionSimStep, "idle" | "complete">,
  { icon: ReactNode; title: string; desc: string; colour: string }
> = {
  detected: {
    icon: <Siren className="h-8 w-8 text-rose-400 animate-pulse" />,
    title: "DISRUPTION DETECTED",
    desc: "Machine B equipment failure confirmed. Assessing affected orders and capacity.",
    colour: "border-rose-300/30 bg-rose-900/20",
  },
  impact: {
    icon: <AlertTriangle className="h-8 w-8 text-amber-400 animate-pulse" />,
    title: "IMPACT ANALYSIS",
    desc: "Identifying affected orders, capacity loss, and deadline risk.",
    colour: "border-amber-300/30 bg-amber-900/10",
  },
  evaluating: {
    icon: <Search className="h-8 w-8 text-cyan-400 animate-pulse" />,
    title: "EVALUATING RECOVERY OPTIONS",
    desc: "Comparing: Wait · Move production · Overtime · Resequence",
    colour: "border-cyan-300/30 bg-cyan-900/10",
  },
};

function DisruptionProgressCard({
  step,
  onSkip,
}: {
  step: Exclude<DisruptionSimStep, "idle" | "complete">;
  onSkip: () => void;
}) {
  const info = DISRUPTION_STEP_INFO[step];
  return (
    <Card className={cn("border", info.colour)} data-testid="disruption-progress">
      <CardContent className="pt-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">{info.icon}</div>
          <div>
            <p className="text-base font-bold text-white" data-testid="disruption-step-title">
              {info.title}
            </p>
            <p className="mt-1 text-sm text-slate-400">{info.desc}</p>
          </div>
          <button
            onClick={onSkip}
            data-testid="disruption-skip"
            className="text-xs text-slate-600 transition hover:text-slate-400"
          >
            Skip animation
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Impact summary (affected orders, capacity, deadlines)
// ---------------------------------------------------------------------------

function DisruptionImpactSummary({
  preResult,
  disruptedResult,
  ordersAtRisk,
  machineBOrderCount,
}: {
  preResult: SchedulingDecisionResponse;
  disruptedResult: SchedulingDecisionResponse;
  ordersAtRisk: string[];
  machineBOrderCount: number;
}) {
  const keepCurrent = disruptedResult.strategies.find(
    (s) => s.strategyId === "KEEP_CURRENT_SCHEDULE",
  );
  const preRec = preResult.strategies.find(
    (s) => s.strategyId === preResult.recommendedStrategy,
  );

  const capacityLost =
    disruptedResult.scenarioSnapshot.disruption.capacityReductionFactor *
    8 *
    disruptedResult.scenarioSnapshot.disruption.durationDays;

  const machineBOrdersAtRiskCount = ordersAtRisk.filter((id) =>
    PDR_MACHINE_B_ORDER_IDS.includes(id),
  ).length;
  const unaffectedCount = Math.max(0, machineBOrderCount - machineBOrdersAtRiskCount);

  return (
    <div className="space-y-4" data-testid="disruption-impact-summary">
      {/* Story flow */}
      <div className="flex flex-wrap items-start gap-3 text-sm text-slate-400">
        <div className="rounded-lg border border-white/10 bg-slate-800/40 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">BEFORE DISRUPTION</p>
          <p className="text-lg font-bold text-white">{preRec?.onTimeCount ?? 0}/{preRec?.totalOrders ?? 0}</p>
          <p className="text-[10px] text-slate-500">orders on time</p>
        </div>
        <div className="flex items-center text-slate-600 mt-4">↓</div>
        <div className="rounded-lg border border-rose-300/20 bg-rose-900/10 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400">MACHINE B FAILS</p>
          <p className="text-lg font-bold text-rose-300">{capacityLost.toFixed(0)}h</p>
          <p className="text-[10px] text-slate-500">capacity lost</p>
        </div>
        <div className="flex items-center text-slate-600 mt-4">↓</div>
        <div className="rounded-lg border border-amber-300/20 bg-amber-900/10 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">ORDERS ON MACHINE B</p>
          <p className="text-lg font-bold text-amber-300">{machineBOrderCount}</p>
          <p className="text-[10px] text-slate-500">total on disrupted line</p>
        </div>
        <div className="flex items-center text-slate-600 mt-4">↓</div>
        <div className="rounded-lg border border-rose-300/20 bg-rose-900/10 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400">AT RISK</p>
          <p className="text-lg font-bold text-rose-300" data-testid="disruption-at-risk-count">{ordersAtRisk.length}</p>
          <p className="text-[10px] text-slate-500">delayed or unscheduled</p>
        </div>
        {unaffectedCount > 0 && (
          <>
            <div className="flex items-center text-slate-600 mt-4">·</div>
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-900/10 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">UNAFFECTED</p>
              <p className="text-lg font-bold text-emerald-300" data-testid="disruption-unaffected-count">{unaffectedCount}</p>
              <p className="text-[10px] text-slate-500">within deadline</p>
            </div>
          </>
        )}
      </div>

      {/* At-risk orders */}
      {ordersAtRisk.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Orders at risk (without recovery)
          </p>
          <div className="space-y-1">
            {ordersAtRisk.map((id) => {
              const task = keepCurrent?.schedule.find((t) => t.orderId === id);
              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg border border-amber-300/20 bg-amber-900/10 px-3 py-2 text-xs"
                  data-testid="disruption-at-risk-order"
                >
                  <span className="font-medium text-amber-200">{id}</span>
                  {task && (
                    <span className="text-amber-400">
                      {task.status === "DELAYED"
                        ? `${task.daysLate}d late`
                        : "not scheduled"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Root cause / countermeasures / decision
// ---------------------------------------------------------------------------

function DisruptionDecisionSummary({
  disruptedResult,
  ordersAtRisk,
}: {
  disruptedResult: SchedulingDecisionResponse;
  ordersAtRisk: string[];
}) {
  const rec = disruptedResult.strategies.find(
    (s) => s.strategyId === disruptedResult.recommendedStrategy,
  );
  const strategies = disruptedResult.strategies;
  const feasibleCount = strategies.filter((s) => s.feasibility === "FEASIBLE").length;

  return (
    <div className="space-y-3" data-testid="disruption-decision-summary">
      {[
        {
          label: "ROOT CAUSE",
          colour: "rose",
          text: (() => {
            const factor = disruptedResult.scenarioSnapshot.disruption.capacityReductionFactor;
            const days = disruptedResult.scenarioSnapshot.disruption.durationDays;
            const hoursLost = factor * 8 * days;
            if (factor >= 1.0) {
              return `Machine B unavailable for ${hoursLost.toFixed(0)} production hours (${days} production day${days !== 1 ? "s" : ""}).`;
            }
            const pctLost = (factor * 100).toFixed(0);
            return `Machine B at ${(100 - factor * 100).toFixed(0)}% capacity for ${days} day${days !== 1 ? "s" : ""} — ${hoursLost.toFixed(0)}h lost (${pctLost}% reduction).`;
          })(),
        },
        {
          label: "IMPACT",
          colour: "amber",
          text: `${ordersAtRisk.length} order${ordersAtRisk.length !== 1 ? "s" : ""} at risk of delay${ordersAtRisk.length > 0 ? `: ${ordersAtRisk.join(", ")}` : ""}.`,
        },
        {
          label: "COUNTERMEASURES",
          colour: "cyan",
          text: `${strategies.length} recovery strategies evaluated; ${feasibleCount} feasible.`,
        },
        {
          label: "DECISION",
          colour: "emerald",
          text: rec
            ? `${rec.strategyLabel} — ${rec.onTimeCount}/${rec.totalOrders} orders protected, €${Math.round(disruptedResult.avoidedCostVsBaseline).toLocaleString("en-US")} avoided.`
            : disruptedResult.decisionStatus === "NO_FEASIBLE_ALTERNATIVE"
              ? "No feasible recovery found — capacity insufficient."
              : "Evaluating…",
        },
      ].map((row) => (
        <div
          key={row.label}
          className={cn(
            "rounded-xl border px-4 py-3",
            row.colour === "rose" && "border-rose-300/20 bg-rose-900/10",
            row.colour === "amber" && "border-amber-300/20 bg-amber-900/10",
            row.colour === "cyan" && "border-cyan-300/20 bg-cyan-900/10",
            row.colour === "emerald" && "border-emerald-300/20 bg-emerald-900/10",
          )}
        >
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.18em]",
              row.colour === "rose" && "text-rose-400",
              row.colour === "amber" && "text-amber-400",
              row.colour === "cyan" && "text-cyan-400",
              row.colour === "emerald" && "text-emerald-400",
            )}
          >
            {row.label}
          </p>
          <p className="mt-1 text-sm text-slate-200">{row.text}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Before / After / Recovery panel
// ---------------------------------------------------------------------------

function DisruptionBeforeAfterPanel({
  preResult,
  disruptedResult,
}: {
  preResult: SchedulingDecisionResponse;
  disruptedResult: SchedulingDecisionResponse;
}) {
  const keepCurrent = disruptedResult.strategies.find(
    (s) => s.strategyId === "KEEP_CURRENT_SCHEDULE",
  );
  const rec = disruptedResult.strategies.find(
    (s) => s.strategyId === disruptedResult.recommendedStrategy,
  );
  const preRec = preResult.strategies.find(
    (s) => s.strategyId === preResult.recommendedStrategy,
  );

  const avoidedImpact = Math.max(
    0,
    (keepCurrent?.financialImpact.totalCost ?? 0) -
      (rec?.financialImpact.totalCost ?? 0),
  );

  return (
    <Card className="border-rose-300/20" data-testid="disruption-before-after">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Siren className="h-4 w-4 text-rose-400" />
          <CardTitle className="text-base text-rose-200">
            Before · Disrupted · After Recovery
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Before disruption */}
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-900/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              BEFORE DISRUPTION
            </p>
            <div className="mt-3 space-y-2">
              <StatBox
                label="Orders on time"
                value={`${preRec?.onTimeCount ?? 0} / ${preRec?.totalOrders ?? 0}`}
                accent="emerald"
              />
              <StatBox
                label="Total operational impact"
                value={eur(preRec?.financialImpact.totalCost ?? 0)}
                accent="neutral"
              />
            </div>
          </div>

          {/* Disrupted — no recovery */}
          <div className="rounded-xl border border-rose-300/20 bg-rose-900/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400">
              DISRUPTION — NO RECOVERY
            </p>
            <div className="mt-3 space-y-2">
              <StatBox
                label="Orders on time"
                value={keepCurrent ? `${keepCurrent.onTimeCount}/${keepCurrent.totalOrders}` : "—"}
                accent="rose"
              />
              <StatBox
                label="Total operational impact"
                value={eur(keepCurrent?.financialImpact.totalCost ?? 0)}
                accent="rose"
              />
            </div>
          </div>

          {/* After recovery */}
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-900/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">
              AFTER RECOVERY
            </p>
            <div className="mt-3 space-y-2">
              <StatBox
                label="Orders on time"
                value={rec ? `${rec.onTimeCount}/${rec.totalOrders}` : "—"}
                accent="emerald"
              />
              <StatBox
                label="Total operational impact"
                value={eur(rec?.financialImpact.totalCost ?? 0)}
                accent="cyan"
              />
              {(rec?.financialImpact.overtimeCost ?? 0) > 0 && (
                <StatBox
                  label="Overtime cost"
                  value={eur(rec?.financialImpact.overtimeCost ?? 0)}
                  accent="amber"
                />
              )}
            </div>
          </div>
        </div>

        {/* Avoided impact */}
        {avoidedImpact > 0 && (
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-900/10 px-4 py-3" data-testid="disruption-avoided-impact">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              AVOIDED IMPACT
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">
              {eur(avoidedImpact)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Disruption cost without recovery vs. recommended recovery plan
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Financial impact (3-column: pre / disrupted / recovery)
// ---------------------------------------------------------------------------

function DisruptionFinancialPanel({
  preResult,
  disruptedResult,
}: {
  preResult: SchedulingDecisionResponse;
  disruptedResult: SchedulingDecisionResponse;
}) {
  const preRec = preResult.strategies.find(
    (s) => s.strategyId === preResult.recommendedStrategy,
  );
  const keepCurrent = disruptedResult.strategies.find(
    (s) => s.strategyId === "KEEP_CURRENT_SCHEDULE",
  );
  const rec = disruptedResult.strategies.find(
    (s) => s.strategyId === disruptedResult.recommendedStrategy,
  );

  const rows: Array<{ label: string; pre: number; disrupted: number; recovery: number }> = [
    {
      label: "Delay cost",
      pre: preRec?.financialImpact.delayCost ?? 0,
      disrupted: keepCurrent?.financialImpact.delayCost ?? 0,
      recovery: rec?.financialImpact.delayCost ?? 0,
    },
    {
      label: "Overtime cost",
      pre: preRec?.financialImpact.overtimeCost ?? 0,
      disrupted: keepCurrent?.financialImpact.overtimeCost ?? 0,
      recovery: rec?.financialImpact.overtimeCost ?? 0,
    },
    {
      label: "Setup / changeover",
      pre: preRec?.financialImpact.setupCost ?? 0,
      disrupted: keepCurrent?.financialImpact.setupCost ?? 0,
      recovery: rec?.financialImpact.setupCost ?? 0,
    },
    {
      label: "Unused capacity",
      pre: preRec?.financialImpact.unusedCapacityCost ?? 0,
      disrupted: keepCurrent?.financialImpact.unusedCapacityCost ?? 0,
      recovery: rec?.financialImpact.unusedCapacityCost ?? 0,
    },
    {
      label: "Total impact",
      pre: preRec?.financialImpact.totalCost ?? 0,
      disrupted: keepCurrent?.financialImpact.totalCost ?? 0,
      recovery: rec?.financialImpact.totalCost ?? 0,
    },
  ];

  const avoidedImpact = Math.max(
    0,
    (keepCurrent?.financialImpact.totalCost ?? 0) -
      (rec?.financialImpact.totalCost ?? 0),
  );

  return (
    <Card data-testid="disruption-financial-impact">
      <CardHeader>
        <CardTitle className="text-base">Financial Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 text-left text-xs text-slate-400" />
                <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Current Plan
                </th>
                <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-rose-400">
                  Without Recovery
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-widest text-cyan-400">
                  {rec?.strategyLabel ?? "Recovery"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isTotal = i === rows.length - 1;
                const slug = row.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                return (
                  <tr
                    key={slug}
                    className={cn("border-b border-white/5", isTotal && "font-semibold")}
                  >
                    <td className="py-2 pr-4 text-slate-400">{row.label}</td>
                    <td className="py-2 pr-4 text-right text-emerald-300">
                      <span data-testid={`dis-fin-pre-${slug}`}>{eur(row.pre)}</span>
                    </td>
                    <td className="py-2 pr-4 text-right text-rose-300">
                      <span data-testid={`dis-fin-disrupted-${slug}`}>{eur(row.disrupted)}</span>
                    </td>
                    <td className="py-2 text-right text-cyan-300">
                      <span data-testid={`dis-fin-recovery-${slug}`}>{eur(row.recovery)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {avoidedImpact > 0 && (
          <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-900/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              AVOIDED IMPACT
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-2xl font-bold text-emerald-300"
                data-testid="disruption-avoided-cost-value"
              >
                {eur(avoidedImpact)}
              </span>
              <span className="text-xs text-slate-400">
                ({eur(keepCurrent?.financialImpact.totalCost ?? 0)} − {eur(rec?.financialImpact.totalCost ?? 0)})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Schedule diff (current vs recovery)
// ---------------------------------------------------------------------------

function DisruptionScheduleDiff({
  disruptedResult,
}: {
  disruptedResult: SchedulingDecisionResponse;
}) {
  const rec = disruptedResult.strategies.find(
    (s) => s.strategyId === disruptedResult.recommendedStrategy,
  );

  const lineIds = ["LINE-A", "LINE-B", "LINE-C"];
  const lineNames: Record<string, string> = {
    "LINE-A": "Machine A",
    "LINE-B": "Machine B",
    "LINE-C": "Machine C",
  };

  // Use KEEP_CURRENT_SCHEDULE from the disrupted result as the baseline for
  // detecting which orders were moved to a different line. This reflects the
  // original line assignment before any recovery action, not the pre-disruption
  // recommended plan (which may already show orders on alternate lines).
  const keepCurrentSchedule = disruptedResult.strategies.find(
    (s) => s.strategyId === "KEEP_CURRENT_SCHEDULE",
  );

  const isDisruptedLine = (id: string) =>
    id === disruptedResult.scenarioSnapshot.disruption.affectedLineId &&
    disruptedResult.scenarioSnapshot.disruption.capacityReductionFactor >= 1.0;

  const movedOrderIds = new Set<string>();
  const rescuedOrderIds = new Set<string>();
  if (rec && keepCurrentSchedule) {
    for (const task of rec.schedule) {
      const baseTask = keepCurrentSchedule.schedule.find((t) => t.orderId === task.orderId);
      if (baseTask) {
        if (baseTask.lineId !== task.lineId) {
          movedOrderIds.add(task.orderId);
        }
        // Rescued: was not on-time in keep-current, on time in recovery
        if (baseTask.status !== "ON_TIME" && task.status === "ON_TIME") {
          rescuedOrderIds.add(task.orderId);
        }
      }
    }
  }

  return (
    <Card data-testid="disruption-schedule-diff">
      <CardHeader>
        <CardTitle className="text-base">Schedule Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Disrupted schedule (no recovery) */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-rose-400" data-testid="disruption-schedule-label-disrupted">
              DISRUPTED PLAN
            </p>
            {lineIds.map((lineId) => {
              const tasks = (keepCurrentSchedule?.schedule ?? []).filter(
                (t) => t.lineId === lineId && t.day >= 1,
              );
              return (
                <div key={lineId} className="mb-3">
                  <p className="mb-1 text-xs font-medium text-slate-400">
                    {lineNames[lineId] ?? lineId}
                  </p>
                  <div className="space-y-1">
                    {tasks.length === 0 ? (
                      <p className="text-xs text-slate-600">—</p>
                    ) : (
                      tasks.map((t) => (
                        <div
                          key={t.orderId}
                          className="rounded bg-slate-800/50 px-2 py-1 text-xs text-slate-300"
                        >
                          {t.orderId} · D{t.day}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recovery plan */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400" data-testid="disruption-schedule-label-recovery">
              RECOVERY PLAN
            </p>
            {lineIds.map((lineId) => {
              const disrupted = isDisruptedLine(lineId);
              const tasks = (rec?.schedule ?? []).filter(
                (t) => t.lineId === lineId && t.day >= 1,
              );
              return (
                <div key={lineId} className="mb-3">
                  <p className="mb-1 text-xs font-medium text-slate-400">
                    {lineNames[lineId] ?? lineId}
                    {disrupted && (
                      <span className="ml-2 text-[10px] font-semibold text-rose-400">
                        [UNAVAILABLE D1]
                      </span>
                    )}
                  </p>
                  {disrupted && tasks.length === 0 ? (
                    <div className="rounded border border-rose-400/30 bg-rose-900/10 px-2 py-1 text-xs text-rose-400">
                      MACHINE UNAVAILABLE
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {tasks.length === 0 ? (
                        <p className="text-xs text-slate-600">—</p>
                      ) : (
                        tasks.map((t) => {
                          const moved = movedOrderIds.has(t.orderId);
                          const rescued = rescuedOrderIds.has(t.orderId);
                          const isOvertime = t.isOvertime;
                          return (
                            <div
                              key={t.orderId}
                              className={cn(
                                "rounded px-2 py-1 text-xs",
                                moved
                                  ? "border border-cyan-400/40 bg-cyan-900/20 text-cyan-200"
                                  : rescued
                                    ? "border border-emerald-400/40 bg-emerald-900/20 text-emerald-200"
                                    : isOvertime
                                      ? "border border-amber-400/40 bg-amber-900/20 text-amber-200"
                                      : t.status === "DELAYED"
                                        ? "border border-rose-400/30 bg-rose-900/10 text-rose-300"
                                        : "bg-slate-800/50 text-slate-300",
                              )}
                            >
                              {t.orderId} · D{t.day}
                              {moved && <span className="ml-1 text-[10px]">↗ MOVED</span>}
                              {rescued && <span className="ml-1 text-[10px]">✓ RESCUED</span>}
                              {isOvertime && <span className="ml-1 text-[10px]">OT</span>}
                              {t.status === "DELAYED" && (
                                <span className="ml-1 text-[10px]">⚠ {t.daysLate}d</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
          {movedOrderIds.size > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded border border-cyan-400/40 bg-cyan-900/20" />
              Moved to another line
            </span>
          )}
          {rescuedOrderIds.size > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded border border-emerald-400/40 bg-emerald-900/20" />
              Rescued (was delayed or not scheduled without recovery)
            </span>
          )}
          {rec?.schedule.some((t) => t.isOvertime) && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded border border-amber-400/40 bg-amber-900/20" />
              Overtime
            </span>
          )}
          {rec?.schedule.some((t) => t.status === "DELAYED") && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded border border-rose-400/30 bg-rose-900/10" />
              Still delayed
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Why this recovery plan?
// ---------------------------------------------------------------------------

function DisruptionWhyThisPlan({ disruptedResult }: { disruptedResult: SchedulingDecisionResponse }) {
  return (
    <Card data-testid="disruption-why-plan">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          <CardTitle className="text-base">WHY THIS RECOVERY PLAN?</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {disruptedResult.explanation.reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-3">
            {r.direction === "positive" ? (
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-200">{r.label}</p>
              <p className="text-xs text-slate-500">{r.evidence}</p>
            </div>
          </div>
        ))}
        {disruptedResult.explanation.rejectedStrategies.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-white/8 pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Rejected alternatives
            </p>
            {disruptedResult.explanation.rejectedStrategies.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-500/60" />
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-400">
                    {r.strategyId.replace(/_/g, " ")}:{" "}
                  </span>
                  {r.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Decision trace
// ---------------------------------------------------------------------------

function DisruptionDecisionTrace({ disruptedResult }: { disruptedResult: SchedulingDecisionResponse }) {
  const rec = disruptedResult.strategies.find(
    (s) => s.strategyId === disruptedResult.recommendedStrategy,
  );
  const keepCurrent = disruptedResult.strategies.find(
    (s) => s.strategyId === "KEEP_CURRENT_SCHEDULE",
  );

  const traceEntries = rec?.constraintResults ?? [];
  const keepEntries = keepCurrent?.constraintResults ?? [];

  return (
    <CollapseSection title="Decision Trace">
      <div className="space-y-3" data-testid="disruption-decision-trace">
        <p className="text-xs text-slate-500">
          Rules that changed between Keep Current and the recommended recovery plan.
        </p>

        {/* Changed rules */}
        {traceEntries.map((r) => {
          const k = keepEntries.find((e) => e.ruleId === r.ruleId);
          const changed = k && k.passed !== r.passed;
          const rule = CONSTRAINT_RULES.find((cr) => cr.id === r.ruleId);
          return (
            <div
              key={r.ruleId}
              className={cn(
                "rounded-xl border px-4 py-3",
                changed ? "border-amber-300/30 bg-amber-900/10" : (r.passed ? "border-emerald-300/20 bg-emerald-900/10" : "border-rose-300/20 bg-rose-900/10"),
              )}
            >
              <div className="flex items-start gap-3">
                {r.passed ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">{r.ruleName}</p>
                    {rule?.hard && (
                      <Badge variant="rose" className="text-[9px]">Hard</Badge>
                    )}
                    {changed && k && (
                      <span className="text-[10px] text-amber-400">
                        {k.passed ? "PASS" : "FAIL"} → {r.passed ? "PASS" : "FAIL"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{r.evidence}</p>
                  {changed && k && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      Keep Current: {k.evidence}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CollapseSection>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Sensitivity (disruption duration threshold)
// ---------------------------------------------------------------------------

function DisruptionSensitivityPanel({ disruptionWhat }: { disruptionWhat: DisruptionWhatIfState }) {
  const sensitivity = useMemo(
    () => computeDisruptionSensitivity(disruptionWhat),
    [disruptionWhat],
  );

  const hasBoundary = sensitivity.some((e) => !e.feasible);
  const firstInfeasible = sensitivity.find((e) => !e.feasible);

  const explanation = hasBoundary
    ? `Calculated from the current scenario configuration. Strategy feasibility changes at ${firstInfeasible?.hours ?? 0}h disruption duration.`
    : "Calculated from the current scenario configuration. The recommended recovery strategy remains feasible across the tested disruption durations.";

  return (
    <CollapseSection title="Recovery Sensitivity">
      <div className="space-y-2" data-testid="disruption-sensitivity">
        {sensitivity.map((entry) => (
          <div
            key={entry.hours}
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-2",
              entry.feasible
                ? "border-emerald-300/20 bg-emerald-900/10"
                : "border-rose-300/20 bg-rose-900/10",
            )}
          >
            <span className="text-sm font-medium text-slate-200">
              {entry.hours}h disruption
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{entry.strategy}</span>
              <Badge variant={entry.feasible ? "emerald" : "rose"} className="text-[9px]">
                {entry.feasible ? "FEASIBLE" : "NO RECOVERY"}
              </Badge>
            </div>
          </div>
        ))}
        <p className="text-xs text-slate-500">
          {explanation}
        </p>
      </div>
    </CollapseSection>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTION DISRUPTION — Scenario lab controls
// ---------------------------------------------------------------------------

function DisruptionLabControls({
  what,
  onChange,
}: {
  what: DisruptionWhatIfState;
  onChange: (patch: Partial<DisruptionWhatIfState>) => void;
}) {
  const hourOptions: Array<4 | 8 | 12 | 16> = [4, 8, 12, 16];
  const capOptions: Array<4 | 6 | 8 | 10> = [4, 6, 8, 10];

  return (
    <div className="space-y-5">
      {/* Machine B availability */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-400">Machine B availability</Label>
        <div className="flex gap-2">
          {(["Available", "Unavailable"] as const).map((opt) => {
            const isAvail = opt === "Available";
            const isActive = what.machineBAvailable === isAvail;
            return (
              <button
                key={opt}
                onClick={() => onChange({ machineBAvailable: isAvail })}
                data-testid={`dis-machine-b-${opt.toLowerCase()}`}
                aria-pressed={isActive}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                  isActive
                    ? isAvail
                      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                      : "border-rose-400/50 bg-rose-400/10 text-rose-300"
                    : "border-white/10 text-slate-500 hover:border-white/20",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Disruption duration */}
      <div>
        <Label className="text-xs text-slate-400 mb-2 block">
          Disruption duration:{" "}
          <span data-testid="dis-lab-duration-value">{what.disruptionHours}</span>h
        </Label>
        <div className="flex gap-2" data-testid="dis-duration-selector">
          {hourOptions.map((h) => (
            <button
              key={h}
              onClick={() => onChange({ disruptionHours: h })}
              data-testid={`dis-duration-${h}h`}
              aria-pressed={what.disruptionHours === h}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                what.disruptionHours === h
                  ? "border-rose-400/50 bg-rose-400/10 text-rose-300"
                  : "border-white/10 text-slate-500 hover:border-white/20",
              )}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Overtime */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-400">Overtime</Label>
        <button
          onClick={() => onChange({ overtimeAvailable: !what.overtimeAvailable })}
          data-testid="dis-overtime"
          className={cn(
            "relative h-5 w-10 shrink-0 overflow-hidden rounded-full transition",
            what.overtimeAvailable ? "bg-emerald-500" : "bg-slate-700",
          )}
          aria-pressed={what.overtimeAvailable}
          aria-label="Overtime"
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              what.overtimeAvailable ? "translate-x-[22px]" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {/* Overtime cost */}
      <div>
        <Label className="text-xs text-slate-400">
          Overtime cost: €<span data-testid="dis-lab-overtime-cost-value">{what.overtimeCostPerHour}</span>/h
        </Label>
        <input
          type="range"
          min={50}
          max={400}
          step={10}
          value={what.overtimeCostPerHour}
          onChange={(e) => onChange({ overtimeCostPerHour: Number(e.target.value) })}
          data-testid="dis-overtime-cost"
          aria-label={`Overtime cost: €${what.overtimeCostPerHour}/h`}
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>€50/h</span><span>€400/h</span>
        </div>
      </div>

      {/* Critical deadline */}
      <div>
        <Label className="text-xs text-slate-400">
          Critical deadline (PDR-104): Day{" "}
          <span data-testid="dis-lab-deadline-value">{what.criticalDeadlineDays}</span>
        </Label>
        <input
          type="range"
          min={1}
          max={3}
          step={1}
          value={what.criticalDeadlineDays}
          onChange={(e) => onChange({ criticalDeadlineDays: Number(e.target.value) })}
          data-testid="dis-critical-deadline"
          aria-label={`Critical deadline: Day ${what.criticalDeadlineDays}`}
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>Day 1</span><span>Day 3</span>
        </div>
      </div>

      {/* Machine C capacity */}
      <div>
        <Label className="text-xs text-slate-400 mb-2 block">
          Machine C capacity:{" "}
          <span data-testid="dis-lab-capacity-value">{what.lineCCapacityHours}</span>h/day
        </Label>
        <div className="flex gap-2">
          {capOptions.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ lineCCapacityHours: c })}
              data-testid={`dis-capacity-${c}h`}
              aria-pressed={what.lineCCapacityHours === c}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                what.lineCCapacityHours === c
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                  : "border-white/10 text-slate-500 hover:border-white/20",
              )}
            >
              {c}h
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main workspace
// ---------------------------------------------------------------------------

export function ProductionSchedulingWorkspace({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startLocaleTransition] = useTransition();

  const copy = useMemo(() => getProductionSchedulingCopy(locale), [locale]);

  function switchLocale(next: Locale) {
    startLocaleTransition(() => {
      router.replace(buildLocalePath(pathname, next));
    });
  }

  // -------------------------------------------------------------------------
  // Active scenario: "standard" or "production-disruption"
  // -------------------------------------------------------------------------
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    return searchParams.get("scenario") ?? "baseline";
  });
  const isDisruptionScenario = activePresetId === "production-disruption";

  const [whatIf, setWhatIf] = useState<WhatIfState>(() => {
    const scenarioParam = searchParams.get("scenario");
    if (scenarioParam && scenarioParam !== "production-disruption") {
      const match = SCENARIO_PRESETS.find((p) => p.id === scenarioParam);
      if (match) return match.state;
    }
    return BASELINE_WHAT_IF;
  });
  const [simulationStep, setSimulationStep] = useState<SimulationStep>("idle");
  const [showFullPlan, setShowFullPlan] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // -------------------------------------------------------------------------
  // Disruption scenario state
  // -------------------------------------------------------------------------
  const [disruptionStep, setDisruptionStep] = useState<DisruptionSimStep>(() =>
    searchParams.get("scenario") === "production-disruption" ? "complete" : "idle",
  );
  const [disruptionShowFullPlan, setDisruptionShowFullPlan] = useState<boolean>(
    () => searchParams.get("scenario") === "production-disruption",
  );
  const [disruptionWhatIf, setDisruptionWhatIf] = useState<DisruptionWhatIfState>(
    BASELINE_DISRUPTION_WHAT_IF,
  );

  const pdrPreDisruptionResult = useMemo(
    () => getPdrPreDisruptionDecision(),
    [],
  );

  const pdrDisruptedResult = useMemo(() => {
    const { scenario, costConfigOverride } = buildPdrScenario(disruptionWhatIf);
    return runSchedulingEngine({
      scenario,
      costConfig: { ...DEFAULT_COST_CONFIG, ...costConfigOverride },
    });
  }, [disruptionWhatIf]);

  const pdrOrdersAtRisk = useMemo(
    () => getOrdersAtRisk(pdrDisruptedResult),
    [pdrDisruptedResult],
  );

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  /** Apply a preset and push its id into the URL so the link stays shareable. */
  function applyPreset(preset: typeof SCENARIO_PRESETS[number]) {
    clearTimers();
    setSimulationStep("idle");
    setShowFullPlan(false);
    setActivePresetId(preset.id);
    if (preset.id === "production-disruption") {
      setDisruptionStep("idle");
      setDisruptionShowFullPlan(false);
      setDisruptionWhatIf(BASELINE_DISRUPTION_WHAT_IF);
    } else {
      setWhatIf(preset.state);
    }
    const params = new URLSearchParams(searchParams.toString());
    if (preset.id === "baseline") {
      params.delete("scenario");
    } else {
      params.set("scenario", preset.id);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const baselineResult = useMemo(
    () => runSchedulingEngine({ scenario: DEFAULT_SCENARIO, costConfig: DEFAULT_COST_CONFIG }),
    [],
  );

  const scenResult = useMemo(() => {
    const builtScenario = buildSchedulingScenario(DEFAULT_SCENARIO, whatIf);
    const costOverride = buildCostConfigOverride(whatIf);
    return runSchedulingEngine({
      scenario: builtScenario,
      costConfig: { ...DEFAULT_COST_CONFIG, ...costOverride },
    });
  }, [whatIf]);

  const isBaseline = useMemo(
    () => JSON.stringify(whatIf) === JSON.stringify(BASELINE_WHAT_IF),
    [whatIf],
  );

  const displayResult = isBaseline ? baselineResult : scenResult;

  // Simulation visibility logic (standard scenario)
  const urgentActive = whatIf.includeUrgentOrder;
  const showProgress =
    simulationStep !== "idle" && simulationStep !== "complete";
  const showUrgentResult = urgentActive && !showProgress;
  const showMainPanels = !showProgress && (!urgentActive || showFullPlan);
  const showTrigger = !urgentActive && !showProgress;

  function handleSimulate() {
    clearTimers();
    setWhatIf((prev) => ({ ...prev, includeUrgentOrder: true }));
    setShowFullPlan(false);
    setSimulationStep("event");
    timers.current = [
      setTimeout(() => setSimulationStep("impact"), 1200),
      setTimeout(() => setSimulationStep("decision"), 2400),
      setTimeout(() => setSimulationStep("complete"), 3600),
    ];
  }

  function handleSkipAnimation() {
    clearTimers();
    setSimulationStep("complete");
  }

  function handleReset() {
    clearTimers();
    setWhatIf(BASELINE_WHAT_IF);
    setSimulationStep("idle");
    setShowFullPlan(false);
    setActivePresetId("baseline");
    setDisruptionStep("idle");
    setDisruptionShowFullPlan(false);
    setDisruptionWhatIf(BASELINE_DISRUPTION_WHAT_IF);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("scenario");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  // Disruption scenario handlers
  function handleActivateDisruption() {
    clearTimers();
    setDisruptionShowFullPlan(false);
    setDisruptionStep("detected");
    timers.current = [
      setTimeout(() => setDisruptionStep("impact"), 1000),
      setTimeout(() => setDisruptionStep("evaluating"), 2200),
      setTimeout(() => setDisruptionStep("complete"), 3400),
    ];
  }

  function handleSkipDisruptionAnimation() {
    clearTimers();
    setDisruptionStep("complete");
  }

  function handleResetDisruption() {
    clearTimers();
    setDisruptionStep("idle");
    setDisruptionShowFullPlan(false);
    setDisruptionWhatIf(BASELINE_DISRUPTION_WHAT_IF);
  }

  // Cleanup pending timers when component unmounts
  useEffect(() => clearTimers, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PSCopyContext.Provider value={copy}>
    <div className="min-h-screen bg-slate-950 text-slate-100" data-testid="production-scheduling">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={buildLocalePath("/", locale)}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.header.backLink}
          </Link>
          <select
            value={locale}
            onChange={(e) => switchLocale(e.target.value as Locale)}
            aria-label={copy.header.localeAriaLabel}
            className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none hover:border-white/20 focus:ring-1 focus:ring-cyan-400/40"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>
                {copy.localeOptions[l]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {copy.header.title}
            </h1>
            <Badge variant="cyan">{copy.header.badgeLabel}</Badge>
          </div>
          <p className="text-sm text-slate-400">
            {copy.header.subtitle}
          </p>
        </div>

        <Disclaimer
          text={
            whatIf.includeAerospaceOrder
              ? copy.disclaimer.aerospace
              : undefined
          }
        />

        {/* Disruption — always visible (standard scenario only) */}
        {!isDisruptionScenario && <DisruptionPanel scenario={displayResult.scenarioSnapshot} />}

        {/* ================================================================
            PRODUCTION DISRUPTION SCENARIO
            ================================================================ */}
        {isDisruptionScenario && (
          <>
            {/* Step 0: Trigger card */}
            {disruptionStep === "idle" && (
              <DisruptionTriggerCard onActivate={handleActivateDisruption} />
            )}

            {/* Steps 1–3: Progress animation */}
            {disruptionStep !== "idle" && disruptionStep !== "complete" && (
              <DisruptionProgressCard
                step={disruptionStep}
                onSkip={handleSkipDisruptionAnimation}
              />
            )}

            {/* Step 4: Results */}
            {disruptionStep === "complete" && (
              <>
                <DisruptionImpactSummary
                  preResult={pdrPreDisruptionResult}
                  disruptedResult={pdrDisruptedResult}
                  ordersAtRisk={pdrOrdersAtRisk}
                  machineBOrderCount={PDR_MACHINE_B_ORDER_IDS.length}
                />

                <DisruptionDecisionSummary
                  disruptedResult={pdrDisruptedResult}
                  ordersAtRisk={pdrOrdersAtRisk}
                />

                {/* WOW button — Find Best Recovery Plan */}
                {!disruptionShowFullPlan && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setDisruptionShowFullPlan(true)}
                      data-testid="find-best-recovery-plan"
                      className="gap-2 border-rose-400/30 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                      variant="secondary"
                    >
                      <Siren className="h-4 w-4" />
                      FIND BEST RECOVERY PLAN
                    </Button>
                    <Button
                      onClick={handleResetDisruption}
                      data-testid="reset-disruption"
                      variant="secondary"
                      className="gap-2"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      RESET TO BASELINE
                    </Button>
                  </div>
                )}

                {/* Full recovery plan */}
                {disruptionShowFullPlan && (
                  <>
                    <DisruptionBeforeAfterPanel
                      preResult={pdrPreDisruptionResult}
                      disruptedResult={pdrDisruptedResult}
                    />

                    <DisruptionFinancialPanel
                      preResult={pdrPreDisruptionResult}
                      disruptedResult={pdrDisruptedResult}
                    />

                    <AlternativesTable result={pdrDisruptedResult} />

                    <DisruptionScheduleDiff
                      disruptedResult={pdrDisruptedResult}
                    />

                    <DisruptionWhyThisPlan disruptedResult={pdrDisruptedResult} />

                    <DisruptionDecisionTrace disruptedResult={pdrDisruptedResult} />

                    <DisruptionSensitivityPanel disruptionWhat={disruptionWhatIf} />

                    <Button
                      onClick={handleResetDisruption}
                      data-testid="reset-disruption"
                      variant="secondary"
                      className="gap-2"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      RESET TO BASELINE
                    </Button>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ================================================================
            STANDARD SCENARIO (urgent order / what-if)
            ================================================================ */}
        {!isDisruptionScenario && (
          <>
            {/* WHAT IF? trigger — shown when no urgent order active */}
            {showTrigger && (
              <UrgentOrderTriggerCard onSimulate={handleSimulate} />
            )}

            {/* Simulation progress animation */}
            {showProgress && (
              <SimulationProgressCard
                step={simulationStep as Exclude<SimulationStep, "idle" | "complete">}
                onSkip={handleSkipAnimation}
              />
            )}

            {/* Simulation result panels */}
            {showUrgentResult && (
              <>
                <BeforeAfterPanel
                  baselineResult={baselineResult}
                  urgentResult={scenResult}
                />
                <WhatShouldWeDoCard
                  baselineResult={baselineResult}
                  urgentResult={scenResult}
                />

                {!showFullPlan && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setShowFullPlan(true)}
                      data-testid="find-better-plan"
                      className="gap-2 border-emerald-400/30 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                      variant="secondary"
                    >
                      <ArrowRight className="h-4 w-4" />
                      {copy.buttons.findBetterPlan}
                    </Button>
                    <Button
                      onClick={handleReset}
                      data-testid="reset-baseline"
                      variant="secondary"
                      className="gap-2"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {copy.buttons.resetToBaseline}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Main schedule panels */}
            {showMainPanels && (
              <>
                <RecommendedStrategyCard result={displayResult} />
                <WhyThisSchedule result={displayResult} />
                <FinancialImpactPanel result={displayResult} />
                <AlternativesTable result={displayResult} />
              </>
            )}

            {/* Reset button after full plan is shown */}
            {showUrgentResult && showFullPlan && (
              <Button onClick={handleReset} data-testid="reset-baseline" variant="secondary" className="gap-2">
                <RotateCcw className="h-3.5 w-3.5" />
                {copy.buttons.resetToBaseline}
              </Button>
            )}
          </>
        )}

        {/* Scenario Lab */}
        <Card className="border-cyan-300/20" data-testid="scenario-lab">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-base text-cyan-200">{copy.scenarioLab.title}</CardTitle>
              </div>
              {(!isBaseline || isDisruptionScenario) && (
                <button
                  onClick={isDisruptionScenario ? handleResetDisruption : handleReset}
                  data-testid="reset-baseline-lab"
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {copy.scenarioLab.resetToBaseline}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isDisruptionScenario
                ? "Adjust disruption parameters and observe how recovery options change."
                : copy.scenarioLab.description}
            </p>

            {/* Scenario presets */}
            <div className="mt-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {copy.scenarioLab.presetScenariosLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {SCENARIO_PRESETS.map((preset) => {
                  const isActive =
                    preset.id === "production-disruption"
                      ? isDisruptionScenario
                      : !isDisruptionScenario && JSON.stringify(whatIf) === JSON.stringify(preset.state);
                  return (
                    <button
                      key={preset.id}
                      data-testid={`preset-${preset.id}`}
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "rounded-lg border px-3 py-1 text-xs font-medium transition",
                        isActive
                          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                          : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300",
                      )}
                    >
                      {preset.id === "urgent-order" && (
                        <Zap className="mr-1 inline h-3 w-3 text-violet-400" />
                      )}
                      {preset.id === "critical-aerospace-order" && (
                        <Zap className="mr-1 inline h-3 w-3 text-amber-400" />
                      )}
                      {preset.id === "production-disruption" && (
                        <Siren className="mr-1 inline h-3 w-3 text-rose-400" />
                      )}
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isDisruptionScenario ? (
              <div className="grid gap-8 lg:grid-cols-2">
                <DisruptionLabControls
                  what={disruptionWhatIf}
                  onChange={(patch) =>
                    setDisruptionWhatIf((prev) => ({ ...prev, ...patch }))
                  }
                />
                <div>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    DISRUPTION SCENARIO RESULT
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <StatBox
                        label="Recommended recovery"
                        value={
                          pdrDisruptedResult.decisionStatus === "NO_FEASIBLE_ALTERNATIVE"
                            ? "No recovery"
                            : pdrDisruptedResult.strategies
                                .find(
                                  (s) =>
                                    s.strategyId ===
                                    pdrDisruptedResult.recommendedStrategy,
                                )
                                ?.strategyLabel.toUpperCase() ?? "—"
                        }
                        accent={
                          pdrDisruptedResult.decisionStatus === "NO_FEASIBLE_ALTERNATIVE"
                            ? "rose"
                            : "emerald"
                        }
                      />
                      <StatBox
                        label="Orders at risk"
                        value={`${pdrOrdersAtRisk.length}`}
                        accent={pdrOrdersAtRisk.length > 0 ? "amber" : "emerald"}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <StatBox
                        label="Avoided impact"
                        value={eur(pdrDisruptedResult.avoidedCostVsBaseline)}
                        accent="emerald"
                      />
                      <StatBox
                        label="Total impact"
                        value={eur(pdrDisruptedResult.totalFinancialImpact)}
                        accent="amber"
                      />
                    </div>
                    <DisruptionSensitivityPanel disruptionWhat={disruptionWhatIf} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-2">
                <ScenarioLabControls
                  what={whatIf}
                  onChange={(patch) => setWhatIf((prev) => ({ ...prev, ...patch }))}
                />
                <div>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {isBaseline ? copy.scenarioLab.baselineResult : copy.scenarioLab.scenarioResult}
                  </p>
                  <ScenarioLabResult
                    baseResult={baselineResult}
                    scenResult={scenResult}
                    what={whatIf}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decision trace */}
        {!isDisruptionScenario && <DecisionTracePanel result={displayResult} />}

        {/* Assumptions */}
        <AssumptionsPanel isDisruptionScenario={isDisruptionScenario} />

        {/* Audit trail */}
        {!isDisruptionScenario && <AuditTrailPanel result={displayResult} />}
        {isDisruptionScenario && <AuditTrailPanel result={pdrDisruptedResult} />}
      </div>
    </div>
    </PSCopyContext.Provider>
  );
}
