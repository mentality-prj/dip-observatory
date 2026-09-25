export const SUPPORTED_LOCALES = ['en', 'uk', 'pl'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-GB',
  uk: 'uk-UA',
  pl: 'pl-PL',
}

export const SUPPORTED_LOCALE_PATTERN = `(${SUPPORTED_LOCALES.join('|')})`

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function localizePath(pathname: string, locale: Locale) {
  const segments = (pathname || '/').split('/').filter(Boolean)
  if (segments[0] && isSupportedLocale(segments[0])) segments.shift()
  return segments.length ? `/${locale}/${segments.join('/')}` : `/${locale}`
}
