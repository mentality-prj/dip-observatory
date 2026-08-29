"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import {
  runProductionReplanningEngine,
  DEFAULT_COST_CONFIG,
  PRODUCTION_RULES,
} from "@/production-replanning/lib/engine";
import { DEFAULT_SCENARIO } from "@/production-replanning/data/scenario";
import type {
  ActionId,
  AlternativeEvaluation,
  FeasibilityStatus,
  ProductionScenario,
} from "@/production-replanning/types";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function eur(v: number) {
  return `€${v.toLocaleString("de-DE")}`;
}

function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

function signPct(v: number) {
  const s = (v * 100).toFixed(0);
  return v >= 0 ? `+${s}%` : `${s}%`;
}

// ---------------------------------------------------------------------------
// Scenario state derived from controls
// ---------------------------------------------------------------------------

interface WhatIfState {
  capacityReductionPct: number; // 0–60
  disruptionDurationDays: number; // 1–10
  materialATonnes: number;
  criticalDeadlineDays: number; // 1–14
  overtimeAvailable: boolean;
}

function buildScenario(
  base: ProductionScenario,
  what: WhatIfState,
): ProductionScenario {
  return {
    ...base,
    scenarioId: `${base.scenarioId}-WHATIF`,
    materials: base.materials.map((m) =>
      m.id === "MAT-A" ? { ...m, availableTonnes: what.materialATonnes } : m,
    ),
    orders: base.orders.map((o) =>
      o.priority === "CRITICAL" ? { ...o, deadlineDays: what.criticalDeadlineDays } : o,
    ),
    disruption: {
      ...base.disruption,
      capacityReductionFactor: what.capacityReductionPct / 100,
      durationDays: what.disruptionDurationDays,
    },
    overtimeAvailable: what.overtimeAvailable,
  };
}

// ---------------------------------------------------------------------------
// Colour maps
// ---------------------------------------------------------------------------

const ACTION_COLOUR: Record<ActionId, "emerald" | "amber" | "rose" | "cyan"> = {
  REDISTRIBUTE_PRODUCTION: "emerald",
  PRIORITIZE_CRITICAL_ORDER: "cyan",
  DELAY_LOW_PRIORITY_ORDER: "amber",
  KEEP_CURRENT_PLAN: "rose",
};

const FEASIBILITY_COLOUR: Record<FeasibilityStatus, "emerald" | "rose"> = {
  FEASIBLE: "emerald",
  INFEASIBLE: "rose",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
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
        Synthetic demonstration — not BTS &amp; SAKER production data
      </p>
    </div>
  );
}

function DisruptionAlert({ scenario }: { scenario: ProductionScenario }) {
  const affectedLine = scenario.lines.find(
    (l) => l.id === scenario.disruption.affectedLineId,
  );
  const before = affectedLine?.normalCapacityTpd ?? 0;
  const after = before * (1 - scenario.disruption.capacityReductionFactor);
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <span className="text-sm font-semibold uppercase tracking-widest text-rose-300">
              Production disruption
            </span>
          </div>
          <Badge variant="rose">At risk</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox label="Line A capacity" value={`${before} → ${after.toFixed(0)} t/day`} accent="rose" />
          <StatBox label="Reduction" value={`−${(scenario.disruption.capacityReductionFactor * 100).toFixed(0)}%`} accent="rose" />
          <StatBox label="Affected period" value={`${scenario.disruption.durationDays} days`} accent="amber" />
          <StatBox label="Current plan" value="At risk" accent="rose" />
        </div>
      </CardContent>
    </Card>
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
  accent?: "rose" | "amber" | "emerald" | "cyan" | "neutral";
  sub?: string;
}) {
  const colourMap = {
    rose: "text-rose-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    cyan: "text-cyan-300",
    neutral: "text-white",
  };
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold", colourMap[accent])}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function RecommendedAction({
  alternatives,
  recommendedId,
  avoidedCost,
}: {
  alternatives: AlternativeEvaluation[];
  recommendedId: ActionId;
  avoidedCost: number;
}) {
  const rec = alternatives.find((a) => a.actionId === recommendedId)!;
  const baseline = alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;

  return (
    <Card className="border-emerald-300/20">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Recommended action
            </p>
            <CardTitle className="mt-1 text-2xl text-emerald-200">
              {rec.actionLabel.toUpperCase()}
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="emerald">Recommended</Badge>
            <Badge variant="emerald">{pct(rec.score.composite)} score</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox
            label="Estimated impact"
            value={eur(rec.financialImpact.total)}
            accent="emerald"
          />
          <StatBox
            label="vs. keep current plan"
            value={eur(baseline.financialImpact.total)}
            accent="rose"
          />
          <StatBox
            label="Potential avoided cost"
            value={eur(avoidedCost)}
            accent="emerald"
          />
          <StatBox
            label="Critical deadlines"
            value={rec.operationalConsequences.criticalOrderDeadlineProtected ? "Protected" : "At risk"}
            accent={rec.operationalConsequences.criticalOrderDeadlineProtected ? "emerald" : "rose"}
          />
        </div>
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Synthetic demonstration values
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function WhyPanel({
  explanation,
}: {
  explanation: ReturnType<typeof runProductionReplanningEngine>["explanation"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Why this recommendation?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {explanation.reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              {r.direction === "positive" ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              )}
              <div>
                <span className={cn("text-sm font-medium", r.direction === "positive" ? "text-emerald-200" : "text-rose-200")}>
                  {r.label}
                </span>
                <p className="text-xs text-slate-400">{r.evidence}</p>
              </div>
            </div>
          ))}
        </div>

        {explanation.rejectedAlternatives.length > 0 && (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Rejected alternatives
            </p>
            <div className="mt-2 space-y-1.5">
              {explanation.rejectedAlternatives.map((r) => (
                <div key={r.actionId} className="flex items-start gap-2">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <div>
                    <span className="text-xs font-medium text-slate-300">
                      {r.actionId.replace(/_/g, " ")}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">— {r.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CurrentVsRecommended({
  alternatives,
  recommendedId,
}: {
  alternatives: AlternativeEvaluation[];
  recommendedId: ActionId;
}) {
  const current = alternatives.find((a) => a.actionId === "KEEP_CURRENT_PLAN")!;
  const rec = alternatives.find((a) => a.actionId === recommendedId)!;

  const rows = [
    {
      label: "Estimated total cost",
      current: eur(current.financialImpact.total),
      recommended: eur(rec.financialImpact.total),
    },
    {
      label: "Critical deadlines",
      current: current.operationalConsequences.criticalOrderDeadlineProtected ? "Protected" : "At risk",
      recommended: rec.operationalConsequences.criticalOrderDeadlineProtected ? "Protected" : "At risk",
    },
    {
      label: "Capacity utilisation",
      current: pct(current.operationalConsequences.capacityUtilizationFactor),
      recommended: pct(rec.operationalConsequences.capacityUtilizationFactor),
    },
    {
      label: "Tonnes processed",
      current: `${current.operationalConsequences.totalTonnesProcessed.toFixed(0)} t`,
      recommended: `${rec.operationalConsequences.totalTonnesProcessed.toFixed(0)} t`,
    },
    {
      label: "Missed deadline cost",
      current: eur(current.financialImpact.missedDeadlineCost),
      recommended: eur(rec.financialImpact.missedDeadlineCost),
    },
    {
      label: "Overtime cost",
      current: eur(current.financialImpact.overtimeCost),
      recommended: eur(rec.financialImpact.overtimeCost),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current plan vs. recommended plan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="pb-2 text-left text-xs text-slate-500" />
                <th className="pb-2 text-left text-xs font-semibold uppercase tracking-widest text-rose-400">
                  Current plan
                </th>
                <th className="pb-2 text-left text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Recommended
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="py-2 text-xs text-slate-400">{row.label}</td>
                  <td className="py-2 text-xs text-white">{row.current}</td>
                  <td className="py-2 text-xs text-emerald-300">{row.recommended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AlternativeCard({ alt }: { alt: AlternativeEvaluation }) {
  const [expanded, setExpanded] = useState(false);
  const colour = ACTION_COLOUR[alt.actionId];
  return (
    <Card className={alt.rank === 1 ? "border-emerald-300/20" : ""}>
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">#{alt.rank}</span>
            <span className="font-medium text-white">{alt.actionLabel}</span>
            <Badge variant={FEASIBILITY_COLOUR[alt.feasibility]}>{alt.feasibility}</Badge>
            <Badge variant={colour}>{pct(alt.score.composite)} score</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-200">{eur(alt.financialImpact.total)}</span>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {expanded ? "Less" : "Details"}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-white/8 pt-4">
            {/* Financial breakdown */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Financial breakdown
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-xl bg-white/4 px-3 py-2">
                  <p className="text-slate-500">Missed deadline</p>
                  <p className="text-white">{eur(alt.financialImpact.missedDeadlineCost)}</p>
                </div>
                <div className="rounded-xl bg-white/4 px-3 py-2">
                  <p className="text-slate-500">Overtime</p>
                  <p className="text-white">{eur(alt.financialImpact.overtimeCost)}</p>
                </div>
                <div className="rounded-xl bg-white/4 px-3 py-2">
                  <p className="text-slate-500">Delay cost</p>
                  <p className="text-white">{eur(alt.financialImpact.delayCost)}</p>
                </div>
                <div className="rounded-xl bg-white/4 px-3 py-2">
                  <p className="text-slate-500">Unused capacity</p>
                  <p className="text-white">{eur(alt.financialImpact.unusedCapacityCost)}</p>
                </div>
                <div className="rounded-xl bg-white/4 px-3 py-2">
                  <p className="text-slate-500">Switching cost</p>
                  <p className="text-white">{eur(alt.financialImpact.switchingCost)}</p>
                </div>
                <div className="rounded-xl bg-white/4 px-3 py-2">
                  <p className="text-slate-500 font-medium">Total</p>
                  <p className="text-white font-semibold">{eur(alt.financialImpact.total)}</p>
                </div>
              </div>
            </div>

            {/* Rule results */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Rule evaluation
              </p>
              <div className="space-y-1.5">
                {alt.ruleResults.map((r) => (
                  <div key={r.ruleId} className="flex items-start gap-2">
                    {r.passed ? (
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                    )}
                    <div>
                      <span className="text-xs font-medium text-slate-300">{r.ruleId}</span>
                      <span className="ml-1 text-xs text-slate-500">{r.ruleName}</span>
                      <p className="text-xs text-slate-400">{r.evidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Blocking constraints */}
            {alt.blockingConstraints.length > 0 && (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-300/5 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-rose-400">
                  Blocking constraints
                </p>
                {alt.blockingConstraints.map((c, i) => (
                  <p key={i} className="text-xs text-rose-300">{c}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WhatIfControls({
  state,
  onChange,
}: {
  state: WhatIfState;
  onChange: (s: WhatIfState) => void;
}) {
  function update(patch: Partial<WhatIfState>) {
    onChange({ ...state, ...patch });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change scenario</CardTitle>
        <p className="text-sm text-slate-400">
          Adjust any parameter — the decision engine recalculates immediately.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="cap-reduction">Line A capacity reduction (%)</Label>
            <Input
              id="cap-reduction"
              type="number"
              min={0}
              max={60}
              step={5}
              value={state.capacityReductionPct}
              onChange={(e) => update({ capacityReductionPct: Number(e.target.value) })}
            />
            <p className="text-xs text-slate-500">0–60%</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disruption-days">Disruption duration (days)</Label>
            <Input
              id="disruption-days"
              type="number"
              min={1}
              max={10}
              step={1}
              value={state.disruptionDurationDays}
              onChange={(e) => update({ disruptionDurationDays: Number(e.target.value) })}
            />
            <p className="text-xs text-slate-500">1–10 days</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mat-a">Material A available (tonnes)</Label>
            <Input
              id="mat-a"
              type="number"
              min={50}
              max={600}
              step={10}
              value={state.materialATonnes}
              onChange={(e) => update({ materialATonnes: Number(e.target.value) })}
            />
            <p className="text-xs text-slate-500">50–600 t</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="critical-deadline">Critical order deadline (days)</Label>
            <Input
              id="critical-deadline"
              type="number"
              min={1}
              max={14}
              step={1}
              value={state.criticalDeadlineDays}
              onChange={(e) => update({ criticalDeadlineDays: Number(e.target.value) })}
            />
            <p className="text-xs text-slate-500">1–14 days</p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              id="overtime"
              role="checkbox"
              aria-checked={state.overtimeAvailable}
              aria-label="Overtime available"
              onClick={() => update({ overtimeAvailable: !state.overtimeAvailable })}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
                state.overtimeAvailable ? "bg-cyan-500" : "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition",
                  state.overtimeAvailable ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
            <Label htmlFor="overtime">Overtime available</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DecisionFactorsPanel({
  factors,
}: {
  factors: ReturnType<typeof runProductionReplanningEngine>["decisiveFactors"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Decisive factors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {factors.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              {f.direction === "positive" ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              )}
              <div>
                <span className="text-sm font-medium text-white">{f.label}</span>
                <p className="text-xs text-slate-400">{f.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AssumptionsPanel() {
  const costs = DEFAULT_COST_CONFIG;
  const rows = [
    { label: "Missed CRITICAL deadline", value: `${eur(costs.missedCriticalDeadlineCostPerTonneDay)} / t·day` },
    { label: "Missed HIGH deadline", value: `${eur(costs.missedHighDeadlineCostPerTonneDay)} / t·day` },
    { label: "Overtime premium", value: `${eur(costs.overtimeCostPerTonne)} / t` },
    { label: "Production delay (NORMAL)", value: `${eur(costs.productionDelayCostPerTonneDay)} / t·day` },
    { label: "Unused capacity opportunity cost", value: `${eur(costs.unusedCapacityCostPerTpdDay)} / t/day · day` },
    { label: "Material handling / line switching", value: `${eur(costs.materialHandlingSwitchCost)} (one-time)` },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost assumptions</CardTitle>
        <p className="text-xs text-slate-500">
          All values are synthetic demonstration assumptions. Not BTS &amp; SAKER figures.
        </p>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="py-2 text-xs text-slate-400">{r.label}</td>
                <td className="py-2 text-xs text-right font-mono text-slate-200">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function AuditTrailPanel({
  audit,
}: {
  audit: ReturnType<typeof runProductionReplanningEngine>["auditTrail"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 font-mono text-xs text-slate-400">
          <p><span className="text-slate-500">Decision ID:</span> {audit.decisionId}</p>
          <p><span className="text-slate-500">Scenario ID:</span> {audit.scenarioId}</p>
          <p><span className="text-slate-500">Engine version:</span> {audit.engineVersion}</p>
          <p><span className="text-slate-500">Config version:</span> {audit.configVersion}</p>
          <p><span className="text-slate-500">Computed at:</span> {audit.computedAt}</p>
          <p><span className="text-slate-500">Alternatives evaluated:</span> {audit.alternativesEvaluated.join(", ")}</p>
          <p><span className="text-slate-500">Rules executed:</span> {audit.rulesExecuted.join(", ")}</p>
          <p><span className="text-slate-500">Recommended action:</span> {audit.recommendedAction}</p>
          <p><span className="text-slate-500">Decision status:</span> {audit.decisionStatus}</p>
          <p><span className="text-slate-500">Total financial impact:</span> {eur(audit.totalFinancialImpact)}</p>
          <p><span className="text-slate-500">Avoided cost vs baseline:</span> {eur(audit.avoidedCostVsBaseline)}</p>
          <p><span className="text-slate-500">Source:</span> {audit.source}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main workspace
// ---------------------------------------------------------------------------

export function ProductionReplanningWorkspace({ locale }: { locale: Locale }) {
  const [whatIf, setWhatIf] = useState<WhatIfState>({
    capacityReductionPct: 30,
    disruptionDurationDays: 3,
    materialATonnes: 420,
    criticalDeadlineDays: 4,
    overtimeAvailable: true,
  });

  const scenario = useMemo(
    () => buildScenario(DEFAULT_SCENARIO, whatIf),
    [whatIf],
  );

  const decision = useMemo(() => {
    return runProductionReplanningEngine({ scenario });
  }, [scenario]);

  const sortedAlts = [...decision.alternatives].sort((a, b) => a.rank - b.rank);

  return (
    <div className="min-h-screen bg-[#060810] text-white">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={buildLocalePath("/", locale)}
              className="mb-3 flex items-center gap-2 text-xs text-slate-500 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Observatory
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Production Disruption Decision
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Battery recycling · Production replanning demonstrator
            </p>
          </div>
          <Disclaimer />
        </div>

        {/* 1. Disruption alert */}
        <DisruptionAlert scenario={scenario} />

        {/* 2. Recommended action */}
        <RecommendedAction
          alternatives={decision.alternatives}
          recommendedId={decision.recommendedAction}
          avoidedCost={decision.avoidedCostVsBaseline}
        />

        {/* 3. Why */}
        <WhyPanel explanation={decision.explanation} />

        {/* 4. Current vs Recommended */}
        <CurrentVsRecommended
          alternatives={decision.alternatives}
          recommendedId={decision.recommendedAction}
        />

        {/* 5. What-if */}
        <WhatIfControls state={whatIf} onChange={setWhatIf} />

        {/* 6. Alternatives */}
        <div>
          <SectionLabel>All alternatives — ranked</SectionLabel>
          <div className="space-y-3">
            {sortedAlts.map((alt) => (
              <AlternativeCard key={alt.actionId} alt={alt} />
            ))}
          </div>
        </div>

        {/* 7. Decisive factors */}
        <DecisionFactorsPanel factors={decision.decisiveFactors} />

        {/* 8. Rule catalogue */}
        <Card>
          <CardHeader>
            <CardTitle>Rules catalogue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PRODUCTION_RULES.map((rule) => (
                <div key={rule.id} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    {rule.id}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-white">{rule.name}</span>
                    {rule.blocking && (
                      <Badge variant="rose" className="ml-2 text-[9px]">
                        blocking
                      </Badge>
                    )}
                    <p className="text-xs text-slate-400">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 9. Assumptions */}
        <AssumptionsPanel />

        {/* 10. Audit trail */}
        <AuditTrailPanel audit={decision.auditTrail} />

        {/* Footer */}
        <div className="pb-8 text-center">
          <p className="text-xs text-slate-600">
            Engine v{decision.engineVersion} · Config v{decision.configVersion} ·{" "}
            Synthetic demonstration — not BTS &amp; SAKER production data
          </p>
        </div>
      </div>
    </div>
  );
}
