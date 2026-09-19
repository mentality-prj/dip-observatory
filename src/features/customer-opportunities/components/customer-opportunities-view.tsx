"use client";

import { ArrowUpRight, FileUp, Search } from "lucide-react";
import type { CustomerOpportunitiesViewModel } from "../hooks/use-customer-opportunities-view-model";

const DECISIONS = ["CONTACT_NOW", "RESEARCH_FIRST", "DEFER", "SKIP"] as const;

function formatEuro(value: number | null) {
  if (value == null) return "Unknown";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CustomerOpportunitiesView({ vm }: { vm: CustomerOpportunitiesViewModel }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-300">QDIP · COMMERCIAL DECISION LAB</div>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] md:text-6xl">Customer Opportunities</h1>
        <p className="mt-4 max-w-3xl text-slate-400">Prioritize outreach using problem evidence, feasibility, strategic fit and explicit uncertainty. Opportunity is a decision signal, not a purchase probability.</p>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[.035] p-5 hover:border-cyan-300/40">
            <FileUp className="h-5 w-5 text-cyan-300" />
            <span><b>Import customer CSV</b><span className="block text-sm text-slate-500">Required: customer_id, company_name, country, industry, problem_evidence_strength, strategic_fit</span></span>
            <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void vm.loadFile(file); }} />
          </label>
          <button disabled={!vm.customerCount || vm.loading} onClick={() => void vm.evaluate()} className="rounded-2xl bg-cyan-300 px-7 py-4 font-semibold text-slate-950 disabled:opacity-40">
            {vm.loading ? "Evaluating…" : `Evaluate ${vm.customerCount || ""} customers`}
          </button>
        </section>

        {vm.error && <div role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{vm.error}</div>}

        {vm.data && <>
          <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {DECISIONS.map((decision) => <div key={decision} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="text-3xl font-semibold">{vm.data?.counts[decision] ?? 0}</div><div className="mt-1 text-xs tracking-wider text-slate-500">{decision.replaceAll("_", " ")}</div></div>)}
          </section>
          <div className="mt-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4">
            <Search className="h-4 w-4 text-slate-500" />
            <input aria-label="Search companies" value={vm.query} onChange={(event) => vm.setQuery(event.target.value)} placeholder="Search companies" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600" />
          </div>
          <section className="mt-4 space-y-3">
            {vm.visibleResults.map((result, index) => <details key={result.customer_id} className="group rounded-2xl border border-white/10 bg-white/[.035] p-5">
              <summary className="grid cursor-pointer list-none gap-3 md:grid-cols-[3rem_1fr_10rem_8rem_8rem_auto] md:items-center">
                <span className="text-slate-600">#{index + 1}</span><span className="font-semibold">{result.company_name}</span><span className="text-xs font-semibold text-cyan-300">{result.decision.replaceAll("_", " ")}</span><span><b>{Math.round(result.opportunity_score * 100)}%</b><small className="block text-slate-600">opportunity</small></span><span><b>{Math.round(result.uncertainty * 100)}%</b><small className="block text-slate-600">uncertainty</small></span><ArrowUpRight className="h-4 w-4 text-slate-600" />
              </summary>
              <div className="mt-5 grid gap-5 border-t border-white/10 pt-5 md:grid-cols-3">
                <div><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Why</h3>{result.explanation.map((item) => <p key={item} className="mt-2 text-sm text-slate-300">{item}</p>)}</div>
                <div><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Missing information</h3>{result.missing_information.length ? result.missing_information.map((item) => <p key={item} className="mt-2 text-sm text-slate-400">{item}</p>) : <p className="mt-2 text-sm text-slate-500">No material gaps.</p>}</div>
                <div><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expected effect</h3><p className="mt-2 text-2xl font-semibold">{formatEuro(result.expected_effect_eur)}</p></div>
              </div>
            </details>)}
          </section>
        </>}
      </div>
    </main>
  );
}
