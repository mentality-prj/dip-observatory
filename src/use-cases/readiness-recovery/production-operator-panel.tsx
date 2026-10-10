'use client'

import { useEffect, useState } from 'react'

type Session = { configured: boolean; authenticated: boolean; mode: string }
type RecordSummary = {
  organization_id?: string
  result?: {
    workflow?: {
      execution_id?: string
      ingestion?: { payload?: { decision_id?: string } }
    }
    runtime?: {
      operator_outcome?: {
        kind?: string
        actionable?: boolean
        authoritative?: boolean
        summary?: string
        selected_donor_ids?: string[]
      }
      decision?: {
        scheduled_jobs?: Array<{
          job_id: string
          technician_id: string
          start_slot: number
          finish_slot: number
        }>
      } | null
    }
  }
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
    throw new Error(message)
  }
  return data
}

/**
 * Independent reference-operator workflow. Never maps stochastic demo results
 * onto the exact Kernel job/technician/slot domain or persists credentials.
 */
export function RRProductionOperatorPanel() {
  const [session, setSession] = useState<Session | null>(null)
  const [password, setPassword] = useState('')
  const [requestBody, setRequestBody] = useState(initialRequest)
  const [replanBody, setReplanBody] = useState('')
  const [decisionId, setDecisionId] = useState('')
  const [executionId, setExecutionId] = useState('')
  const [lastResult, setLastResult] = useState<unknown>(null)
  const [operation, setOperation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/rr-operator/session', { cache: 'no-store' })
      .then((response) => checkedJson(response))
      .then((data) => { if (active) setSession(data as Session) })
      .catch(() => { if (active) setSession({ configured: false, authenticated: false, mode: 'unavailable' }) })
    return () => { active = false }
  }, [])

  async function execute(label: string, url: string, method = 'GET', body?: string) {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body,
        cache: 'no-store',
      })
      const data = await checkedJson(response)
      setLastResult(data)
      setOperation(label)
      if (method === 'POST' && label === 'Create execution') {
        const record = data as RecordSummary
        setExecutionId(record.result?.workflow?.execution_id ?? '')
        setDecisionId(record.result?.workflow?.ingestion?.payload?.decision_id ?? '')
      }
      if (method === 'POST' && label === 'Replan execution') {
        const record = data as RecordSummary
        setExecutionId(record.result?.workflow?.execution_id ?? '')
        setDecisionId(record.result?.workflow?.ingestion?.payload?.decision_id ?? '')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'RR operation failed')
    } finally {
      setBusy(false)
    }
  }

  async function exportComplete() {
    setBusy(true)
    setError(null)
    try {
      const exported: unknown[] = []
      let cursor: string | null = null
      let expectedHead: string | null = null
      let completed = false
      for (let pageNumber = 0; pageNumber < 20; pageNumber++) {
        const path = `${prefix}/decisions/${encodeURIComponent(decisionId)}/history/export`
        const params = new URLSearchParams({ page_size: '100' })
        if (cursor !== null && expectedHead !== null) {
          params.set('cursor', cursor)
          params.set('expected_head', expectedHead)
        }
        const data = await checkedJson(await fetch(`${path}?${params.toString()}`, { cache: 'no-store' })) as {
          head_execution_id: string
          executions: unknown[]
          next_cursor: string | null
          export_complete: boolean
        }
        if (!data.head_execution_id || !Array.isArray(data.executions))
          throw new Error('Invalid RR export contract')
        if (expectedHead !== null && expectedHead !== data.head_execution_id)
          throw new Error('RR decision head changed during export; restart')
        expectedHead = data.head_execution_id
        exported.push(...data.executions)
        if (data.export_complete) {
          completed = true
          break
        }
        if (!data.next_cursor) throw new Error('RR export cursor missing')
        cursor = data.next_cursor
      }
      if (!completed) throw new Error('RR export page limit reached; cannot attest complete history')
      setOperation('Complete history export')
      setLastResult({ decision_id: decisionId, head_execution_id: expectedHead, executions: exported, export_complete: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'RR export failed')
    } finally {
      setBusy(false)
    }
  }

  async function login() {
    setBusy(true)
    setError(null)
    try {
      await checkedJson(await fetch('/api/rr-operator/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }))
      setSession({ configured: true, authenticated: true, mode: 'single-organization-reference' })
      setPassword('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await fetch('/api/rr-operator/session', { method: 'DELETE' })
    setSession({ configured: true, authenticated: false, mode: 'single-organization-reference' })
    setLastResult(null)
    setExecutionId('')
    setDecisionId('')
    setRequestBody(initialRequest)
    setReplanBody('')
    setPassword('')
  }

  if (!session?.configured) return null

  const validId = (id: string) => /^[A-Za-z0-9_.-]{1,128}$/.test(id)
  const prefix = '/api/rr-operator/kernel'
  const summary = lastResult as RecordSummary | null

  return (
    <section className="mt-8 border border-sky-400/30 bg-slate-900/70 p-5 md:p-6" data-testid="rr-production-operator">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-sky-200">Production RR — Kernel-backed operator</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Independent, authenticated reference workflow. Paste a normalized RR API request;
            the stochastic Pareto demo above is not equivalent to the Kernel scheduling model.
          </p>
        </div>
        {session.authenticated && (
          <button type="button" onClick={() => void logout()} className="border border-slate-400 px-4 py-2 text-sm">
            Sign out
          </button>
        )}
      </div>

      {!session.authenticated ? (
        <div className="mt-5 flex max-w-lg flex-col gap-3">
          <label className="text-sm" htmlFor="rr-operator-password">Operator access password</label>
          <input
            id="rr-operator-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border border-white/25 bg-slate-950 p-3 text-sm"
          />
          <button type="button" disabled={busy || !password} onClick={() => void login()} className="bg-sky-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">
            Unlock reference operator
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-semibold">1. Create Kernel execution</h3>
            <p className="text-xs text-slate-400">Use the exact JSON body emitted by the RR normalized-import preflight CLI. No browser-side schema inference or storage.</p>
            <label className="block text-sm" htmlFor="rr-kernel-request-file">
              Import normalized RR API request (JSON)
            </label>
            <input
              id="rr-kernel-request-file"
              type="file"
              accept=".json,application/json"
              className="block w-full text-xs"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                if (file.size > 2_150_000) {
                  setError('RR request exceeds the accepted size limit.')
                  return
                }
                void file.text().then((value) => {
                  try {
                    const parsed: unknown = JSON.parse(value)
                    if (!parsed || typeof parsed !== 'object' || !('execution_id' in parsed) || !('payload' in parsed))
                      throw new Error('Expected an RR /executions API request, not a demo scenario package.')
                    setRequestBody(JSON.stringify(parsed, null, 2))
                    setError(null)
                  } catch (reason) {
                    setError(reason instanceof Error ? reason.message : 'Invalid RR JSON')
                  }
                }).catch(() => setError('Could not read the RR request file'))
              }}
            />
            <textarea
              aria-label="Kernel execution JSON"
              value={requestBody}
              onChange={(event) => setRequestBody(event.target.value)}
              spellCheck={false}
              rows={10}
              className="w-full border border-white/20 bg-slate-950 p-3 font-mono text-xs"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void execute('Create execution', `${prefix}/executions`, 'POST', requestBody)}
              className="bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Create execution
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">2. Change, override or replan</h3>
            <p className="text-xs text-slate-400">Supply an explicit successor execution ID, change ID, kind, source and reason. No implicit overwrite of a predecessor.</p>
            <label className="block text-sm" htmlFor="rr-execution-id">Execution ID</label>
            <input
              id="rr-execution-id"
              value={executionId}
              onChange={(event) => setExecutionId(event.target.value)}
              className="w-full border border-white/20 bg-slate-950 p-2 text-sm"
            />
            <textarea
              aria-label="Kernel replan JSON"
              value={replanBody}
              onChange={(event) => setReplanBody(event.target.value)}
              spellCheck={false}
              placeholder="Paste explicit ReadinessRecoveryReplanRequest JSON"
              rows={7}
              className="w-full border border-white/20 bg-slate-950 p-3 font-mono text-xs"
            />
            <button
              type="button"
              disabled={busy || !validId(executionId) || !replanBody}
              onClick={() => void execute('Replan execution', `${prefix}/executions/${encodeURIComponent(executionId)}/replan`, 'POST', replanBody)}
              className="bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Replan from predecessor
            </button>
          </div>

          <div className="space-y-3 xl:col-span-2">
            <h3 className="font-semibold">3. Durable evidence and verification</h3>
            <label className="block text-sm" htmlFor="rr-decision-id">Decision ID</label>
            <input
              id="rr-decision-id"
              value={decisionId}
              onChange={(event) => setDecisionId(event.target.value)}
              className="w-full border border-white/20 bg-slate-950 p-2 text-sm"
            />
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy || !validId(decisionId)} onClick={() => void execute('Decision history', `${prefix}/decisions/${encodeURIComponent(decisionId)}/history`)} className="border border-white/25 px-4 py-2 text-sm disabled:opacity-50">History</button>
              <button type="button" disabled={busy || !validId(decisionId)} onClick={() => void execute('History integrity', `${prefix}/decisions/${encodeURIComponent(decisionId)}/history-integrity`)} className="border border-white/25 px-4 py-2 text-sm disabled:opacity-50">Integrity</button>
              <button type="button" disabled={busy || !validId(decisionId)} onClick={() => void exportComplete()} className="border border-white/25 px-4 py-2 text-sm disabled:opacity-50">Export complete history</button>
              <button type="button" disabled={busy || !validId(executionId)} onClick={() => void execute('Semantic replay', `${prefix}/executions/${encodeURIComponent(executionId)}/replay-verification`)} className="border border-white/25 px-4 py-2 text-sm disabled:opacity-50">Replay</button>
            </div>
          </div>
          {lastResult !== null && (
            <div className="xl:col-span-2" aria-live="polite">
              <h3 className="font-semibold">{operation}</h3>
              {summary?.result?.runtime?.operator_outcome && (
                <div className="mt-2 space-y-3 border border-white/20 p-3 text-sm" data-testid="rr-operator-outcome">
                  <p>
                    Decision: {summary.result.runtime.operator_outcome.kind ?? 'UNKNOWN'}
                    {' · '}
                    {summary.result.runtime.operator_outcome.authoritative ? 'Authoritative' : 'Uncertified'}
                    {' · '}
                    {summary.result.runtime.operator_outcome.actionable ? 'Actionable' : 'Non-actionable — inspect evidence'}
                  </p>
                  <p className="text-slate-300">{summary.result.runtime.operator_outcome.summary}</p>
                  {summary.result.runtime.operator_outcome.actionable &&
                    summary.result.runtime.decision?.scheduled_jobs && (
                      <div>
                        <h4 className="font-semibold">Kernel scheduled jobs (slot units)</h4>
                        <ul className="mt-2 space-y-1">
                          {summary.result.runtime.decision.scheduled_jobs.map((job) => (
                            <li key={job.job_id} className="font-mono text-xs">
                              {job.job_id} · {job.technician_id} · slots {job.start_slot}–{job.finish_slot}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs">
                          Donor kits: {summary.result.runtime.operator_outcome.selected_donor_ids?.join(', ') || 'none'}
                        </p>
                      </div>
                    )}
                </div>
              )}
              <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all border border-white/15 bg-slate-950 p-4 font-mono text-xs">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
      <p className="mt-5 text-xs text-slate-400">Single-organization reference installation only. All operational requests are authorized server-side; no privileged backend key is sent to the browser.</p>
    </section>
  )
}
