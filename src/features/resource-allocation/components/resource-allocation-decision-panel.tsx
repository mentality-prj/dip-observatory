'use client'

import { useState } from 'react'
import { Check, CircleAlert, Clipboard, Download, Flag, Gauge, History, X } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import type { EvaluatedManualAllocation } from './resource-allocation-manual-editor'
import { localizeService, trackResourceAllocation } from '../presentation'

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
  teamsMoved: number
  totalTeams: number
  moveEvents: number
  planningDays: number
  planCsv?: string
  exportFileName?: string
  selectionKind?: 'recommended' | 'alternative'
  locale?: Locale
}

const copy = {
  uk: {
    capacity: 'ЧОГО БРАКУЄ ДЛЯ КРАЩОГО РЕЗУЛЬТАТУ',
    capacityTitle: 'Яких ресурсів бракує, щоб досягти бажаного покриття?',
    analyze: 'Розрахувати необхідні ресурси',
    analyzing: 'Розрахунок…',
    infeasible: 'Для поточної операційної ситуації неможливо виконати аналіз доступної потужності.',
    gap: 'До цілі бракує',
    status: 'Стан',
    reached: 'Ціль досягнута',
    gapStatus: 'Є дефіцит',
    already: 'Поточне покриття вже досягає обраної цілі. Додаткові ресурси не потрібні.',
    notEnough:
      'Протестованого збільшення ресурсів недостатньо для обраної цілі. Нижче показані обмеження, які стримують результат.',
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
    decision: 'ПРИЙНЯТИ РІШЕННЯ',
    decisionTitle: 'Що ви хочете зробити з рекомендацією QDIP?',
    staged: 'Перевірений ручний план підготовлено як рішення менеджера.',
    snapshot: 'Зафіксувати рішення',
    snapshotBusy: 'Фіксую рішення…',
    decisionId: 'ID рішення',
    reason: 'Обґрунтування зміни або відхилення',
    accept: 'Прийняти рекомендацію QDIP',
    modify: 'Прийняти ручне коригування',
    alternative: 'Прийняти вибраний альтернативний план',
    reject: 'Відхилити рекомендацію',
    outcomeNotes: 'Що відбулося фактично після виконання рішення',
    record: 'Зафіксувати фактичний результат',
    recording: 'Збереження…',
    completed: 'Рішення завершено.',
    completedText: 'QDIP зберіг рекомендацію, рішення менеджера та фактичний результат в одній історії рішення.',
    timeline: 'ІСТОРІЯ РІШЕННЯ',
    proposed: 'Рекомендацію зафіксовано',
    actual: 'Фактичний результат зафіксовано',
    actor: 'виконавець',
    engine: 'Версії',
    refresh: 'Оновити історію',
    target: 'Бажане покриття пріоритетних потреб',
    currentCoverage: 'Поточне покриття',
    decisionHelp: 'Оберіть план, який буде виконуватися. QDIP автоматично збереже стан даних, рекомендацію та ваше рішення.',
    outcome: 'ФАКТИЧНИЙ РЕЗУЛЬТАТ',
    outcomeTitle: 'Що сталося після виконання плану?',
    outcomeHelp: 'Внесіть фактичні показники. QDIP не підмінює факт прогнозом.',
    actualCoverage: 'Фактичне покриття пріоритетних потреб, %',
    actualServed: 'Фактично покрито одиниць потреб',
    actualUnmet: 'Фактично залишилось непокрито',
    expected: 'Очікування QDIP',
    decisionCoverage: 'Покриття пріоритетних потреб',
    decisionServed: 'Покрито за період',
    decisionUnmet: 'Залишиться непокрито',
    decisionMoved: 'Команд змінять локацію',
    decisionMoveEvents: 'Переміщень за період',
    modifyReason: 'Чому ви змінили рекомендацію?',
    rejectReason: 'Чому рекомендація не підходить?',
    confirmModify: 'Підтвердити мій варіант',
    confirmReject: 'Підтвердити відхилення',
    approved: 'План затверджено',
    nextStep: 'Наступний крок — передати план координаторам команд.',
    exportCsv: 'Завантажити план CSV',
    copyPlan: 'Скопіювати короткий план',
    copied: 'План скопійовано',
    afterExecution: 'Після виконання плану',
    technicalHistory: 'Технічні деталі історії',
    forecast: 'Прогноз QDIP',
    actualValue: 'Факт',
  },
  en: {
    capacity: 'WHAT IS NEEDED FOR A BETTER RESULT',
    capacityTitle: 'What resources are needed to reach the coverage you want?',
    analyze: 'Calculate required resources',
    analyzing: 'Analyzing…',
    infeasible: 'Capacity analysis is infeasible for the current operational state.',
    gap: 'Gap to target',
    status: 'Status',
    reached: 'Target reached',
    gapStatus: 'Capacity gap',
    already: 'Current coverage already meets the selected target. No additional capacity is required.',
    notEnough:
      'The tested resource additions do not reach the selected target. Review the binding constraints below.',
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
    decision: 'MAKE THE DECISION',
    decisionTitle: 'What do you want to do with the QDIP recommendation?',
    staged: 'A feasible manager-edited plan is staged as the manager decision.',
    snapshot: 'Record decision',
    snapshotBusy: 'Recording decision…',
    decisionId: 'Decision ID',
    reason: 'Reason for modification or rejection',
    accept: 'Accept QDIP recommendation',
    modify: 'Approve manual modification',
    alternative: 'Accept selected alternative plan',
    reject: 'Reject recommendation',
    outcomeNotes: 'What actually happened after the decision was executed',
    record: 'Record actual outcome',
    recording: 'Recording…',
    completed: 'Decision completed.',
    completedText: 'QDIP stored the recommendation, manager decision and actual outcome in one decision history.',
    timeline: 'DECISION HISTORY',
    proposed: 'Recommendation captured',
    actual: 'Actual outcome recorded',
    actor: 'actor',
    engine: 'Versions',
    refresh: 'Refresh history',
    target: 'Desired priority-needs coverage',
    currentCoverage: 'Current coverage',
    decisionHelp: 'Choose the plan that will be executed. QDIP automatically stores the data state, recommendation and your decision.',
    outcome: 'ACTUAL RESULT',
    outcomeTitle: 'What happened after the plan was executed?',
    outcomeHelp: 'Enter the actual results. QDIP does not substitute the forecast for the observed outcome.',
    actualCoverage: 'Actual priority-needs coverage, %',
    actualServed: 'Demand units actually covered',
    actualUnmet: 'Demand units actually left uncovered',
    expected: 'QDIP expectation',
    decisionCoverage: 'Priority-needs coverage',
    decisionServed: 'Covered over the horizon',
    decisionUnmet: 'Expected uncovered',
    decisionMoved: 'Teams changing location',
    decisionMoveEvents: 'Move events over the horizon',
    modifyReason: 'Why did you change the recommendation?',
    rejectReason: 'Why is the recommendation not suitable?',
    confirmModify: 'Confirm my plan',
    confirmReject: 'Confirm rejection',
    approved: 'Plan approved',
    nextStep: 'Next step — share the approved plan with team coordinators.',
    exportCsv: 'Download plan CSV',
    copyPlan: 'Copy short plan',
    copied: 'Plan copied',
    afterExecution: 'After the plan is executed',
    technicalHistory: 'Technical history details',
    forecast: 'QDIP forecast',
    actualValue: 'Actual',
  },
  pl: {
    capacity: 'CZEGO BRAKUJE DO LEPSZEGO WYNIKU',
    capacityTitle: 'Jakich zasobów potrzeba, aby osiągnąć oczekiwane pokrycie?',
    analyze: 'Oblicz wymagane zasoby',
    analyzing: 'Analiza…',
    infeasible: 'Dla bieżącej sytuacji operacyjnej nie można wykonać analizy dostępnej zdolności.',
    gap: 'Brak do celu',
    status: 'Stan',
    reached: 'Cel osiągnięty',
    gapStatus: 'Deficyt zasobów',
    already: 'Bieżące pokrycie już osiąga wybrany cel. Dodatkowe zasoby nie są wymagane.',
    notEnough:
      'Testowane zwiększenie zasobów nie osiąga wybranego celu. Poniżej pokazano ograniczenia blokujące wynik.',
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
    decision: 'PODEJMIJ DECYZJĘ',
    decisionTitle: 'Co chcesz zrobić z rekomendacją QDIP?',
    staged: 'Zweryfikowany plan ręczny przygotowano jako decyzję menedżera.',
    snapshot: 'Zapisz decyzję',
    snapshotBusy: 'Zapisywanie decyzji…',
    decisionId: 'ID decyzji',
    reason: 'Uzasadnienie zmiany lub odrzucenia',
    accept: 'Zaakceptuj rekomendację QDIP',
    modify: 'Zaakceptuj korektę ręczną',
    alternative: 'Zaakceptuj wybrany wariant alternatywny',
    reject: 'Odrzuć rekomendację',
    outcomeNotes: 'Co faktycznie wydarzyło się po wykonaniu decyzji',
    record: 'Zapisz rzeczywisty wynik',
    recording: 'Zapisywanie…',
    completed: 'Decyzja zakończona.',
    completedText:
      'QDIP zapisał rekomendację, decyzję menedżera i rzeczywisty wynik w jednej historii decyzji.',
    timeline: 'HISTORIA DECYZJI',
    proposed: 'Rekomendacja zapisana',
    actual: 'Wynik rzeczywisty zapisany',
    actor: 'wykonawca',
    engine: 'Wersje',
    refresh: 'Odśwież historię',
    target: 'Docelowe pokrycie potrzeb priorytetowych',
    currentCoverage: 'Bieżące pokrycie',
    decisionHelp: 'Wybierz plan, który ma zostać wykonany. QDIP automatycznie zapisze stan danych, rekomendację i Twoją decyzję.',
    outcome: 'WYNIK RZECZYWISTY',
    outcomeTitle: 'Co wydarzyło się po wykonaniu planu?',
    outcomeHelp: 'Wprowadź rzeczywiste wyniki. QDIP nie zastępuje faktu prognozą.',
    actualCoverage: 'Rzeczywiste pokrycie potrzeb priorytetowych, %',
    actualServed: 'Rzeczywiście pokryte jednostki potrzeb',
    actualUnmet: 'Rzeczywiście niepokryte jednostki potrzeb',
    expected: 'Oczekiwanie QDIP',
    decisionCoverage: 'Pokrycie potrzeb priorytetowych',
    decisionServed: 'Pokryte w całym horyzoncie',
    decisionUnmet: 'Oczekiwane niepokryte',
    decisionMoved: 'Zespoły zmieniające lokalizację',
    decisionMoveEvents: 'Przemieszczenia w całym horyzoncie',
    modifyReason: 'Dlaczego zmieniasz rekomendację?',
    rejectReason: 'Dlaczego rekomendacja nie pasuje?',
    confirmModify: 'Potwierdź mój wariant',
    confirmReject: 'Potwierdź odrzucenie',
    approved: 'Plan zatwierdzony',
    nextStep: 'Następny krok — przekaż zatwierdzony plan koordynatorom zespołów.',
    exportCsv: 'Pobierz plan CSV',
    copyPlan: 'Kopiuj krótki plan',
    copied: 'Plan skopiowany',
    afterExecution: 'Po wykonaniu planu',
    technicalHistory: 'Techniczne szczegóły historii',
    forecast: 'Prognoza QDIP',
    actualValue: 'Fakt',
  },
} as const

async function requestJson<T extends object>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  })

  const raw = await response.text()
  let payload: Record<string, unknown> | null = null

  if (raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        payload = parsed as Record<string, unknown>
      }
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const detail =
      typeof payload?.detail === 'string'
        ? payload.detail
        : payload?.detail && typeof payload.detail === 'object' && 'message' in payload.detail
          ? String((payload.detail as { message?: unknown }).message ?? '')
          : null
    const message =
      (typeof payload?.error === 'string' ? payload.error : null) ||
      detail ||
      raw.trim() ||
      `Request failed (${response.status})`
    throw new Error(message)
  }

  if (!payload) {
    throw new Error(
      raw.trim()
        ? `Unexpected non-JSON response from Resource Allocation API: ${raw.trim().slice(0, 180)}`
        : 'Resource Allocation API returned an empty response.'
    )
  }

  return payload as T
}
async function post<T extends object>(path: string, body: Record<string, unknown>): Promise<T> {
  return requestJson<T>(path, { method: 'POST', body: JSON.stringify(body) })
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
  teamsMoved,
  totalTeams,
  moveEvents,
  planningDays,
  planCsv,
  exportFileName,
  selectionKind = 'recommended',
  locale = 'uk',
}: Props) {
  const t = copy[locale]
  const [capacity, setCapacity] = useState<CapacityGap | null>(null)
  const [targetCoverage, setTargetCoverage] = useState(0.9)
  const [lifecycle, setLifecycle] = useState<Lifecycle>(null)
  const [record, setRecord] = useState<DecisionRecord | null>(null)
  const [reason, setReason] = useState('')
  const [decisionIntent, setDecisionIntent] = useState<null | 'accept' | 'modify' | 'reject'>(null)
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState('')
  const [actualCoverage, setActualCoverage] = useState('')
  const [actualServed, setActualServed] = useState('')
  const [actualUnmet, setActualUnmet] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  async function loadDecision(decisionId: string) {
    const payload = await requestJson<DecisionRecord>(
      `/api/resource-allocation/decisions/${encodeURIComponent(decisionId)}`
    )
    setRecord(payload)
    setLifecycle({ decisionId: payload.decision_id, status: payload.status })
    return payload
  }
  async function capacityGap() {
    setBusy('capacity')
    setError(null)
    try {
      setCapacity(
        await post<CapacityGap>('/api/resource-allocation/capacity-gap', {
          ...input,
          target_priority_coverage: targetCoverage,
        })
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capacity analysis failed')
    } finally {
      setBusy(null)
    }
  }
  async function decide(status: 'accepted' | 'modified' | 'rejected') {
    if ((status === 'modified' || status === 'rejected') && !reason.trim()) {
      setError(t.reason)
      return
    }
    setBusy(status)
    setError(null)
    try {
      const created = await post<{ decision_id: string; status: string }>('/api/resource-allocation/decisions', input)
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
      await post(
        `/api/resource-allocation/decisions/${encodeURIComponent(created.decision_id)}/feedback`,
        body
      )
      await loadDecision(created.decision_id)
      trackResourceAllocation(
        status === 'accepted'
          ? 'ra_decision_accepted'
          : status === 'modified'
            ? 'ra_decision_modified'
            : 'ra_decision_rejected',
        locale
      )
      setDecisionIntent(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decision update failed')
    } finally {
      setBusy(null)
    }
  }
  async function outcome() {
    if (!lifecycle) return
    const coverage = Number(actualCoverage)
    const servedActual = Number(actualServed)
    const unmetActual = Number(actualUnmet)
    if (
      !actualCoverage.trim() ||
      !actualServed.trim() ||
      !actualUnmet.trim() ||
      !Number.isFinite(coverage) ||
      coverage < 0 ||
      coverage > 100 ||
      !Number.isFinite(servedActual) ||
      servedActual < 0 ||
      !Number.isFinite(unmetActual) ||
      unmetActual < 0
    ) {
      setError(locale === 'uk' ? 'Введіть коректні фактичні показники.' : locale === 'pl' ? 'Wprowadź poprawne rzeczywiste wyniki.' : 'Enter valid actual outcome values.')
      return
    }
    setBusy('outcome')
    setError(null)
    try {
      const actualAllocation = manualSelected?.actual_allocation ?? recommendedAllocation(selected)
      await post(`/api/resource-allocation/decisions/${encodeURIComponent(lifecycle.decisionId)}/outcomes`, {
        actual_allocation: actualAllocation,
        metrics: {
          priority_coverage: coverage / 100,
          served: servedActual,
          closing_unmet: unmetActual,
        },
        notes: notes || undefined,
      })
      await loadDecision(lifecycle.decisionId)
      trackResourceAllocation('ra_actual_outcome_recorded', locale)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Outcome recording failed')
    } finally {
      setBusy(null)
    }
  }
  function downloadPlan() {
    if (!planCsv || typeof document === 'undefined') return
    const blob = new Blob([planCsv], { type: 'text/csv;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = exportFileName ?? 'qdip-resource-allocation.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(href)
    trackResourceAllocation('ra_plan_exported', locale)
  }

  async function copyPlan() {
    if (!planCsv || !navigator.clipboard) return
    await navigator.clipboard.writeText(planCsv.replace(/^\uFEFF/, ''))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
    trackResourceAllocation('ra_plan_exported', locale)
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
    <div className="grid min-w-0 max-w-full gap-5">
      <details data-testid="capacity-gap-details" className="order-2 min-w-0 max-w-full overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-slate-950/70 text-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-300">{t.capacity}</div>
            <h3 className="mt-2 text-xl font-black">{t.capacityTitle}</h3>
          </div>
          <Gauge className="h-6 w-6" />
        </summary>
        <div className="border-t border-white/10 p-6 pt-5">
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-sm">
            <span className="block text-white/55">{t.target}</span>
            <select
              value={targetCoverage}
              onChange={(event) => {
                setTargetCoverage(Number(event.target.value))
                setCapacity(null)
              }}
              className="mt-2 w-full border border-white/15 bg-slate-950 p-3 text-white [color-scheme:dark]"
            >
              {[0.8, 0.9, 0.95, 1].map((value) => (
                <option key={value} value={value}>
                  {Math.round(value * 100)}%
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={capacityGap}
            className="border border-white/25 px-4 py-3 text-sm font-bold disabled:opacity-40"
          >
            {busy === 'capacity' ? t.analyzing : t.analyze}
          </button>
        </div>
        <div className="mt-3 text-xs text-white/45">
          {t.currentCoverage}: <b className="text-white">{Math.round(priorityCoverage * 100)}%</b>
        </div>
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
                  <div className="border-l-2 border-emerald-400 pl-3">
                    {locale === 'uk'
                      ? `Поточне покриття вже досягає ${Math.round(targetCoverage * 100)}%. Додаткові ресурси не потрібні.`
                      : locale === 'pl'
                        ? `Bieżące pokrycie już osiąga ${Math.round(targetCoverage * 100)}%. Dodatkowe zasoby nie są potrzebne.`
                        : `Current coverage already reaches ${Math.round(targetCoverage * 100)}%. No additional resources are required.`}
                  </div>
                )}
                {capacity.target_status === 'gap' && recommendations.length === 0 && (
                  <div className="border-l-2 border-amber-300 pl-3">
                    {locale === 'uk'
                      ? `Навіть протестоване додавання ресурсів не забезпечує ${Math.round(targetCoverage * 100)}%. Нижче показані обмеження, які стримують результат.`
                      : locale === 'pl'
                        ? `Nawet testowane zwiększenie zasobów nie zapewnia ${Math.round(targetCoverage * 100)}%. Poniżej pokazano ograniczenia blokujące wynik.`
                        : `The tested resource additions do not reach ${Math.round(targetCoverage * 100)}%. Review the binding constraints below.`}
                  </div>
                )}
                {recommendations.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{t.additions}</div>
                    <div className="space-y-2">
                      {recommendations.map((item) => (
                        <div key={`${item.resource}-${item.added_capacity}`} className="border border-white/15 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <b>{localizeService(item.resource, locale)}</b>
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
                          {localizeService(item.resource, locale)}
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
        </div>
      </details>
      <section className="order-1 min-w-0 max-w-full overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs font-bold uppercase tracking-wider text-rose-300">04 · {t.decision}</div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-black">{t.decisionTitle}</h3>
          {status && <span className="border border-white/10 px-3 py-1 text-xs font-bold uppercase">{status}</span>}
        </div>
        {manualSelected && !lifecycle && (
          <div className="mt-4 border-l-2 border-rose-300/40 pl-3 text-sm">{t.staged}</div>
        )}
        {!lifecycle ? (
          <>
            <p className="mt-4 max-w-2xl text-sm text-slate-400">{t.decisionHelp}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5" data-testid="decision-summary">
              <div className="border border-white/10 p-3">
                <div className="text-xs text-slate-500">{t.decisionCoverage}</div>
                <b className="mt-1 block text-xl">{Math.round(priorityCoverage * 100)}%</b>
              </div>
              <div className="border border-white/10 p-3">
                <div className="text-xs text-slate-500">{t.decisionServed}</div>
                <b className="mt-1 block text-xl">{served.toFixed(0)}</b>
              </div>
              <div className="border border-white/10 p-3">
                <div className="text-xs text-slate-500">{t.decisionUnmet}</div>
                <b className="mt-1 block text-xl">{unmet.toFixed(0)}</b>
              </div>
              <div className="border border-white/10 p-3">
                <div className="text-xs text-slate-500">{t.decisionMoved}</div>
                <b className="mt-1 block text-xl">{teamsMoved} / {totalTeams}</b>
              </div>
              <div className="border border-white/10 p-3">
                <div className="text-xs text-slate-500">{t.decisionMoveEvents}</div>
                <b className="mt-1 block text-xl">{moveEvents}</b>
                <div className="mt-1 text-[10px] text-slate-600">{planningDays} {locale === 'uk' ? 'днів' : locale === 'pl' ? 'dni' : 'days'}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {selectionKind === 'recommended' && !manualSelected && (
                <button
                  type="button"
                  onClick={() => {
                    setDecisionIntent('accept')
                    void decide('accepted')
                  }}
                  disabled={Boolean(busy)}
                  className="flex items-center gap-2 bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                  {busy === 'accepted' ? t.snapshotBusy : t.accept}
                </button>
              )}
              {(manualSelected || selectionKind === 'alternative') && (
                <button
                  type="button"
                  onClick={() => {
                    setReason('')
                    setDecisionIntent('modify')
                  }}
                  disabled={Boolean(busy)}
                  className="border border-rose-300/40 bg-rose-300/10 px-4 py-3 text-sm font-bold text-rose-200 disabled:opacity-40"
                >
                  {manualSelected ? t.modify : t.alternative}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setReason('')
                  setDecisionIntent('reject')
                }}
                disabled={Boolean(busy)}
                className="flex items-center gap-2 border border-white/20 px-4 py-3 text-sm font-bold text-slate-300 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                {t.reject}
              </button>
            </div>

            {(decisionIntent === 'modify' || decisionIntent === 'reject') && (
              <div className="mt-4 border border-white/10 bg-slate-950/30 p-4">
                <label className="text-sm">
                  <span className="block font-bold">
                    {decisionIntent === 'modify' ? t.modifyReason : t.rejectReason}
                  </span>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-3 min-h-24 w-full border border-white/15 bg-slate-950/50 p-3"
                  />
                </label>
                <button
                  type="button"
                  disabled={Boolean(busy) || !reason.trim()}
                  onClick={() => void decide(decisionIntent === 'modify' ? 'modified' : 'rejected')}
                  className="mt-3 bg-rose-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  {busy
                    ? t.snapshotBusy
                    : decisionIntent === 'modify'
                      ? t.confirmModify
                      : t.confirmReject}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mt-4 border-l-2 border-emerald-400 pl-3 text-sm text-emerald-200">
              <b>{status === 'rejected' ? t.reject : status === 'modified' ? (manualSelected ? t.modify : t.alternative) : t.accept}</b>
              <div className="mt-1 text-xs text-slate-500">{t.decisionId} · {lifecycle.decisionId}</div>
            </div>
            {status && ['accepted', 'modified'].includes(status) && (
              <>
                <div className="mt-5 border-l-2 border-emerald-400 bg-emerald-400/[0.05] px-4 py-3">
                  <b className="text-emerald-200">✓ {t.approved}</b>
                  <div className="mt-1 text-sm text-slate-400">{t.nextStep}</div>
                  {planCsv && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={downloadPlan}
                        className="inline-flex items-center gap-2 bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950"
                      >
                        <Download className="h-4 w-4" />
                        {t.exportCsv}
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyPlan()}
                        className="inline-flex items-center gap-2 border border-white/15 px-4 py-3 text-sm font-bold"
                      >
                        <Clipboard className="h-4 w-4" />
                        {copied ? t.copied : t.copyPlan}
                      </button>
                    </div>
                  )}
                </div>

                <details className="mt-6 border border-white/10 bg-white/[0.02]">
                  <summary className="cursor-pointer p-4 font-bold">{t.afterExecution}</summary>
                  <div className="border-t border-white/10 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-300">{t.outcome}</div>
                    <h4 className="mt-2 text-lg font-black">{t.outcomeTitle}</h4>
                    <p className="mt-2 text-sm text-slate-500">{t.outcomeHelp}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="text-sm">
                        <span className="block text-slate-500">{t.actualCoverage}</span>
                        <input
                          aria-label={t.actualCoverage}
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={actualCoverage}
                          onChange={(event) => setActualCoverage(event.target.value)}
                          placeholder={`${Math.round(priorityCoverage * 100)} · ${t.expected}`}
                          className="mt-2 w-full border border-white/15 bg-slate-950/40 p-3"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="block text-slate-500">{t.actualServed}</span>
                        <input
                          aria-label={t.actualServed}
                          type="number"
                          min="0"
                          step="1"
                          value={actualServed}
                          onChange={(event) => setActualServed(event.target.value)}
                          placeholder={`${served.toFixed(0)} · ${t.expected}`}
                          className="mt-2 w-full border border-white/15 bg-slate-950/40 p-3"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="block text-slate-500">{t.actualUnmet}</span>
                        <input
                          aria-label={t.actualUnmet}
                          type="number"
                          min="0"
                          step="1"
                          value={actualUnmet}
                          onChange={(event) => setActualUnmet(event.target.value)}
                          placeholder={`${unmet.toFixed(0)} · ${t.expected}`}
                          className="mt-2 w-full border border-white/15 bg-slate-950/40 p-3"
                        />
                      </label>
                    </div>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder={t.outcomeNotes}
                      className="mt-4 min-h-20 w-full border border-white/15 bg-slate-950/40 p-3 text-sm"
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
                  </div>
                </details>
              </>
            )}
            {status === 'completed' && (
              <div className="mt-5 border border-emerald-400/20 bg-emerald-400/[0.04] p-4 text-sm">
                <b className="text-emerald-200">{t.completed}</b>
                <div className="mt-1 text-slate-500">{t.completedText}</div>
                {record?.outcomes.at(-1)?.metrics && (
                  <div className="mt-4 grid grid-cols-[1.4fr_1fr_1fr] gap-px bg-white/10 text-xs">
                    <div className="bg-slate-950/60 p-2" />
                    <div className="bg-slate-950/60 p-2 font-bold">{t.forecast}</div>
                    <div className="bg-slate-950/60 p-2 font-bold">{t.actualValue}</div>
                    <MetricCompare label={t.decisionCoverage} forecast={priorityCoverage} actual={record.outcomes.at(-1)?.metrics?.priority_coverage} percentage />
                    <MetricCompare label={t.decisionServed} forecast={served} actual={record.outcomes.at(-1)?.metrics?.served} />
                    <MetricCompare label={t.decisionUnmet} forecast={unmet} actual={record.outcomes.at(-1)?.metrics?.closing_unmet} />
                  </div>
                )}
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
                <details className="mt-5 text-xs text-slate-500">
                  <summary className="cursor-pointer font-semibold text-slate-400">{t.technicalHistory}</summary>
                  <div className="mt-2 break-words">
                    {t.engine}: {record.engine_version} · {record.plugin_version} · {record.state_hash.slice(0, 10)}
                  </div>
                </details>
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
function MetricCompare({
  label,
  forecast,
  actual,
  percentage = false,
}: {
  label: string
  forecast: number
  actual?: number
  percentage?: boolean
}) {
  const render = (value: number | undefined) =>
    value == null ? '—' : percentage ? `${Math.round(value * 100)}%` : value.toFixed(0)
  return (
    <>
      <div className="bg-white/[0.03] p-2 text-slate-500">{label}</div>
      <div className="bg-white/[0.03] p-2 font-bold">{render(forecast)}</div>
      <div className="bg-white/[0.03] p-2 font-bold">{render(actual)}</div>
    </>
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
