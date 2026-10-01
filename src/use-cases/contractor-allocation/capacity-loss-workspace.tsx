'use client'

import { useMemo, useState } from 'react'
import { RefreshCw, SlidersHorizontal } from 'lucide-react'

import type { Locale } from '@/lib/observatory-i18n'
import { CapacityLossStory } from './capacity-loss-story'
import { buildContractorCapacityLossScenario } from './capacity-loss-scenario'
import { optimizeContractorAllocation } from './optimizer'

const copy = {
  en: {
    eyebrow: 'QDIP · EVERSOURCE CAPACITY-LOSS RECOVERY',
    title: 'Rebuild awarded vegetation work after a contractor capacity shock',
    subtitle:
      'A presentation replay based on the documented 2022 Nashua AWC capacity-loss event. The historical trigger is real; the contractor identities, rates, capacities and recovery economics are synthetic.',
    run: 'Run QDIP recovery',
    rerun: 'Recalculate recovery',
    status: 'Recovery status',
    feasible: 'Portfolio restored',
    miles: 'Recovered miles',
    contractors: 'Recovery contractors',
    spend: 'Expected recovery spend',
    table: 'Post-shock recovery allocation',
    batch: 'Awarded batch',
    work: 'Program',
    volume: 'Miles',
    before: 'Original award',
    after: 'QDIP recovery contractor',
    cost: 'Expected cost',
    synthetic: 'Synthetic recovery economics',
  },
  uk: {
    eyebrow: 'QDIP · ВІДНОВЛЕННЯ ПІСЛЯ ВТРАТИ ПОТУЖНОСТІ EVERSOURCE',
    title: 'Перебудова присуджених vegetation робіт після втрати потужності підрядника',
    subtitle:
      'Презентаційне відтворення на основі задокументованого кейсу Nashua AWC 2022 року. Історичний тригер реальний; назви підрядників, ставки, потужності та економіка recovery — синтетичні.',
    run: 'Запустити recovery QDIP',
    rerun: 'Перерахувати recovery',
    status: 'Статус recovery',
    feasible: 'Портфель відновлено',
    miles: 'Відновлені милі',
    contractors: 'Підрядники recovery',
    spend: 'Очікувана вартість recovery',
    table: 'Новий розподіл після втрати потужності',
    batch: 'Присуджений пакет',
    work: 'Програма',
    volume: 'Милі',
    before: 'Початковий award',
    after: 'Підрядник recovery QDIP',
    cost: 'Очікувана вартість',
    synthetic: 'Синтетична економіка recovery',
  },
  pl: {
    eyebrow: 'QDIP · RECOVERY PO UTRACIE MOCY EVERSOURCE',
    title: 'Przebudowa przyznanych prac vegetation po utracie mocy wykonawcy',
    subtitle:
      'Replay prezentacyjny oparty na udokumentowanym przypadku Nashua AWC z 2022 r. Historyczny trigger jest rzeczywisty; nazwy wykonawców, stawki, moce i ekonomika recovery są syntetyczne.',
    run: 'Uruchom recovery QDIP',
    rerun: 'Przelicz recovery',
    status: 'Status recovery',
    feasible: 'Portfel przywrócony',
    miles: 'Odzyskane mile',
    contractors: 'Wykonawcy recovery',
    spend: 'Oczekiwany koszt recovery',
    table: 'Przydział recovery po utracie mocy',
    batch: 'Przyznany pakiet',
    work: 'Program',
    volume: 'Mile',
    before: 'Pierwotny award',
    after: 'Wykonawca recovery QDIP',
    cost: 'Oczekiwany koszt',
    synthetic: 'Syntetyczna ekonomika recovery',
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

  const recoveredMiles =
    result?.assignments.reduce((sum, assignment) => sum + (unitById.get(assignment.allocationUnitId)?.quantity ?? 0), 0) ?? 0
  const recoveryContractors = new Set(result?.assignments.map((assignment) => assignment.contractorId) ?? []).size

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
            {result ? <RefreshCw className="h-4 w-4" aria-hidden /> : <SlidersHorizontal className="h-4 w-4" aria-hidden />}
            {result ? t.rerun : t.run}
          </button>
        </header>

        <CapacityLossStory locale={locale} scenario={scenario} result={result} />

        {result ? (
          <>
            <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label={t.status} value={result.status === 'OPTIMAL' ? t.feasible : result.status} />
              <Metric label={t.miles} value={`${recoveredMiles}/266`} />
              <Metric label={t.contractors} value={String(recoveryContractors)} />
              <Metric label={t.spend} value={money(locale, result.qdipExpectedSpend)} />
            </section>

            <section className="mt-7">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
                <h2 className="text-xl font-medium">{t.table}</h2>
                <span className="text-xs text-slate-500">{t.synthetic}</span>
              </div>
              <div className="mt-3 overflow-x-auto border border-white/10">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-white/[.04] text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-3">{t.batch}</th>
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
                      return (
                        <tr key={assignment.allocationUnitId} className="border-t border-white/10">
                          <td className="px-3 py-3 font-mono text-xs">{assignment.allocationUnitId}</td>
                          <td className="px-3 py-3 text-slate-300">{unit?.workType ?? '—'}</td>
                          <td className="px-3 py-3 text-right text-slate-300">{unit?.quantity ?? '—'}</td>
                          <td className="px-3 py-3 text-slate-500 line-through">Arbor North</td>
                          <td className="px-3 py-3 font-medium text-slate-100">{assignment.contractorName}</td>
                          <td className="px-3 py-3 text-right text-slate-300">{money(locale, assignment.expectedCost)}</td>
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
