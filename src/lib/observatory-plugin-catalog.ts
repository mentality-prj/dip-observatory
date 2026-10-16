import 'server-only'

import { normalizeDipBaseUrl } from '@/lib/dip-url'
import { DIP_USE_CASES } from '@/use-cases/registry'

export type CorePluginPublication = {
  name: string
  version: string
  description: string
  enabled: boolean
  capabilities: string[]
  capability_versions: Record<string, string>
  ui: { label?: string; category?: string }
  published: boolean | null
  revision: number
  capability_id: string | null
  published_version: string | null
}

// These specific demos were already publicly listed before the admin controls.
// New application routes are PRIVATE until explicitly published.
const LEGACY_PUBLIC = new Set([
  'resource-allocation',
  'supply-network-optimization',
  'contractor-allocation',
  'readiness-recovery',
  'gtm-lab',
])

export function corePluginConnection(): { base: string; key: string } {
  const base = normalizeDipBaseUrl(process.env.DIP_API_BASE_URL ?? process.env.DIP_URL)
  const key = (process.env.DIP_ADMIN_API_KEY ?? process.env.DIP_API_KEY ?? '').trim()
  if (!base || !key) throw new Error('QDIP Core admin connection is not configured')
  const url = new URL(base)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    throw new Error('QDIP Core requires HTTPS')
  return { base, key }
}

export async function corePluginRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const { base, key } = corePluginConnection()
  return fetch(base + '/api/v1/plugin-publications' + path, {
    ...init,
    headers: { 'x-api-key': key, 'Content-Type': 'application/json', ...init.headers },
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  })
}

export async function readCorePublications(): Promise<CorePluginPublication[]> {
  const response = await corePluginRequest('')
  if (!response.ok) throw new Error('QDIP plugin publication API unavailable')
  if (Number(response.headers.get('content-length') ?? '0') > 250_000) throw new Error('Oversized plugin catalog')
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Empty plugin catalog')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > 250_000) {
      await reader.cancel()
      throw new Error('Oversized plugin catalog')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let index = 0
  for (const chunk of chunks) {
    bytes.set(chunk, index)
    index += chunk.byteLength
  }
  const data: unknown = JSON.parse(new TextDecoder().decode(bytes))
  if (!Array.isArray(data) || data.length > 1000) throw new Error('Invalid plugin catalog')
  return data as CorePluginPublication[]
}

export function visibleUseCases(records: readonly CorePluginPublication[]): string[] {
  const byName = new Map(records.map((item) => [item.name, item]))
  return DIP_USE_CASES.filter((item) => {
    const record = byName.get(item.plugin.id)
    if (!record) return LEGACY_PUBLIC.has(item.id)
    if (!record.enabled || !record.capabilities.includes(item.plugin.capability)) return false
    if (record.published === null) return LEGACY_PUBLIC.has(item.id)
    return (
      record.published === true &&
      record.published_version === record.version &&
      record.capability_id === item.plugin.capability
    )
  }).map((item) => item.id)
}

export async function visiblePluginUseCaseIds(): Promise<string[]> {
  try {
    return visibleUseCases(await readCorePublications())
  } catch {
    // Existing browser fixtures intentionally run without Core; this explicit
    // Playwright-only override is set by playwright.config.ts, never by Web.
    // Production fails closed if Core cannot verify publication status.
    if (process.env.QDIP_PLAYWRIGHT_LEGACY_CATALOG === '1') {
      return visibleUseCases([])
    }
    return []
  }
}
