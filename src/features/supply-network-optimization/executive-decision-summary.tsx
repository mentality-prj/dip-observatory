'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/design-system'
import type { Locale } from '@/lib/observatory-i18n'
import type { OptimizationResult, SupplyNetwork } from './domain'

const copy = {
  en: {
    title: 'Decision summary', baselineHeadline: (s: string) => `The current plan can fulfill ${s} of demand`, disruptionHeadline: (s: string) => `After the disruption, the network can fulfill ${s} of demand`,
    unserved: 'units of demand remain unserved', service: 'Demand fulfilled', logistics: 'Logistics cost', impact: 'Estimated economic impact', utilization: 'Peak warehouse utilization',
    constraintTitle: 'What is preventing a better result', routeEvidence: (r: string, c: number, h: number) => `${r} is already at its delivery limit on ${c} of ${h} days.`,
    routeVsStorage: (u: string) => `Warehouses reach only ${u} utilization, so storage space is not the main problem. Delivery capacity is.`,
    genericConstraint: 'The current network limits a better result. Open the technical details below to see which limits are reached.',
    impactNote: 'Estimate based on the demo demand and cost assumptions; not an accounting forecast.', delta: 'vs baseline', improve: 'Test improvement options', unservedDelta: 'unserved',
  },
  uk: {
    title: 'Підсумок рішення', baselineHeadline: (s: string) => `Оптимізована мережа може виконати ${s} попиту`, disruptionHeadline: (s: string) => `Після збою мережа може виконати ${s} попиту`,
    unserved: 'од. попиту залишаються непокритими', service: 'Виконання попиту', logistics: 'Вартість логістики', impact: 'Оцінений економічний вплив', utilization: 'Максимальне завантаження складів',
    constraintTitle: 'Що заважає отримати кращий результат', routeEvidence: (r: string, c: number, h: number) => `${r} уже працює на межі пропускної здатності у ${c} з ${h} днів.`,
    routeVsStorage: (u: string) => `Склади завантажені максимум на ${u}, тому проблема не в нестачі місця. Обмеження виникає на доставці.`,
    genericConstraint: 'Поточна конфігурація мережі не дозволяє отримати кращий результат. У технічних деталях нижче можна побачити, які саме ліміти досягнуті.',
    impactNote: 'Оцінка на основі демонстраційного попиту та заданих витрат; це не бухгалтерський прогноз.', delta: 'проти базового сценарію', improve: 'Перевірити варіанти покращення', unservedDelta: 'непокрито',
  },
  pl: {
    title: 'Podsumowanie decyzji', baselineHeadline: (s: string) => `Zoptymalizowana sieć może zrealizować ${s} popytu`, disruptionHeadline: (s: string) => `Po zakłóceniu sieć może zrealizować ${s} popytu`,
    unserved: 'jedn. popytu pozostaje niezaspokojonych', service: 'Realizacja popytu', logistics: 'Koszt logistyki', impact: 'Szacowany wpływ ekonomiczny', utilization: 'Maksymalne wykorzystanie magazynów',
    constraintTitle: 'Co nie pozwala uzyskać lepszego wyniku', routeEvidence: (r: string, c: number, h: number) => `${r} wykorzystuje pełną dostępną przepustowość przez ${c} z ${h} dni.`,
    routeVsStorage: (u: string) => `Magazyny są wykorzystane maksymalnie w ${u}, więc problemem nie jest brak miejsca. Ograniczeniem jest przepustowość dostaw.`,
    genericConstraint: 'Obecna konfiguracja sieci nie pozwala uzyskać lepszego wyniku. W szczegółach technicznych poniżej można sprawdzić, które limity zostały osiągnięte.',
    impactNote: 'Szacunek oparty na demonstracyjnym popycie i przyjętych kosztach; nie jest prognozą księgową.', delta: 'względem bazowego scenariusza', improve: 'Sprawdź warianty poprawy', unservedDelta: 'niezaspokojone',
  },
} as const

const number = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(v)
const pct = (v: number) => `${Math.round(v * 100)}%`
const signed = (v: number, suffix = '') => `${v > 0 ? '+' : ''}${number(v)}${suffix}`

function routeBottleneck(result: OptimizationResult, network: SupplyNetwork) {
  const counts = new Map<string, number>()
  for (const constraint of result.binding_constraints) {
    const [kind, from, to] = constraint.split(':')
    if (kind !== 'delivery-route-capacity' || !from || !to) continue
    const key = `${from}:${to}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  if (!top) return null
  const [from, to] = top[0].split(':')
  return {
    label: `${network.warehouses.find((x) => x.id === from)?.label ?? from} → ${network.demand_points.find((x) => x.id === to)?.label ?? to}`,
    count: top[1],
  }
}

function peakUtilization(result: OptimizationResult) {
  return Math.max(0, ...result.warehouse_utilization.filter((x) => x.used).map((x) => x.capacity_utilization))
}

export function ExecutiveDecisionSummary({ result, baseline, hasDisruption, locale, network }: {
  result: OptimizationResult; baseline: OptimizationResult | null; hasDisruption: boolean; locale: Locale; network: SupplyNetwork
}) {
  const t = copy[locale], route = routeBottleneck(result, network), utilization = peakUtilization(result)
  const serviceDelta = baseline ? (result.kpis.service_level - baseline.kpis.service_level) * 100 : null
  const unservedDelta = baseline ? result.kpis.unserved_demand_units - baseline.kpis.unserved_demand_units : null
  const logisticsDelta = baseline ? result.kpis.logistics_cost - baseline.kpis.logistics_cost : null
  return (
    <section className="mb-5" aria-labelledby="supply-decision-summary">
      <Card>
        <CardHeader><CardTitle id="supply-decision-summary">{t.title}</CardTitle></CardHeader>
        <CardContent>
          <h2 className="max-w-4xl text-2xl font-medium tracking-[-.02em] text-slate-100 md:text-3xl">
            {hasDisruption ? t.disruptionHeadline(pct(result.kpis.service_level)) : t.baselineHeadline(pct(result.kpis.service_level))}
          </h2>
          <p className="mt-3 text-sm text-slate-300"><strong className="text-slate-100">{number(result.kpis.unserved_demand_units)}</strong> {t.unserved}.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label={t.service} value={pct(result.kpis.service_level)} delta={serviceDelta === null ? null : signed(serviceDelta, ' pp')} deltaLabel={t.delta} />
            <Metric label={t.logistics} value={`${number(result.kpis.logistics_cost)} ₴`} delta={logisticsDelta === null ? null : `${signed(logisticsDelta)} ₴`} deltaLabel={t.delta} />
            <Metric label={t.impact} value={`${number(result.kpis.estimated_business_impact)} ₴`} note={t.impactNote} />
            <Metric label={t.utilization} value={pct(utilization)} delta={unservedDelta === null ? null : `${signed(unservedDelta)} ${t.unservedDelta}`} deltaLabel={t.delta} />
          </div>
          <div className="mt-6 rounded-lg border border-amber-300/15 bg-amber-300/[.035] p-4">
            <h3 className="text-sm font-medium text-slate-100">{t.constraintTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {route ? `${t.routeEvidence(route.label, route.count, network.policy.planning_horizon_days)} ${utilization < 0.8 ? t.routeVsStorage(pct(utilization)) : ''}` : t.genericConstraint}
            </p>
          </div>
          {hasDisruption ? <a href="#supply-alternatives" className="mt-5 inline-flex text-sm font-semibold text-cyan-200">{t.improve} →</a> : null}
        </CardContent>
      </Card>
    </section>
  )
}

function Metric({ label, value, delta, deltaLabel, note }: { label: string; value: string; delta?: string | null; deltaLabel?: string; note?: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[.025] p-3">
    <div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-lg font-medium text-slate-100">{value}</div>
    {delta ? <div className="mt-1 text-xs text-slate-400">{delta} · {deltaLabel}</div> : null}
    {note ? <p className="mt-2 text-[11px] leading-4 text-slate-500">{note}</p> : null}
  </div>
}
