export const MAPLIBRE_SCRIPT_URL =
  'https://cdn.jsdelivr.net/npm/maplibre-gl@6.11.0/dist/maplibre-gl.js'
export const MAPLIBRE_CSS_URL =
  'https://cdn.jsdelivr.net/npm/maplibre-gl@6.11.0/dist/maplibre-gl.css'

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

let loader: Promise<MapLibreApi> | null = null

export type MapLibreMap = {
  on: (event: string, handler: (event: { lngLat: { lng: number; lat: number }; originalEvent?: MouseEvent }) => void) => void
  addSource: (id: string, source: unknown) => void
  addLayer: (layer: unknown) => void
  getSource: (id: string) => unknown
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

declare global {
  interface Window {
    maplibregl?: MapLibreApi
  }
}

function ensureStylesheet() {
  if (document.querySelector('link[data-qpid-maplibre]')) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = MAPLIBRE_CSS_URL
  link.dataset.qpidMaplibre = 'true'
  document.head.appendChild(link)
}

export function loadMapLibre(): Promise<MapLibreApi> {
  if (window.maplibregl) return Promise.resolve(window.maplibregl)
  if (loader) return loader
  loader = new Promise((resolve, reject) => {
    ensureStylesheet()
    const existing = document.querySelector<HTMLScriptElement>('script[data-qpid-maplibre]')
    const script = existing ?? document.createElement('script')
    if (!existing) {
      script.src = MAPLIBRE_SCRIPT_URL
      script.async = true
      script.dataset.qpidMaplibre = 'true'
      document.head.appendChild(script)
    }
    script.addEventListener('load', () => {
      if (window.maplibregl) resolve(window.maplibregl)
      else {
        loader = null
        reject(new Error('Map provider unavailable'))
      }
    }, { once: true })
    script.addEventListener('error', () => {
      loader = null
      reject(new Error('Map provider unavailable'))
    }, { once: true })
  })
  return loader
}
