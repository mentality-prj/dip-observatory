'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Network, Play, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Table } from '@/design-system'
import type { Locale } from '@/lib/observatory-i18n'
import { runSupplyResilience } from './api'
import { SUPPLY_RESILIENCE_DEMO } from './demo-data'
import type { ResilienceAlternative, SupplyResilienceResult } from './contracts'

const copy = {
  en: { title: 'Supply network resilience', question: 'How should inventory be distributed so the loss of one logistics node does not stop the network?', run: 'Evaluate resilience', running: 'Evaluating…', context: 'Current network', recommendation: 'Recommended allocation', alternatives: 'Baseline comparison', scenarios: 'Stress scenarios', evidence: 'Decision evidence', transfers: 'Executable transfers', loss: 'Worst-case business loss', exposure: 'Largest node exposure', cost: 'Incremental logistics cost', service: 'Service level', unserved: 'Unserved demand', risk: 'Inventory at risk', validated: 'Validation gate passed', partial: 'Research candidate — validation gate not passed', heuristic: 'Deterministic heuristic search; no global optimum is claimed.', nodes: 'nodes', products: 'product classes', horizon: 'day horizon' },
  uk: { title: 'Стійкість мережі постачання', question: 'Як розподілити запаси, щоб втрата одного логістичного вузла не зупинила мережу?', run: 'Оцінити стійкість', running: 'Розрахунок…', context: 'Поточна мережа', recommendation: 'Рекомендований розподіл', alternatives: 'Порівняння з базовими стратегіями', scenarios: 'Стрес-сценарії', evidence: 'Обґрунтування рішення', transfers: 'Виконувані переміщення', loss: 'Найгірші бізнес-втрати', exposure: 'Максимальна концентрація у вузлі', cost: 'Додаткова логістична вартість', service: 'Рівень обслуговування', unserved: 'Непокритий попит', risk: 'Запаси під ризиком', validated: 'Перевірку рішення пройдено', partial: 'Дослідницький кандидат — перевірку не пройдено', heuristic: 'Детермінований евристичний пошук; глобальний оптимум не заявляється.', nodes: 'вузли', products: 'класи товарів', horizon: 'днів горизонту' },
  pl: { title: 'Odporność sieci dostaw', question: 'Jak rozmieścić zapasy, aby utrata jednego węzła logistycznego nie zatrzymała sieci?', run: 'Oceń odporność', running: 'Obliczanie…', context: 'Bieżąca sieć', recommendation: 'Rekomendowana alokacja', alternatives: 'Porównanie z wariantami bazowymi', scenarios: 'Scenariusze stresowe', evidence: 'Uzasadnienie decyzji', transfers: 'Wykonalne przesunięcia', loss: 'Najgorsza strata biznesowa', exposure: 'Maksymalna ekspozycja węzła', cost: 'Dodatkowy koszt logistyki', service: 'Poziom obsługi', unserved: 'Niezaspokojony popyt', risk: 'Zapasy narażone na ryzyko', validated: 'Walidacja decyzji zakończona', partial: 'Kandydat badawczy — walidacja niezaliczona', heuristic: 'Deterministyczne wyszukiwanie heurystyczne; brak deklaracji globalnego optimum.', nodes: 'węzły', products: 'klasy produktów', horizon: 'dni horyzontu' },
} as const

const money = (value: number, locale: Locale) => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-US', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value)
const pct = (value: number) => `${Math.round(value * 100)}%`

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[.025] p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-xl font-medium text-slate-100">{value}</div></div>
}

function AlternativeCard({ item, locale, label }: { item: ResilienceAlternative; locale: Locale; label: string }) {
  return <Card><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3"><Metric label={copy[locale].loss} value={money(item.worst_case_business_loss, locale)} /><Metric label={copy[locale].exposure} value={pct(item.maximum_node_inventory_exposure)} /><Metric label={copy[locale].cost} value={money(item.incremental_logistics_cost, locale)} /></div>{item.constraint_violations.length > 0 ? <p className="mt-4 text-sm text-[var(--ds-semantic-risk)]">{item.constraint_violations.join(' · ')}</p> : null}</CardContent></Card>
}

export function SupplyNetworkResilienceWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [result, setResult] = useState<SupplyResilienceResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const allocationByNode = useMemo(() => result ? Object.groupBy(result.recommended.allocation, (item) => item.node_id) : {}, [result])

  async function run() {
    setRunning(true); setError(null)
    try { setResult(await runSupplyResilience(SUPPLY_RESILIENCE_DEMO)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Request failed') }
    finally { setRunning(false) }
  }

  return <main className="mx-auto w-full max-w-[1540px] px-4 pb-20 sm:px-5 md:px-8 lg:px-10">
    <section className="grid gap-6 py-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
      <div><Badge variant="cyan">DECIDED · RESILIENCE</Badge><h1 className="ds-h1 mt-4 max-w-4xl">{t.title}</h1><p className="ds-lead mt-4 max-w-3xl text-slate-300">{t.question}</p></div>
      <Card><CardContent className="pt-6"><div className="grid grid-cols-3 gap-3 text-center"><div><Network className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]"/><strong>{SUPPLY_RESILIENCE_DEMO.nodes.length}</strong><p className="text-xs text-slate-500">{t.nodes}</p></div><div><ShieldCheck className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]"/><strong>{SUPPLY_RESILIENCE_DEMO.productClasses.length}</strong><p className="text-xs text-slate-500">{t.products}</p></div><div><AlertTriangle className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]"/><strong>{SUPPLY_RESILIENCE_DEMO.policy.planningHorizonDays}</strong><p className="text-xs text-slate-500">{t.horizon}</p></div></div><Button className="mt-6 w-full" onClick={run} disabled={running}><Play className="h-4 w-4" />{running ? t.running : t.run}</Button>{error ? <p className="mt-3 text-sm text-[var(--ds-semantic-danger)]">{error}</p> : null}</CardContent></Card>
    </section>

    {result ? <div className="space-y-8">
      <section><div className="mb-3 flex items-center gap-3"><h2 className="ds-h2">{t.recommendation}</h2><Badge variant={result.validation_gate.passes ? 'emerald' : 'amber'}>{result.validation_gate.passes ? t.validated : t.partial}</Badge></div><p className="mb-5 text-sm text-slate-500">{t.heuristic} Engine {result.evidence.engine_version}.</p><AlternativeCard item={result.recommended} locale={locale} label={t.recommendation} /></section>
      <section><h2 className="ds-h2 mb-4">{t.context}</h2><div className="grid gap-4 md:grid-cols-3">{SUPPLY_RESILIENCE_DEMO.nodes.map((node) => <Card key={node.id}><CardHeader><CardTitle>{node.label}</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-500">Capacity {node.capacityUnits.toLocaleString()} cases</p><div className="mt-4 space-y-2">{(allocationByNode[node.id] ?? []).map((item) => <div key={item.product_class_id} className="flex justify-between gap-4 text-sm"><span>{SUPPLY_RESILIENCE_DEMO.productClasses.find((p) => p.id === item.product_class_id)?.label ?? item.product_class_id}</span><strong>{Math.round(item.units).toLocaleString()}</strong></div>)}</div></CardContent></Card>)}</div></section>
      <section><h2 className="ds-h2 mb-4">{t.transfers}</h2>{result.recommended.transfers.length ? <Table><thead><tr><th>From</th><th>To</th><th>Class</th><th>Units</th><th>Lead time</th><th>Cost</th></tr></thead><tbody>{result.recommended.transfers.map((item, index) => <tr key={`${item.from_node_id}-${item.to_node_id}-${item.product_class_id}-${index}`}><td>{item.from_node_id}</td><td><span className="inline-flex items-center gap-2"><ArrowRight className="h-3 w-3" />{item.to_node_id}</span></td><td>{item.product_class_id}</td><td>{Math.round(item.units)}</td><td>{item.lead_time_days} d</td><td>{money(item.cost, locale)}</td></tr>)}</tbody></Table> : <p className="text-sm text-slate-500">No transfers required.</p>}</section>
      <section><h2 className="ds-h2 mb-4">{t.scenarios}</h2><Table><thead><tr><th>Scenario</th><th>{t.service}</th><th>{t.unserved}</th><th>{t.risk}</th><th>{t.loss}</th></tr></thead><tbody>{result.recommended.scenario_outcomes.map((item) => <tr key={item.scenario_id}><td>{SUPPLY_RESILIENCE_DEMO.scenarios.find((s) => s.id === item.scenario_id)?.label ?? item.scenario_id}</td><td>{pct(item.service_level)}</td><td>{Math.round(item.unserved_demand_units).toLocaleString()}</td><td>{money(item.inventory_value_at_risk, locale)}</td><td>{money(item.business_loss, locale)}</td></tr>)}</tbody></Table></section>
      <section><h2 className="ds-h2 mb-4">{t.alternatives}</h2><div className="grid gap-4 lg:grid-cols-2">{result.alternatives.map((item) => <AlternativeCard key={item.id} item={item} locale={locale} label={item.id === 'centralized-baseline' ? 'Centralized baseline' : 'Equal decentralization'} />)}</div></section>
      <section><h2 className="ds-h2 mb-4">{t.evidence}</h2><Card><CardContent className="pt-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Method" value={result.evidence.method} /><Metric label="Scenarios" value={String(result.evidence.scenario_count)} /><Metric label="Global optimum" value={result.evidence.global_optimum_guaranteed ? 'Guaranteed' : 'Not claimed'} /><Metric label="Event probabilities" value={result.evidence.event_probabilities_used ? 'Used' : 'Not used'} /></div>{result.validation_gate.passes ? <p className="mt-5 flex items-center gap-2 text-sm text-[var(--ds-semantic-success)]"><CheckCircle2 className="h-4 w-4" />{t.validated}</p> : <p className="mt-5 flex items-center gap-2 text-sm text-[var(--ds-semantic-risk)]"><AlertTriangle className="h-4 w-4" />{result.validation_gate.constraint_violations.join(' · ') || t.partial}</p>}</CardContent></Card></section>
    </div> : null}
  </main>
}
