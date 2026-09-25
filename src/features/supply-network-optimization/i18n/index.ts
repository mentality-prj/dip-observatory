import type { Locale } from '@/lib/observatory-i18n'
import type { StorageClass } from '../domain'
import {
  supplyNetworkEntityMessages,
  supplyNetworkMapMessages,
  supplyNetworkSummaryMessages,
  supplyNetworkWorkspaceMessages,
} from './messages'

const localeTags: Record<Locale, string> = {
  en: 'en-GB',
  uk: 'uk-UA',
  pl: 'pl-PL',
}

type MessageValue = string | number

export function interpolate(
  template: string,
  values: Record<string, MessageValue> = {},
): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : match,
  )
}

export function getSupplyNetworkI18n(locale: Locale) {
  return {
    workspace: supplyNetworkWorkspaceMessages[locale],
    summary: supplyNetworkSummaryMessages[locale],
    map: supplyNetworkMapMessages[locale],
    entities: supplyNetworkEntityMessages[locale],
  }
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(localeTags[locale], {
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(localeTags[locale], {
    style: 'currency',
    currency: 'UAH',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 1,
  }).format(value)
}

export function warehouseDisplayLabel(
  id: string,
  locale: Locale,
  fallback?: string,
) {
  const messages = supplyNetworkEntityMessages[locale]
  return messages.warehouses[id as keyof typeof messages.warehouses] ?? fallback ?? id
}

export function demandDisplayLabel(
  id: string,
  locale: Locale,
  fallback?: string,
) {
  const storeMatch = /^store-(\d+)$/.exec(id)
  if (storeMatch) {
    return interpolate(supplyNetworkEntityMessages[locale].store, {
      number: Number(storeMatch[1]),
    })
  }
  return fallback ?? id
}

export function supplierDisplayLabel(
  id: string,
  locale: Locale,
  fallback?: string,
) {
  const messages = supplyNetworkEntityMessages[locale]
  return messages.suppliers[id as keyof typeof messages.suppliers] ?? fallback ?? id
}

export function entityDisplayLabel(
  id: string,
  locale: Locale,
  fallback?: string,
) {
  return (
    warehouseDisplayLabel(id, locale) ??
    demandDisplayLabel(id, locale) ??
    supplierDisplayLabel(id, locale) ??
    fallback ??
    id
  )
}

export function productClassDisplayLabel(id: string, locale: Locale) {
  const messages = supplyNetworkEntityMessages[locale]
  return messages.products[id as keyof typeof messages.products] ?? id
}

export function storageClassDisplayLabel(
  storageClass: StorageClass,
  locale: Locale,
) {
  return supplyNetworkEntityMessages[locale].storage[storageClass]
}

export function candidateOptionLabel(index: number, locale: Locale) {
  return interpolate(supplyNetworkEntityMessages[locale].candidateOption, {
    number: index + 1,
  })
}
