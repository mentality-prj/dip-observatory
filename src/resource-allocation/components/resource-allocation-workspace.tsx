"use client";

import { useMemo, useState } from "react";
import { CircleAlert, Play, RotateCcw, Route, Users } from "lucide-react";
import type { Locale } from "@/lib/observatory-i18n";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SERVICES = ["psychologist", "social-worker", "legal", "protection", "case-manager", "child-support"];
const NAMES = Array.from({ length: 18 }, (_, index) => `Громада ${String.fromCharCode(65 + index)}`);
const communities = NAMES.map((id, index) => ({
  id,
  accessible: ![7, 14].includes(index),
  max_teams: index % 4 === 0 ? 2 : 3,
  demand: [0, 1, 2].map((offset) => ({
    service: SERVICES[(index + offset) % SERVICES.length],
    units: 9,
    priority: (offset === 0 && index % 3 === 0 ? "critical" : offset < 2 ? "high" : "normal") as "critical" | "high" | "normal",
  })),
  accessibility: index === 5 ? { Wed: false, Thu: false } : {},
  daily_demand: index % 5 === 0 ? { Wed: [{ service: SERVICES[index % SERVICES.length], units: 3, priority: "high" as const }] } : {},
}));
const teams = Array.from({ length: 10 }, (_, index) => ({
  id: `Команда ${index + 1}`,
  current_community: NAMES[(index * 2) % NAMES.length],
  skills: [SERVICES[index % SERVICES.length], SERVICES[(index + 1) % SERVICES.length]],
  capacity: 12 + (index % 3) * 2,
  availability: index === 8 ? { Fri: false } : {},
  daily_capacity: index === 3 ? { Thu: 8 } : {},
  max_travel_cost: 18,
  cost_per_capacity: 0.4 + (index % 3) * 0.1,
  programs: [],
}));
const travel_edges = NAMES.flatMap((from, index) => [1, 2, 3].flatMap((step) => {
  const to = NAMES[(index + step) % NAMES.length];
  const back = NAMES[(index - step + NAMES.length) % NAMES.length];
  return [{ from, to, cost: step * 4, minutes: step * 18 }, { from, to: back, cost: step * 4, minutes: step * 18 }];
}));
const current_allocation = Object.fromEntries(teams.map((team) => [team.id, team.current_community]));
const DEMO = { operation: "optimize" as const, planning_period: { days: DAYS }, communities, teams, travel_edges, current_allocation, provenance: { source: "dip-observatory-synthetic-demo", mapping_version: "resource-allocation-demo/2" } };

type Metrics = { priority_coverage: number; total_coverage: number; unmet_need: number; capacity_utilization: number; travel_cost: number; operating_cost?: number };
type DayPlan = { day: string; status: string; recommended: { assignments: Record<string, string | null>; metrics: Metrics; evidence?: string[] }; demand: { opening: number; served: number; closing_unmet: number } };
type PeriodPlan = { daily: DayPlan[]; aggregate_metrics: Metrics; period_score: number; demand_summary: { total_available: number; served: number; closing_unmet: number } };
type Result = { status: string; daily: DayPlan[]; aggregate_metrics: Metrics; demand_summary: PeriodPlan["demand_summary"]; alternatives: PeriodPlan[]; solver: string; search_space: number; evaluated_plans: number; engine_version: string; evidence: string[] };

const pct = (value: number) => `${Math.round(value * 100)}%`;
const copy: Record<Locale, { title: string; subtitle: string; run: string; running: string }> = {
  uk: { title: "План розподілу мобільних команд", subtitle: "10 команд · 18 громад · 486 початкових потреб · горизонт 5 днів", run: "Оптимізувати тиждень", running: "Розрахунок…" },
  en: { title: "Mobile team allocation plan", subtitle: "10 teams · 18 communities · 486 opening needs · 5-day horizon", run: "Optimize week", running: "Calculating…" },
  pl: { title: "Plan alokacji zespołów mobilnych", subtitle: "10 zespołów · 18 społeczności · 486 potrzeb początkowych · 5 dni", run: "Optymalizuj tydzień", running: "Obliczanie…" },
};

export function ResourceAllocationWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [result, setResult] = useState<Result | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacityFactor, setCapacityFactor] = useState(100);
  const [blockedCommunity, setBlockedCommunity] = useState<string>("");

  async function run() {
    setRunning(true); setError(null);
    try {
      const input = {
        ...DEMO,
        teams: DEMO.teams.map((team) => ({ ...team, capacity: team.capacity * capacityFactor / 100 })),
        communities: DEMO.communities.map((community) => ({ ...community, accessible: community.id === blockedCommunity ? false : community.accessible })),
      };
      const response = await fetch("/api/resource-allocation/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "DIP request failed");
      setResult(payload as Result); setSelectedAlternative(0); setSelectedDay(0);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "DIP request failed"); }
    finally { setRunning(false); }
  }

  const activePlan = result ? (result.alternatives[selectedAlternative] ?? { daily: result.daily, aggregate_metrics: result.aggregate_metrics, demand_summary: result.demand_summary, period_score: 0 }) : null;
  const day = activePlan?.daily[selectedDay] ?? null;
  const moved = useMemo(() => day ? Object.entries(day.recommended.assignments).filter(([team, target]) => current_allocation[team] !== target).length : 0, [day]);

  return <main className="min-h-screen bg-[#f7f5f2] text-[#191919]"><div className="mx-auto max-w-[1540px] px-5 py-8 md:px-10 lg:py-12">
    <header className="border-b border-black/15 pb-7"><div className="flex flex-wrap items-center justify-between gap-3"><div className="text-xs font-bold uppercase tracking-[.18em] text-[#d5222a]">DIP · Resource Allocation · Client Demo</div><span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs">Synthetic operational data · no PII</span></div><h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{t.title}</h1><p className="mt-4 text-black/55">{t.subtitle}</p></header>

    <section className="grid gap-5 py-7 xl:grid-cols-[330px_1fr]"><aside className="space-y-4"><div className="bg-[#191919] p-6 text-white"><div className="flex items-center justify-between"><b>01 · WHAT-IF</b><button onClick={() => { setCapacityFactor(100); setBlockedCommunity(""); setResult(null); }}><RotateCcw className="h-4 w-4"/></button></div><label className="mt-6 block text-sm"><span className="flex justify-between"><span>Team capacity</span><b>{capacityFactor}%</b></span><input className="mt-3 w-full accent-[#d5222a]" type="range" min="70" max="130" step="5" value={capacityFactor} onChange={(event) => setCapacityFactor(Number(event.target.value))}/></label><label className="mt-5 block text-sm"><span>Temporarily inaccessible</span><select className="mt-2 w-full bg-white p-2 text-black" value={blockedCommunity} onChange={(event) => setBlockedCommunity(event.target.value)}><option value="">None</option>{NAMES.filter((_, index) => ![7,14].includes(index)).map((name) => <option key={name}>{name}</option>)}</select></label><button disabled={running} onClick={run} className="mt-6 flex w-full items-center justify-center gap-2 bg-[#d5222a] p-4 font-bold disabled:opacity-50"><Play className="h-4 w-4"/>{running ? t.running : t.run}</button></div>
      <div className="bg-white p-6"><b>02 · STATE</b><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><span className="block text-black/45">Communities</span><b className="text-2xl">18</b></div><div><span className="block text-black/45">Teams</span><b className="text-2xl">10</b></div><div><span className="block text-black/45">Opening need</span><b className="text-2xl">486</b></div><div><span className="block text-black/45">Services</span><b className="text-2xl">6</b></div></div><div className="mt-5 border-t border-black/10 pt-4 text-xs text-black/50">Hard constraints: accessibility, skills, capacity, team/community limits and directed travel routes.</div></div></aside>

      <div className="space-y-5">{error && <div className="border border-red-200 bg-white p-4 text-red-700"><CircleAlert className="mr-2 inline h-4 w-4"/>{error}</div>}{!result && <div className="flex min-h-[560px] items-center justify-center border border-dashed border-black/15 bg-white text-center"><div className="max-w-xl px-8"><Route className="mx-auto h-11 w-11 text-[#d5222a]"/><h2 className="mt-5 text-3xl font-black">11? No. 10 teams, 18 communities, 5 days.</h2><p className="mt-3 text-black/50">This is a horizon decision: tomorrow's location changes which routes remain feasible later in the week. Run DIP to calculate the weekly allocation.</p></div></div>}

      {result && activePlan && day && <><div className="grid gap-4 md:grid-cols-4"><Metric label="Priority coverage" value={pct(activePlan.aggregate_metrics.priority_coverage)}/><Metric label="Total coverage" value={pct(activePlan.aggregate_metrics.total_coverage)}/><Metric label="Needs served" value={`${activePlan.demand_summary.served.toFixed(0)} / ${activePlan.demand_summary.total_available.toFixed(0)}`}/><Metric label="Closing unmet" value={activePlan.demand_summary.closing_unmet.toFixed(0)}/></div>
        <div className="bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wider text-[#d5222a]">03 · WEEKLY PLAN</div><h2 className="mt-2 text-2xl font-black">Day-by-day allocation with evolving locations</h2></div><div className="text-right text-xs text-black/40"><div>{result.engine_version}</div><div>{result.solver} · evaluated {result.evaluated_plans}</div></div></div><div className="mt-6 flex gap-2 overflow-x-auto">{activePlan.daily.map((item, index) => <button key={item.day} onClick={() => setSelectedDay(index)} className={`min-w-28 border px-4 py-3 text-left ${selectedDay === index ? "border-[#d5222a] bg-red-50" : "border-black/10"}`}><b>{item.day}</b><div className="mt-1 text-xs text-black/45">served {item.demand.served.toFixed(0)}</div></button>)}</div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{NAMES.map((community) => <div key={community} className="min-h-32 border border-black/10 p-3"><div className="flex justify-between gap-2"><b className="text-sm">{community}</b></div><div className="mt-3 space-y-1">{Object.entries(day.recommended.assignments).filter(([, target]) => target === community).map(([team]) => <div key={team} className="bg-[#191919] px-2 py-1 text-xs font-semibold text-white">{team}</div>)}</div></div>)}</div><div className="mt-4 flex flex-wrap gap-4 border-t border-black/10 pt-4 text-sm"><span><Users className="mr-1 inline h-4 w-4"/>Moved vs opening state: <b>{moved}</b></span><span>Opening need: <b>{day.demand.opening.toFixed(0)}</b></span><span>Served: <b>{day.demand.served.toFixed(0)}</b></span><span>Closing unmet: <b>{day.demand.closing_unmet.toFixed(0)}</b></span></div></div>

        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="bg-white p-6"><div className="text-xs font-bold uppercase tracking-wider text-[#d5222a]">04 · ALTERNATIVES</div><div className="mt-4 space-y-2">{result.alternatives.map((alternative, index) => <button key={index} onClick={() => { setSelectedAlternative(index); setSelectedDay(0); }} className={`w-full border p-4 text-left ${selectedAlternative === index ? "border-[#d5222a] bg-red-50" : "border-black/10"}`}><div className="flex justify-between"><b>{index === 0 ? "Recommended plan" : `Alternative ${index + 1}`}</b><span>{pct(alternative.aggregate_metrics.priority_coverage)}</span></div><div className="mt-1 text-xs text-black/45">served {alternative.demand_summary.served.toFixed(0)} · unmet {alternative.demand_summary.closing_unmet.toFixed(0)} · score {alternative.period_score.toFixed(0)}</div></button>)}</div></div><div className="bg-white p-6"><div className="text-xs font-bold uppercase tracking-wider text-[#d5222a]">05 · DECISION EVIDENCE</div><h3 className="mt-2 text-xl font-black">Why this weekly plan?</h3><div className="mt-5 grid gap-3 md:grid-cols-2">{result.evidence.slice(0, 8).map((item, index) => <div key={`${item}-${index}`} className="border-l-2 border-[#d5222a] pl-3 text-sm text-black/65">{item}</div>)}</div><div className="mt-6 border-t border-black/10 pt-4 text-xs text-black/45">Large search spaces use deterministic branch-aware beam search. The UI reports the solver rather than presenting a heuristic as a mathematical global optimum.</div></div></div>
      </>}</div></section>
  </div></main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="bg-white p-5"><div className="text-xs text-black/45">{label}</div><div className="mt-2 text-2xl font-black">{value}</div></div>; }
