"use client";

import { useState, useMemo, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  FlaskConical,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import {
  runSchedulingEngine,
  DEFAULT_COST_CONFIG,
  CONSTRAINT_RULES,
} from "@/production-scheduling/lib/engine";
import { DEFAULT_SCENARIO } from "@/production-scheduling/data/scenario";
import {
  computeSchedulingSensitivity,
  computeSchedulingTraceDiff,
  computeSchedulingDecisionDelta,
} from "@/production-scheduling/lib/scenario-lab-helpers";
import {
  buildSchedulingScenario,
  buildCostConfigOverride,
  BASELINE_WHAT_IF,
  type WhatIfState,
} from "@/production-scheduling/lib/what-if";
import type {
  FeasibilityStatus,
  ScheduledTask,
  SchedulingDecisionResponse,
  SchedulingScenario,
  StrategyEvaluation,
  StrategyId,
} from "@/production-scheduling/types";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function eur(v: number) {
  return `€${Math.round(v).toLocaleString("de-DE")}`;
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

function Disclaimer() {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-2">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-amber-200/80">
        Synthetic demonstration — not SURMA SYSTEMS production data
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
  const line = scenario.lines.find((l) => l.id === scenario.disruption.affectedLineId);
  const before = line?.normalHoursPerDay ?? 8;
  const after = before * (1 - scenario.disruption.capacityReductionFactor);
  const hoursLost =
    (before - after) * scenario.disruption.durationDays;
  const hoursRemaining = after * scenario.disruption.durationDays;

  return (
    <Card className="border-rose-300/20 bg-rose-900/10">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <span className="text-sm font-semibold uppercase tracking-widest text-rose-300">
            Production disruption
          </span>
          <Badge variant="rose">Capacity at risk</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox
            label={`${line?.name ?? "Affected line"}`}
            value={`${before}h → ${after.toFixed(0)}h/day`}
            accent="rose"
          />
          <StatBox
            label="Capacity reduction"
            value={`−${(scenario.disruption.capacityReductionFactor * 100).toFixed(0)}%`}
            accent="rose"
          />
          <StatBox
            label="Duration"
            value={`${scenario.disruption.durationDays} day(s)`}
            accent="amber"
          />
          <StatBox
            label="Hours lost (disruption period)"
            value={`${hoursLost.toFixed(0)}h`}
            accent="amber"
            sub={`${hoursRemaining.toFixed(0)}h remaining`}
          />
        </div>
        {scenario.disruption.reason && (
          <p className="mt-3 text-xs text-slate-500">
            Reason: {scenario.disruption.reason}
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
  const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
  const baseline = result.strategies.find((s) => s.strategyId === "KEEP_CURRENT_SCHEDULE");
  if (!rec) return null;

  const cls = STRATEGY_CLASSES[result.recommendedStrategy];
  const lineIds = [...new Set(rec.schedule.map((t) => t.lineId))].sort();

  return (
    <Card className={cls.border}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${cls.headerText}`}>
              Recommended schedule
            </p>
            <CardTitle className={`mt-1 text-xl ${cls.titleText}`}>
              {rec.strategyLabel.toUpperCase()}
            </CardTitle>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Avoided cost vs. current plan</p>
            <p className="text-2xl font-bold text-emerald-300">{eur(result.avoidedCostVsBaseline)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox
            label="Orders on time"
            value={`${rec.onTimeCount} / ${rec.totalOrders}`}
            accent="emerald"
          />
          <StatBox
            label="Orders delayed"
            value={`${rec.delayedCount}`}
            accent={rec.delayedCount > 0 ? "amber" : "emerald"}
          />
          <StatBox
            label="Total impact"
            value={eur(rec.financialImpact.totalCost)}
            accent="amber"
            sub={`vs ${baseline ? eur(baseline.financialImpact.totalCost) : "—"} current`}
          />
          <StatBox
            label="Capacity utilisation"
            value={pct(rec.score.capacityUtilization)}
            accent="cyan"
          />
        </div>

        <div>
          <SectionLabel>Production schedule</SectionLabel>
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
              Avoided cost
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">
              {eur(result.avoidedCostVsBaseline)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Compared to keeping the current schedule under disruption.
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

  const rows: Array<{ label: string; keep: number; rec: number }> = [
    { label: "Delay cost", keep: keep?.financialImpact.delayCost ?? 0, rec: rec.financialImpact.delayCost },
    { label: "Overtime cost", keep: keep?.financialImpact.overtimeCost ?? 0, rec: rec.financialImpact.overtimeCost },
    { label: "Setup / changeover cost", keep: keep?.financialImpact.setupCost ?? 0, rec: rec.financialImpact.setupCost },
    { label: "Unused capacity cost", keep: keep?.financialImpact.unusedCapacityCost ?? 0, rec: rec.financialImpact.unusedCapacityCost },
    { label: "Total operational impact", keep: keep?.financialImpact.totalCost ?? 0, rec: rec.financialImpact.totalCost },
    { label: "Revenue at risk", keep: keep?.financialImpact.revenueAtRisk ?? 0, rec: rec.financialImpact.revenueAtRisk },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Financial Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 text-left text-xs text-slate-400" />
                <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-rose-400">
                  Current Schedule
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  {rec.strategyLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isBetter = row.rec < row.keep;
                const isTotal = i === rows.length - 2;
                const isRevenue = i === rows.length - 1;
                return (
                  <tr
                    key={row.label}
                    className={cn(
                      "border-b border-white/5",
                      isTotal && "font-semibold",
                      isRevenue && "text-amber-300/80",
                    )}
                  >
                    <td className="py-2 pr-4 text-slate-400">{row.label}</td>
                    <td className="py-2 pr-4 text-right text-rose-300">{eur(row.keep)}</td>
                    <td className={cn("py-2 text-right", isBetter ? "text-emerald-300" : "text-slate-300")}>
                      {eur(row.rec)}
                      {isBetter && row.keep - row.rec > 0 && (
                        <span className="ml-2 text-xs text-emerald-400">
                          −{eur(row.keep - row.rec)}
                        </span>
                      )}
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alternative Schedules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Alternative", "Feasible", "On time", "Delayed", "Total impact", "Score", ""].map((h) => (
                  <th key={h} className="py-2 pr-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.strategies.map((s) => {
                const isRec = s.strategyId === result.recommendedStrategy;
                return (
                  <tr key={s.strategyId} className="border-b border-white/5">
                    <td className={cn("py-2 pr-3 font-medium", isRec && STRATEGY_CELL_TEXT[s.strategyId])}>
                      {s.strategyLabel}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant={FEASIBILITY_COLOUR[s.feasibility]}>
                        {s.feasibility}
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
                      {s.feasibility === "FEASIBLE" ? s.score.composite.toFixed(3) : "—"}
                    </td>
                    <td className="py-2">
                      {isRec ? (
                        <Badge variant="emerald">Recommended</Badge>
                      ) : s.feasibility === "INFEASIBLE" ? (
                        <span className="text-xs text-rose-400">
                          {s.blockingConstraints[0] ?? "Constraint violated"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {eur(
                            s.financialImpact.totalCost -
                              (result.strategies.find((x) => x.strategyId === result.recommendedStrategy)
                                ?.financialImpact.totalCost ?? 0),
                          )}{" "}
                          higher cost
                        </span>
                      )}
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Why This Schedule?</CardTitle>
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

function AssumptionsPanel() {
  return (
    <CollapseSection title="Assumptions">
      <div className="space-y-3 text-xs text-slate-400">
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-amber-200/80">
          All values are synthetic demonstration assumptions. Not SURMA SYSTEMS actual economics.
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
              ["Critical order (#101)", "Premium Pergola, deadline: Day 1, penalty €2,000/day"],
              ["Critical order (#102)", "Double Carport, deadline: Day 2, penalty €1,500/day"],
              ["Disruption (baseline)", "Line B −25% for 2 days (maintenance)"],
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
  const a = result.auditTrail;
  return (
    <CollapseSection title="Audit Trail">
      <div className="space-y-2 font-mono text-[11px] text-slate-400">
        {[
          ["Decision ID", a.decisionId],
          ["Scenario ID", a.scenarioId],
          ["Computed at", a.computedAt],
          ["Engine version", a.engineVersion],
          ["Config version", a.configVersion],
          ["Decision status", a.decisionStatus],
          ["Recommended strategy", a.recommendedStrategy],
          ["Strategies evaluated", a.strategiesEvaluated.join(", ")],
          ["Rules executed", a.rulesExecuted.join(", ")],
          ["Total financial impact", eur(a.totalFinancialImpact)],
          ["Avoided cost vs baseline", eur(a.avoidedCostVsBaseline)],
          ["Source", a.source],
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
  const rec = result.strategies.find((s) => s.strategyId === result.recommendedStrategy);
  if (!rec) return null;

  return (
    <CollapseSection title="Decision Trace">
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
// Scenario Lab — what-if controls
// ---------------------------------------------------------------------------

function ScenarioLabControls({
  what,
  onChange,
}: {
  what: WhatIfState;
  onChange: (patch: Partial<WhatIfState>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs text-slate-400">
          Line B capacity reduction: {what.lineBCapacityReductionPct}%
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
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>0%</span><span>60%</span>
        </div>
      </div>

      <div>
        <Label className="text-xs text-slate-400">
          Disruption duration: {what.disruptionDurationDays} day(s)
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
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>1 day</span><span>5 days</span>
        </div>
      </div>

      <div>
        <Label className="text-xs text-slate-400">
          Critical order #101 deadline: Day {what.criticalOrderDeadlineDays}
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
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>Day 1</span><span>Day 5</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-400">
          ORDER-103 material available
        </Label>
        <button
          onClick={() =>
            onChange({ order103MaterialAvailable: !what.order103MaterialAvailable })
          }
          className={cn(
            "relative h-5 w-10 rounded-full transition",
            what.order103MaterialAvailable ? "bg-emerald-500" : "bg-slate-700",
          )}
          aria-pressed={what.order103MaterialAvailable}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              what.order103MaterialAvailable ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-400">Overtime enabled</Label>
        <button
          onClick={() => onChange({ overtimeAvailable: !what.overtimeAvailable })}
          className={cn(
            "relative h-5 w-10 rounded-full transition",
            what.overtimeAvailable ? "bg-emerald-500" : "bg-slate-700",
          )}
          aria-pressed={what.overtimeAvailable}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              what.overtimeAvailable ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div>
        <Label className="text-xs text-slate-400">
          Overtime cost: €{what.overtimeCostPerHour}/h
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
          className="mt-1 w-full accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>€50/h</span><span>€400/h</span>
        </div>
      </div>

      <div>
        <Label className="text-xs text-slate-400 mb-2 block">
          ORDER-116 priority
        </Label>
        <div className="flex gap-2">
          {(["HIGH", "NORMAL", "LOW"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onChange({ order116Priority: p })}
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
        <div className="rounded-2xl border border-cyan-300/30 bg-cyan-900/20 px-4 py-3">
          <p className="text-sm font-semibold text-cyan-300">Decision changed</p>
          <p className="mt-1 text-sm text-slate-300">
            <span className="text-rose-300 line-through mr-2">{delta.baselineDecision.replace(/_/g, " ")}</span>
            →
            <span className="text-emerald-300 ml-2">{delta.scenarioDecision.replace(/_/g, " ")}</span>
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-600/30 bg-slate-800/30 px-4 py-3">
          <p className="text-sm font-medium text-slate-400">
            Decision unchanged: <span className="text-slate-300">{delta.scenarioDecision.replace(/_/g, " ")}</span>
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
            label="Scenario total impact"
            value={eur(recStrategy.financialImpact.totalCost)}
            accent="amber"
          />
          <StatBox
            label="Cost delta vs baseline"
            value={`${delta.financialDelta >= 0 ? "+" : ""}${eur(delta.financialDelta)}`}
            accent={delta.financialDelta <= 0 ? "emerald" : "rose"}
          />
        </div>
      )}

      {/* Why did it change? */}
      {delta.changed && scenResult.explanation.reasons.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Why did it change?
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
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Trace diff — changed rules
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
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Decision sensitivity
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
                {s.level}
              </Badge>
            </div>
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
  const [whatIf, setWhatIf] = useState<WhatIfState>(BASELINE_WHAT_IF);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={buildLocalePath("/", locale)}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Observatory
          </Link>
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              Production Scheduling
            </h1>
            <Badge variant="cyan">Decision Engine</Badge>
          </div>
          <p className="text-sm text-slate-400">
            SURMA SYSTEMS · Pergolas, Carports &amp; Shading — Scheduling Decision Demonstrator
          </p>
        </div>

        <Disclaimer />

        {/* Disruption */}
        <DisruptionPanel scenario={displayResult.scenarioSnapshot} />

        {/* Recommended schedule */}
        <RecommendedStrategyCard result={displayResult} />

        {/* Why this schedule */}
        <WhyThisSchedule result={displayResult} />

        {/* Financial impact */}
        <FinancialImpactPanel result={displayResult} />

        {/* Alternative schedules */}
        <AlternativesTable result={displayResult} />

        {/* Scenario Lab */}
        <Card className="border-cyan-300/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-base text-cyan-200">Scenario Lab</CardTitle>
              </div>
              {!isBaseline && (
                <button
                  onClick={() => setWhatIf(BASELINE_WHAT_IF)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to baseline
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Change production conditions — the engine recalculates the schedule.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 lg:grid-cols-2">
              <ScenarioLabControls
                what={whatIf}
                onChange={(patch) => setWhatIf((prev) => ({ ...prev, ...patch }))}
              />
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {isBaseline ? "Baseline result" : "Scenario result"}
                </p>
                <ScenarioLabResult
                  baseResult={baselineResult}
                  scenResult={scenResult}
                  what={whatIf}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Decision trace */}
        <DecisionTracePanel result={displayResult} />

        {/* Assumptions */}
        <AssumptionsPanel />

        {/* Audit trail */}
        <AuditTrailPanel result={displayResult} />
      </div>
    </div>
  );
}
