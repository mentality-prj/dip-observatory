'use client'

import type { Locale } from '@/lib/observatory-i18n'
import {
  EVERSOURCE_CAPACITY_LOSS_FACTS,
  EVERSOURCE_CAPACITY_LOSS_SOURCE_URL,
} from './capacity-loss-scenario'
import type { ContractorAllocationResult, ContractorAllocationScenario } from './domain'

const copy = {
  en: {
    eyebrow: 'Historically grounded capacity-loss case',
    title: 'Nashua AWC · 266 miles returned to bid',
    body: 'Eversource reported that a vegetation contractor could not complete all awarded 2022 miles because of limited crew resources. The Nashua AWC SMT and METT scope was returned to bid. The public circuit table totals 266.21 miles; the plan text rounds the returned scope to 266 miles.',
    source: 'Public Eversource 2022 NH Vegetation Management Plan',
    historical: 'Historical public scope',
    circuits: 'Circuits',
    smt: 'SMT miles',
    mett: 'METT miles',
    total: 'Total circuit scope',
    replay: 'QDIP synthetic recovery model',
    replayNote:
      'Circuit IDs and published SMT/METT miles are historical. Contractor identities, bids, capacities, productivity and calculated recovery economics are synthetic demo inputs.',
    returned: 'Returned to bid',
    rebid: 'Synthetic rebid complete',
    offers: '3 eligible synthetic offers',
    qdip: 'QDIP portfolio allocation',
    capacity: 'Executable incumbent capacity for returned scope',
    reallocated: 'Miles reallocated in QDIP model',
    spend: 'Synthetic expected recovery spend',
    pending: 'Run QDIP to allocate the returned scope after the synthetic rebid handoff',
    allocation: 'Recovery allocation by synthetic bidder',
    noClaim:
      'No savings claim is made against the historical award. The crew-capacity shock changed the feasible decision set; this view demonstrates a cost-minimizing feasible allocation under synthetic post-rebid constraints.',
    miles: 'mi',
  },
  uk: {
    eyebrow: 'Історично обґрунтований кейс втрати потужності',
    title: 'Nashua AWC · 266 миль повернуто на торги',
    body: 'Eversource повідомляла, що vegetation-підрядник не міг виконати весь присуджений обсяг 2022 року через обмежені ресурси бригад. Scope SMT і METT для Nashua AWC повернули на торги. Публічна таблиця circuits дає 266,21 милі; у тексті плану цей обсяг округлено до 266 миль.',
    source: 'Публічний Eversource 2022 NH Vegetation Management Plan',
    historical: 'Історичний публічний scope',
    circuits: 'Circuits',
    smt: 'Милі SMT',
    mett: 'Милі METT',
    total: 'Загальний circuit scope',
    replay: 'Синтетична recovery-модель QDIP',
    replayNote:
      'Circuit IDs та опубліковані SMT/METT miles — історичні. Назви підрядників, bids, capacities, productivity та розрахована recovery economics — синтетичні дані демо.',
    returned: 'Повернуто на bid',
    rebid: 'Синтетичний rebid завершено',
    offers: '3 допустимі synthetic offers',
    qdip: 'Портфельний розподіл QDIP',
    capacity: 'Виконувана потужність incumbent для повернутого scope',
    reallocated: 'Милі, перерозподілені в моделі QDIP',
    spend: 'Синтетична очікувана вартість recovery',
    pending: 'Запустіть QDIP для розподілу повернутого scope після synthetic rebid handoff',
    allocation: 'Recovery allocation за synthetic bidder',
    noClaim:
      'Економія відносно історичного award не заявляється. Після crew-capacity shock змінився допустимий набір рішень; цей view показує мінімальний за вартістю допустимий розподіл за синтетичних post-rebid constraints.',
    miles: 'миль',
  },
  pl: {
    eyebrow: 'Historycznie ugruntowany przypadek utraty zdolności',
    title: 'Nashua AWC · 266 mil zwrócono do przetargu',
    body: 'Eversource informował, że wykonawca vegetation nie mógł zrealizować wszystkich przyznanych mil na 2022 r. z powodu ograniczonych zasobów ekip. Zakres SMT i METT dla Nashua AWC zwrócono do przetargu. Publiczna tabela obwodów sumuje 266,21 mil; tekst planu zaokrągla ten zakres do 266 mil.',
    source: 'Publiczny Eversource 2022 NH Vegetation Management Plan',
    historical: 'Historyczny publiczny zakres',
    circuits: 'Obwody',
    smt: 'Mile SMT',
    mett: 'Mile METT',
    total: 'Łączny zakres obwodów',
    replay: 'Syntetyczny model recovery QDIP',
    replayNote:
      'Identyfikatory obwodów i opublikowane mile SMT/METT są historyczne. Nazwy wykonawców, oferty, moce, produktywność i ekonomika recovery są syntetyczne.',
    returned: 'Zwrócono do przetargu',
    rebid: 'Syntetyczny rebid zakończony',
    offers: '3 kwalifikowane syntetyczne oferty',
    qdip: 'Portfelowy przydział QDIP',
    capacity: 'Wykonalna moc incumbent dla zwróconego zakresu',
    reallocated: 'Mile przydzielone ponownie w modelu QDIP',
    spend: 'Syntetyczny oczekiwany koszt recovery',
    pending: 'Uruchom QDIP, aby przydzielić zwrócony zakres po syntetycznym rebid handoff',
    allocation: 'Recovery allocation według syntetycznego oferenta',
    noClaim:
      'Nie deklarujemy oszczędności względem historycznego awardu. Po utracie mocy zmienił się zbiór wykonalnych decyzji; widok pokazuje minimalizujący koszt wykonalny przydział przy syntetycznych ograniczeniach po rebid.',
    miles: 'mi',
  },
} as const

function money(locale: Locale, value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function miles(value: number, suffix: string) {
  return `${value.toFixed(2)} ${suffix}`
}

export function CapacityLossStory({
  locale,
  scenario,
  result,
}: {
  locale: Locale
  scenario: ContractorAllocationScenario
  result: ContractorAllocationResult | null
}) {
  const t = copy[locale]
  const unitById = new Map(scenario.units.map((unit) => [unit.id, unit]))
  const reallocatedByContractor = new Map<string, number>()
  for (const assignment of result?.assignments ?? []) {
    const unit = unitById.get(assignment.allocationUnitId)
    if (!unit || unit.quantityUnit !== 'mile') continue
    reallocatedByContractor.set(
      assignment.contractorName,
      (reallocatedByContractor.get(assignment.contractorName) ?? 0) + unit.quantity
    )
  }
  const reallocatedMiles = [...reallocatedByContractor.values()].reduce((sum, value) => sum + value, 0)
  const rows = [...reallocatedByContractor.entries()].sort((a, b) => b[1] - a[1])

  return (
    <section className="mt-6 overflow-hidden border border-sky-400/25 bg-sky-400/[.035]">
      <div className="p-5 md:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[.16em] text-sky-300">{t.eyebrow}</div>
        <h2 className="mt-3 max-w-4xl text-2xl font-medium tracking-[-.03em] text-slate-100 md:text-3xl">
          {t.title}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">{t.body}</p>
        <a
          className="mt-3 inline-block text-xs text-sky-300 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-200"
          href={EVERSOURCE_CAPACITY_LOSS_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
        >
          {t.source}
        </a>

        <div className="mt-6 text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{t.historical}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StoryMetric label={t.circuits} value={String(EVERSOURCE_CAPACITY_LOSS_FACTS.circuitCount)} />
          <StoryMetric label={t.smt} value={miles(EVERSOURCE_CAPACITY_LOSS_FACTS.smtMiles, t.miles)} />
          <StoryMetric label={t.mett} value={miles(EVERSOURCE_CAPACITY_LOSS_FACTS.mettMiles, t.miles)} />
          <StoryMetric label={t.total} value={miles(EVERSOURCE_CAPACITY_LOSS_FACTS.totalMiles, t.miles)} />
        </div>

        <div className="mt-6 grid gap-2 md:grid-cols-4">
          <ProcessStep index="01" label={t.returned} tone="historical" />
          <ProcessStep index="02" label={t.rebid} />
          <ProcessStep index="03" label={t.offers} />
          <ProcessStep index="04" label={t.qdip} tone="qdip" />
        </div>
      </div>

      <div className="grid border-t border-white/10 xl:grid-cols-[1.05fr_.95fr]">
        <div className="p-5 md:p-6">
          <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{t.replay}</div>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">{t.replayNote}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StoryMetric label={t.capacity} value={`0 ${t.miles}`} />
            <StoryMetric
              label={t.reallocated}
              value={result ? `${reallocatedMiles.toFixed(2)} / ${EVERSOURCE_CAPACITY_LOSS_FACTS.totalMiles.toFixed(2)} ${t.miles}` : '—'}
            />
            <StoryMetric label={t.spend} value={result ? money(locale, result.qdipExpectedSpend) : '—'} />
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">{t.noClaim}</p>
        </div>

        <div className="border-t border-white/10 bg-slate-950/35 p-5 md:p-6 xl:border-l xl:border-t-0">
          <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{t.allocation}</div>
          {!result ? (
            <div className="mt-6 flex min-h-40 items-center justify-center border border-dashed border-white/10 px-6 text-center text-sm text-slate-500">
              {t.pending}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {rows.map(([contractor, value]) => (
                <div key={contractor}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-300">{contractor}</span>
                    <span className="font-mono text-xs text-slate-400">
                      {value.toFixed(2)} {t.miles}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden bg-white/[.06]">
                    <div
                      className="h-full bg-sky-400 transition-[width] duration-700 ease-out"
                      style={{
                        width: `${EVERSOURCE_CAPACITY_LOSS_FACTS.totalMiles ? (value / EVERSOURCE_CAPACITY_LOSS_FACTS.totalMiles) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ProcessStep({
  index,
  label,
  tone = 'synthetic',
}: {
  index: string
  label: string
  tone?: 'historical' | 'synthetic' | 'qdip'
}) {
  const className =
    tone === 'historical'
      ? 'border-amber-300/25 bg-amber-300/[.05]'
      : tone === 'qdip'
        ? 'border-sky-400/35 bg-sky-400/[.08]'
        : 'border-white/10 bg-white/[.025]'
  return (
    <div className={`border p-3 ${className}`}>
      <div className="font-mono text-[10px] text-slate-500">{index}</div>
      <div className="mt-2 text-sm font-medium text-slate-200">{label}</div>
    </div>
  )
}

function StoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/10 p-3">
      <div className="text-[10px] uppercase tracking-[.11em] text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-medium tracking-[-.02em] text-slate-100">{value}</div>
    </div>
  )
}
