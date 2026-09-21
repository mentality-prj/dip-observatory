'use client'

import { useRef, useState } from 'react'
import {
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
} from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import type { ResourceAllocationInput } from '../contracts'
import { resourceAllocationStats } from '../demo-data'
import {
  importResourceAllocationFile,
  RESOURCE_ALLOCATION_IMPORT_COLUMNS,
} from '../importer'

type ImportStage = 'idle' | 'reading' | 'validating' | 'ready' | 'error'

const copy = {
  uk: {
    title: 'Дані клієнта',
    body: 'Завантажте агреговані операційні дані. Не додавайте ПІБ, телефони, адреси чи інші персональні дані бенефіціарів.',
    choose: 'Вибрати CSV / XML / XLSX',
    drop: 'Перетягніть файл сюди',
    dropActive: 'Відпустіть файл для імпорту',
    or: 'або',
    template: 'Поля шаблону',
    reading: 'Читаю файл…',
    validating: 'Перевіряю структуру та зв’язки…',
    ready: 'Дані активовані',
    communities: 'громад/локацій',
    teams: 'команд',
    demand: 'од. потреб',
    replace: 'Замінити файл',
  },
  en: {
    title: 'Client data',
    body: 'Upload aggregated operational data only. Do not include beneficiary names, phones, addresses or other personal data.',
    choose: 'Choose CSV / XML / XLSX',
    drop: 'Drag and drop a file here',
    dropActive: 'Drop the file to import',
    or: 'or',
    template: 'Template columns',
    reading: 'Reading file…',
    validating: 'Validating structure and references…',
    ready: 'Dataset activated',
    communities: 'communities / locations',
    teams: 'teams',
    demand: 'demand units',
    replace: 'Replace file',
  },
  pl: {
    title: 'Dane klienta',
    body: 'Prześlij wyłącznie zagregowane dane operacyjne. Nie dodawaj danych osobowych beneficjentów.',
    choose: 'Wybierz CSV / XML / XLSX',
    drop: 'Przeciągnij i upuść plik tutaj',
    dropActive: 'Upuść plik, aby go zaimportować',
    or: 'lub',
    template: 'Kolumny szablonu',
    reading: 'Odczytuję plik…',
    validating: 'Sprawdzam strukturę i odwołania…',
    ready: 'Zestaw danych aktywowany',
    communities: 'społeczności / lokalizacji',
    teams: 'zespołów',
    demand: 'jedn. potrzeb',
    replace: 'Zastąp plik',
  },
} as const

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ResourceAllocationImport({
  locale,
  onImported,
}: {
  locale: Locale
  onImported: (input: ResourceAllocationInput, fileName: string) => void
}) {
  const t = copy[locale]
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [stage, setStage] = useState<ImportStage>('idle')
  const [dragging, setDragging] = useState(false)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null)
  const [stats, setStats] = useState<ReturnType<typeof resourceAllocationStats> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = stage === 'reading' || stage === 'validating'

  async function handleFile(file: File | undefined) {
    if (!file || busy) return
    setFileMeta({ name: file.name, size: file.size })
    setStats(null)
    setError(null)
    setStage('reading')

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      setStage('validating')
      const imported = await importResourceAllocationFile(file)
      const nextStats = resourceAllocationStats(imported)
      onImported(imported, file.name)
      setStats(nextStats)
      setStage('ready')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Import failed')
      setStage('error')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function dragEnter(event: React.DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current += 1
    if (!busy) setDragging(true)
  }

  function dragLeave(event: React.DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }

  function dragOver(event: React.DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) event.dataTransfer.dropEffect = busy ? 'none' : 'copy'
  }

  function drop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = 0
    setDragging(false)
    if (busy) return
    void handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <section className="min-w-0 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-5">
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

      <div
        data-testid="resource-import-dropzone"
        data-dragging={dragging ? 'true' : 'false'}
        onDragEnter={dragEnter}
        onDragLeave={dragLeave}
        onDragOver={dragOver}
        onDrop={drop}
        className={`mt-4 rounded-xl border border-dashed p-5 text-center transition-colors ${
          dragging
            ? 'border-rose-300 bg-rose-300/15'
            : stage === 'ready'
              ? 'border-emerald-300/35 bg-emerald-300/[0.06]'
              : 'border-white/15 bg-slate-950/35'
        }`}
      >
        {dragging && !busy ? (
          <div aria-live="polite" data-testid="resource-import-drag-prompt">
            <Upload className="mx-auto h-7 w-7 text-rose-200" />
            <div className="mt-3 text-sm font-bold">{t.dropActive}</div>
          </div>
        ) : busy ? (
          <div aria-live="polite">
            <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-rose-300" />
            <div className="mt-3 text-sm font-bold">
              {stage === 'reading' ? t.reading : t.validating}
            </div>
            {fileMeta && (
              <div className="mt-1 break-words text-xs text-slate-500">
                {fileMeta.name} · {formatBytes(fileMeta.size)}
              </div>
            )}
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-rose-400" />
            </div>
          </div>
        ) : stage === 'ready' && fileMeta && stats ? (
          <div aria-live="polite">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-300" />
            <div className="mt-3 font-bold text-emerald-200">{t.ready}</div>
            <div data-testid="resource-import-file" className="mt-1 break-words text-xs text-slate-400">
              {fileMeta.name} · {formatBytes(fileMeta.size)}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-left">
              <div className="rounded-lg bg-white/[0.04] p-2">
                <b className="block text-lg">{stats.communities}</b>
                <span className="text-[10px] leading-tight text-slate-500">{t.communities}</span>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-2">
                <b className="block text-lg">{stats.teams}</b>
                <span className="text-[10px] leading-tight text-slate-500">{t.teams}</span>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-2">
                <b className="block text-lg">{stats.openingNeeds}</b>
                <span className="text-[10px] leading-tight text-slate-500">{t.demand}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs font-bold"
            >
              <FileCheck2 className="h-4 w-4" />
              {t.replace}
            </button>
          </div>
        ) : (
          <>
            <Upload className={`mx-auto h-7 w-7 ${dragging ? 'text-rose-200' : 'text-rose-300'}`} />
            <div className="mt-3 text-sm font-bold">{dragging ? t.dropActive : t.drop}</div>
            <div className="my-2 text-xs text-slate-600">{t.or}</div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 border border-rose-300/30 bg-rose-300/10 px-3 py-2.5 text-sm font-bold text-rose-200"
            >
              <Upload className="h-4 w-4" />
              {t.choose}
            </button>
            <div className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">
              CSV · XML · XLSX
            </div>
          </>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 break-words text-xs text-rose-300">
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
