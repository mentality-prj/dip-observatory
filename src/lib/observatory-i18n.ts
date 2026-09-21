export const LOCALE_STORAGE_KEY = 'qdip-observatory-locale'
export const SUPPORTED_LOCALES = ['en', 'uk', 'pl'] as const
export const DEFAULT_LOCALE: Locale = 'en'

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function detectLocaleFromHeader(value?: string | null): Locale {
  const candidates = (value ?? '')
    .split(',')
    .map((entry) => entry.trim().split(';')[0]?.trim())
    .filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (candidate.startsWith('uk')) return 'uk'
    if (candidate.startsWith('pl')) return 'pl'
    if (candidate.startsWith('en')) return 'en'
  }
  return DEFAULT_LOCALE
}

export function buildLocalePath(pathname: string, locale: Locale) {
  const normalizedPath = pathname || '/'
  const stripped = normalizedPath.replace(/^\/(en|uk|pl)(?=\/|$)/, '') || '/'
  return stripped === '/' ? `/${locale}` : `/${locale}${stripped}`
}

const metadata = {
  en: {
    title: 'QDIP Observatory | English interface',
    description: 'Explore QDIP decision applications, their inputs, alternatives and decision evidence.',
  },
  uk: {
    title: 'QDIP Observatory | Український інтерфейс',
    description: 'Досліджуйте прикладні рішення QDIP, їхні вхідні дані, альтернативи та докази рішень.',
  },
  pl: {
    title: 'QDIP Observatory | Polski interfejs',
    description: 'Poznaj aplikacje decyzyjne QDIP, ich dane wejściowe, alternatywy i dowody decyzji.',
  },
} as const

export function getLocaleMetadata(locale: Locale) {
  return metadata[locale]
}
