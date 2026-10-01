'use client'

import { useMemo, useState } from 'react'
import { Database, RefreshCw, SlidersHorizontal, UsersRound } from 'lucide-react'

import { LOCALE_TAGS } from '@/i18n/config'
import type { Locale } from '@/lib/observatory-i18n'
import {
  buildContractorAllocationDemoScenario,
  CONTRACTOR_ALLOCATION_DEMO_PRESETS,
  type ContractorAllocationDemoPreset,
} from './demo-data'
import type {
  AllocationAssignment,
  AllocationReservation,
  DecisionType,
  UnitDecisionAnalysis,
} from './domain'
import { contractorAllocationI18n } from './i18n'
import { optimizeContractorAllocation } from './optimizer'

type Filter = 'all' | DecisionType
type RoleView = 'INSPECTOR' | 'PROCUREMENT' | 'OPERATIONS' | 'PLANNER' | 'QDIP'

const ROLE_VIEWS: RoleView[] = ['INSPECTOR', 'PROCUREMENT', 'OPERATIONS', 'PLANNER', 'QDIP']

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
  const [preset, setPreset] = useState<ContractorAllocationDemoPreset>('CAPACITY_CONSTRAINED')
  const [view, setView] = useState<RoleView>('PLANNER')
  const [result, setResult] = useState<ReturnType<typeof optimizeContractorAllocation> | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const scenario = useMemo(() => buildContractorAllocationDemoScenario(preset), [preset])
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

  function changePreset(next: ContractorAllocationDemoPreset) {
    setPreset(next)
    setResult(null)
    setSelectedUnitId(null)
    setFilter('all')
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
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t.viewAs}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ROLE_VIEWS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setView(role)}
                    aria-pressed={view === role}
                    className={`border px-3 py-2 text-sm ${
                      view === role
                        ? 'border-sky-400/50 bg-sky-400/10 text-sky-200'
                        : 'border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.roles[role]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{t.roleHelp[view]}</p>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t.scenario}</span>
              <select
                value={preset}
                onChange={(event) => changePreset(event.target.value as ContractorAllocationDemoPreset)}
                className="mt-2 w-full border border-white/15 bg-slate-950 px-3 py-2.5 text-sm text-slate-200"
              >
                {CONTRACTOR_ALLOCATION_DEMO_PRESETS.map((value) => (
                  <option key={value} value={value}>
                    {t.presets[value]}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs leading-5 text-slate-500">{t.presetHelp[preset]}</span>
            </label>

            <button
              type="button"
              onClick={run}
              className="inline-flex items-center justify-center gap-2 bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-300"
            >
              {result ? <RefreshCw className="h-4 w-4" aria-hidden /> : <SlidersHorizontal className="h-4 w-4" aria-hidden />}
              {result ? t.rerun : t.run}
            </button>
          </div>
        </section>

        <section className="mt-5 border border-white/10 bg-white/[.02] p-5">
          <h2 className="text-lg font-medium">{t.inputOwnership}</h2>
          <p className="mt-1 text-sm text-slate-400">{t.inputOwnershipIntro}</p>
        </section>

        {view === 'INSPECTOR' ? <InspectorView locale={locale} /> : null}
        {view === 'PROCUREMENT' ? <ProcurementView locale={locale} /> : null}
        {view === 'OPERATIONS' ? <OperationsView locale={locale} /> : null}
        {view === 'PLANNER' ? (
          <PlannerView locale={locale} result={result} assignmentByUnit={assignmentByUnit} reservationByUnit={reservationByUnit} />
        ) : null}
        {view === 'QDIP' ? (
          <QdipView
            locale={locale}
            result={result}
            visibleAnalyses={visibleAnalyses}
            filter={filter}
            setFilter={setFilter}
            selectedUnitId={selectedUnitId}
            setSelectedUnitId={setSelectedUnitId}
            assignmentByUnit={assignmentByUnit}
            reservationByUnit={reservationByUnit}
            selectedAnalysis={selectedAnalysis}
            selectedAssignment={selectedAssignment}
            selectedReservation={selectedReservation}
          />
        ) : null}
      </div>
    </main>
  )

  function InspectorView({ locale }: { locale: Locale }) {
    const copy = contractorAllocationI18n[locale]
    return (
      <section className="mt-6">
        <h2 className="text-xl font-medium">{copy.inspectorTitle}</h2>
        <div className="mt-3 overflow-x-auto border border-white/10">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-white/[.04] text-xs text-slate-500">
              <tr>
                <th className="px-3 py-3">{copy.unit}</th><th className="px-3 py-3">{copy.territory}</th><th className="px-3 py-3">{copy.workType}</th><th className="px-3 py-3">{copy.quantity}</th><th className="px-3 py-3">{copy.executionWindow}</th><th className="px-3 py-3">{copy.requirements}</th>
              </tr>
            </thead>
            <tbody>
              {scenario.units.map((unit) => (
                <tr key={unit.id} className="border-t border-white/10">
                  <td className="px-3 py-3 font-mono text-xs">{unit.id}</td>
                  <td className="px-3 py-3 text-slate-300">{unit.territory}</td>
                  <td className="px-3 py-3 text-slate-300">{unit.workType}</td>
                  <td className="px-3 py-3 text-slate-300">{unit.quantity} {unit.quantityUnit}</td>
                  <td className="px-3 py-3 text-slate-400">{unit.executionStart} → {unit.executionEnd}</td>
                  <td className="px-3 py-3 text-slate-400">{[...unit.requiredEquipment, ...unit.requiredCertifications].join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  function ProcurementView({ locale }: { locale: Locale }) {
    const copy = contractorAllocationI18n[locale]
    const rows = scenario.contractors.flatMap((contractor) => contractor.contracts.map((contract) => ({ contractor, contract })))
    return (
      <section className="mt-6">
        <h2 className="text-xl font-medium">{copy.procurementTitle}</h2>
        <div className="mt-3 overflow-x-auto border border-white/10">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/[.04] text-xs text-slate-500"><tr><th className="px-3 py-3">{copy.contractor}</th><th className="px-3 py-3">{copy.contract}</th><th className="px-3 py-3">{copy.workType}</th><th className="px-3 py-3">{copy.rate}</th><th className="px-3 py-3">{copy.remainingVolume}</th></tr></thead>
            <tbody>
              {rows.map(({ contractor, contract }) => (
                <tr key={`${contractor.id}-${contract.id}`} className="border-t border-white/10">
                  <td className="px-3 py-3">{contractor.name}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-400">{contract.id}</td>
                  <td className="px-3 py-3 text-slate-300">{contract.workTypes.join(', ')}</td>
                  <td className="px-3 py-3 text-slate-300">{contract.rates.map((rate) => rate.unitRate != null ? `${rate.workType}: ${money(locale, rate.unitRate)}` : `${rate.workType}: ${money(locale, rate.laborRate)}/h`).join(' · ')}</td>
                  <td className="px-3 py-3 text-slate-300">{contract.remainingMinVolume}–{contract.remainingMaxVolume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  function OperationsView({ locale }: { locale: Locale }) {
    const copy = contractorAllocationI18n[locale]
    return (
      <section className="mt-6">
        <h2 className="text-xl font-medium">{copy.operationsTitle}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {scenario.contractors.map((contractor) => (
            <article key={contractor.id} className="border border-white/10 bg-white/[.025] p-4">
              <h3 className="font-medium text-slate-100">{contractor.name}</h3>
              <div className="mt-3 text-xs text-slate-500">{copy.capacity}</div>
              <div className="mt-1 text-sm text-slate-300">{contractor.capacityBuckets.map((bucket) => `${bucket.bucket}: ${bucket.availableCapacity}`).join(' · ')}</div>
              <div className="mt-4 text-xs text-slate-500">{copy.productivity}</div>
              <div className="mt-2 space-y-2">
                {contractor.executionProfiles.map((profile) => (
                  <div key={profile.workType} className="border-t border-white/10 pt-2 text-xs text-slate-400">
                    <span className="text-slate-200">{profile.workType}</span> · capacity ×{profile.capacityMultiplier}
                    {profile.laborHoursPerUnit != null ? ` · ${copy.labor} ${profile.laborHoursPerUnit}h/unit` : ''}
                    {profile.equipmentHoursPerUnit != null ? ` · ${copy.equipment} ${profile.equipmentHoursPerUnit}h/unit` : ''}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  function PlannerView({
    locale,
    result,
    assignmentByUnit,
    reservationByUnit,
  }: {
    locale: Locale
    result: ReturnType<typeof optimizeContractorAllocation> | null
    assignmentByUnit: Map<string, AllocationAssignment>
    reservationByUnit: Map<string, AllocationReservation>
  }) {
    const copy = contractorAllocationI18n[locale]
    return (
      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-xl font-medium">{copy.plannerTitle}</h2><p className="mt-1 text-sm text-slate-500">{copy.noManualSelection}</p></div>
          {result ? <span className="text-xs text-slate-500">{copy.status[result.status]}</span> : null}
        </div>
        <div className="mt-3 overflow-x-auto border border-white/10">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-white/[.04] text-xs text-slate-500"><tr><th className="px-3 py-3">{copy.unit}</th><th className="px-3 py-3">{copy.workType}</th><th className="px-3 py-3">{copy.executionWindow}</th><th className="px-3 py-3">{copy.assignment}</th></tr></thead>
            <tbody>
              {scenario.units.map((unit) => {
                const assignment = assignmentByUnit.get(unit.id)
                const reservation = reservationByUnit.get(unit.id)
                return (
                  <tr key={unit.id} className="border-t border-white/10">
                    <td className="px-3 py-3 font-mono text-xs">{unit.id}</td>
                    <td className="px-3 py-3 text-slate-300">{unit.workType} · {unit.quantity} {unit.quantityUnit}</td>
                    <td className="px-3 py-3 text-slate-400">{unit.executionStart} → {unit.executionEnd}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-100">{assignment?.contractorName ?? reservation?.contractorName ?? copy.pendingAllocation}</div>
                      {assignment || reservation ? <div className="mt-1 text-xs text-sky-300">{copy.autoAssigned}</div> : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  function QdipView({
    locale,
    result,
    visibleAnalyses,
    filter,
    setFilter,
    selectedUnitId,
    setSelectedUnitId,
    assignmentByUnit,
    reservationByUnit,
    selectedAnalysis,
    selectedAssignment,
    selectedReservation,
  }: {
    locale: Locale
    result: ReturnType<typeof optimizeContractorAllocation> | null
    visibleAnalyses: UnitDecisionAnalysis[]
    filter: Filter
    setFilter: (filter: Filter) => void
    selectedUnitId: string | null
    setSelectedUnitId: (id: string) => void
    assignmentByUnit: Map<string, AllocationAssignment>
    reservationByUnit: Map<string, AllocationReservation>
    selectedAnalysis: UnitDecisionAnalysis | null
    selectedAssignment?: AllocationAssignment
    selectedReservation?: AllocationReservation
  }) {
    const copy = contractorAllocationI18n[locale]
    if (!result) {
      return (
        <section className="mt-6 flex min-h-44 items-center justify-center border border-dashed border-white/15 bg-white/[.02] p-6 text-center">
          <div className="max-w-xl"><Database className="mx-auto h-9 w-9 ds-text-accent" aria-hidden /><p className="mt-4 text-sm text-slate-400">{copy.counterfactualNote}</p></div>
        </section>
      )
    }

    return (
      <>
        <section className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="text-xl font-medium">{copy.qdipTitle}</h2><span className="text-xs text-slate-500">{copy.status[result.status]}</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label={copy.observedSpend} value={money(locale, result.observedExpectedSpend)} />
            <Metric label={copy.qdipSpend} value={money(locale, result.qdipExpectedSpend)} />
            <Metric label={copy.allocationAdvantage} value={money(locale, result.counterfactualAllocationAdvantage)} note={copy.counterfactualNote} />
            <Metric label={copy.spendWithChoice} value={money(locale, result.metrics.spendWithChoice)} />
            <Metric label={copy.unitsWithChoice} value={`${result.metrics.decisionUnits}/${result.metrics.totalUnits}`} note={`${copy.coverage}: ${percent(locale, result.coverage.coverageRatio)}`} />
          </div>
          <details className="mt-3 border border-white/10 bg-white/[.02] p-4 text-sm text-slate-400">
            <summary className="cursor-pointer text-slate-300">{copy.modelDiagnostics}</summary>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4 text-xs">
              <span>{copy.choiceSpread}: {result.metrics.weightedChoiceSpreadPct.toFixed(1)}%</span>
              <span>{copy.reservations}: {result.reservations.length}</span>
              <span>{copy.globalChoiceUnknown}: {result.metrics.globalChoiceUnknownUnits}</span>
              <span>{copy.optimizer}: {result.optimizerVersion} · {copy.exploredNodes}: {result.exploredNodes}</span>
            </div>
            <div className="mt-2 break-all font-mono text-[10px] text-slate-600">{copy.snapshot}: {result.scenarioSnapshot.id}</div>
          </details>
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(380px,.8fr)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
              <div><h2 className="text-xl font-medium">{copy.allocationTable}</h2><p className="mt-1 text-xs text-slate-500">{copy.decisionSpaceHint}</p></div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'ALLOCATION_DECISION_REQUIRED', 'NO_CHOICE', 'EXCEPTION_REQUIRED', 'INFEASIBLE'] as const).map((value) => (
                  <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`border px-3 py-1.5 text-xs ${filter === value ? 'border-sky-400/50 bg-sky-400/10 text-sky-200' : 'border-white/10 text-slate-400'}`}>{copy.filters[value]}</button>
                ))}
              </div>
            </div>
            <div className="mt-3 overflow-x-auto border border-white/10">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-white/[.04] text-xs text-slate-500"><tr><th className="px-3 py-3">{copy.unit}</th><th className="px-3 py-3">{copy.observed}</th><th className="px-3 py-3">{copy.qdip}</th><th className="px-3 py-3 text-right">{copy.observedCost}</th><th className="px-3 py-3 text-right">{copy.qdipCost}</th><th className="px-3 py-3 text-right">{copy.delta}</th><th className="px-3 py-3">{copy.decision}</th></tr></thead>
                <tbody>
                  {visibleAnalyses.map((analysis) => {
                    const assignment = assignmentByUnit.get(analysis.unit.id)
                    const reservation = reservationByUnit.get(analysis.unit.id)
                    const observed = observedAlternative(analysis)
                    return (
                      <tr key={analysis.unit.id} onClick={() => setSelectedUnitId(analysis.unit.id)} className={`cursor-pointer border-t border-white/10 ${selectedUnitId === analysis.unit.id ? 'bg-sky-400/[.08]' : 'hover:bg-white/[.025]'}`}>
                        <td className="px-3 py-3"><div className="font-mono text-xs">{analysis.unit.id}</div><div className="mt-1 text-xs text-slate-500">{analysis.unit.workType} · {analysis.unit.quantity} {analysis.unit.quantityUnit}</div></td>
                        <td className="px-3 py-3 text-slate-300">{contractorName(analysis, analysis.unit.observedContractorId)}</td>
                        <td className="px-3 py-3 font-medium">{assignment?.contractorName ?? reservation?.contractorName ?? '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-400">{money(locale, observed?.expectedCost)}</td>
                        <td className="px-3 py-3 text-right">{money(locale, assignment?.expectedCost)}</td>
                        <td className="px-3 py-3 text-right text-emerald-300">{money(locale, assignment?.expectedDelta)}</td>
                        <td className="px-3 py-3"><span className={`inline-block border px-2 py-1 text-[11px] ${decisionTone[analysis.type]}`}>{copy.decisionLabels[analysis.type]}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="min-w-0 border border-white/10 bg-white/[.025] p-5 xl:sticky xl:top-5 xl:self-start">
            <div className="flex items-center gap-2"><UsersRound className="h-4 w-4 ds-text-accent" aria-hidden /><h2 className="text-lg font-medium">{copy.details}</h2></div>
            {selectedAnalysis ? <DecisionDetail locale={locale} analysis={selectedAnalysis} assignment={selectedAssignment} reservation={selectedReservation} result={result} /> : null}
          </aside>
        </section>
        <p className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-500">{copy.modelEstimate}</p>
      </>
    )
  }
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
  const impacts = result.portfolioImpacts[analysis.unit.id] ?? []
  return (
    <div className="mt-4 space-y-5">
      <section className="border-t border-white/10 pt-4">
        <div className="font-mono text-xs text-slate-500">{analysis.unit.id}</div>
        <h3 className="mt-1 text-lg font-medium">{analysis.unit.territory} · {analysis.unit.workType}</h3>
        <div className="mt-2 text-xs text-slate-500">{analysis.unit.executionStart} → {analysis.unit.executionEnd}</div>
      </section>

      {assignment ? (
        <section className="border border-sky-400/20 bg-sky-400/[.04] p-4">
          <div className="text-xs uppercase tracking-[.12em] text-sky-300">{t.selectedContractor}</div>
          <strong className="mt-2 block text-xl font-medium">{assignment.contractorName}</strong>
          <div className="mt-2 text-sm text-slate-300">{t.localCost}: {money(locale, assignment.expectedCost)}</div>
          <div className="mt-1 text-xs text-slate-500">{t.contract}: {assignment.contractId}</div>
        </section>
      ) : reservation ? (
        <section className="border border-amber-400/20 bg-amber-400/[.04] p-4"><strong>{reservation.contractorName}</strong><div className="mt-1 text-xs text-slate-500">{t.reservations}</div></section>
      ) : null}

      {impacts.length ? (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t.portfolioImpact}</h3>
          <div className="mt-2 space-y-2">
            {impacts.map((impact) => (
              <div key={impact.contractorId} className="border border-white/10 p-3 text-sm">
                <div className="flex items-center justify-between gap-3"><span className="font-medium text-slate-200">{impact.contractorName}</span><span className="text-xs text-slate-500">{impact.status === 'SELECTED' ? t.selected : impact.status === 'FEASIBLE' ? t.feasible : impact.status === 'INFEASIBLE' ? t.infeasible : t.unknown}</span></div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400"><span>{t.localCost}: {money(locale, impact.expectedCost)}</span><span>{t.forcedPortfolio}: {impact.portfolioDelta == null ? '—' : money(locale, impact.portfolioDelta)}</span></div>
                {impact.contractId ? <div className="mt-1 font-mono text-[10px] text-slate-600">{impact.contractId}</div> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t.feasibleAlternatives}</h3>
        <div className="mt-2 space-y-2">
          {[...analysis.feasible].sort((a, b) => (a.expectedCost ?? Number.POSITIVE_INFINITY) - (b.expectedCost ?? Number.POSITIVE_INFINITY)).map((candidate) => (
            <div key={`${candidate.contractorId}-${candidate.contractId}`} className="border border-white/10 p-3 text-sm">
              <div className="flex justify-between gap-3"><span className="font-medium text-slate-200">{candidate.contractorName}</span><span>{money(locale, candidate.expectedCost)}</span></div>
              <div className="mt-1 text-xs text-slate-500">{candidate.contractId} · capacity {candidate.executionEstimate.capacityRequirements.map((item) => `${item.bucket}:${item.demand.toFixed(1)}`).join(', ')}</div>
              {candidate.executionEstimate.expectedLaborHours != null ? <div className="mt-1 text-xs text-slate-500">{t.labor}: {candidate.executionEstimate.expectedLaborHours.toFixed(1)}h · {t.equipment}: {candidate.executionEstimate.expectedEquipmentHours?.toFixed(1) ?? '—'}h</div> : null}
            </div>
          ))}
        </div>
      </section>

      {analysis.rejected.length ? (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t.rejectedAlternatives}</h3>
          <div className="mt-2 space-y-2">
            {analysis.rejected.map((candidate) => (
              <div key={`${candidate.contractorId}-${candidate.contractId ?? 'contractor'}`} className="border border-white/10 p-3 text-xs text-slate-500">
                <div className="font-medium text-slate-300">{candidate.contractorName}</div>
                <div className="mt-1">{candidate.reasons.map((reason) => t.reasons[reason] ?? reason).join(' · ')}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
