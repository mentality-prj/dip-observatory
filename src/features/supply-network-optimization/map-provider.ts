export const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
} as const

let loader: Promise<MapLibreApi | null> | null = null

export type MapLibreMap = {
  on: (
    event: string,
    handler: (event: { lngLat: { lng: number; lat: number }; originalEvent?: MouseEvent }) => void
  ) => void
  project: (coordinates: [number, number]) => { x: number; y: number }
  fitBounds: (bounds: [[number, number], [number, number]], options?: Record<string, unknown>) => void
  isStyleLoaded: () => boolean
  resize: () => void
  addSource: (id: string, source: unknown) => void
  addLayer: (layer: unknown) => void
  getSource: (id: string) => unknown
  getLayer: (id: string) => unknown
  removeLayer: (id: string) => void
  removeSource: (id: string) => void
  remove: () => void
}

export type MapLibreMarker = {
  setLngLat: (coordinates: [number, number]) => MapLibreMarker
  addTo: (map: MapLibreMap) => MapLibreMarker
  remove: () => void
}

export type MapLibreApi = {
  Map: new (options: Record<string, unknown>) => MapLibreMap
  Marker: new (options?: Record<string, unknown>) => MapLibreMarker
}

export function loadMapLibre(): Promise<MapLibreApi | null> {
  if (loader) return loader
  loader = import('maplibre-gl').then((module) => module as unknown as MapLibreApi).catch(() => null)
  return loader
}
