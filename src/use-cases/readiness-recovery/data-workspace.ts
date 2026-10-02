import type { ReadinessRecoveryInput, ReadinessRecoveryResult } from './domain'

export const READINESS_DATA_SCHEMA_VERSION = 'readiness-recovery.v1' as const

export type ScenarioContext = {
  situation: string
  decisionQuestion: string
  dataSummary: string[]
  constraints: string[]
  uncertainty: string[]
  testPurpose: string
}

export type ReadinessDataPackage = {
  schemaVersion: typeof READINESS_DATA_SCHEMA_VERSION
  exportedAt: string
  input: ReadinessRecoveryInput
  result?: ReadinessRecoveryResult
}

export type ValidationIssue = { path: string; message: string }

export const READINESS_DATA_DICTIONARY = [
  ['scenarioId', 'Stable analysis/scenario identifier', 'string', 'required'],
  ['asOf', 'Time at which fleet state is observed', 'ISO datetime', 'required'],
  ['capabilityDemand[]', 'Capability quantity required by its deadline', 'object[]', 'required'],
  ['assets[]', 'Fleet assets, state, reliability and capability contribution', 'object[]', 'required'],
  ['recoveryActions[]', 'Candidate repairs/replacements with resources and uncertainty', 'object[]', 'required'],
  ['resources', 'Technician, workshop, parts and replacement capacity', 'object', 'required'],
  ['settings.seed', 'Random seed used for reproducible uncertainty evaluation', 'integer', 'required'],
] as const

function finite(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
}

export function validateReadinessInput(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!value || typeof value !== 'object') return [{ path: '$', message: 'Expected an object.' }]
  const input = value as Partial<ReadinessRecoveryInput>
  if (!input.scenarioId?.trim()) issues.push({ path: 'scenarioId', message: 'Required non-empty string.' })
  if (!input.asOf || Number.isNaN(Date.parse(input.asOf)))
    issues.push({ path: 'asOf', message: 'Expected ISO datetime.' })
  if (!Array.isArray(input.capabilityDemand) || input.capabilityDemand.length === 0) {
    issues.push({ path: 'capabilityDemand', message: 'At least one capability demand is required.' })
  } else {
    input.capabilityDemand.forEach((demand, index) => {
      if (!demand.capabilityId?.trim())
        issues.push({ path: `capabilityDemand[${index}].capabilityId`, message: 'Required.' })
      if (!finite(demand.requiredQuantity) || demand.requiredQuantity < 0)
        issues.push({ path: `capabilityDemand[${index}].requiredQuantity`, message: 'Expected a non-negative number.' })
      if (!demand.deadline || Number.isNaN(Date.parse(demand.deadline)))
        issues.push({ path: `capabilityDemand[${index}].deadline`, message: 'Expected ISO datetime.' })
    })
  }
  if (!Array.isArray(input.assets)) issues.push({ path: 'assets', message: 'Expected an array.' })
  if (!Array.isArray(input.recoveryActions)) issues.push({ path: 'recoveryActions', message: 'Expected an array.' })
  if (!input.resources || typeof input.resources !== 'object')
    issues.push({ path: 'resources', message: 'Required object.' })
  if (!input.settings || typeof input.settings !== 'object')
    issues.push({ path: 'settings', message: 'Required object.' })
  return issues
}

export function exactTemplate(input: ReadinessRecoveryInput): ReadinessDataPackage {
  return { schemaVersion: READINESS_DATA_SCHEMA_VERSION, exportedAt: new Date(0).toISOString(), input }
}

export function exportAnalysis(input: ReadinessRecoveryInput, result?: ReadinessRecoveryResult): ReadinessDataPackage {
  return { schemaVersion: READINESS_DATA_SCHEMA_VERSION, exportedAt: new Date().toISOString(), input, result }
}

export function importExactPackage(value: unknown): { input?: ReadinessRecoveryInput; issues: ValidationIssue[] } {
  if (!value || typeof value !== 'object') return { issues: [{ path: '$', message: 'Expected JSON object.' }] }
  const candidate = value as Partial<ReadinessDataPackage>
  if (candidate.schemaVersion !== READINESS_DATA_SCHEMA_VERSION)
    return { issues: [{ path: 'schemaVersion', message: `Expected ${READINESS_DATA_SCHEMA_VERSION}.` }] }
  const issues = validateReadinessInput(candidate.input)
  return issues.length ? { issues } : { input: candidate.input as ReadinessRecoveryInput, issues: [] }
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
