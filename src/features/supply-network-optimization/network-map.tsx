'use client'

import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type {
  CandidateResult,
  CandidateWarehouse,
  CurrentFlow,
  DemandPoint,
  OptimizationResult,
  SupplyNetwork,
  Warehouse,
} from './domain'
import { loadMapLibre, OSM_RASTER_STYLE, type MapLibreMap, type MapLibreMarker } from './map-provider'
import { candidateOptionLabel, demandDisplayLabel, supplierDisplayLabel, warehouseDisplayLabel } from './presentation'

type Props = {
  locale: 'en' | 'uk' | 'pl'
  network: SupplyNetwork
  result: OptimizationResult | null
  unavailableWarehouseIds: string[]
  candidateAreas: CandidateResult[]
  manualCandidate: CandidateWarehouse | null
  currentFlows: CurrentFlow[]
  onWarehouseSelect: (warehouse: Warehouse) => void
  onStoreSelect: (store: DemandPoint) => void
  onMapClick: (latitude: number, longitude: number) => void
}

const markerStyle = (kind: 'warehouse' | 'store' | 'supplier' | 'candidate' | 'unavailable') => {
  const element = document.createElement('button')
  element.type = 'button'
  element.setAttribute('aria-label', kind)
  const size = kind === 'store' ? '14px' : kind === 'warehouse' || kind === 'unavailable' ? '34px' : '20px'
  // Reset global button/mobile styles so MapLibre markers remain true squares/circles.
  element.style.width = size
  element.style.height = size
  element.style.minWidth = size
  element.style.minHeight = size
  element.style.maxWidth = size
  element.style.maxHeight = size
  element.style.padding = '0'
  element.style.margin = '0'
  element.style.display = 'block'
  element.style.flex = '0 0 auto'
  element.style.lineHeight = '0'
  element.style.boxSizing = 'border-box'
  element.style.appearance = 'none'
  element.style.borderRadius = kind === 'store' ? '50%' : '5px'
  element.style.border = '2px solid rgba(255,255,255,.9)'
  element.style.boxShadow = '0 1px 8px rgba(0,0,0,.45)'
  element.style.cursor = 'pointer'
  element.style.touchAction = 'manipulation'
  element.style.setProperty('-webkit-tap-highlight-color', 'transparent')
  // Warehouses are actionable network nodes. Keep them above demand/store
  // markers when geographic coordinates overlap so the warehouse action
  // remains reachable (for example Kyiv warehouse + Kyiv demand region).
  element.style.zIndex = kind === 'warehouse' || kind === 'unavailable' ? '20' : kind === 'candidate' ? '10' : kind === 'supplier' ? '5' : '1'
  element.style.background =
    kind === 'unavailable' ? '#ef4444'
      : kind === 'candidate' ? '#f59e0b'
        : kind === 'warehouse' ? '#22d3ee'
          : kind === 'supplier' ? '#a78bfa'
            : '#e2e8f0'
  if (kind === 'unavailable') {
    element.style.borderRadius = '50%'
    element.style.transform = 'none'
    element.style.setProperty('font-size', '15px')
    element.style.setProperty('font-weight', '800')
    element.style.setProperty('line-height', size)
    element.style.setProperty('text-align', 'center')
    element.style.setProperty('color', '#fff')
    element.textContent = '×'
  }
  return element
}

function coordinate(
  network: SupplyNetwork,
  id: string,
  manualCandidate: CandidateWarehouse | null,
  candidateAreas: CandidateResult[]
): [number, number] | null {
  const warehouse = network.warehouses.find((item) => item.id === id)
  if (warehouse) return [warehouse.longitude, warehouse.latitude]
  const point = network.demand_points.find((item) => item.id === id)
  if (point) return [point.longitude, point.latitude]
  const supplier = network.suppliers.find((item) => item.id === id)
  if (supplier) return [supplier.longitude, supplier.latitude]
  if (manualCandidate?.id === id) return [manualCandidate.longitude, manualCandidate.latitude]
  const candidate = candidateAreas.find((item) => item.candidate_id === id)
  if (candidate) return [candidate.longitude, candidate.latitude]
  return null
}

function flowCollection(
  network: SupplyNetwork,
  currentFlows: CurrentFlow[],
  result: OptimizationResult | null,
  manualCandidate: CandidateWarehouse | null,
  candidateAreas: CandidateResult[]
) {
  const currentFeatures = currentFlows.flatMap((item) => {
    if (network.unavailable_warehouse_ids.includes(item.warehouse_id)) return []
    const from = coordinate(network, item.warehouse_id, manualCandidate, candidateAreas)
    const to = coordinate(network, item.demand_point_id, manualCandidate, candidateAreas)
    return from && to
      ? [{
          type: 'Feature',
          properties: { kind: 'current' },
          geometry: { type: 'LineString', coordinates: [from, to] },
        }]
      : []
  })
  const recommendedFeatures: Record<string, unknown>[] = []
  if (result) {
    const aggregated = new Map<string, {
      kind: 'recommended' | 'transfer'
      fromId: string
      toId: string
      units: number
    }>()
    const addFlow = (
      kind: 'recommended' | 'transfer',
      fromId: string,
      toId: string,
      units: number
    ) => {
      if (units <= 0) return
      const key = `${kind}:${fromId}:${toId}`
      const existing = aggregated.get(key)
      if (existing) existing.units += units
      else aggregated.set(key, { kind, fromId, toId, units })
    }
    for (const item of result.fulfillment) {
      addFlow('recommended', item.warehouse_id, item.demand_point_id, item.units)
    }
    for (const item of result.transfers) {
      addFlow('transfer', item.from_warehouse_id, item.to_warehouse_id, item.units)
    }
    for (const item of result.inbound_allocation) {
      addFlow('recommended', item.supplier_id, item.warehouse_id, item.units)
    }
    for (const flow of aggregated.values()) {
      const from = coordinate(network, flow.fromId, manualCandidate, candidateAreas)
      const to = coordinate(network, flow.toId, manualCandidate, candidateAreas)
      if (!from || !to) continue
      recommendedFeatures.push({
        type: 'Feature',
        properties: { kind: flow.kind, units: flow.units },
        geometry: { type: 'LineString', coordinates: [from, to] },
      })
    }
  }
  return {
    current: { type: 'FeatureCollection', features: currentFeatures },
    recommended: { type: 'FeatureCollection', features: recommendedFeatures },
  }
}

export function NetworkMap({
  locale,
  network,
  result,
  unavailableWarehouseIds,
  candidateAreas,
  manualCandidate,
  currentFlows,
  onWarehouseSelect,
  onStoreSelect,
  onMapClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapUnavailable, setMapUnavailable] = useState(false)
  const markersRef = useRef<MapLibreMarker[]>([])
  const clickRef = useRef(onMapClick)

  useEffect(() => {
    clickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    let cancelled = false
    let localMap: MapLibreMap | null = null
    let resizeObserver: ResizeObserver | null = null
    setMapUnavailable(false)
    void loadMapLibre().then((maplibre) => {
      if (cancelled) return
      if (!maplibre) {
        setMapUnavailable(true)
        return
      }
      if (!containerRef.current) return
      localMap = new maplibre.Map({
        container: containerRef.current,
        style: OSM_RASTER_STYLE,
        center: [31.2, 49.0],
        zoom: 4.7,
        attributionControl: true,
      })
      mapRef.current = localMap
      // The style is inline; network tile availability must not gate the
      // interactive overlay. In particular, iOS can keep MapLibre's broader
      // "load" lifecycle pending while raster tiles are still in flight.
      const markReady = () => {
        if (!cancelled) setMapReady(true)
      }
      if (localMap.isStyleLoaded()) markReady()
      else localMap.on('style.load', markReady)
      const resize = () => localMap?.resize()
      requestAnimationFrame(resize)
      window.setTimeout(resize, 120)
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(containerRef.current)
      localMap.on('click', (event) => {
        const target = event.originalEvent?.target
        if (target instanceof HTMLElement && target.closest('[data-network-marker]')) return
        clickRef.current(event.lngLat.lat, event.lngLat.lng)
      })
    })
    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      resizeObserver?.disconnect()
      localMap?.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void loadMapLibre().then((maplibre) => {
      const map = mapRef.current
      if (cancelled || !mapReady || !maplibre || !map) return
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      for (const warehouse of network.warehouses) {
        const unavailable = unavailableWarehouseIds.includes(warehouse.id)
        const element = markerStyle(unavailable ? 'unavailable' : 'warehouse')
        element.dataset.networkMarker = 'warehouse'
        element.title = warehouseDisplayLabel(warehouse.id, locale, warehouse.label)
        element.addEventListener('click', (event) => {
          event.stopPropagation()
          onWarehouseSelect(warehouse)
        })
        markersRef.current.push(
          new maplibre.Marker({ element }).setLngLat([warehouse.longitude, warehouse.latitude]).addTo(map)
        )
      }
      for (const store of network.demand_points) {
        const element = markerStyle('store')
        element.dataset.networkMarker = 'store'
        element.title = demandDisplayLabel(store.id, locale, store.label)
        element.addEventListener('click', (event) => {
          event.stopPropagation()
          onStoreSelect(store)
        })
        markersRef.current.push(
          new maplibre.Marker({ element }).setLngLat([store.longitude, store.latitude]).addTo(map)
        )
      }
      if (result?.inbound_allocation.some((item) => item.units > 0)) {
        for (const supplier of network.suppliers) {
          const element = markerStyle('supplier')
          element.dataset.networkMarker = 'supplier'
          element.title = supplierDisplayLabel(supplier.id, locale, supplier.label)
          markersRef.current.push(
            new maplibre.Marker({ element }).setLngLat([supplier.longitude, supplier.latitude]).addTo(map)
          )
        }
      }
      for (const [index, candidate] of candidateAreas.filter((item) => item.feasible).entries()) {
        const element = markerStyle('candidate')
        element.dataset.networkMarker = 'candidate'
        element.title = candidateOptionLabel(index, locale)
        markersRef.current.push(
          new maplibre.Marker({ element }).setLngLat([candidate.longitude, candidate.latitude]).addTo(map)
        )
      }
      if (manualCandidate) {
        const element = markerStyle('candidate')
        element.dataset.networkMarker = 'manual-candidate'
        element.title = manualCandidate.label ?? manualCandidate.id
        markersRef.current.push(
          new maplibre.Marker({ element }).setLngLat([manualCandidate.longitude, manualCandidate.latitude]).addTo(map)
        )
      }

      const collections = flowCollection(
        network,
        currentFlows,
        result,
        manualCandidate,
        candidateAreas
      )
      for (const layerId of ['recommended-flow-arrows', 'recommended-flows', 'current-flow-arrows', 'current-flows']) {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
      }
      for (const sourceId of ['recommended-flows', 'current-flows']) {
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      }
      map.addSource('current-flows', { type: 'geojson', data: collections.current })
      map.addLayer({
        id: 'current-flows',
        type: 'line',
        source: 'current-flows',
        paint: { 'line-color': '#94a3b8', 'line-width': 2, 'line-opacity': 0.52 },
      })
      map.addLayer({
        id: 'current-flow-arrows',
        type: 'symbol',
        source: 'current-flows',
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 90,
          'text-field': '›',
          'text-size': 20,
          'text-rotation-alignment': 'map',
          'text-keep-upright': false,
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#cbd5e1', 'text-opacity': 0.7 },
      })
      if (result) {
        map.addSource('recommended-flows', { type: 'geojson', data: collections.recommended })
        map.addLayer({
          id: 'recommended-flows',
          type: 'line',
          source: 'recommended-flows',
          paint: { 'line-color': '#22d3ee', 'line-width': 3, 'line-opacity': 0.9 },
        })
        map.addLayer({
          id: 'recommended-flow-arrows',
          type: 'symbol',
          source: 'recommended-flows',
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 80,
            'text-field': '›',
            'text-size': 24,
            'text-rotation-alignment': 'map',
            'text-keep-upright': false,
            'text-allow-overlap': true,
          },
          paint: { 'text-color': '#67e8f9', 'text-opacity': 0.95 },
        })
      }
    })
    return () => { cancelled = true }
  }, [
    mapReady,
    currentFlows,
    candidateAreas,
    manualCandidate,
    network,
    onStoreSelect,
    onWarehouseSelect,
    result,
    unavailableWarehouseIds,
  ])

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950">
      <div ref={containerRef} className="h-[420px] w-full sm:h-[540px]" data-testid="supply-network-map" />
      {mapUnavailable ? (
        <div className="absolute inset-0 flex items-center justify-center p-6" role="status">
          <div className="max-w-md rounded-lg border border-amber-400/20 bg-slate-950/95 p-4 text-center">
            <p className="text-sm font-medium text-slate-200">{locale === 'uk' ? 'Мапа тимчасово недоступна' : locale === 'pl' ? 'Mapa jest chwilowo niedostępna' : 'Map temporarily unavailable'}</p>
            <p className="mt-1 text-xs text-slate-400">{locale === 'uk' ? 'Розрахунок мережі доступний. Оновіть сторінку, щоб повторити завантаження мапи.' : locale === 'pl' ? 'Analiza sieci jest dostępna. Odśwież stronę, aby ponownie załadować mapę.' : 'Network analysis remains available. Reload to retry the map.'}</p>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 text-[11px] text-slate-200 sm:right-auto sm:max-w-[80%]">
        <span className="rounded bg-slate-950/90 px-2 py-1">▰ {locale === 'uk' ? 'Склад' : locale === 'pl' ? 'Magazyn' : 'Warehouse'}</span>
        <span className="rounded bg-slate-950/90 px-2 py-1">● {locale === 'uk' ? 'Регіон попиту' : locale === 'pl' ? 'Region popytu' : 'Demand region'}</span>
        {currentFlows.length > 0 ? <span className="rounded bg-slate-950/90 px-2 py-1">→ {locale === 'uk' ? 'Поточні потоки' : locale === 'pl' ? 'Bieżące przepływy' : 'Current flows'}</span> : null}
        {result ? <span className="rounded bg-slate-950/90 px-2 py-1 text-cyan-200">→ {locale === 'uk' ? 'План QDIP' : locale === 'pl' ? 'Plan QDIP' : 'QDIP plan'}</span> : null}
        {result?.inbound_allocation.some((item) => item.units > 0) ? <span className="rounded bg-slate-950/90 px-2 py-1">◆ {locale === 'uk' ? 'Постачальник' : locale === 'pl' ? 'Dostawca' : 'Supplier'}</span> : null}
        {candidateAreas.some((item) => item.feasible) || manualCandidate ? <span className="rounded bg-slate-950/90 px-2 py-1">◇ {locale === 'uk' ? 'Варіант складу' : locale === 'pl' ? 'Wariant magazynu' : 'Warehouse option'}</span> : null}
      </div>
    </div>
  )
}
