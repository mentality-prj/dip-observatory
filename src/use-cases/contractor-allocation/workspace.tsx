'use client'

import { useMemo, useState } from 'react'
import { CircleAlert, Database, RefreshCw, ShieldCheck, SlidersHorizontal, UsersRound } from 'lucide-react'

import { LOCALE_TAGS } from '@/i18n/config'
import type { Locale } from '@/lib/observatory-i18n'
import { buildContractorAllocationDemoScenario } from './demo-data'
import type {
  AllocationAssignment,
  AllocationReservation,
  DecisionType,
  UnitDecisionAnalysis,
} from './domain'
import { contractorAllocationI18n } from './i18n'
import { optimizeContractorAllocation } from './optimizer'

type Filter = 'all' | DecisionType

const decisionTone: Record<DecisionType, string> = {
  ALLOCATION_DECISION_REQUIRED: 'border-sky-400/30 text-sky-200',
  NO_CHOICE: 'border-emerald-400/30 text-emerald-200',
  EXCEPTION_REQUIRED: 'border-amber-400/30 text-amber-200',
  INFEASIBLE: 'border-rose-400/30 text-rose-200',
}

function money(locale: Locale, value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function percent(locale: Locale, value: number) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value)
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

function observedAlternative(analysis: UnitDecisionAnalysis) {
  if (!analysis.unit.observedContractorId) return undefined
  const candidates = analysis.feasible.filter(
    (candidate) =>
      candidate.contractorId === analysis.unit.observedContractorId &&
      candidate.expectedCost != null &&
      !candidate.requiresException
  )
  if (analysis.unit.observedContractId) {
    return candidates.find((candidate) => candidate.contractId === analysis.unit.observedContractId)
  }
  return candidates.length === 1 ? candidates[0] : undefined
}

function contractorName(analysis: UnitDecisionAnalysis, contractorId?: string) {
  if (!contractorId) return '—'
  return (
    analysis.feasible.find((candidate) => candidate.contractorId === contractorId)?.contractorName ??
    analysis.rejected.find((candidate) => candidate.contractorId === contractorId)?.contractorName ??
    contractorId
  )
}

export function ContractorAllocationWorkspace({ locale }: { locale: Locale }) {
  const t = contractorAllocationI18n[locale]
  const baseScenario = useMemo(() => buildContractorAllocationDemoScenario(), [])
  const [unavailableContractorId, setUnavailableContractorId] = useState('')
  const [result, setResult] = useState<ReturnType<typeof optimizeContractorAllocation> | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const scenario = useMemo(
    () => ({
      ...baseScenario,
      contractors: baseScenario.contractors.map((contractor) =>
        contractor.id === unavailableContractorId
          ? {
              ...contractor,
              capacityBuckets: contractor.capacityBuckets.map((bucket) => ({
                ...bucket,
                availableCapacity: 0,
              })),
            }
          : contractor
      ),
    }),
    [baseScenario, unavailableContractorId]
  )

  const assignmentByUnit = useMemo(
    () => new Map(result?.assignments.map((assignment) => [assignment.allocationUnitId, assignment]) ?? []),
    [result]
  )
  const reservationByUnit = useMemo(
    () => new Map(result?.reservations.map((reservation) => [reservation.allocationUnitId, reservation]) ?? []),
    [result]
  )
  const visibleAnalyses = useMemo(
    () => result?.analyses.filter((analysis) => filter === 'all' || analysis.type === filter) ?? [],
    [filter, result]
  )
  const selectedAnalysis = result?.analyses.find((analysis) => analysis.unit.id === selectedUnitId) ?? null
  const selectedAssignment = selectedAnalysis ? assignmentByUnit.get(selectedAnalysis.unit.id) : undefined
  const selectedReservation = selectedAnalysis ? reservationByUnit.get(selectedAnalysis.unit.id) : undefined

  function run() {
    const next = optimizeContractorAllocation(scenario)
    setResult(next)
    const firstDecision =
      next.analyses.find((analysis) => analysis.type === 'ALLOCATION_DECISION_REQUIRED') ?? next.analyses[0]
    setSelectedUnitId(firstDecision?.unit.id ?? null)
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
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-400 md:text-base">{t.subtitle}</p>
        </header>

        <section className="mt-6 border border-white/10 bg-white/[.025] p-5 md:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 ds-text-accent" aria-hidden />
            <div>
              <h2 className="text-lg font-medium">{t.authorityTitle}</h2>
              <p className="mt-1 text-sm text-slate-400">{t.authorityIntro}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Object.values(t.authority).map((item) => (
              <article key={item.title} className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-4 border border-white/10 bg-white/[.025] p-5 md:grid-cols-[1fr_auto] md:items-end md:p-6">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t.stressTitle}</span>
            <select
              value={unavailableContractorId}
              onChange={(event) => {
                setUnavailableContractorId(event.target.value)
                setResult(null)
                setSelectedUnitId(null)
              }}
              className="mt-2 w-full max-w-xl border border-white/15 bg-slate-950 px-3 py-2.5 text-sm text-slate-200"
            >
              <option value="">{t.stressNone}</option>
              {baseScenario.contractors.map((contractor) => (
                <option key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs text-slate-500">{t.stressHelp}</span>
          </label>
          <button
            type="button"
            onClick={run}
            className="inline-flex items-center justify-center gap-2 bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-300"
          >
            {result ? <RefreshCw className="h-4 w-4" aria-hidden /> : <SlidersHorizontal className="h-4 w-4" aria-hidden />}
            {result ? t.rerun : t.run}
          </button>
        </section>

        {!result ? (
          <section className="mt-6 flex min-h-44 items-center justify-center border border-dashed border-white/15 bg-white/[.02] p-6 text-center">
            <div className="max-w-xl">
              <Database className="mx-auto h-9 w-9 ds-text-accent" aria-hidden />
              <p className="mt-4 text-sm text-slate-400">{t.counterfactualNote}</p>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-medium">{t.summaryTitle}</h2>
                <span className="text-xs text-slate-500">
                  {t.status[result.status]} · {t.optimizer} {result.optimizerVersion} · {t.exploredNodes} {result.exploredNodes}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Metric label={t.coverage} value={percent(locale, result.coverage.coverageRatio)} />
                <Metric label={t.spendWithChoice} value={money(locale, result.metrics.spendWithChoice)} />
                <Metric
                  label={t.unitsWithChoice}
                  value={`${result.metrics.decisionUnits}/${result.metrics.totalUnits}`}
                  note={percent(locale, result.metrics.decisionSpaceRatio)}
                />
                <Metric label={t.observedSpend} value={money(locale, result.observedExpectedSpend)} />
                <Metric label={t.qdipSpend} value={money(locale, result.qdipExpectedSpend)} />
                <Metric
                  label={t.allocationAdvantage}
                  value={money(locale, result.counterfactualAllocationAdvantage)}
                  note={t.counterfactualNote}
                />
                <Metric label={t.choiceSpread} value={`${result.metrics.weightedChoiceSpreadPct.toFixed(1)}%`} />
                <Metric label={t.reservations} value={String(result.reservations.length)} />
                <Metric label={t.globalChoiceUnknown} value={String(result.metrics.globalChoiceUnknownUnits)} />
                <Metric label={t.unresolved} value={String(result.unresolvedUnitIds.length)} />
              </div>
            </section>

            <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,.8fr)]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-xl font-medium">{t.allocationTable}</h2>
                    <p className="mt-1 text-xs text-slate-500">{t.decisionSpaceHint}</p>
                  </div>
                  <div className="flex flex-wrap gap-2" aria-label={t.decisionSpace}>
                    {(['all', 'ALLOCATION_DECISION_REQUIRED', 'NO_CHOICE', 'EXCEPTION_REQUIRED', 'INFEASIBLE'] as const).map(
                      (value) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={filter === value}
                          onClick={() => setFilter(value)}
                          className={`border px-3 py-1.5 text-xs ${
                            filter === value ? 'border-sky-400/50 bg-sky-400/10 text-sky-200' : 'border-white/10 text-slate-400'
                          }`}
                        >
                          {t.filters[value]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto border border-white/10">
                  <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                    <thead className="bg-white/[.04] text-xs text-slate-500">
                      <tr>
                        <th className="px-3 py-3 font-medium">{t.unit}</th>
                        <th className="px-3 py-3 font-medium">{t.scope}</th>
                        <th className="px-3 py-3 font-medium">{t.observed}</th>
                        <th className="px-3 py-3 font-medium">{t.qdip}</th>
                        <th className="px-3 py-3 text-right font-medium">{t.observedCost}</th>
                        <th className="px-3 py-3 text-right font-medium">{t.qdipCost}</th>
                        <th className="px-3 py-3 text-right font-medium">{t.delta}</th>
                        <th className="px-3 py-3 font-medium">{t.decision}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleAnalyses.map((analysis) => {
                        const assignment = assignmentByUnit.get(analysis.unit.id)
                        const reservation = reservationByUnit.get(analysis.unit.id)
                        const observed = observedAlternative(analysis)
                        const selected = selectedUnitId === analysis.unit.id
                        return (
                          <tr
                            key={analysis.unit.id}
                            onClick={() => setSelectedUnitId(analysis.unit.id)}
                            className={`cursor-pointer border-t border-white/10 ${selected ? 'bg-sky-400/[.08]' : 'hover:bg-white/[.025]'}`}
                          >
                            <td className="px-3 py-3 font-mono text-xs text-slate-300">{analysis.unit.id}</td>
                            <td className="px-3 py-3 text-xs text-slate-400">
                              {analysis.unit.territory} · {analysis.unit.workType} · {analysis.unit.quantity} {analysis.unit.quantityUnit}
                            </td>
                            <td className="px-3 py-3 text-slate-300">
                              {contractorName(analysis, analysis.unit.observedContractorId)}
                            </td>
                            <td className="px-3 py-3 font-medium text-slate-100">
                              {assignment?.contractorName ?? reservation?.contractorName ?? '—'}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-slate-400">
                              {money(locale, observed?.expectedCost)}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-slate-200">
                              {money(locale, assignment?.expectedCost)}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-emerald-300">
                              {money(locale, assignment?.expectedDelta)}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-block border px-2 py-1 text-[11px] ${decisionTone[analysis.type]}`}>
                                {t.decisionLabels[analysis.type]}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="min-w-0 border border-white/10 bg-white/[.025] p-5 xl:sticky xl:top-5 xl:self-start">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 ds-text-accent" aria-hidden />
                  <h2 className="text-lg font-medium">{t.details}</h2>
                </div>
                {!selectedAnalysis ? (
                  <p className="mt-4 text-sm leading-6 text-slate-400">{t.selectUnit}</p>
                ) : (
                  <DecisionDetail
                    locale={locale}
                    analysis={selectedAnalysis}
                    assignment={selectedAssignment}
                    reservation={selectedReservation}
                    result={result}
                  />
                )}
              </aside>
            </section>

            <p className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-500">{t.modelEstimate}</p>
          </>
        )}
      </div>
    </main>
  )
}

function DecisionDetail({
  locale,
  analysis,
  assignment,
  reservation,
  result,
}: {
  locale: Locale
  analysis: UnitDecisionAnalysis
  assignment?: AllocationAssignment
  reservation?: AllocationReservation
  result: ReturnType<typeof optimizeContractorAllocation>
}) {
  const t = contractorAllocationI18n[locale]
  const unit = analysis.unit
  return (
    <div className="mt-4 space-y-5">
      <section className="border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-mono text-xs text-slate-500">{unit.id}</div>
            <h3 className="mt-1 text-lg font-medium text-slate-100">
              {unit.territory} · {unit.workType}
            </h3>
          </div>
          <span className={`border px-2 py-1 text-[11px] ${decisionTone[analysis.type]}`}>
            {t.decisionLabels[analysis.type]}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div>
            <dt className="text-slate-500">scope</dt>
            <dd className="mt-1 text-slate-300">
              {unit.scopeId} · v{unit.scopeVersion}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">quantity</dt>
            <dd className="mt-1 text-slate-300">
              {unit.quantity} {unit.quantityUnit}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">execution window</dt>
            <dd className="mt-1 text-slate-300">
              {unit.executionStart} → {unit.executionEnd}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">capacity demand</dt>
            <dd className="mt-1 text-slate-300">
              {unit.capacityRequirements.map((requirement) => `${requirement.bucket}: ${requirement.demand}`).join(', ')}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">contract volume</dt>
            <dd className="mt-1 text-slate-300">{unit.contractVolume}</dd>
          </div>
          <div>
            <dt className="text-slate-500">deadline</dt>
            <dd className="mt-1 text-slate-300">{unit.deadline}</dd>
          </div>
        </dl>
      </section>

      {assignment ? (
        <section className="border border-sky-400/20 bg-sky-400/[.04] p-4">
          <div className="text-xs uppercase tracking-[.12em] text-sky-300">{t.selectedContractor}</div>
          <strong className="mt-2 block text-xl font-medium">{assignment.contractorName}</strong>
          <div className="mt-2 text-sm text-slate-300">
            {t.expectedCost}: {money(locale, assignment.expectedCost)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {t.contract}: {assignment.contractId}
          </div>
          <div className="mt-1 break-all font-mono text-[10px] text-slate-600">
            {t.snapshot}: {result.scenarioSnapshot.algorithm} {assignment.inputSnapshotId}
          </div>
        </section>
      ) : reservation ? (
        <section className="border border-amber-400/20 bg-amber-400/[.04] p-4">
          <div className="text-xs uppercase tracking-[.12em] text-amber-300">{t.reservations}</div>
          <strong className="mt-2 block text-xl font-medium">{reservation.contractorName}</strong>
          <div className="mt-1 text-xs text-slate-500">
            {t.contract}: {reservation.contractId}
          </div>
          <div className="mt-1 break-all font-mono text-[10px] text-slate-600">
            {t.snapshot}: {result.scenarioSnapshot.algorithm} {reservation.inputSnapshotId}
          </div>
        </section>
      ) : analysis.type === 'INFEASIBLE' || analysis.type === 'EXCEPTION_REQUIRED' ? (
        <div className="flex gap-2 border border-amber-400/20 p-4 text-sm text-amber-100">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t.decisionLabels[analysis.type]}
        </div>
      ) : null}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t.feasibleAlternatives}</h3>
        <div className="mt-2 space-y-2">
          {[...analysis.feasible]
            .sort((a, b) => (a.expectedCost ?? Number.POSITIVE_INFINITY) - (b.expectedCost ?? Number.POSITIVE_INFINITY))
            .map((candidate) => (
              <div key={`${candidate.contractorId}-${candidate.contractId}`} className="border border-white/10 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium text-slate-200">{candidate.contractorName}</span>
                  <span className="tabular-nums text-slate-300">{money(locale, candidate.expectedCost)}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {candidate.contractId} · {candidate.pricingModel}
                </div>
              </div>
            ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t.rejectedAlternatives}</h3>
        {analysis.rejected.length ? (
          <div className="mt-2 space-y-2">
            {analysis.rejected.map((candidate) => (
              <div key={`${candidate.contractorId}-${candidate.contractId ?? 'contractor'}`} className="border border-white/10 p-3">
                <div className="text-sm font-medium text-slate-300">{candidate.contractorName}</div>
                {candidate.contractId ? <div className="mt-1 text-xs text-slate-600">{candidate.contractId}</div> : null}
                <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
                  {candidate.reasons.map((reason) => (
                    <li key={reason}>• {t.reasons[reason] ?? reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{t.noReason}</p>
        )}
      </section>

      <section className="border-t border-white/10 pt-4 text-xs text-slate-500">
        {t.optimizer}: {result.optimizerVersion} · {t.exploredNodes} {result.exploredNodes}
      </section>
    </div>
  )
}
