"use client";

import { useState } from "react";
import { CircleAlert, FileUp, LoaderCircle } from "lucide-react";
import { importValidationSchema, pipelineRunSchema, type ProspectSeed } from "../import-contracts";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const values: string[] = []; let value = ""; let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"' && quoted && line[i + 1] === '"') { value += '"'; i += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { values.push(value.trim()); value = ""; }
      else value += char;
    }
    values.push(value.trim()); return values;
  };
  const headers = split(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, split(line)[index] ?? ""])));
}

export function GtmProductionImport() {
  const [rows, setRows] = useState<ProspectSeed[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  async function selectFile(file: File) {
    setMessage(null); setIssues([]); setRows([]);
    try {
      const rawRows = parseCsv(await file.text());
      if (!rawRows.length) throw new Error("CSV must contain a header and at least one prospect.");
      if (rawRows.length > 5000) throw new Error("CSV exceeds the 5,000-row backend limit.");
      const response = await fetch("/api/gtm-lab/import/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: rawRows }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Import validation failed.");
      const validation = importValidationSchema.parse(json);
      setRows(validation.rows);
      setIssues(validation.issues.map((issue) => `Row ${issue.row}${issue.field ? ` · ${issue.field}` : ""}: ${issue.message}`));
      setMessage(validation.valid ? `${validation.valid_rows} prospects validated. Ready to run QDIP.` : `${validation.invalid_rows} rows require correction.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "CSV import failed."); }
  }

  async function runPipeline() {
    if (!rows.length || issues.length) return;
    setRunning(true); setMessage(null);
    try {
      const response = await fetch("/api/gtm-lab/pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "QDIP pipeline failed.");
      const result = pipelineRunSchema.parse(json);
      setMessage(`Run ${result.run_id}: ${result.summary.evaluated_prospects}/${result.summary.total_prospects} evaluated · ${result.summary.decisions.PURSUE} PURSUE · ${result.summary.decisions.RESEARCH} RESEARCH · ${result.summary.decisions.SKIP} SKIP.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "QDIP pipeline failed."); }
    finally { setRunning(false); }
  }

  return <section className="mt-6 border border-white/10 bg-white/[.03] p-5" aria-labelledby="gtm-production-import">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="text-[10px] font-black tracking-[.18em] text-sky-300">PRODUCTION DATA</span><h2 id="gtm-production-import" className="mt-1 text-lg font-black">Evaluate your prospect portfolio</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">Upload CSV data. The browser only parses the file; QDIP validates the canonical prospect contract and remains the decision authority.</p></div><label className="cursor-pointer border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/[.05]"><FileUp className="mr-2 inline h-4 w-4"/>Upload CSV<input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void selectFile(file); event.currentTarget.value = ""; }}/></label></div>
    {message && <p className="mt-4 text-sm text-slate-300" aria-live="polite">{message}</p>}
    {issues.length > 0 && <div className="mt-4 border border-amber-400/20 p-3 text-sm text-amber-200"><CircleAlert className="mr-2 inline h-4 w-4"/><b>Validation errors</b><ul className="mt-2 space-y-1">{issues.slice(0, 20).map((issue) => <li key={issue}>{issue}</li>)}</ul>{issues.length > 20 && <p className="mt-2">+ {issues.length - 20} more</p>}</div>}
    {rows.length > 0 && !issues.length && <button type="button" onClick={() => void runPipeline()} disabled={running} className="mt-4 bg-sky-400 px-5 py-2.5 font-bold text-slate-950 disabled:opacity-50">{running ? <><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin"/>Running QDIP…</> : `Run QDIP for ${rows.length} prospects`}</button>}
  </section>;
}
