'use client'

import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, MapPin, Network, Play, Plus, Warehouse as WarehouseIcon } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/design-system'
import type { Locale } from '@/lib/observatory-i18n'
import {
  runCandidateAreas,
  runManualCandidate,
  runOptimization,
  runUnavailableScenario,
} from './api'
import { SUPPLY_NETWORK_DEMO } from './demo-data'
import type {
  CandidateResult,
  CandidateWarehouse,
  DemandPoint,
  OptimizationResult,
  ScenarioComparison,
  StorageClass,
  SupplyNetwork,
  Warehouse,
} from './domain'

const NetworkMap = dynamic(
  () => import('./network-map').then((module) => module.NetworkMap),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[540px] animate-pulse rounded-xl border border-white/10 bg-white/[.025]" data-testid="map-loading">
        <p className="p-5 text-sm text-slate-500">Loading geographic network…</p>
      </div>
    ),
  }
)

const copy = {
  en: {
    title: 'Optimize where inventory should be stored and how stores should be supplied.',
    intro: 'QDIP allocates inventory, inbound supply and fulfillment across a geographic network under capacity, compatibility, route and service constraints.',
    optimize: 'Optimize current network',
    optimizing: 'Optimizing…',
    current: 'Current network',
    optimized: 'Baseline optimized',
    unavailable: 'Warehouse unavailable',
    reallocated: 'Reallocated network',
    newWarehouse: 'New warehouse',
    makeUnavailable: 'Make warehouse unavailable',
    confirmUnavailable: 'Confirm warehouse unavailability',
    cancel: 'Cancel',
    addHere: 'Add warehouse here',
    candidateArea: 'Recommended warehouse area',
    noCandidate: 'No candidate improves the objective enough to justify its cost.',
    service: 'Service level',
    unserved: 'Unserved demand',
    logistics: 'Logistics cost',
    risk: 'Inventory at risk',
    utilization: 'Highest warehouse utilization',
    businessLoss: 'Business loss',
    affected: 'Affected demand points',
    evidence: 'Decision evidence',
    capacity: 'Capacity',
    receiving: 'Receiving / day',
    dispatch: 'Dispatch / day',
    operating: 'Operating cost',
    storage: 'Storage classes',
    evaluate: 'Evaluate candidate',
    candidateNotUsed: 'The optimizer does not use this warehouse under the current objective.',
    candidateUsed: 'The optimizer uses this warehouse in the recalculated plan.',
    demand: 'Demand',
    source: 'Source warehouse',
    status: 'Service status',
    served: 'served',
    pending: 'Optimization request in progress.',
    clickHint: 'Click an empty map location to test your own warehouse candidate.',
    improvement: 'Objective improvement',
    requiredCapacity: 'Assigned inventory',
  },
  uk: {
    title: 'Оптимізуйте, де зберігати запаси та з яких складів постачати магазини.',
    intro: 'QDIP розподіляє запаси, вхідні поставки та виконання попиту в географічній мережі з урахуванням місткості, сумісності, маршрутів і рівня сервісу.',
    optimize: 'Оптимізувати поточну мережу',
    optimizing: 'Оптимізація…',
    current: 'Поточна мережа',
    optimized: 'Оптимізована база',
    unavailable: 'Склад недоступний',
    reallocated: 'Перерозподілена мережа',
    newWarehouse: 'Новий склад',
    makeUnavailable: 'Зробити склад недоступним',
    confirmUnavailable: 'Підтвердити недоступність складу',
    cancel: 'Скасувати',
    addHere: 'Додати склад тут',
    candidateArea: 'Рекомендована зона для складу',
    noCandidate: 'Жоден кандидат не покращує ціль достатньо, щоб виправдати його вартість.',
    service: 'Рівень сервісу',
    unserved: 'Непокритий попит',
    logistics: 'Вартість логістики',
    risk: 'Запаси під ризиком',
    utilization: 'Найвище завантаження складу',
    businessLoss: 'Бізнес-втрати',
    affected: 'Зачеплені точки попиту',
    evidence: 'Обґрунтування рішення',
    capacity: 'Місткість',
    receiving: 'Приймання / день',
    dispatch: 'Відвантаження / день',
    operating: 'Операційна вартість',
    storage: 'Класи зберігання',
    evaluate: 'Оцінити кандидата',
    candidateNotUsed: 'Оптимізатор не використовує цей склад за поточної цільової функції.',
    candidateUsed: 'Оптимізатор використовує цей склад у перерахованому плані.',
    demand: 'Попит',
    source: 'Склад-постачальник',
    status: 'Статус обслуговування',
    served: 'обслуговано',
    pending: 'Виконується розрахунок.',
    clickHint: 'Клікніть у вільне місце на мапі, щоб перевірити власний варіант складу.',
    improvement: 'Покращення цільової функції',
    requiredCapacity: 'Призначений запас',
  },
  pl: {
    title: 'Optymalizuj, gdzie przechowywać zapasy i z których magazynów obsługiwać sklepy.',
    intro: 'QDIP alokuje zapasy, dostawy przychodzące i realizację popytu w sieci geograficznej z ograniczeniami pojemności, zgodności, tras i poziomu obsługi.',
    optimize: 'Optymalizuj bieżącą sieć',
    optimizing: 'Optymalizacja…',
    current: 'Bieżąca sieć',
    optimized: 'Zoptymalizowana baza',
    unavailable: 'Magazyn niedostępny',
    reallocated: 'Sieć po realokacji',
    newWarehouse: 'Nowy magazyn',
    makeUnavailable: 'Ustaw magazyn jako niedostępny',
    confirmUnavailable: 'Potwierdź niedostępność magazynu',
    cancel: 'Anuluj',
    addHere: 'Dodaj magazyn tutaj',
    candidateArea: 'Rekomendowany obszar magazynu',
    noCandidate: 'Żaden kandydat nie poprawia celu na tyle, aby uzasadnić jego koszt.',
    service: 'Poziom obsługi',
    unserved: 'Niezaspokojony popyt',
    logistics: 'Koszt logistyki',
    risk: 'Zapasy narażone na ryzyko',
    utilization: 'Najwyższe wykorzystanie magazynu',
    businessLoss: 'Strata biznesowa',
    affected: 'Dotknięte punkty popytu',
    evidence: 'Uzasadnienie decyzji',
    capacity: 'Pojemność',
    receiving: 'Przyjęcie / dzień',
    dispatch: 'Wysyłka / dzień',
    operating: 'Koszt operacyjny',
    storage: 'Klasy składowania',
    evaluate: 'Oceń kandydata',
    candidateNotUsed: 'Optymalizator nie wykorzystuje tego magazynu przy bieżącej funkcji celu.',
    candidateUsed: 'Optymalizator wykorzystuje ten magazyn w przeliczonym planie.',
    demand: 'Popyt',
    source: 'Magazyn źródłowy',
    status: 'Status obsługi',
    served: 'obsłużono',
    pending: 'Trwa optymalizacja.',
    clickHint: 'Kliknij pusty punkt na mapie, aby sprawdzić własny wariant magazynu.',
    improvement: 'Poprawa funkcji celu',
    requiredCapacity: 'Przypisany zapas',
  },
} as const

const number = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
const pct = (value: number) => `${Math.round(value * 100)}%`

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[.025] p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-medium text-slate-100">{value}</div>
    </div>
  )
}

function highestUtilization(result: OptimizationResult) {
  return Math.max(0, ...result.warehouse_utilization.filter((item) => item.used).map((item) => item.capacity_utilization))
}

function Kpis({ result, locale }: { result: OptimizationResult; locale: Locale }) {
  const t = copy[locale]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Metric label={t.service} value={pct(result.kpis.service_level)} />
      <Metric label={t.unserved} value={number(result.kpis.unserved_demand_units)} />
      <Metric label={t.logistics} value={number(result.kpis.logistics_cost)} />
      <Metric label={t.risk} value={number(result.kpis.inventory_value_at_risk)} />
      <Metric label={t.utilization} value={pct(highestUtilization(result))} />
      <Metric label={t.businessLoss} value={number(result.kpis.business_loss)} />
    </div>
  )
}

function withUnavailable(network: SupplyNetwork, warehouseId: string): SupplyNetwork {
  return {
    ...network,
    unavailable_warehouse_ids: Array.from(new Set([...network.unavailable_warehouse_ids, warehouseId])),
  }
}

export function SupplyNetworkOptimizationWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [baseline, setBaseline] = useState<OptimizationResult | null>(null)
  const [scenario, setScenario] = useState<ScenarioComparison | null>(null)
  const [candidateAreas, setCandidateAreas] = useState<CandidateResult[]>([])
  const [recommendedCandidateId, setRecommendedCandidateId] = useState<string | null>(null)
  const [manualResult, setManualResult] = useState<OptimizationResult | null>(null)
  const [manualEvaluation, setManualEvaluation] = useState<CandidateResult | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [selectedStore, setSelectedStore] = useState<DemandPoint | null>(null)
  const [confirmWarehouseId, setConfirmWarehouseId] = useState<string | null>(null)
  const [candidateLocation, setCandidateLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [candidateCapacity, setCandidateCapacity] = useState(1800)
  const [candidateReceiving, setCandidateReceiving] = useState(340)
  const [candidateDispatch, setCandidateDispatch] = useState(380)
  const [candidateOperatingCost, setCandidateOperatingCost] = useState(2200)
  const [candidateStorage, setCandidateStorage] = useState<StorageClass[]>(['ambient', 'controlled'])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unavailableIds = scenario ? [scenario.unavailable_warehouse_id] : []
  const activeNetwork = useMemo(
    () => scenario ? withUnavailable(SUPPLY_NETWORK_DEMO, scenario.unavailable_warehouse_id) : SUPPLY_NETWORK_DEMO,
    [scenario]
  )
  const visibleResult = manualResult ?? scenario?.disrupted ?? baseline

  const manualCandidate = useMemo<CandidateWarehouse | null>(() => {
    if (!candidateLocation) return null
    return {
      id: 'manual-candidate',
      label: 'User candidate',
      latitude: candidateLocation.latitude,
      longitude: candidateLocation.longitude,
      capacity_units: candidateCapacity,
      receiving_capacity_units_per_day: candidateReceiving,
      dispatch_capacity_units_per_day: candidateDispatch,
      supported_storage_classes: candidateStorage,
      operating_cost: candidateOperatingCost,
    }
  }, [
    candidateCapacity,
    candidateDispatch,
    candidateLocation,
    candidateOperatingCost,
    candidateReceiving,
    candidateStorage,
  ])

  const selectedService = selectedStore && visibleResult
    ? visibleResult.demand_service.find((item) => item.demand_point_id === selectedStore.id)
    : null
  const selectedUtilization = selectedWarehouse && visibleResult
    ? visibleResult.warehouse_utilization.find((item) => item.warehouse_id === selectedWarehouse.id)
    : null
  const recommendedCandidate = candidateAreas.find((item) => item.candidate_id === recommendedCandidateId) ?? null

  const optimize = useCallback(async () => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      setBaseline(await runOptimization(SUPPLY_NETWORK_DEMO))
      setScenario(null)
      setCandidateAreas([])
      setRecommendedCandidateId(null)
      setManualResult(null)
      setManualEvaluation(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed')
    } finally {
      setPending(false)
    }
  }, [pending])

  const makeUnavailable = useCallback(async (warehouseId: string) => {
    if (pending) return
    setPending(true)
    setError(null)
    setConfirmWarehouseId(null)
    try {
      const comparison = await runUnavailableScenario(SUPPLY_NETWORK_DEMO, warehouseId)
      setBaseline(comparison.baseline)
      setScenario(comparison)
      setManualResult(null)
      setManualEvaluation(null)
      const disruptedNetwork = withUnavailable(SUPPLY_NETWORK_DEMO, warehouseId)
      const candidates = await runCandidateAreas(disruptedNetwork)
      setCandidateAreas(candidates.candidates)
      setRecommendedCandidateId(candidates.recommended_candidate_id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed')
    } finally {
      setPending(false)
    }
  }, [pending])

  const evaluateManual = useCallback(async () => {
    if (pending || !manualCandidate) return
    if (
      manualCandidate.capacity_units <= 0 ||
      manualCandidate.receiving_capacity_units_per_day <= 0 ||
      manualCandidate.dispatch_capacity_units_per_day <= 0 ||
      manualCandidate.supported_storage_classes.length === 0
    ) {
      setError('Capacity fields must be positive and at least one storage class is required.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const result = await runManualCandidate(activeNetwork, manualCandidate)
      setManualEvaluation(result.candidate)
      setManualResult(result.optimized_network)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed')
    } finally {
      setPending(false)
    }
  }, [activeNetwork, manualCandidate, pending])

  const selectWarehouse = useCallback((warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setSelectedStore(null)
  }, [])
  const selectStore = useCallback((store: DemandPoint) => {
    setSelectedStore(store)
    setSelectedWarehouse(null)
  }, [])
  const selectMapLocation = useCallback((latitude: number, longitude: number) => {
    setCandidateLocation({ latitude, longitude })
    setManualResult(null)
    setManualEvaluation(null)
  }, [])

  const stages = [
    { label: t.current, active: !baseline },
    { label: t.optimized, active: Boolean(baseline && !scenario) },
    { label: t.unavailable, active: Boolean(scenario && !manualResult) },
    { label: t.reallocated, active: Boolean(scenario && !manualResult) },
    { label: t.newWarehouse, active: Boolean(manualResult) },
  ]

  return (
    <main className="mx-auto w-full max-w-[1640px] px-4 pb-20 sm:px-5 md:px-8 lg:px-10">
      <section className="grid gap-6 py-8 xl:grid-cols-[1.5fr_.7fr] xl:items-end">
        <div>
          <Badge variant="cyan">QDIP OBSERVATORY · SUPPLY NETWORK OPTIMIZATION</Badge>
          <h1 className="ds-h1 mt-4 max-w-5xl">{t.title}</h1>
          <p className="ds-lead mt-4 max-w-4xl text-slate-300">{t.intro}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><WarehouseIcon className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]" /><strong>{SUPPLY_NETWORK_DEMO.warehouses.length}</strong><p className="text-xs text-slate-500">warehouses</p></div>
              <div><MapPin className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]" /><strong>{SUPPLY_NETWORK_DEMO.demand_points.length}</strong><p className="text-xs text-slate-500">demand clusters</p></div>
              <div><Network className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]" /><strong>{SUPPLY_NETWORK_DEMO.product_classes.length}</strong><p className="text-xs text-slate-500">product classes</p></div>
            </div>
            <Button className="mt-6 w-full" onClick={optimize} disabled={pending}>
              <Play className="h-4 w-4" /> {pending ? t.optimizing : t.optimize}
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="mb-5 flex flex-wrap gap-2">
        {stages.map((stage, index) => (
          <Badge key={stage.label} variant={stage.active ? 'cyan' : 'slate'}>
            {index + 1}. {stage.label}
          </Badge>
        ))}
      </div>

      {pending ? <p className="mb-4 text-sm text-slate-400" role="status">{t.pending}</p> : null}
      {error ? (
        <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100" role="alert">
          <AlertTriangle className="mr-2 inline h-4 w-4" />{error}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.65fr)]">
        <NetworkMap
          network={activeNetwork}
          result={visibleResult}
          unavailableWarehouseIds={unavailableIds}
          candidateAreas={candidateAreas}
          manualCandidate={manualCandidate}
          onWarehouseSelect={selectWarehouse}
          onStoreSelect={selectStore}
          onMapClick={selectMapLocation}
        />

        <div className="space-y-4">
          {selectedWarehouse ? (
            <Card>
              <CardHeader><CardTitle>{selectedWarehouse.label ?? selectedWarehouse.id}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label={t.capacity} value={number(selectedWarehouse.capacity_units)} />
                  <Metric label={t.utilization} value={selectedUtilization ? pct(selectedUtilization.capacity_utilization) : '—'} />
                </div>
                {!unavailableIds.includes(selectedWarehouse.id) ? (
                  confirmWarehouseId === selectedWarehouse.id ? (
                    <div className="mt-4 space-y-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                      <p className="text-sm text-slate-200">{t.confirmUnavailable}</p>
                      <div className="flex gap-2">
                        <Button onClick={() => makeUnavailable(selectedWarehouse.id)} disabled={pending}>{t.makeUnavailable}</Button>
                        <Button variant="secondary" onClick={() => setConfirmWarehouseId(null)} disabled={pending}>{t.cancel}</Button>
                      </div>
                    </div>
                  ) : (
                    <Button className="mt-4 w-full" variant="secondary" onClick={() => setConfirmWarehouseId(selectedWarehouse.id)} disabled={pending}>
                      {t.makeUnavailable}
                    </Button>
                  )
                ) : <Badge variant="amber">{t.unavailable}</Badge>}
              </CardContent>
            </Card>
          ) : null}

          {selectedStore ? (
            <Card>
              <CardHeader><CardTitle>{selectedStore.label}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">{selectedStore.region}</p>
                <div className="mt-3 space-y-2 text-sm">
                  {Object.entries(selectedStore.demand_per_day).map(([product, demand]) => (
                    <div key={product} className="flex justify-between"><span>{product}</span><strong>{number(demand)}/day</strong></div>
                  ))}
                </div>
                {selectedService ? (
                  <div className="mt-4 grid gap-2">
                    <Metric label={t.source} value={selectedService.source_warehouse_ids.join(', ') || '—'} />
                    <Metric label={t.status} value={`${pct(selectedService.service_level)} ${t.served}`} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {candidateLocation && manualCandidate ? (
            <Card>
              <CardHeader><CardTitle>{t.addHere}</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-slate-500">{candidateLocation.latitude.toFixed(4)}, {candidateLocation.longitude.toFixed(4)}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-slate-400">{t.capacity}<input aria-label={t.capacity} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="1" value={candidateCapacity} onChange={(event) => setCandidateCapacity(Number(event.target.value))} /></label>
                  <label className="text-xs text-slate-400">{t.receiving}<input aria-label={t.receiving} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="1" value={candidateReceiving} onChange={(event) => setCandidateReceiving(Number(event.target.value))} /></label>
                  <label className="text-xs text-slate-400">{t.dispatch}<input aria-label={t.dispatch} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="1" value={candidateDispatch} onChange={(event) => setCandidateDispatch(Number(event.target.value))} /></label>
                  <label className="text-xs text-slate-400">{t.operating}<input aria-label={t.operating} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="0" value={candidateOperatingCost} onChange={(event) => setCandidateOperatingCost(Number(event.target.value))} /></label>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-slate-400">{t.storage}</span>
                  <div className="mt-2 flex gap-4 text-sm">
                    {(['ambient', 'controlled'] as StorageClass[]).map((storageClass) => (
                      <label key={storageClass} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={candidateStorage.includes(storageClass)}
                          onChange={(event) => setCandidateStorage((current) =>
                            event.target.checked
                              ? Array.from(new Set([...current, storageClass]))
                              : current.filter((item) => item !== storageClass)
                          )}
                        />
                        {storageClass}
                      </label>
                    ))}
                  </div>
                </div>
                <Button className="mt-4 w-full" onClick={evaluateManual} disabled={pending}>
                  <Plus className="h-4 w-4" /> {t.evaluate}
                </Button>
                {manualEvaluation ? (
                  <p className={`mt-3 text-sm ${manualEvaluation.used ? 'text-emerald-300' : 'text-amber-200'}`}>
                    {manualEvaluation.used ? t.candidateUsed : t.candidateNotUsed}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="pt-6 text-sm text-slate-400">{t.clickHint}</CardContent></Card>
          )}
        </div>
      </section>

      {visibleResult ? (
        <section className="mt-6">
          <Kpis result={visibleResult} locale={locale} />
        </section>
      ) : null}

      {scenario ? (
        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader><CardTitle>{t.affected}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {scenario.affected_demand_point_ids.map((id) => <Badge key={id} variant="amber">{id}</Badge>)}
                {scenario.affected_demand_point_ids.length === 0 ? <span className="text-sm text-slate-500">None</span> : null}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t.candidateArea}</CardTitle></CardHeader>
            <CardContent>
              {recommendedCandidate ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Metric label={t.improvement} value={number(recommendedCandidate.objective_improvement ?? 0)} />
                  <Metric label={t.requiredCapacity} value={number(recommendedCandidate.required_capacity_units ?? 0)} />
                  <Metric label={t.service} value={pct(recommendedCandidate.service_level ?? 0)} />
                </div>
              ) : <p className="text-sm text-slate-400">{t.noCandidate}</p>}
              <div className="mt-4 space-y-2">
                {candidateAreas.filter((item) => item.feasible).slice(0, 5).map((candidate) => (
                  <div key={candidate.candidate_id} className="flex items-center justify-between rounded-md border border-white/10 p-2 text-sm">
                    <span>{candidate.rank ? `#${candidate.rank} · ` : ''}{candidate.label ?? candidate.candidate_id}</span>
                    <span className={candidate.used ? 'text-emerald-300' : 'text-slate-500'}>{candidate.used ? 'used' : 'not used'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {visibleResult ? (
        <section className="mt-8">
          <Card>
            <CardHeader><CardTitle>{t.evidence}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">Inventory placement</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    {visibleResult.inventory_placement.slice(0, 8).map((item) => (
                      <p key={`${item.warehouse_id}-${item.product_class_id}`}>{item.product_class_id} → {item.warehouse_id}: {number(item.units)}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-200">Inbound allocation</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    {visibleResult.inbound_allocation.map((item) => (
                      <p key={`${item.supply_id}-${item.warehouse_id}`}>{item.product_class_id} → {item.warehouse_id}: {number(item.units)}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-200">Binding constraints</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {visibleResult.binding_constraints.slice(0, 8).map((item) => <Badge key={item} variant="slate">{item}</Badge>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  )
}
