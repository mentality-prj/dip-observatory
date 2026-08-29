"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Package } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecisionScenarioLab } from "@/components/decision-scenario-lab";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import {
  DEMO_REQUEST,
  DEMO_SUPPLIERS,
} from "@/supplier/data/synthetic-supplier-data";
import {
  DEFAULT_SCORE_WEIGHTS,
  DEFAULT_SUPPLIER_CONFIG,
  runSupplierDecisionPlugin,
} from "@/supplier/lib/supplier-decision";
import {
  computeSupplierSensitivity,
  computeSupplierTraceDiff,
} from "@/supplier/lib/scenario-lab-helpers";
import type {
  RiskLevel,
  SupplierDecisionRequest,
  SupplierDecisionResponse,
  SupplierDecisionFactor,
  SupplierDecisionOutcome,
  SupplierDecisionTrace,
  SupplierEvaluation,
  SupplierAuditEntry,
} from "@/supplier/types/supplier-decision";

const RISK_BADGE: Record<RiskLevel, "emerald" | "amber" | "rose"> = {
  LOW: "emerald",
  MEDIUM: "amber",
  HIGH: "rose",
};

const DECISION_BADGE: Record<
  SupplierDecisionOutcome,
  "emerald" | "amber" | "rose"
> = {
  APPROVE: "emerald",
  APPROVE_WITH_CONDITIONS: "amber",
  REJECT: "rose",
};

function formatPct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

function formatEur(v: number) {
  return `€${(v / 1_000_000).toFixed(2)}M`;
}

function formatPctInput(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

interface SupplierScenarioState {
  financialRisk: RiskLevel;
  deliveryPerformance: number;
  qualityScore: number;
  dependency: number;
  compliant: boolean;
  switchingCostNote?: string;
  minDeliveryPerformance: number;
  minQualityScore: number;
  maxIncidents: number;
  weightDelivery: number;
  weightQuality: number;
  weightDependency: number;
}

const BASELINE_SUPPLIER_SCENARIO: SupplierScenarioState = {
  financialRisk: DEMO_SUPPLIERS[0].financialRisk,
  deliveryPerformance: DEMO_SUPPLIERS[0].deliveryPerformance,
  qualityScore: DEMO_SUPPLIERS[0].qualityScore,
  dependency: DEMO_SUPPLIERS[0].dependency,
  compliant: DEMO_SUPPLIERS[0].compliant,
  switchingCostNote: undefined,
  minDeliveryPerformance: DEFAULT_SUPPLIER_CONFIG.minDeliveryPerformance,
  minQualityScore: DEFAULT_SUPPLIER_CONFIG.minQualityScore,
  maxIncidents: DEFAULT_SUPPLIER_CONFIG.maxIncidents,
  weightDelivery: DEFAULT_SCORE_WEIGHTS.delivery,
  weightQuality: DEFAULT_SCORE_WEIGHTS.quality,
  weightDependency: DEFAULT_SCORE_WEIGHTS.inverseDependency,
};

function buildSupplierScenarioRequest(
  base: typeof DEMO_REQUEST,
  state: SupplierScenarioState,
): SupplierDecisionRequest {
  return {
    ...base,
    caseId: base.caseId + "-SCENARIO",
    candidates: base.candidates.map((s, i) =>
      i === 0
        ? {
            ...s,
            financialRisk: state.financialRisk,
            deliveryPerformance: state.deliveryPerformance,
            qualityScore: state.qualityScore,
            dependency: state.dependency,
            compliant: state.compliant,
          }
        : s,
    ),
    configuration: {
      minDeliveryPerformance: state.minDeliveryPerformance,
      minQualityScore: state.minQualityScore,
      maxIncidents: state.maxIncidents,
      configVersion: "1.0",
      scoreWeights: {
        delivery: state.weightDelivery,
        quality: state.weightQuality,
        inverseDependency: state.weightDependency,
        inverseIncidents: DEFAULT_SCORE_WEIGHTS.inverseIncidents,
        compliance: DEFAULT_SCORE_WEIGHTS.compliance,
        inverseLeadTime: DEFAULT_SCORE_WEIGHTS.inverseLeadTime,
      },
    },
  };
}

function ScenarioSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {open && <div className="border-t border-white/8 px-4 py-4">{children}</div>}
    </div>
  );
}

function SupplierLabControls({
  state,
  onChange,
}: {
  state: SupplierScenarioState;
  onChange: (next: SupplierScenarioState) => void;
}) {
  const [policyOpen, setPolicyOpen] = useState(true);
  const [weightsOpen, setWeightsOpen] = useState(true);

  function update(patch: Partial<SupplierScenarioState>) {
    onChange({ ...state, ...patch });
  }

  const weightTotal =
    state.weightDelivery + state.weightQuality + state.weightDependency;
  const normalizedWeight = (weight: number) =>
    weightTotal > 0 ? (weight / weightTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ACME scenario overrides</CardTitle>
          <p className="text-sm text-slate-400">
            Modify the first supplier and policy assumptions; the deterministic
            engine recalculates immediately.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-risk">Financial risk</Label>
              <select
                id="supplier-risk"
                value={state.financialRisk}
                onChange={(e) =>
                  update({ financialRisk: e.target.value as RiskLevel })
                }
                className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:bg-white/8 focus:ring-2 focus:ring-cyan-300/20"
              >
                <option value="LOW" className="bg-slate-900">
                  LOW
                </option>
                <option value="MEDIUM" className="bg-slate-900">
                  MEDIUM
                </option>
                <option value="HIGH" className="bg-slate-900">
                  HIGH
                </option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <button
                id="supplier-compliant"
                role="checkbox"
                aria-checked={state.compliant}
                aria-label="Supplier compliant"
                onClick={() => update({ compliant: !state.compliant })}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
                  state.compliant ? "bg-cyan-500" : "bg-white/10",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition",
                    state.compliant ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
              <Label htmlFor="supplier-compliant">Compliance valid</Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-delivery">Delivery performance</Label>
              <Input
                id="supplier-delivery"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={state.deliveryPerformance}
                onChange={(e) =>
                  update({
                    deliveryPerformance: Math.max(
                      0,
                      Math.min(1, Number(e.target.value)),
                    ),
                  })
                }
              />
              <p className="text-xs text-slate-500">
                {formatPctInput(state.deliveryPerformance)}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-quality">Quality score</Label>
              <Input
                id="supplier-quality"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={state.qualityScore}
                onChange={(e) =>
                  update({
                    qualityScore: Math.max(
                      0,
                      Math.min(1, Number(e.target.value)),
                    ),
                  })
                }
              />
              <p className="text-xs text-slate-500">
                {formatPctInput(state.qualityScore)}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-dependency">Dependency</Label>
              <Input
                id="supplier-dependency"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={state.dependency}
                onChange={(e) =>
                  update({
                    dependency: Math.max(
                      0,
                      Math.min(1, Number(e.target.value)),
                    ),
                  })
                }
              />
              <p className="text-xs text-slate-500">
                {formatPctInput(state.dependency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScenarioSection
        title="Decision policy"
        open={policyOpen}
        onToggle={() => setPolicyOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="min-delivery">Min delivery threshold</Label>
            <Input
              id="min-delivery"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={state.minDeliveryPerformance}
              onChange={(e) =>
                update({
                  minDeliveryPerformance: Math.max(
                    0,
                    Math.min(1, Number(e.target.value)),
                  ),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="min-quality">Min quality threshold</Label>
            <Input
              id="min-quality"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={state.minQualityScore}
              onChange={(e) =>
                update({
                  minQualityScore: Math.max(
                    0,
                    Math.min(1, Number(e.target.value)),
                  ),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-incidents">Max incidents</Label>
            <Input
              id="max-incidents"
              type="number"
              min={0}
              max={10}
              step={1}
              value={state.maxIncidents}
              onChange={(e) =>
                update({ maxIncidents: Math.max(0, Number(e.target.value)) })
              }
            />
          </div>
        </div>
      </ScenarioSection>

      <ScenarioSection
        title="Rule weights"
        open={weightsOpen}
        onToggle={() => setWeightsOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="weight-delivery">Delivery weight</Label>
            <Input
              id="weight-delivery"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={state.weightDelivery}
              onChange={(e) =>
                update({
                  weightDelivery: Math.max(0, Number(e.target.value)),
                })
              }
            />
            <p className="text-xs text-slate-500">
              Normalized {normalizedWeight(state.weightDelivery).toFixed(0)}%
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight-quality">Quality weight</Label>
            <Input
              id="weight-quality"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={state.weightQuality}
              onChange={(e) =>
                update({
                  weightQuality: Math.max(0, Number(e.target.value)),
                })
              }
            />
            <p className="text-xs text-slate-500">
              Normalized {normalizedWeight(state.weightQuality).toFixed(0)}%
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight-dependency">Dependency weight</Label>
            <Input
              id="weight-dependency"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={state.weightDependency}
              onChange={(e) =>
                update({
                  weightDependency: Math.max(0, Number(e.target.value)),
                })
              }
            />
            <p className="text-xs text-slate-500">
              Normalized {normalizedWeight(state.weightDependency).toFixed(0)}%
            </p>
          </div>
        </div>
      </ScenarioSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CaseHeader({
  trace,
  recommendation,
}: {
  trace: SupplierDecisionTrace;
  recommendation: SupplierEvaluation;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Supplier Decision Engine · {trace.input.caseId}
            </p>
            <CardTitle className="mt-1 text-xl">
              {recommendation.supplier.name}
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {recommendation.supplier.category}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={DECISION_BADGE[trace.decision]}>
              {trace.decision.replace(/_/g, " ")}
            </Badge>
            <Badge variant={RISK_BADGE[recommendation.riskLevel]}>
              {recommendation.riskLevel} RISK
            </Badge>
            <Badge variant="neutral">
              Score {(recommendation.overallScore * 100).toFixed(0)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Engine", value: `DIP v${trace.input.engineVersion}` },
            { label: "Rules", value: `v${trace.input.rulesVersion}` },
            { label: "Decision date", value: trace.input.decisionDate },
            { label: "Candidates", value: String(trace.input.candidateCount) },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/8 bg-white/4 px-3 py-2"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierProfileCard({
  evaluation,
  highlight,
}: {
  evaluation: SupplierEvaluation;
  highlight?: boolean;
}) {
  const s = evaluation.supplier;
  const rows: Array<{ label: string; value: string; tone?: string }> = [
    { label: "Contract value", value: formatEur(s.contractValueEur) },
    {
      label: "Delivery",
      value: formatPct(s.deliveryPerformance),
      tone:
        s.deliveryPerformance >= 0.95
          ? "text-emerald-200"
          : s.deliveryPerformance < 0.85
            ? "text-rose-200"
            : "text-amber-200",
    },
    {
      label: "Quality",
      value: formatPct(s.qualityScore),
      tone:
        s.qualityScore >= 0.95
          ? "text-emerald-200"
          : s.qualityScore < 0.90
            ? "text-rose-200"
            : "text-amber-200",
    },
    { label: "Financial risk", value: s.financialRisk },
    { label: "Dependency", value: formatPct(s.dependency) },
    { label: "Lead time", value: `${s.leadTimeDays}d` },
    { label: "Compliant", value: s.compliant ? "Yes" : "No" },
    { label: "Incidents (12m)", value: String(s.incidentsLast12Months) },
  ];

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        highlight ? "border-cyan-300/30 bg-cyan-300/5" : "border-white/8 bg-white/3",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{s.name}</p>
        <div className="flex items-center gap-1.5">
          <Badge variant={RISK_BADGE[evaluation.riskLevel]}>
            {evaluation.riskLevel}
          </Badge>
          <span className="text-xs text-slate-400">
            #{evaluation.rank} · {(evaluation.overallScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
        {rows.map(({ label, value, tone }) => (
          <div key={label}>
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
              {label}
            </dt>
            <dd className={cn("text-sm font-medium", tone ?? "text-slate-200")}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AlternativesPanel({
  evaluations,
}: {
  evaluations: SupplierEvaluation[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Profiles &amp; Comparison</CardTitle>
        <p className="text-sm text-slate-400">
          All candidates evaluated against the same rules and configuration.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {evaluations.map((ev) => (
          <SupplierProfileCard
            key={ev.supplier.name}
            evaluation={ev}
            highlight={ev.rank === 1}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function RuleTracePanel({
  evaluation,
}: {
  evaluation: SupplierEvaluation;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rule Evaluation — {evaluation.supplier.name}</CardTitle>
        <p className="text-sm text-slate-400">
          Every rule executed against the recommended candidate, with evidence.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {evaluation.ruleResults.map((result) => (
            <li
              key={result.rule.id}
              className={cn(
                "rounded-xl border px-3 py-2.5",
                result.passed
                  ? "border-emerald-300/20 bg-emerald-300/5"
                  : result.rule.blocking
                    ? "border-rose-300/25 bg-rose-300/6"
                    : "border-amber-300/20 bg-amber-300/5",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {result.rule.id}
                  {result.rule.blocking ? " · BLOCKING" : " · ADVISORY"}
                </span>
                <Badge
                  variant={
                    result.passed
                      ? "emerald"
                      : result.rule.blocking
                        ? "rose"
                        : "amber"
                  }
                >
                  {result.passed ? "PASS" : "FAIL"}
                </Badge>
              </div>
              <p className="mt-1 text-sm font-medium text-white">
                {result.rule.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{result.evidence}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DecisionPanel({
  trace,
  recommendation,
}: {
  trace: SupplierDecisionTrace;
  recommendation: SupplierEvaluation;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Recommendation
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-bold",
              trace.decision === "APPROVE"
                ? "text-emerald-200"
                : trace.decision === "APPROVE_WITH_CONDITIONS"
                  ? "text-amber-200"
                  : "text-rose-200",
            )}
          >
            {trace.decision.replace(/_/g, " ")}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {recommendation.supplier.name}
          </p>
        </div>

        {trace.factors.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Decision factors
            </p>
            <ul className="flex flex-col gap-1.5">
              {trace.factors.map((factor: SupplierDecisionFactor) => (
                <li
                  key={factor.label}
                  className="flex items-start gap-2 text-sm"
                >
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 font-bold",
                      factor.direction === "positive"
                        ? "text-emerald-300"
                        : "text-rose-300",
                    )}
                  >
                    {factor.direction === "positive" ? "+" : "−"}
                  </span>
                  <span className="text-slate-200">
                    <span className="font-medium">{factor.label}</span>
                    {" — "}
                    <span className="text-slate-400">{factor.evidence}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {trace.conditions.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
              Conditions required
            </p>
            <ul className="flex flex-col gap-1.5">
              {trace.conditions.map((condition: string) => (
                <li key={condition} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 shrink-0 text-amber-300">→</span>
                  <span className="text-slate-200">{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AuditTrailPanel({ entry }: { entry: SupplierAuditEntry }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Decision ID", value: entry.decisionId },
    { label: "Case ID", value: entry.caseId },
    { label: "Timestamp", value: entry.timestamp },
    { label: "Engine version", value: entry.engineVersion },
    { label: "Rules version", value: entry.rulesVersion },
    { label: "Rules executed", value: entry.rulesExecuted.join(", ") },
    { label: "Features used", value: entry.featuresUsed.join(", ") },
    { label: "Candidates", value: String(entry.candidateCount) },
    { label: "Recommended", value: entry.recommendedSupplier },
    { label: "Decision", value: entry.decision.replace(/_/g, " ") },
    { label: "Source", value: entry.source },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <p className="text-sm text-slate-400">
          Deterministic record — same input produces identical entry.
        </p>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/8 bg-white/3 px-3 py-2"
            >
              <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {label}
              </dt>
              <dd className="mt-0.5 break-all text-xs text-slate-200">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function ExplainabilityPanel({
  trace,
  recommendation,
}: {
  trace: SupplierDecisionTrace;
  recommendation: SupplierEvaluation;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Decision Trace</CardTitle>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 hover:border-white/25 hover:text-white"
          >
            {open ? "Hide trace" : "Show trace"}
          </button>
        </div>
        <p className="text-sm text-slate-400">
          Full decision → rules → evidence → feature values.
        </p>
      </CardHeader>
      {open && (
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Input
              </p>
              <pre className="overflow-x-auto rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-xs text-slate-300">
                {JSON.stringify(trace.input, null, 2)}
              </pre>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Feature values — {recommendation.supplier.name}
              </p>
              <pre className="overflow-x-auto rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-xs text-slate-300">
                {JSON.stringify(
                  Object.fromEntries(
                    recommendation.ruleResults.flatMap((r) =>
                      Object.entries(r.featureValues).map(([k, v]) => [
                        `${r.rule.id}.${k}`,
                        v,
                      ]),
                    ),
                  ),
                  null,
                  2,
                )}
              </pre>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Final decision
              </p>
              <p className="text-sm font-semibold text-white">
                {trace.decision.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

type Props = {
  locale: Locale;
};

export function SupplierWorkspace({ locale }: Props) {
  const [supplierScenario, setSupplierScenario] = useState<SupplierScenarioState>(
    BASELINE_SUPPLIER_SCENARIO,
  );
  const baselineResult = useMemo(
    () => runSupplierDecisionPlugin(DEMO_REQUEST),
    [],
  );
  const scenarioRequest = useMemo(
    () => buildSupplierScenarioRequest(DEMO_REQUEST, supplierScenario),
    [supplierScenario],
  );
  const result = useMemo(
    () => runSupplierDecisionPlugin(scenarioRequest),
    [scenarioRequest],
  );
  const isDirty =
    JSON.stringify(supplierScenario) !==
    JSON.stringify(BASELINE_SUPPLIER_SCENARIO);
  const { decisionTrace: trace, recommendation, auditEntry } = result;

  function getDecisionDelta(
    baseline: SupplierDecisionResponse,
    scenario: SupplierDecisionResponse,
  ) {
    const changedReasons: string[] = [];
    const baseCandidate = DEMO_REQUEST.candidates[0];
    const scenarioCandidate = scenarioRequest.candidates[0];
    const baseConfig = {
      ...DEFAULT_SUPPLIER_CONFIG,
      scoreWeights: DEFAULT_SCORE_WEIGHTS,
    };
    const scenarioConfig = {
      ...DEFAULT_SUPPLIER_CONFIG,
      ...scenarioRequest.configuration,
    };

    if (baseCandidate.financialRisk !== scenarioCandidate.financialRisk) {
      changedReasons.push(
        `Financial risk: ${baseCandidate.financialRisk} → ${scenarioCandidate.financialRisk}`,
      );
    }
    if (
      baseCandidate.deliveryPerformance !== scenarioCandidate.deliveryPerformance
    ) {
      changedReasons.push(
        `Delivery performance: ${formatPctInput(baseCandidate.deliveryPerformance)} → ${formatPctInput(scenarioCandidate.deliveryPerformance)}`,
      );
    }
    if (baseCandidate.qualityScore !== scenarioCandidate.qualityScore) {
      changedReasons.push(
        `Quality score: ${formatPctInput(baseCandidate.qualityScore)} → ${formatPctInput(scenarioCandidate.qualityScore)}`,
      );
    }
    if (baseCandidate.dependency !== scenarioCandidate.dependency) {
      changedReasons.push(
        `Dependency: ${formatPctInput(baseCandidate.dependency)} → ${formatPctInput(scenarioCandidate.dependency)}`,
      );
    }
    if (baseCandidate.compliant !== scenarioCandidate.compliant) {
      changedReasons.push(
        `Compliance: ${baseCandidate.compliant ? "Valid" : "Missing"} → ${scenarioCandidate.compliant ? "Valid" : "Missing"}`,
      );
    }
    if (
      baseConfig.minDeliveryPerformance !== scenarioConfig.minDeliveryPerformance
    ) {
      changedReasons.push(
        `Min delivery threshold: ${formatPctInput(baseConfig.minDeliveryPerformance)} → ${formatPctInput(scenarioConfig.minDeliveryPerformance)}`,
      );
    }
    if (baseConfig.minQualityScore !== scenarioConfig.minQualityScore) {
      changedReasons.push(
        `Min quality threshold: ${formatPctInput(baseConfig.minQualityScore)} → ${formatPctInput(scenarioConfig.minQualityScore)}`,
      );
    }
    if (baseConfig.maxIncidents !== scenarioConfig.maxIncidents) {
      changedReasons.push(
        `Max incidents: ${baseConfig.maxIncidents} → ${scenarioConfig.maxIncidents}`,
      );
    }
    if (
      baseConfig.scoreWeights.delivery !== scenarioConfig.scoreWeights?.delivery
    ) {
      changedReasons.push(
        `Delivery weight: ${baseConfig.scoreWeights.delivery.toFixed(2)} → ${(scenarioConfig.scoreWeights?.delivery ?? 0).toFixed(2)}`,
      );
    }
    if (
      baseConfig.scoreWeights.quality !== scenarioConfig.scoreWeights?.quality
    ) {
      changedReasons.push(
        `Quality weight: ${baseConfig.scoreWeights.quality.toFixed(2)} → ${(scenarioConfig.scoreWeights?.quality ?? 0).toFixed(2)}`,
      );
    }
    if (
      baseConfig.scoreWeights.inverseDependency !==
      scenarioConfig.scoreWeights?.inverseDependency
    ) {
      changedReasons.push(
        `Dependency weight: ${baseConfig.scoreWeights.inverseDependency.toFixed(2)} → ${(scenarioConfig.scoreWeights?.inverseDependency ?? 0).toFixed(2)}`,
      );
    }

    return {
      baselineDecision: baseline.decisionTrace.decision,
      scenarioDecision: scenario.decisionTrace.decision,
      changed:
        baseline.decisionTrace.decision !== scenario.decisionTrace.decision,
      changedReasons,
    };
  }

  function onReset() {
    setSupplierScenario(BASELINE_SUPPLIER_SCENARIO);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-400" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                DIP Decision Engine · Supplier Vertical
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Supplier Decision
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Same deterministic decision-engine architecture — different decision
              problem. Supplier selection with explicit rules, evidence and audit
              trail.{" "}
              <span className="text-amber-400">
                Synthetic demonstration — not production supplier data.
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DecisionScenarioLab
              domainLabel="Supplier Decision"
              baselineResult={baselineResult}
              scenarioResult={result}
              controls={
                <SupplierLabControls
                  state={supplierScenario}
                  onChange={setSupplierScenario}
                />
              }
              getDecisionLabel={(scenarioResult) =>
                scenarioResult.decisionTrace.decision
              }
              getSensitivity={() => computeSupplierSensitivity(scenarioRequest)}
              getTraceDiff={computeSupplierTraceDiff}
              getDecisionDelta={getDecisionDelta}
              onReset={onReset}
              isDirty={isDirty}
            />
            <Link
              href={buildLocalePath("/eidos", locale)}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-sm text-slate-300 outline-none transition hover:border-white/25 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Observatory
            </Link>
          </div>
        </header>

        <CaseHeader trace={trace} recommendation={recommendation} />

        <AlternativesPanel evaluations={trace.evaluations} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RuleTracePanel evaluation={recommendation} />
          <DecisionPanel trace={trace} recommendation={recommendation} />
        </div>

        <ExplainabilityPanel trace={trace} recommendation={recommendation} />

        <AuditTrailPanel entry={auditEntry} />

        <p className="text-center text-xs text-slate-600">
          Synthetic demonstration — not production supplier data. DIP Decision
          Engine v{result.pluginVersion}.
        </p>
      </div>
    </main>
  );
}
