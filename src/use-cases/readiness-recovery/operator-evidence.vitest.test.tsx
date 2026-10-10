import { describe, expect, it } from 'vitest'
import { kernelEvidenceFromRecord } from './operator-evidence'
describe('Kernel-only bounded evidence contract', () => {
  it('fails closed on client-supplied actionability without authoritative runtime result', () => {
    const r = {
      result: {
        workflow: { execution_id: 'a' },
        runtime: { operator_outcome: { actionable: true, authoritative: false } },
      },
    }
    const v = kernelEvidenceFromRecord(r)
    expect(v.actionable).toBe(false)
    expect(v.authoritative).toBe(false)
  })
  it('supports normalized Kernel job slots and rejects invalid job records', () => {
    const r = {
      result: {
        workflow: {
          execution_id: 'rr-1',
          ingestion: { payload: { decision_id: 'd-1' }, source: { snapshot_id: 'snapshot-1' } },
        },
        runtime: {
          operator_outcome: {
            kind: 'SCHEDULED',
            actionable: true,
            authoritative: true,
            selected_donor_ids: ['donor-1', 42],
          },
          decision: {
            scheduled_jobs: [
              { job_id: 'j1', technician_id: 't1', start_slot: 2, finish_slot: 4 },
              { job_id: 'bad', technician_id: 't2', start_slot: 9, finish_slot: 1 },
            ],
          },
        },
      },
    }
    const v = kernelEvidenceFromRecord(r)
    expect(v.actionable).toBe(true)
    expect(v.jobs).toEqual([{ id: 'j1', technician: 't1', start: 2, finish: 4 }])
    expect(v.sourceSnapshot).toBe('snapshot-1')
    expect(v.donors).toEqual(['donor-1'])
  })
  it('records unknown provenance as null rather than fabricated evidence', () => {
    expect(kernelEvidenceFromRecord({}).kind).toBeNull()
    expect(kernelEvidenceFromRecord({}).revision).toBeNull()
  })
})
