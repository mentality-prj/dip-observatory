import { describe, expect, it } from 'vitest'
import { kernelRequestPreflight, kernelReplanPreflight } from './operator-preflight'
const payload = {
  execution_id: 'rr-001',
  source: { snapshot_id: 'snapshot-001', captured_at: '2026-10-10T00:00:00Z' },
  ingested_at: '2026-10-10T00:00:10Z',
  payload: { decision_id: 'decision-001', jobs: [{ job_id: 'job-1' }], technicians: [{ technician_id: 'tech-1' }] },
}
describe('normalized Kernel-only operator preflight', () => {
  it('shows only supplied counts and source snapshot, without guessing other fields', () => {
    expect(kernelRequestPreflight(JSON.stringify(payload))).toEqual({
      valid: true,
      reason: null,
      executionId: 'rr-001',
      decisionId: 'decision-001',
      snapshotId: 'snapshot-001',
      jobCount: 1,
      technicianCount: 1,
    })
  })
  it('fails closed for old synthetic frontend RR schema and invalid JSON', () => {
    expect(kernelRequestPreflight('{broken').valid).toBe(false)
    expect(kernelRequestPreflight(JSON.stringify({ scenarioId: 'old', frontier: [] })).valid).toBe(false)
    expect(kernelRequestPreflight('{}').valid).toBe(false)
  })
  it('requires replan revision metadata and a valid successor ID', () => {
    const valid = {
      ...payload,
      execution_id: 'rr-002',
      change_id: 'change-1',
      reason: 'Change after new observation',
      requested_at: '2026-10-10T00:00:11Z',
      kind: 'OVERRIDE',
    }
    expect(kernelReplanPreflight(JSON.stringify(valid))).toBe(true)
    expect(kernelReplanPreflight(JSON.stringify({ ...valid, kind: 'SIMULATION' }))).toBe(false)
    expect(kernelReplanPreflight(JSON.stringify({ ...valid, execution_id: '../bad' }))).toBe(false)
  })
})
