'use client'

import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@/lib/observatory-i18n'
import { rrOperatorCopy } from './operator-copy'
import { OperatorEvidence, isKernelRRPresentation, type KernelRRPresentation } from './operator-evidence'
import {
  OperatorRequestError,
  OperatorRequestGuard,
  classifyOperatorHttpStatus,
  parsedExecutionIds,
  type OperatorErrorKind,
} from './operator-guards'
import {
  defaultKernelView,
  moveKernelPanel,
  readKernelView,
  saveKernelView,
  templateKernelView,
  type KernelPanel,
  type KernelView,
} from './operator-presentation'

type Session = { configured: boolean; authenticated: boolean; mode: string }
type KernelPreflight = {
  schema_version: 'readiness-recovery.presentation.v1'
  validation_scope: 'SCHEMA_AND_ADMISSION_ONLY'
  execution_id: string
  decision_id: string
  source_snapshot_id: string
  job_count: number
  technician_count: number
  warning: 'NOT_EXECUTION_OR_FEASIBILITY_PROOF'
}
function isKernelPreflight(value: unknown): value is KernelPreflight {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<KernelPreflight>
  return (
    v.schema_version === 'readiness-recovery.presentation.v1' &&
    v.validation_scope === 'SCHEMA_AND_ADMISSION_ONLY' &&
    typeof v.execution_id === 'string' &&
    typeof v.decision_id === 'string' &&
    typeof v.source_snapshot_id === 'string' &&
    typeof v.job_count === 'number' &&
    typeof v.technician_count === 'number'
  )
}
const initialRequest = `{
  "execution_id": "rr-reference-001",
  "source": {},
  "ingested_at": "",
  "payload": {}
}`

async function checkedJson(response: Response): Promise<unknown> {
  const data: unknown = await response.json()
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : data && typeof data === 'object' && 'detail' in data
          ? JSON.stringify(data.detail)
          : `RR request failed (${response.status})`
    throw new OperatorRequestError(classifyOperatorHttpStatus(response.status), message)
  }
  return data
}

/**
 * Independent reference-operator workflow. Never maps stochastic demo results
 * onto the exact Kernel job/technician/slot domain or persists credentials.
 */
export function RRProductionOperatorPanel({ locale = 'en' }: { locale?: Locale }) {
  const t = rrOperatorCopy[locale]
  const requestGuard = useRef(new OperatorRequestGuard())
  const activeController = useRef<AbortController | null>(null)
  const fileRevision = useRef(0)
  const [view, setView] = useState<KernelView>(() => defaultKernelView())
  const [viewReady, setViewReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [password, setPassword] = useState('')
  const [requestBody, setRequestBody] = useState(initialRequest)
  const [replanBody, setReplanBody] = useState('')
  const [decisionId, setDecisionId] = useState('')
  const [executionId, setExecutionId] = useState('')
  const [lastResult, setLastResult] = useState<unknown>(null)
  const [presentation, setPresentation] = useState<KernelRRPresentation | null>(null)
  const [preflight, setPreflight] = useState<KernelPreflight | null>(null)
  const [preflightStatus, setPreflightStatus] = useState('')
  const [operation, setOperation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<OperatorErrorKind | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (!active) return
      try {
        setView(readKernelView(window.localStorage))
      } catch {
        setView(defaultKernelView())
      }
      setViewReady(true)
    })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    if (!viewReady) return
    try {
      saveKernelView(window.localStorage, view)
    } catch {
      /* private browsing */
    }
  }, [view, viewReady])
  useEffect(
    () => () => {
      requestGuard.current.invalidate()
      activeController.current?.abort()
      fileRevision.current += 1
    },
    []
  )

  function invalidateOutcome() {
    requestGuard.current.invalidate()
    activeController.current?.abort()
    setBusy(false)
    setLastResult(null)
    setPresentation(null)
    setPreflight(null)
    setPreflightStatus('Input changed; waiting for Kernel validation')
    setOperation('')
    setErrorKind(null)
  }
  function startOperation() {
    activeController.current?.abort()
    const controller = new AbortController()
    activeController.current = controller
    return { epoch: requestGuard.current.begin(), signal: controller.signal }
  }
  function operationFailed(reason: unknown, epoch: number) {
    if (!requestGuard.current.current(epoch)) return
    setErrorKind(reason instanceof OperatorRequestError ? reason.kind : 'TRANSPORT_ERROR')
    if (reason instanceof OperatorRequestError && reason.kind === 'AUTH_REQUIRED') {
      setSession({ configured: true, authenticated: false, mode: 'single-organization-reference' })
      setLastResult(null)
      setPresentation(null)
      setDecisionId('')
      setExecutionId('')
      setError(t.sessionLost)
    } else if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
      setLastResult(null)
      setError(reason instanceof Error ? reason.message : 'RR operation failed')
    }
  }

  useEffect(() => {
    if (!session?.authenticated) return
    const controller = new AbortController()
    const currentBody = requestBody
    const timeout = setTimeout(() => {
      setPreflight(null)
      setPreflightStatus('Checking Kernel contract…')
      void fetch('/api/rr-operator/kernel/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: currentBody,
        cache: 'no-store',
        signal: controller.signal,
      })
        .then(checkedJson)
        .then((value) => {
          if (controller.signal.aborted) return
          if (!isKernelPreflight(value)) throw new Error('Unsupported Kernel preflight response')
          setPreflight(value)
          setPreflightStatus('')
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return
          setPreflight(null)
          setPreflightStatus(reason instanceof Error ? reason.message : 'Preflight rejected')
        })
    }, 250)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [requestBody, session?.authenticated])

  useEffect(() => {
    let active = true
    fetch('/api/rr-operator/session', { cache: 'no-store' })
      .then((response) => checkedJson(response))
      .then((data) => {
        if (active) setSession(data as Session)
      })
      .catch(() => {
        if (active) setSession({ configured: false, authenticated: false, mode: 'unavailable' })
      })
    return () => {
      active = false
    }
  }, [])

  async function execute(label: string, url: string, method = 'GET', body?: string) {
    const { epoch, signal } = startOperation()
    setBusy(true)
    setError(null)
    setErrorKind(null)
    setLastResult(null)
    setPresentation(null)
    try {
      const response = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body,
        cache: 'no-store',
        signal,
      })
      const data = await checkedJson(response)
      if (!requestGuard.current.current(epoch)) return
      setLastResult(data)
      setOperation(label)
      if (method === 'POST' && label === 'Create execution') {
        const ids = parsedExecutionIds(data)
        if (
          !ids.executionId ||
          !ids.decisionId ||
          preflight?.execution_id !== ids.executionId ||
          preflight?.decision_id !== ids.decisionId
        )
          throw new Error(t.requestMismatch)
        setExecutionId(ids.executionId)
        setDecisionId(ids.decisionId)
      }
      if (method === 'POST' && label === 'Replan execution') {
        const ids = parsedExecutionIds(data)
        const successor: unknown = body ? (JSON.parse(body) as unknown) : null
        const target =
          successor && typeof successor === 'object' && 'execution_id' in successor ? successor.execution_id : null
        if (!ids.executionId || !ids.decisionId || target !== ids.executionId) throw new Error(t.requestMismatch)
        setExecutionId(ids.executionId)
        setDecisionId(ids.decisionId)
      }
      if (method === 'POST' && (label === 'Create execution' || label === 'Replan execution')) {
        const { executionId: id } = parsedExecutionIds(data)
        if (id) {
          try {
            const projection: unknown = await checkedJson(
              await fetch(`${prefix}/executions/${encodeURIComponent(id)}/presentation`, { cache: 'no-store', signal })
            )
            if (!requestGuard.current.current(epoch)) return
            if (!isKernelRRPresentation(projection) || projection.execution_id !== id)
              throw new Error('Kernel returned an incompatible presentation schema')
            setPresentation(projection)
          } catch (projectionError) {
            if (
              requestGuard.current.current(epoch) &&
              !(projectionError instanceof DOMException && projectionError.name === 'AbortError')
            ) {
              // A successful execution is NOT rolled back or retried because an optional read model is unavailable.
              setError('Execution created. Plugin evidence is unavailable; do not resubmit the same request.')
            }
          }
        }
      }
    } catch (reason) {
      operationFailed(reason, epoch)
    } finally {
      if (requestGuard.current.current(epoch)) setBusy(false)
    }
  }

  async function exportComplete() {
    const { epoch, signal } = startOperation()
    const exportedDecisionId = decisionId
    setBusy(true)
    setError(null)
    setPresentation(null)
    setLastResult(null)
    try {
      const response: unknown = await checkedJson(
        await fetch(`${prefix}/decisions/${encodeURIComponent(exportedDecisionId)}/history/export-complete`, {
          cache: 'no-store',
          signal,
        })
      )
      if (!requestGuard.current.current(epoch)) return
      // Only accept the backend's attested, complete response; never aggregate
      // pages, infer a decision head, or compute history integrity in web.
      if (
        !response ||
        typeof response !== 'object' ||
        !('export_complete' in response) ||
        response.export_complete !== true ||
        !('history_verified' in response) ||
        response.history_verified !== true ||
        !('decision_id' in response) ||
        response.decision_id !== exportedDecisionId ||
        !('executions' in response) ||
        !Array.isArray(response.executions)
      ) {
        throw new Error('Kernel did not attest complete decision history')
      }
      setOperation('Complete history export')
      setLastResult(response)
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      try {
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `rr-history-${exportedDecisionId}.json`
        anchor.click()
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (reason) {
      operationFailed(reason, epoch)
    } finally {
      if (requestGuard.current.current(epoch)) setBusy(false)
    }
  }

  async function login() {
    const { epoch, signal } = startOperation()
    setBusy(true)
    setError(null)
    setErrorKind(null)
    try {
      await checkedJson(
        await fetch('/api/rr-operator/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
          signal,
        })
      )
      if (!requestGuard.current.current(epoch)) return
      setSession({ configured: true, authenticated: true, mode: 'single-organization-reference' })
      setPassword('')
    } catch (reason) {
      operationFailed(reason, epoch)
    } finally {
      if (requestGuard.current.current(epoch)) setBusy(false)
    }
  }

  async function logout() {
    const { epoch, signal } = startOperation()
    fileRevision.current += 1
    setBusy(true)
    setLastResult(null)
    setError(null)
    try {
      await checkedJson(await fetch('/api/rr-operator/session', { method: 'DELETE', signal }))
      if (!requestGuard.current.current(epoch)) return
      setSession({ configured: true, authenticated: false, mode: 'single-organization-reference' })
      setLastResult(null)
      setPresentation(null)
      setExecutionId('')
      setDecisionId('')
      setRequestBody(initialRequest)
      setReplanBody('')
      setPassword('')
    } catch (reason) {
      operationFailed(reason, epoch)
    } finally {
      if (requestGuard.current.current(epoch)) setBusy(false)
    }
  }

  if (!session)
    return (
      <p className="mx-auto max-w-5xl px-5 py-12 text-slate-400" role="status">
        {t.checking}
      </p>
    )
  if (!session.configured)
    return (
      <section
        data-testid="rr-kernel-unavailable"
        className="mx-auto max-w-5xl border border-white/15 bg-slate-900/50 p-6"
        role="status"
      >
        <h2 className="text-lg font-semibold">{t.unavailable}</h2>
        <p className="mt-3 text-sm text-slate-300">{t.unavailableHelp}</p>
      </section>
    )

  const validId = (id: string) => /^[A-Za-z0-9_.-]{1,128}$/.test(id)
  const prefix = '/api/rr-operator/kernel'

  return (
    <section
      className={`mt-8 border border-sky-400/30 bg-slate-900/70 ${view.density === 'COMPACT' ? 'p-3 md:p-4 text-sm' : 'p-5 md:p-6'}`}
      data-testid="rr-production-operator"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-sky-200">{t.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{t.description}</p>
        </div>
        {session.authenticated && (
          <button type="button" onClick={() => void logout()} className="border border-slate-400 px-4 py-2 text-sm">
            {t.signout}
          </button>
        )}
      </div>

      {session.authenticated && presentation ? (
        <section aria-label={t.outcome} data-testid="rr-decision-first" className="mt-6">
          <h3 className="text-lg font-semibold text-white">{t.outcome}</h3>
          <OperatorEvidence locale={locale} record={presentation} />
        </section>
      ) : null}
      {session.authenticated && (
        <div className="mt-5 border border-white/15 p-3" data-testid="rr-operator-preferences">
          <h3 className="font-semibold">{t.display}</h3>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t.templates}>
            <button
              type="button"
              onClick={() => setView(templateKernelView('BUSINESS'))}
              className="border border-white/20 px-3 py-2 text-sm text-slate-200"
            >
              {t.business}
            </button>
            <button
              type="button"
              onClick={() => setView(templateKernelView('ANALYST'))}
              className="border border-white/20 px-3 py-2 text-sm text-slate-200"
            >
              {t.analyst}
            </button>
          </div>
          <label className="mt-2 block text-sm">
            {t.density}
            <select
              aria-label={t.density}
              className="ml-3 border border-white/20 bg-slate-950 p-2"
              value={view.density}
              onChange={(event) => setView({ ...view, density: event.target.value as KernelView['density'] })}
            >
              <option value="COMFORTABLE">{t.comfortable}</option>
              <option value="COMPACT">{t.compact}</option>
            </select>
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            {view.panels.map((key: KernelPanel) => (
              <div key={key} className="flex items-center gap-2 border border-white/15 px-2 py-1 text-sm">
                <span>{key === 'EXECUTE' ? t.create : key === 'REPLAN' ? t.replan : t.evidence}</span>
                <button
                  type="button"
                  aria-label={`${t.up}: ${key}`}
                  disabled={view.panels.indexOf(key) === 0}
                  onClick={() => setView(moveKernelPanel(view, key, -1))}
                  className="disabled:opacity-30"
                >
                  {t.up}
                </button>
                <button
                  type="button"
                  aria-label={`${t.down}: ${key}`}
                  disabled={view.panels.indexOf(key) === view.panels.length - 1}
                  onClick={() => setView(moveKernelPanel(view, key, 1))}
                  className="disabled:opacity-30"
                >
                  {t.down}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="border border-white/15 px-3 py-1"
              onClick={() => setView(defaultKernelView())}
            >
              {t.reset}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">{t.preferences}</p>
        </div>
      )}
      {!session.authenticated ? (
        <div className="mt-5 flex max-w-lg flex-col gap-3">
          <label className="text-sm" htmlFor="rr-operator-password">
            {t.password}
          </label>
          <input
            id="rr-operator-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border border-white/25 bg-slate-950 p-3 text-sm"
          />
          <button
            type="button"
            disabled={busy || !password}
            onClick={() => void login()}
            className="bg-sky-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
          >
            {t.unlock}
          </button>
        </div>
      ) : (
        <div className={`mt-6 grid xl:grid-cols-2 ${view.density === 'COMPACT' ? 'gap-2' : 'gap-5'}`}>
          <div className="space-y-3" style={{ order: view.panels.indexOf('EXECUTE') }}>
            <h3 className="font-semibold">1. {t.create}</h3>
            <p className="text-xs text-slate-400">{t.createHelp}</p>
            <label className="block text-sm" htmlFor="rr-kernel-request-file">
              {t.import}
            </label>
            <input
              id="rr-kernel-request-file"
              type="file"
              accept=".json,application/json"
              className="block w-full text-xs"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const revision = ++fileRevision.current
                invalidateOutcome()
                if (file.size > 2_150_000) {
                  setError('RR request exceeds the accepted size limit.')
                  return
                }
                void file
                  .text()
                  .then((value) => {
                    if (fileRevision.current !== revision) return
                    try {
                      const parsed: unknown = JSON.parse(value)
                      setRequestBody(JSON.stringify(parsed, null, 2))
                      setError(null)
                    } catch (reason) {
                      setError(reason instanceof Error ? reason.message : 'Invalid RR JSON')
                    }
                  })
                  .catch(() => {
                    if (fileRevision.current === revision) setError('Could not read the RR request file')
                  })
              }}
            />
            <textarea
              aria-label="Kernel execution JSON"
              value={requestBody}
              onChange={(event) => {
                fileRevision.current += 1
                invalidateOutcome()
                setRequestBody(event.target.value)
              }}
              spellCheck={false}
              rows={10}
              className="w-full border border-white/20 bg-slate-950 p-3 font-mono text-xs"
            />
            <p
              role="status"
              className={`text-xs ${preflight ? 'text-sky-200' : 'text-amber-200'}`}
              data-testid="rr-kernel-preflight"
            >
              {preflight
                ? `Kernel preflight · execution: ${preflight.execution_id} · decision: ${preflight.decision_id} · snapshot: ${preflight.source_snapshot_id} · jobs: ${preflight.job_count} · technicians: ${preflight.technician_count}`
                : `Server preflight: ${preflightStatus || 'Not validated by qdip-core'}`}
              {preflight ? ' · No execution or feasibility proof.' : ''}
            </p>
            <button
              type="button"
              disabled={busy || !preflight}
              onClick={() => void execute('Create execution', `${prefix}/executions`, 'POST', requestBody)}
              className="bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {t.createButton}
            </button>
          </div>

          <div className="space-y-3" style={{ order: view.panels.indexOf('REPLAN') }}>
            <h3 className="font-semibold">2. {t.replan}</h3>
            <p className="text-xs text-slate-400">{t.replanHelp}</p>
            <label className="block text-sm" htmlFor="rr-execution-id">
              {t.executionId}
            </label>
            <input
              id="rr-execution-id"
              value={executionId}
              onChange={(event) => {
                invalidateOutcome()
                setExecutionId(event.target.value)
              }}
              className="w-full border border-white/20 bg-slate-950 p-2 text-sm"
            />
            <textarea
              aria-label="Kernel replan JSON"
              value={replanBody}
              onChange={(event) => {
                invalidateOutcome()
                setReplanBody(event.target.value)
              }}
              spellCheck={false}
              placeholder="Paste explicit ReadinessRecoveryReplanRequest JSON"
              rows={7}
              className="w-full border border-white/20 bg-slate-950 p-3 font-mono text-xs"
            />
            <button
              type="button"
              disabled={busy || !validId(executionId) || !replanBody.trim()}
              onClick={() =>
                void execute(
                  'Replan execution',
                  `${prefix}/executions/${encodeURIComponent(executionId)}/replan`,
                  'POST',
                  replanBody
                )
              }
              className="bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {t.replanButton}
            </button>
          </div>

          <div className="space-y-3 xl:col-span-2" style={{ order: view.panels.indexOf('EVIDENCE') }}>
            <h3 className="font-semibold">3. {t.evidence}</h3>
            <label className="block text-sm" htmlFor="rr-decision-id">
              {t.decisionId}
            </label>
            <input
              id="rr-decision-id"
              value={decisionId}
              onChange={(event) => {
                invalidateOutcome()
                setDecisionId(event.target.value)
              }}
              className="w-full border border-white/20 bg-slate-950 p-2 text-sm"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !validId(decisionId)}
                onClick={() =>
                  void execute('Decision history', `${prefix}/decisions/${encodeURIComponent(decisionId)}/history`)
                }
                className="border border-white/25 px-4 py-2 text-sm disabled:opacity-50"
              >
                {t.history}
              </button>
              <button
                type="button"
                disabled={busy || !validId(decisionId)}
                onClick={() =>
                  void execute(
                    'History integrity',
                    `${prefix}/decisions/${encodeURIComponent(decisionId)}/history-integrity`
                  )
                }
                className="border border-white/25 px-4 py-2 text-sm disabled:opacity-50"
              >
                {t.integrity}
              </button>
              <button
                type="button"
                disabled={busy || !validId(decisionId)}
                onClick={() => void exportComplete()}
                className="border border-white/25 px-4 py-2 text-sm disabled:opacity-50"
              >
                {t.export}
              </button>
              <button
                type="button"
                disabled={busy || !validId(executionId)}
                onClick={() =>
                  void execute(
                    'Semantic replay',
                    `${prefix}/executions/${encodeURIComponent(executionId)}/replay-verification`
                  )
                }
                className="border border-white/25 px-4 py-2 text-sm disabled:opacity-50"
              >
                {t.replay}
              </button>
            </div>
          </div>
          {lastResult !== null && (
            <div className="xl:col-span-2" style={{ order: 3 }} aria-live="polite">
              <h3 className="font-semibold">{operation}</h3>
              <details className="mt-3 border border-white/15 p-3" data-testid="rr-technical-response">
                <summary className="cursor-pointer text-sm font-semibold text-slate-200">
                  {t.technicalPayload}
                </summary>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all bg-slate-950 p-4 font-mono text-xs">
                  {JSON.stringify(lastResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" data-error-kind={errorKind ?? 'INVALID_INPUT'} className="mt-4 text-sm text-rose-300">
          {error}
        </p>
      )}
      <p className="mt-5 text-xs text-slate-400">{t.restricted}</p>
    </section>
  )
}
