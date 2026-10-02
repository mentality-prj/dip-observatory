'use client'

import { ArrowUpRight, GitBranch } from 'lucide-react'
import { LOCALE_TAGS } from '@/i18n/config'
import type { Locale } from '@/lib/observatory-i18n'
import { benchmarkReadinessResult } from './benchmark'
import { explainHeuristicMiss } from './benchmark-suite'
import type { ReadinessRecoveryResult, RecoveryScenario } from './domain'
import { readinessAdvantageI18n } from './advantage-i18n'

function percent(locale: Locale, value: number) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(value)
}

function number(locale: Locale, value: number) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 2, signDisplay: 'always' }).format(value)
}

function usesCannibalization(scenario: RecoveryScenario) {
  return scenario.selectedActions.some((actionId) => actionId.includes('cannibalize'))
}

export function QdipAdvantage({ result, locale }: { result: ReadinessRecoveryResult; locale: Locale }) {
  const t = readinessAdvantageI18n[locale]
  const benchmark = benchmarkReadinessResult(result)
  const { qdip, baseline } = benchmark
  if (!qdip || !baseline) return null

  const qdipAdvantage = benchmark.verdict === 'QDIP_ADVANTAGE'
  const heuristicAdvantage = benchmark.verdict === 'HEURISTIC_ADVANTAGE'
  const title = qdipAdvantage ? t.title : t.noMaterialAdvantage
  const missExplanation = explainHeuristicMiss(qdip, baseline)

  return (
    <section
      className={`mt-5 border p-5 md:p-6 ${qdipAdvantage ? 'border-sky-400/35 bg-sky-400/[.06]' : 'border-white/10 bg-white/[.025]'}`}
      data-benchmark-verdict={benchmark.verdict}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <div
            className={`text-xs font-semibold tracking-[.16em] ${qdipAdvantage ? 'text-sky-300' : 'text-slate-400'}`}
          >
            {t.eyebrow} · {benchmark.verdict.replaceAll('_', ' ')} · {benchmark.advantageKind}
          </div>
          <h2 className="mt-2 text-2xl font-medium tracking-[-.02em] text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{t.body}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Strongest baseline: <strong>{benchmark.baselineKind ?? '—'}</strong>
          </p>
          {heuristicAdvantage ? (
            <p className="mt-2 text-sm leading-6 text-amber-200">
              The strongest heuristic is materially better under this experiment; QDIP advantage is not claimed.
            </p>
          ) : null}
        </div>
        <ArrowUpRight className={`h-6 w-6 ${qdipAdvantage ? 'text-sky-300' : 'text-slate-500'}`} aria-hidden />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <AdvantageMetric label={t.probabilityDelta} value={percent(locale, benchmark.probabilityDelta)} />
        <AdvantageMetric label={t.readinessDelta} value={percent(locale, benchmark.readinessDelta)} />
        <AdvantageMetric label={t.shortfallReduction} value={number(locale, benchmark.shortfallReduction)} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <EvidenceMetric label="Δ recovery time" value={`${number(locale, benchmark.recoveryTimeDeltaHours)} h`} />
        <EvidenceMetric label="Δ technician-hours" value={number(locale, benchmark.technicianHoursDelta)} />
        <EvidenceMetric label="Δ scarce parts" value={number(locale, benchmark.scarcePartsDelta)} />
        <EvidenceMetric label="Δ failure risk" value={percent(locale, benchmark.failureRiskDelta)} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <ScenarioSnapshot
          label={t.qdip}
          probability={qdip.probabilityDemandSatisfied}
          readiness={qdip.expectedCapabilityReadiness}
          shortfall={qdip.capabilityShortfall}
          locale={locale}
        />
        <ScenarioSnapshot
          label={`${t.baseline} · ${benchmark.baselineKind ?? '—'}`}
          probability={baseline.probabilityDemandSatisfied}
          readiness={baseline.expectedCapabilityReadiness}
          shortfall={baseline.capabilityShortfall}
          locale={locale}
        />
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Evidence check</div>
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-400">
          {benchmark.explanation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {result.robustness ? (
        <div className="mt-5 border-t border-white/10 pt-4" data-testid="robustness-sweep">
          <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Robustness sweep</div>
          <p className="mt-2 text-sm text-slate-300">
            QDIP advantage retained in{' '}
            <strong>
              {result.robustness.retained} / {result.robustness.total}
            </strong>{' '}
            variants.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {result.robustness.variants.map((variant) => (
              <div key={variant.variantId} className="border border-white/10 bg-black/10 p-3 text-xs text-slate-400">
                <strong className="block text-slate-200">{variant.variantId}</strong>
                <span>
                  {variant.verdict.replaceAll('_', ' ')} · {variant.baselineKind ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {missExplanation.length ? (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
            Why the strongest heuristic missed this portfolio
          </div>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-400">
            {missExplanation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {qdipAdvantage && usesCannibalization(qdip) ? (
        <div className="mt-5 flex items-start gap-3 border-t border-sky-300/20 pt-4">
          <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
          <div>
            <div className="text-xs font-semibold uppercase tracking-[.12em] text-sky-300">{t.pathway}</div>
            <p className="mt-1 text-sm leading-6 text-slate-300">{t.pathwayDetected}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function AdvantageMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-sky-300/20 bg-slate-950/35 p-4">
      <div className="text-[10px] uppercase tracking-[.1em] text-slate-500">{label}</div>
      <strong className="mt-2 block text-2xl font-medium text-sky-200">{value}</strong>
    </div>
  )
}

function EvidenceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/10 p-3">
      <div className="text-[10px] uppercase tracking-[.1em] text-slate-500">{label}</div>
      <strong className="mt-1 block text-sm font-medium text-slate-200">{value}</strong>
    </div>
  )
}

function ScenarioSnapshot({
  label,
  probability,
  readiness,
  shortfall,
  locale,
}: {
  label: string
  probability: number
  readiness: number
  shortfall: number
  locale: Locale
}) {
  const formatter = new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 2 })
  const percentFormatter = new Intl.NumberFormat(LOCALE_TAGS[locale], { style: 'percent', maximumFractionDigits: 1 })
  return (
    <div className="border border-white/10 bg-black/10 p-4">
      <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{label}</div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-slate-200">
        <span>{percentFormatter.format(probability)}</span>
        <span>{percentFormatter.format(readiness)}</span>
        <span>{formatter.format(shortfall)}</span>
      </div>
    </div>
  )
}
