"use client";

/**
 * Decision Scenario Lab — reusable interactive panel component.
 *
 * Architecture:
 *   Scenario Controls
 *     ↓
 *   Scenario Input (passed in as props)
 *     ↓
 *   Decision Engine (callback prop)
 *     ↓
 *   Decision Result
 *     ↓
 *   UI (this component)
 *
 * The component does NOT implement any decision logic.
 * All decisions come from the engine callbacks.
 *
 * Generic over T = the decision result type.
 */

import { useState, useMemo, type ReactNode } from "react";
import {
  FlaskConical,
  X,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SensitivityEntry {
  variable: string;
  level: "HIGH" | "MEDIUM" | "LOW";
  evidence: string;
}

export interface TraceDiffEntry {
  ruleId: string;
  ruleName: string;
  baselineResult: "PASS" | "FAIL";
  scenarioResult: "PASS" | "FAIL";
  baselineEvidence: string;
  scenarioEvidence: string;
  changed: boolean;
}

export interface DecisionDelta {
  baselineDecision: string;
  scenarioDecision: string;
  changed: boolean;
  changedReasons: string[];
  financialDelta?: number;
}

export interface ScenarioLabProps<T> {
  domainLabel: string;
  baselineResult: T;
  scenarioResult: T;
  controls: ReactNode;
  getDecisionLabel: (result: T) => string;
  getSensitivity: () => SensitivityEntry[];
  getTraceDiff: (baseline: T, scenario: T) => TraceDiffEntry[];
  getDecisionDelta: (baseline: T, scenario: T) => DecisionDelta;
  onReset: () => void;
  isDirty: boolean;
}

const LEVEL_BADGE: Record<"HIGH" | "MEDIUM" | "LOW", "rose" | "amber" | "neutral"> =
  {
    HIGH: "rose",
    MEDIUM: "amber",
    LOW: "neutral",
  };

function PassFailBadge({ result }: { result: "PASS" | "FAIL" }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
        result === "PASS"
          ? "bg-emerald-400/15 text-emerald-300"
          : "bg-rose-400/15 text-rose-300",
      )}
    >
      {result}
    </span>
  );
}

export function DecisionScenarioLab<T>({
  domainLabel,
  baselineResult,
  scenarioResult,
  controls,
  getDecisionLabel,
  getSensitivity,
  getTraceDiff,
  getDecisionDelta,
  onReset,
  isDirty,
}: ScenarioLabProps<T>) {
  const [open, setOpen] = useState(false);
  const [traceDiffExpanded, setTraceDiffExpanded] = useState(false);

  const baselineLabel = getDecisionLabel(baselineResult);
  const scenarioLabel = getDecisionLabel(scenarioResult);

  // Defer expensive engine computations until the panel is open
  const delta = useMemo(
    () => (open ? getDecisionDelta(baselineResult, scenarioResult) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, baselineResult, scenarioResult],
  );
  const sensitivity = useMemo(
    () => (open ? getSensitivity() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, baselineResult, scenarioResult],
  );
  const traceDiff = useMemo(
    () => (open ? getTraceDiff(baselineResult, scenarioResult) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, baselineResult, scenarioResult],
  );
  const changedRules = traceDiff.filter((e) => e.changed);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
          isDirty
            ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
            : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
        )}
        aria-label={`Open ${domainLabel} scenario lab`}
      >
        <FlaskConical className="h-4 w-4" />
        Scenario Lab
        {isDirty && (
          <span className="ml-1 rounded-full bg-cyan-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
            ACTIVE
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-[#0a0d16] shadow-2xl ring-1 ring-white/10">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#0a0d16] px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
                    {domainLabel} Scenario Lab
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Change the conditions and see how the decision changes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <button
                    onClick={() => {
                      onReset();
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:border-white/20 hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to baseline
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-white/8 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 px-6 py-5">
              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Scenario controls
                </p>
                {controls}
              </section>

              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Decision change
                </p>
                {delta ? (
                <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">
                        Baseline
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-200">
                        {baselineLabel.replace(/_/g, " ")}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                    <div
                      className={cn(
                        "rounded-xl border px-3 py-2",
                        delta.changed
                          ? "border-cyan-300/30 bg-cyan-300/8"
                          : "border-emerald-300/20 bg-emerald-300/5",
                      )}
                    >
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">
                        Scenario
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-sm font-semibold",
                          delta.changed ? "text-cyan-300" : "text-emerald-300",
                        )}
                      >
                        {scenarioLabel.replace(/_/g, " ")}
                      </p>
                    </div>
                    {delta.changed ? (
                      <Badge variant="amber">Decision changed</Badge>
                    ) : (
                      <Badge variant="emerald">Unchanged</Badge>
                    )}
                  </div>

                  {delta.changed && delta.changedReasons.length > 0 && (
                    <div className="mt-4 border-t border-white/8 pt-4">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Why did it change?
                      </p>
                      <ul className="space-y-1">
                        {delta.changedReasons.map((reason, i) => (
                          <li key={i} className="text-xs text-slate-300">
                            · {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {delta.financialDelta !== undefined &&
                    delta.financialDelta !== 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <p className="text-xs text-slate-500">Cost change:</p>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            delta.financialDelta > 0
                              ? "text-rose-300"
                              : "text-emerald-300",
                          )}
                        >
                          {delta.financialDelta > 0 ? "+" : ""}€
                          {Math.abs(delta.financialDelta).toLocaleString("de-DE")}
                        </span>
                      </div>
                    )}
                </div>
                ) : null}
              </section>

              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Decision sensitivity
                </p>
                <div className="space-y-2 rounded-2xl border border-white/8 bg-white/3 p-4">
                  {sensitivity.map((s) => (
                    <div
                      key={s.variable}
                      className="flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-slate-200">
                          {s.variable}
                        </p>
                        <p className="text-[11px] text-slate-500">{s.evidence}</p>
                      </div>
                      <Badge
                        variant={LEVEL_BADGE[s.level]}
                        className="shrink-0 text-[10px]"
                      >
                        {s.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <button
                  onClick={() => setTraceDiffExpanded((v) => !v)}
                  className="flex w-full items-center justify-between"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Compare decisions · trace diff
                    {changedRules.length > 0 && (
                      <span className="ml-2 rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[9px] text-amber-300">
                        {changedRules.length} rule
                        {changedRules.length !== 1 ? "s" : ""} changed
                      </span>
                    )}
                  </p>
                  {traceDiffExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </button>

                {traceDiffExpanded && (
                  <div className="mt-3 space-y-2">
                    {traceDiff.map((entry) => (
                      <div
                        key={entry.ruleId}
                        className={cn(
                          "rounded-xl border px-3 py-2.5",
                          entry.changed
                            ? "border-amber-300/25 bg-amber-300/5"
                            : "border-white/6 bg-white/2",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-sm bg-white/8 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                            {entry.ruleId}
                          </span>
                          <span className="text-xs font-medium text-slate-300">
                            {entry.ruleName}
                          </span>
                          {entry.changed && (
                            <Badge variant="amber" className="text-[9px]">
                              changed
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                          <PassFailBadge result={entry.baselineResult} />
                          <span className="text-slate-600">→</span>
                          <PassFailBadge result={entry.scenarioResult} />
                        </div>
                        {entry.changed && (
                          <div className="mt-2 space-y-0.5">
                            <p className="text-[11px] text-slate-500">
                              <span className="text-slate-600">Baseline: </span>
                              {entry.baselineEvidence}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              <span className="text-slate-600">Scenario: </span>
                              {entry.scenarioEvidence}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
