import en from './messages/en.json'
import uk from './messages/uk.json'
import pl from './messages/pl.json'
import { LOCALE_TAGS, type Locale } from './config'

export type MessageCatalog = typeof en
type MessageValue = string | number | boolean | null | MessageValue[] | { [key: string]: MessageValue }

const catalogs: Record<Locale, MessageCatalog> = {
  en,
  uk: uk as MessageCatalog,
  pl: pl as MessageCatalog,
}

function resolvePath(root: MessageValue, path: string): MessageValue | undefined {
  return path.split('.').reduce<MessageValue | undefined>((current, segment) => {
    if (!current || Array.isArray(current) || typeof current !== 'object') return undefined
    return current[segment]
  }, root)
}

function interpolate(template: string, values: Record<string, string | number> = {}) {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  )
}

export function translate(
  locale: Locale,
  key: string,
  values?: Record<string, string | number>,
): string {
  const value = resolvePath(catalogs[locale] as unknown as MessageValue, key)
  if (typeof value !== 'string') {
    throw new Error(`Missing i18n message: ${locale}:${key}`)
  }
  return interpolate(value, values)
}

export function rawMessage<T = MessageValue>(locale: Locale, key: string): T {
  const value = resolvePath(catalogs[locale] as unknown as MessageValue, key)
  if (value === undefined) throw new Error(`Missing i18n message: ${locale}:${key}`)
  return value as T
}

export function createTranslator(locale: Locale, namespace: string) {
  return (key: string, values?: Record<string, string | number>) =>
    translate(locale, namespace ? `${namespace}.${key}` : key, values)
}

export function pluralMessage(
  locale: Locale,
  namespace: string,
  count: number,
  values: Record<string, string | number> = {},
) {
  const category = new Intl.PluralRules(LOCALE_TAGS[locale]).select(count)
  const fallback = `${namespace}.other`
  const selected = `${namespace}.${category}`
  try {
    return translate(locale, selected, { count, ...values })
  } catch {
    return translate(locale, fallback, { count, ...values })
  }
}

export function formatNumber(
  locale: Locale,
  value: number,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 1 },
) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], options).format(value)
}

export function getCatalog(locale: Locale): MessageCatalog {
  return catalogs[locale]
}
