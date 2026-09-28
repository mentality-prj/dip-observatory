import {
  PLATFORM_SURFACES,
  resolveLocalizedPath,
  surfaceHref,
  surfacePath,
  type PlatformLocale,
} from './platform-routing'

export { PLATFORM_SURFACES, type PlatformLocale }

export const PLATFORM_URLS = {
  site: PLATFORM_SURFACES.site.origin,
  studio: PLATFORM_SURFACES.studio.origin,
  observatory: PLATFORM_SURFACES.observatory.origin,
} as const

export function studioSurfaceHref(path = '', locale: PlatformLocale = 'en') {
  return surfacePath(locale, path)
}

export function studioHref(path = '', locale: PlatformLocale = 'en') {
  return surfaceHref('studio', locale, path)
}

export function observatoryHref(path = '', locale?: PlatformLocale) {
  const resolved = resolveLocalizedPath(path, locale)
  return surfaceHref('observatory', resolved.locale, resolved.path)
}

export function marketingHref(locale: PlatformLocale) {
  return surfaceHref('site', locale)
}

export function marketingLocaleHref(locale: PlatformLocale) {
  return surfacePath(locale)
}
