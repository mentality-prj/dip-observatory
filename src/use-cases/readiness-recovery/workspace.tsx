'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { RefreshCw, SlidersHorizontal, Wrench } from 'lucide-react'
import { LOCALE_TAGS } from '@/i18n/config'
import type { Locale } from '@/lib/observatory-i18n'
import { QdipAdvantage } from './advantage'
import {
  applySensitivity,
  buildReadinessRecoveryDemo,
  READINESS_RECOVERY_DEMO_PRESETS,
  type ReadinessRecoveryDemoPreset,
} from './demo-data'
import type { ReadinessRecoveryInput, ReadinessRecoveryResult, RecoveryScenario, ScenarioLabel } from './domain'
import { readinessRecoveryI18n } from './i18n'

const LABEL_ORDER: ScenarioLabel[] = [
  'MAXIMUM_READINESS',
  'FAST_RECOVERY',
  'PARTS_CONSERVATIVE',
  'LOW_RISK',
  'BALANCED',
]

function percent(locale: Locale, value: number) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], { style: 'percent', maximumFractionDigits: 1 }).format(value)
}

function number(locale: Locale, value: number, digits = 1) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: digits }).format(value)
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-white/10 bg-white/[.035] p-4">
      <div className="text-[11px] uppercase tracking-[.12em] text-slate-500">{label}</div>
      <strong className="mt-2 block text-2xl font-medium tracking-[-.03em] text-slate-100">{value}</strong>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </div>
  )
}

function featuredScenarios(frontier: RecoveryScenario[]) {
  const selected: RecoveryScenario[] = []
  for (const label of LABEL_ORDER) {
    const scenario = frontier.find((item) => item.label === label && !selected.includes(item))
    if (scenario) selected.push(scenario)
  }
  for (const scenario of frontier) {
    if (selected.length >= 6) break
    if (!selected.includes(scenario)) selected.push(scenario)
  }
  return selected
}

function bestProbability(result: ReadinessRecoveryResult | null) {
  return result?.frontier.length ? Math.max(...result.frontier.map((item) => item.probabilityDemandSatisfied)) : 0
}

function minShortfall(result: ReadinessRecoveryResult | null) {
  return result?.frontier.length ? Math.min(...result.frontier.map((item) => item.capabilityShortfall)) : 0
}

function deadlineHoursFromInput(input: ReadinessRecoveryInput) {
  const deadlines = input.capabilityDemand.map(
    (demand) => (Date.parse(demand.deadline) - Date.parse(input.asOf)) / 3_600_000
  )
  return deadlines.length ? Math.round(Math.min(...deadlines)) : 60
}

export function ReadinessRecoveryWorkspace({ locale }: { locale: Locale }) {
  const t = readinessRecoveryI18n[locale]
  const [preset, setPreset] = useState<ReadinessRecoveryDemoPreset>('BALANCED')
  const [result, setResult] = useState<ReadinessRecoveryResult | null>(null)
  const [previousResult, setPreviousResult] = useState<ReadinessRecoveryResult | null>(null)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [deadlineHours, setDeadlineHours] = useState(() =>
    deadlineHoursFromInput(buildReadinessRecoveryDemo('BALANCED'))
  )
  const [technicianCapacity, setTechnicianCapacity] = useState(100)
  const [spareParts, setSpareParts] = useState(100)
  const [repairSuccess, setRepairSuccess] = useState(100)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseInput = useMemo(() => buildReadinessRecoveryDemo(preset), [preset])
  const featured = useMemo(() => featuredScenarios(result?.frontier ?? []), [result])
  const selected =
    result?.frontier.find((scenario) => scenario.scenarioId === selectedScenarioId) ?? featured[0] ?? null

  async function requestPlanner(input: ReturnType<typeof buildReadinessRecoveryDemo>, recalculate: boolean) {
    const endpoint = recalculate
      ? `/readiness/scenarios/${encodeURIComponent(input.scenarioId)}/recalculate`
      : '/readiness/scenarios'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input }),
    })
    const payload = (await response.json()) as ReadinessRecoveryResult | { error?: string }
    if (!response.ok || !('frontier' in payload)) {
      throw new Error('error' in payload && payload.error ? payload.error : t.error)
    }
    return payload
  }

  async function runBase() {
    setRunning(true)
    setError(null)
    try {
      const next = await requestPlanner(baseInput, false)
      setPreviousResult(null)
      setResult(next)
      setSelectedScenarioId(next.frontier[0]?.scenarioId ?? null)
      setDeadlineHours(deadlineHoursFromInput(baseInput))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.error)
    } finally {
      setRunning(false)
    }
  }

  async function recalculate() {
    if (!result) return runBase()
    setRunning(true)
    setError(null)
    try {
      const changed = applySensitivity(baseInput, {
        deadlineHours,
        technicianCapacityPct: technicianCapacity,
        sparePartsPct: spareParts,
        successProbabilityPct: repairSuccess,
      })
      const next = await requestPlanner(changed, true)
      setPreviousResult(result)
      setResult(next)
      setSelectedScenarioId(next.frontier[0]?.scenarioId ?? null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.error)
    } finally {
      setRunning(false)
    }
  }

  function changePreset(next: ReadinessRecoveryDemoPreset) {
    setPreset(next)
    setResult(null)
    setPreviousResult(null)
    setSelectedScenarioId(null)
    setDeadlineHours(deadlineHoursFromInput(buildReadinessRecoveryDemo(next)))
    setTechnicianCapacity(100)
    setSpareParts(100)
    setRepairSuccess(100)
    setError(null)
  }

  return (
    <main className="min-h-[calc(100vh-7rem)] text-white">
      <div className="mx-auto max-w-[1540px] px-4 py-7 sm:px-5 md:px-8 lg:px-10 lg:py-10">
        <header className="border-b border-white/15 pb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-[.18em] ds-text-accent">{t.eyebrow}</span>
            <span className="border border-white/15 px-3 py-1 text-xs text-slate-300">{t.synthetic}</span>
          </div>
          <h1 className="mt-5 max-w-5xl text-4xl font-medium tracking-[-.04em] md:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-5xl text-sm leading-6 text-slate-400 md:text-base">{t.subtitle}</p>
        </header>

        <section className="mt-6 border border-white/10 bg-white/[.025] p-5 md:p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t.scenario}</span>
              <select
                value={preset}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  changePreset(event.target.value as ReadinessRecoveryDemoPreset)
                }
                className="mt-2 w-full border border-white/15 bg-slate-950 px-3 py-2.5 text-sm text-slate-200"
              >
                {READINESS_RECOVERY_DEMO_PRESETS.map((value) => (
                  <option key={value} value={value}>
                    {t.presets[value]}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs leading-5 text-slate-500">{t.presetHelp[preset]}</span>
            </label>
            <button
              type="button"
              onClick={() => void runBase()}
              disabled={running}
              className="inline-flex items-center justify-center gap-2 bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60"
            >
              {result ? <RefreshCw className="h-4 w-4" aria-hidden /> : <Wrench className="h-4 w-4" aria-hidden />}
              {running ? t.running : result ? t.rerun : t.run}
            </button>
          </div>
        </section>

        {error ? (
          <div className="mt-5 border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>
        ) : null}

        {result ? (
          <>
            <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Metric label={t.assets} value={String(result.inputSummary.assets)} />
              <Metric label={t.impaired} value={String(result.inputSummary.impairedAssets)} />
              <Metric label={t.evaluated} value={String(result.diagnostics.evaluatedCandidates)} />
              <Metric label={t.removed} value={String(result.diagnostics.dominatedPlansRemoved)} />
              <Metric label={t.frontier} value={String(result.frontier.length)} />
            </section>

            <QdipAdvantage result={result} locale={locale} />

            <section className="mt-6 border border-white/10 bg-white/[.02] p-5 md:p-6">
              <div className="flex items-start gap-3">
                <SlidersHorizontal className="mt-1 h-5 w-5 shrink-0 text-sky-300" aria-hidden />
                <div>
                  <h2 className="text-xl font-medium">{t.sensitivity}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{t.sensitivityHelp}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
                <SensitivityField
                  label={t.deadline}
                  value={deadlineHours}
                  min={12}
                  max={120}
                  setValue={setDeadlineHours}
                  suffix="h"
                />
                <SensitivityField
                  label={t.technicianCapacity}
                  value={technicianCapacity}
                  min={30}
                  max={150}
                  setValue={setTechnicianCapacity}
                  suffix="%"
                />
                <SensitivityField
                  label={t.spareParts}
                  value={spareParts}
                  min={20}
                  max={150}
                  setValue={setSpareParts}
                  suffix="%"
                />
                <SensitivityField
                  label={t.repairSuccess}
                  value={repairSuccess}
                  min={40}
                  max={120}
                  setValue={setRepairSuccess}
                  suffix="%"
                />
                <button
                  type="button"
                  onClick={() => void recalculate()}
                  disabled={running}
                  className="bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {running ? t.running : t.apply}
                </button>
              </div>
            </section>

            {previousResult ? (
              <section className="mt-5 border border-white/10 bg-white/[.02] p-5 md:p-6">
                <h2 className="text-xl font-medium">{t.comparison}</h2>
                <p className="mt-1 text-sm text-slate-400">{t.comparisonHelp}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <ComparisonMetric
                    label={t.frontier}
                    before={String(previousResult.frontier.length)}
                    after={String(result.frontier.length)}
                    previous={t.previous}
                    current={t.current}
                  />
                  <ComparisonMetric
                    label={t.probability}
                    before={percent(locale, bestProbability(previousResult))}
                    after={percent(locale, bestProbability(result))}
                    previous={t.previous}
                    current={t.current}
                  />
                  <ComparisonMetric
                    label={t.shortfall}
                    before={number(locale, minShortfall(previousResult), 2)}
                    after={number(locale, minShortfall(result), 2)}
                    previous={t.previous}
                    current={t.current}
                  />
                </div>
              </section>
            ) : null}

            <section className="mt-7">
              <h2 className="text-2xl font-medium">{t.frontier}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{t.frontierHelp}</p>
              <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {featured.map((scenario) => (
                  <button
                    key={scenario.scenarioId}
                    type="button"
                    onClick={() => setSelectedScenarioId(scenario.scenarioId)}
                    className={`border p-4 text-left ${selected?.scenarioId === scenario.scenarioId ? 'border-sky-400/60 bg-sky-400/[.08]' : 'border-white/10 bg-white/[.025]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <strong className="text-base font-medium text-slate-100">{t.labels[scenario.label]}</strong>
                      <span className="font-mono text-xs text-slate-600">{scenario.selectedActions.length}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <SmallMetric label={t.probability} value={percent(locale, scenario.probabilityDemandSatisfied)} />
                      <SmallMetric label={t.readiness} value={percent(locale, scenario.expectedCapabilityReadiness)} />
                      <SmallMetric label={t.time} value={`${number(locale, scenario.expectedRecoveryTimeHours)} h`} />
                      <SmallMetric label={t.technicianHours} value={number(locale, scenario.technicianHours)} />
                      <SmallMetric label={t.failureRisk} value={percent(locale, scenario.recoveryFailureRisk)} />
                      <SmallMetric label={t.scarceParts} value={number(locale, scenario.scarcePartsConsumed, 2)} />
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-500">{t.plannerChoice}</p>
            </section>

            {selected ? <ScenarioDetail locale={locale} scenario={selected} /> : null}

            <section className="mt-7 grid gap-5 xl:grid-cols-2">
              <div className="border border-white/10 bg-white/[.02] p-5">
                <h2 className="text-xl font-medium">{t.baselines}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">{t.baselineHelp}</p>
                <div className="mt-4 space-y-2">
                  {result.baselines.map((baseline) => (
                    <div
                      key={baseline.kind}
                      className="flex items-center justify-between gap-4 border-t border-white/10 py-3 text-sm first:border-t-0"
                    >
                      <span className="font-mono text-xs text-slate-400">{baseline.kind}</span>
                      <span className="text-slate-200">
                        {baseline.scenario ? percent(locale, baseline.scenario.probabilityDemandSatisfied) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-white/10 bg-white/[.02] p-5">
                <h2 className="text-xl font-medium">{t.diagnostics}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <SmallMetric label={t.searchNodes} value={number(locale, result.diagnostics.searchNodes, 0)} />
                  <SmallMetric label={t.computeTime} value={`${number(locale, result.diagnostics.elapsedMs, 0)} ms`} />
                  <SmallMetric label={t.evaluated} value={String(result.diagnostics.evaluatedCandidates)} />
                  <SmallMetric label={t.removed} value={String(result.diagnostics.dominatedPlansRemoved)} />
                </div>
                {result.diagnostics.truncatedByNodeBudget || result.diagnostics.truncatedByTimeBudget ? (
                  <p className="mt-4 text-xs text-amber-300">{t.truncated}</p>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )

  function ScenarioDetail({ locale, scenario }: { locale: Locale; scenario: RecoveryScenario }) {
    const translations = readinessRecoveryI18n[locale]
    return (
      <section className="mt-5 border border-white/10 bg-white/[.02] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[.12em] text-sky-300">
              {translations.labels[scenario.label]}
            </div>
            <h2 className="mt-2 text-xl font-medium">{scenario.scenarioId}</h2>
          </div>
          <span className="border border-white/10 px-3 py-1 font-mono text-xs text-slate-400">
            n={scenario.uncertaintySummary.samples}
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label={translations.probability} value={percent(locale, scenario.probabilityDemandSatisfied)} />
          <Metric label={translations.shortfall} value={number(locale, scenario.capabilityShortfall, 2)} />
          <Metric label={translations.failureRisk} value={percent(locale, scenario.recoveryFailureRisk)} />
          <Metric label={translations.repeatFailureRisk} value={percent(locale, scenario.repeatFailureRisk)} />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <DetailList
            label={translations.bottlenecks}
            values={scenario.bottlenecks}
            empty={translations.noConstraints}
          />
          <DetailList
            label={translations.bindingConstraints}
            values={scenario.bindingConstraints}
            empty={translations.noConstraints}
          />
          <DetailList label={translations.drivers} values={scenario.drivers} empty={translations.noConstraints} />
        </div>
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{translations.actions}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {scenario.selectedActions.map((action) => (
              <span key={action} className="border border-white/10 px-2 py-1 font-mono text-xs text-slate-400">
                {action}
              </span>
            ))}
          </div>
        </div>
      </section>
    )
  }
}

function SensitivityField({
  label,
  value,
  min,
  max,
  suffix,
  setValue,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix: string
  setValue: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[.1em] text-slate-500">{label}</span>
      <div className="mt-2 flex items-center border border-white/15 bg-slate-950">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-200 outline-none"
        />
        <span className="pr-3 text-xs text-slate-500">{suffix}</span>
      </div>
    </label>
  )
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[.09em] text-slate-600">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-200">{value}</div>
    </div>
  )
}

function DetailList({ label, values, empty }: { label: string; values: string[]; empty: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{label}</div>
      <div className="mt-2 space-y-1 text-sm text-slate-300">
        {values.length ? (
          values.map((value) => <div key={value}>{value}</div>)
        ) : (
          <div className="text-slate-600">{empty}</div>
        )}
      </div>
    </div>
  )
}

function ComparisonMetric({
  label,
  before,
  after,
  previous,
  current,
}: {
  label: string
  before: string
  after: string
  previous: string
  current: string
}) {
  return (
    <div className="border border-white/10 p-4">
      <div className="text-xs uppercase tracking-[.1em] text-slate-500">{label}</div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="text-slate-500">{previous}</span>
        <strong className="text-slate-200">{before}</strong>
        <span className="text-slate-600">→</span>
        <span className="text-slate-500">{current}</span>
        <strong className="text-sky-200">{after}</strong>
      </div>
    </div>
  )
}
