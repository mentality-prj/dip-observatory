import { describe, expect, it } from 'vitest'
import { marketingCopy } from '@/components/marketing/qdip-copy'
import { observatoryHomeCopy } from '@/components/observatory/observatory-home'
import { DECISION_PATTERN_LABELS, PRODUCT_SURFACE_COPY } from '@/product/experience'
import { PUBLIC_DEMO_NAMES } from '@/product/public-product-policy'
import { studioCopy } from '@/studio/studio-copy'
import { DIP_USE_CASES } from '@/use-cases/registry'

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(collectStrings)
  }
  return []
}

describe('public product naming policy', () => {
  it('keeps canonical demo names unchanged across locales', () => {
    const expected = {
      'resource-allocation': PUBLIC_DEMO_NAMES.resourceAllocation,
      'supply-network-resilience': PUBLIC_DEMO_NAMES.supplyNetworkResilience,
      'gtm-lab': PUBLIC_DEMO_NAMES.gtmLab,
    } as const

    for (const useCase of DIP_USE_CASES) {
      const canonical = expected[useCase.id as keyof typeof expected]
      expect(useCase.title.en).toBe(canonical)
      expect(useCase.title.uk).toBe(canonical)
      expect(useCase.title.pl).toBe(canonical)
    }
  })

  it('keeps marketing application titles canonical', () => {
    const titleIndexes = [
      [2, PUBLIC_DEMO_NAMES.resourceAllocation],
      [12, PUBLIC_DEMO_NAMES.gtmLab],
    ] as const

    for (const locale of ['en', 'uk', 'pl'] as const) {
      for (const [index, expected] of titleIndexes) {
        expect(marketingCopy[locale].cases[index]).toBe(expected)
      }
    }
  })
})

describe('retired public demos', () => {
  it('keeps Gas Forecast out of the public use-case registry', () => {
    expect(DIP_USE_CASES.some((useCase) => useCase.id === 'gas-forecast')).toBe(false)
    expect(DIP_USE_CASES.some((useCase) => useCase.route === '/gas-forecast')).toBe(false)
  })
})

describe('localized Studio terminology policy', () => {
  const forbiddenEnglishUiTerms = [
    /\bdimensions?\b/i,
    /\bruntime\b/i,
    /\bscore\b/i,
    /\bframeworks?\b/i,
    /\bevaluators?\b/i,
    /\bbaseline\b/i,
    /\bproduction\b/i,
    /\bplugin\b/i,
    /\bapplication view\b/i,
    /\bresearch\b/i,
    /\breplay\b/i,
    /\btrace\b/i,
  ]

  for (const locale of ['uk', 'pl'] as const) {
    it(`${locale} does not mix ordinary English UI terminology into localized copy`, () => {
      const values = collectStrings(studioCopy(locale))
      const violations = values.filter((value) =>
        forbiddenEnglishUiTerms.some((pattern) => pattern.test(value))
      )
      expect(violations).toEqual([])
    })
  }
})


describe('localized Observatory terminology policy', () => {
  const forbiddenEnglishUiTerms = [
    /\bpreview\b/i,
    /\boverride\b/i,
    /\btrace\b/i,
    /\bdecision applications?\b/i,
    /\bdecision demos?\b/i,
    /\bgo-to-market\b/i,
    /\ballocate\b/i,
    /\bdecide\b/i,
    /\bprioritize\b/i,
  ]

  for (const locale of ['uk', 'pl'] as const) {
    it(`${locale} does not mix ordinary English UI terminology into Observatory copy`, () => {
      const values = collectStrings([
        observatoryHomeCopy[locale],
        PRODUCT_SURFACE_COPY[locale],
        Object.values(DECISION_PATTERN_LABELS).map((labels) => labels[locale]),
        DIP_USE_CASES.map((useCase) => ({
          description: useCase.description[locale],
          tag: useCase.tag[locale],
        })),
      ])
      const violations = values.filter((value) =>
        forbiddenEnglishUiTerms.some((pattern) => pattern.test(value))
      )
      expect(violations).toEqual([])
    })
  }
})
