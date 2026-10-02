import { describe, expect, it } from 'vitest'
import { RESOURCE_ALLOCATION_PROFILES } from './demo-data'
import {
  importResourceAllocationExactPackage,
  RESOURCE_ALLOCATION_DATA_VERSION,
  resourceAllocationExactTemplate,
  validateResourceAllocationInput,
} from './data-workspace'

describe('resource allocation exact data contract', () => {
  it('round-trips a normalized input without inference', () => {
    const input = RESOURCE_ALLOCATION_PROFILES['responsible-citizens'].input
    const imported = importResourceAllocationExactPackage(
      JSON.parse(JSON.stringify(resourceAllocationExactTemplate(input)))
    )
    expect(imported.issues).toEqual([])
    expect(imported.input).toEqual(input)
  })

  it('rejects wrong schema versions', () => {
    const input = RESOURCE_ALLOCATION_PROFILES['responsible-citizens'].input
    const imported = importResourceAllocationExactPackage({
      ...resourceAllocationExactTemplate(input),
      schemaVersion: 'other.v1',
    })
    expect(imported.input).toBeUndefined()
    expect(imported.issues[0]?.path).toBe('schemaVersion')
  })

  it('rejects invalid team capacity', () => {
    const input = structuredClone(RESOURCE_ALLOCATION_PROFILES['responsible-citizens'].input)
    input.teams[0]!.capacity = -1
    expect(validateResourceAllocationInput(input)).toContainEqual({
      path: 'teams[0].capacity',
      message: 'Expected a non-negative number.',
    })
    expect(RESOURCE_ALLOCATION_DATA_VERSION).toBe('resource-allocation.v1')
  })
})
