'use client'

import { CheckCircle2, FileCheck2, LoaderCircle, Upload } from 'lucide-react'
import { useId, useRef, useState, type DragEvent } from 'react'

export type FileUploaderState = 'idle' | 'selected' | 'busy' | 'ready' | 'error'

export type FileUploaderCopy = {
  drop: string
  dropActive: string
  or: string
  choose: string
  replace: string
  busy?: string
  ready?: string
}

export type FileUploaderFile = {
  name: string
  size?: number
}

export type FileUploaderProps = {
  accept: string
  copy: FileUploaderCopy
  file?: FileUploaderFile | null
  formats: string
  state?: FileUploaderState
  statusLabel?: string
  disabled?: boolean
  onFile: (file: File) => void | Promise<void>
  tone?: 'cyan' | 'rose'
  testId?: string
  fileTestId?: string
  dragPromptTestId?: string
  className?: string
}

const tones = {
  cyan: {
    active: 'border-cyan-300 bg-cyan-300/10',
    icon: 'text-cyan-300',
    button: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  },
  rose: {
    active: 'border-rose-300 bg-rose-300/15',
    icon: 'text-rose-300',
    button: 'border-rose-300/30 bg-rose-300/10 text-rose-200',
  },
} as const

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileLabel(file: FileUploaderFile): string {
  return typeof file.size === 'number' ? `${file.name} · ${formatBytes(file.size)}` : file.name
}

export function FileUploader({
  accept,
  copy,
  file = null,
  formats,
  state = file ? 'selected' : 'idle',
  statusLabel,
  disabled = false,
  onFile,
  tone = 'cyan',
  testId,
  fileTestId,
  dragPromptTestId,
  className = '',
}: FileUploaderProps) {
  const inputId = useId()
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)
  const busy = state === 'busy'
  const unavailable = disabled || busy
  const styles = tones[tone]

  function selectFile(nextFile: File | undefined) {
    if (!nextFile || unavailable) return
    void onFile(nextFile)
  }

  function dragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current += 1
    if (!unavailable) setDragging(true)
  }

  function dragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }

  function dragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = unavailable ? 'none' : 'copy'
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = 0
    setDragging(false)
    if (unavailable) return
    selectFile(event.dataTransfer.files?.[0])
  }

  const frameClass =
    state === 'ready'
      ? 'border-emerald-300/35 bg-emerald-300/[0.06]'
      : dragging
        ? styles.active
        : 'border-white/15 bg-slate-950/35'

  return (
    <div
      data-testid={testId}
      data-dragging={dragging ? 'true' : 'false'}
      onDragEnter={dragEnter}
      onDragLeave={dragLeave}
      onDragOver={dragOver}
      onDrop={drop}
      className={`${className} rounded-xl border border-dashed p-5 text-center transition-colors ${frameClass}`}
    >
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept={accept}
        disabled={unavailable}
        onChange={(event) => {
          selectFile(event.target.files?.[0])
          event.currentTarget.value = ''
        }}
      />

      {dragging && !unavailable ? (
        <div aria-live="polite" data-testid={dragPromptTestId}>
          <Upload className={`mx-auto h-7 w-7 ${styles.icon}`} />
          <div data-testid={fileTestId} className="mt-3 text-sm font-bold">
            {copy.dropActive}
          </div>
        </div>
      ) : busy ? (
        <div aria-live="polite">
          <LoaderCircle className={`mx-auto h-7 w-7 animate-spin ${styles.icon}`} />
          <div className="mt-3 text-sm font-bold">{statusLabel ?? copy.busy}</div>
          {file ? (
            <div data-testid={fileTestId} className="mt-1 break-words text-xs text-slate-500">
              {fileLabel(file)}
            </div>
          ) : null}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full w-1/2 animate-pulse rounded-full ${tone === 'rose' ? 'bg-rose-400' : 'bg-cyan-300'}`}
            />
          </div>
        </div>
      ) : file ? (
        <div aria-live="polite">
          {state === 'ready' ? (
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-300" />
          ) : (
            <FileCheck2 className={`mx-auto h-7 w-7 ${styles.icon}`} />
          )}
          {statusLabel ? (
            <div className={`mt-3 font-bold ${state === 'ready' ? 'text-emerald-200' : 'text-white'}`}>
              {statusLabel}
            </div>
          ) : null}
          <div data-testid={fileTestId} className="mt-2 break-words text-xs text-slate-400">
            {fileLabel(file)}
          </div>
          <label
            htmlFor={inputId}
            className={`mt-4 inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-xs font-bold ${styles.button}`}
          >
            <FileCheck2 className="h-4 w-4" />
            {copy.replace}
          </label>
          <div className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">{formats}</div>
        </div>
      ) : (
        <>
          <Upload className={`mx-auto h-7 w-7 ${styles.icon}`} />
          <div data-testid={fileTestId} className="mt-3 text-sm font-bold">
            {copy.drop}
          </div>
          <div className="my-2 text-xs text-slate-600">{copy.or}</div>
          <label
            htmlFor={inputId}
            className={`flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 border px-3 py-2.5 text-center text-sm font-bold leading-6 whitespace-normal break-words [overflow-wrap:anywhere] ${styles.button}`}
          >
            <Upload className="h-4 w-4" />
            {copy.choose}
          </label>
          <div className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">{formats}</div>
        </>
      )}
    </div>
  )
}
