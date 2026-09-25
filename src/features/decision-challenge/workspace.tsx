'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, CircleAlert, FileUp, LockKeyhole, RefreshCw, Scale } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { Locale } from '@/lib/observatory-i18n'
import { formatChallengeMoney, getDecisionChallengeI18n } from './i18n'
import { marketingHref } from '@/lib/platform-urls'
import { importResourceAllocationFile } from '@/features/resource-allocation/importer'
import {
  loadChallenges,
  recordChallengeCta,
  startChallenge,
  submitChallengeAction,
  validateChallengeAction,
} from './api'
import type { ChallengeAssignment, ChallengeDefinition, ChallengeRun } from './contracts'

type Team = {
  id: string
  current_community?: string | null
  allowed_communities?: string[] | null
  skills?: string[]
  capacity?: number
}
type Community = {
  id: string
  max_teams?: number
  demand?: Array<{ service?: string; units?: number; priority?: string }>
}



function newSubmissionId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `submission-${Date.now()}`
}

function scenarioData(run: ChallengeRun | null) {
  const problem = run?.snapshot.problem ?? {}
  return {
    teams: Array.isArray(problem.teams) ? (problem.teams as Team[]) : [],
    communities: Array.isArray(problem.communities) ? (problem.communities as Community[]) : [],
    budget: typeof problem.budget === 'number' ? problem.budget : null,
  }
}

export function DecisionChallengeWorkspace({ locale }: { locale: Locale }) {
  const t = getDecisionChallengeI18n(locale) as Record<string, any>
  const [definition, setDefinition] = useState<ChallengeDefinition | null>(null)
  const [run, setRun] = useState<ChallengeRun | null>(null)
  const [allocation, setAllocation] = useState<ChallengeAssignment>({})
  const [violations, setViolations] = useState<string[]>([])
  const [valid, setValid] = useState(false)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissionId, setSubmissionId] = useState('')

  async function begin(scenarioOverride?: Record<string, unknown>) {
    setLoading(true)
    setError(null)
    setViolations([])
    setValid(false)
    try {
      const nextSubmissionId = newSubmissionId()
      const definitions = await loadChallenges()
      const selected = definitions.find((item) => item.id === 'resource-allocation-v1') ?? definitions[0]
      if (!selected) throw new Error(t.unavailable)
      const started = await startChallenge(selected.id, scenarioOverride)
      const { teams } = scenarioData(started)
      setDefinition(selected)
      setRun(started)
      setAllocation(Object.fromEntries(teams.map((team) => [team.id, team.current_community ?? null])))
      setSubmissionId(nextSubmissionId)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.unavailable)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void begin()
    // One run is intentionally materialized once when this workspace mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function importCustomerScenario(file: File | undefined) {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const imported = await importResourceAllocationFile(file)
      await begin(imported as unknown as Record<string, unknown>)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.unavailable)
      setLoading(false)
    }
  }

  const scenario = useMemo(() => scenarioData(run), [run])
  const complete = run?.status === 'COMPLETED' && run.result
  const locked = run?.status === 'LOCKED' || run?.status === 'FAILED' || Boolean(complete)

  function change(team: string, community: string) {
    if (locked) return
    setAllocation((current) => ({ ...current, [team]: community || null }))
    setValid(false)
    setViolations([])
  }

  async function validate() {
    if (!run || locked) return
    setValidating(true)
    setError(null)
    try {
      const result = await validateChallengeAction(run.id, run.snapshot.snapshot_id, allocation)
      setValid(result.feasible)
      setViolations(result.violations)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.unavailable)
    } finally {
      setValidating(false)
    }
  }

  async function submit() {
    if (!run || locked || !valid) return
    setSubmitting(true)
    setError(null)
    try {
      const completed = await submitChallengeAction(
        run.id,
        submissionId,
        run.snapshot.snapshot_id,
        allocation
      )
      setRun(completed)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : t.unavailable
      setError(message)
      try {
        const response = await fetch(`/api/decision-challenge/runs/${encodeURIComponent(run.id)}`, {
          cache: 'no-store',
        })
        if (response.ok) {
          const refreshed = (await response.json()) as ChallengeRun
          setRun(refreshed)
        }
      } catch {
        // Keep the last server-confirmed state; never invent a completed or failed result locally.
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function retry() {
    if (!run) return
    setSubmitting(true)
    setError(null)
    try {
      setRun(await submitChallengeAction(run.id, submissionId, run.snapshot.snapshot_id, allocation))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.unavailable)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <main className="ds-container ds-page"><div className="ds-card p-8">{t.loading}</div></main>
  if (!run || !definition) {
    return (
      <main className="ds-container ds-page">
        <div className="ds-card p-8">
          <CircleAlert className="mb-4 h-6 w-6 text-rose-300" />
          <p>{error ?? t.unavailable}</p>
          <button className="ds-button ds-button-primary ds-button-md mt-5" onClick={() => void begin()}>{t.restart}</button>
        </div>
      </main>
    )
  }

  const result = run.result
  const currency = result?.human_economic_outcome.objective.currency ?? 'EUR'
  const delta = result?.economic_comparison.delta.nominal_delta ?? 0
  const direction = result?.human_economic_outcome.objective.direction
  const comparisonConsistent =
    result != null &&
    result.human_economic_outcome.objective.objective_id ===
      result.qdip_economic_outcome.objective.objective_id &&
    result.human_economic_outcome.objective.metric_id ===
      result.qdip_economic_outcome.objective.metric_id &&
    result.human_economic_outcome.objective.direction ===
      result.qdip_economic_outcome.objective.direction &&
    result.human_economic_outcome.objective.unit ===
      result.qdip_economic_outcome.objective.unit
  const verdict =
    !comparisonConsistent || !['maximize', 'minimize'].includes(direction ?? '')
      ? null
      : Math.abs(delta) < 0.000001
        ? t.tie
        : delta > 0
          ? t.qdipBetter
          : t.humanBetter

  return (
    <main className="ds-container ds-page">
      <div className="mb-8">
        <div className="observatory-eyebrow">{t.eyebrow}</div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">{t.intro}</p>
      </div>

      <section className="ds-card mb-6 p-6 sm:p-8">
        <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">00 · {t.howTitle}</div>
        <h2 className="mt-2 text-2xl font-semibold">{t.howTitle}</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">{t.howIntro}</p>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300"><strong>{t.howGoal.split(':')[0]}:</strong>{t.howGoal.slice(t.howGoal.indexOf(':') + 1)}</p>
        <ol className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">
          {t.howSteps.map((step, index) => <li key={step} className="flex gap-3"><span className="font-mono text-cyan-300">{index + 1}.</span><span>{step}</span></li>)}
        </ol>
        <div className="mt-5 rounded-[var(--ds-radius-panel)] border border-cyan-300/20 bg-cyan-300/[0.05] p-4 text-sm text-slate-300"><strong>{t.howImportant}</strong></div>
      </section>

      <section className="ds-card mb-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">{t.ownData}</div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{t.ownDataHelp}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="ds-button ds-button-primary ds-button-md cursor-pointer">
              <FileUp className="h-4 w-4" />{t.upload}
              <input className="sr-only" type="file" accept=".csv,.xml,.xlsx,text/csv,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { const file = event.target.files?.[0]; void importCustomerScenario(file); event.currentTarget.value = '' }} />
            </label>
            <button className="ds-button ds-button-secondary ds-button-md" onClick={() => void begin()}>{t.demoData}</button>
          </div>
        </div>
      </section>

      <section className="ds-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">01 · {t.scenario}</div>
            <h2 className="mt-2 text-2xl font-semibold">{t.scenarioTitle}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{t.scenarioDescription}</p>
          </div>
          <div className="font-mono text-xs text-slate-500">{t.snapshot} {run.snapshot.snapshot_hash.slice(0, 12)}</div>
        </div>
        {scenario.budget != null && <div className="mt-5 ds-badge ds-badge-info">{t.budget}: {scenario.budget}</div>}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold">{t.resources}</h3>
            <div className="grid gap-3">
              {scenario.teams.map((team) => (
                <div key={team.id} className="rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex justify-between gap-3"><b>{team.id}</b><span className="text-xs text-slate-500">{t.current}: {team.current_community ?? '—'}</span></div>
                  <div className="mt-2 text-xs text-slate-400">{t.capacity}: {team.capacity ?? '—'} · {t.skills}: {team.skills?.join(', ') || '—'}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">{t.targets}</h3>
            <div className="grid gap-3">
              {scenario.communities.map((community) => {
                const demand = community.demand?.reduce((sum, item) => sum + (item.units ?? 0), 0) ?? 0
                return <div key={community.id} className="rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.03] p-4"><div className="flex justify-between gap-3"><b>{community.id}</b><span className="text-xs text-slate-500">{t.maxTeams}: {community.max_teams ?? '—'}</span></div><div className="mt-2 text-xs text-slate-400">{t.demand}: {demand}</div></div>
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="ds-card mt-6 p-6 sm:p-8">
        <div className="flex items-center gap-3"><Scale className="h-5 w-5 text-cyan-300" /><div><div className="text-xs font-bold uppercase tracking-wider text-cyan-300">02 · {t.yourDecision}</div><h2 className="mt-1 text-2xl font-semibold">{t.yourDecision}</h2></div></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {scenario.teams.map((team) => (
            <label key={team.id} className="ds-label-control">
              <span>{team.id}</span>
              <select className="ds-select mt-2" value={allocation[team.id] ?? ''} disabled={locked} onChange={(event) => change(team.id, event.target.value)}>
                <option value="">{t.choose}</option>
                {(team.allowed_communities?.length ? team.allowed_communities : scenario.communities.map((item) => item.id)).map((community) => <option key={community} value={community}>{community}</option>)}
              </select>
            </label>
          ))}
        </div>
        {violations.length > 0 && <div className="mt-5 rounded-[var(--ds-radius-panel)] border border-rose-300/20 bg-rose-300/[0.06] p-4 text-sm text-rose-100">{violations.map((item) => <div key={item}>• {item}</div>)}</div>}
        {valid && !locked && <div className="mt-5 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" />{t.feasible}</div>}
        {locked && <div className="mt-5 flex items-center gap-2 text-sm text-slate-400"><LockKeyhole className="h-4 w-4" />{t.locked}</div>}
        <div className="mt-6 flex flex-wrap gap-3">
          {!locked && <button className="ds-button ds-button-secondary ds-button-md" disabled={validating || submitting} onClick={validate}>{validating ? t.validating : t.validate}</button>}
          {!locked && <button className="ds-button ds-button-primary ds-button-md" disabled={!valid || submitting} onClick={submit}><LockKeyhole className="h-4 w-4" />{submitting ? t.evaluating : t.lock}</button>}
          {run.status === 'FAILED' && <button className="ds-button ds-button-primary ds-button-md" disabled={submitting} onClick={retry}><RefreshCw className="h-4 w-4" />{submitting ? t.evaluating : t.retry}</button>}
          {locked && <button className="ds-button ds-button-secondary ds-button-md" disabled={submitting} onClick={() => void begin()}>{t.restart}</button>}
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}
      </section>

      {complete && result && (
        <>
          <section className="ds-card mt-6 p-6 sm:p-8" data-testid="challenge-comparison">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">03 · {t.comparison}</div>
            <h2 className="mt-2 text-2xl font-semibold">{t.comparison}</h2>
            {verdict ? (
              <p className="mt-3 text-sm text-slate-400">{verdict}</p>
            ) : (
              <p role="alert" className="mt-3 text-sm text-rose-200">
                Comparison unavailable: economic objective metadata is inconsistent.
              </p>
            )}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ValueCard label={t.human} value={formatChallengeMoney(result.human_economic_outcome.nominal_value, currency, locale)} />
              <ValueCard label={t.qdip} value={formatChallengeMoney(result.qdip_economic_outcome.nominal_value, currency, locale)} />
              <ValueCard label={t.delta} value={formatChallengeMoney(delta, currency, locale)} />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{t.noExpected}</p>
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              <AllocationCard title={t.human} allocation={allocation} />
              <AllocationCard title={t.qdip} allocation={result.qdip_action} />
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="ds-card p-6 sm:p-8">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">04 · {t.explanation}</div>
              <h2 className="mt-2 text-xl font-semibold">{t.explanation}</h2>
              <div className="mt-5 grid gap-3">
                {result.explanation.slice(0, 4).map((item, index) => <Explanation key={index} item={item} />)}
                {result.explanation.length === 0 && <p className="text-sm text-slate-500">—</p>}
              </div>
            </div>
            <div className="ds-card p-6 sm:p-8">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">05 · {t.evidence}</div>
              <h2 className="mt-2 text-xl font-semibold">{t.reproducible}</h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <Meta label={t.solver} value={`${result.reproducibility.solver} · ${result.reproducibility.solver_version}`} />
                <Meta label="Problem" value={result.problem_hash.slice(0, 16)} />
                <Meta label="Human action" value={result.human_action_hash.slice(0, 16)} />
                <Meta label="QDIP action" value={result.qdip_action_hash.slice(0, 16)} />
                <Meta label="Replay" value={result.reproducibility.reproducibility_token.slice(0, 16)} />
                <Meta label="Evidence" value={run.snapshot.evidence_revision.slice(0, 16)} />
                <Meta label="Economic model" value={run.snapshot.economic_model_hash.slice(0, 16)} />
                <Meta label="Model versions" value={run.snapshot.model_versions_hash.slice(0, 16)} />
                <Meta label="Evaluator" value={`${result.evaluation_reproducibility.evaluator_id} · ${result.evaluation_reproducibility.evaluator_version}`} />
                <Meta label="Evaluation context" value={result.evaluation_reproducibility.context_hash.slice(0, 16)} />
              </dl>
            </div>
          </section>

          <section className="ds-card mt-6 p-6 sm:p-8">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">06 · {t.limitations}</div>
            <div className="mt-4 grid gap-2 text-sm leading-6 text-slate-400">{definition.limitations.map((item) => <p key={item}>{item}</p>)}</div>
          </section>

          <section className="mt-6 rounded-[var(--ds-radius-panel)] border border-cyan-300/20 bg-cyan-300/[0.06] p-6 sm:p-8">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">07 · NEXT STEP</div>
            <h2 className="mt-2 text-2xl font-semibold">{t.ctaTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{t.ctaText}</p>
            <Link href={`${marketingHref(locale)}#decision`} onClick={() => void recordChallengeCta(run.id)} className="ds-button ds-button-primary ds-button-lg mt-5">{t.cta}<ArrowRight className="h-4 w-4" /></Link>
          </section>
        </>
      )}
    </main>
  )
}

function ValueCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.03] p-5"><div className="text-xs uppercase tracking-wider text-slate-500">{label}</div><div className="mt-2 text-2xl font-black">{value}</div></div>
}

function AllocationCard({ title, allocation }: { title: string; allocation: ChallengeAssignment }) {
  return <div className="rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.03] p-5"><h3 className="font-semibold">{title}</h3><div className="mt-4 grid gap-2">{Object.entries(allocation).map(([team, target]) => <div key={team} className="flex justify-between gap-4 border-t border-white/5 pt-2 text-sm"><span className="text-slate-400">{team}</span><b>{target ?? '—'}</b></div>)}</div></div>
}

function Explanation({ item }: { item: Record<string, unknown> }) {
  const team = String(item.team_id ?? item.team ?? 'Decision factor')
  const target = item.to == null ? '' : String(item.to)
  const services = Array.isArray(item.matched_services) ? item.matched_services.join(', ') : ''
  const priority = typeof item.priority_demand_units === 'number' ? item.priority_demand_units : null
  return <div className="rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.03] p-4"><div className="font-semibold">{team}{target ? ` → ${target}` : ''}</div><div className="mt-2 text-xs leading-5 text-slate-400">{services}{services && priority != null ? ' · ' : ''}{priority != null ? `priority demand: ${priority}` : ''}</div></div>
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[120px_1fr] gap-4 border-t border-white/5 pt-3"><dt className="text-slate-500">{label}</dt><dd className="font-mono break-all">{value}</dd></div>
}
