import { parseKernelRequestFile } from './operator-guards'

export type KernelPreflight = {
  valid: boolean
  reason: string | null
  executionId: string | null
  decisionId: string | null
  snapshotId: string | null
  jobCount: number | null
  technicianCount: number | null
}
const object = (x: unknown): x is Record<string, unknown> => Boolean(x) && typeof x === 'object' && !Array.isArray(x)
const safe = (x: unknown) => (typeof x === 'string' && x.trim() ? x : null)
export function kernelRequestPreflight(text: string): KernelPreflight {
  const negative = (reason: string): KernelPreflight => ({
    valid: false,
    reason,
    executionId: null,
    decisionId: null,
    snapshotId: null,
    jobCount: null,
    technicianCount: null,
  })
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    return negative('Malformed JSON')
  }
  try {
    const req = parseKernelRequestFile(parsed)
    const source = object(req.source) ? req.source : null
    const body = object(req.payload) ? req.payload : null
    const jobs = body?.jobs,
      technicians = body?.technicians
    return {
      valid: true,
      reason: null,
      executionId: req.execution_id,
      decisionId: safe(body?.decision_id),
      snapshotId: safe(source?.snapshot_id),
      jobCount: Array.isArray(jobs) ? jobs.length : null,
      technicianCount: Array.isArray(technicians) ? technicians.length : null,
    }
  } catch (error) {
    return negative(error instanceof Error ? error.message : 'Invalid Kernel RR request')
  }
}
export function kernelReplanPreflight(text: string): boolean {
  try {
    const value: unknown = JSON.parse(text)
    if (!object(value)) return false
    return (
      typeof value.execution_id === 'string' &&
      /^[a-zA-Z0-9][\w.-]{0,127}$/.test(value.execution_id) &&
      typeof value.change_id === 'string' &&
      value.change_id.length > 0 &&
      typeof value.reason === 'string' &&
      value.reason.trim().length > 0 &&
      typeof value.kind === 'string' &&
      ['CHANGE', 'OVERRIDE', 'REPLAN'].includes(value.kind) &&
      object(value.source) &&
      object(value.payload) &&
      typeof value.requested_at === 'string' &&
      Number.isFinite(Date.parse(value.requested_at)) &&
      typeof value.ingested_at === 'string' &&
      Number.isFinite(Date.parse(value.ingested_at))
    )
  } catch {
    return false
  }
}
