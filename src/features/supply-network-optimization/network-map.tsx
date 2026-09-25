'use client'

import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type {
  CandidateResult,
  CandidateWarehouse,
  BaselineFulfillment,
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
  currentFlows: BaselineFulfillment[]
  selectedWarehouseId: string | null
  onWarehouseSelect: (warehouse: Warehouse) => void
  onStoreSelect: (store: DemandPoint) => void
  onMapClick: (latitude: number, longitude: number) => void
}

const markerStyle = (
  kind: 'warehouse' | 'store' | 'supplier' | 'candidate' | 'manual-candidate' | 'unavailable',
  selected = false
) => {
  const element = document.createElement('button')
  element.type = 'button'
  element.setAttribute('aria-label', kind)
  const size = kind === 'store' ? '14px' : kind === 'warehouse' || kind === 'manual-candidate' || kind === 'unavailable' ? '34px' : '20px'
  // Reset global button/mobile styles so MapLibre markers remain true squares/circles.
  element.style.width = size
  element.style.height = size
  element.style.minWidth = size
  element.style.minHeight = size
  element.style.maxWidth = size
  element.style.maxHeight = size
  element.style.padding = '0'
  element.style.margin = '0'
  element.style.display = 'flex'
  element.style.alignItems = 'center'
  element.style.justifyContent = 'center'
  element.style.flex = '0 0 auto'
  element.style.lineHeight = '1'
  element.style.boxSizing = 'border-box'
  element.style.appearance = 'none'
  element.style.borderRadius = kind === 'store' ? '50%' : '5px'
  element.style.border = '2px solid rgba(255,255,255,.95)'
  element.style.boxShadow = selected
    ? '0 0 0 4px #facc15, 0 0 0 7px rgba(15,23,42,.82), 0 2px 12px rgba(0,0,0,.65)'
    : '0 1px 8px rgba(0,0,0,.45)'
  if (kind === 'supplier' || kind === 'candidate' || kind === 'manual-candidate') {
    element.style.clipPath = 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)'
    element.style.borderRadius = '0'
  }
  element.style.cursor = 'pointer'
  element.style.touchAction = 'manipulation'
  element.style.setProperty('-webkit-tap-highlight-color', 'transparent')
  // Warehouses are actionable network nodes. Keep them above demand/store
  // markers when geographic coordinates overlap so the warehouse action
  // remains reachable (for example Kyiv warehouse + Kyiv demand region).
  element.style.zIndex = kind === 'warehouse' || kind === 'manual-candidate' || kind === 'unavailable' ? '20' : kind === 'candidate' ? '10' : kind === 'supplier' ? '5' : '1'
  element.style.background =
    kind === 'unavailable' ? '#ef4444'
      : kind === 'candidate' || kind === 'manual-candidate' ? '#f59e0b'
        : kind === 'warehouse' ? '#22d3ee'
          : kind === 'supplier' ? '#a78bfa'
            : '#e2e8f0'
  if (kind === 'unavailable') {
    element.style.borderRadius = '50%'
    element.style.transform = 'none'
    element.style.setProperty('font-size', '15px')
    element.style.setProperty('font-weight', '800')
    element.style.setProperty('line-height', '1')
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

type FlowSegment = {
  kind: 'current' | 'recommended' | 'transfer' | 'inbound'
  from: [number, number]
  to: [number, number]
  units?: number
  local?: boolean
}

export function buildFlowSegments(
  network: SupplyNetwork,
  currentFlows: BaselineFulfillment[],
  result: OptimizationResult | null,
  manualCandidate: CandidateWarehouse | null,
  candidateAreas: CandidateResult[]
): FlowSegment[] {
  const segments: FlowSegment[] = []

  const currentAggregated = new Map<string, { warehouseId: string; demandPointId: string; units: number }>()
  for (const item of currentFlows) {
    const key = `${item.warehouse_id}:${item.demand_point_id}`
    const existing = currentAggregated.get(key)
    if (existing) existing.units += item.units_per_day
    else {
      currentAggregated.set(key, {
        warehouseId: item.warehouse_id,
        demandPointId: item.demand_point_id,
        units: item.units_per_day,
      })
    }
  }
  for (const item of currentAggregated.values()) {
    const from = coordinate(network, item.warehouseId, manualCandidate, candidateAreas)
    const to = coordinate(network, item.demandPointId, manualCandidate, candidateAreas)
    if (from && to) {
      segments.push({
        kind: 'current',
        from,
        to,
        units: item.units,
        local: from[0] === to[0] && from[1] === to[1],
      })
    }
  }

  if (!result) return segments

  const aggregated = new Map<string, {
    kind: 'recommended' | 'transfer' | 'inbound'
    fromId: string
    toId: string
    units: number
  }>()
  const addFlow = (
    kind: 'recommended' | 'transfer' | 'inbound',
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
    addFlow('inbound', item.supplier_id, item.warehouse_id, item.units)
  }

  for (const flow of aggregated.values()) {
    const from = coordinate(network, flow.fromId, manualCandidate, candidateAreas)
    const to = coordinate(network, flow.toId, manualCandidate, candidateAreas)
    if (from && to) {
      segments.push({
        kind: flow.kind,
        from,
        to,
        units: flow.units,
        local: from[0] === to[0] && from[1] === to[1],
      })
    }
  }
  return segments
}

export function NetworkMap({
  locale,
  network,
  result,
  unavailableWarehouseIds,
  candidateAreas,
  manualCandidate,
  currentFlows,
  selectedWarehouseId,
  onWarehouseSelect,
  onStoreSelect,
  onMapClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapUnavailable, setMapUnavailable] = useState(false)
  const [projectedFlows, setProjectedFlows] = useState<Array<FlowSegment & { index: number; x1: number; y1: number; x2: number; y2: number }>>([])
  const projectFlowsRef = useRef<() => void>(() => undefined)
  const markersRef = useRef<MapLibreMarker[]>([])
  const boundsKeyRef = useRef('')
  const clickRef = useRef(onMapClick)

  useEffect(() => {
    clickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    let cancelled = false
    let localMap: MapLibreMap | null = null
    let resizeObserver: ResizeObserver | null = null
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
      const refreshOverlay = () => projectFlowsRef.current()
      localMap.on('move', refreshOverlay)
      localMap.on('zoom', refreshOverlay)
      localMap.on('resize', refreshOverlay)
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
        const element = markerStyle(unavailable ? 'unavailable' : 'warehouse', selectedWarehouseId === warehouse.id)
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
      for (const supplier of network.suppliers) {
        const element = markerStyle('supplier')
        element.dataset.networkMarker = 'supplier'
        element.title = supplierDisplayLabel(supplier.id, locale, supplier.label)
        markersRef.current.push(
          new maplibre.Marker({ element }).setLngLat([supplier.longitude, supplier.latitude]).addTo(map)
        )
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
        const element = markerStyle('manual-candidate')
        element.dataset.networkMarker = 'manual-candidate'
        element.title = manualCandidate.label ?? manualCandidate.id
        markersRef.current.push(
          new maplibre.Marker({ element }).setLngLat([manualCandidate.longitude, manualCandidate.latitude]).addTo(map)
        )
      }

      const visibleCoordinates = [
        ...network.warehouses.map((item) => [item.longitude, item.latitude] as [number, number]),
        ...network.demand_points.map((item) => [item.longitude, item.latitude] as [number, number]),
        ...network.suppliers.map((item) => [item.longitude, item.latitude] as [number, number]),
        ...candidateAreas.filter((item) => item.feasible).map((item) => [item.longitude, item.latitude] as [number, number]),
        ...(manualCandidate ? [[manualCandidate.longitude, manualCandidate.latitude] as [number, number]] : []),
      ]
      const boundsKey = visibleCoordinates.map((item) => item.join(',')).join('|')
      if (visibleCoordinates.length > 0 && boundsKey !== boundsKeyRef.current) {
        const longitudes = visibleCoordinates.map(([longitude]) => longitude)
        const latitudes = visibleCoordinates.map(([, latitude]) => latitude)
        map.fitBounds(
          [
            [Math.min(...longitudes), Math.min(...latitudes)],
            [Math.max(...longitudes), Math.max(...latitudes)],
          ],
          { padding: 54, maxZoom: 6.2, duration: 0 }
        )
        boundsKeyRef.current = boundsKey
      }

      const flowSegments = buildFlowSegments(network, currentFlows, result, manualCandidate, candidateAreas)
      const projectFlows = () => {
        setProjectedFlows(flowSegments.map((segment, index) => {
          const from = map.project(segment.from)
          const to = map.project(segment.to)
          return { ...segment, index, x1: from.x, y1: from.y, x2: to.x, y2: to.y }
        }))
      }
      projectFlowsRef.current = projectFlows
      projectFlows()
    })
    return () => { cancelled = true }
  }, [
    mapReady,
    locale,
    currentFlows,
    candidateAreas,
    manualCandidate,
    network,
    onStoreSelect,
    onWarehouseSelect,
    result,
    selectedWarehouseId,
    unavailableWarehouseIds,
  ])


  const maxOptimizedFlowUnits = Math.max(
    0,
    ...projectedFlows.filter((item) => item.kind !== 'current').map((item) => item.units ?? 0)
  )
  const maxCurrentFlowUnits = Math.max(
    0,
    ...projectedFlows.filter((item) => item.kind === 'current').map((item) => item.units ?? 0)
  )

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950 sm:h-[540px]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" data-testid="supply-network-map" />
      {projectedFlows.length > 0 ? (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" data-testid="supply-network-flow-overlay">
          <defs>
            <marker id="flow-arrow-current" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#1e3a8a" />
            </marker>
            <marker id="flow-arrow-qdip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#0f766e" />
            </marker>
            <marker id="flow-arrow-inbound" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#6d28d9" />
            </marker>
          </defs>
          {projectedFlows.map((flow) => {
            const isCurrent = flow.kind === 'current'
            const isInbound = flow.kind === 'inbound'
            const stroke = isCurrent ? '#1e3a8a' : isInbound ? '#6d28d9' : '#0f766e'
            const marker = isCurrent ? 'url(#flow-arrow-current)' : isInbound ? 'url(#flow-arrow-inbound)' : 'url(#flow-arrow-qdip)'
            const dash = isCurrent ? '7 5' : undefined
            const optimizedWidth = maxOptimizedFlowUnits > 0 && flow.units
              ? 2.5 + 4 * Math.sqrt(flow.units / maxOptimizedFlowUnits)
              : 4.5
            const currentWidth = maxCurrentFlowUnits > 0 && flow.units
              ? 2.5 + 3 * Math.sqrt(flow.units / maxCurrentFlowUnits)
              : 3.5
            const flowWidth = isCurrent ? currentWidth : optimizedWidth
            if (flow.local) {
              return (
                <g key={`${flow.kind}-${flow.index}`}>
                  <circle
                    cx={flow.x1}
                    cy={flow.y1}
                    r={22 + flowWidth}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={flowWidth + 3}
                    strokeOpacity={0.78}
                    strokeDasharray={dash}
                  />
                  <circle
                    cx={flow.x1}
                    cy={flow.y1}
                    r={22 + flowWidth}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={flowWidth}
                    strokeDasharray={dash}
                  />
                </g>
              )
            }
            return (
              <g key={`${flow.kind}-${flow.index}`}>
                <line
                  x1={flow.x1}
                  y1={flow.y1}
                  x2={flow.x2}
                  y2={flow.y2}
                  stroke="#ffffff"
                  strokeWidth={flowWidth + 3}
                  strokeOpacity={0.78}
                  strokeDasharray={dash}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={flow.x1}
                  y1={flow.y1}
                  x2={flow.x2}
                  y2={flow.y2}
                  stroke={stroke}
                  strokeWidth={flowWidth}
                  strokeOpacity={1}
                  strokeDasharray={dash}
                  markerEnd={marker}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )
          })}
        </svg>
      ) : null}
      {mapUnavailable ? (
        <div className="absolute inset-0 flex items-center justify-center p-6" role="status">
          <div className="max-w-md rounded-lg border border-amber-400/20 bg-slate-950/95 p-4 text-center">
            <p className="text-sm font-medium text-slate-200">{locale === 'uk' ? 'Мапа тимчасово недоступна' : locale === 'pl' ? 'Mapa jest chwilowo niedostępna' : 'Map temporarily unavailable'}</p>
            <p className="mt-1 text-xs text-slate-400">{locale === 'uk' ? 'Розрахунок мережі доступний. Оновіть сторінку, щоб повторити завантаження мапи.' : locale === 'pl' ? 'Analiza sieci jest dostępna. Odśwież stronę, aby ponownie załadować mapę.' : 'Network analysis remains available. Reload to retry the map.'}</p>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 text-[11px] text-slate-200 sm:right-auto sm:max-w-[80%]">
        <span className="flex items-center gap-1.5 rounded bg-slate-950/90 px-2 py-1">
          <span className="h-3 w-3 rounded-[2px] border border-white bg-cyan-400" />
          {locale === 'uk' ? 'Склад' : locale === 'pl' ? 'Magazyn' : 'Warehouse'}
        </span>
        <span className="flex items-center gap-1.5 rounded bg-slate-950/90 px-2 py-1">
          <span className="h-3 w-3 rounded-full border border-white bg-slate-200" />
          {locale === 'uk' ? 'Регіон попиту' : locale === 'pl' ? 'Region popytu' : 'Demand region'}
        </span>
        {currentFlows.length > 0 ? (
          <span className="flex items-center gap-1.5 rounded bg-slate-950/90 px-2 py-1">
            <span className="text-base font-bold leading-none text-blue-800">→</span>
            {network.unavailable_warehouse_ids.length > 0
              ? locale === 'uk'
                ? 'Базові потоки до збою'
                : locale === 'pl'
                  ? 'Przepływy bazowe przed zakłóceniem'
                  : 'Baseline flows before disruption'
              : locale === 'uk'
                ? 'Поточні потоки'
                : locale === 'pl'
                  ? 'Bieżące przepływy'
                  : 'Current flows'}
          </span>
        ) : null}
        {projectedFlows.some((item) => item.kind === 'recommended' || item.kind === 'transfer') ? (
          <span className="flex items-center gap-1.5 rounded bg-slate-950/90 px-2 py-1">
            <span className="text-base font-bold leading-none text-teal-600">→</span>
            {locale === 'uk' ? 'План QDIP' : locale === 'pl' ? 'Plan QDIP' : 'QDIP plan'}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5 rounded bg-slate-950/90 px-2 py-1">
          <span className="h-3 w-3 bg-violet-700" style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }} />
          {locale === 'uk' ? 'Постачальник' : locale === 'pl' ? 'Dostawca' : 'Supplier'}
        </span>
        {candidateAreas.some((item) => item.feasible) || manualCandidate ? (
          <span className="flex items-center gap-1.5 rounded bg-slate-950/90 px-2 py-1">
            <span className="h-3 w-3 bg-amber-500" style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }} />
            {locale === 'uk' ? 'Варіант складу' : locale === 'pl' ? 'Wariant magazynu' : 'Warehouse option'}
          </span>
        ) : null}
      </div>
    </div>
  )
}
