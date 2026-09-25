import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { getSupplyNetworkI18n } from './index'

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
  for (const namespace of ['workspace', 'summary', 'map', 'entities', 'constraints'] as const) {
    it(`keeps ${namespace} locale resource shapes aligned and string-only`, () => {
      const en = getSupplyNetworkI18n('en')[namespace]
      const uk = getSupplyNetworkI18n('uk')[namespace]
      const pl = getSupplyNetworkI18n('pl')[namespace]

      expect(deepKeys(uk)).toEqual(deepKeys(en))
      expect(deepKeys(pl)).toEqual(deepKeys(en))
      assertStringLeaves(en)
      assertStringLeaves(uk)
      assertStringLeaves(pl)
    })
  }

  it('keeps translations out of Observatory render components', () => {
    const componentDirectories = [
      new URL('../', import.meta.url),
      new URL('../../../components/observatory/', import.meta.url),
    ]

    const sourceFiles = componentDirectories.flatMap((directory) =>
      readdirSync(fileURLToPath(directory), { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isFile() &&
            entry.name.endsWith('.tsx') &&
            !entry.name.includes('.test.') &&
            !entry.name.includes('.spec.')
        )
        .map((entry) => new URL(entry.name, directory))
    )

    for (const file of sourceFiles) {
      const source = readFileSync(file, 'utf8')
      expect(source, file.pathname).not.toContain('const copy =')
      expect(source, file.pathname).not.toContain("locale === 'uk'")
      expect(source, file.pathname).not.toContain("locale === 'pl'")
      expect(source, file.pathname).not.toMatch(/[\u0400-\u04FF]/)
      expect(source, file.pathname).not.toMatch(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/)
      expect(source, file.pathname).not.toMatch(/\b(?:en|uk|pl)\s*:/)
      expect(source, file.pathname).not.toContain('Record<Locale')
    }
  })
})
