'use client'

import { useMemo, useState } from 'react'
import { RefreshCw, SlidersHorizontal } from 'lucide-react'

import type { Locale } from '@/lib/observatory-i18n'
import {
  buildContractorCapacityLossScenario,
  EVERSOURCE_CAPACITY_LOSS_CIRCUITS,
  EVERSOURCE_CAPACITY_LOSS_FACTS,
} from './capacity-loss-scenario'
import { CapacityLossStory } from './capacity-loss-story'
import { optimizeContractorAllocation } from './optimizer'

const copy = {
  en: {
    eyebrow: 'QDIP · EVERSOURCE CAPACITY-LOSS RECOVERY',
    title: 'Allocate returned Nashua vegetation scope after a contractor capacity shock',
    subtitle:
      'Historically grounded presentation using the published 2022 Nashua AWC circuit scope. Public circuit IDs and SMT/METT miles are retained; post-rebid bidders, rates, capacities and economics are synthetic.',
    run: 'Run QDIP recovery allocation',
    rerun: 'Recalculate recovery allocation',
    status: 'Model status',
    feasible: 'Feasible minimum-cost portfolio',
    miles: 'Allocated scope',
    contractors: 'Synthetic recovery bidders used',
    spend: 'Synthetic expected recovery spend',
    table: 'Circuit-level post-rebid allocation',
    circuit: 'Circuit',
    town: 'Town',
    work: 'Program',
    volume: 'Miles',
    before: 'Demo pre-shock incumbent',
    after: 'QDIP recovery bidder',
    cost: 'Synthetic expected cost',
    synthetic: 'Historically grounded simulation · synthetic post-rebid economics',
  },
  uk: {
    eyebrow: 'QDIP · RECOVERY ПІСЛЯ ВТРАТИ ПОТУЖНОСТІ EVERSOURCE',
    title: 'Розподіл повернутого Nashua vegetation scope після втрати потужності підрядника',
    subtitle:
      'Історично обґрунтована презентація на опублікованому circuit scope Nashua AWC 2022. Реальні circuit IDs та SMT/METT miles збережені; post-rebid bidders, rates, capacities та economics — синтетичні.',
    run: 'Запустити recovery allocation QDIP',
    rerun: 'Перерахувати recovery allocation',
    status: 'Статус моделі',
    feasible: 'Допустимий мінімальний за вартістю портфель',
    miles: 'Розподілений scope',
    contractors: 'Використані synthetic recovery bidders',
    spend: 'Синтетична очікувана вартість recovery',
    table: 'Circuit-level allocation після rebid',
    circuit: 'Circuit',
    town: 'Місто',
    work: 'Програма',
    volume: 'Милі',
    before: 'Demo pre-shock incumbent',
    after: 'Recovery bidder QDIP',
    cost: 'Синтетична очікувана вартість',
    synthetic: 'Історично обґрунтована симуляція · синтетична post-rebid economics',
  },
  pl: {
    eyebrow: 'QDIP · RECOVERY PO UTRACIE MOCY EVERSOURCE',
    title: 'Przydział zwróconego zakresu Nashua vegetation po utracie mocy wykonawcy',
    subtitle:
      'Historycznie ugruntowana prezentacja oparta na opublikowanym zakresie obwodów Nashua AWC 2022. Publiczne identyfikatory obwodów i mile SMT/METT są zachowane; oferenci, stawki, moce i ekonomika po rebid są syntetyczne.',
    run: 'Uruchom recovery allocation QDIP',
    rerun: 'Przelicz recovery allocation',
    status: 'Status modelu',
    feasible: 'Wykonalny portfel o minimalnym koszcie',
    miles: 'Przydzielony zakres',
    contractors: 'Użyci syntetyczni oferenci recovery',
    spend: 'Syntetyczny oczekiwany koszt recovery',
    table: 'Przydział na poziomie obwodów po rebid',
    circuit: 'Obwód',
    town: 'Miejscowość',
    work: 'Program',
    volume: 'Mile',
    before: 'Demo pre-shock incumbent',
    after: 'Oferent recovery QDIP',
    cost: 'Syntetyczny oczekiwany koszt',
    synthetic: 'Historycznie ugruntowana symulacja · syntetyczna ekonomika po rebid',
  },
} as const

function money(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function ContractorCapacityLossWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const scenario = useMemo(() => buildContractorCapacityLossScenario(), [])
  const [result, setResult] = useState<ReturnType<typeof optimizeContractorAllocation> | null>(null)
  const unitById = useMemo(() => new Map(scenario.units.map((unit) => [unit.id, unit])), [scenario])
  const circuitById = useMemo(() => new Map(EVERSOURCE_CAPACITY_LOSS_CIRCUITS.map((row) => [row.circuit, row])), [])

  const allocatedMiles =
    result?.assignments.reduce(
      (sum, assignment) => sum + (unitById.get(assignment.allocationUnitId)?.quantity ?? 0),
      0
    ) ?? 0
  const recoveryBidders = new Set(result?.assignments.map((assignment) => assignment.contractorId) ?? []).size

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
          <button
            type="button"
            onClick={() => setResult(optimizeContractorAllocation(scenario))}
            className="mt-6 inline-flex items-center justify-center gap-2 bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-300"
          >
            {result ? (
              <RefreshCw className="h-4 w-4" aria-hidden />
            ) : (
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
            )}
            {result ? t.rerun : t.run}
          </button>
        </header>

        <CapacityLossStory locale={locale} scenario={scenario} result={result} />

        {result ? (
          <>
            <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label={t.status} value={result.status === 'OPTIMAL' ? t.feasible : result.status} />
              <Metric
                label={t.miles}
                value={`${allocatedMiles.toFixed(2)} / ${EVERSOURCE_CAPACITY_LOSS_FACTS.totalMiles.toFixed(2)} mi`}
              />
              <Metric label={t.contractors} value={String(recoveryBidders)} />
              <Metric label={t.spend} value={money(locale, result.qdipExpectedSpend)} />
            </section>

            <section className="mt-7">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
                <h2 className="text-xl font-medium">{t.table}</h2>
                <span className="text-xs text-slate-500">{t.synthetic}</span>
              </div>
              <div className="mt-3 overflow-x-auto border border-white/10">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-white/[.04] text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-3">{t.circuit}</th>
                      <th className="px-3 py-3">{t.town}</th>
                      <th className="px-3 py-3">{t.work}</th>
                      <th className="px-3 py-3 text-right">{t.volume}</th>
                      <th className="px-3 py-3">{t.before}</th>
                      <th className="px-3 py-3">{t.after}</th>
                      <th className="px-3 py-3 text-right">{t.cost}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.assignments.map((assignment) => {
                      const unit = unitById.get(assignment.allocationUnitId)
                      const circuit = unit ? circuitById.get(unit.scopeId) : undefined
                      return (
                        <tr key={assignment.allocationUnitId} className="border-t border-white/10">
                          <td className="px-3 py-3 font-mono text-xs">
                            {unit?.scopeId ?? assignment.allocationUnitId}
                          </td>
                          <td className="px-3 py-3 text-slate-400">{circuit?.town ?? '—'}</td>
                          <td className="px-3 py-3 text-slate-300">{unit?.workType ?? '—'}</td>
                          <td className="px-3 py-3 text-right text-slate-300">
                            {unit?.quantity != null ? unit.quantity.toFixed(2) : '—'}
                          </td>
                          <td className="px-3 py-3 text-slate-500 line-through">Synthetic incumbent</td>
                          <td className="px-3 py-3 font-medium text-slate-100">{assignment.contractorName}</td>
                          <td className="px-3 py-3 text-right text-slate-300">
                            {money(locale, assignment.expectedCost)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[.035] p-4">
      <div className="text-[11px] uppercase tracking-[.12em] text-slate-500">{label}</div>
      <strong className="mt-2 block text-2xl font-medium tracking-[-.03em] text-slate-100">{value}</strong>
    </div>
  )
}
