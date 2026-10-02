import type { ResourceAllocationInput, ResourceAllocationResult } from './contracts'

export const RESOURCE_ALLOCATION_DATA_VERSION = 'resource-allocation.v1' as const

export type ResourceAllocationDataPackage = {
  schemaVersion: typeof RESOURCE_ALLOCATION_DATA_VERSION
  exportedAt: string
  input: ResourceAllocationInput
  result?: ResourceAllocationResult
}

export type ResourceAllocationDataIssue = { path: string; message: string }

export const RESOURCE_ALLOCATION_DATA_DICTIONARY = [
  ['communities[]', 'Demand locations and service requirements', 'object[]', 'required'],
  ['teams[]', 'Available teams, skills and capacity', 'object[]', 'required'],
  ['travel_edges[]', 'Travel time/cost between locations', 'object[]', 'optional'],
  ['planning_period.days[]', 'Planning horizon', 'date[]', 'optional'],
  ['current_allocation', 'Observed/current team placement used for comparison', 'map', 'optional'],
  ['baseline_plan', 'Explicit baseline plan for evidence comparison', 'map', 'optional'],
  ['budget', 'Maximum operating budget', 'number', 'optional'],
] as const

export function validateResourceAllocationInput(value: unknown): ResourceAllocationDataIssue[] {
  if (!value || typeof value !== 'object') return [{ path: '$', message: 'Expected an object.' }]
  const input = value as Partial<ResourceAllocationInput>
  const issues: ResourceAllocationDataIssue[] = []
  if (!Array.isArray(input.communities) || input.communities.length === 0)
    issues.push({ path: 'communities', message: 'At least one community is required.' })
  if (!Array.isArray(input.teams) || input.teams.length === 0)
    issues.push({ path: 'teams', message: 'At least one team is required.' })
  input.communities?.forEach((community, index) => {
    if (!community.id?.trim()) issues.push({ path: `communities[${index}].id`, message: 'Required.' })
    if (!Array.isArray(community.demand))
      issues.push({ path: `communities[${index}].demand`, message: 'Expected an array.' })
  })
  input.teams?.forEach((team, index) => {
    if (!team.id?.trim()) issues.push({ path: `teams[${index}].id`, message: 'Required.' })
    if (!Array.isArray(team.skills)) issues.push({ path: `teams[${index}].skills`, message: 'Expected an array.' })
    if (typeof team.capacity !== 'number' || !Number.isFinite(team.capacity) || team.capacity < 0)
      issues.push({ path: `teams[${index}].capacity`, message: 'Expected a non-negative number.' })
  })
  return issues
}

export function resourceAllocationExactTemplate(input: ResourceAllocationInput): ResourceAllocationDataPackage {
  return { schemaVersion: RESOURCE_ALLOCATION_DATA_VERSION, exportedAt: new Date(0).toISOString(), input }
}

export function resourceAllocationExportAnalysis(
  input: ResourceAllocationInput,
  result?: ResourceAllocationResult
): ResourceAllocationDataPackage {
  return { schemaVersion: RESOURCE_ALLOCATION_DATA_VERSION, exportedAt: new Date().toISOString(), input, result }
}

export function importResourceAllocationExactPackage(value: unknown): {
  input?: ResourceAllocationInput
  issues: ResourceAllocationDataIssue[]
} {
  if (!value || typeof value !== 'object') return { issues: [{ path: '$', message: 'Expected JSON object.' }] }
  const candidate = value as Partial<ResourceAllocationDataPackage>
  if (candidate.schemaVersion !== RESOURCE_ALLOCATION_DATA_VERSION)
    return { issues: [{ path: 'schemaVersion', message: `Expected ${RESOURCE_ALLOCATION_DATA_VERSION}.` }] }
  const issues = validateResourceAllocationInput(candidate.input)
  return issues.length ? { issues } : { input: candidate.input as ResourceAllocationInput, issues: [] }
}

export function downloadResourceAllocationJson(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
