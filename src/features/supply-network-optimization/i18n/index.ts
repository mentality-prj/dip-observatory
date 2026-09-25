import { LOCALE_TAGS, type Locale } from '@/lib/observatory-i18n'
import type { StorageClass } from '../domain'
import {
  supplyNetworkConstraintMessages,
  supplyNetworkEntityMessages,
  supplyNetworkMapMessages,
  supplyNetworkSummaryMessages,
  supplyNetworkWorkspaceMessages,
} from './messages'

type MessageValue = string | number

export function interpolate(template: string, values: Record<string, MessageValue> = {}): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  )
}

export function getSupplyNetworkI18n(locale: Locale) {
  return {
    workspace: supplyNetworkWorkspaceMessages[locale],
    summary: supplyNetworkSummaryMessages[locale],
    map: supplyNetworkMapMessages[locale],
    entities: supplyNetworkEntityMessages[locale],
    constraints: supplyNetworkConstraintMessages[locale],
  }
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'currency',
    currency: 'UAH',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 1,
  }).format(value)
}

export function warehouseDisplayLabel(id: string, locale: Locale, fallback?: string) {
  const messages = supplyNetworkEntityMessages[locale]
  const warehouses = messages.warehouses as Readonly<Record<string, string>>
  return warehouses[id] ?? fallback ?? id
}

export function demandDisplayLabel(id: string, locale: Locale, fallback?: string) {
  const storeMatch = /^store-(\d+)$/.exec(id)
  if (storeMatch) {
    return interpolate(supplyNetworkEntityMessages[locale].store, {
      number: Number(storeMatch[1]),
    })
  }
  return fallback ?? id
}

export function supplierDisplayLabel(id: string, locale: Locale, fallback?: string) {
  const messages = supplyNetworkEntityMessages[locale]
  const suppliers = messages.suppliers as Readonly<Record<string, string>>
  return suppliers[id] ?? fallback ?? id
}

export function entityDisplayLabel(id: string, locale: Locale, fallback?: string) {
  const messages = supplyNetworkEntityMessages[locale]
  const warehouses = messages.warehouses as Readonly<Record<string, string>>
  const warehouse = warehouses[id]
  if (warehouse) return warehouse

  const storeMatch = /^store-(\d+)$/.exec(id)
  if (storeMatch) {
    return interpolate(messages.store, {
      number: Number(storeMatch[1]),
    })
  }

  const suppliers = messages.suppliers as Readonly<Record<string, string>>
  const supplier = suppliers[id]
  return supplier ?? fallback ?? id
}

export function productClassDisplayLabel(id: string, locale: Locale) {
  const messages = supplyNetworkEntityMessages[locale]
  const products = messages.products as Readonly<Record<string, string>>
  return products[id] ?? id
}

export function storageClassDisplayLabel(storageClass: StorageClass, locale: Locale) {
  return supplyNetworkEntityMessages[locale].storage[storageClass]
}

export function candidateOptionLabel(index: number, locale: Locale) {
  return interpolate(supplyNetworkEntityMessages[locale].candidateOption, {
    number: index + 1,
  })
}

export function constraintDisplayLabel(value: string, locale: Locale) {
  const [kind, ...parts] = value.split(':')
  const labels = supplyNetworkConstraintMessages[locale]
  const label = labels[kind as keyof typeof labels]
  if (!label) return value.replaceAll(':', ' · ')
  const readableParts = parts.map((part) => entityDisplayLabel(part, locale))
  return readableParts.length ? `${label} · ${readableParts.join(' · ')}` : label
}
