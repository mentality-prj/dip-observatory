'use client'

import { useState } from 'react'
import { Download, FileSearch, FileUp } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'

export type DataDictionaryRow = readonly [path: string, meaning: string, type: string, requirement: string]

const copy = {
  en: {
    title: 'Analyst data workspace',
    body: 'Use semantic parsing for unfamiliar business files or the exact versioned template when reproducibility matters.',
    smart: 'Smart import',
    smartBody:
      'CSV / XLSX / JSON is analyzed by the existing Decision Intake parser. It proposes semantics; it does not silently run the optimizer.',
    exact: 'Exact template',
    exactBody:
      'Versioned JSON bypasses semantic inference. Validation must pass before it can replace the active scenario input.',
    chooseSmart: 'Analyze CSV / XLSX / JSON',
    chooseExact: 'Import exact JSON',
    template: 'Download exact template',
    export: 'Export analysis package',
    dictionary: 'Data dictionary',
    smartReady: 'Dataset analyzed',
    rows: 'rows',
    columns: 'columns',
    semanticWarning: 'Review the inferred semantics in Decision Intake before treating them as decision inputs.',
    exactReady: 'Exact input validated and loaded.',
    error: 'Import failed.',
  },
  uk: {
    title: 'Робоча зона даних аналітика',
    body: 'Для незнайомих бізнес-файлів використовуйте семантичний парсер, а для максимальної точності й відтворюваності — точний версійований шаблон.',
    smart: 'Розумний імпорт',
    smartBody:
      'CSV / XLSX / JSON аналізує наявний parser Decision Intake. Він пропонує семантику, але не запускає оптимізатор без підтвердження.',
    exact: 'Точний шаблон',
    exactBody:
      'Версійований JSON обходить semantic inference. Поки validation не пройдено, він не замінює активний input сценарію.',
    chooseSmart: 'Проаналізувати CSV / XLSX / JSON',
    chooseExact: 'Імпортувати точний JSON',
    template: 'Завантажити точний шаблон',
    export: 'Експортувати пакет аналізу',
    dictionary: 'Словник даних',
    smartReady: 'Дані проаналізовано',
    rows: 'рядків',
    columns: 'колонок',
    semanticWarning:
      'Перевірте запропоновану семантику в Decision Intake, перш ніж використовувати її як decision input.',
    exactReady: 'Точний input пройшов validation і завантажений.',
    error: 'Імпорт не виконано.',
  },
  pl: {
    title: 'Obszar danych analityka',
    body: 'Dla nieznanych plików biznesowych użyj analizy semantycznej, a dla pełnej powtarzalności — dokładnego, wersjonowanego szablonu.',
    smart: 'Inteligentny import',
    smartBody:
      'CSV / XLSX / JSON analizuje istniejący parser Decision Intake. Proponuje semantykę, ale nie uruchamia optymalizatora bez potwierdzenia.',
    exact: 'Dokładny szablon',
    exactBody:
      'Wersjonowany JSON omija wnioskowanie semantyczne. Dopiero poprawna walidacja może zastąpić aktywne dane scenariusza.',
    chooseSmart: 'Analizuj CSV / XLSX / JSON',
    chooseExact: 'Importuj dokładny JSON',
    template: 'Pobierz dokładny szablon',
    export: 'Eksportuj pakiet analizy',
    dictionary: 'Słownik danych',
    smartReady: 'Dane przeanalizowane',
    rows: 'wierszy',
    columns: 'kolumn',
    semanticWarning: 'Zweryfikuj proponowaną semantykę w Decision Intake, zanim użyjesz jej jako danych decyzyjnych.',
    exactReady: 'Dokładne dane przeszły walidację i zostały wczytane.',
    error: 'Import nie powiódł się.',
  },
} as const

type SmartSummary = { rows: number; columns: number; warnings: string[] }

export function AnalystDataPanel({
  locale,
  dictionary,
  onExactFile,
  onDownloadTemplate,
  onExport,
  exactStatus,
  exactIssues = [],
}: {
  locale: Locale
  dictionary: readonly DataDictionaryRow[]
  onExactFile: (file: File) => Promise<void>
  onDownloadTemplate: () => void
  onExport?: () => void
  exactStatus?: string | null
  exactIssues?: readonly { path: string; message: string }[]
}) {
  const t = copy[locale]
  const [smartBusy, setSmartBusy] = useState(false)
  const [smartSummary, setSmartSummary] = useState<SmartSummary | null>(null)
  const [smartError, setSmartError] = useState<string | null>(null)
  const [exactBusy, setExactBusy] = useState(false)

  async function analyzeSmart(file: File | undefined) {
    if (!file || smartBusy) return
    setSmartBusy(true)
    setSmartError(null)
    setSmartSummary(null)
    try {
      const form = new FormData()
      form.set('file', file)
      const response = await fetch('/api/decision-intake/analyze', { method: 'POST', body: form })
      const payload = (await response.json()) as {
        profile?: { row_count?: number; column_count?: number; warnings?: string[] }
        detail?: string
      }
      if (!response.ok || !payload.profile) throw new Error(payload.detail || t.error)
      setSmartSummary({
        rows: payload.profile.row_count ?? 0,
        columns: payload.profile.column_count ?? 0,
        warnings: payload.profile.warnings ?? [],
      })
    } catch (reason) {
      setSmartError(reason instanceof Error ? reason.message : t.error)
    } finally {
      setSmartBusy(false)
    }
  }

  async function loadExact(file: File | undefined) {
    if (!file || exactBusy) return
    setExactBusy(true)
    try {
      await onExactFile(file)
    } finally {
      setExactBusy(false)
    }
  }

  return (
    <section data-testid="analyst-data-workspace" className="mt-5 border border-white/10 bg-white/[.025] p-5 md:p-6">
      <h2 className="text-lg font-medium text-slate-100">{t.title}</h2>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{t.body}</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="border border-white/10 bg-slate-950/30 p-4">
          <div className="flex items-start gap-3">
            <FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden />
            <div>
              <h3 className="font-medium text-slate-100">{t.smart}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t.smartBody}</p>
            </div>
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 border border-sky-400/30 px-3 py-2 text-sm text-sky-200">
            <FileUp className="h-4 w-4" aria-hidden />
            {smartBusy ? '…' : t.chooseSmart}
            <input
              className="sr-only"
              type="file"
              accept=".csv,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => void analyzeSmart(event.target.files?.[0])}
            />
          </label>
          {smartSummary ? (
            <div className="mt-3 text-xs leading-5 text-slate-400" aria-live="polite">
              <strong className="text-sky-200">{t.smartReady}</strong> · {smartSummary.rows} {t.rows} ·{' '}
              {smartSummary.columns} {t.columns}
              <p className="mt-2 text-amber-200">{t.semanticWarning}</p>
              {smartSummary.warnings.map((warning) => (
                <p key={warning} className="mt-1 text-amber-300/80">
                  {warning}
                </p>
              ))}
            </div>
          ) : null}
          {smartError ? <p className="mt-3 text-xs text-rose-300">{smartError}</p> : null}
        </div>

        <div className="border border-white/10 bg-slate-950/30 p-4">
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
            <div>
              <h3 className="font-medium text-slate-100">{t.exact}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t.exactBody}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="border border-white/15 px-3 py-2 text-sm text-slate-200"
            >
              {t.template}
            </button>
            <label className="cursor-pointer border border-emerald-400/30 px-3 py-2 text-sm text-emerald-200">
              {exactBusy ? '…' : t.chooseExact}
              <input
                className="sr-only"
                type="file"
                accept=".json,application/json"
                onChange={(event) => void loadExact(event.target.files?.[0])}
              />
            </label>
            {onExport ? (
              <button
                type="button"
                onClick={onExport}
                className="border border-white/15 px-3 py-2 text-sm text-slate-200"
              >
                {t.export}
              </button>
            ) : null}
          </div>
          {exactStatus ? <p className="mt-3 text-xs text-emerald-200">{exactStatus || t.exactReady}</p> : null}
          {exactIssues.length ? (
            <ul className="mt-3 space-y-1 text-xs text-rose-300" role="alert">
              {exactIssues.map((issue) => (
                <li key={`${issue.path}:${issue.message}`}>
                  <code>{issue.path}</code> — {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <details className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-400">
        <summary className="cursor-pointer font-semibold text-slate-300">{t.dictionary}</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4">Field</th>
                <th className="py-2 pr-4">Meaning</th>
                <th className="py-2 pr-4">Type / unit</th>
                <th className="py-2">Requirement</th>
              </tr>
            </thead>
            <tbody>
              {dictionary.map(([path, meaning, type, requirement]) => (
                <tr key={path} className="border-t border-white/10">
                  <td className="py-2 pr-4 font-mono text-slate-300">{path}</td>
                  <td className="py-2 pr-4">{meaning}</td>
                  <td className="py-2 pr-4">{type}</td>
                  <td className="py-2">{requirement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
