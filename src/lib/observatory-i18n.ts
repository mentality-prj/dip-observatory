export const LOCALE_STORAGE_KEY = 'qdip-observatory-locale'
export const SUPPORTED_LOCALES = ['en', 'uk', 'pl'] as const
export const DEFAULT_LOCALE: Locale = 'en'

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-GB',
  uk: 'uk-UA',
  pl: 'pl-PL',
}

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function detectLocaleFromHeader(value?: string | null): Locale {
  const candidates = (value ?? '')
    .split(',')
    .map((entry) => entry.trim().split(';')[0]?.trim())
    .filter(Boolean) as string[]

  for (const candidate of candidates) {
    const locale = SUPPORTED_LOCALES.find((item) =>
      candidate.toLowerCase().startsWith(item),
    )
    if (locale) return locale
  }
  return DEFAULT_LOCALE
}

export function buildLocalePath(pathname: string, locale: Locale) {
  const segments = (pathname || '/').split('/').filter(Boolean)
  if (segments[0] && isSupportedLocale(segments[0])) segments.shift()
  return segments.length
    ? `/${locale}/${segments.join('/')}`
    : `/${locale}`
}

const metadata = {
  en: {
    title: 'QDIP Observatory | English interface',
    description: 'Explore QDIP decision applications, their inputs, alternatives and decision evidence.',
  },
  uk: {
    title: 'QDIP Observatory | Український інтерфейс',
    description: 'Досліджуйте застосунки QDIP для прийняття рішень, їхні вхідні дані, альтернативи та обґрунтування.'
  },
  pl: {
    title: 'QDIP Observatory | Polski interfejs',
    description: 'Poznaj aplikacje decyzyjne QDIP, ich dane wejściowe, alternatywy i uzasadnienia decyzji.'
  },
} as const

export function getLocaleMetadata(locale: Locale) {
  return metadata[locale]
}
