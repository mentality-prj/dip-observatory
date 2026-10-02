import { describe, expect, it } from 'vitest'
import { SUPPLY_NETWORK_DEMO } from './demo-data'
import {
  SUPPLY_DATA_SCHEMA_VERSION,
  importSupplyExactPackage,
  supplyExactTemplate,
  supplyExportAnalysis,
  validateSupplyNetwork,
} from './data-workspace'

describe('Supply network analyst data workspace', () => {
  it('round-trips a versioned exact network without inference', () => {
    const imported = importSupplyExactPackage(
      JSON.parse(JSON.stringify(supplyExactTemplate(SUPPLY_NETWORK_DEMO))) as unknown
    )
    expect(imported.issues).toEqual([])
    expect(imported.input).toEqual(SUPPLY_NETWORK_DEMO)
  })

  it('rejects incompatible schema version', () => {
    const imported = importSupplyExactPackage({
      ...supplyExactTemplate(SUPPLY_NETWORK_DEMO),
      schemaVersion: 'other.v2',
    })
    expect(imported.input).toBeUndefined()
    expect(imported.issues[0]?.path).toBe('schemaVersion')
  })

  it('reports invalid warehouse capacity paths', () => {
    const input = structuredClone(SUPPLY_NETWORK_DEMO)
    input.warehouses[0]!.capacity_units = 0
    expect(validateSupplyNetwork(input)).toContainEqual({
      path: 'warehouses[0].capacity_units',
      message: 'Expected a positive number.',
    })
  })

  it('exports schema and exact input with optional result', () => {
    const output = supplyExportAnalysis(SUPPLY_NETWORK_DEMO)
    expect(output.schemaVersion).toBe(SUPPLY_DATA_SCHEMA_VERSION)
    expect(output.input).toEqual(SUPPLY_NETWORK_DEMO)
    expect(output.result).toBeUndefined()
  })
})
