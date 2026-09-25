import { describe, expect, it } from 'vitest'
import {
  localeLabels,
  observatoryDecisionNarrativeI18n,
  observatoryHomeI18n,
  observatoryI18n,
  sharedI18n,
} from './product-i18n'
import { SUPPORTED_LOCALES } from './observatory-i18n'

function deepKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value)
    .flatMap(([key, child]) => deepKeys(child, prefix ? `${prefix}.${key}` : key))
    .sort()
}

function assertStringLeaves(value: unknown): void {
  if (typeof value === 'string') return
  if (typeof value !== 'object' || value === null) {
    throw new Error(`i18n leaf must be a string, got ${typeof value}`)
  }
  for (const child of Object.values(value)) assertStringLeaves(child)
}

describe('Observatory product i18n contract', () => {
  it('keeps all supported locale labels defined', () => {
    expect(Object.keys(localeLabels).sort()).toEqual([...SUPPORTED_LOCALES].sort())
  })

  for (const resources of [sharedI18n, observatoryI18n, observatoryHomeI18n, observatoryDecisionNarrativeI18n]) {
    it('keeps locale message shapes aligned and string-only', () => {
      expect(deepKeys(resources.uk)).toEqual(deepKeys(resources.en))
      expect(deepKeys(resources.pl)).toEqual(deepKeys(resources.en))
      assertStringLeaves(resources.en)
      assertStringLeaves(resources.uk)
      assertStringLeaves(resources.pl)
    })
  }
})
