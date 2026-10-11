import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { isKernelRRPresentation, OperatorEvidence } from './operator-evidence'

describe('RR evidence comes from the backend plugin, not UI calculations', () => {
  const valid = {
    schema_version: 'readiness-recovery.presentation.v1',
    computation_authority: 'QDIP_KERNEL_RR_V1',
    execution_id: 'rr-001',
    decision_id: 'decision-001',
    source_system: 'rr-civilian-workshop-example',
    source_snapshot_id: 'invented-snapshot-001',
    source_version: 'v1',
    payload_digest: 'a'.repeat(64),
    change_kind: 'INITIAL',
    predecessor_execution_id: null,
    outcome_kind: 'OPTIMAL_DECISION',
    backend_status: 'OPTIMAL',
    authoritative: true,
    actionable: true,
    summary: 'All scheduled jobs satisfy the model constraints.',
    scheduled_jobs: [{ job_id: 'job-1', technician_id: 'tech-1', start_slot: 0, finish_slot: 1 }],
    selected_donor_ids: [],
    scheduled_job_count: 1,
    job_count: 1,
    technician_count: 1,
    probability_demand_satisfied: null,
    probability_confidence_interval: null,
    field_verified: false,
  }

  it('only accepts an intact versioned backend-owned RR projection', () => {
    expect(isKernelRRPresentation(valid)).toBe(true)
    expect(isKernelRRPresentation({ ...valid, computation_authority: 'OBSERVATORY_SIMULATION' })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, schema_version: 'readiness-recovery.v1' })).toBe(false)
    expect(isKernelRRPresentation({ result: { runtime: { operator_outcome: { actionable: true } } } })).toBe(false)
  })

  it('rejects malformed or spoofed evidence without calculating domain outcomes', () => {
    expect(isKernelRRPresentation(null)).toBe(false)
    expect(isKernelRRPresentation({ ...valid, scheduled_jobs: null })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, scheduled_jobs: [null] })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, scheduled_jobs: [{ job_id: 'j' }] })).toBe(false)
    expect(
      isKernelRRPresentation({ ...valid, scheduled_jobs: [{ ...valid.scheduled_jobs[0], start_slot: '0' }] })
    ).toBe(false)
    expect(isKernelRRPresentation({ ...valid, selected_donor_ids: [true] })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, actionable: 'yes' })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, payload_digest: 'tampered' })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, scheduled_job_count: -1 })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, job_count: 0 })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, scheduled_job_count: 2 })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, probability_demand_satisfied: 0.99 })).toBe(false)
    expect(isKernelRRPresentation({ ...valid, field_verified: true })).toBe(false)
  })

  it('filters display-only metric cards, never provenance, schedule or Kernel decision', () => {
    if (!isKernelRRPresentation(valid)) throw new Error('Test fixture must be valid')
    const html = renderToStaticMarkup(
      <OperatorEvidence locale="uk" record={valid} visibleMetrics={['TECHNICIANS']} />
    )
    expect(html).toContain('Доступні спеціалісти')
    expect(html).not.toContain('Роботи у вхідних даних')
    expect(html).not.toContain('Вибрані донори')
    expect(html).toContain('rr-civilian-workshop-example')
    expect(html).toContain('data-testid="rr-kernel-schedule"')
    expect(html).toContain('job-1')
    expect(html).toContain('не доведені')
  })

  it('presents a readable schedule and keeps raw provenance optional', () => {
    if (!isKernelRRPresentation(valid)) throw new Error('Test fixture must be valid')
    const html = renderToStaticMarkup(<OperatorEvidence locale="uk" record={valid} />)
    expect(html).toContain('data-testid="rr-kernel-evidence"')
    expect(html).toContain('data-testid="rr-kernel-schedule"')
    expect(html).toContain('job-1')
    expect(html).toContain('tech-1')
    expect(html).toContain('<details')
    expect(html).toContain('Показати технічне походження')
    expect(html).toContain('data-testid="rr-metric-provenance"')
    expect(html).toContain('Роботи у вхідних даних')
    expect(html).toContain('Кількість робіт')
    expect(html).toContain('rr-civilian-workshop-example')
    expect(html).toContain('не обчислювалися')
    expect(html).toContain('не доведені')
    expect(html).not.toContain('99%')
  })
})
