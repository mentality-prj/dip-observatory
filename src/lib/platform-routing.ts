import { isSupportedLocale, type Locale } from '@/i18n/config'
import { PLATFORM_ORIGINS, type PlatformSurface } from '@/routing-config'

export type PlatformLocale = Locale
export type { PlatformSurface }

export const PLATFORM_SURFACES = {
  site: { origin: PLATFORM_ORIGINS.site },
  studio: { origin: PLATFORM_ORIGINS.studio },
  observatory: { origin: PLATFORM_ORIGINS.observatory },
} as const

export function surfacePath(locale: PlatformLocale, path = '') {
  const clean = path.replace(/^\/+|\/+$/g, '')
  return clean ? `/${locale}/${clean}` : `/${locale}`
}

export function surfaceHref(surface: PlatformSurface, locale: PlatformLocale, path = '') {
  return `${PLATFORM_ORIGINS[surface]}${surfacePath(locale, path)}`
}

export function resolveLocalizedPath(path: string, locale?: PlatformLocale) {
  const cleanPath = path.replace(/^\/+/, '')
  const [firstSegment, ...rest] = cleanPath.split('/')
  const explicitLocale = isSupportedLocale(firstSegment) ? firstSegment : undefined
  return {
    locale: locale ?? explicitLocale ?? 'en',
    path: explicitLocale ? rest.join('/') : cleanPath,
  } as const
}
