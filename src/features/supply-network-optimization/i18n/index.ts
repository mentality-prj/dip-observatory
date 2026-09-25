import type { Locale } from '@/i18n/config'
import {
  formatNumber as formatLocaleNumber,
  rawMessage,
  translate,
} from '@/i18n/runtime'
import type { StorageClass } from '../domain'

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
    workspace: rawMessage<Record<string, string>>(locale, 'supplyNetwork.workspace'),
    summary: rawMessage<Record<string, string>>(locale, 'supplyNetwork.summary'),
    map: rawMessage<Record<string, string>>(locale, 'supplyNetwork.map'),
    entities: rawMessage<Record<string, unknown>>(locale, 'supplyNetwork.entities'),
    constraints: rawMessage<Record<string, string>>(locale, 'supplyNetwork.constraints'),
  }
}

export function formatNumber(value: number, locale: Locale) {
  return formatLocaleNumber(locale, value)
}

export function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : locale === 'uk' ? 'uk-UA' : 'pl-PL', {
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
  try {
    return translate(locale, `supplyNetwork.entities.warehouses.${id}`)
  } catch {
    return fallback ?? id
  }
}

export function demandDisplayLabel(
  id: string,
  locale: Locale,
  fallback?: string,
) {
  const storeMatch = /^store-(\d+)$/.exec(id)
  if (storeMatch) {
    return translate(locale, 'supplyNetwork.entities.store', {
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
  try {
    return translate(locale, `supplyNetwork.entities.suppliers.${id}`)
  } catch {
    return fallback ?? id
  }
}

export function entityDisplayLabel(
  id: string,
  locale: Locale,
  fallback?: string,
) {
  const warehouse = warehouseDisplayLabel(id, locale)
  if (warehouse !== id) return warehouse

  const storeMatch = /^store-(\d+)$/.exec(id)
  if (storeMatch) {
    return translate(locale, 'supplyNetwork.entities.store', {
      number: Number(storeMatch[1]),
    })
  }

  const supplier = supplierDisplayLabel(id, locale)
  return supplier !== id ? supplier : fallback ?? id
}

export function productClassDisplayLabel(id: string, locale: Locale) {
  try {
    return translate(locale, `supplyNetwork.entities.products.${id}`)
  } catch {
    return id
  }
}

export function storageClassDisplayLabel(
  storageClass: StorageClass,
  locale: Locale,
) {
  return translate(locale, `supplyNetwork.entities.storage.${storageClass}`)
}

export function candidateOptionLabel(index: number, locale: Locale) {
  return translate(locale, 'supplyNetwork.entities.candidateOption', {
    number: index + 1,
  })
}

export function constraintDisplayLabel(value: string, locale: Locale) {
  const [kind, ...parts] = value.split(':')
  let label: string
  try {
    label = translate(locale, `supplyNetwork.constraints.${kind}`)
  } catch {
    return value.replaceAll(':', ' · ')
  }
  const readableParts = parts.map((part) =>
    entityDisplayLabel(part, locale),
  )
  return readableParts.length
    ? `${label} · ${readableParts.join(' · ')}`
    : label
}
