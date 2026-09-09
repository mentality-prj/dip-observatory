"use client";

import { useState } from "react";
import { Activity, ArrowRight, BrainCircuit, CheckCircle2, Network, Play, RotateCcw, ShieldAlert, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/lib/observatory-i18n";

type Inputs = {
  material_flow: number;
  sorting_capacity: number;
  production_capacity: number;
  machine_availability: number;
  outbound_pressure: number;
};
type Result = {
  decision: string;
  action: string;
  risk: number;
  confidence: number;
  uncertainty: number;
  bottleneck: { name: string; risk: number };
  propagation_risk: number;
  drivers: Array<{ feature: string; value: number }>;
  alternatives: Array<{ decision: string; risk: number; outcome: string }>;
  explanation: string[];
  model_version: string;
};

const INITIAL: Inputs = {
  material_flow: 78,
  sorting_capacity: 84,
  production_capacity: 82,
  machine_availability: 94,
  outbound_pressure: 68,
};

type ViveLocale = "en" | "pl";
type CopyKey = keyof Inputs | "title" | "subtitle" | "run" | "running" | "reset" | "bottleneck" | "propagation" | "alternatives" | "drivers" | "explanation" | "demo" | "human";
const LABELS: Record<ViveLocale, Record<CopyKey, string>> = {
  en: {
    title: "Production & Logistics → Decision",
    subtitle: "Digital Twin-style state simulation for bottleneck detection, risk propagation and what-if decisions.",
    run: "Run decision",
    running: "DIP is evaluating…",
    reset: "Reset",
    bottleneck: "Leading bottleneck",
    propagation: "Propagation risk",
    alternatives: "What-if alternatives",
    drivers: "State drivers",
    explanation: "Why this decision",
    demo: "VIVE PROTOTYPE · Demonstration data",
    human: "HUMAN-IN-THE-LOOP",
    material_flow: "Material flow",
    sorting_capacity: "Sorting capacity",
    production_capacity: "Production capacity",
    machine_availability: "Machine availability",
    outbound_pressure: "Outbound pressure",
  },
  pl: {
    title: "Produkcja i logistyka → decyzja",
    subtitle: "Symulacja stanu w stylu Digital Twin: wąskie gardła, propagacja ryzyka i decyzje what-if.",
    run: "Uruchom decyzję",
    running: "DIP analizuje…",
    reset: "Reset",
    bottleneck: "Główne wąskie gardło",
    propagation: "Ryzyko propagacji",
    alternatives: "Alternatywy what-if",
    drivers: "Czynniki stanu",
    explanation: "Dlaczego ta decyzja",
    demo: "VIVE PROTOTYP · Dane demonstracyjne",
    human: "HUMAN-IN-THE-LOOP",
    material_flow: "Przepływ materiału",
    sorting_capacity: "Zdolność sortowania",
    production_capacity: "Zdolność produkcyjna",
    machine_availability: "Dostępność maszyn",
    outbound_pressure: "Presja wysyłkowa",
  },
};

function Field({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs"><span className="text-slate-400">{label}</span><span className="font-semibold tabular-nums text-white">{value}%</span></div>
      <input aria-label={label} type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-emerald-300" />
    </div>
  );
}

export function ViveProductionIntelligenceWorkspace({ locale }: { locale: Locale }) {
  const copy = LABELS[locale === "pl" ? "pl" : "en"];
  const [inputs, setInputs] = useState(INITIAL);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof Inputs, value: number) {
    setInputs((current) => ({ ...current, [key]: value }));
    setResult(null);
    setError(null);
  }

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/vive-production-intelligence/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "DIP request failed");
      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to execute DIP decision");
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setInputs(INITIAL);
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/8 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400"><Network className="h-4 w-4" />{copy.demo}</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{copy.subtitle}</p>
          </div>
          <Badge variant="emerald">DIP · vive-production-intelligence-v0.1</Badge>
        </header>

        <section className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
          <Card className="border-white/8 bg-white/[0.03]"><CardHeader><div className="flex items-center justify-between"><CardTitle>Operational state</CardTitle><Button size="icon" variant="ghost" onClick={reset} aria-label={copy.reset}><RotateCcw className="h-4 w-4" /></Button></div></CardHeader><CardContent className="space-y-6">
            {(Object.keys(inputs) as Array<keyof Inputs>).map((key) => <Field key={key} label={copy[key]} value={inputs[key]} onChange={(value) => update(key, value)} />)}
            <Button onClick={run} disabled={running} className="h-12 w-full gap-2">{running ? <Activity className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}{running ? copy.running : copy.run}</Button>
          </CardContent></Card>

          <Card className="border-emerald-300/15 bg-emerald-300/[0.035]"><CardHeader><div className="flex items-center justify-between"><CardTitle>Decision intelligence</CardTitle><Badge variant={error ? "rose" : result ? "emerald" : "neutral"}>{error ? "ERROR" : result ? "READY" : "WAITING"}</Badge></div></CardHeader><CardContent>
            {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-300/5 p-5"><div className="flex items-center gap-2 text-rose-300"><ShieldAlert className="h-4 w-4" />Decision execution failed</div><p className="mt-2 text-sm text-slate-400">{error}</p></div> : result ? <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5"><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Recommended decision</div><div className="mt-2 flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" /><h2 className="text-2xl font-semibold">{result.decision}</h2></div><p className="mt-3 text-sm text-slate-400">{result.action}</p></div>
              <div className="grid gap-3 sm:grid-cols-3">{[["Risk", result.risk], ["Confidence", result.confidence], [copy.propagation, result.propagation_risk]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/8 bg-black/10 p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-2 text-2xl font-semibold tabular-nums text-white">{(Number(value) * 100).toFixed(0)}%</div></div>)}</div>
              <div className="rounded-2xl border border-white/8 bg-black/10 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"><BrainCircuit className="h-3.5 w-3.5" />{copy.bottleneck}</div><div className="mt-2 flex items-center justify-between"><span className="text-sm text-slate-300">{result.bottleneck.name.replaceAll("_", " ")}</span><span className="font-semibold text-amber-300">{(result.bottleneck.risk * 100).toFixed(0)}%</span></div></div>
            </div> : <div className="flex min-h-[330px] flex-col items-center justify-center text-center"><Target className="h-9 w-9 text-emerald-300/40" /><p className="mt-3 text-sm text-slate-500">Adjust the operating state and run DIP.</p></div>}
          </CardContent></Card>
        </section>

        {result && <section className="grid gap-4 lg:grid-cols-3"><Card className="border-white/8 bg-white/[0.025]"><CardHeader><CardTitle>{copy.alternatives}</CardTitle></CardHeader><CardContent className="space-y-2">{result.alternatives.map((item) => <div key={item.decision} className="rounded-xl border border-white/7 p-3"><div className="flex justify-between gap-3"><span className="text-sm font-medium text-slate-200">{item.decision}</span><span className="tabular-nums text-xs text-slate-400">{(item.risk * 100).toFixed(0)}% risk</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{item.outcome}</p></div>)}</CardContent></Card><Card className="border-white/8 bg-white/[0.025]"><CardHeader><CardTitle>{copy.drivers}</CardTitle></CardHeader><CardContent className="space-y-3">{result.drivers.map((driver) => <div key={driver.feature}><div className="mb-1 flex justify-between text-xs"><span className="text-slate-500">{driver.feature.replaceAll("_", " ")}</span><span>{(driver.value * 100).toFixed(0)}%</span></div><div className="h-1.5 rounded-full bg-white/8"><div className="h-full rounded-full bg-emerald-300" style={{ width: `${driver.value * 100}%` }} /></div></div>)}</CardContent></Card><Card className="border-white/8 bg-white/[0.025]"><CardHeader><CardTitle>{copy.explanation}</CardTitle></CardHeader><CardContent className="space-y-3">{result.explanation.map((line) => <div key={line} className="flex gap-2 text-sm leading-6 text-slate-400"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-300" />{line}</div>)}<Badge variant="neutral">{copy.human}</Badge></CardContent></Card></section>}
      </div>
    </main>
  );
}
