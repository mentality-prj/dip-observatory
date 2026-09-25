'use client'

import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, MapPin, Network, Plus, Warehouse as WarehouseIcon } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/design-system'
import { useTranslations } from '@/i18n/provider'
import type { Locale } from '@/lib/observatory-i18n'
import { runCandidateAreas, runManualCandidate, runUnavailableScenario } from './api'
import { SUPPLY_NETWORK_DEMO } from './demo-data'
import { LazyNetworkMap } from './lazy-map'
import {
  candidateOptionLabel,
  constraintDisplayLabel,
  demandDisplayLabel,
  formatMoney,
  formatNumber,
  productClassDisplayLabel,
  storageClassDisplayLabel,
  warehouseDisplayLabel,
} from './i18n'
import { ExecutiveDecisionSummary } from './executive-decision-summary'
import type {
  CandidateResult,
  CandidateWarehouse,
  EconomicComparison,
  DemandPoint,
  OptimizationResult,
  ScenarioComparison,
  StorageClass,
  SupplyNetwork,
  Warehouse,
} from './domain'



const pct = (value: number) => `${Math.round(value * 100)}%`

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[.025] p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-medium text-slate-100">{value}</div>
    </div>
  )
}

function fulfillmentDistribution(result: OptimizationResult) {
  const byWarehouse = new Map<string, number>()
  for (const item of result.fulfillment) {
    byWarehouse.set(item.warehouse_id, (byWarehouse.get(item.warehouse_id) ?? 0) + item.units)
  }
  const total = [...byWarehouse.values()].reduce((sum, units) => sum + units, 0)
  if (total <= 0) return []
  return [...byWarehouse.entries()]
    .map(([warehouseId, units]) => ({ warehouseId, units, share: units / total }))
    .sort((a, b) => b.units - a.units)
}

function requestErrorKey(reason: unknown): 'invalidError' | 'infeasibleError' | 'unavailableError' | 'requestFailed' {
  if (typeof reason === 'object' && reason !== null && 'kind' in reason) {
    const kind = (reason as { kind?: unknown }).kind
    if (kind === 'invalid') return 'invalidError'
    if (kind === 'infeasible') return 'infeasibleError'
    if (kind === 'unavailable') return 'unavailableError'
  }
  return 'requestFailed'
}

function withUnavailable(network: SupplyNetwork, warehouseId: string): SupplyNetwork {
  return {
    ...network,
    unavailable_warehouse_ids: Array.from(new Set([...network.unavailable_warehouse_ids, warehouseId])),
  }
}

export function SupplyNetworkOptimizationWorkspace({ locale }: { locale: Locale }) {
  const t = useTranslations('supplyNetwork.workspace')
  const number = (value: number) => formatNumber(value, locale)
  const [baseline, setBaseline] = useState<OptimizationResult | null>(null)
  const [scenario, setScenario] = useState<ScenarioComparison | null>(null)
  const [candidateAreas, setCandidateAreas] = useState<CandidateResult[]>([])
  const [manualResult, setManualResult] = useState<OptimizationResult | null>(null)
  const [manualEvaluation, setManualEvaluation] = useState<CandidateResult | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [selectedStore, setSelectedStore] = useState<DemandPoint | null>(null)
  const [confirmWarehouseId, setConfirmWarehouseId] = useState<string | null>(null)
  const [candidateLocation, setCandidateLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [candidateCapacity, setCandidateCapacity] = useState(1800)
  const [candidateReceiving, setCandidateReceiving] = useState(340)
  const [candidateDispatch, setCandidateDispatch] = useState(380)
  const [candidateOpeningCost, setCandidateOpeningCost] = useState(1200000)
  const [candidateOpeningAmortization, setCandidateOpeningAmortization] = useState(365)
  const [candidateFixedOperatingCost, setCandidateFixedOperatingCost] = useState(22000)
  const [candidateHandlingCost, setCandidateHandlingCost] = useState(14)
  const [candidateStorage, setCandidateStorage] = useState<StorageClass[]>(['ambient', 'controlled'])
  const [pending, setPending] = useState(false)
  const [candidatePending, setCandidatePending] = useState(false)
  const [decisionValue, setDecisionValue] = useState<EconomicComparison | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unavailableIds = scenario ? [scenario.unavailable_warehouse_id] : []
  const activeNetwork = useMemo(
    () => (scenario ? withUnavailable(SUPPLY_NETWORK_DEMO, scenario.unavailable_warehouse_id) : SUPPLY_NETWORK_DEMO),
    [scenario]
  )
  const visibleResult = manualResult ?? scenario?.disrupted ?? baseline
  const manualCandidateLabel = t('manualCandidate')

  const manualCandidate = useMemo<CandidateWarehouse | null>(() => {
    if (!candidateLocation) return null
    return {
      id: 'manual-candidate',
      label: manualCandidateLabel,
      latitude: candidateLocation.latitude,
      longitude: candidateLocation.longitude,
      capacity_units: candidateCapacity,
      receiving_capacity_units_per_day: candidateReceiving,
      dispatch_capacity_units_per_day: candidateDispatch,
      supported_storage_classes: candidateStorage,
      operating_cost: 0,
      opening_cost: candidateOpeningCost,
      opening_cost_amortization_days: candidateOpeningAmortization,
      fixed_operating_cost_per_day: candidateFixedOperatingCost,
      handling_cost_per_unit: candidateHandlingCost,
    }
  }, [
    candidateCapacity,
    candidateDispatch,
    candidateLocation,
    candidateOpeningCost,
    candidateOpeningAmortization,
    candidateFixedOperatingCost,
    candidateHandlingCost,
    candidateReceiving,
    candidateStorage,
    manualCandidateLabel,
  ])

  const selectedService =
    selectedStore && visibleResult
      ? visibleResult.demand_service.find((item) => item.demand_point_id === selectedStore.id)
      : null
  const selectedUtilization =
    selectedWarehouse && visibleResult
      ? visibleResult.warehouse_utilization.find((item) => item.warehouse_id === selectedWarehouse.id)
      : null
  const paretoCandidates = candidateAreas.filter((item) => item.feasible && item.pareto_efficient)
  const manualFulfillmentDistribution = manualResult ? fulfillmentDistribution(manualResult) : []
  const manualCandidateShare = manualCandidate
    ? manualFulfillmentDistribution.find((item) => item.warehouseId === manualCandidate.id)?.share ?? 0
    : 0


  const makeUnavailable = useCallback(
    async (warehouseId: string) => {
      if (pending) return
      setPending(true)
      setError(null)
      setConfirmWarehouseId(null)
      try {
        const response = await runUnavailableScenario(SUPPLY_NETWORK_DEMO, warehouseId)
        const comparison = response.result
        setBaseline(comparison.baseline)
        setScenario(comparison)
        setDecisionValue(response.decisionValue ?? null)
        setManualResult(null)
        setManualEvaluation(null)
        setCandidateAreas([])
      } catch (reason) {
        setError(t(requestErrorKey(reason)))
      } finally {
        setPending(false)
      }
    },
    [pending, t]
  )

  const findImprovementOptions = useCallback(async () => {
    if (!scenario || candidatePending) return
    setCandidatePending(true)
    setError(null)
    try {
      const disruptedNetwork = withUnavailable(SUPPLY_NETWORK_DEMO, scenario.unavailable_warehouse_id)
      const candidates = await runCandidateAreas(disruptedNetwork)
      setCandidateAreas(candidates.candidates)
    } catch (reason) {
      setError(t(requestErrorKey(reason)))
    } finally {
      setCandidatePending(false)
    }
  }, [candidatePending, scenario, t])

  const evaluateManual = useCallback(async () => {
    if (pending || !manualCandidate) return
    if (
      manualCandidate.capacity_units <= 0 ||
      manualCandidate.receiving_capacity_units_per_day <= 0 ||
      manualCandidate.dispatch_capacity_units_per_day <= 0 ||
      manualCandidate.opening_cost < 0 ||
      manualCandidate.opening_cost_amortization_days <= 0 ||
      manualCandidate.fixed_operating_cost_per_day < 0 ||
      manualCandidate.handling_cost_per_unit < 0 ||
      manualCandidate.supported_storage_classes.length === 0
    ) {
      setError(t('validationError'))
      return
    }
    setPending(true)
    setError(null)
    try {
      const response = await runManualCandidate(activeNetwork, manualCandidate)
      const result = response.result
      setManualEvaluation(result.candidate)
      setManualResult(result.optimized_network)
      setDecisionValue(response.decisionValue ?? null)
    } catch (reason) {
      setError(t(requestErrorKey(reason)))
    } finally {
      setPending(false)
    }
  }, [activeNetwork, manualCandidate, pending, t])

  const selectWarehouse = useCallback((warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setSelectedStore(null)
    setConfirmWarehouseId(null)
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

  return (
    <main className="mx-auto w-full max-w-[1640px] px-4 pb-20 sm:px-5 md:px-8 lg:px-10">
      <section className="grid gap-6 py-8 xl:grid-cols-[1.5fr_.7fr] xl:items-end">
        <div>
          <Badge variant="cyan">QDIP OBSERVATORY · {t('featureName')}</Badge>
          <p className="mt-3 text-xs text-slate-500">{t('demoNotice')}</p>
          <h1 className="ds-h1 mt-4 max-w-5xl">{t('title')}</h1>
          <p className="ds-lead mt-4 max-w-4xl text-slate-300">{t('intro')}</p>
        </div>
        <Card>
          <CardContent style={{ paddingTop: 'var(--ds-space-6)' }}>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <WarehouseIcon className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]" />
                <strong>{SUPPLY_NETWORK_DEMO.warehouses.length}</strong>
                <p className="text-xs text-slate-500">{t('warehouses')}</p>
              </div>
              <div>
                <MapPin className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]" />
                <strong>{SUPPLY_NETWORK_DEMO.demand_points.length}</strong>
                <p className="text-xs text-slate-500">{t('demandClusters')}</p>
              </div>
              <div>
                <Network className="mx-auto mb-2 h-5 w-5 text-[var(--ds-accent)]" />
                <strong>{SUPPLY_NETWORK_DEMO.product_classes.length}</strong>
                <p className="text-xs text-slate-500">{t('productClasses')}</p>
              </div>
            </div>

          </CardContent>
        </Card>
      </section>

      <section className="mb-5" aria-label={t('walkthrough')}>
        <Card>
          <CardContent style={{ paddingTop: 'var(--ds-space-6)' }}>
            <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-medium text-slate-100">{t('walkthrough')}</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>{t('step1')}</p>
                  <p>{t('step2')}</p>
                  <p>{t('step3')}</p>
                </div>
              </div>
              <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/[.04] p-4">
                <p className="text-sm font-medium text-cyan-100">{t('prospectOutcome')}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t('prospectOutcomeText')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {pending ? (
        <p className="mb-4 text-sm text-slate-400" role="status">
          {t('pending')}
        </p>
      ) : null}
      {error ? (
        <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100" role="alert">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      {scenario ? (
        <div className="mb-5 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4" role="status">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="font-medium text-slate-100">{t('disruptionDone')}</p>
              <p className="mt-1 text-sm text-slate-300">{t('disruptionDoneHelp')}</p>
            </div>
          </div>
        </div>
      ) : null}

      {visibleResult ? (
        <ExecutiveDecisionSummary
          result={visibleResult}
          baseline={scenario?.baseline ?? null}
          hasDisruption={Boolean(scenario)}
          locale={locale}
          network={activeNetwork}
        />
      ) : null}

      {decisionValue ? (
        <section className="mb-5" aria-label={t('economicValue')}>
          <Card>
            <CardHeader>
              <CardTitle>{t('economicValue')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label={t('nominalAdvantage')} value={formatMoney(decisionValue.delta.nominal_delta, locale)} />
                <Metric
                  label={t('downsideAdvantage')}
                  value={
                    decisionValue.delta.downside_delta == null
                      ? '—'
                      : formatMoney(decisionValue.delta.downside_delta, locale)
                  }
                />
                <Metric
                  label={t('worstObservedAdvantage')}
                  value={
                    decisionValue.value_stability?.minimum_observed_advantage == null
                      ? '—'
                      : formatMoney(decisionValue.value_stability.minimum_observed_advantage, locale)
                  }
                />
                <Metric
                  label={t('observedRegret')}
                  value={
                    decisionValue.regret?.max_observed_regret == null
                      ? '—'
                      : formatMoney(decisionValue.regret.max_observed_regret, locale)
                  }
                />
              </div>
              {decisionValue.value_stability?.positive_advantage_frequency != null ? (
                <p className="mt-4 text-sm text-slate-300">
                  {t('valueStability')}:{' '}
                  <strong className="text-slate-100">
                    {pct(decisionValue.value_stability.positive_advantage_frequency)}
                  </strong>
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-5 text-slate-500">{t('economicNote')}</p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.65fr)]">
        <div className="min-w-0 space-y-5">
          <LazyNetworkMap
            locale={locale}
            network={activeNetwork}
            result={visibleResult}
            unavailableWarehouseIds={unavailableIds}
            candidateAreas={candidateAreas}
            manualCandidate={manualCandidate}
            currentFlows={SUPPLY_NETWORK_DEMO.baseline_fulfillment}
            selectedWarehouseId={selectedWarehouse?.id ?? null}
            onWarehouseSelect={selectWarehouse}
            onStoreSelect={selectStore}
            onMapClick={selectMapLocation}
          />

          {visibleResult ? (
            <section className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('evidence')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 lg:grid-cols-3">
                      <div>
                        <h3 className="text-sm font-medium text-slate-200">{t('endingInventory')}</h3>
                        <div className="mt-2 space-y-1 text-xs text-slate-400">
                          {visibleResult.ending_inventory.slice(0, 8).map((item) => (
                            <p key={`${item.warehouse_id}-${item.product_class_id}`}>
                              {productClassDisplayLabel(item.product_class_id, locale)} →{' '}
                              {warehouseDisplayLabel(item.warehouse_id, locale)}: {number(item.units)}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-200">{t('inboundAllocation')}</h3>
                        <div className="mt-2 space-y-1 text-xs text-slate-400">
                          {visibleResult.inbound_allocation.map((item) => (
                            <p key={`${item.supply_id}-${item.warehouse_id}-${item.transport_mode ?? 'default'}`}>
                              {productClassDisplayLabel(item.product_class_id, locale)} →{' '}
                              {warehouseDisplayLabel(item.warehouse_id, locale)}: {number(item.units)}
                              {item.transport_mode ? ` · ${item.transport_mode}` : ''}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-200">{t('bindingConstraints')}</h3>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {visibleResult.binding_constraints.slice(0, 8).map((item) => (
                            <Badge key={item} variant="neutral">
                              {constraintDisplayLabel(item, locale)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-200">{t('costBreakdown')}</h3>
                        <div className="mt-2 space-y-1 text-xs text-slate-400">
                          <p>{t('logistics')}: {formatMoney(visibleResult.kpis.logistics_cost, locale)}</p>
                          <p>{t('stockoutCost')}: {formatMoney(visibleResult.kpis.stockout_cost, locale)}</p>
                          <p>{t('reallocationCost')}: {formatMoney(visibleResult.kpis.reallocation_cost, locale)}</p>
                          <p>{t('facilityCost')}: {formatMoney(visibleResult.kpis.facility_fixed_cost, locale)}</p>
                          <p>{t('handlingCostResult')}: {formatMoney(visibleResult.kpis.handling_cost, locale)}</p>
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('warehouseList')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-slate-400">{t('chooseWarehouse')}</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {activeNetwork.warehouses.map((warehouse) => {
                  const unavailable = unavailableIds.includes(warehouse.id)
                  const selected = selectedWarehouse?.id === warehouse.id
                  return (
                    <button
                      key={warehouse.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectWarehouse(warehouse)}
                      className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition ${selected ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-white/[.02] text-slate-200 hover:border-white/20'}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-medium">{warehouseDisplayLabel(warehouse.id, locale, warehouse.label)}</span>
                        {unavailable ? <Badge variant="amber">{t('unavailable')}</Badge> : null}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{t('capacity')}: {number(warehouse.capacity_units)}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {selectedWarehouse ? (
            <Card>
              <CardHeader>
                <CardTitle>{warehouseDisplayLabel(selectedWarehouse.id, locale, selectedWarehouse.label)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label={t('capacity')} value={number(selectedWarehouse.capacity_units)} />
                  <Metric
                    label={t('currentInventory')}
                    value={number(Object.values(selectedWarehouse.current_inventory).reduce((sum, units) => sum + units, 0))}
                  />
                  <Metric label={t('receiving')} value={number(selectedWarehouse.receiving_capacity_units_per_day)} />
                  <Metric label={t('dispatch')} value={number(selectedWarehouse.dispatch_capacity_units_per_day)} />
                  <div className="col-span-2 rounded-lg border border-white/10 bg-white/[.02] p-3">
                    <div className="text-xs text-slate-500">{t('storage')}</div>
                    <div className="mt-1 text-sm text-slate-200">
                      {selectedWarehouse.supported_storage_classes.map((storageClass) => storageClassDisplayLabel(storageClass, locale)).join(' · ')}
                    </div>
                  </div>
                  {selectedUtilization ? (
                    <>
                      <Metric label={t('utilizationAfterPlan')} value={pct(selectedUtilization.capacity_utilization)} />
                      <Metric label={t('actualPeakReceiving')} value={number(selectedUtilization.peak_receiving_units_per_day)} />
                      <Metric label={t('actualPeakDispatch')} value={number(selectedUtilization.peak_dispatch_units_per_day)} />
                    </>
                  ) : null}
                </div>
                {!unavailableIds.includes(selectedWarehouse.id) ? (
                  <>
                    <p className="mt-4 text-sm text-slate-300">{t('disruptionHelp')}</p>
                    {confirmWarehouseId === selectedWarehouse.id ? (
                      <div className="mt-4 space-y-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                        <p className="text-sm text-slate-200">{t('confirmUnavailable')}</p>
                        <div className="flex gap-2">
                          <Button onClick={() => makeUnavailable(selectedWarehouse.id)} disabled={pending}>
                            {t('makeUnavailable')}
                          </Button>
                          <Button variant="secondary" onClick={() => setConfirmWarehouseId(null)} disabled={pending}>
                            {t('cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="mt-4 w-full"
                        onClick={() => setConfirmWarehouseId(selectedWarehouse.id)}
                        disabled={pending}
                      >
                        <AlertTriangle className="h-4 w-4" /> {t('makeUnavailable')}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                    <Badge variant="amber">{t('unavailable')}</Badge>
                    <p className="mt-2 text-sm text-slate-300">{t('disruptionDoneHelp')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {selectedStore ? (
            <Card>
              <CardHeader>
                <CardTitle>{demandDisplayLabel(selectedStore.id, locale, selectedStore.label)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-3 space-y-2 text-sm">
                  {Object.entries(selectedStore.demand_per_day).map(([product, demand]) => (
                    <div key={product} className="flex justify-between">
                      <span>{productClassDisplayLabel(product, locale)}</span>
                      <strong>
                        {number(demand)} {t('perDay')}
                      </strong>
                    </div>
                  ))}
                </div>
                {selectedService ? (
                  <div className="mt-4 grid gap-2">
                    <Metric
                      label={t('source')}
                      value={
                        selectedService.source_warehouse_ids
                          .map((id) => warehouseDisplayLabel(id, locale))
                          .join(', ') || '—'
                      }
                    />
                    <Metric label={t('status')} value={`${pct(selectedService.service_level)} ${t('served')}`} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {candidateLocation && manualCandidate ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('addHere')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-slate-500">
                  {candidateLocation.latitude.toFixed(4)}, {candidateLocation.longitude.toFixed(4)}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-slate-400">
                    {t('capacity')}
                    <input
                      aria-label={t('capacity')}
                      className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                      type="number"
                      min="1"
                      value={candidateCapacity}
                      onChange={(event) => setCandidateCapacity(Number(event.target.value))}
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    {t('receiving')}
                    <input
                      aria-label={t('receiving')}
                      className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                      type="number"
                      min="1"
                      value={candidateReceiving}
                      onChange={(event) => setCandidateReceiving(Number(event.target.value))}
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    {t('dispatch')}
                    <input
                      aria-label={t('dispatch')}
                      className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                      type="number"
                      min="1"
                      value={candidateDispatch}
                      onChange={(event) => setCandidateDispatch(Number(event.target.value))}
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    {t('openingCost')}
                    <input
                      aria-label={t('openingCost')}
                      className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                      type="number"
                      min="0"
                      value={candidateOpeningCost}
                      onChange={(event) => setCandidateOpeningCost(Number(event.target.value))}
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    {t('openingAmortization')}
                    <input
                      aria-label={t('openingAmortization')}
                      className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                      type="number"
                      min="1"
                      value={candidateOpeningAmortization}
                      onChange={(event) => setCandidateOpeningAmortization(Number(event.target.value))}
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    {t('fixedOperatingCost')}
                    <input
                      aria-label={t('fixedOperatingCost')}
                      className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                      type="number"
                      min="0"
                      value={candidateFixedOperatingCost}
                      onChange={(event) => setCandidateFixedOperatingCost(Number(event.target.value))}
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    {t('handlingCost')}
                    <input
                      aria-label={t('handlingCost')}
                      className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                      type="number"
                      min="0"
                      value={candidateHandlingCost}
                      onChange={(event) => setCandidateHandlingCost(Number(event.target.value))}
                    />
                  </label>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-slate-400">{t('storage')}</span>
                  <div className="mt-2 flex gap-4 text-sm">
                    {(['ambient', 'controlled'] as StorageClass[]).map((storageClass) => (
                      <label key={storageClass} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={candidateStorage.includes(storageClass)}
                          onChange={(event) =>
                            setCandidateStorage((current) =>
                              event.target.checked
                                ? Array.from(new Set([...current, storageClass]))
                                : current.filter((item) => item !== storageClass)
                            )
                          }
                        />
                        {storageClassDisplayLabel(storageClass, locale)}
                      </label>
                    ))}
                  </div>
                </div>
                <Button className="mt-4 w-full" onClick={evaluateManual} disabled={pending}>
                  <Plus className="h-4 w-4" /> {t('evaluate')}
                </Button>
                {manualEvaluation ? (
                  <div className="mt-3 space-y-2">
                    <p className={`text-sm ${manualEvaluation.used ? 'text-emerald-300' : 'text-amber-200'}`}>
                      {manualEvaluation.used ? t('candidateUsed') : t('candidateNotUsed')}
                    </p>
                    {manualEvaluation.used && manualResult ? (
                      <div className="space-y-2 text-xs text-slate-400">
                        <p>
                          {t('candidateFulfillmentShare')}:{' '}
                          <strong className="text-slate-200">{pct(manualCandidateShare)}</strong>
                        </p>
                        <p>
                          {t('fulfillmentExposure')}:{' '}
                          <strong className="text-slate-200">{pct(manualResult.kpis.maximum_fulfillment_share)}</strong>
                          {' · '}
                          {t('limit')}{' '}
                          <strong className="text-slate-200">{pct(
                            activeNetwork.unavailable_warehouse_ids.length
                              ? activeNetwork.policy.emergency_maximum_node_fulfillment_share
                              : activeNetwork.policy.maximum_node_fulfillment_share
                          )}</strong>
                        </p>
                        <div>
                          <p className="mb-1 text-slate-500">{t('fulfillmentDistribution')}</p>
                          <div className="space-y-1">
                            {manualFulfillmentDistribution.map((item) => (
                              <div key={item.warehouseId} className="flex items-center justify-between gap-3">
                                <span>
                                  {item.warehouseId === manualCandidate?.id
                                    ? t('manualCandidate')
                                    : warehouseDisplayLabel(item.warehouseId, locale)}
                                </span>
                                <strong className="text-slate-200">{pct(item.share)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="px-8 py-6 text-sm text-slate-400" style={{ paddingTop: 'var(--ds-space-6)' }}>
                {t('clickHint')}
              </CardContent>
            </Card>
          )}
        </div>
      </section>



      {scenario ? (
        <section id="supply-alternatives" className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t('affected')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {scenario.affected_demand_point_ids.map((id) => {
                  const point = SUPPLY_NETWORK_DEMO.demand_points.find((item) => item.id === id)
                  return (
                    <Badge key={id} variant="amber">
                      {demandDisplayLabel(id, locale, point?.label)}
                    </Badge>
                  )
                })}
                {scenario.affected_demand_point_ids.length === 0 ? (
                  <span className="text-sm text-slate-500">{t('none')}</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('candidateArea')}</CardTitle>
            </CardHeader>
            <CardContent>
              {candidateAreas.length === 0 ? (
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={findImprovementOptions}
                  disabled={candidatePending}
                >
                  <Plus className="h-4 w-4" /> {candidatePending ? t('findingImprovements') : t('findImprovements')}
                </Button>
              ) : paretoCandidates.length ? (
                <div>
                  <p className="mb-3 text-sm text-slate-400">{t('frontierHint')}</p>
                  <div className="space-y-2">
                    {paretoCandidates.slice(0, 5).map((candidate, index) => (
                      <div key={candidate.candidate_id} className="rounded-md border border-cyan-400/15 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span>{candidateOptionLabel(index, locale)}</span>
                          <span className="text-cyan-300">{t('pareto')}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-3 lg:grid-cols-6">
                          <span>
                            {t('service')}: {pct(candidate.service_level ?? 0)}
                          </span>
                          <span>
                            {t('requiredCapacity')}: {number(candidate.required_capacity_units ?? 0)}
                          </span>
                          <span>
                            {t('peakReceiving')}: {number(candidate.required_receiving_capacity_units_per_day ?? 0)}
                          </span>
                          <span>
                            {t('peakDispatch')}: {number(candidate.required_dispatch_capacity_units_per_day ?? 0)}
                          </span>
                          <span>
                            {t('logistics')}:{' '}
                            {candidate.logistics_cost == null ? '—' : formatMoney(candidate.logistics_cost, locale)}
                          </span>
                          <span>
                            {t('economicEffect')}:{' '}
                            {candidate.objective_improvement == null
                              ? '—'
                              : formatMoney(candidate.objective_improvement, locale)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t('noCandidate')}</p>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {scenario ? (
        <section className="mt-8">
          <h2 className="ds-h2 mb-4">{t('scenarioComparison')}</h2>
          <div className="grid gap-4 lg:grid-cols-4">
            {[
              { label: t('optimized'), result: scenario.baseline },
              { label: t('reallocated'), result: scenario.disrupted },
              ...(manualResult ? [{ label: t('newWarehouse'), result: manualResult }] : []),
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <CardTitle>{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <Metric label={t('service')} value={pct(item.result.kpis.service_level)} />
                    <Metric label={t('unserved')} value={number(item.result.kpis.unserved_demand_units)} />
                    <Metric label={t('logistics')} value={formatMoney(item.result.kpis.logistics_cost, locale)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}


    </main>
  )
}
