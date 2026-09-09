"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, BrainCircuit, CheckCircle2, Info, LineChart, Play, RotateCcw, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/observatory-i18n";

const ACTUAL = [108, 106, 111, 115, 112, 118, 121, 119, 124, 129, 127, 132];
const HICP = [118.1, 118.4, 118.7, 119, 119.2, 119.7, 120.1, 120.4, 120.8, 121.1, 121.4, 121.8];
const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
type Scenario = "base" | "growth" | "shock";
const scenarioConfig: Record<Scenario, { shift: number; pressure: number }> = { base: { shift: 0, pressure: 28 }, growth: { shift: 7, pressure: 42 }, shock: { shift: -10, pressure: 78 } };

function linePoints(values: number[], min = 95, max = 150) {
  return values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${Math.max(8, Math.min(92, 92 - ((value - min) / (max - min)) * 72))}`).join(" ");
}

function ForecastChart({ values, playing }: { values: number[]; playing: boolean }) {
  const actual = values.slice(0, 12);
  const forecast = values.slice(11);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-slate-950/70 p-4">
      {playing && <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/5 to-transparent animate-pulse" />}
      <svg viewBox="0 0 100 100" className="h-64 w-full" role="img" aria-label="Demand forecast trajectory">
        <defs><linearGradient id="wsp-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" className="stop-cyan" stopOpacity=".20" /><stop offset="100%" className="stop-cyan" stopOpacity="0" /></linearGradient></defs>
        {[20, 45, 70, 92].map((y) => <line key={y} x1="0" y1={y} x2="100" y2={y} className="stroke-white/6" strokeWidth=".5" />)}
        <polygon points={`${linePoints(values)} 100,92 0,92`} fill="url(#wsp-area)" />
        <polyline points={linePoints(actual)} fill="none" className="stroke-cyan-300" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline points={linePoints(forecast)} fill="none" className="stroke-emerald-300" strokeWidth="2.5" strokeDasharray="5 3" vectorEffect="non-scaling-stroke" />
        {actual.map((value, index) => <circle key={index} cx={(index / 11) * 100} cy={92 - ((value - 95) / 55) * 72} r="1.3" className="fill-cyan-300" />)}
        <line x1="91" y1="7" x2="91" y2="94" className="stroke-white/15" strokeDasharray="2 2" />
        <text x="92" y="10" className="fill-slate-500 text-[3px]">FORECAST</text>
      </svg>
      <div className="grid grid-cols-6 gap-2 text-[10px] text-slate-600 sm:grid-cols-12">{LABELS.map((label) => <span key={label} className="text-center">{label}</span>)}</div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400"><span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-cyan-300" /> observed demand</span><span className="inline-flex items-center gap-2"><span className="h-2 w-6 border-t-2 border-dashed border-emerald-300" /> decision forecast</span></div>
    </div>
  );
}

function SignalMeter({ label, value, tone = "cyan" }: { label: string; value: number; tone?: "cyan" | "amber" | "emerald" }) {
  const toneClass = tone === "amber" ? "bg-amber-300" : tone === "emerald" ? "bg-emerald-300" : "bg-cyan-300";
  return <div><div className="mb-2 flex justify-between text-xs"><span className="text-slate-400">{label}</span><span className="text-white">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/8"><div className={cn("h-full rounded-full transition-all duration-700", toneClass)} style={{ width: `${value}%` }} /></div></div>;
}

export function WspDemandForecastWorkspace({ locale }: { locale: Locale }) {
  const [scenario, setScenario] = useState<Scenario>("base");
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [horizon, setHorizon] = useState("1 month");
  const copy = locale === "pl" ? {
    eyebrow: "WSP PROTOTYP", title: "Demand Forecast → Production Decision", subtitle: "Nie tylko prognoza. Silnik pokazuje, jak zmiana sygnałów rynkowych wpływa na decyzję planistyczną.", demo: "Dane demonstracyjne — do walidacji na danych WSP", base: "Bazowy", growth: "Wzrost", shock: "Szok rynkowy", forecast: "Prognoza popytu", interval: "Przedział niepewności", signal: "Sygnał kierunku", baseline: "Ostatnia obserwacja", signals: "Sygnały modelu", history: "Historia popytu", external: "Food HICP", pressure: "Presja rynkowa", decision: "DECISION ENGINE", recommendation: "Rekomendacja planistyczna", why: "Dlaczego decyzja się zmieniła", run: "Uruchom symulację", reset: "Reset", processing: "Silnik analizuje sygnały…", capacity: "Przygotuj dodatkową zdolność produkcyjną", monitor: "Monitoruj sygnał przed finalnym commitmentem", validated: "HUMAN-IN-THE-LOOP", model: "Model", horizon: "Horyzont"
  } : {
    eyebrow: "WSP PROTOTYPE", title: "Demand Forecast → Production Decision", subtitle: "Not just a forecast. The engine shows how changing market signals alter the planning decision.", demo: "Demonstration data — to be validated on WSP data", base: "Baseline", growth: "Growth", shock: "Market shock", forecast: "Demand forecast", interval: "Uncertainty interval", signal: "Direction signal", baseline: "Latest observation", signals: "Model signals", history: "Demand history", external: "Food HICP", pressure: "Market pressure", decision: "DECISION ENGINE", recommendation: "Planning recommendation", why: "Why the decision moved", run: "Run simulation", reset: "Reset", processing: "Engine is processing signals…", capacity: "Prepare additional production capacity", monitor: "Monitor the leading signal before final commitment", validated: "HUMAN-IN-THE-LOOP", model: "Model", horizon: "Horizon"
  };
  const config = scenarioConfig[scenario];
  const forecast = 136 + config.shift;
  const low = forecast - (scenario === "shock" ? 12 : 8);
  const high = forecast + (scenario === "growth" ? 11 : 9);
  const latest = ACTUAL[ACTUAL.length - 1];
  const change = ((forecast - latest) / latest) * 100;
  const direction = change > 2 ? "UP" : change < -2 ? "DOWN" : "STABLE";
  const forecastSeries = useMemo(() => { const extension = step === 0 ? latest : step === 1 ? latest + (forecast - latest) * .35 : step === 2 ? latest + (forecast - latest) * .72 : forecast; return [...ACTUAL, extension, extension + (step >= 3 ? 1.5 : 0)]; }, [forecast, latest, step]);
  useEffect(() => { if (!playing) return; if (step >= 3) { setPlaying(false); return; } const timer = window.setTimeout(() => setStep((value) => value + 1), 850); return () => window.clearTimeout(timer); }, [playing, step]);
  function run() { setStep(0); setPlaying(true); }
  function reset() { setPlaying(false); setStep(0); setScenario("base"); }
  const phaseLabel = step === 0 ? "INPUTS" : step === 1 ? "FORECAST" : step === 2 ? "UNCERTAINTY" : "DECISION";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/8 pb-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400"><LineChart className="h-4 w-4" />{copy.eyebrow}</div><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{copy.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{copy.subtitle}</p></div><Badge variant="amber">{copy.demo}</Badge></header>
        <section className="grid gap-3 lg:grid-cols-[1fr_auto_auto]"><div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"><div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Scenario</div><div className="flex flex-wrap gap-2">{([["base", copy.base], ["growth", copy.growth], ["shock", copy.shock]] as const).map(([id, label]) => <Button key={id} size="sm" variant={scenario === id ? "default" : "secondary"} onClick={() => { setScenario(id); setStep(0); setPlaying(false); }}>{label}</Button>)}</div></div><div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"><div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{copy.horizon}</div><select value={horizon} onChange={(e) => setHorizon(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"><option>1 month</option><option>3 months</option><option>6 months</option></select></div><div className="flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3"><BrainCircuit className="h-5 w-5 text-cyan-300" /><div><div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">{copy.model}</div><div className="text-sm font-medium text-cyan-100">wsp-demand-v0.1</div></div></div></section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[[copy.forecast, `${forecast} idx`, `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs latest`, "positive"], [copy.interval, `${low} — ${high}`, "model uncertainty range", "neutral"], [copy.signal, direction, "historical + external signals", direction === "UP" ? "positive" : "warning"], [copy.baseline, `${latest} idx`, "latest observed point", "neutral"]].map(([label, value, sub, tone]) => <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-4 transition-all duration-500"><div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div><div className={cn("mt-2 text-2xl font-semibold", tone === "positive" ? "text-emerald-300" : tone === "warning" ? "text-amber-300" : "text-white")}>{value}</div><div className="mt-1 text-xs text-slate-500">{sub}</div></div>)}</section>
        <section className="grid gap-4 xl:grid-cols-[1.55fr_.75fr]"><Card className="border-white/8 bg-white/[0.03]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>{copy.forecast}</CardTitle><p className="mt-1 text-sm text-slate-500">{phaseLabel} · {horizon}</p></div><Button onClick={playing ? () => setPlaying(false) : run} className="gap-2">{playing ? <Activity className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}{playing ? copy.processing : copy.run}</Button></div></CardHeader><CardContent><ForecastChart values={forecastSeries} playing={playing} /><div className="mt-4 grid grid-cols-4 gap-1">{["INPUTS", "FORECAST", "UNCERTAINTY", "DECISION"].map((label, index) => <div key={label} className={cn("h-1 rounded-full transition-all duration-500", step >= index ? "bg-cyan-300" : "bg-white/8")} />)}</div><div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-slate-600"><span>signals</span><span>decision</span></div></CardContent></Card><Card className="border-cyan-300/15 bg-cyan-300/[0.04]"><CardHeader><div className="flex items-center gap-2 text-cyan-300"><Zap className="h-4 w-4" /><CardTitle>{copy.signals}</CardTitle></div></CardHeader><CardContent className="space-y-5"><SignalMeter label={copy.history} value={72} /><SignalMeter label={copy.external} value={28} tone="emerald" /><SignalMeter label={copy.pressure} value={config.pressure} tone={scenario === "shock" ? "amber" : "cyan"} /><div className="rounded-2xl border border-white/8 bg-white/4 p-4 transition-all duration-500"><div className="text-xs uppercase tracking-[0.18em] text-slate-500">Food HICP</div><div className="mt-1 text-2xl font-semibold text-white">{HICP[11].toFixed(1)}</div><div className="mt-1 text-xs text-slate-500">lagged external signal · conservative adjustment</div></div></CardContent></Card></section>
        <section className={cn("overflow-hidden rounded-3xl border p-5 transition-all duration-700 md:p-7", step >= 3 ? "border-emerald-300/30 bg-emerald-300/[0.06]" : "border-white/8 bg-white/[0.025]")}><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500", step >= 3 ? "bg-emerald-300 text-slate-950" : "bg-white/8 text-cyan-300")}>{step >= 3 ? <CheckCircle2 className="h-6 w-6" /> : <Target className="h-6 w-6" />}</div><div><div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{copy.decision}</div><h2 className="mt-2 text-xl font-semibold md:text-2xl">{step >= 3 ? copy.capacity : "Forecast → uncertainty → decision"}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{step >= 3 ? copy.monitor : "The interesting part is not the number. The engine turns signals into an explainable planning action with uncertainty attached."}</p></div></div><div className="flex shrink-0 items-center gap-2"><Badge variant={step >= 3 ? "emerald" : "neutral"}>{copy.validated}</Badge><Button variant="secondary" size="sm" onClick={reset}><RotateCcw className="h-4 w-4" />{copy.reset}</Button></div></div></section>
        <section className="grid gap-4 xl:grid-cols-2"><Card className="border-emerald-300/15 bg-emerald-300/[0.035]"><CardHeader><div className="flex items-center gap-2 text-emerald-300"><ArrowRight className="h-4 w-4" /><CardTitle>{copy.recommendation}</CardTitle></div></CardHeader><CardContent><div className="rounded-2xl border border-emerald-300/15 bg-slate-950/50 p-5"><div className="text-2xl font-semibold text-white">{step >= 3 ? copy.capacity : "Run the engine to generate a decision"}</div><p className="mt-3 text-sm leading-6 text-slate-400">{step >= 3 ? copy.monitor : "A planner sees the forecast, interval, contributing signals and the resulting action in one flow."}</p></div></CardContent></Card><Card className="border-white/8 bg-white/[0.03]"><CardHeader><CardTitle>{copy.why}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-slate-400"><div className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-300" />{scenario === "shock" ? "Market pressure pulls the forecast down and widens uncertainty." : scenario === "growth" ? "The positive demand trajectory lifts the forecast while external pressure remains manageable." : "Seasonality remains the primary driver; external price signals provide adjustment context."}</div><div className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-300" />The output is an interval and decision, not an unexplained point estimate.</div><div className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-amber-300" />Final production commitment stays with the planner.</div></CardContent></Card></section>
        <div className="flex items-start gap-2 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-4 w-4 shrink-0" /> Prototype only. Replace the aggregate public benchmark with WSP sales, orders, promotions, inventory and production data for customer validation.</div>
      </div>
    </main>
  );
}
