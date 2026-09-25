import en from './messages/en.json'
import uk from './messages/uk.json'
import pl from './messages/pl.json'
import { LOCALE_TAGS, type Locale } from './config'

export type MessageCatalog = typeof en
type MessageValue =
  | string
  | number
  | boolean
  | null
  | MessageValue[]
  | { [key: string]: MessageValue }

const catalogs: Record<Locale, MessageCatalog> = {
  en,
  uk: uk as MessageCatalog,
  pl: pl as MessageCatalog,
}

function resolvePath(root: MessageValue, path: string): MessageValue | undefined {
  if (!path) return root
  return path.split('.').reduce<MessageValue | undefined>((current, segment) => {
    if (!current || Array.isArray(current) || typeof current !== 'object') return undefined
    return current[segment]
  }, root)
}

function interpolate(
  template: string,
  values: Record<string, string | number> = {},
) {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : match,
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
  if (value === undefined) {
    throw new Error(`Missing i18n message: ${locale}:${key}`)
  }
  return value as T
}

export type Translator = {
  (key: string, values?: Record<string, string | number>): string
  raw<T = MessageValue>(key: string): T
  has(key: string): boolean
}

export function createTranslator(locale: Locale, namespace = ''): Translator {
  const fullKey = (key: string) => (namespace ? `${namespace}.${key}` : key)
  const t = ((key: string, values?: Record<string, string | number>) =>
    translate(locale, fullKey(key), values)) as Translator
  t.raw = <T = MessageValue>(key: string) =>
    rawMessage<T>(locale, fullKey(key))
  t.has = (key: string) =>
    resolvePath(catalogs[locale] as unknown as MessageValue, fullKey(key)) !== undefined
  return t
}

export function pluralMessage(
  locale: Locale,
  namespace: string,
  count: number,
  values: Record<string, string | number> = {},
) {
  const category = new Intl.PluralRules(LOCALE_TAGS[locale]).select(count)
  const t = createTranslator(locale, namespace)
  const key = t.has(category) ? category : 'other'
  return t(key, { count, ...values })
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
