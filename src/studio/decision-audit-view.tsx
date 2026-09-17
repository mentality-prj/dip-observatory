"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductLockup } from "@/components/platform/product-lockup";
import { observatoryHref, studioHref } from "@/lib/platform-urls";
import { studioRequest, type Audit } from "./contracts";
import { StudioUseCasePanel } from "./use-case-panel";

export function DecisionAuditView({ initialId }: { initialId?: string }) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [selected, setSelected] = useState<Audit | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let disposed = false;
    Promise.all([studioRequest<Audit[]>("dimension-decisions"), initialId ? studioRequest<Audit>(`dimension-decisions/${encodeURIComponent(initialId)}`) : Promise.resolve(null)])
      .then(([items, detail]) => { if (!disposed) { setAudits(items); setSelected(detail ?? items[0] ?? null); } })
      .catch((reason) => { if (!disposed) setError(String(reason)); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [initialId]);
  return <div className="observatory-shell observatory-audit min-h-screen text-white" data-prototype-theme="cyan">
    <header className="product-header observatory-header"><div className="product-header-inner observatory-header-inner"><ProductLockup href={observatoryHref()} product="Observatory" /><div className="ml-auto"><Link className="product-switch-link observatory-studio-link" href={studioHref()}>Studio</Link></div></div></header>
    <div className="observatory-audit-layout"><aside className="observatory-audit-sidebar"><h2>Decision audit</h2><p>Inspect decisions, evidence, and exact evaluation versions.</p><nav><Link href={observatoryHref()}>Scenario Observatory</Link><Link href={observatoryHref("decisions")}>Decision audit</Link><Link href={studioHref()}>Decision Studio ↗</Link></nav></aside>
    <main id="main-content" tabIndex={-1} className="observatory-audit-main studio-main"><h1>Decision audit</h1><p>Historical decisions and alternative comparisons.</p>
      {loading && <p role="status">Loading decisions…</p>}{error && <div className="studio-error" role="alert">{error}</div>}
      {!loading && !audits.length && !selected && !error && <div className="studio-card">No decisions have been evaluated yet.</div>}
      {audits.length > 0 && <label className="studio-field">Execution<select value={selected?.decision_id ?? ""} onChange={(event) => { setSelected(audits.find((audit) => audit.decision_id === event.target.value) ?? null); setMessage(""); }}>{selected && !audits.some((audit) => audit.decision_id === selected.decision_id) && <option value={selected.decision_id}>{selected.profile.name} · {selected.timestamp}</option>}{audits.map((audit) => <option key={audit.decision_id} value={audit.decision_id}>{audit.profile.name} · {audit.timestamp} · {audit.status}</option>)}</select></label>}
      {selected && <><section className="studio-card"><header><h2>{selected.profile.name}</h2><span className="studio-tag">{selected.status}</span></header><p>Selected alternative: <strong>{selected.selected_alternative ?? "None"}</strong> · Profile version {selected.profile_version}</p>{selected.explanation.map((line) => <p key={line}>{line}</p>)}</section>
        <StudioUseCasePanel audit={selected} />
        {selected.dimension_results.map((alternative) => <section key={alternative.alternative_id} className="studio-card"><h2>{alternative.alternative_id}</h2>{alternative.dimensions.map((dimension) => <details key={dimension.dimension_id}><summary>{dimension.dimension_id} · {dimension.status}{dimension.blocking && " · blocking"}{dimension.score !== null && ` · ${dimension.score.toFixed(3)}`}</summary><p>{dimension.explanation.join(" ")}</p>{dimension.required_actions.length > 0 && <p>Required actions: {dimension.required_actions.join(", ")}</p>}<pre>{JSON.stringify({ value: dimension.value, evidence: dimension.evidence, findings: dimension.findings }, null, 2)}</pre></details>)}</section>)}
        <section className="studio-card"><h2>Reproducibility</h2><pre>{JSON.stringify({ profile: selected.profile_version, plugins: selected.plugin_versions, capabilities: selected.capability_versions, dimensions: selected.dimension_versions, evaluators: selected.evaluator_versions, bindings: selected.binding_versions }, null, 2)}</pre><button type="button" onClick={async () => { try { const response = await studioRequest<{ matches: boolean }>(`dimension-decisions/${encodeURIComponent(selected.decision_id)}/replay`, { method: "POST" }); setMessage(response.matches ? "Replay matches the recorded evaluation." : "Replay differs from the recorded evaluation."); } catch (reason) { setError(String(reason)); } }}>Verify replay</button>{message && <p role="status">{message}</p>}<details><summary>Complete audit snapshot</summary><pre>{JSON.stringify(selected, null, 2)}</pre></details></section>
      </>}
    </main></div>
  </div>;
}
