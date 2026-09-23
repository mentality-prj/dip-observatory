'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  CandidateResult,
  CandidateWarehouse,
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

function coordinate(network: SupplyNetwork, id: string): [number, number] | null {
  const warehouse = network.warehouses.find((item) => item.id === id)
  if (warehouse) return [warehouse.longitude, warehouse.latitude]
  const point = network.demand_points.find((item) => item.id === id)
  if (point) return [point.longitude, point.latitude]
  return null
}

function flows(network: SupplyNetwork, result: OptimizationResult | null) {
  const features: Record<string, unknown>[] = []
  if (result) {
    for (const item of result.fulfillment) {
      const from = coordinate(network, item.warehouse_id)
      const to = coordinate(network, item.demand_point_id)
      if (!from || !to || item.units <= 0) continue
      features.push({
        type: 'Feature',
        properties: { kind: 'recommended', units: item.units },
        geometry: { type: 'LineString', coordinates: [from, to] },
      })
    }
    for (const item of result.transfers) {
      const from = coordinate(network, item.from_warehouse_id)
      const to = coordinate(network, item.to_warehouse_id)
      if (!from || !to || item.units <= 0) continue
      features.push({
        type: 'Feature',
        properties: { kind: 'transfer', units: item.units },
        geometry: { type: 'LineString', coordinates: [from, to] },
      })
    }
  } else {
    for (const route of network.delivery_routes) {
      const from = coordinate(network, route.from_node_id)
      const to = coordinate(network, route.to_demand_point_id)
      if (!from || !to) continue
      features.push({
        type: 'Feature',
        properties: { kind: 'current', units: 0 },
        geometry: { type: 'LineString', coordinates: [from, to] },
      })
    }
  }
  return { type: 'FeatureCollection', features }
}

export function NetworkMap({
  network,
  result,
  unavailableWarehouseIds,
  candidateAreas,
  manualCandidate,
  onWarehouseSelect,
  onStoreSelect,
  onMapClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const markersRef = useRef<MapLibreMarker[]>([])
  const clickRef = useRef(onMapClick)
  clickRef.current = onMapClick

  useEffect(() => {
    let cancelled = false
    let localMap: MapLibreMap | null = null
    void loadMapLibre().then((maplibre) => {
      if (cancelled || !containerRef.current) return
      localMap = new maplibre.Map({
        container: containerRef.current,
        style: OSM_RASTER_STYLE,
        center: [19.2, 52.0],
        zoom: 5.3,
        attributionControl: true,
      })
      mapRef.current = localMap
      setMapReady(true)
      localMap.on('click', (event) => {
        const target = event.originalEvent?.target
        if (target instanceof HTMLElement && target.closest('[data-network-marker]')) return
        clickRef.current(event.lngLat.lat, event.lngLat.lng)
      })
    }).catch(() => {
      // The surrounding workspace remains fully usable if the external map asset fails.
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
      if (cancelled || !map) return
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

      if (map.getSource('network-flows')) {
        map.removeLayer('network-flows')
        map.removeSource('network-flows')
      }
      map.addSource('network-flows', { type: 'geojson', data: flows(network, result) })
      map.addLayer({
        id: 'network-flows',
        type: 'line',
        source: 'network-flows',
        paint: {
          'line-color': result ? '#22d3ee' : '#64748b',
          'line-width': result ? 2.3 : 1,
          'line-opacity': result ? 0.7 : 0.24,
        },
      })
    })
    return () => { cancelled = true }
  }, [
    mapReady,
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
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-slate-300">
        Warehouse · Store · Supplier · Candidate
      </div>
    </div>
  )
}
