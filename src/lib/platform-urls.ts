const isDevelopment = process.env.NODE_ENV === 'development'

const defaultStudioOrigin = isDevelopment ? '/studio' : 'https://studio.qdip.ai'
const defaultObservatoryOrigin = isDevelopment ? '' : 'https://observatory.qdip.ai'
export type PlatformLocale = 'en' | 'uk' | 'pl'

export const PLATFORM_URLS = {
  site: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://qdip.ai',
  studio: process.env.NEXT_PUBLIC_STUDIO_URL ?? defaultStudioOrigin,
  observatory: process.env.NEXT_PUBLIC_OBSERVATORY_URL ?? defaultObservatoryOrigin,
} as const

export function studioHref(path = '') {
  const suffix = path ? `/${path.replace(/^\/+/, '')}` : ''
  return `${PLATFORM_URLS.studio}${suffix}`
}

export function observatoryHref(path = '', locale: PlatformLocale = 'en') {
  const cleanPath = path.replace(/^\/+/, '').replace(/^(en|uk|pl)\//, '')
  const suffix = cleanPath ? `/${cleanPath}` : ''
  return `${PLATFORM_URLS.observatory}/${locale}${suffix}`
}

export function marketingHref(locale: PlatformLocale) {
  if (isDevelopment) return `/platform/${locale}`
  return `${PLATFORM_URLS.site}/${locale}`
}

export function marketingLocaleHref(locale: PlatformLocale) {
  return `/platform/${locale}`
}
