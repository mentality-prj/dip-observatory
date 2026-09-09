"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Info, LineChart, Target, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/observatory-i18n";

const DEMO_POINTS = [
  108, 106, 111, 115, 112, 118, 121, 119, 124, 129, 127, 132,
];

const HICP_POINTS = [118.1, 118.4, 118.7, 119.0, 119.2, 119.7, 120.1, 120.4, 120.8, 121.1, 121.4, 121.8];

const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 92 - ((value - min) / Math.max(max - min, 1)) * 78;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-44 w-full overflow-visible" role="img" aria-label="Demand trajectory">
      <line x1="0" y1="92" x2="100" y2="92" className="stroke-white/10" strokeWidth="0.6" />
      <polyline fill="none" points={points} className="stroke-cyan-300" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
      {values.map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 100;
        const y = 92 - ((value - min) / Math.max(max - min, 1)) * 78;
        return <circle key={`${value}-${index}`} cx={x} cy={y} r="1.15" className="fill-cyan-300" />;
      })}
      <polyline fill="none" points={`92,15 96,10 100,12`} className="stroke-emerald-300/70" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function StatCard({ label, value, sub, tone = "neutral" }: { label: string; value: string; sub: string; tone?: "neutral" | "positive" | "warning" }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div
        className={cn(
          "mt-2 text-2xl font-semibold",
          tone === "positive" && "text-emerald-300",
          tone === "warning" && "text-amber-300",
          tone === "neutral" && "text-white",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

export function WspDemandForecastWorkspace({ locale }: { locale: Locale }) {
  const [scenario, setScenario] = useState("base");
  const [horizon, setHorizon] = useState("1 month");

  const scenarioShift = scenario === "growth" ? 5 : scenario === "shock" ? -8 : 0;
  const forecast = 136 + scenarioShift;
  const low = forecast - 8;
  const high = forecast + 9;
  const lastActual = DEMO_POINTS[DEMO_POINTS.length - 1];
  const change = ((forecast - lastActual) / lastActual) * 100;
  const signal = change > 2 ? "UP" : change < -2 ? "DOWN" : "STABLE";

  const forecastSeries = useMemo(() => [...DEMO_POINTS.slice(0, -1), lastActual, forecast, forecast + 1], [forecast, lastActual]);

  const copy = locale === "pl"
    ? {
        eyebrow: "PROTOTYP WSP",
        title: "Demand Forecast & Production Decision",
        subtitle: "Public-market benchmark translated into a planner-facing decision surface.",
        forecast: "Prognoza popytu",
        confidence: "Przedział prognozy",
        direction: "Sygnał kierunku",
        baseline: "Bazowa prognoza",
        market: "Market signals",
        foodHicp: "Food HICP",
        recommendation: "Rekomendacja planistyczna",
        recommendationText: "Prepare additional production capacity for the next planning cycle; monitor the leading market signal before final commitment.",
        why: "Dlaczego model zmienił prognozę",
        whyText: "Seasonal demand history remains the primary driver. Food HICP provides an external adjustment and uncertainty context.",
        demo: "Dane demonstracyjne — do walidacji na danych WSP",
        base: "Bazowy",
        growth: "Wzrost",
        shock: "Szok rynkowy",
      }
    : {
        eyebrow: "WSP PROTOTYPE",
        title: "Demand Forecast & Production Decision",
        subtitle: "Public-market benchmark translated into a planner-facing decision surface.",
        forecast: "Demand forecast",
        confidence: "Forecast interval",
        direction: "Direction signal",
        baseline: "Baseline forecast",
        market: "Market signals",
        foodHicp: "Food HICP",
        recommendation: "Planning recommendation",
        recommendationText: "Prepare additional production capacity for the next planning cycle; monitor the leading market signal before final commitment.",
        why: "Why the model moved",
        whyText: "Seasonal demand history remains the primary driver. Food HICP provides an external adjustment and uncertainty context.",
        demo: "Demonstration data — to be validated on WSP data",
        base: "Baseline",
        growth: "Growth",
        shock: "Market shock",
      };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/8 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              <LineChart className="h-4 w-4" />
              {copy.eyebrow}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{copy.subtitle}</p>
          </div>
          <Badge variant="amber">{copy.demo}</Badge>
        </header>

        <section className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Scenario</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["base", copy.base],
                ["growth", copy.growth],
                ["shock", copy.shock],
              ].map(([id, label]) => (
                <Button key={id} size="sm" variant={scenario === id ? "default" : "secondary"} onClick={() => setScenario(id)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Forecast horizon</div>
            <select value={horizon} onChange={(e) => setHorizon(e.target.value)} className="mt-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              <option>1 month</option>
              <option>3 months</option>
              <option>6 months</option>
            </select>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Model</div>
            <div className="mt-2 text-sm font-medium text-cyan-100">wsp-demand-v0.1</div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label={copy.forecast} value={`${forecast.toFixed(0)} idx`} sub={`${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs latest actual`} tone="positive" />
          <StatCard label={copy.confidence} value={`${low} — ${high}`} sub="approx. 95% model interval" />
          <StatCard label={copy.direction} value={signal} sub="external + historical signal" tone={signal === "UP" ? "positive" : "warning"} />
          <StatCard label={copy.baseline} value={`${lastActual.toFixed(0)} idx`} sub={`latest observed point`} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_.8fr]">
          <Card className="border-white/8 bg-white/[0.03]">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{copy.forecast}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Historical demand and one-step forecast trajectory</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500"><Target className="h-4 w-4" /> {horizon}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                <Sparkline values={forecastSeries} />
                <div className="mt-3 grid grid-cols-6 gap-2 text-[10px] text-slate-600 sm:grid-cols-12">
                  {labels.map((label) => <span key={label} className="text-center">{label}</span>)}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-cyan-300" /> demand</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full border border-dashed border-emerald-300/70" /> forecast extension</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-300/15 bg-cyan-300/[0.04]">
            <CardHeader>
              <div className="flex items-center gap-2 text-cyan-300"><TrendingUp className="h-4 w-4" /><CardTitle>{copy.market}</CardTitle></div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-center justify-between text-sm"><span className="text-slate-400">{copy.foodHicp}</span><span className="font-medium text-white">{HICP_POINTS[HICP_POINTS.length - 1].toFixed(1)}</span></div>
                <div className="mt-2 h-2 rounded-full bg-white/8"><div className="h-2 w-[68%] rounded-full bg-cyan-300/70" /></div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Lagged external signal used as a conservative forecast adjustment.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Signal contribution</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div><div className="text-lg font-semibold text-white">72%</div><div className="text-xs text-slate-500">history</div></div>
                  <div><div className="text-lg font-semibold text-cyan-300">28%</div><div className="text-xs text-slate-500">external</div></div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-4 w-4 shrink-0" /> External signals are explanatory inputs in this prototype, not proof of WSP SKU-level accuracy.</div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="border-emerald-300/15 bg-emerald-300/[0.04]">
            <CardHeader>
              <div className="flex items-center gap-2 text-emerald-300"><ArrowUpRight className="h-4 w-4" /><CardTitle>{copy.recommendation}</CardTitle></div>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-emerald-300/15 bg-slate-950/40 p-5">
                <div className="text-2xl font-semibold text-white">Prepare capacity + monitor market</div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{copy.recommendationText}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/8 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>{copy.why}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-300" /><span>{copy.whyText}</span></div>
                <div className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-300" /><span>Forecast stays inside a quantified uncertainty interval instead of returning a single unexplained number.</span></div>
                <div className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-amber-300" /><span>No recommendation is made without exposing the signal and its confidence context.</span></div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-xs text-slate-500">
          <div className="flex items-center gap-2"><Info className="h-4 w-4" /> Prototype only. Replace the aggregate public benchmark with WSP sales / orders / promotions / inventory / production data for customer validation.</div>
        </section>
      </div>
    </main>
  );
}
