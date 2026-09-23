const isDevelopment = process.env.NODE_ENV === 'development'

const defaultStudioOrigin = isDevelopment ? '/studio' : 'https://studio.qdip.ai'
const defaultObservatoryOrigin = isDevelopment ? '' : 'https://observatory.qdip.ai'

export type PlatformLocale = 'en' | 'uk' | 'pl'

export const PLATFORM_URLS = {
  site: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://qdip.ai',
  studio: process.env.NEXT_PUBLIC_STUDIO_URL ?? defaultStudioOrigin,
  observatory: process.env.NEXT_PUBLIC_OBSERVATORY_URL ?? defaultObservatoryOrigin,
} as const

function normalizePath(path: string) {
  const clean = path.replace(/^\/+|\/+$/g, '')
  return clean ? `/${clean}` : ''
}

export function studioHref(path = '', locale: PlatformLocale = 'en') {
  const suffix = normalizePath(path)
  if (isDevelopment) {
    const query = locale === 'en' ? '' : `?lang=${locale}`
    return `/studio${suffix}${query}`
  }
  return `${PLATFORM_URLS.studio}/${locale}${suffix}`
}

export function observatoryHref(path = '', locale?: PlatformLocale) {
  const cleanPath = path.replace(/^\/+/, '')
  const explicitLocale = cleanPath.match(/^(en|uk|pl)(?:\/(.*))?$/)
  const resolvedLocale = locale ?? (explicitLocale?.[1] as PlatformLocale | undefined) ?? 'en'
  const localizedPath = explicitLocale ? (explicitLocale[2] ?? '') : cleanPath
  return `${PLATFORM_URLS.observatory}/${resolvedLocale}${normalizePath(localizedPath)}`
}

export function marketingHref(locale: PlatformLocale) {
  if (isDevelopment) return `/platform/${locale}`
  return `${PLATFORM_URLS.site}/${locale}`
}

export function marketingLocaleHref(locale: PlatformLocale) {
  return isDevelopment ? `/platform/${locale}` : `/${locale}`
}
