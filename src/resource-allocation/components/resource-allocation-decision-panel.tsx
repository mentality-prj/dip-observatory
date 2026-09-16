"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Flag, Gauge, Save, X } from "lucide-react";

type CapacityRecommendation = {
  resource: string;
  extra_team_equivalents: number;
  added_capacity: number;
  priority_coverage: number;
  delta_priority_coverage: number;
  marginal_gain: number;
  diminishing_returns: boolean;
  target_reached: boolean;
};

type CapacityBottleneck = {
  resource: string;
  priority_demand: number;
  available_capacity: number;
  capacity_shortfall: number;
  first_increment_gain: number;
  binding: boolean;
};

type CapacityGap = {
  status: "ok" | "infeasible";
  operation: "capacity_gap";
  current?: { priority_coverage?: number };
  target_priority_coverage?: number;
  gap_to_target?: number;
  target_status?: "already_met" | "gap";
  minimum_capacity_to_target?: CapacityRecommendation[];
  bottlenecks?: CapacityBottleneck[];
  marginal_scenarios?: CapacityRecommendation[];
};

type Lifecycle = { decisionId: string; status: string } | null;
type Props = { input: Record<string, unknown>; selected: Record<string, unknown>; manualSelected?: Record<string, unknown> | null; priorityCoverage: number; served: number; unmet: number };
async function post(path: string, body: Record<string, unknown>) { const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? payload.detail ?? `Request failed (${response.status})`); return payload; }

export function ResourceAllocationDecisionPanel({ input, selected, manualSelected, priorityCoverage, served, unmet }: Props) {
  const [capacity, setCapacity] = useState<CapacityGap | null>(null); const [lifecycle, setLifecycle] = useState<Lifecycle>(null); const [reason, setReason] = useState(""); const [notes, setNotes] = useState(""); const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { setLifecycle(null); setCapacity(null); setReason(""); setNotes(""); }, [input]);
  async function capacityGap() { setBusy("capacity"); setError(null); try { setCapacity(await post("/api/resource-allocation/capacity-gap", { ...input, target_priority_coverage: 0.9 })); } catch (e) { setError(e instanceof Error ? e.message : "Capacity analysis failed"); } finally { setBusy(null); } }
  async function persist() { setBusy("persist"); setError(null); try { const payload = await post("/api/resource-allocation/decisions", input); setLifecycle({ decisionId: payload.decision_id, status: payload.status }); } catch (e) { setError(e instanceof Error ? e.message : "Decision persistence failed"); } finally { setBusy(null); } }
  async function feedback(status: "accepted" | "modified" | "rejected") { if (!lifecycle) return; setBusy(status); setError(null); try { const body: Record<string, unknown> = { status }; if (status === "modified") { body.reason = reason || "Manager manually adjusted the weekly allocation in Observatory."; body.selected = manualSelected ?? selected; } if (status === "rejected") body.reason = reason || "Manager rejected the proposed allocation."; const payload = await post(`/api/resource-allocation/decisions/${encodeURIComponent(lifecycle.decisionId)}/feedback`, body); setLifecycle({ ...lifecycle, status: payload.status }); } catch (e) { setError(e instanceof Error ? e.message : "Decision update failed"); } finally { setBusy(null); } }
  async function outcome() { if (!lifecycle) return; setBusy("outcome"); setError(null); try { const payload = await post(`/api/resource-allocation/decisions/${encodeURIComponent(lifecycle.decisionId)}/outcomes`, { actual_allocation: manualSelected ?? selected, metrics: { priority_coverage: priorityCoverage, served, closing_unmet: unmet }, notes: notes || "Demo outcome recorded from Observatory." }); setLifecycle({ ...lifecycle, status: payload.status }); } catch (e) { setError(e instanceof Error ? e.message : "Outcome recording failed"); } finally { setBusy(null); } }
  const recommendations = capacity?.minimum_capacity_to_target ?? [];
  const bindingBottlenecks = capacity?.bottlenecks?.filter((item) => item.binding) ?? [];
  return <div className="grid gap-5 xl:grid-cols-2"><section className="bg-[#191919] p-6 text-white"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wider text-red-400">08 · CAPACITY GAP</div><h3 className="mt-2 text-xl font-black">What capacity would change the result?</h3></div><Gauge className="h-6 w-6"/></div><button disabled={Boolean(busy)} onClick={capacityGap} className="mt-5 border border-white/25 px-4 py-3 text-sm font-bold disabled:opacity-40">{busy === "capacity" ? "Analyzing…" : "Analyze 90% priority target"}</button>{capacity && <div className="mt-5 space-y-4 text-sm">{capacity.status === "infeasible" ? <div className="border border-red-400/40 p-4 text-red-200">Capacity analysis is infeasible for the current operational state.</div> : <><div className="grid grid-cols-2 gap-3"><div className="border border-white/15 p-3"><span className="text-white/50">Gap to target</span><b className="mt-1 block text-xl">{Math.round((capacity.gap_to_target ?? 0) * 100)} pp</b></div><div className="border border-white/15 p-3"><span className="text-white/50">Status</span><b className="mt-1 block text-xl">{capacity.target_status === "already_met" ? "Target reached" : "Capacity gap"}</b></div></div>{capacity.target_status === "already_met" && <div className="border-l-2 border-emerald-400 pl-3">Current priority coverage already meets the 90% target. No additional capacity is required.</div>}{capacity.target_status === "gap" && recommendations.length === 0 && <div className="border-l-2 border-amber-300 pl-3">The tested additions of up to three team-equivalents per service do not reach the 90% target. Review the binding constraints below.</div>}{recommendations.length > 0 && <div><div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">Minimum tested additions that reach target</div><div className="space-y-2">{recommendations.map((item) => <div key={`${item.resource}-${item.added_capacity}`} className="border border-white/15 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><b>{item.resource}</b><span>+{item.extra_team_equivalents} team eq. · +{item.added_capacity.toFixed(0)} capacity</span></div><div className="mt-1 text-xs text-white/50">Priority coverage {Math.round(item.priority_coverage * 100)}% · improvement +{(item.delta_priority_coverage * 100).toFixed(1)} pp</div></div>)}</div></div>}{bindingBottlenecks.length > 0 && <div><div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">Binding service bottlenecks</div>{bindingBottlenecks.slice(0, 4).map((item) => <div key={item.resource} className="grid grid-cols-[1fr_auto] gap-3 border-t border-white/10 py-2"><span>{item.resource}<span className="block text-xs text-white/45">priority demand {item.priority_demand.toFixed(0)} · available capacity {item.available_capacity.toFixed(0)}</span></span><b className="text-right">shortfall {item.capacity_shortfall.toFixed(0)}<span className="block text-xs font-normal text-white/45">+{(item.first_increment_gain * 100).toFixed(1)} pp / first team eq.</span></b></div>)}</div>}</>}</div>}</section>
  <section className="bg-white p-6"><div className="text-xs font-bold uppercase tracking-wider text-[#d5222a]">09 · HUMAN DECISION</div><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-black">Plan → decision → outcome</h3>{lifecycle && <span className="border border-black/10 px-3 py-1 text-xs font-bold uppercase">{lifecycle.status}</span>}</div>{manualSelected && !lifecycle && <div className="mt-4 border-l-2 border-[#d5222a] pl-3 text-sm">A feasible manager-edited plan is staged for <b>Modify</b>.</div>}{!lifecycle ? <button disabled={Boolean(busy)} onClick={persist} className="mt-5 flex items-center gap-2 bg-[#191919] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><Save className="h-4 w-4"/>{busy === "persist" ? "Creating snapshot…" : "Create immutable decision snapshot"}</button> : <><div className="mt-4 text-xs text-black/45">Decision ID · {lifecycle.decisionId}</div>{lifecycle.status === "proposed" && <><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for modification or rejection" className="mt-4 min-h-20 w-full border border-black/15 p-3 text-sm"/><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => feedback("accepted")} disabled={Boolean(busy)} className="flex items-center gap-2 bg-[#191919] px-4 py-3 text-sm font-bold text-white"><Check className="h-4 w-4"/>Accept DIP plan</button><button onClick={() => feedback("modified")} disabled={Boolean(busy)} className="border border-black/20 px-4 py-3 text-sm font-bold">{manualSelected ? "Approve manual modification" : "Use selected alternative"}</button><button onClick={() => feedback("rejected")} disabled={Boolean(busy)} className="flex items-center gap-2 border border-red-300 px-4 py-3 text-sm font-bold text-red-700"><X className="h-4 w-4"/>Reject</button></div></>}{["accepted", "modified", "rejected"].includes(lifecycle.status) && <><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Actual outcome notes" className="mt-4 min-h-20 w-full border border-black/15 p-3 text-sm"/><button onClick={outcome} disabled={Boolean(busy)} className="mt-3 flex items-center gap-2 bg-[#d5222a] px-4 py-3 text-sm font-bold text-white"><Flag className="h-4 w-4"/>{busy === "outcome" ? "Recording…" : "Record actual outcome"}</button></>}{lifecycle.status === "completed" && <div className="mt-5 border-l-2 border-green-700 pl-3 text-sm"><b>Decision completed.</b><div className="text-black/50">Recommendation, manager action and actual outcome are linked in the lifecycle.</div></div>}</>}{error && <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700"><CircleAlert className="mr-2 inline h-4 w-4"/>{error}</div>}</section></div>;
}
