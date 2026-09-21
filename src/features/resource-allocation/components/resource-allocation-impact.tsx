'use client'

import { ArrowDown, ArrowUp, CircleHelp } from 'lucide-react'
import type {
  ResourceAllocationBaseline,
  ResourceAllocationDemandSummary,
  ResourceAllocationMetrics,
} from '../contracts'

type Props = {
  metrics: ResourceAllocationMetrics
  summary: ResourceAllocationDemandSummary
  baseline?: ResourceAllocationBaseline | null
  teamsMoved: number
  totalTeams: number
  moveEvents: number
  planningDays?: number
  locale: 'uk' | 'en' | 'pl'
}

const labels = {
  uk: {
    compareKicker: '02 · ЩО МОЖНА ПОКРАЩИТИ',
    compareTitle: 'Що зміниться, якщо використати рекомендацію QDIP',
    recommendationKicker: '02 · ОЧІКУВАНИЙ ЕФЕКТ',
    recommendationTitle: 'Очікуваний результат рекомендованого плану',
    recommendationSubtitle:
      'Поточний розподіл не вдалося оцінити в тому самому сценарії, тому показано лише рекомендований план.',
    current: 'Якщо на весь період залишити поточний розподіл без змін',
    canonicalBaseline: 'Ручний базовий план',
    recommended: 'Рекомендований план QDIP',
    priorityHelp: 'Частка critical/high-priority одиниць потреб, які модельований план дозволяє обслужити протягом обраного періоду.',
    moveEvents: 'Переміщень за весь період',
    scenario: 'Модельована оцінка для планового сценарію.',
    unavailable: 'поточний план не оцінено',
    priority: 'Покриття пріоритетних потреб',
    total: 'Загальне покриття потреб',
    served: 'Потреб буде покрито',
    unmet: 'Залишиться без покриття',
    utilization: 'Завантаження команд',
    travel: 'Індекс переміщень',
    moved: 'Команд змінять локацію',
    of: 'з',
  },
  en: {
    compareKicker: '02 · WHAT CAN IMPROVE',
    compareTitle: 'What changes if you use the QDIP recommendation',
    recommendationKicker: '02 · EXPECTED IMPACT',
    recommendationTitle: 'Expected result of the recommended plan',
    recommendationSubtitle:
      'The current allocation could not be evaluated under the same scenario, so only the recommended plan is shown.',
    current: 'Keep the current allocation unchanged for the full horizon',
    canonicalBaseline: 'Manual baseline plan',
    recommended: 'Recommended QDIP plan',
    priorityHelp: 'Share of critical/high-priority demand units the modelled plan can serve over the selected horizon.',
    moveEvents: 'Move events over the horizon',
    scenario: 'Modelled estimate for the planning scenario.',
    unavailable: 'current plan not evaluated',
    priority: 'Priority needs coverage',
    total: 'Total needs coverage',
    served: 'Needs served',
    unmet: 'Needs left uncovered',
    utilization: 'Team utilization',
    travel: 'Movement cost index',
    moved: 'Teams changing location',
    of: 'of',
  },
  pl: {
    compareKicker: '02 · CO MOŻNA POPRAWIĆ',
    compareTitle: 'Co zmieni się po zastosowaniu rekomendacji QDIP',
    recommendationKicker: '02 · OCZEKIWANY EFEKT',
    recommendationTitle: 'Oczekiwany wynik rekomendowanego planu',
    recommendationSubtitle:
      'Bieżącej alokacji nie udało się ocenić w tym samym scenariuszu, dlatego pokazano tylko rekomendowany plan.',
    current: 'Pozostaw bieżący przydział bez zmian przez cały horyzont',
    canonicalBaseline: 'Ręczny plan bazowy',
    recommended: 'Rekomendowany plan QDIP',
    priorityHelp: 'Udział jednostek potrzeb krytycznych i wysokiego priorytetu, które modelowany plan może obsłużyć w wybranym horyzoncie.',
    moveEvents: 'Przemieszczenia w całym horyzoncie',
    scenario: 'Modelowana ocena dla scenariusza planowania.',
    unavailable: 'bieżący plan nieoceniony',
    priority: 'Pokrycie potrzeb priorytetowych',
    total: 'Łączne pokrycie potrzeb',
    served: 'Obsłużone potrzeby',
    unmet: 'Potrzeby bez pokrycia',
    utilization: 'Wykorzystanie zespołów',
    travel: 'Indeks kosztu przemieszczeń',
    moved: 'Zespoły zmieniające lokalizację',
    of: 'z',
  },
} as const

export function ResourceAllocationImpact({
  metrics,
  summary,
  baseline,
  teamsMoved,
  totalTeams,
  moveEvents,
  planningDays,
  locale,
}: Props) {
  const t = labels[locale]
  const compared = Boolean(baseline)
  const baselineLabel =
    baseline?.kind === 'canonical-plan' ? t.canonicalBaseline : t.current
  const currentPriority =
    baseline?.summary.priority_coverage ?? baseline?.metrics.priority_coverage
  const recommendedPriority = summary.priority_coverage ?? metrics.priority_coverage
  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">
        {compared ? t.compareKicker : t.recommendationKicker}
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-black sm:text-2xl">{compared ? t.compareTitle : t.recommendationTitle}</h3>
          {!compared && <p className="mt-2 max-w-4xl text-sm text-slate-500">{t.recommendationSubtitle}</p>}
        </div>
        <div className="min-w-0 text-left sm:text-right">
          <div className="text-xs text-slate-600">{t.moved}</div>
          <div className="text-2xl font-black">
            {teamsMoved}{' '}
            <span className="text-sm font-medium text-slate-600">
              {t.of} {totalTeams}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {t.moveEvents}: <b className="text-slate-300">{moveEvents}</b>
          </div>
        </div>
      </div>
      {baseline && (
        <>
          <div className="mt-5 grid gap-2 text-xs sm:grid-cols-2">
            <div className="border border-white/10 bg-white/[0.03] p-3">
              <span className="text-slate-500">{baselineLabel}</span>
            </div>
            <div className="border border-rose-300/20 bg-rose-300/[0.06] p-3">
              <span className="font-bold text-rose-200">{t.recommended}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {t.scenario}
            {planningDays
              ? ` · ${planningDays} ${locale === 'uk' ? 'днів' : locale === 'pl' ? 'dni' : 'days'}`
              : ''}
          </p>
        </>
      )}
      {baseline && summary.served > baseline.summary.served && (
        <div className="mt-5 border-l-2 border-emerald-400 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-100">
          <b>
            {locale === 'uk'
              ? `За цим сценарієм план QDIP дозволяє покрити на ${Math.round(summary.served - baseline.summary.served)} одиниць потреб більше без збільшення кількості команд.`
              : locale === 'pl'
                ? `W tym scenariuszu plan QDIP pozwala pokryć o ${Math.round(summary.served - baseline.summary.served)} jednostek potrzeb więcej bez zwiększania liczby zespołów.`
                : `In this scenario, the QDIP plan covers ${Math.round(summary.served - baseline.summary.served)} more demand units without adding teams.`}
          </b>
        </div>
      )}
      <div className="mt-6 grid gap-px bg-white/5 sm:grid-cols-2 xl:grid-cols-6">
        <Impact
          label={t.priority}
          help={t.priorityHelp}
          current={currentPriority}
          recommended={recommendedPriority}
          format="pct"
          unavailable={t.unavailable}
          currentLabel={baselineLabel}
          recommendedLabel={t.recommended}
        />
        <Impact
          label={t.total}
          current={baseline?.metrics.total_coverage}
          recommended={metrics.total_coverage}
          format="pct"
          unavailable={t.unavailable}
          currentLabel={baselineLabel}
          recommendedLabel={t.recommended}
        />
        <Impact
          label={t.served}
          current={baseline?.summary.served}
          recommended={summary.served}
          unavailable={t.unavailable}
          currentLabel={baselineLabel}
          recommendedLabel={t.recommended}
        />
        <Impact
          label={t.unmet}
          current={baseline?.summary.closing_unmet}
          recommended={summary.closing_unmet}
          inverse
          unavailable={t.unavailable}
          currentLabel={baselineLabel}
          recommendedLabel={t.recommended}
        />
        <Impact
          label={t.utilization}
          current={baseline?.metrics.capacity_utilization}
          recommended={metrics.capacity_utilization}
          format="pct"
          unavailable={t.unavailable}
          currentLabel={baselineLabel}
          recommendedLabel={t.recommended}
        />
        <Impact
          label={t.travel}
          current={baseline?.metrics.travel_cost}
          recommended={metrics.travel_cost}
          inverse
          unavailable={t.unavailable}
          currentLabel={baselineLabel}
          recommendedLabel={t.recommended}
        />
      </div>
    </section>
  )
}

function Impact({
  label,
  current,
  recommended,
  help,
  format,
  inverse = false,
  unavailable,
  currentLabel,
  recommendedLabel,
}: {
  label: string
  help?: string
  current?: number
  recommended: number
  format?: 'pct'
  inverse?: boolean
  unavailable: string
  currentLabel: string
  recommendedLabel: string
}) {
  const render = (value: number) => (format === 'pct' ? `${Math.round(value * 100)}%` : value.toFixed(0))
  if (current === undefined)
    return (
      <div className="bg-white/[0.04] p-4">
        <div className="flex items-start gap-1 text-xs leading-4 text-slate-500">
          <span>{label}</span>
          {help && (
            <span className="group relative inline-flex" tabIndex={0} aria-label={help}>
              <CircleHelp className="h-3.5 w-3.5" />
              <span className="pointer-events-none absolute left-0 top-5 z-20 hidden w-64 border border-white/10 bg-slate-950 p-2 text-[11px] leading-relaxed text-slate-300 shadow-xl group-hover:block group-focus:block">
                {help}
              </span>
            </span>
          )}
        </div>
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
      <div className="flex items-start gap-1 text-xs leading-4 text-slate-500">
        <span>{label}</span>
        {help && (
          <span className="group relative inline-flex" tabIndex={0} aria-label={help}>
            <CircleHelp className="h-3.5 w-3.5" />
            <span className="pointer-events-none absolute left-0 top-5 z-20 hidden w-64 border border-white/10 bg-slate-950 p-2 text-[11px] leading-relaxed text-slate-300 shadow-xl group-hover:block group-focus:block">
              {help}
            </span>
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div>
          <div className="text-[10px] leading-tight text-slate-600">{currentLabel}</div>
          <span className="text-sm text-slate-400">{render(current)}</span>
        </div>
        <span className="pb-0.5 text-slate-600">→</span>
        <div>
          <div className="text-[10px] leading-tight text-rose-300/70">{recommendedLabel}</div>
          <b className="text-2xl">{render(recommended)}</b>
        </div>
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
