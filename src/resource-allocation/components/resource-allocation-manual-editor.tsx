"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, RefreshCw } from "lucide-react";
import { ResourceAllocationNetwork } from "./resource-allocation-network";

type DayPlan = { day: string; recommended: { assignments: Record<string, string | null> } };
type Evaluation = { status?: string; daily?: Array<{ day: string; recommended?: { metrics?: { priority_coverage?: number; total_coverage?: number; travel_cost?: number }; violations?: string[] }; demand?: { served?: number; closing_unmet?: number } }>; aggregate_metrics?: { priority_coverage?: number; total_coverage?: number; travel_cost?: number }; demand_summary?: { served?: number; closing_unmet?: number }; violations?: string[] };
type InputTeam = { id: string; current_community: string };

export function ResourceAllocationManualEditor({ input, plan, communities, teams, onUseModified }: { input: Record<string, unknown>; plan: { daily: DayPlan[] }; communities: string[]; teams: string[]; onUseModified: (selected: Record<string, unknown>) => void }) {
  const seed = useMemo(() => Object.fromEntries(plan.daily.map((day) => [day.day, { ...day.recommended.assignments }])), [plan]);
  const [allocation, setAllocation] = useState<Record<string, Record<string, string | null>>>(seed);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualDay, setVisualDay] = useState(plan.daily[0]?.day ?? "Mon");
  useEffect(() => { setAllocation(seed); setEvaluation(null); setVisualDay(plan.daily[0]?.day ?? "Mon"); }, [seed, plan.daily]);
  const inputTeams = useMemo(() => Array.isArray(input.teams) ? input.teams.filter((item): item is InputTeam => typeof item === "object" && item !== null && "id" in item && "current_community" in item).map((item) => ({ id: String(item.id), current_community: String(item.current_community) })) : [], [input]);
  const visualPlan = plan.daily.find((day) => day.day === visualDay) ?? plan.daily[0];

  function change(day: string, team: string, target: string) { setAllocation((current) => ({ ...current, [day]: { ...current[day], [team]: target || null } })); setEvaluation(null); }
  async function evaluate() {
    setRunning(true); setError(null);
    try {
      const response = await fetch("/api/resource-allocation/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, operation: "evaluate_manual", manual_allocation: allocation }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Manual plan evaluation failed");
      setEvaluation(payload as Evaluation);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Manual plan evaluation failed"); }
    finally { setRunning(false); }
  }
  const metrics = evaluation?.aggregate_metrics; const demand = evaluation?.demand_summary;
  const violations = [...(evaluation?.violations ?? []), ...(evaluation?.daily ?? []).flatMap((day) => day.recommended?.violations ?? [])];
  return <div className="space-y-5">{visualPlan && inputTeams.length > 0 && <><div className="flex gap-2 overflow-x-auto bg-white px-6 pt-5">{plan.daily.map((day) => <button key={day.day} onClick={() => setVisualDay(day.day)} className={`border px-4 py-2 text-xs font-bold ${visualDay === day.day ? "border-[#d5222a] bg-red-50 text-[#d5222a]" : "border-black/10 text-black/50"}`}>{day.day}</button>)}</div><ResourceAllocationNetwork communities={communities} teams={inputTeams} day={visualDay} recommended={visualPlan.recommended.assignments} manual={evaluation && violations.length === 0 ? allocation[visualDay] : null}/></>}
  <section className="bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wider text-[#d5222a]">07 · MANUAL OVERRIDE</div><h3 className="mt-2 text-2xl font-black">Move teams manually, then let DIP evaluate the plan</h3><p className="mt-2 max-w-3xl text-sm text-black/50">The manager changes assignments. DIP does not silently optimize them back; it evaluates coverage, unmet demand, travel and constraint violations.</p></div><button onClick={() => { setAllocation(seed); setEvaluation(null); }} className="flex items-center gap-2 border border-black/15 px-3 py-2 text-sm"><RefreshCw className="h-4 w-4"/>Reset</button></div>
  <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-sm"><thead><tr><th className="border-b border-black/15 p-2 text-left">Team</th>{plan.daily.map((day) => <th key={day.day} className="border-b border-black/15 p-2 text-left">{day.day}</th>)}</tr></thead><tbody>{teams.map((team) => <tr key={team}><td className="border-b border-black/5 p-2 font-bold">{team}</td>{plan.daily.map((day) => <td key={day.day} className="border-b border-black/5 p-2"><select aria-label={`${team} ${day.day}`} className="w-full border border-black/10 bg-white p-2" value={allocation[day.day]?.[team] ?? ""} onChange={(event) => change(day.day, team, event.target.value)}><option value="">Unassigned</option>{communities.map((community) => <option key={community}>{community}</option>)}</select></td>)}</tr>)}</tbody></table></div>
  <div className="mt-5 flex flex-wrap items-center gap-3"><button disabled={running} onClick={evaluate} className="flex items-center gap-2 bg-[#191919] px-5 py-3 font-bold text-white disabled:opacity-50"><Pencil className="h-4 w-4"/>{running ? "Evaluating…" : "Evaluate manual plan"}</button>{evaluation && <button disabled={violations.length > 0} onClick={() => onUseModified({ daily: plan.daily.map((day) => ({ day: day.day, assignments: allocation[day.day] })) , evaluation })} className="border border-[#d5222a] px-5 py-3 font-bold text-[#d5222a] disabled:opacity-30">Use as manager modification</button>}</div>
  {error && <div className="mt-4 border border-red-200 p-3 text-sm text-red-700">{error}</div>}{evaluation && <div className="mt-5 grid gap-3 md:grid-cols-5"><Kpi label="Priority coverage" value={metrics?.priority_coverage == null ? "—" : `${Math.round(metrics.priority_coverage * 100)}%`}/><Kpi label="Total coverage" value={metrics?.total_coverage == null ? "—" : `${Math.round(metrics.total_coverage * 100)}%`}/><Kpi label="Served" value={demand?.served?.toFixed(0) ?? "—"}/><Kpi label="Unmet" value={demand?.closing_unmet?.toFixed(0) ?? "—"}/><Kpi label="Travel cost" value={metrics?.travel_cost?.toFixed(1) ?? "—"}/></div>}
  {evaluation && <div className={`mt-4 border p-4 text-sm ${violations.length ? "border-red-300 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{violations.length ? <><b>{violations.length} constraint violation(s)</b><div className="mt-2 space-y-1">{violations.slice(0, 8).map((item, index) => <div key={`${item}-${index}`}>{item}</div>)}</div></> : <b>Manual plan is feasible under the current constraints. The Manager layer is now available in the network comparison above.</b>}</div>}</section></div>;
}
function Kpi({ label, value }: { label: string; value: string }) { return <div className="border border-black/10 p-3"><div className="text-xs text-black/45">{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>; }
