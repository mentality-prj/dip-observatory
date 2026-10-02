import { describe, expect, it } from 'vitest'
import { buildReadinessRecoveryDemo } from './demo-data'
import {
  exactTemplate,
  exportAnalysis,
  importExactPackage,
  READINESS_DATA_SCHEMA_VERSION,
  validateReadinessInput,
} from './data-workspace'

describe('Readiness scenario data workspace', () => {
  it('round-trips an exact versioned input without inference', () => {
    const input = buildReadinessRecoveryDemo('BALANCED')
    const serialized = JSON.parse(JSON.stringify(exactTemplate(input))) as unknown
    const imported = importExactPackage(serialized)
    expect(imported.issues).toEqual([])
    expect(imported.input).toEqual(input)
  })

  it('rejects an incompatible schema version', () => {
    const input = buildReadinessRecoveryDemo('BALANCED')
    const imported = importExactPackage({ ...exactTemplate(input), schemaVersion: 'other.v9' })
    expect(imported.input).toBeUndefined()
    expect(imported.issues[0]?.path).toBe('schemaVersion')
  })

  it('reports semantic validation paths instead of accepting malformed input', () => {
    const input = buildReadinessRecoveryDemo('BALANCED')
    input.capabilityDemand[0]!.requiredQuantity = -1
    expect(validateReadinessInput(input)).toContainEqual({
      path: 'capabilityDemand[0].requiredQuantity',
      message: 'Expected a non-negative number.',
    })
  })

  it('exports schema, input and optional analysis result separately from parser inference', () => {
    const input = buildReadinessRecoveryDemo('BALANCED')
    const output = exportAnalysis(input)
    expect(output.schemaVersion).toBe(READINESS_DATA_SCHEMA_VERSION)
    expect(output.input).toEqual(input)
    expect(output.result).toBeUndefined()
  })
})
