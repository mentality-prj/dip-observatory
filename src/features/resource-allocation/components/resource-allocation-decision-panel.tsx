'use client'

import { useState } from 'react'
import { Clipboard, Download } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import {
  resourceAllocationDecisionPanelI18n,
  resourceAllocationExtraI18n,
} from '../i18n'
import type { EvaluatedManualAllocation } from '../contracts'
import { trackResourceAllocation } from '../presentation'

type Props = {
  input: Record<string, unknown>
  selected: Record<string, unknown>
  manualSelected?: EvaluatedManualAllocation | null
  priorityCoverage: number
  served: number
  unmet: number
  teamsMoved: number
  totalTeams: number
  moveEvents: number
  planningDays: number
  planCsv?: string
  planShortText?: string
  exportFileName?: string
  selectionKind?: 'recommended' | 'alternative'
  locale?: Locale
}



export function ResourceAllocationDecisionPanel({
  manualSelected,
  priorityCoverage,
  served,
  unmet,
  teamsMoved,
  totalTeams,
  moveEvents,
  planningDays,
  planCsv,
  planShortText,
  exportFileName,
  locale = 'uk',
}: Props) {
  const t = resourceAllocationDecisionPanelI18n[locale]
  const extra = resourceAllocationExtraI18n[locale]
  const [copied, setCopied] = useState(false)

  function downloadPlan() {
    if (!planCsv || typeof document === 'undefined') return
    const blob = new Blob([planCsv], { type: 'text/csv;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = exportFileName ?? 'qdip-resource-allocation.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(href)
    trackResourceAllocation('ra_plan_exported', locale)
  }

  async function copyPlan() {
    if (!planShortText || !navigator.clipboard) return
    await navigator.clipboard.writeText(planShortText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
    trackResourceAllocation('ra_plan_exported', locale)
  }

  return (
    <div className="grid min-w-0 max-w-full gap-5">
      <section className="order-1 min-w-0 max-w-full overflow-hidden rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs font-bold uppercase tracking-wider text-rose-300">06 · {t.decision}</div>
        <h3 className="mt-2 text-xl font-medium">{manualSelected ? t.staged : t.decisionTitle}</h3>
        <p className="mt-4 max-w-2xl text-sm text-slate-400">{t.decisionHelp}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5" data-testid="decision-summary">
          <div className="border border-white/10 p-3"><div className="text-xs text-slate-500">{t.decisionCoverage}</div><b className="mt-1 block text-xl">{Math.round(priorityCoverage * 100)}%</b></div>
          <div className="border border-white/10 p-3"><div className="text-xs text-slate-500">{t.decisionServed}</div><b className="mt-1 block text-xl">{served.toFixed(0)}</b></div>
          <div className="border border-white/10 p-3"><div className="text-xs text-slate-500">{t.decisionUnmet}</div><b className="mt-1 block text-xl">{unmet.toFixed(0)}</b></div>
          <div className="border border-white/10 p-3"><div className="text-xs text-slate-500">{t.decisionMoved}</div><b className="mt-1 block text-xl">{teamsMoved} / {totalTeams}</b></div>
          <div className="border border-white/10 p-3">
            <div className="text-xs text-slate-500">{t.decisionMoveEvents}</div><b className="mt-1 block text-xl">{moveEvents}</b>
            <div className="mt-1 text-[10px] text-slate-600">{planningDays} {extra.daysUnit}</div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {planCsv && <button type="button" onClick={downloadPlan} className="inline-flex items-center gap-2 bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950"><Download className="h-4 w-4" />{t.exportCsv}</button>}
          {planShortText && <button type="button" onClick={() => void copyPlan()} className="inline-flex items-center gap-2 border border-white/15 px-4 py-3 text-sm font-bold"><Clipboard className="h-4 w-4" />{copied ? t.copied : t.copyPlan}</button>}
        </div>
      </section>
    </div>
  )
}
