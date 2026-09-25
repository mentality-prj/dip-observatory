import { describe, expect, it } from 'vitest'
import {
  resourceAllocationDecisionPanelI18n,
  resourceAllocationExplanationI18n,
  resourceAllocationExtraI18n,
  resourceAllocationImpactI18n,
  resourceAllocationImportI18n,
  resourceAllocationManualEditorI18n,
  resourceAllocationNetworkI18n,
  resourceAllocationWorkspaceI18n,
} from './i18n'

function deepKeys(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      deepKeys(item, `${prefix}[${index}]`),
    ).sort()
  }
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value)
    .flatMap(([key, child]) =>
      deepKeys(child, prefix ? `${prefix}.${key}` : key),
    )
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

describe('Resource Allocation i18n contract', () => {
  for (const resources of [
    resourceAllocationWorkspaceI18n,
    resourceAllocationDecisionPanelI18n,
    resourceAllocationManualEditorI18n,
    resourceAllocationImpactI18n,
    resourceAllocationExplanationI18n,
    resourceAllocationImportI18n,
    resourceAllocationNetworkI18n,
    resourceAllocationExtraI18n,
  ]) {
    it('keeps EN/UK/PL resource shapes aligned and string-only', () => {
      expect(deepKeys(resources.uk)).toEqual(deepKeys(resources.en))
      expect(deepKeys(resources.pl)).toEqual(deepKeys(resources.en))
      assertStringLeaves(resources.en)
      assertStringLeaves(resources.uk)
      assertStringLeaves(resources.pl)
    })
  }
})
