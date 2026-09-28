'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'

import { FileUploader, type FileUploaderState } from '@/components/file-uploader'
import { useTranslations } from '@/i18n/provider'
import type { ResourceAllocationInput } from '../contracts'
import {
  buildResourceAllocationExampleCsv,
  buildResourceAllocationTemplateCsv,
  importResourceAllocationFile,
  RESOURCE_ALLOCATION_IMPORT_COLUMNS,
  summarizeResourceAllocationImport,
  type ResourceAllocationImportSummary,
} from '../importer'

type ImportStage = 'idle' | 'reading' | 'validating' | 'ready' | 'error'

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function ResourceAllocationImport({
  onImported,
}: {
  onImported: (input: ResourceAllocationInput, fileName: string) => void
}) {
  const t = useTranslations('resourceAllocation.importer')
  const recordTypes = t.raw<Record<string, string>>('recordTypes')
  const [stage, setStage] = useState<ImportStage>('idle')
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null)
  const [summary, setSummary] = useState<ResourceAllocationImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = stage === 'reading' || stage === 'validating'
  const uploaderState: FileUploaderState = busy
    ? 'busy'
    : stage === 'ready'
      ? 'ready'
      : fileMeta
        ? stage === 'error'
          ? 'error'
          : 'selected'
        : 'idle'

  async function handleFile(file: File | undefined) {
    if (!file || busy) return
    setFileMeta({ name: file.name, size: file.size })
    setSummary(null)
    setError(null)
    setStage('reading')

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      setStage('validating')
      const imported = await importResourceAllocationFile(file)
      const nextSummary = summarizeResourceAllocationImport(imported)
      onImported(imported, file.name)
      setSummary(nextSummary)
      setStage('ready')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Import failed')
      setStage('error')
    }
  }

  return (
    <section className="min-w-0 rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
        <div className="min-w-0">
          <b className="block">{t('title')}</b>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{t('body')}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-4">
        <b className="block text-sm">{t('starterTitle')}</b>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{t('starterBody')}</p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <button
            type="button"
            data-testid="resource-download-template"
            onClick={() => downloadCsv(buildResourceAllocationTemplateCsv(), 'qdip-resource-allocation-template.csv')}
            className="flex min-w-0 items-start gap-2 overflow-hidden border border-white/15 bg-white/[0.03] px-3 py-3 text-left transition-colors hover:bg-white/[0.06]"
          >
            <Download className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            <span className="min-w-0 flex-1">
              <b className="block whitespace-normal text-xs leading-5 text-slate-200">{t('downloadTemplate')}</b>
              <span className="mt-1 block whitespace-normal text-[10px] leading-4 text-slate-500">
                {t('templateHint')}
              </span>
            </span>
          </button>
          <button
            type="button"
            data-testid="resource-download-example"
            onClick={() => downloadCsv(buildResourceAllocationExampleCsv(), 'qdip-resource-allocation-example.csv')}
            className="flex min-w-0 items-start gap-2 overflow-hidden border border-rose-300/25 bg-rose-300/[0.06] px-3 py-3 text-left transition-colors hover:bg-rose-300/[0.1]"
          >
            <Download className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            <span className="min-w-0 flex-1">
              <b className="block whitespace-normal text-xs leading-5 text-rose-100">{t('downloadExample')}</b>
              <span className="mt-1 block whitespace-normal text-[10px] leading-4 text-slate-500">
                {t('exampleHint')}
              </span>
            </span>
          </button>
        </div>
      </div>

      <FileUploader
        accept=".csv,.xml,.xlsx,text/csv,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        copy={{
          drop: t('drop'),
          dropActive: t('dropActive'),
          or: t('or'),
          choose: t('choose'),
          replace: t('replace'),
          busy: t('reading'),
          ready: t('ready'),
        }}
        file={fileMeta}
        formats="CSV · XML · XLSX"
        state={uploaderState}
        statusLabel={
          busy ? (stage === 'reading' ? t('reading') : t('validating')) : stage === 'ready' ? t('ready') : undefined
        }
        disabled={busy}
        onFile={handleFile}
        tone="rose"
        testId="resource-import-dropzone"
        fileTestId="resource-import-file"
        dragPromptTestId="resource-import-drag-prompt"
        className="mt-4"
      />

      {stage === 'ready' && summary ? (
        <div
          data-testid="resource-import-summary"
          className="mt-4 grid grid-cols-2 gap-2 text-left sm:grid-cols-3"
          aria-live="polite"
        >
          <div className="rounded-lg bg-white/[0.04] p-2">
            <b className="block text-lg">{summary.communities}</b>
            <span className="text-[10px] leading-tight text-slate-500">{t('communities')}</span>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-2">
            <b className="block text-lg">{summary.teams}</b>
            <span className="text-[10px] leading-tight text-slate-500">{t('teams')}</span>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-2">
            <b className="block text-lg">{summary.horizonDemand}</b>
            <span className="text-[10px] leading-tight text-slate-500">{t('demand')}</span>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-2">
            <b className="block text-lg">{summary.days}</b>
            <span className="text-[10px] leading-tight text-slate-500">{t('days')}</span>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-2">
            <b className="block text-sm">{summary.baselineProvided ? t('baselineYes') : t('baselineNo')}</b>
            <span className="text-[10px] leading-tight text-slate-500">{t('baseline')}</span>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-2">
            <b className="block text-lg">{summary.scheduledDemand}</b>
            <span className="text-[10px] leading-tight text-slate-500">{t('scheduled')}</span>
          </div>
          {summary.availabilityRules > 0 ? (
            <div className="col-span-full text-[11px] text-slate-500">
              {summary.availabilityRules} {t('rules')}
            </div>
          ) : null}
        </div>
      ) : null}

      {error && (
        <div role="alert" className="mt-3 break-words text-xs text-rose-300">
          {error}
        </div>
      )}

      <details className="mt-4 text-xs text-slate-500">
        <summary className="cursor-pointer font-semibold text-slate-400">{t('template')}</summary>
        <div className="mt-4 space-y-5 border-t border-white/10 pt-4">
          <p className="leading-relaxed">{t('templateIntro')}</p>
          <div>
            <b className="text-slate-300">{t('recordTypesTitle')}</b>
            <dl className="mt-3 grid gap-2">
              {Object.entries(recordTypes).map(([type, description]) => (
                <div
                  key={type}
                  className="grid gap-1 rounded-lg bg-white/[0.025] p-3 sm:grid-cols-[110px_1fr] sm:gap-3"
                >
                  <dt>
                    <code className="text-rose-200">{type}</code>
                  </dt>
                  <dd className="leading-relaxed">{description}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <b className="text-slate-300">{t('columnsTitle')}</b>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {RESOURCE_ALLOCATION_IMPORT_COLUMNS.split(',').map((column) => (
                <code
                  key={column}
                  className="rounded border border-white/10 bg-slate-950/40 px-2 py-1 text-[10px] text-slate-400"
                >
                  {column}
                </code>
              ))}
            </div>
          </div>
          <p className="border-l-2 border-rose-300/30 pl-3 leading-relaxed">{t('multiValueHint')}</p>
        </div>
      </details>
    </section>
  )
}
