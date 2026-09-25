export {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  localizePath as buildLocalePath,
  type Locale,
} from '@/i18n/config'

import type { Locale } from '@/i18n/config'
import { translate } from '@/i18n/runtime'

export const LOCALE_STORAGE_KEY = 'qdip-observatory-locale'

export function detectLocaleFromHeader(value?: string | null): Locale {
  const candidates = (value ?? '')
    .split(',')
    .map((entry) => entry.trim().split(';')[0]?.trim())
    .filter(Boolean) as string[]

  const { SUPPORTED_LOCALES, DEFAULT_LOCALE } = requireLocaleConfig()
  for (const candidate of candidates) {
    const locale = SUPPORTED_LOCALES.find((item) =>
      candidate.toLowerCase().startsWith(item),
    )
    if (locale) return locale
  }
  return DEFAULT_LOCALE
}

function requireLocaleConfig() {
  return {
    SUPPORTED_LOCALES: ['en', 'uk', 'pl'] as const,
    DEFAULT_LOCALE: 'en' as const,
  }
}

export function getLocaleMetadata(locale: Locale) {
  return {
    title: translate(locale, 'metadata.observatory.title'),
    description: translate(locale, 'metadata.observatory.description'),
  }
}
