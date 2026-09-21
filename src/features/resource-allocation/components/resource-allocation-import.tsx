'use client'

import { useRef, useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import type { ResourceAllocationInput } from '../contracts'
import {
  importResourceAllocationFile,
  RESOURCE_ALLOCATION_IMPORT_COLUMNS,
} from '../importer'

const copy = {
  uk: {
    title: 'Дані клієнта',
    body: 'Завантажте агреговані операційні дані. Не додавайте ПІБ, телефони, адреси чи інші персональні дані бенефіціарів.',
    choose: 'Імпортувати CSV / XML / XLSX',
    template: 'Поля шаблону',
    loaded: 'Завантажено',
  },
  en: {
    title: 'Client data',
    body: 'Upload aggregated operational data only. Do not include beneficiary names, phones, addresses or other personal data.',
    choose: 'Import CSV / XML / XLSX',
    template: 'Template columns',
    loaded: 'Loaded',
  },
  pl: {
    title: 'Dane klienta',
    body: 'Prześlij wyłącznie zagregowane dane operacyjne. Nie dodawaj danych osobowych beneficjentów.',
    choose: 'Importuj CSV / XML / XLSX',
    template: 'Kolumny szablonu',
    loaded: 'Wczytano',
  },
} as const

export function ResourceAllocationImport({
  locale,
  onImported,
}: {
  locale: Locale
  onImported: (input: ResourceAllocationInput, fileName: string) => void
}) {
  const t = copy[locale]
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const imported = await importResourceAllocationFile(file)
      setFileName(file.name)
      onImported(imported, file.name)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Import failed')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
        <div className="min-w-0">
          <b className="block">{t.title}</b>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.body}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".csv,.xml,.xlsx,text/csv,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="mt-4 flex w-full items-center justify-center gap-2 border border-rose-300/30 bg-rose-300/10 px-3 py-3 text-sm font-bold text-rose-200 disabled:opacity-50"
      >
        <Upload className="h-4 w-4" />
        {loading ? 'Importing…' : t.choose}
      </button>

      {fileName && (
        <div className="mt-3 text-xs text-emerald-300">
          {t.loaded}: {fileName}
        </div>
      )}
      {error && (
        <div role="alert" className="mt-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      <details className="mt-4 text-xs text-slate-500">
        <summary className="cursor-pointer text-slate-400">{t.template}</summary>
        <code className="mt-2 block whitespace-normal break-words">{RESOURCE_ALLOCATION_IMPORT_COLUMNS}</code>
        <p className="mt-2">
          Use record_type values: community, demand, team, travel, settings. Separate multiple skills/days with |.
        </p>
      </details>
    </section>
  )
}
