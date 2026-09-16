"use client";

import { useState } from "react";
import { ArrowRight, Check, CircleAlert, Play, RotateCcw, Users, X } from "lucide-react";
import type { Locale } from "@/lib/observatory-i18n";

const DEMO = {
  planning_period: { id: "synthetic-week-01", label: "Демонстраційний тиждень" },
  communities: [
    { id: "Громада А", region: "Схід · synthetic", accessible: true, max_teams: 2, demand: [{ service: "psychologist", units: 8, priority: "critical" as const }, { service: "social-worker", units: 5, priority: "high" as const }] },
    { id: "Громада Б", region: "Схід · synthetic", accessible: true, max_teams: 2, demand: [{ service: "legal", units: 6, priority: "high" as const }, { service: "social-worker", units: 4, priority: "normal" as const }] },
    { id: "Громада В", region: "Схід · synthetic", accessible: false, max_teams: 1, demand: [{ service: "psychologist", units: 5, priority: "high" as const }] },
  ],
  teams: [
    { id: "Команда 1", current_community: "Громада Б", skills: ["psychologist", "social-worker"], capacity: 10 },
    { id: "Команда 2", current_community: "Громада А", skills: ["legal", "social-worker"], capacity: 8 },
    { id: "Команда 3", current_community: "Громада Б", skills: ["psychologist"], capacity: 5, allowed_communities: ["Громада А", "Громада Б"] },
  ],
  travel_edges: [{ from: "Громада Б", to: "Громада А", cost: 4 }, { from: "Громада А", to: "Громада Б", cost: 4 }],
  current_allocation: { "Команда 1": "Громада Б", "Команда 2": "Громада А", "Команда 3": "Громада Б" },
  synthetic: true,
};

type Metrics = { priority_coverage: number; total_coverage: number; unmet_need: number; capacity_utilization: number; travel_cost: number };
type Alternative = { assignments: Record<string, string | null>; score: number; metrics: Metrics; binding_constraints: string[]; evidence: string[] };
type Result = { status: string; recommended: Alternative; alternatives: Alternative[]; baseline: Alternative | null; delta_vs_baseline: Record<string, number> | null; evidence: string[]; uncertainty: string[]; engine_version: string };
type DecisionState = "accepted" | "modify" | "rejected" | null;

const pct = (value: number) => `${Math.round(value * 100)}%`;
const metric = (label: string, current: number | undefined, recommended: number, percentage = true) => ({ label, current: current ?? 0, recommended, percentage });

export function ResourceAllocationWorkspace({ locale }: { locale: Locale }) {
  void locale;
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionState>(null);

  async function run() {
    setRunning(true); setError(null); setDecision(null);
    try {
      const response = await fetch("/api/resource-allocation/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(DEMO) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "DIP request failed");
      setResult(payload); setSelected(0);
    } catch (e) { setError(e instanceof Error ? e.message : "DIP request failed"); }
    finally { setRunning(false); }
  }

  const active = result?.alternatives[selected] ?? result?.recommended;
  const metrics = active ? [
    metric("Пріоритетні потреби", result?.baseline?.metrics.priority_coverage, active.metrics.priority_coverage),
    metric("Загальне покриття", result?.baseline?.metrics.total_coverage, active.metrics.total_coverage),
    metric("Невиконана потреба", result?.baseline?.metrics.unmet_need, active.metrics.unmet_need, false),
    metric("Використання ресурсу", result?.baseline?.metrics.capacity_utilization, active.metrics.capacity_utilization),
  ] : [];

  return <main className="min-h-screen bg-[#f7f5f2] text-[#191919]">
    <div className="mx-auto max-w-[1480px] px-5 py-8 md:px-10 lg:py-12">
      <header className="border-b border-black/15 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="text-xs font-bold uppercase tracking-[.18em] text-[#d5222a]">DIP · Resource Allocation</div><div className="rounded-full border border-[#d5222a]/30 bg-white px-3 py-1 text-xs font-semibold text-[#b51e25]">Синтетичні демонстраційні дані</div></div>
        <h1 className="mt-6 max-w-5xl text-4xl font-black leading-[.95] tracking-[-.04em] md:text-6xl">Розподіл мобільних команд</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-black/60">Який розподіл доступних команд дасть найбільше покриття пріоритетних потреб громад з урахуванням навичок, доступності, місткості та вартості переміщення?</p>
      </header>

      <section className="grid gap-6 py-8 lg:grid-cols-[.72fr_1.28fr]">
        <aside className="space-y-4">
          <div className="bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">01 · Поточний стан</h2><button aria-label="Reset" onClick={() => { setResult(null); setError(null); setDecision(null); }} className="p-2 text-black/45 hover:text-black"><RotateCcw className="h-4 w-4" /></button></div>
            <div className="mt-6 space-y-3">{DEMO.communities.map(c => <div key={c.id} className="border-t border-black/10 pt-3"><div className="flex justify-between gap-3"><b>{c.id}</b><span className={c.accessible ? "text-black/45" : "font-semibold text-[#d5222a]"}>{c.accessible ? c.region : "Недоступна"}</span></div><div className="mt-2 text-sm text-black/55">{c.demand.map(d => `${d.service}: ${d.units} · ${d.priority}`).join(" · ")}</div></div>)}</div>
          </div>
          <div className="bg-[#191919] p-6 text-white"><h2 className="text-xl font-bold">02 · Ресурс</h2><div className="mt-5 space-y-4">{DEMO.teams.map(t => <div key={t.id}><div className="flex justify-between"><b>{t.id}</b><span className="text-white/55">capacity {t.capacity}</span></div><div className="mt-1 text-sm text-white/55">{t.skills.join(" · ")} · зараз: {t.current_community}</div></div>)}</div><button onClick={run} disabled={running} className="mt-7 flex w-full items-center justify-center gap-2 bg-[#d5222a] px-5 py-4 font-bold text-white disabled:opacity-50"><Play className="h-4 w-4" />{running ? "DIP розраховує…" : "Розрахувати розподіл"}</button></div>
        </aside>

        <div className="space-y-5">
          {error && <div className="flex gap-3 border border-[#d5222a]/30 bg-white p-5 text-[#b51e25]"><CircleAlert className="h-5 w-5 shrink-0" />{error}</div>}
          {!result && !error && <div className="flex min-h-[480px] items-center justify-center border border-dashed border-black/20 bg-white/60 p-10 text-center"><div><Users className="mx-auto h-10 w-10 text-[#d5222a]"/><h2 className="mt-5 text-2xl font-bold">03 · Рішення</h2><p className="mt-2 text-black/50">Запустіть DIP, щоб порівняти поточний розподіл з feasible alternatives.</p></div></div>}
          {result && active && <>
            <div className="bg-white p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-bold uppercase tracking-[.16em] text-[#d5222a]">03 · Рекомендований розподіл</div><h2 className="mt-2 text-3xl font-black">Покрити пріоритетний попит доступними спеціалістами</h2></div><span className="text-xs text-black/40">{result.engine_version}</span></div>
              <div className="mt-7 grid gap-px bg-black/10 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(m => <div key={m.label} className="bg-[#faf9f7] p-4"><div className="text-xs text-black/50">{m.label}</div><div className="mt-2 text-2xl font-black">{m.percentage ? pct(m.recommended) : m.recommended.toFixed(0)}</div><div className="mt-1 text-xs text-black/45">було {m.percentage ? pct(m.current) : m.current.toFixed(0)} · Δ {m.percentage ? `${Math.round((m.recommended-m.current)*100)} pp` : (m.recommended-m.current).toFixed(0)}</div></div>)}</div>
              <div className="mt-7 grid gap-3 md:grid-cols-2">{Object.entries(active.assignments).map(([team, community]) => <div key={team} className="border border-black/10 p-4"><div className="text-xs text-black/45">{team}</div><div className="mt-2 flex items-center gap-2 font-bold"><span>{DEMO.teams.find(t => t.id === team)?.current_community}</span><ArrowRight className="h-4 w-4 text-[#d5222a]"/><span>{community ?? "резерв"}</span></div></div>)}</div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2"><div className="bg-white p-6"><h3 className="text-xl font-bold">04 · Альтернативи</h3><div className="mt-4 space-y-2">{result.alternatives.map((a, index) => <button key={index} onClick={() => setSelected(index)} className={`w-full border p-4 text-left ${selected === index ? "border-[#d5222a] bg-[#d5222a]/[.035]" : "border-black/10"}`}><div className="flex justify-between"><b>{index === 0 ? "Рекомендовано" : `Альтернатива ${index + 1}`}</b><span className="text-sm">{pct(a.metrics.priority_coverage)} priority</span></div><div className="mt-1 text-xs text-black/45">coverage {pct(a.metrics.total_coverage)} · travel {a.metrics.travel_cost.toFixed(0)}</div></button>)}</div></div>
              <div className="bg-white p-6"><h3 className="text-xl font-bold">05 · Чому цей розподіл?</h3><div className="mt-4 space-y-3">{active.evidence.map(line => <div key={line} className="flex gap-2 text-sm leading-6 text-black/60"><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#d5222a]"/>{line}</div>)}{result.uncertainty.map(line => <div key={line} className="flex gap-2 text-sm leading-6 text-[#a86b00]"><CircleAlert className="mt-1 h-4 w-4 shrink-0"/>{line}</div>)}</div></div></div>

            <div className="flex flex-wrap items-center gap-3 border-t border-black/15 pt-5"><span className="mr-auto text-xs font-bold uppercase tracking-[.14em] text-black/45">Human in the loop · demo state only</span><button onClick={() => setDecision("rejected")} className="flex items-center gap-2 border border-black/20 px-5 py-3 font-semibold"><X className="h-4 w-4"/>Відхилити</button><button onClick={() => setDecision("modify")} className="border border-black/20 px-5 py-3 font-semibold">Змінити</button><button onClick={() => setDecision("accepted")} className="flex items-center gap-2 bg-[#d5222a] px-5 py-3 font-semibold text-white"><Check className="h-4 w-4"/>Прийняти</button>{decision && <span className="w-full text-right text-sm text-black/50">Demo decision: {decision}</span>}</div>
          </>}
        </div>
      </section>
    </div>
  </main>;
}
