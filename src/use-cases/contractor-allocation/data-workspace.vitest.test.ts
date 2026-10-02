import { describe, expect, it } from 'vitest'
import { buildContractorAllocationDemoScenario } from './demo-data'
import {
  CONTRACTOR_DATA_SCHEMA_VERSION,
  contractorExactTemplate,
  contractorExportAnalysis,
  importContractorExactPackage,
  validateContractorInput,
} from './data-workspace'

describe('Contractor allocation analyst data workspace', () => {
  it('round-trips a versioned exact scenario without inference', () => {
    const input = buildContractorAllocationDemoScenario('CAPACITY_CONSTRAINED')
    const imported = importContractorExactPackage(JSON.parse(JSON.stringify(contractorExactTemplate(input))) as unknown)
    expect(imported.issues).toEqual([])
    expect(imported.input).toEqual(input)
  })

  it('rejects invalid version', () => {
    const input = buildContractorAllocationDemoScenario('CAPACITY_CONSTRAINED')
    const imported = importContractorExactPackage({ ...contractorExactTemplate(input), schemaVersion: 'other.v1' })
    expect(imported.input).toBeUndefined()
    expect(imported.issues[0]?.path).toBe('schemaVersion')
  })

  it('reports malformed unit data', () => {
    const input = buildContractorAllocationDemoScenario('CAPACITY_CONSTRAINED')
    input.units[0]!.quantity = -1
    expect(validateContractorInput(input)).toContainEqual({
      path: 'units[0].quantity',
      message: 'Expected a non-negative number.',
    })
  })

  it('exports exact input independently of result availability', () => {
    const input = buildContractorAllocationDemoScenario('CAPACITY_CONSTRAINED')
    const output = contractorExportAnalysis(input)
    expect(output.schemaVersion).toBe(CONTRACTOR_DATA_SCHEMA_VERSION)
    expect(output.input).toEqual(input)
    expect(output.result).toBeUndefined()
  })
})
