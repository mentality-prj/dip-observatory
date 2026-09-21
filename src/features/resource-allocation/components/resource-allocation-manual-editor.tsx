'use client'

import { useMemo, useState } from 'react'
import { Pencil, RefreshCw } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import { ResourceAllocationNetwork } from './resource-allocation-network'

type DayPlan = { day: string; recommended: { assignments: Record<string, string | null> } }
type ManualMetrics = {
  priority_coverage?: number
  total_coverage?: number
  travel_cost?: number
  capacity_utilization?: number
  operating_cost?: number
}
type Evaluation = {
  status?: string
  daily?: Array<{
    day: string
    status?: string
    recommended?: { metrics?: ManualMetrics; violations?: string[] }
    demand?: { served?: number; closing_unmet?: number }
  }>
  aggregate_metrics?: ManualMetrics
  demand_summary?: { served?: number; closing_unmet?: number }
  violations?: string[]
}
type InputTeam = { id: string; current_community: string }
export type EvaluatedManualAllocation = {
  actual_allocation: Record<string, Record<string, string | null>>
  metrics: Record<string, number>
  evaluation: Evaluation
}
const copy = {
  uk: {
    section: 'РУЧНЕ КОРИГУВАННЯ',
    title: 'Змініть розподіл команд і перевірте наслідки',
    description:
      'Менеджер може змінити призначення. DIP не оптимізує їх повторно, а оцінює саме ручний план: покриття потреб, непокритий попит, переміщення та порушення обмежень.',
    reset: 'Скинути',
    team: 'Команда',
    unassigned: 'Не призначено',
    evaluate: 'Перевірити ручний план',
    evaluating: 'Перевірка…',
    use: 'Використати як рішення менеджера',
    priority: 'Пріоритетні потреби',
    total: 'Усі потреби',
    served: 'Буде покрито',
    unmet: 'Не буде покрито',
    travel: 'Вартість переміщень',
    violations: 'порушень обмежень',
    feasible:
      'Ручний план допустимий за поточних обмежень. Тепер його можна порівняти з рекомендацією DIP на схемі вище.',
  },
  en: {
    section: 'MANUAL OVERRIDE',
    title: 'Adjust team allocation and evaluate the consequences',
    description:
      'A manager can change assignments. DIP does not optimize them back; it evaluates the manual plan itself: coverage, unmet demand, movement and constraint violations.',
    reset: 'Reset',
    team: 'Team',
    unassigned: 'Unassigned',
    evaluate: 'Evaluate manual plan',
    evaluating: 'Evaluating…',
    use: 'Use as manager decision',
    priority: 'Priority needs',
    total: 'All needs',
    served: 'Expected covered',
    unmet: 'Expected uncovered',
    travel: 'Movement cost',
    violations: 'constraint violations',
    feasible:
      'The manual plan is feasible under current constraints. It can now be compared with the DIP recommendation in the network above.',
  },
  pl: {
    section: 'KOREKTA RĘCZNA',
    title: 'Zmień alokację zespołów i oceń konsekwencje',
    description:
      'Menedżer może zmienić przydziały. DIP nie optymalizuje ich ponownie, lecz ocenia sam plan ręczny: pokrycie potrzeb, niezaspokojony popyt, przemieszczenia i naruszenia ograniczeń.',
    reset: 'Resetuj',
    team: 'Zespół',
    unassigned: 'Nieprzydzielony',
    evaluate: 'Oceń plan ręczny',
    evaluating: 'Ocena…',
    use: 'Użyj jako decyzji menedżera',
    priority: 'Potrzeby priorytetowe',
    total: 'Wszystkie potrzeby',
    served: 'Zostanie pokryte',
    unmet: 'Pozostanie bez pokrycia',
    travel: 'Koszt przemieszczeń',
    violations: 'naruszeń ograniczeń',
    feasible:
      'Plan ręczny jest dopuszczalny przy bieżących ograniczeniach. Można go teraz porównać z rekomendacją DIP na schemacie powyżej.',
  },
} as const

export function ResourceAllocationManualEditor({
  input,
  plan,
  communities,
  teams,
  onUseModified,
  locale,
}: {
  input: Record<string, unknown>
  plan: { daily: DayPlan[] }
  communities: string[]
  teams: string[]
  onUseModified: (selected: EvaluatedManualAllocation) => void
  locale: Locale
}) {
  const t = copy[locale]
  const seed = useMemo(
    () => Object.fromEntries(plan.daily.map((day) => [day.day, { ...day.recommended.assignments }])),
    [plan]
  )
  const [allocation, setAllocation] = useState<Record<string, Record<string, string | null>>>(seed)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visualDay, setVisualDay] = useState(plan.daily[0]?.day ?? 'Mon')
  const inputTeams = useMemo(
    () =>
      Array.isArray(input.teams)
        ? input.teams
            .filter(
              (item): item is InputTeam =>
                typeof item === 'object' && item !== null && 'id' in item && 'current_community' in item
            )
            .map((item) => ({ id: String(item.id), current_community: String(item.current_community) }))
        : [],
    [input]
  )
  const visualIndex = Math.max(
    0,
    plan.daily.findIndex((day) => day.day === visualDay)
  )
  const visualPlan = plan.daily[visualIndex] ?? plan.daily[0]
  const previousPlan = visualIndex > 0 ? plan.daily[visualIndex - 1] : null
  const opening = previousPlan?.recommended.assignments
  const manualOpening = visualIndex > 0 ? allocation[plan.daily[visualIndex - 1].day] : undefined
  function change(day: string, team: string, target: string) {
    setAllocation((current) => ({ ...current, [day]: { ...current[day], [team]: target || null } }))
    setEvaluation(null)
  }
  async function evaluate() {
    setRunning(true)
    setError(null)
    try {
      const response = await fetch('/api/resource-allocation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, operation: 'evaluate_manual', manual_allocation: allocation }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Manual plan evaluation failed')
      setEvaluation(payload as Evaluation)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Manual plan evaluation failed')
    } finally {
      setRunning(false)
    }
  }
  const metrics = evaluation?.aggregate_metrics
  const demand = evaluation?.demand_summary
  const violations = [
    ...(evaluation?.violations ?? []),
    ...(evaluation?.daily ?? []).flatMap((day) => day.recommended?.violations ?? []),
  ]
  const dayFailures = (evaluation?.daily ?? []).filter((day) => day.status && !['ok', 'partial'].includes(day.status))
  const feasible =
    Boolean(evaluation) &&
    !['infeasible', 'error'].includes(evaluation?.status ?? '') &&
    violations.length === 0 &&
    dayFailures.length === 0
  function stageManual() {
    if (!evaluation || !feasible) return
    const actual_allocation = Object.fromEntries(plan.daily.map((day) => [day.day, { ...allocation[day.day] }]))
    const evaluatedMetrics: Record<string, number> = {}
    for (const [key, value] of Object.entries(metrics ?? {}))
      if (typeof value === 'number') evaluatedMetrics[key] = value
    if (typeof demand?.served === 'number') evaluatedMetrics.served = demand.served
    if (typeof demand?.closing_unmet === 'number') evaluatedMetrics.closing_unmet = demand.closing_unmet
    onUseModified({ actual_allocation, metrics: evaluatedMetrics, evaluation })
  }
  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-hidden">
      {visualPlan && inputTeams.length > 0 && (
        <>
          <div className="flex max-w-full gap-2 overflow-x-auto bg-white/[0.04] px-6 pt-5">
            {plan.daily.map((day) => (
              <button
                type="button"
                key={day.day}
                onClick={() => setVisualDay(day.day)}
                className={`border px-4 py-2 text-xs font-bold ${visualDay === day.day ? 'border-rose-300/40 bg-rose-300/10 text-rose-300' : 'border-white/10 text-slate-500'}`}
              >
                {day.day}
              </button>
            ))}
          </div>
          <ResourceAllocationNetwork
            communities={communities}
            teams={inputTeams}
            day={visualDay}
            opening={opening}
            recommended={visualPlan.recommended.assignments}
            manual={feasible ? allocation[visualDay] : null}
            manualOpening={feasible ? manualOpening : null}
            locale={locale}
          />
        </>
      )}
      <section className="min-w-0 max-w-full overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-[16rem]">
            <div className="break-words text-xs font-bold uppercase tracking-wider text-rose-300">07 · {t.section}</div>
            <h3 className="mt-2 break-words text-2xl font-black [overflow-wrap:anywhere]">{t.title}</h3>
            <p className="mt-2 max-w-3xl break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
              {t.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAllocation(seed)
              setEvaluation(null)
            }}
            className="flex max-w-full shrink-0 items-center gap-2 border border-white/15 px-3 py-2 text-sm"
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span className="break-words">{t.reset}</span>
          </button>
        </div>
        <div className="mt-6 max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-white/15 p-2 text-left">{t.team}</th>
                {plan.daily.map((day) => (
                  <th key={day.day} className="border-b border-white/15 p-2 text-left">
                    {day.day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team}>
                  <td className="border-b border-white/5 p-2 font-bold">{team}</td>
                  {plan.daily.map((day) => (
                    <td key={day.day} className="border-b border-white/5 p-2">
                      <select
                        aria-label={`${team} ${day.day}`}
                        className="w-full border border-white/10 bg-white/[0.04] p-2"
                        value={allocation[day.day]?.[team] ?? ''}
                        onChange={(event) => change(day.day, team, event.target.value)}
                      >
                        <option value="">{t.unassigned}</option>
                        {communities.map((community) => (
                          <option key={community}>{community}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex min-w-0 flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={running}
            onClick={evaluate}
            className="flex max-w-full items-center gap-2 bg-slate-950/70 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            <Pencil className="h-4 w-4 shrink-0" />
            <span className="break-words">{running ? t.evaluating : t.evaluate}</span>
          </button>
          {evaluation && (
            <button
              type="button"
              disabled={!feasible}
              onClick={stageManual}
              className="max-w-full break-words border border-rose-300/40 px-5 py-3 font-bold text-rose-300 disabled:opacity-30"
            >
              {t.use}
            </button>
          )}
        </div>
        {error && (
          <div
            role="alert"
            className="mt-4 break-words border border-rose-300/25 p-3 text-sm text-rose-200 [overflow-wrap:anywhere]"
          >
            {error}
          </div>
        )}
        {evaluation && (
          <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-5">
            <Kpi
              label={t.priority}
              value={metrics?.priority_coverage == null ? '—' : `${Math.round(metrics.priority_coverage * 100)}%`}
            />
            <Kpi
              label={t.total}
              value={metrics?.total_coverage == null ? '—' : `${Math.round(metrics.total_coverage * 100)}%`}
            />
            <Kpi label={t.served} value={demand?.served?.toFixed(0) ?? '—'} />
            <Kpi label={t.unmet} value={demand?.closing_unmet?.toFixed(0) ?? '—'} />
            <Kpi label={t.travel} value={metrics?.travel_cost?.toFixed(1) ?? '—'} />
          </div>
        )}
        {evaluation && (
          <div
            className={`mt-4 break-words border p-4 text-sm [overflow-wrap:anywhere] ${!feasible ? 'border-rose-300/35 bg-rose-300/10 text-rose-200' : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'}`}
          >
            {!feasible ? (
              <>
                <b>
                  {violations.length + dayFailures.length} {t.violations}
                </b>
                <div className="mt-2 space-y-1">
                  {violations.slice(0, 8).map((item, index) => (
                    <div key={`${item}-${index}`}>{item}</div>
                  ))}
                  {dayFailures.slice(0, 4).map((day) => (
                    <div key={day.day}>
                      {day.day}: {day.status}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <b>{t.feasible}</b>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border border-white/10 p-3">
      <div className="break-words text-xs text-slate-500 [overflow-wrap:anywhere]">{label}</div>
      <div className="mt-1 break-words text-xl font-black">{value}</div>
    </div>
  )
}
