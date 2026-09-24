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

type Props = {
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
  element.style.width = kind === 'store' ? '13px' : '18px'
  element.style.height = kind === 'store' ? '13px' : '18px'
  element.style.borderRadius = kind === 'store' ? '50%' : '5px'
  element.style.border = '2px solid rgba(255,255,255,.9)'
  element.style.boxShadow = '0 1px 8px rgba(0,0,0,.45)'
  element.style.cursor = 'pointer'
  element.style.background =
    kind === 'unavailable' ? '#ef4444'
      : kind === 'candidate' ? '#f59e0b'
        : kind === 'warehouse' ? '#22d3ee'
          : kind === 'supplier' ? '#a78bfa'
            : '#e2e8f0'
  if (kind === 'unavailable') {
    element.style.transform = 'rotate(45deg)'
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
        center: [19.2, 52.0],
        zoom: 5.3,
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
        element.title = warehouse.label ?? warehouse.id
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
        element.title = store.label
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
        element.title = supplier.label ?? supplier.id
        markersRef.current.push(
          new maplibre.Marker({ element }).setLngLat([supplier.longitude, supplier.latitude]).addTo(map)
        )
      }
      for (const candidate of candidateAreas.filter((item) => item.feasible)) {
        const element = markerStyle('candidate')
        element.dataset.networkMarker = 'candidate'
        element.title = candidate.label ?? candidate.candidate_id
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
      for (const layerId of ['recommended-flows', 'current-flows']) {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(layerId)) map.removeSource(layerId)
      }
      map.addSource('current-flows', { type: 'geojson', data: collections.current })
      map.addLayer({
        id: 'current-flows',
        type: 'line',
        source: 'current-flows',
        paint: { 'line-color': '#64748b', 'line-width': 1.2, 'line-opacity': 0.32 },
      })
      if (result) {
        map.addSource('recommended-flows', { type: 'geojson', data: collections.recommended })
        map.addLayer({
          id: 'recommended-flows',
          type: 'line',
          source: 'recommended-flows',
          paint: { 'line-color': '#22d3ee', 'line-width': 2.4, 'line-opacity': 0.78 },
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
    <div className="relative min-h-[540px] overflow-hidden rounded-xl border border-white/10 bg-slate-950">
      <div ref={containerRef} className="absolute inset-0" data-testid="supply-network-map" />
      {mapUnavailable ? (
        <div className="absolute inset-0 flex items-center justify-center p-6" role="status">
          <div className="max-w-md rounded-lg border border-amber-400/20 bg-slate-950/95 p-4 text-center">
            <p className="text-sm font-medium text-slate-200">Geographic map unavailable</p>
            <p className="mt-1 text-xs text-slate-400">Network analysis remains available. Reload to retry the map provider.</p>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-slate-300">
        Current flow · Recommended flow · Warehouse · Store · Supplier · Candidate
      </div>
    </div>
  )
}
