import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { canCompareRRExecutions, RRExecutionComparison } from './operator-comparison'
import type { KernelRRPresentation } from './operator-evidence'

const previous: KernelRRPresentation = {
  schema_version: 'readiness-recovery.presentation.v1',
  computation_authority: 'QDIP_KERNEL_RR_V1',
  execution_id: 'rr-001',
  decision_id: 'decision-001',
  source_system: 'workshop',
  source_snapshot_id: 'before',
  source_version: 'v1',
  payload_digest: 'a'.repeat(64),
  change_kind: 'INITIAL',
  predecessor_execution_id: null,
  outcome_kind: 'OPTIMAL_DECISION',
  backend_status: 'OPTIMAL',
  authoritative: true,
  actionable: true,
  summary: 'Model output',
  scheduled_jobs: [{ job_id: 'job-1', technician_id: 'tech-1', start_slot: 0, finish_slot: 1 }],
  selected_donor_ids: [],
  scheduled_job_count: 1,
  job_count: 1,
  technician_count: 1,
  probability_demand_satisfied: null,
  probability_confidence_interval: null,
  field_verified: false,
}
const current: KernelRRPresentation = {
  ...previous,
  execution_id: 'rr-002',
  predecessor_execution_id: 'rr-001',
  source_snapshot_id: 'after',
  payload_digest: 'b'.repeat(64),
  change_kind: 'REPLAN',
  scheduled_jobs: [],
  scheduled_job_count: 0,
  actionable: false,
}

describe('Kernel RR comparison is descriptive and lineage bound', () => {
  it('compares only an intact direct successor under the same authority and source', () => {
    expect(canCompareRRExecutions(previous, current)).toBe(true)
    expect(canCompareRRExecutions(previous, { ...current, decision_id: 'other' })).toBe(false)
    expect(canCompareRRExecutions(previous, { ...current, predecessor_execution_id: 'old' })).toBe(false)
    expect(canCompareRRExecutions(previous, { ...current, source_system: 'other' })).toBe(false)
    expect(canCompareRRExecutions(previous, { ...current, source_version: 'v2' })).toBe(false)
    expect(canCompareRRExecutions(previous, { ...current, field_verified: true })).toBe(false)
    expect(canCompareRRExecutions({ ...previous, authoritative: false }, current)).toBe(false)
    expect(canCompareRRExecutions({ ...previous, computation_authority: 'SIMULATION' }, current)).toBe(false)
    expect(canCompareRRExecutions(null, current)).toBe(false)
  })

  it('does not claim economic or optimizer advantage or infer missing uncertainty', () => {
    const html = renderToStaticMarkup(
      <RRExecutionComparison locale="uk" previous={previous} current={current} />
    )
    expect(html).toContain('data-testid="rr-execution-comparison"')
    expect(html).toContain('Порівняння двох виконань')
    expect(html).toContain('rr-001')
    expect(html).toContain('rr-002')
    expect(html).toContain('baseline')
    expect(html).toContain('не встановлено')
    expect(html).not.toContain('99%')
    const invalid = renderToStaticMarkup(
      <RRExecutionComparison locale="en" previous={previous} current={{ ...current, decision_id: 'foreign' }} />
    )
    expect(invalid).toBe('')
  })
})
