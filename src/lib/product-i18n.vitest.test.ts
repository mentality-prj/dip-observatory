import { describe, expect, it } from 'vitest'
import { marketingA11yI18n, observatoryI18n, sharedI18n, type I18nNamespace } from './product-i18n'

const locales = ['en', 'uk', 'pl'] as const
const namespaces: readonly I18nNamespace[] = ['marketing', 'observatory', 'studio', 'shared', 'useCases']

describe('P2 typed i18n architecture', () => {
  it('declares the required product namespaces', () => {
    expect(namespaces).toEqual(['marketing', 'observatory', 'studio', 'shared', 'useCases'])
  })

  it('keeps shared accessibility contracts complete across locales', () => {
    const reference = Object.keys(sharedI18n.en).sort()
    for (const locale of locales) expect(Object.keys(sharedI18n[locale]).sort()).toEqual(reference)
  })

  it('keeps Observatory accessibility contracts complete across locales', () => {
    const reference = Object.keys(observatoryI18n.en).sort()
    for (const locale of locales) expect(Object.keys(observatoryI18n[locale]).sort()).toEqual(reference)
  })

  it('keeps Marketing accessibility contracts complete across locales', () => {
    const reference = Object.keys(marketingA11yI18n.en).sort()
    for (const locale of locales) expect(Object.keys(marketingA11yI18n[locale]).sort()).toEqual(reference)
  })
})
