import type { Locale } from '@/lib/observatory-i18n'
import type { StorageClass } from './domain'

const warehouseLabels: Record<string, Record<Locale, string>> = {
  'north-hub': { en: 'Kyiv warehouse', uk: 'Склад у Києві', pl: 'Magazyn w Kijowie' },
  'west-hub': { en: 'Lviv warehouse', uk: 'Склад у Львові', pl: 'Magazyn we Lwowie' },
  'central-hub': { en: 'Dnipro warehouse', uk: 'Склад у Дніпрі', pl: 'Magazyn w Dnieprze' },
  'south-hub': { en: 'Odesa warehouse', uk: 'Склад в Одесі', pl: 'Magazyn w Odessie' },
}

const demandLabels: Record<string, Record<Locale, string>> = {
  'north-coast': { en: 'Kyiv region', uk: 'Київський регіон', pl: 'Region Kijowa' },
  'north-east': { en: 'Kharkiv region', uk: 'Харківський регіон', pl: 'Region Charkowa' },
  west: { en: 'Lviv region', uk: 'Львівський регіон', pl: 'Region Lwowa' },
  central: { en: 'Dnipro region', uk: 'Дніпровський регіон', pl: 'Region Dniepru' },
  south: { en: 'Odesa region', uk: 'Одеський регіон', pl: 'Region Odessy' },
  'south-east': { en: 'Vinnytsia region', uk: 'Вінницький регіон', pl: 'Region Winnicy' },
}

const supplierLabels: Record<string, Record<Locale, string>> = {
  'supplier-main': { en: 'Western supplier', uk: 'Західний постачальник', pl: 'Dostawca z zachodu' },
}

const productLabels: Record<string, Record<Locale, string>> = {
  core: { en: 'Everyday assortment', uk: 'Основний асортимент', pl: 'Asortyment podstawowy' },
  premium: { en: 'Premium assortment', uk: 'Преміальний асортимент', pl: 'Asortyment premium' },
  gift: { en: 'Gift assortment', uk: 'Подарунковий асортимент', pl: 'Asortyment prezentowy' },
}

const storageLabels: Record<StorageClass, Record<Locale, string>> = {
  ambient: { en: 'Standard storage', uk: 'Звичайне зберігання', pl: 'Standardowe składowanie' },
  controlled: { en: 'Controlled storage', uk: 'Контрольовані умови', pl: 'Kontrolowane warunki' },
}

const localeTag: Record<Locale, string> = { en: 'en-GB', uk: 'uk-UA', pl: 'pl-PL' }

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(localeTag[locale], { maximumFractionDigits: 1 }).format(value)
}

export function formatMoney(value: number, locale: Locale) {
  return `${formatNumber(value, locale)} ₴`
}

export function warehouseDisplayLabel(id: string, locale: Locale, fallback?: string) {
  return warehouseLabels[id]?.[locale] ?? fallback ?? id
}

export function demandDisplayLabel(id: string, locale: Locale, fallback?: string) {
  return demandLabels[id]?.[locale] ?? fallback ?? id
}

export function supplierDisplayLabel(id: string, locale: Locale, fallback?: string) {
  return supplierLabels[id]?.[locale] ?? fallback ?? id
}

export function entityDisplayLabel(id: string, locale: Locale, fallback?: string) {
  return warehouseLabels[id]?.[locale] ?? demandLabels[id]?.[locale] ?? supplierLabels[id]?.[locale] ?? fallback ?? id
}

export function productClassDisplayLabel(id: string, locale: Locale) {
  return productLabels[id]?.[locale] ?? id
}

export function storageClassDisplayLabel(storageClass: StorageClass, locale: Locale) {
  return storageLabels[storageClass][locale]
}

export function candidateOptionLabel(index: number, locale: Locale) {
  const n = index + 1
  if (locale === 'uk') return `Варіант складу ${n}`
  if (locale === 'pl') return `Wariant magazynu ${n}`
  return `Warehouse option ${n}`
}
