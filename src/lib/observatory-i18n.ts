import {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  localizePath,
  type Locale,
} from '@/i18n/config'
import { translate } from '@/i18n/runtime'

export {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type Locale,
}

export const buildLocalePath = localizePath
export const LOCALE_STORAGE_KEY = 'qdip-observatory-locale'

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

export function getLocaleMetadata(locale: Locale) {
  return {
    title: translate(locale, 'metadata.observatory.title'),
    description: translate(locale, 'metadata.observatory.description'),
  }
}
