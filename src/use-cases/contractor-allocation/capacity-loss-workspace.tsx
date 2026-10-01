'use client'

import { useMemo, useState } from 'react'
import { RefreshCw, SlidersHorizontal } from 'lucide-react'

import type { Locale } from '@/lib/observatory-i18n'
import {
  buildContractorCapacityLossScenario,
  CAPACITY_LOSS_MODEL_ASSUMPTIONS,
  EVERSOURCE_CAPACITY_LOSS_CIRCUITS,
  EVERSOURCE_CAPACITY_LOSS_FACTS,
} from './capacity-loss-scenario'
import { CapacityLossStory } from './capacity-loss-story'
import { calculateEconomicValueBoundary } from './economic-value-boundary'
import { optimizeContractorAllocation } from './optimizer'

const copy = {
  en: {
    eyebrow: 'QDIP · EVERSOURCE CAPACITY-LOSS RECOVERY',
    title: 'Allocate returned Nashua vegetation scope after a contractor capacity shock',
    subtitle: 'Historically grounded presentation using the published 2022 Nashua AWC circuit scope. Public circuit IDs and SMT/METT miles are retained; post-rebid bidders, rates, capacities and economics are synthetic.',
    run: 'Run QDIP recovery allocation', rerun: 'Recalculate recovery allocation', status: 'Model status',
    feasible: 'Feasible minimum-cost synthetic portfolio', miles: 'Allocated scope', contractors: 'Synthetic recovery bidders used',
    spend: 'Synthetic expected recovery spend', table: 'Circuit-level post-rebid allocation', circuit: 'Circuit', town: 'Town', work: 'Program', volume: 'Miles',
    before: 'Demo pre-shock incumbent', after: 'QDIP recovery bidder', cost: 'Synthetic expected cost', synthetic: 'Historically grounded simulation · synthetic post-rebid economics',
    auditTitle: 'Evidence & economic-value gate', historicalEvidence: 'Historical evidence', historicalEvidenceValue: 'Circuit IDs + SMT/METT miles',
    syntheticEvidence: 'Synthetic assumptions', syntheticEvidenceValue: 'Bids, capacity, productivity, eligibility', coverage: 'Constraint coverage', coverageValue: 'UNKNOWN · demo assumptions',
    economicValue: 'Economic advantage', economicValueValue: 'NOT ESTABLISHED',
    auditNote: 'This replay proves feasible portfolio reallocation under stated synthetic assumptions. It does not prove historical savings or realized economic value. Capacity is an aggregate synthetic recovery budget represented by the optimizer bucket 2022-01.',
    boundaryTitle: 'Economic Value Boundary', boundaryIntro: 'Use Eversource-specific current-process inputs here. QDIP value is positive only when avoided allocation premium, planner effort and delay cost exceed QDIP operating cost. Defaults are deliberately conservative and do not manufacture a business case.',
    premium: 'Current allocation premium vs QDIP optimum', plannerHours: 'Planner / rebid effort', plannerRate: 'Loaded planner cost', delayDays: 'Economically relevant delay', delayCost: 'Delay cost per day', qdipCost: 'QDIP operating cost',
    currentCost: 'Current-process modeled cost', qdipCostTotal: 'QDIP modeled cost', advantage: 'Modeled economic advantage', breakEven: 'Break-even allocation premium',
    positive: 'POSITIVE VALUE', noValue: 'NO VALUE', breakEvenStatus: 'BREAK-EVEN', boundaryDisclaimer: 'Decision aid, not a historical savings claim. Replace every assumption with Eversource actuals before using this as a business case.', hours: 'h', days: 'days',
  },
  uk: {
    eyebrow: 'QDIP · RECOVERY ПІСЛЯ ВТРАТИ ПОТУЖНОСТІ EVERSOURCE', title: 'Розподіл повернутого Nashua vegetation scope після втрати потужності підрядника',
    subtitle: 'Історично обґрунтована презентація на опублікованому circuit scope Nashua AWC 2022. Реальні circuit IDs та SMT/METT miles збережені; post-rebid bidders, rates, capacities та economics — синтетичні.',
    run: 'Запустити recovery allocation QDIP', rerun: 'Перерахувати recovery allocation', status: 'Статус моделі', feasible: 'Допустимий мінімальний за вартістю synthetic portfolio',
    miles: 'Розподілений scope', contractors: 'Використані synthetic recovery bidders', spend: 'Синтетична очікувана вартість recovery', table: 'Circuit-level allocation після rebid', circuit: 'Circuit', town: 'Місто', work: 'Програма', volume: 'Милі', before: 'Demo pre-shock incumbent', after: 'Recovery bidder QDIP', cost: 'Синтетична очікувана вартість', synthetic: 'Історично обґрунтована симуляція · синтетична post-rebid economics',
    auditTitle: 'Evidence & economic-value gate', historicalEvidence: 'Історичні дані', historicalEvidenceValue: 'Circuit IDs + SMT/METT miles', syntheticEvidence: 'Синтетичні припущення', syntheticEvidenceValue: 'Bids, capacity, productivity, eligibility', coverage: 'Покриття constraints', coverageValue: 'UNKNOWN · demo assumptions', economicValue: 'Економічна перевага', economicValueValue: 'НЕ ДОВЕДЕНА',
    auditNote: 'Цей replay доводить допустимість портфельного перерозподілу за заданих synthetic assumptions. Він не доводить історичну економію або realized economic value. Capacity — агрегований synthetic recovery budget, представлений optimizer bucket 2022-01.',
    boundaryTitle: 'Economic Value Boundary', boundaryIntro: 'Підставте сюди фактичні параметри поточного процесу Eversource. Цінність QDIP позитивна лише тоді, коли уникнена allocation premium, робота planner/rebid і вартість затримки перевищують operating cost QDIP. Початкові значення навмисно консервативні.',
    premium: 'Премія поточного allocation проти optimum QDIP', plannerHours: 'Робота planner / rebid', plannerRate: 'Повна вартість години planner', delayDays: 'Економічно значуща затримка', delayCost: 'Вартість дня затримки', qdipCost: 'Operating cost QDIP',
    currentCost: 'Модельна вартість поточного процесу', qdipCostTotal: 'Модельна вартість QDIP', advantage: 'Модельна економічна перевага', breakEven: 'Break-even allocation premium', positive: 'ПОЗИТИВНА ЦІННІСТЬ', noValue: 'НЕМАЄ ЦІННОСТІ', breakEvenStatus: 'BREAK-EVEN', boundaryDisclaimer: 'Decision aid, а не твердження про історичну економію. Перед business case усі припущення треба замінити фактичними даними Eversource.', hours: 'год', days: 'днів',
  },
  pl: {
    eyebrow: 'QDIP · RECOVERY PO UTRACIE MOCY EVERSOURCE', title: 'Przydział zwróconego zakresu Nashua vegetation po utracie mocy wykonawcy',
    subtitle: 'Historycznie ugruntowana prezentacja oparta na opublikowanym zakresie obwodów Nashua AWC 2022. Publiczne identyfikatory obwodów i mile SMT/METT są zachowane; oferenci, stawki, moce i ekonomika po rebid są syntetyczne.',
    run: 'Uruchom recovery allocation QDIP', rerun: 'Przelicz recovery allocation', status: 'Status modelu', feasible: 'Wykonalny syntetyczny portfel o minimalnym koszcie', miles: 'Przydzielony zakres', contractors: 'Użyci syntetyczni oferenci recovery', spend: 'Syntetyczny oczekiwany koszt recovery', table: 'Przydział na poziomie obwodów po rebid', circuit: 'Obwód', town: 'Miejscowość', work: 'Program', volume: 'Mile', before: 'Demo pre-shock incumbent', after: 'Oferent recovery QDIP', cost: 'Syntetyczny oczekiwany koszt', synthetic: 'Historycznie ugruntowana symulacja · syntetyczna ekonomika po rebid',
    auditTitle: 'Evidence & economic-value gate', historicalEvidence: 'Dane historyczne', historicalEvidenceValue: 'Circuit IDs + SMT/METT miles', syntheticEvidence: 'Założenia syntetyczne', syntheticEvidenceValue: 'Bids, capacity, productivity, eligibility', coverage: 'Pokrycie constraints', coverageValue: 'UNKNOWN · demo assumptions', economicValue: 'Przewaga ekonomiczna', economicValueValue: 'NIE POTWIERDZONA',
    auditNote: 'Replay potwierdza wykonalną realokację portfela przy zadanych syntetycznych założeniach. Nie potwierdza historycznych oszczędności ani realized economic value. Capacity jest agregowanym syntetycznym recovery budget reprezentowanym przez bucket optymalizatora 2022-01.',
    boundaryTitle: 'Economic Value Boundary', boundaryIntro: 'Wprowadź rzeczywiste parametry obecnego procesu Eversource. Wartość QDIP jest dodatnia tylko wtedy, gdy uniknięta premia alokacyjna, praca planisty/rebid i koszt opóźnienia przekraczają koszt operacyjny QDIP. Wartości początkowe są celowo konserwatywne.',
    premium: 'Premia obecnej alokacji względem optimum QDIP', plannerHours: 'Praca planner / rebid', plannerRate: 'Pełny koszt godziny planisty', delayDays: 'Ekonomicznie istotne opóźnienie', delayCost: 'Koszt dnia opóźnienia', qdipCost: 'Koszt operacyjny QDIP', currentCost: 'Modelowany koszt obecnego procesu', qdipCostTotal: 'Modelowany koszt QDIP', advantage: 'Modelowana przewaga ekonomiczna', breakEven: 'Break-even allocation premium', positive: 'DODATNIA WARTOŚĆ', noValue: 'BRAK WARTOŚCI', breakEvenStatus: 'BREAK-EVEN', boundaryDisclaimer: 'Decision aid, nie twierdzenie o historycznych oszczędnościach. Przed business case każde założenie należy zastąpić rzeczywistymi danymi Eversource.', hours: 'h', days: 'dni',
  },
} as const

function money(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function ContractorCapacityLossWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const scenario = useMemo(() => buildContractorCapacityLossScenario(), [])
  const [result, setResult] = useState<ReturnType<typeof optimizeContractorAllocation> | null>(null)
  const [premiumPct, setPremiumPct] = useState(0)
  const [plannerHours, setPlannerHours] = useState(0)
  const [plannerRate, setPlannerRate] = useState(100)
  const [delayDays, setDelayDays] = useState(0)
  const [delayCost, setDelayCost] = useState(0)
  const [qdipOperatingCost, setQdipOperatingCost] = useState(5000)
  const unitById = useMemo(() => new Map(scenario.units.map((unit) => [unit.id, unit])), [scenario])
  const circuitById = useMemo(() => new Map(EVERSOURCE_CAPACITY_LOSS_CIRCUITS.map((row) => [row.circuit, row])), [])
  const allocatedMiles = result?.assignments.reduce((sum, assignment) => sum + (unitById.get(assignment.allocationUnitId)?.quantity ?? 0), 0) ?? 0
  const recoveryBidders = new Set(result?.assignments.map((assignment) => assignment.contractorId) ?? []).size
  const boundary = result ? calculateEconomicValueBoundary({ qdipRecoverySpend: result.qdipExpectedSpend, currentAllocationPremiumPct: premiumPct, plannerHours, plannerHourlyCost: plannerRate, delayDays, delayCostPerDay: delayCost, qdipOperatingCost }) : null
  const boundaryStatus = boundary?.status === 'POSITIVE_VALUE' ? t.positive : boundary?.status === 'NO_VALUE' ? t.noValue : t.breakEvenStatus

  return <main className="min-h-[calc(100vh-7rem)] text-white"><div className="mx-auto max-w-[1540px] px-4 py-7 sm:px-5 md:px-8 lg:px-10 lg:py-10">
    <header className="border-b border-white/15 pb-7"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold tracking-[.18em] ds-text-accent">{t.eyebrow}</span><span className="border border-white/15 px-3 py-1 text-xs text-slate-300">{t.synthetic}</span></div><h1 className="mt-5 max-w-5xl text-4xl font-medium tracking-[-.04em] md:text-6xl">{t.title}</h1><p className="mt-4 max-w-4xl text-sm leading-6 text-slate-400 md:text-base">{t.subtitle}</p><button type="button" onClick={() => setResult(optimizeContractorAllocation(scenario))} className="mt-6 inline-flex items-center justify-center gap-2 bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-300">{result ? <RefreshCw className="h-4 w-4" aria-hidden /> : <SlidersHorizontal className="h-4 w-4" aria-hidden />}{result ? t.rerun : t.run}</button></header>
    <CapacityLossStory locale={locale} scenario={scenario} result={result} />
    <section className="mt-5 border border-amber-300/20 bg-amber-300/[.035] p-4 md:p-5"><div className="text-xs font-semibold uppercase tracking-[.12em] text-amber-200">{t.auditTitle}</div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label={t.historicalEvidence} value={t.historicalEvidenceValue}/><Metric label={t.syntheticEvidence} value={t.syntheticEvidenceValue}/><Metric label={t.coverage} value={t.coverageValue}/><Metric label={t.economicValue} value={t.economicValueValue}/></div><p className="mt-4 max-w-5xl text-xs leading-5 text-slate-400">{t.auditNote}</p><span className="sr-only">{CAPACITY_LOSS_MODEL_ASSUMPTIONS.capacityHorizon}</span></section>
    {result && boundary ? <>
      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label={t.status} value={result.status === 'OPTIMAL' ? t.feasible : result.status}/><Metric label={t.miles} value={`${allocatedMiles.toFixed(2)} / ${EVERSOURCE_CAPACITY_LOSS_FACTS.totalMiles.toFixed(2)} mi`}/><Metric label={t.contractors} value={String(recoveryBidders)}/><Metric label={t.spend} value={money(locale, result.qdipExpectedSpend)}/></section>
      <section className="mt-7 border border-sky-400/25 bg-sky-400/[.035] p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-[.14em] text-sky-300">{t.boundaryTitle}</div><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{t.boundaryIntro}</p></div><span className={`border px-3 py-1.5 text-xs font-bold ${boundary.status === 'POSITIVE_VALUE' ? 'border-emerald-400/40 text-emerald-300' : boundary.status === 'NO_VALUE' ? 'border-rose-400/40 text-rose-300' : 'border-amber-300/40 text-amber-200'}`}>{boundaryStatus}</span></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"><Slider label={t.premium} value={premiumPct} setValue={setPremiumPct} min={0} max={25} step={0.5} suffix="%"/><Slider label={t.plannerHours} value={plannerHours} setValue={setPlannerHours} min={0} max={200} step={5} suffix={` ${t.hours}`}/><Slider label={t.plannerRate} value={plannerRate} setValue={setPlannerRate} min={0} max={300} step={10} prefix="$" suffix="/h"/><Slider label={t.delayDays} value={delayDays} setValue={setDelayDays} min={0} max={60} step={1} suffix={` ${t.days}`}/><Slider label={t.delayCost} value={delayCost} setValue={setDelayCost} min={0} max={25000} step={500} prefix="$" suffix="/day"/><Slider label={t.qdipCost} value={qdipOperatingCost} setValue={setQdipOperatingCost} min={0} max={50000} step={1000} prefix="$"/></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label={t.currentCost} value={money(locale, boundary.currentProcessCost)}/><Metric label={t.qdipCostTotal} value={money(locale, boundary.qdipProcessCost)}/><Metric label={t.advantage} value={`${boundary.economicAdvantage >= 0 ? '+' : ''}${money(locale, boundary.economicAdvantage)}`}/><Metric label={t.breakEven} value={`${boundary.breakEvenAllocationPremiumPct.toFixed(2)}%`}/></div><p className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">{t.boundaryDisclaimer}</p>
      </section>
      <section className="mt-7"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3"><h2 className="text-xl font-medium">{t.table}</h2><span className="text-xs text-slate-500">{t.synthetic}</span></div><div className="mt-3 overflow-x-auto border border-white/10"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-white/[.04] text-xs text-slate-500"><tr><th className="px-3 py-3">{t.circuit}</th><th className="px-3 py-3">{t.town}</th><th className="px-3 py-3">{t.work}</th><th className="px-3 py-3 text-right">{t.volume}</th><th className="px-3 py-3">{t.before}</th><th className="px-3 py-3">{t.after}</th><th className="px-3 py-3 text-right">{t.cost}</th></tr></thead><tbody>{result.assignments.map((assignment) => { const unit = unitById.get(assignment.allocationUnitId); const circuit = unit ? circuitById.get(unit.scopeId) : undefined; return <tr key={assignment.allocationUnitId} className="border-t border-white/10"><td className="px-3 py-3 font-mono text-xs">{unit?.scopeId ?? assignment.allocationUnitId}</td><td className="px-3 py-3 text-slate-400">{circuit?.town ?? '—'}</td><td className="px-3 py-3 text-slate-300">{unit?.workType ?? '—'}</td><td className="px-3 py-3 text-right text-slate-300">{unit?.quantity != null ? unit.quantity.toFixed(2) : '—'}</td><td className="px-3 py-3 text-slate-500 line-through">Synthetic incumbent</td><td className="px-3 py-3 font-medium text-slate-100">{assignment.contractorName}</td><td className="px-3 py-3 text-right text-slate-300">{money(locale, assignment.expectedCost)}</td></tr>})}</tbody></table></div></section>
    </> : null}
  </div></main>
}

function Slider({ label, value, setValue, min, max, step, prefix = '', suffix = '' }: { label: string; value: number; setValue: (value: number) => void; min: number; max: number; step: number; prefix?: string; suffix?: string }) {
  return <label className="block"><span className="flex items-center justify-between gap-3 text-xs text-slate-400"><span>{label}</span><strong className="font-mono text-slate-200">{prefix}{value.toLocaleString()}{suffix}</strong></span><input className="mt-3 w-full accent-sky-400" type="range" min={min} max={max} step={step} value={value} onChange={(event) => setValue(Number(event.target.value))}/></label>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="border border-white/10 bg-white/[.035] p-4"><div className="text-[11px] uppercase tracking-[.12em] text-slate-500">{label}</div><strong className="mt-2 block text-2xl font-medium tracking-[-.03em] text-slate-100">{value}</strong></div> }
