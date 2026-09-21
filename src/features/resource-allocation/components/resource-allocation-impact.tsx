'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import type {
  ResourceAllocationBaseline,
  ResourceAllocationDemandSummary,
  ResourceAllocationMetrics,
} from '../contracts'

type Props = {
  metrics: ResourceAllocationMetrics
  summary: ResourceAllocationDemandSummary
  baseline?: ResourceAllocationBaseline | null
  moved: number
  totalTeams: number
  locale: 'uk' | 'en' | 'pl'
}

const labels = {
  uk: {
    compareKicker: '04 · ПОТОЧНИЙ → РЕКОМЕНДОВАНИЙ',
    compareTitle: 'Поточний розподіл проти рекомендації QDIP',
    recommendationKicker: '04 · РЕКОМЕНДАЦІЯ QDIP',
    recommendationTitle: 'Очікуваний результат рекомендованого плану',
    recommendationSubtitle:
      'Поточний розподіл не вдалося оцінити в тому самому сценарії, тому показано лише рекомендований план.',
    current: 'Зараз',
    recommended: 'Рекомендація',
    unavailable: 'поточний план не оцінено',
    priority: 'Покриття пріоритетних потреб',
    total: 'Загальне покриття потреб',
    served: 'Потреб буде покрито',
    unmet: 'Залишиться без покриття',
    utilization: 'Завантаження команд',
    travel: 'Вартість переміщень',
    moved: 'Команд змінять локацію',
    of: 'з',
  },
  en: {
    compareKicker: '04 · CURRENT → RECOMMENDED',
    compareTitle: 'Current allocation versus QDIP recommendation',
    recommendationKicker: '04 · QDIP RECOMMENDATION',
    recommendationTitle: 'Expected result of the recommended plan',
    recommendationSubtitle:
      'The current allocation could not be evaluated under the same scenario, so only the recommended plan is shown.',
    current: 'Current',
    recommended: 'Recommended',
    unavailable: 'current plan not evaluated',
    priority: 'Priority needs coverage',
    total: 'Total needs coverage',
    served: 'Needs served',
    unmet: 'Needs left uncovered',
    utilization: 'Team utilization',
    travel: 'Movement cost',
    moved: 'Teams changing location',
    of: 'of',
  },
  pl: {
    compareKicker: '04 · OBECNIE → REKOMENDACJA',
    compareTitle: 'Bieżąca alokacja a rekomendacja QDIP',
    recommendationKicker: '04 · REKOMENDACJA QDIP',
    recommendationTitle: 'Oczekiwany wynik rekomendowanego planu',
    recommendationSubtitle:
      'Bieżącej alokacji nie udało się ocenić w tym samym scenariuszu, dlatego pokazano tylko rekomendowany plan.',
    current: 'Obecnie',
    recommended: 'Rekomendacja',
    unavailable: 'bieżący plan nieoceniony',
    priority: 'Pokrycie potrzeb priorytetowych',
    total: 'Łączne pokrycie potrzeb',
    served: 'Obsłużone potrzeby',
    unmet: 'Potrzeby bez pokrycia',
    utilization: 'Wykorzystanie zespołów',
    travel: 'Koszt przemieszczeń',
    moved: 'Zespoły zmieniające lokalizację',
    of: 'z',
  },
} as const

export function ResourceAllocationImpact({ metrics, summary, baseline, moved, totalTeams, locale }: Props) {
  const t = labels[locale]
  const compared = Boolean(baseline)
  return (
    <section className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">
        {compared ? t.compareKicker : t.recommendationKicker}
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-black sm:text-2xl">{compared ? t.compareTitle : t.recommendationTitle}</h3>
          {!compared && <p className="mt-2 max-w-4xl text-sm text-slate-500">{t.recommendationSubtitle}</p>}
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-600">{t.moved}</div>
          <div className="text-2xl font-black">
            {moved}{' '}
            <span className="text-sm font-medium text-slate-600">
              {t.of} {totalTeams}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-px bg-white/5 sm:grid-cols-2 xl:grid-cols-6">
        <Impact
          label={t.priority}
          current={baseline?.metrics.priority_coverage}
          recommended={metrics.priority_coverage}
          format="pct"
          unavailable={t.unavailable}
        />
        <Impact
          label={t.total}
          current={baseline?.metrics.total_coverage}
          recommended={metrics.total_coverage}
          format="pct"
          unavailable={t.unavailable}
        />
        <Impact
          label={t.served}
          current={baseline?.summary.served}
          recommended={summary.served}
          unavailable={t.unavailable}
        />
        <Impact
          label={t.unmet}
          current={baseline?.summary.closing_unmet}
          recommended={summary.closing_unmet}
          inverse
          unavailable={t.unavailable}
        />
        <Impact
          label={t.utilization}
          current={baseline?.metrics.capacity_utilization}
          recommended={metrics.capacity_utilization}
          format="pct"
          unavailable={t.unavailable}
        />
        <Impact
          label={t.travel}
          current={baseline?.metrics.travel_cost}
          recommended={metrics.travel_cost}
          inverse
          unavailable={t.unavailable}
        />
      </div>
    </section>
  )
}

function Impact({
  label,
  current,
  recommended,
  format,
  inverse = false,
  unavailable,
}: {
  label: string
  current?: number
  recommended: number
  format?: 'pct'
  inverse?: boolean
  unavailable: string
}) {
  const render = (value: number) => (format === 'pct' ? `${Math.round(value * 100)}%` : value.toFixed(0))
  if (current === undefined)
    return (
      <div className="bg-white/[0.04] p-4">
        <div className="text-xs leading-4 text-slate-500">{label}</div>
        <div className="mt-4 text-2xl font-black">{render(recommended)}</div>
        <div className="mt-2 text-xs text-slate-500">{unavailable}</div>
      </div>
    )
  const delta = recommended - current
  const favorable = Math.abs(delta) < 0.0001 ? null : inverse ? delta < 0 : delta > 0
  const Icon = delta >= 0 ? ArrowUp : ArrowDown
  const deltaText = `${delta > 0 ? '+' : ''}${format === 'pct' ? `${Math.round(delta * 100)} pp` : delta.toFixed(0)}`
  return (
    <div className="bg-white/[0.04] p-4">
      <div className="text-xs leading-4 text-slate-500">{label}</div>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-sm text-slate-500">{render(current)}</span>
        <span className="text-slate-600">→</span>
        <b className="text-2xl">{render(recommended)}</b>
      </div>
      <div
        className={`mt-2 flex items-center gap-1 text-xs font-bold ${favorable === true ? 'text-emerald-300' : favorable === false ? 'text-rose-200' : 'text-slate-500'}`}
      >
        {Math.abs(delta) < 0.0001 ? (
          <span>0</span>
        ) : (
          <>
            <Icon className="h-3.5 w-3.5" />
            {deltaText}
          </>
        )}
      </div>
    </div>
  )
}
