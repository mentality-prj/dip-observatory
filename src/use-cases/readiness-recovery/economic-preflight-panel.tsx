'use client'

import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@/lib/observatory-i18n'
import {
  economicRequestDecisionId,
  isRREconomicPreflight,
  type RREconomicPreflight,
} from './economic-preflight-contract'

type EconomicAdvice = {
  schema_version: 'readiness-recovery.economic-advisory.v2'
  snapshot_id: string
  snapshot_digest: string
  execution_id: string
  decision_id: string
  status: string
  modeled_net_incremental_cents: string | null
  scheduled_jobs: { job_id: string; technician_id: string; start_slot: number; finish_slot: number }[]
  selected_procurement_ids: string[]
  scheduled_donors: { donor_id: string; start_slot: number; finish_slot: number }[]
  actionable: false
  supply_source_verified: false
  atomic_plan_committed: false
}
function economicSnapshotId(doc: unknown): string | null {
  if (!doc || typeof doc !== 'object' || !('snapshot_id' in doc)) return null
  const id = doc.snapshot_id
  return typeof id === 'string' && /^[A-Za-z0-9_.-]{1,128}$/.test(id) ? id : null
}
function isEconomicAdvice(value: unknown): value is EconomicAdvice {
  if (!value || typeof value !== 'object') return false
  const a = value as Partial<EconomicAdvice>
  const goodId = (id: unknown) => typeof id === 'string' && /^[A-Za-z0-9_.-]{1,128}$/.test(id)
  return (
    a.schema_version === 'readiness-recovery.economic-advisory.v2' &&
    a.actionable === false && a.supply_source_verified === false &&
    a.atomic_plan_committed === false &&
    goodId(a.snapshot_id) && goodId(a.execution_id) &&
    /^[0-9a-f]{64}$/.test(a.snapshot_digest ?? '') &&
    typeof a.decision_id === 'string' && typeof a.status === 'string' &&
    (a.modeled_net_incremental_cents === null ||
      (typeof a.modeled_net_incremental_cents === 'string' &&
        /^-?\d+(?:\.\d+)?$/.test(a.modeled_net_incremental_cents))) &&
    Array.isArray(a.scheduled_jobs) && a.scheduled_jobs.length <= 2500 &&
    a.scheduled_jobs.every(job => !!job && goodId(job.job_id) && goodId(job.technician_id) &&
      Number.isSafeInteger(job.start_slot) && Number.isSafeInteger(job.finish_slot) &&
      job.finish_slot > job.start_slot) &&
    Array.isArray(a.selected_procurement_ids) && a.selected_procurement_ids.length <= 32 &&
    a.selected_procurement_ids.every(goodId) &&
    Array.isArray(a.scheduled_donors) && a.scheduled_donors.length <= 128 &&
    a.scheduled_donors.every(donor => !!donor && goodId(donor.donor_id) &&
      Number.isSafeInteger(donor.start_slot) && Number.isSafeInteger(donor.finish_slot) &&
      donor.finish_slot > donor.start_slot)
  )
}
type EconomicAdviceSummary = {
  execution_id: string
  snapshot_id: string
  snapshot_digest: string
  status: string
  modeled_net_incremental_cents: string | null
  created_at: string
}
function isAdviceSummary(item: unknown): item is EconomicAdviceSummary {
  if (!item || typeof item !== 'object') return false
  const x = item as Partial<EconomicAdviceSummary>
  return (
    typeof x.execution_id === 'string' && /^[A-Za-z0-9_.-]{1,128}$/.test(x.execution_id) &&
    typeof x.snapshot_id === 'string' && /^[A-Za-z0-9_.-]{1,128}$/.test(x.snapshot_id) &&
    typeof x.snapshot_digest === 'string' && /^[a-f0-9]{64}$/.test(x.snapshot_digest) &&
    typeof x.status === 'string' && typeof x.created_at === 'string' &&
    (x.modeled_net_incremental_cents === null ||
      (typeof x.modeled_net_incremental_cents === 'string' &&
        /^-?\d+(?:\.\d+)?$/.test(x.modeled_net_incremental_cents)))
  )
}
const copy = {
  en: {
    archiveList: 'Archive history',
    archiveNext: 'More archived results',
    find: 'Load archived advice',
    archiveId: 'Archived advice execution ID',
    run: 'Solve and archive non-actionable advice',
    running: 'Solving with frozen Kernel…',
    solved: 'Operator-submitted economic advice',
    net: 'Modeled change against no-action (EUR cents)',
    noResult: 'No feasible schedule is certified for this solver status.',
    jobsAdvice: 'Recommended repair slots',
    suppliers: 'Chosen purchase offers',
    partsDonors: 'Scheduled donor disassembly',
    adviceWarning: 'Modeled, non-actionable advice. Real inventory, prices and external purchases are not verified or reserved.',
    title: 'Economic RR v2 — optimization advice',
    note: 'Validate a versioned RREconomicInput, then compute and archive a CP-SAT schedule and modeled contribution. No external purchase or stock reservation occurs.',
    input: 'RR-ECON-v2 JSON',
    submit: 'Validate in Core (no execution)',
    pending: 'Checking Core contract…',
    invalid: 'Provide a valid RREconomicInput JSON with operational.decision_id.',
    incompatible: 'Core returned an incompatible or mismatched economic preflight.',
    unauthenticated: 'Your RR operator session is no longer authorized.',
    rejected: 'Core rejected this economic input.',
    unavailable: 'Core economic preflight is unavailable.',
    result: 'Core compiled preview only',
    jobs: 'Jobs',
    assets: 'Assets',
    purchases: 'Offers',
    donors: 'Donor extractions',
    hash: 'Semantic hash',
    warning:
      'NOT ACTIONABLE. Source inventory/quotes not verified. No solver result, order, plan commit or commercial advantage.',
  },
  uk: {
    archiveList: 'Архів рекомендацій',
    archiveNext: 'Завантажити ще',
    find: 'Відкрити збережену рекомендацію',
    archiveId: 'ID збереженої рекомендації',
    run: 'Розрахувати і зберегти рекомендацію',
    running: 'Оптимізація через заморожений Kernel…',
    solved: 'Економічна рекомендація за даними оператора',
    net: 'Модельована зміна проти бездіяльності (євроценти)',
    noResult: 'Для цього статусу solver немає підтвердженого допустимого розкладу.',
    jobsAdvice: 'Рекомендовані роботи',
    suppliers: 'Обрані закупівельні пропозиції',
    partsDonors: 'Розбирання донорів',
    adviceWarning: 'Це модельована рекомендація, не дозвіл на дію. Реальні склад, ціни й закупівлі не перевірені та не зарезервовані.',
    title: 'Економічний RR v2 — оптимізаційна рекомендація',
    note: 'Перевірте RREconomicInput, потім отримайте й збережіть оптимізаційний розклад CP-SAT та модельовану вигоду. Закупівлі й резервування складу не виконуються.',
    input: 'JSON RR-ECON-v2',
    submit: 'Перевірити в Core (без виконання)',
    pending: 'Перевірка контракту Core…',
    invalid: 'Вкажіть коректний JSON RREconomicInput з operational.decision_id.',
    incompatible: 'Core повернув несумісний або невідповідний economic preflight.',
    unauthenticated: 'Сесія оператора RR більше не авторизована.',
    rejected: 'Core відхилив економічні вхідні дані.',
    unavailable: 'Економічна перевірка Core недоступна.',
    result: 'Лише компіляція Core',
    jobs: 'Роботи',
    assets: 'Активи',
    purchases: 'Пропозиції',
    donors: 'Вилучення донорів',
    hash: 'Семантичний хеш',
    warning:
      'НЕ Є ДОЗВОЛОМ НА ДІЮ. Склад і ціни не підтверджено; немає рішення solver, закупівлі, збереженого плану або доведеної економічної переваги.',
  },
  pl: {
    archiveList: 'Archiwum rekomendacji',
    archiveNext: 'Więcej wyników',
    find: 'Wczytaj zapisaną rekomendację',
    archiveId: 'ID zapisanej rekomendacji',
    run: 'Oblicz i zapisz rekomendację',
    running: 'Rozwiązywanie przez zamrożony Kernel…',
    solved: 'Rekomendacja ekonomiczna z danych operatora',
    net: 'Modelowana zmiana względem braku działania (eurocenty)',
    noResult: 'Dla tego statusu nie ma potwierdzonego wykonalnego harmonogramu.',
    jobsAdvice: 'Zalecane zadania',
    suppliers: 'Wybrane oferty zakupu',
    partsDonors: 'Demontaż dawców',
    adviceWarning: 'Porada modelowa, niewykonalna automatycznie. Rzeczywisty stan zapasów, ceny i zakupy nie są zweryfikowane ani zarezerwowane.',
    title: 'Ekonomiczne RR v2 — rekomendacja optymalizacyjna',
    note: 'Sprawdź RREconomicInput, a następnie oblicz i zapisz harmonogram CP-SAT oraz modelowaną korzyść. Bez rzeczywistych zakupów ani rezerwacji zapasów.',
    input: 'JSON RR-ECON-v2',
    submit: 'Sprawdź w Core (bez wykonania)',
    pending: 'Sprawdzanie kontraktu Core…',
    invalid: 'Podaj poprawny JSON RREconomicInput z operational.decision_id.',
    incompatible: 'Core zwrócił niezgodny lub niedopasowany podgląd.',
    unauthenticated: 'Sesja operatora RR nie jest już autoryzowana.',
    rejected: 'Core odrzucił dane ekonomiczne.',
    unavailable: 'Podgląd ekonomiczny Core jest niedostępny.',
    result: 'Tylko kompilacja Core',
    jobs: 'Zadania',
    assets: 'Zasoby',
    purchases: 'Oferty',
    donors: 'Części z dawców',
    hash: 'Hash semantyczny',
    warning:
      'NIE POZWALA NA DZIAŁANIE. Stany i oferty niezweryfikowane; brak wyniku solvera, zamówienia, zatwierdzonego planu i dowodu korzyści ekonomicznej.',
  },
} as const

export function RREconomicPreflightPanel({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [input, setInput] = useState('')
  const [result, setResult] = useState<RREconomicPreflight | null>(null)
  const [advice, setAdvice] = useState<EconomicAdvice | null>(null)
  const [archiveExecutionId, setArchiveExecutionId] = useState('')
  const [archiveEntries, setArchiveEntries] = useState<EconomicAdviceSummary[]>([])
  const [archiveCursor, setArchiveCursor] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const revision = useRef(0)
  const pending = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      revision.current += 1
      pending.current?.abort()
    },
    []
  )

  function changeInput(value: string) {
    revision.current += 1
    pending.current?.abort()
    setInput(value)
    setResult(null)
    setAdvice(null)
    setError('')
    setBusy(false)
  }

  async function validate() {
    const current = ++revision.current
    pending.current?.abort()
    setResult(null)
    setAdvice(null)
    setError('')
    let document: unknown
    try {
      if (new TextEncoder().encode(input).length > 2_150_000) throw new Error(t.invalid)
      document = JSON.parse(input) as unknown
      if (!economicRequestDecisionId(document)) throw new Error(t.invalid)
    } catch {
      setError(t.invalid)
      return
    }
    const expected = economicRequestDecisionId(document)
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    try {
      const response = await fetch('/api/rr-operator/kernel/economic-v2/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: input,
        cache: 'no-store',
        signal: controller.signal,
      })
      if (controller.signal.aborted || current !== revision.current) return
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error(t.unauthenticated)
        if (response.status === 422 || response.status === 413) throw new Error(t.rejected)
        throw new Error(t.unavailable)
      }
      const value: unknown = await response.json()
      if (controller.signal.aborted || current !== revision.current) return
      if (!isRREconomicPreflight(value) || value.decision_id !== expected) throw new Error(t.incompatible)
      setResult(value)
    } catch (reason) {
      if (controller.signal.aborted || current !== revision.current) return
      setError(reason instanceof Error ? reason.message : t.unavailable)
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }


  async function solveAdvice() {
    const current = ++revision.current
    pending.current?.abort()
    setAdvice(null)
    setError('')
    let doc: unknown
    try {
      if (new TextEncoder().encode(input).length > 2_150_000) throw new Error(t.invalid)
      doc = JSON.parse(input) as unknown
      if (!economicRequestDecisionId(doc) || !economicSnapshotId(doc)) throw new Error(t.invalid)
      if (!result || result.decision_id !== economicRequestDecisionId(doc)) throw new Error(t.invalid)
    } catch {
      setError(t.invalid)
      return
    }
    const snapshotId = economicSnapshotId(doc)
    if (!snapshotId) return
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    try {
      const source = await fetch('/api/rr-operator/kernel/economic-v2/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: input,
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!source.ok) throw new Error(
        source.status === 401 || source.status === 403 ? t.unauthenticated : t.rejected
      )
      const registered: unknown = await source.json()
      if (!registered || typeof registered !== 'object' ||
        !('snapshot_id' in registered) || registered.snapshot_id !== snapshotId ||
        !('actionable' in registered) || registered.actionable !== false ||
        !('input_digest' in registered) || typeof registered.input_digest !== 'string' ||
        !/^[0-9a-f]{64}$/.test(registered.input_digest)) {
        throw new Error(t.incompatible)
      }
      if (controller.signal.aborted || current !== revision.current) return
      const executionId = 'rr-advice-' + crypto.randomUUID().replace(/-/g, '').slice(0, 20)
      const response = await fetch('/api/rr-operator/kernel/economic-v2/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot_id: snapshotId, execution_id: executionId }),
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(
        response.status === 401 || response.status === 403 ? t.unauthenticated : t.rejected
      )
      const value: unknown = await response.json()
      if (controller.signal.aborted || current !== revision.current) return
      if (!isEconomicAdvice(value) ||
        value.execution_id !== executionId ||
        value.snapshot_id !== snapshotId ||
        value.snapshot_digest !== registered.input_digest ||
        value.decision_id !== economicRequestDecisionId(doc)) throw new Error(t.incompatible)
      setAdvice(value)
      setArchiveExecutionId(value.execution_id)
    } catch (reason) {
      if (controller.signal.aborted || current !== revision.current) return
      setError(reason instanceof Error ? reason.message : t.unavailable)
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }


  async function loadArchivedAdvice() {
    if (!/^[A-Za-z0-9_.-]{1,128}$/.test(archiveExecutionId)) {
      setError(t.invalid)
      return
    }
    const current = ++revision.current
    pending.current?.abort()
    setAdvice(null)
    setError('')
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    try {
      const response = await fetch(
        '/api/rr-operator/kernel/economic-v2/advice/' + encodeURIComponent(archiveExecutionId),
        { cache: 'no-store', signal: controller.signal }
      )
      if (!response.ok) throw new Error(
        response.status === 401 || response.status === 403 ? t.unauthenticated : t.unavailable
      )
      const value: unknown = await response.json()
      if (controller.signal.aborted || current !== revision.current) return
      if (!isEconomicAdvice(value) || value.execution_id !== archiveExecutionId)
        throw new Error(t.incompatible)
      setAdvice(value)
    } catch (reason) {
      if (controller.signal.aborted || current !== revision.current) return
      setError(reason instanceof Error ? reason.message : t.unavailable)
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }


  async function loadArchiveList(continueFromCursor = false) {
    const current = ++revision.current
    pending.current?.abort()
    setError('')
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    try {
      const params = new URLSearchParams({ limit: '25' })
      if (continueFromCursor && archiveCursor) params.set('cursor', archiveCursor)
      const response = await fetch(
        '/api/rr-operator/kernel/economic-v2/advice?' + params.toString(),
        { cache: 'no-store', signal: controller.signal }
      )
      if (!response.ok) throw new Error(
        response.status === 401 || response.status === 403 ? t.unauthenticated : t.unavailable
      )
      const data: unknown = await response.json()
      if (controller.signal.aborted || current !== revision.current) return
      if (!data || typeof data !== 'object' || !('schema_version' in data) ||
        data.schema_version !== 'readiness-recovery.economic-advice-list.v2' ||
        !('entries' in data) || !Array.isArray(data.entries) || data.entries.length > 25 ||
        !data.entries.every(isAdviceSummary) ||
        !('next_cursor' in data) ||
        !(data.next_cursor === null ||
          (typeof data.next_cursor === 'string' &&
          /^[A-Za-z0-9_.-]{1,128}$/.test(data.next_cursor)))) {
        throw new Error(t.incompatible)
      }
      const next = data.next_cursor as string | null
      if (continueFromCursor && next && next === archiveCursor) throw new Error(t.incompatible)
      const rows = data.entries as EconomicAdviceSummary[]
      setArchiveEntries(previous => continueFromCursor ? [...previous, ...rows] : rows)
      setArchiveCursor(next)
    } catch (reason) {
      if (controller.signal.aborted || current !== revision.current) return
      setError(reason instanceof Error ? reason.message : t.unavailable)
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }

  return (
    <section data-testid="rr-economic-v2-preflight" className="mt-6 border border-sky-400/20 p-4" aria-label={t.title}>
      <h3 className="font-semibold text-sky-200">{t.title}</h3>
      <p className="mt-2 text-xs leading-6 text-slate-300">{t.note}</p>
      <label className="mt-3 block text-sm" htmlFor="rr-economic-v2-json">
        {t.input}
      </label>
      <textarea
        id="rr-economic-v2-json"
        value={input}
        onChange={(event) => changeInput(event.target.value)}
        rows={6}
        spellCheck={false}
        className="mt-1 w-full border border-white/20 bg-slate-950 p-3 font-mono text-xs"
      />
      <button
        type="button"
        disabled={busy || !input.trim()}
        onClick={() => void validate()}
        className="mt-3 border border-sky-300 px-3 py-2 text-sm disabled:opacity-40"
      >
        {busy ? t.pending : t.submit}
      </button>
      {result ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void solveAdvice()}
          className="mt-3 ml-2 border border-sky-300 px-3 py-2 text-sm disabled:opacity-40"
          data-testid="rr-economic-v2-advise"
        >
          {busy ? t.running : t.run}
        </button>
      ) : null}
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="block text-sm">
          {t.archiveId}
          <input
            value={archiveExecutionId}
            onChange={(event) => {
              setArchiveExecutionId(event.target.value)
              setAdvice(null)
            }}
            className="mt-1 block border border-white/20 bg-slate-950 p-2 font-mono text-xs"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          disabled={busy || !/^[A-Za-z0-9_.-]{1,128}$/.test(archiveExecutionId)}
          onClick={() => void loadArchivedAdvice()}
          className="border border-white/20 px-3 py-2 text-sm disabled:opacity-40"
          data-testid="rr-economic-v2-load-advice"
        >
          {t.find}
        </button>
      </div>
      <div className="mt-4 border border-white/15 p-3" data-testid="rr-economic-v2-archive">
        <button
          type="button"
          disabled={busy}
          onClick={() => void loadArchiveList()}
          className="border border-white/20 px-3 py-2 text-sm disabled:opacity-40"
          data-testid="rr-economic-v2-list-advice"
        >
          {t.archiveList}
        </button>
        {archiveEntries.length > 0 ? (
          <ul className="mt-3 space-y-2 text-xs">
            {archiveEntries.map((item) => (
              <li key={item.execution_id} className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="text-sky-200 underline"
                  onClick={() => { setArchiveExecutionId(item.execution_id); setAdvice(null) }}
                >
                  {item.execution_id}
                </button>
                <span>{item.status} · {item.modeled_net_incremental_cents ?? 'N/A'}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {archiveCursor ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadArchiveList(true)}
            className="mt-3 border border-white/20 px-3 py-2 text-xs disabled:opacity-40"
          >
            {t.archiveNext}
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="mt-4 text-sm" data-testid="rr-economic-v2-result" data-actionable="false">
          <p className="font-semibold">{t.result}</p>
          <p className="mt-2">
            {t.jobs}: {result.job_count} · {t.assets}: {result.asset_count} ·{t.purchases}:{' '}
            {result.procurement_offer_count} · {t.donors}: {result.donor_extraction_count}
          </p>
          <p className="mt-2 break-all font-mono text-xs">
            {t.hash}: {result.ir_semantic_hash}
          </p>
        </div>
      ) : null}
      {advice ? (
        <div className="mt-4 border border-white/20 p-3 text-sm" data-testid="rr-economic-v2-advice" data-actionable="false">
          <h4 className="font-semibold">{t.solved}</h4>
          <p className="mt-2">Status: {advice.status} · {t.net}: {advice.modeled_net_incremental_cents ?? 'N/A'}</p>
          <p className="mt-2">{t.jobsAdvice}</p>
          {advice.scheduled_jobs.length === 0 ? <p>{t.noResult}</p> : (
            <ul className="list-disc pl-5">
              {advice.scheduled_jobs.map((job) => (
                <li key={job.job_id + job.start_slot}>
                  {job.job_id}: {job.technician_id} · {job.start_slot}–{job.finish_slot}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2">{t.suppliers}: {advice.selected_procurement_ids.join(', ') || '—'}</p>
          <p className="mt-2">{t.partsDonors}: {advice.scheduled_donors.map(
            (donor) => donor.donor_id + ' (' + donor.start_slot + '–' + donor.finish_slot + ')'
          ).join(', ') || '—'}</p>
          <p className="mt-2 break-all font-mono text-xs">Snapshot: {advice.snapshot_id} · {advice.snapshot_digest}</p>
          <p className="mt-2 text-xs text-amber-200">{t.adviceWarning}</p>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-amber-200" data-testid="rr-economic-v2-warning">
        {advice ? t.adviceWarning : t.warning}
      </p>
    </section>
  )
}
