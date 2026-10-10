import { describe, expect, it } from 'vitest'
import { isKernelRRPresentation } from './operator-evidence'

describe('RR evidence comes from the backend plugin, not UI calculations', () => {
  const valid = {
    schema_version: 'readiness-recovery.presentation.v1',
    computation_authority: 'QDIP_KERNEL_RR_V1',
    execution_id: 'rr-001',
    decision_id: 'decision-001',
    authoritative: true,
    actionable: true,
    outcome_kind: 'OPTIMAL_DECISION',
    scheduled_jobs: [{ job_id: 'job-1', technician_id: 'tech-1', start_slot: 0, finish_slot: 1 }],
    selected_donor_ids: [],
  }

  it('only accepts a versioned backend-owned RR presentation', () => {
    expect(isKernelRRPresentation(valid)).toBe(true)
    expect(isKernelRRPresentation({ ...valid, computation_authority: 'OBSERVATORY_SIMULATION' })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, schema_version: 'readiness-recovery.v1' })).toBe(false)
    expect(isKernelRRPresentation({ result: { runtime: { operator_outcome: { actionable: true } } } })).toBe(false)
  })

  it('cannot accidentally display loose or incomplete legacy simulation metrics', () => {
    expect(isKernelRRPresentation(null)).toBe(false)
    expect(isKernelRRPresentation({ ...valid, scheduled_jobs: null })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, actionable: 'yes' })).toBe(false)
  })
})
