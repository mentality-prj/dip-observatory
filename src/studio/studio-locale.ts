import type { PlatformLocale } from '@/lib/platform-urls'

export const STUDIO_LOCALES = ['en', 'uk', 'pl'] as const satisfies readonly PlatformLocale[]
export type StudioLocale = (typeof STUDIO_LOCALES)[number]

export const STUDIO_LOCALE_LABEL: Record<StudioLocale, string> = {
  en: 'EN',
  uk: 'UA',
  pl: 'PL',
}

export function parseStudioLocale(value: string | null | undefined): StudioLocale {
  return STUDIO_LOCALES.includes(value as StudioLocale) ? (value as StudioLocale) : 'en'
}


export function studioLocaleFromPath(pathname: string, searchLocale?: string | null): StudioLocale {
  const first = pathname.split('/').filter(Boolean)[0]
  return parseStudioLocale(STUDIO_LOCALES.includes(first as StudioLocale) ? first : searchLocale)
}

export function studioSectionFromPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'studio') return parts.slice(1).join('/')
  if (STUDIO_LOCALES.includes(parts[0] as StudioLocale)) return parts.slice(1).join('/')
  return parts.join('/')
}
