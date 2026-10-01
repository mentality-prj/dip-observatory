'use client'

import type { Locale } from '@/lib/observatory-i18n'
import type { ContractorAllocationResult, ContractorAllocationScenario } from './domain'

const SOURCE_URL =
  'https://www.puc.nh.gov/Regulatory/Docketbk/2019/19-057/LETTERS-MEMOS-TARIFFS/19-057_2021-11-20_EVERSOURCE_2022-VMP-PLAN.PDF'

const copy = {
  en: {
    eyebrow: 'Historical capacity-loss trigger',
    title: '266 awarded miles require recovery allocation',
    body: 'Eversource reported that a vegetation contractor could not complete all awarded 2022 miles because of limited crew resources. The Nashua AWC SMT and METT miles — 266 miles — were put back out to bid.',
    source: 'Public Eversource 2022 NH Vegetation Management Plan',
    replay: 'QDIP synthetic recovery replay',
    replayNote:
      'The 266-mile trigger is historical. Contractor identities, rates, capacities and calculated recovery economics below are synthetic demo inputs.',
    awarded: 'Awarded miles returned to market',
    capacity: 'Affected contractor capacity in replay',
    recovered: 'Miles recovered by QDIP',
    spend: 'Expected recovery spend',
    pending: 'Run QDIP to rebuild the post-shock portfolio',
    allocation: 'Recovery allocation',
    noClaim:
      'This scenario does not claim savings against the historical award: the constraint set changed after the crew-capacity shock. It demonstrates feasible, cost-minimizing recovery under the new constraints.',
    miles: 'mi',
    zero: '0 mi',
  },
  uk: {
    eyebrow: 'Історичний тригер втрати потужності',
    title: '266 присуджених миль потребують нового розподілу',
    body: 'Eversource повідомляла, що підрядник з vegetation management не міг виконати весь присуджений обсяг 2022 року через брак бригад. 266 миль SMT і METT для Nashua AWC були повторно виставлені на торги.',
    source: 'Публічний Eversource 2022 NH Vegetation Management Plan',
    replay: 'Синтетичне відтворення recovery у QDIP',
    replayNote:
      'Історичним є тригер на 266 миль. Назви підрядників, ставки, потужності та розрахована економіка recovery нижче — синтетичні дані демо.',
    awarded: 'Присуджені милі, повернуті на ринок',
    capacity: 'Потужність проблемного підрядника в replay',
    recovered: 'Милі, відновлені QDIP',
    spend: 'Очікувана вартість recovery',
    pending: 'Запустіть QDIP, щоб перебудувати портфель після втрати потужності',
    allocation: 'Новий розподіл робіт',
    noClaim:
      'Цей сценарій не заявляє економію відносно історичного award: після втрати бригад змінився набір обмежень. Він демонструє допустиме й мінімальне за вартістю recovery за нових умов.',
    miles: 'миль',
    zero: '0 миль',
  },
  pl: {
    eyebrow: 'Historyczny przypadek utraty zdolności',
    title: '266 przyznanych mil wymaga ponownego przydziału',
    body: 'Eversource informował, że wykonawca vegetation management nie mógł zrealizować wszystkich przyznanych mil na 2022 r. z powodu ograniczonych zasobów ekip. 266 mil SMT i METT dla Nashua AWC ponownie skierowano do przetargu.',
    source: 'Publiczny Eversource 2022 NH Vegetation Management Plan',
    replay: 'Syntetyczny replay recovery w QDIP',
    replayNote:
      'Historyczny jest trigger 266 mil. Nazwy wykonawców, stawki, moce i obliczona ekonomika recovery poniżej są syntetycznymi danymi demo.',
    awarded: 'Przyznane mile zwrócone na rynek',
    capacity: 'Moc dotkniętego wykonawcy w replay',
    recovered: 'Mile odzyskane przez QDIP',
    spend: 'Oczekiwany koszt recovery',
    pending: 'Uruchom QDIP, aby przebudować portfel po utracie mocy',
    allocation: 'Przydział recovery',
    noClaim:
      'Scenariusz nie deklaruje oszczędności względem historycznego awardu: po utracie ekip zmienił się zestaw ograniczeń. Pokazuje wykonalne recovery o minimalnym koszcie w nowych warunkach.',
    miles: 'mi',
    zero: '0 mi',
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
  const awardedMiles = scenario.units.reduce((sum, unit) => sum + (unit.quantityUnit === 'mile' ? unit.quantity : 0), 0)
  const unitById = new Map(scenario.units.map((unit) => [unit.id, unit]))
  const recoveredByContractor = new Map<string, number>()
  for (const assignment of result?.assignments ?? []) {
    const unit = unitById.get(assignment.allocationUnitId)
    if (!unit || unit.quantityUnit !== 'mile') continue
    recoveredByContractor.set(
      assignment.contractorName,
      (recoveredByContractor.get(assignment.contractorName) ?? 0) + unit.quantity
    )
  }
  const recoveredMiles = [...recoveredByContractor.values()].reduce((sum, miles) => sum + miles, 0)
  const rows = [...recoveredByContractor.entries()].sort((a, b) => b[1] - a[1])

  return (
    <section className="mt-6 overflow-hidden border border-sky-400/25 bg-sky-400/[.035]">
      <div className="grid gap-0 xl:grid-cols-[1.05fr_.95fr]">
        <div className="p-5 md:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[.16em] text-sky-300">{t.eyebrow}</div>
          <h2 className="mt-3 max-w-3xl text-2xl font-medium tracking-[-.03em] text-slate-100 md:text-3xl">
            {t.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{t.body}</p>
          <a
            className="mt-3 inline-block text-xs text-sky-300 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-200"
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t.source}
          </a>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StoryMetric label={t.awarded} value={`${awardedMiles} ${t.miles}`} />
            <StoryMetric label={t.capacity} value={t.zero} />
            <StoryMetric label={t.recovered} value={result ? `${recoveredMiles} ${t.miles}` : '—'} />
            <StoryMetric label={t.spend} value={result ? money(locale, result.qdipExpectedSpend) : '—'} />
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{t.replay}</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{t.replayNote}</p>
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-950/35 p-5 md:p-6 xl:border-l xl:border-t-0">
          <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{t.allocation}</div>
          {!result ? (
            <div className="mt-6 flex min-h-40 items-center justify-center border border-dashed border-white/10 px-6 text-center text-sm text-slate-500">
              {t.pending}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {rows.map(([contractor, miles]) => (
                <div key={contractor}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-300">{contractor}</span>
                    <span className="font-mono text-xs text-slate-400">
                      {miles} {t.miles}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden bg-white/[.06]">
                    <div
                      className="h-full bg-sky-400 transition-[width] duration-700 ease-out"
                      style={{ width: `${awardedMiles ? (miles / awardedMiles) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">{t.noClaim}</div>
            </div>
          )}
        </div>
      </div>
    </section>
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
