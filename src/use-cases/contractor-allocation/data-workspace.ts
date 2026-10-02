import type { ContractorAllocationScenario } from './domain'

export const CONTRACTOR_DATA_SCHEMA_VERSION = 'contractor-allocation.v1' as const

export type ContractorDataPackage = {
  schemaVersion: typeof CONTRACTOR_DATA_SCHEMA_VERSION
  exportedAt: string
  input: ContractorAllocationScenario
  result?: unknown
}

export type ContractorValidationIssue = { path: string; message: string }

export const CONTRACTOR_DATA_DICTIONARY = [
  ['id', 'Stable scenario identifier', 'string', 'required'],
  ['asOf', 'Snapshot time for contract/capacity state', 'ISO datetime', 'required'],
  ['decisionAt', 'Decision time used for temporal validity checks', 'ISO datetime', 'required'],
  ['allocationLevel', 'Atomic allocation unit level', 'enum', 'required'],
  ['units[]', 'Work packages/orders with scope, demand, deadline and technical requirements', 'object[]', 'required'],
  ['contractors[]', 'Eligible contractors, contracts, rates, execution profiles and capacity buckets', 'object[]', 'required'],
  ['trustedAuthorities[]', 'Authoritative sources allowed to contribute decision inputs', 'object[]', 'required'],
] as const

export function validateContractorInput(value: unknown): ContractorValidationIssue[] {
  if (!value || typeof value !== 'object') return [{ path: '$', message: 'Expected an object.' }]
  const input = value as Partial<ContractorAllocationScenario>
  const issues: ContractorValidationIssue[] = []
  if (!input.id?.trim()) issues.push({ path: 'id', message: 'Required non-empty string.' })
  if (!input.asOf || Number.isNaN(Date.parse(input.asOf))) issues.push({ path: 'asOf', message: 'Expected ISO datetime.' })
  if (!input.decisionAt || Number.isNaN(Date.parse(input.decisionAt)))
    issues.push({ path: 'decisionAt', message: 'Expected ISO datetime.' })
  if (!Array.isArray(input.units) || input.units.length === 0) issues.push({ path: 'units', message: 'At least one unit is required.' })
  if (!Array.isArray(input.contractors) || input.contractors.length === 0)
    issues.push({ path: 'contractors', message: 'At least one contractor is required.' })
  if (!Array.isArray(input.trustedAuthorities) || input.trustedAuthorities.length === 0)
    issues.push({ path: 'trustedAuthorities', message: 'At least one trusted authority is required.' })
  if (Array.isArray(input.units)) {
    input.units.forEach((unit, index) => {
      if (!unit.id?.trim()) issues.push({ path: `units[${index}].id`, message: 'Required.' })
      if (!(typeof unit.quantity === 'number') || !Number.isFinite(unit.quantity) || unit.quantity < 0)
        issues.push({ path: `units[${index}].quantity`, message: 'Expected a non-negative number.' })
      if (!unit.executionStart || Number.isNaN(Date.parse(unit.executionStart)))
        issues.push({ path: `units[${index}].executionStart`, message: 'Expected ISO datetime/date.' })
      if (!unit.executionEnd || Number.isNaN(Date.parse(unit.executionEnd)))
        issues.push({ path: `units[${index}].executionEnd`, message: 'Expected ISO datetime/date.' })
    })
  }
  return issues
}

export function contractorExactTemplate(input: ContractorAllocationScenario): ContractorDataPackage {
  return { schemaVersion: CONTRACTOR_DATA_SCHEMA_VERSION, exportedAt: new Date(0).toISOString(), input }
}

export function contractorExportAnalysis(input: ContractorAllocationScenario, result?: unknown): ContractorDataPackage {
  return { schemaVersion: CONTRACTOR_DATA_SCHEMA_VERSION, exportedAt: new Date().toISOString(), input, result }
}

export function importContractorExactPackage(value: unknown): {
  input?: ContractorAllocationScenario
  issues: ContractorValidationIssue[]
} {
  if (!value || typeof value !== 'object') return { issues: [{ path: '$', message: 'Expected JSON object.' }] }
  const candidate = value as Partial<ContractorDataPackage>
  if (candidate.schemaVersion !== CONTRACTOR_DATA_SCHEMA_VERSION)
    return { issues: [{ path: 'schemaVersion', message: `Expected ${CONTRACTOR_DATA_SCHEMA_VERSION}.` }] }
  const issues = validateContractorInput(candidate.input)
  return issues.length ? { issues } : { input: candidate.input as ContractorAllocationScenario, issues: [] }
}

export function downloadContractorJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
