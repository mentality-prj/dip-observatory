import { describe, expect, it } from 'vitest'
import { SUPPORTED_LOCALES } from '@/i18n/config'
import { getDecisionChallengeI18n, getDecisionChallengeMetadataI18n } from './i18n'

function deepKeys(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => deepKeys(item, `${prefix}[${index}]`)).sort()
  }
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value)
    .flatMap(([key, child]) => deepKeys(child, prefix ? `${prefix}.${key}` : key))
    .sort()
}

function assertStringLeaves(value: unknown): void {
  if (typeof value === 'string') return
  if (Array.isArray(value)) {
    value.forEach(assertStringLeaves)
    return
  }
  if (typeof value !== 'object' || value === null) {
    throw new Error(`i18n leaf must be a string, got ${typeof value}`)
  }
  Object.values(value).forEach(assertStringLeaves)
}

describe('Decision Challenge i18n contract', () => {
  for (const [name, load] of [
    ['messages', getDecisionChallengeI18n],
    ['metadata', getDecisionChallengeMetadataI18n],
  ] as const) {
    it(`keeps EN/UK/PL ${name} shapes aligned and string-only`, () => {
      const resources = Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, load(locale)])) as Record<
        (typeof SUPPORTED_LOCALES)[number],
        unknown
      >

      expect(deepKeys(resources.uk)).toEqual(deepKeys(resources.en))
      expect(deepKeys(resources.pl)).toEqual(deepKeys(resources.en))
      assertStringLeaves(resources.en)
      assertStringLeaves(resources.uk)
      assertStringLeaves(resources.pl)
    })
  }
})
