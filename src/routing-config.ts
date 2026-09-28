export type PlatformSurface = 'site' | 'studio' | 'observatory'

function normalizeOrigin(value: string | undefined, fallback: string) {
  const origin = (value ?? fallback).replace(/\/+$/, '')
  const parsed = new URL(origin)
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`Invalid platform origin: ${origin}`)
  }
  return origin
}

function hostname(origin: string) {
  return new URL(origin).hostname.toLowerCase()
}

function unique(values: readonly string[]) {
  return [...new Set(values.map((value) => value.toLowerCase()))]
}

export const PLATFORM_ORIGINS = {
  site: normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL, 'https://qdip.ai'),
  studio: normalizeOrigin(process.env.NEXT_PUBLIC_STUDIO_URL, 'https://studio.qdip.ai'),
  observatory: normalizeOrigin(process.env.NEXT_PUBLIC_OBSERVATORY_URL, 'https://observatory.qdip.ai'),
} as const

export const PLATFORM_HOSTS = {
  site: unique(['qdip.ai', 'www.qdip.ai', 'qdip.localhost', hostname(PLATFORM_ORIGINS.site)]),
  studio: unique(['studio.qdip.ai', 'studio.localhost', hostname(PLATFORM_ORIGINS.studio)]),
  observatory: unique(['observatory.qdip.ai', 'observatory.localhost', hostname(PLATFORM_ORIGINS.observatory)]),
} as const

const ownership = new Map<string, PlatformSurface>()
for (const [surface, hosts] of Object.entries(PLATFORM_HOSTS) as [PlatformSurface, readonly string[]][]) {
  for (const host of hosts) {
    const current = ownership.get(host)
    if (current && current !== surface) {
      throw new Error(`Platform host "${host}" is assigned to both "${current}" and "${surface}".`)
    }
    ownership.set(host, surface)
  }
}

function stripPort(value: string) {
  return value.trim().toLowerCase().replace(/:\d+$/, '')
}

export function isSurfaceHost(surface: PlatformSurface, value: string | null | undefined) {
  if (!value) return false
  const host = stripPort(value.split(',')[0] ?? '')
  return PLATFORM_HOSTS[surface].includes(host)
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hostPattern(hosts: readonly string[], includeVercelPreview = false) {
  const patterns = hosts.map((host) =>
    host.endsWith('.localhost') ? `${escapeRegex(host)}(?::\\d+)?` : escapeRegex(host)
  )
  if (includeVercelPreview) patterns.push('.+\\.vercel\\.app')
  return `^(?:${patterns.join('|')})$`
}

export const PLATFORM_HOST_PATTERNS = {
  site: hostPattern(PLATFORM_HOSTS.site, true),
  studio: hostPattern(PLATFORM_HOSTS.studio),
  observatory: hostPattern(PLATFORM_HOSTS.observatory),
} as const
