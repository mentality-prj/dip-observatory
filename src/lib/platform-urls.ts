import { isSupportedLocale, type Locale } from '@/i18n/config'

const isDevelopment = process.env.NODE_ENV === 'development'

const defaultStudioOrigin = isDevelopment ? '/studio' : 'https://studio.qdip.ai'
const defaultObservatoryOrigin = isDevelopment ? '' : 'https://observatory.qdip.ai'

export type PlatformLocale = Locale

export const PLATFORM_URLS = {
  site: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://qdip.ai',
  studio: process.env.NEXT_PUBLIC_STUDIO_URL ?? defaultStudioOrigin,
  observatory: process.env.NEXT_PUBLIC_OBSERVATORY_URL ?? defaultObservatoryOrigin,
} as const

function normalizePath(path: string) {
  const clean = path.replace(/^\/+|\/+$/g, '')
  return clean ? `/${clean}` : ''
}

export function studioSurfaceHref(path = '', locale: PlatformLocale = 'en') {
  const suffix = normalizePath(path)
  if (isDevelopment) {
    const query = locale === 'en' ? '' : `?lang=${locale}`
    return `/studio${suffix}${query}`
  }
  return `/${locale}${suffix}`
}

export function studioHref(path = '', locale: PlatformLocale = 'en') {
  if (isDevelopment) return studioSurfaceHref(path, locale)
  return `${PLATFORM_URLS.studio}${studioSurfaceHref(path, locale)}`
}

export function observatoryHref(path = '', locale?: PlatformLocale) {
  const cleanPath = path.replace(/^\/+/, '')
  const [firstSegment, ...rest] = cleanPath.split('/')
  const explicitLocale = isSupportedLocale(firstSegment) ? firstSegment : undefined
  const resolvedLocale = locale ?? explicitLocale ?? 'en'
  const localizedPath = explicitLocale ? rest.join('/') : cleanPath
  return `${PLATFORM_URLS.observatory}/${resolvedLocale}${normalizePath(localizedPath)}`
}

export function marketingHref(locale: PlatformLocale) {
  if (isDevelopment) return `/platform/${locale}`
  return `${PLATFORM_URLS.site}/${locale}`
}

export function marketingLocaleHref(locale: PlatformLocale) {
  return isDevelopment ? `/platform/${locale}` : `/${locale}`
}
