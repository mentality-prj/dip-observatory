'use client'

import { useState } from 'react'
import { Check, CircleAlert, Flag, Gauge, History, Save, X } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import type { EvaluatedManualAllocation } from './resource-allocation-manual-editor'

type CapacityRecommendation = {
  resource: string
  extra_team_equivalents: number
  added_capacity: number
  priority_coverage: number
  delta_priority_coverage: number
  marginal_gain: number
  diminishing_returns: boolean
  target_reached: boolean
}
type CapacityBottleneck = {
  resource: string
  priority_demand: number
  available_capacity: number
  capacity_shortfall: number
  first_increment_gain: number
  binding: boolean
}
type CapacityGap = {
  status: 'ok' | 'infeasible'
  operation: 'capacity_gap'
  current?: { priority_coverage?: number }
  target_priority_coverage?: number
  gap_to_target?: number
  target_status?: 'already_met' | 'gap'
  minimum_capacity_to_target?: CapacityRecommendation[]
  bottlenecks?: CapacityBottleneck[]
  marginal_scenarios?: CapacityRecommendation[]
}
type Feedback = {
  status: 'accepted' | 'modified' | 'rejected'
  reason?: string | null
  timestamp: string
  actor_id?: string
}
type Outcome = { recorded_at: string; actor_id?: string; notes?: string | null; metrics?: Record<string, number> }
type DecisionRecord = {
  decision_id: string
  status: 'proposed' | 'accepted' | 'modified' | 'rejected' | 'completed'
  created_at: string
  state_hash: string
  engine_version: string
  plugin_version: string
  feedback: Feedback[]
  outcomes: Outcome[]
}
type Lifecycle = { decisionId: string; status: string } | null
type Props = {
  input: Record<string, unknown>
  selected: Record<string, unknown>
  manualSelected?: EvaluatedManualAllocation | null
  priorityCoverage: number
  served: number
  unmet: number
  locale?: Locale
}

const copy = {
  uk: {
    capacity: 'ДЕФІЦИТ РЕСУРСІВ',
    capacityTitle: 'Яких ресурсів бракує для кращого результату?',
    analyze: 'Розрахувати потребу для 90% пріоритетного покриття',
    analyzing: 'Розрахунок…',
    infeasible: 'Для поточної операційної ситуації неможливо виконати аналіз доступної потужності.',
    gap: 'До цілі бракує',
    status: 'Стан',
    reached: 'Ціль досягнута',
    gapStatus: 'Є дефіцит',
    already: 'Поточне покриття пріоритетних потреб уже досягає 90%. Додаткові ресурси не потрібні.',
    notEnough:
      'Навіть протестоване додавання до трьох еквівалентів команди на кожну послугу не забезпечує 90%. Нижче показані обмеження, які стримують результат.',
    additions: 'Мінімальні протестовані додаткові ресурси для досягнення цілі',
    teamEq: 'екв. команди',
    capacityUnit: 'потужності',
    priority: 'Пріоритетне покриття',
    improvement: 'покращення',
    bottlenecks: 'Критичні дефіцити за послугами',
    demand: 'пріоритетний попит',
    available: 'доступна потужність',
    shortfall: 'дефіцит',
    firstTeam: 'від першого екв. команди',
    decision: 'РІШЕННЯ МЕНЕДЖЕРА',
    decisionTitle: 'Рекомендація → рішення → фактичний результат',
    staged: 'Перевірений ручний план підготовлено як рішення менеджера.',
    snapshot: 'Створити незмінний знімок рішення',
    snapshotBusy: 'Створення знімка…',
    decisionId: 'ID рішення',
    reason: 'Обґрунтування зміни або відхилення',
    accept: 'Прийняти план DIP',
    modify: 'Прийняти ручне коригування',
    alternative: 'Вибрати альтернативу',
    reject: 'Відхилити',
    outcomeNotes: 'Що відбулося фактично після виконання рішення',
    record: 'Зафіксувати фактичний результат',
    recording: 'Збереження…',
    completed: 'Рішення завершено.',
    completedText: 'Рекомендація DIP, дія менеджера та фактичний результат пов’язані в одному життєвому циклі рішення.',
    timeline: 'ІСТОРІЯ РІШЕННЯ',
    proposed: 'Рекомендацію зафіксовано',
    actual: 'Фактичний результат зафіксовано',
    actor: 'виконавець',
    engine: 'Версії',
    refresh: 'Оновити історію',
  },
  en: {
    capacity: 'CAPACITY GAP',
    capacityTitle: 'What additional capacity would improve the result?',
    analyze: 'Analyze capacity needed for 90% priority coverage',
    analyzing: 'Analyzing…',
    infeasible: 'Capacity analysis is infeasible for the current operational state.',
    gap: 'Gap to target',
    status: 'Status',
    reached: 'Target reached',
    gapStatus: 'Capacity gap',
    already: 'Current priority coverage already meets the 90% target. No additional capacity is required.',
    notEnough:
      'The tested additions of up to three team-equivalents per service do not reach 90%. Review the binding constraints below.',
    additions: 'Minimum tested additions that reach the target',
    teamEq: 'team eq.',
    capacityUnit: 'capacity',
    priority: 'Priority coverage',
    improvement: 'improvement',
    bottlenecks: 'Binding service bottlenecks',
    demand: 'priority demand',
    available: 'available capacity',
    shortfall: 'shortfall',
    firstTeam: 'from first team eq.',
    decision: 'HUMAN DECISION',
    decisionTitle: 'Recommendation → decision → actual outcome',
    staged: 'A feasible manager-edited plan is staged as the manager decision.',
    snapshot: 'Create immutable decision snapshot',
    snapshotBusy: 'Creating snapshot…',
    decisionId: 'Decision ID',
    reason: 'Reason for modification or rejection',
    accept: 'Accept DIP plan',
    modify: 'Approve manual modification',
    alternative: 'Use selected alternative',
    reject: 'Reject',
    outcomeNotes: 'What actually happened after the decision was executed',
    record: 'Record actual outcome',
    recording: 'Recording…',
    completed: 'Decision completed.',
    completedText: 'The DIP recommendation, manager action and actual outcome are linked in one decision lifecycle.',
    timeline: 'DECISION HISTORY',
    proposed: 'Recommendation captured',
    actual: 'Actual outcome recorded',
    actor: 'actor',
    engine: 'Versions',
    refresh: 'Refresh history',
  },
  pl: {
    capacity: 'DEFICYT ZASOBÓW',
    capacityTitle: 'Jakich zasobów brakuje, aby poprawić wynik?',
    analyze: 'Oblicz potrzeby dla 90% pokrycia priorytetów',
    analyzing: 'Analiza…',
    infeasible: 'Dla bieżącej sytuacji operacyjnej nie można wykonać analizy dostępnej zdolności.',
    gap: 'Brak do celu',
    status: 'Stan',
    reached: 'Cel osiągnięty',
    gapStatus: 'Deficyt zasobów',
    already: 'Bieżące pokrycie potrzeb priorytetowych osiąga już 90%. Dodatkowe zasoby nie są wymagane.',
    notEnough:
      'Nawet testowane dodanie do trzech ekwiwalentów zespołu na usługę nie zapewnia 90%. Poniżej pokazano ograniczenia blokujące wynik.',
    additions: 'Minimalne testowane dodatkowe zasoby potrzebne do osiągnięcia celu',
    teamEq: 'ekw. zespołu',
    capacityUnit: 'zdolności',
    priority: 'Pokrycie priorytetów',
    improvement: 'poprawa',
    bottlenecks: 'Krytyczne deficyty według usług',
    demand: 'popyt priorytetowy',
    available: 'dostępna zdolność',
    shortfall: 'deficyt',
    firstTeam: 'od pierwszego ekw. zespołu',
    decision: 'DECYZJA MENEDŻERA',
    decisionTitle: 'Rekomendacja → decyzja → wynik rzeczywisty',
    staged: 'Zweryfikowany plan ręczny przygotowano jako decyzję menedżera.',
    snapshot: 'Utwórz niezmienny zapis decyzji',
    snapshotBusy: 'Tworzenie zapisu…',
    decisionId: 'ID decyzji',
    reason: 'Uzasadnienie zmiany lub odrzucenia',
    accept: 'Zaakceptuj plan DIP',
    modify: 'Zaakceptuj korektę ręczną',
    alternative: 'Wybierz alternatywę',
    reject: 'Odrzuć',
    outcomeNotes: 'Co faktycznie wydarzyło się po wykonaniu decyzji',
    record: 'Zapisz rzeczywisty wynik',
    recording: 'Zapisywanie…',
    completed: 'Decyzja zakończona.',
    completedText:
      'Rekomendacja DIP, działanie menedżera i rzeczywisty wynik są połączone w jednym cyklu życia decyzji.',
    timeline: 'HISTORIA DECYZJI',
    proposed: 'Rekomendacja zapisana',
    actual: 'Wynik rzeczywisty zapisany',
    actor: 'wykonawca',
    engine: 'Wersje',
    refresh: 'Odśwież historię',
  },
} as const

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  })
  const payload = await response.json()
  if (!response.ok) {
    const detail = typeof payload.detail === 'string' ? payload.detail : payload.detail?.message
    throw new Error(payload.error ?? detail ?? `Request failed (${response.status})`)
  }
  return payload
}
async function post(path: string, body: Record<string, unknown>) {
  return requestJson(path, { method: 'POST', body: JSON.stringify(body) })
}
function formatTimestamp(value: string, locale: Locale) {
  const language = locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-GB'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
function recommendedAllocation(selected: Record<string, unknown>): Record<string, unknown> {
  const daily = Array.isArray(selected.daily) ? selected.daily : []
  return {
    daily: daily.map((item) => {
      const day = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {}
      const recommended =
        typeof day.recommended === 'object' && day.recommended !== null
          ? (day.recommended as Record<string, unknown>)
          : {}
      return { day: day.day, assignments: recommended.assignments ?? {} }
    }),
  }
}

export function ResourceAllocationDecisionPanel({
  input,
  selected,
  manualSelected,
  priorityCoverage,
  served,
  unmet,
  locale = 'uk',
}: Props) {
  const t = copy[locale]
  const [capacity, setCapacity] = useState<CapacityGap | null>(null)
  const [lifecycle, setLifecycle] = useState<Lifecycle>(null)
  const [record, setRecord] = useState<DecisionRecord | null>(null)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  async function loadDecision(decisionId: string) {
    const payload = (await requestJson(
      `/api/resource-allocation/decisions/${encodeURIComponent(decisionId)}`
    )) as DecisionRecord
    setRecord(payload)
    setLifecycle({ decisionId: payload.decision_id, status: payload.status })
    return payload
  }
  async function capacityGap() {
    setBusy('capacity')
    setError(null)
    try {
      setCapacity(await post('/api/resource-allocation/capacity-gap', { ...input, target_priority_coverage: 0.9 }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capacity analysis failed')
    } finally {
      setBusy(null)
    }
  }
  async function persist() {
    setBusy('persist')
    setError(null)
    try {
      const payload = await post('/api/resource-allocation/decisions', input)
      await loadDecision(payload.decision_id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decision persistence failed')
    } finally {
      setBusy(null)
    }
  }
  async function feedback(status: 'accepted' | 'modified' | 'rejected') {
    if (!lifecycle) return
    if ((status === 'modified' || status === 'rejected') && !reason.trim()) {
      setError(t.reason)
      return
    }
    setBusy(status)
    setError(null)
    try {
      const body: Record<string, unknown> = { status }
      if (status === 'modified') {
        body.reason = reason.trim()
        body.selected = manualSelected
          ? {
              daily: Object.entries(manualSelected.actual_allocation).map(([day, assignments]) => ({
                day,
                assignments,
              })),
              metrics: manualSelected.metrics,
            }
          : selected
      }
      if (status === 'rejected') body.reason = reason.trim()
      await post(`/api/resource-allocation/decisions/${encodeURIComponent(lifecycle.decisionId)}/feedback`, body)
      await loadDecision(lifecycle.decisionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decision update failed')
    } finally {
      setBusy(null)
    }
  }
  async function outcome() {
    if (!lifecycle) return
    setBusy('outcome')
    setError(null)
    try {
      const actualAllocation = manualSelected?.actual_allocation ?? recommendedAllocation(selected)
      const outcomeMetrics = manualSelected?.metrics ?? {
        priority_coverage: priorityCoverage,
        served,
        closing_unmet: unmet,
      }
      await post(`/api/resource-allocation/decisions/${encodeURIComponent(lifecycle.decisionId)}/outcomes`, {
        actual_allocation: actualAllocation,
        metrics: outcomeMetrics,
        notes: notes || undefined,
      })
      await loadDecision(lifecycle.decisionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Outcome recording failed')
    } finally {
      setBusy(null)
    }
  }
  async function refresh() {
    if (!lifecycle) return
    setBusy('refresh')
    setError(null)
    try {
      await loadDecision(lifecycle.decisionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decision refresh failed')
    } finally {
      setBusy(null)
    }
  }
  const recommendations = capacity?.minimum_capacity_to_target ?? []
  const bindingBottlenecks = capacity?.bottlenecks?.filter((item) => item.binding) ?? []
  const status = record?.status ?? lifecycle?.status
  return (
    <div className="grid min-w-0 max-w-full gap-5 xl:grid-cols-2">
      <section className="min-w-0 max-w-full overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-slate-950/70 p-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-300">08 · {t.capacity}</div>
            <h3 className="mt-2 text-xl font-black">{t.capacityTitle}</h3>
          </div>
          <Gauge className="h-6 w-6" />
        </div>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={capacityGap}
          className="mt-5 border border-white/25 px-4 py-3 text-sm font-bold disabled:opacity-40"
        >
          {busy === 'capacity' ? t.analyzing : t.analyze}
        </button>
        {capacity && (
          <div className="mt-5 space-y-4 text-sm">
            {capacity.status === 'infeasible' ? (
              <div className="border border-rose-300/40 p-4 text-rose-200">{t.infeasible}</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-white/15 p-3">
                    <span className="text-white/50">{t.gap}</span>
                    <b className="mt-1 block text-xl">{Math.round((capacity.gap_to_target ?? 0) * 100)} pp</b>
                  </div>
                  <div className="border border-white/15 p-3">
                    <span className="text-white/50">{t.status}</span>
                    <b className="mt-1 block text-xl">
                      {capacity.target_status === 'already_met' ? t.reached : t.gapStatus}
                    </b>
                  </div>
                </div>
                {capacity.target_status === 'already_met' && (
                  <div className="border-l-2 border-emerald-400 pl-3">{t.already}</div>
                )}
                {capacity.target_status === 'gap' && recommendations.length === 0 && (
                  <div className="border-l-2 border-amber-300 pl-3">{t.notEnough}</div>
                )}
                {recommendations.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{t.additions}</div>
                    <div className="space-y-2">
                      {recommendations.map((item) => (
                        <div key={`${item.resource}-${item.added_capacity}`} className="border border-white/15 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <b>{item.resource}</b>
                            <span>
                              +{item.extra_team_equivalents} {t.teamEq} · +{item.added_capacity.toFixed(0)}{' '}
                              {t.capacityUnit}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-white/50">
                            {t.priority} {Math.round(item.priority_coverage * 100)}% · {t.improvement} +
                            {(item.delta_priority_coverage * 100).toFixed(1)} pp
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {bindingBottlenecks.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{t.bottlenecks}</div>
                    {bindingBottlenecks.slice(0, 4).map((item) => (
                      <div
                        key={item.resource}
                        className="grid grid-cols-[1fr_auto] gap-3 border-t border-white/10 py-2"
                      >
                        <span>
                          {item.resource}
                          <span className="block text-xs text-white/45">
                            {t.demand} {item.priority_demand.toFixed(0)} · {t.available}{' '}
                            {item.available_capacity.toFixed(0)}
                          </span>
                        </span>
                        <b className="text-right">
                          {t.shortfall} {item.capacity_shortfall.toFixed(0)}
                          <span className="block text-xs font-normal text-white/45">
                            +{(item.first_increment_gain * 100).toFixed(1)} pp {t.firstTeam}
                          </span>
                        </b>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
      <section className="min-w-0 max-w-full overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs font-bold uppercase tracking-wider text-rose-300">09 · {t.decision}</div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-black">{t.decisionTitle}</h3>
          {status && <span className="border border-white/10 px-3 py-1 text-xs font-bold uppercase">{status}</span>}
        </div>
        {manualSelected && !lifecycle && (
          <div className="mt-4 border-l-2 border-rose-300/40 pl-3 text-sm">{t.staged}</div>
        )}
        {!lifecycle ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={persist}
            className="mt-5 flex items-center gap-2 bg-slate-950/70 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            {busy === 'persist' ? t.snapshotBusy : t.snapshot}
          </button>
        ) : (
          <>
            <div className="mt-4 text-xs text-slate-500">
              {t.decisionId} · {lifecycle.decisionId}
            </div>
            {status === 'proposed' && (
              <>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={t.reason}
                  className="mt-4 min-h-20 w-full border border-white/15 p-3 text-sm"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => feedback('accepted')}
                    disabled={Boolean(busy)}
                    className="flex items-center gap-2 bg-slate-950/70 px-4 py-3 text-sm font-bold text-white"
                  >
                    <Check className="h-4 w-4" />
                    {t.accept}
                  </button>
                  <button
                    type="button"
                    onClick={() => feedback('modified')}
                    disabled={Boolean(busy) || (!manualSelected && !selected)}
                    className="border border-white/20 px-4 py-3 text-sm font-bold"
                  >
                    {manualSelected ? t.modify : t.alternative}
                  </button>
                  <button
                    type="button"
                    onClick={() => feedback('rejected')}
                    disabled={Boolean(busy)}
                    className="flex items-center gap-2 border border-rose-300/35 px-4 py-3 text-sm font-bold text-rose-200"
                  >
                    <X className="h-4 w-4" />
                    {t.reject}
                  </button>
                </div>
              </>
            )}
            {status && ['accepted', 'modified', 'rejected'].includes(status) && (
              <>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t.outcomeNotes}
                  className="mt-4 min-h-20 w-full border border-white/15 p-3 text-sm"
                />
                <button
                  type="button"
                  onClick={outcome}
                  disabled={Boolean(busy)}
                  className="mt-3 flex items-center gap-2 bg-rose-500 px-4 py-3 text-sm font-bold text-white"
                >
                  <Flag className="h-4 w-4" />
                  {busy === 'outcome' ? t.recording : t.record}
                </button>
              </>
            )}
            {status === 'completed' && (
              <div className="mt-5 border-l-2 border-emerald-400 pl-3 text-sm">
                <b>{t.completed}</b>
                <div className="text-slate-500">{t.completedText}</div>
              </div>
            )}
            {record && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <History className="h-4 w-4 text-rose-300" />
                    {t.timeline}
                  </div>
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={Boolean(busy)}
                    className="text-xs font-bold text-slate-500 hover:text-white"
                  >
                    {t.refresh}
                  </button>
                </div>
                <div className="mt-4 space-y-4 border-l border-white/15 pl-4">
                  <TimelineItem
                    title={t.proposed}
                    time={formatTimestamp(record.created_at, locale)}
                    meta={`${t.engine}: ${record.engine_version} · ${record.plugin_version} · ${record.state_hash.slice(0, 10)}`}
                  />
                  {record.feedback.map((item, index) => (
                    <TimelineItem
                      key={`${item.timestamp}-${index}`}
                      title={item.status.toUpperCase()}
                      time={formatTimestamp(item.timestamp, locale)}
                      meta={[item.actor_id ? `${t.actor}: ${item.actor_id}` : null, item.reason]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  ))}
                  {record.outcomes.map((item, index) => (
                    <TimelineItem
                      key={`${item.recorded_at}-${index}`}
                      title={t.actual}
                      time={formatTimestamp(item.recorded_at, locale)}
                      meta={[item.actor_id ? `${t.actor}: ${item.actor_id}` : null, item.notes]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {error && (
          <div role="alert" className="mt-4 border border-rose-300/25 bg-rose-300/10 p-3 text-sm text-rose-200">
            <CircleAlert className="mr-2 inline h-4 w-4" />
            {error}
          </div>
        )}
      </section>
    </div>
  )
}
function TimelineItem({ title, time, meta }: { title: string; time: string; meta?: string }) {
  return (
    <div className="relative">
      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-slate-950" />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <b className="text-sm">{title}</b>
        <span className="text-xs text-slate-600">{time}</span>
      </div>
      {meta && <div className="mt-1 text-xs text-slate-500">{meta}</div>}
    </div>
  )
}
