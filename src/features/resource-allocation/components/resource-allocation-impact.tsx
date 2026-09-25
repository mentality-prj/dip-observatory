'use client'

import { ArrowDown, ArrowUp, CircleHelp } from 'lucide-react'
import { useTranslations } from '@/i18n/provider'
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
  const t = useTranslations('resourceAllocation.impact')
  const compared = Boolean(baseline)
  const baselineLabel = baseline?.kind === 'canonical-plan' ? t('canonicalBaseline') : t('current')
  const currentPriority = baseline?.summary.priority_coverage ?? baseline?.metrics.priority_coverage
  const recommendedPriority = summary.priority_coverage ?? metrics.priority_coverage
  const currentTotalCoverage =
    baseline && baseline.summary.total_available > 0
      ? baseline.summary.served / baseline.summary.total_available
      : baseline?.metrics.total_coverage
  const recommendedTotalCoverage =
    summary.total_available > 0 ? summary.served / summary.total_available : metrics.total_coverage
  const servedDelta = baseline ? Math.round(summary.served - baseline.summary.served) : null

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">
        {compared ? t('compareKicker') : t('recommendationKicker')}
      </div>
      <h2 className="mt-2 text-2xl font-medium sm:text-3xl">
        {compared ? t('compareTitle') : t('recommendationTitle')}
      </h2>

      {baseline && servedDelta !== null && servedDelta > 0 && (
        <div className="mt-6 border border-emerald-300/20 bg-emerald-300/[0.06] p-5 sm:p-6">
          <div className="text-4xl font-black tracking-tight text-emerald-200 sm:text-5xl">+{servedDelta}</div>
          <div className="mt-1 text-lg font-bold text-white">{t('heroSuffix')}</div>
          <div className="mt-1 text-sm text-emerald-100/80">{t('heroSameTeams')}</div>
          {currentPriority !== undefined && (
            <div className="mt-4 text-sm text-slate-300">
              {t('priority')}: <b>{Math.round(currentPriority * 100)}%</b> →{' '}
              <b className="text-emerald-200">{Math.round(recommendedPriority * 100)}%</b>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl text-xs leading-relaxed text-slate-500">
          <p>
            {t('scenario')}
            {planningDays ? ` · ${planningDays} ${locale === 'uk' ? 'днів' : locale === 'pl' ? 'dni' : 'days'}` : ''}
          </p>
          {baseline?.kind === 'canonical-plan' && <p className="mt-1">{t('syntheticBaseline')}</p>}
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs text-slate-500">{t('moved')}</div>
          <div className="text-xl font-bold">
            {teamsMoved}{' '}
            <span className="text-sm font-medium text-slate-500">
              {t('of')} {totalTeams}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {t('moveEvents')}: <b className="text-slate-300">{moveEvents}</b>
          </div>
        </div>
      </div>

      {!compared && <p className="mt-4 max-w-4xl text-sm text-slate-500">{t('recommendationSubtitle')}</p>}

      <div className="mt-6 grid gap-px bg-white/5 sm:grid-cols-2 xl:grid-cols-4">
        <Impact
          label={t('priority')}
          help={t('priorityHelp')}
          current={currentPriority}
          recommended={recommendedPriority}
          format="pct"
          unavailable={t('unavailable')}
          currentLabel={baselineLabel}
          recommendedLabel={t('recommended')}
        />
        <Impact
          label={t('total')}
          current={currentTotalCoverage}
          recommended={recommendedTotalCoverage}
          format="pct"
          unavailable={t('unavailable')}
          currentLabel={baselineLabel}
          recommendedLabel={t('recommended')}
        />
        <Impact
          label={t('served')}
          current={baseline?.summary.served}
          recommended={summary.served}
          unavailable={t('unavailable')}
          currentLabel={baselineLabel}
          recommendedLabel={t('recommended')}
        />
        <Impact
          label={t('unmet')}
          current={baseline?.summary.closing_unmet}
          recommended={summary.closing_unmet}
          inverse
          unavailable={t('unavailable')}
          currentLabel={baselineLabel}
          recommendedLabel={t('recommended')}
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
        <MetricLabel label={label} help={help} />
        <div className="mt-4 text-2xl font-black">{render(recommended)}</div>
        <div className="mt-2 text-xs text-slate-500">{unavailable}</div>
      </div>
    )
  const delta = recommended - current
  const favorable = Math.abs(delta) < 0.0001 ? null : inverse ? delta < 0 : delta > 0
  const Icon = delta >= 0 ? ArrowUp : ArrowDown
  const deltaText =
    format === 'pct'
      ? `${delta > 0 ? '+' : ''}${Math.round(delta * 100)} pp`
      : `${delta > 0 ? '+' : ''}${delta.toFixed(0)} units`
  return (
    <div className="bg-white/[0.04] p-4">
      <MetricLabel label={label} help={help} />
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

function MetricLabel({ label, help }: { label: string; help?: string }) {
  return (
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
  )
}