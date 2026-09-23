'use client'

import { useState } from 'react'
import { CircleAlert, FileUp, LoaderCircle } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import { gtmLabI18n } from '../i18n'
import {
  importValidationSchema,
  pipelineRunSchema,
  type CommercialContext,
  type PipelineRun,
  type ProspectSeed,
} from '../import-contracts'

const PUBLIC_MAX_ROWS = 10

type Props = {
  locale: Locale
  commercialContext: CommercialContext | null
  onEvaluated: (run: PipelineRun) => void
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []
  const split = (line: string) => {
    const values: string[] = []
    let value = ''
    let quoted = false
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index]
      if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1 }
      else if (char === '"') quoted = !quoted
      else if (char === ',' && !quoted) { values.push(value.trim()); value = '' }
      else value += char
    }
    values.push(value.trim())
    return values
  }
  const headers = split(lines[0])
  return lines.slice(1).map((line) => {
    const values = split(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
}

export function GtmProductionImport({ locale, commercialContext, onEvaluated }: Props) {
  const t = gtmLabI18n[locale].import
  const contextCopy = gtmLabI18n[locale].onboarding
  const [rows, setRows] = useState<ProspectSeed[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [issues, setIssues] = useState<string[]>([])
  const [running, setRunning] = useState(false)

  async function selectFile(file: File) {
    setMessage(null); setIssues([]); setRows([])
    try {
      const rawRows = parseCsv(await file.text())
      if (!rawRows.length) throw new Error(t.emptyCsv)
      if (rawRows.length > PUBLIC_MAX_ROWS) throw new Error(t.tooManyRows)
      const response = await fetch('/api/gtm-lab/import/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: rawRows }) })
      const json = await response.json()
      if (!response.ok) throw new Error(t.validationFailed)
      const validation = importValidationSchema.parse(json)
      setRows(validation.rows)
      setIssues(validation.issues.map((issue) => t.issue(issue.row, issue.field, issue.message)))
      setMessage(validation.valid ? t.validated(validation.valid_rows) : t.invalidRows(validation.invalid_rows))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.importFailed)
    }
  }

  async function runEvaluation() {
    if (!rows.length || issues.length) return
    if (!commercialContext) { setMessage(contextCopy.contextRequired); return }
    setRunning(true); setMessage(null)
    try {
      const response = await fetch('/api/gtm-lab/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows, commercialContext }) })
      const json = await response.json()
      if (!response.ok) throw new Error(t.evaluationFailed)
      const result = pipelineRunSchema.parse(json)
      onEvaluated(result)
      setMessage(t.completed(result.summary.evaluated_prospects, result.summary.total_prospects, result.summary.failed_prospects))
    } catch { setMessage(t.evaluationFailed) } finally { setRunning(false) }
  }

  return (
    <section className="mt-6 border border-white/10 bg-white/[.03] p-5" aria-labelledby="gtm-production-import">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><span className="text-[10px] font-semibold tracking-[.18em] text-sky-300">{t.tag}</span><h2 id="gtm-production-import" className="mt-1 text-lg font-medium">{t.title}</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">{t.description}</p></div>
        <label className="cursor-pointer border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/[.05]"><FileUp className="mr-2 inline h-4 w-4" />{t.upload}<input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void selectFile(file); event.currentTarget.value = '' }} /></label>
      </div>
      {message && <p className="mt-4 text-sm text-slate-300" aria-live="polite">{message}</p>}
      {issues.length > 0 && <div className="mt-4 border border-amber-400/20 p-3 text-sm text-amber-200"><CircleAlert className="mr-2 inline h-4 w-4" /><b>{t.validationErrors}</b><ul className="mt-2 space-y-1">{issues.slice(0, 20).map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
      {rows.length > 0 && !issues.length && <button type="button" onClick={() => void runEvaluation()} disabled={running || !commercialContext} className="mt-4 bg-sky-400 px-5 py-2.5 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{running ? <><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />{t.evaluating}</> : t.runFor(rows.length)}</button>}
      {rows.length > 0 && !commercialContext && <p className="mt-2 text-xs text-amber-200">{contextCopy.contextRequired}</p>}
    </section>
  )
}
