import { describe, expect, it } from 'vitest'
import { decisionChallengeI18n, decisionChallengeMetadataI18n } from './i18n'

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
  for (const resources of [decisionChallengeI18n, decisionChallengeMetadataI18n]) {
    it('keeps EN/UK/PL resource shapes aligned and string-only', () => {
      expect(deepKeys(resources.uk)).toEqual(deepKeys(resources.en))
      expect(deepKeys(resources.pl)).toEqual(deepKeys(resources.en))
      assertStringLeaves(resources.en)
      assertStringLeaves(resources.uk)
      assertStringLeaves(resources.pl)
    })
  }
})
