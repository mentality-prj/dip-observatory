"use client";

import { useMemo, useState } from "react";
import { Activity, BrainCircuit, CheckCircle2, Gauge, Loader2, Play, RotateCcw, ShieldAlert } from "lucide-react";

import { PrototypeShell } from "@/components/observatory/prototype-shell";
import type { Locale } from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";

type InputKey = "demand_change" | "material_availability" | "production_capacity" | "machine_availability";
type Inputs = Record<InputKey, number>;
type DecisionResult = {
  decision: string;
  action: string;
  risk: number;
  confidence: number;
  uncertainty: number;
  state: Record<string, number>;
  drivers: { feature: string; value: number }[];
  explanation: string[];
  model_version: string;
  execution_time_ms: number;
};
type HistoryItem = { id: number; inputs: Inputs; result: DecisionResult };

const DEFAULT_INPUTS: Inputs = {
  demand_change: 7,
  material_availability: 82,
  production_capacity: 86,
  machine_availability: 94,
};

const INPUTS: { key: InputKey; label: string; min: number; max: number; step: number; suffix: string; description: string }[] = [
  { key: "demand_change", label: "Demand change", min: -15, max: 15, step: 0.5, suffix: "%", description: "Change against the current demand plan" },
  { key: "material_availability", label: "Material availability", min: 50, max: 100, step: 1, suffix: "%", description: "Available critical production material" },
  { key: "production_capacity", label: "Production capacity", min: 60, max: 100, step: 1, suffix: "%", description: "Capacity available in the planning horizon" },
  { key: "machine_availability", label: "Machine availability", min: 60, max: 100, step: 1, suffix: "%", description: "Expected available machine time" },
];

const FEATURE_LABELS: Record<string, string> = {
  demand_pressure: "Demand pressure",
  material_risk: "Material risk",
  capacity_risk: "Capacity risk",
  machine_risk: "Machine risk",
};

function formatPercent(value: number) { return `${Math.round(value * 100)}%`; }

export function ProductionDecisionWorkspace({ locale }: { locale: Locale }) {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = useMemo(() => locale === "pl" ? {
    eyebrow: "Production Decision Intelligence", title: "Production State → Decision", subtitle: "Change the operating state, then run DIP to see how the decision changes.", run: "Run decision", running: "Running DIP analysis", inputs: "Operating state", result: "Decision output", trace: "Execution trace", history: "Decision history", reset: "Reset", demo: "Prototype data — decision engine is executed by DIP.",
  } : {
    eyebrow: "Production Decision Intelligence", title: "Production State → Decision", subtitle: "Change the operating state, then run DIP to see how the decision changes.", run: "Run decision", running: "Running DIP analysis", inputs: "Operating state", result: "Decision output", trace: "Execution trace", history: "Decision history", reset: "Reset", demo: "Prototype data — decision engine is executed by DIP.",
  }, [locale]);

  async function runDecision() {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/production-decision/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const payload = await response.json() as DecisionResult & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "DIP execution failed.");
      setResult(payload);
      setHistory((current) => [{ id: Date.now(), inputs: { ...inputs }, result: payload }, ...current].slice(0, 5));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "DIP execution failed.");
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setInputs(DEFAULT_INPUTS);
    setResult(null);
    setHistory([]);
    setError(null);
  }

  return (
    <PrototypeShell locale={locale} theme="emerald">
      <main className="px-4 pb-12 md:px-6 xl:px-10">
        <section className="rounded-[28px] border border-emerald-300/15 bg-slate-950/55 shadow-2xl shadow-black/20">
          <header className="border-b border-white/8 px-5 py-6 md:px-8 md:py-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300"><BrainCircuit className="h-3.5 w-3.5" />{labels.eyebrow}</div>
                <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{labels.title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-400">{labels.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">DIP · {result?.model_version ?? "ready"}</span>
                <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"><RotateCcw className="h-3.5 w-3.5" />{labels.reset}</button>
              </div>
            </div>
          </header>

          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <section className="border-b border-white/8 p-5 md:p-8 lg:border-b-0 lg:border-r" aria-label={labels.inputs}>
              <div className="mb-6 flex items-center justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">01</div><h2 className="mt-1 text-sm font-semibold text-white">{labels.inputs}</h2></div><Gauge className="h-4 w-4 text-slate-600" /></div>
              <div className="space-y-7">
                {INPUTS.map((item) => (
                  <div key={item.key}>
                    <div className="mb-2 flex items-end justify-between gap-3"><div><label htmlFor={item.key} className="text-sm font-medium text-slate-200">{item.label}</label><p className="mt-1 text-[11px] text-slate-600">{item.description}</p></div><output htmlFor={item.key} className="font-mono text-sm font-semibold tabular-nums text-emerald-300">{inputs[item.key] > 0 && item.key === "demand_change" ? "+" : ""}{inputs[item.key]}{item.suffix}</output></div>
                    <input id={item.key} type="range" min={item.min} max={item.max} step={item.step} value={inputs[item.key]} onChange={(event) => setInputs((current) => ({ ...current, [item.key]: Number(event.target.value) }))} className="h-2 w-full cursor-pointer accent-emerald-400" />
                    <div className="mt-1 flex justify-between text-[9px] font-mono text-slate-700"><span>{item.min}{item.suffix}</span><span>{item.max}{item.suffix}</span></div>
                  </div>
                ))}
              </div>
              <button type="button" disabled={running} onClick={runDecision} className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-300/12 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/18 disabled:cursor-wait disabled:opacity-70">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{running ? labels.running : labels.run}
              </button>
              <p className="mt-3 text-center text-[10px] leading-4 text-slate-600">{labels.demo}</p>
            </section>

            <section className="min-w-0 p-5 md:p-8" aria-label={labels.result}>
              <div className="mb-6 flex items-center justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">02</div><h2 className="mt-1 text-sm font-semibold text-white">{labels.result}</h2></div><Activity className={cn("h-4 w-4", running ? "animate-pulse text-emerald-300" : "text-slate-600")} /></div>
              {error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-xs text-rose-200">{error}</div> : result ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/6 p-5"><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">DIP decision</div><div className="mt-2 text-xl font-semibold text-white">{result.decision}</div><p className="mt-2 text-xs leading-5 text-slate-400">{result.action}</p><div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Risk" value={formatPercent(result.risk)} /><Metric label="Confidence" value={formatPercent(result.confidence)} /><Metric label="Uncertainty" value={formatPercent(result.uncertainty)} /></div></div>
                  <div className="grid grid-cols-2 gap-3">{result.drivers.map((driver) => <div key={driver.feature} className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><div className="text-[10px] text-slate-500">{FEATURE_LABELS[driver.feature] ?? driver.feature}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-emerald-300/70" style={{ width: `${Math.min(100, driver.value * 100)}%` }} /></div><div className="mt-1 text-right font-mono text-[10px] text-slate-400">{formatPercent(driver.value)}</div></div>)}</div>
                  <div className="rounded-xl border border-white/8 bg-black/10 p-4"><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"><ShieldAlert className="h-3.5 w-3.5" />Why DIP chose this</div><ul className="space-y-2">{result.explanation.map((line) => <li key={line} className="flex gap-2 text-xs leading-5 text-slate-400"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-300/60" />{line}</li>)}</ul></div>
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4"><div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{labels.trace}</div><div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 sm:grid-cols-4"><Trace label="INPUT" /><Trace label="FEATURES" /><Trace label="RISK" /><Trace label="DECISION" /></div><div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3 text-[10px] text-slate-600"><span>{result.model_version}</span><span>{result.execution_time_ms} ms</span></div></div>
                </div>
              ) : <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/[0.015] text-center"><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-slate-600"><Play className="h-5 w-5" /></div><p className="mt-4 text-sm font-medium text-slate-400">Set the operating state and run DIP.</p><p className="mt-1 text-xs text-slate-600">The result is computed after you submit the state.</p></div></div>}
            </section>
          </div>
        </section>

        {history.length > 0 && <section className="mt-5 rounded-[22px] border border-white/8 bg-slate-950/45 p-5 md:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{labels.history}</h2><span className="font-mono text-[10px] text-slate-700">{history.length} runs</span></div><div className="space-y-2">{history.map((item, index) => <button key={item.id} type="button" onClick={() => { setInputs(item.inputs); setResult(item.result); }} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-white/6 bg-white/[0.015] px-4 py-3 text-left transition hover:bg-white/[0.04]"><span className="font-mono text-[10px] text-slate-700">#{history.length - index}</span><span className="text-xs text-slate-400">Demand {item.inputs.demand_change >= 0 ? "+" : ""}{item.inputs.demand_change}% · Material {item.inputs.material_availability}% · Capacity {item.inputs.production_capacity}%</span><span className="text-xs font-medium text-emerald-300">{item.result.decision}</span></button>)}</div></section>}
      </main>
    </PrototypeShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/8 bg-black/10 px-3 py-2"><div className="text-[9px] uppercase tracking-wider text-slate-600">{label}</div><div className="mt-1 font-mono text-sm text-white">{value}</div></div>; }
function Trace({ label }: { label: string }) { return <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-300/60" />{label}</div>; }
