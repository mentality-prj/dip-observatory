import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  supplyNetworkConstraintMessages,
  supplyNetworkEntityMessages,
  supplyNetworkMapMessages,
  supplyNetworkSummaryMessages,
  supplyNetworkWorkspaceMessages,
} from './messages'

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

describe('Supply Network i18n contract', () => {
  for (const resources of [
    supplyNetworkWorkspaceMessages,
    supplyNetworkSummaryMessages,
    supplyNetworkMapMessages,
    supplyNetworkEntityMessages,
    supplyNetworkConstraintMessages,
  ]) {
    it('keeps locale resource shapes aligned and string-only', () => {
      expect(deepKeys(resources.uk)).toEqual(deepKeys(resources.en))
      expect(deepKeys(resources.pl)).toEqual(deepKeys(resources.en))
      assertStringLeaves(resources.en)
      assertStringLeaves(resources.uk)
      assertStringLeaves(resources.pl)
    })
  }

  it('keeps translations out of render components', () => {
    const sources = [
      new URL('../workspace.tsx', import.meta.url),
      new URL('../network-map.tsx', import.meta.url),
      new URL('../executive-decision-summary.tsx', import.meta.url),
      new URL('../../../components/observatory/prototype-shell.tsx', import.meta.url),
      new URL('../../../components/observatory/observatory-home.tsx', import.meta.url),
      new URL('../../../components/observatory/decision-narrative.tsx', import.meta.url),
    ].map((url) => readFileSync(url, 'utf8'))

    for (const source of sources) {
      expect(source).not.toContain('const copy =')
      expect(source).not.toContain("locale === 'uk'")
      expect(source).not.toContain("locale === 'pl'")
      expect(source).not.toMatch(/[\u0400-\u04FF]/)
    }
  })
})
