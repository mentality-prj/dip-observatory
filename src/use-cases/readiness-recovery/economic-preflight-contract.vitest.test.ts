import { describe, expect, it } from 'vitest'
import { economicRequestDecisionId, isRREconomicPreflight } from './economic-preflight-contract'

const valid = {
  schema_version: 'readiness-recovery.economic-preflight.v2',
  economic_version: 'readiness-recovery.economic-state.v2',
  decision_id: 'rr-synthetic-001',
  ir_semantic_hash: 'a'.repeat(64),
  job_count: 2,
  asset_count: 3,
  procurement_offer_count: 1,
  donor_extraction_count: 0,
  state: 'COMPILED_PREVIEW_ONLY',
  actionable: false,
  supply_source_verified: false,
  atomic_plan_committed: false,
} as const

describe('Core RR-ECON-v2 transport contract', () => {
  it('accepts only an exact non-actionable Core compilation response', () => {
    expect(isRREconomicPreflight(valid)).toBe(true)
    expect(isRREconomicPreflight({ ...valid, decision_id: 'rr-002' })).toBe(true)
  })

  it.each([
    ['actionable', { actionable: true }],
    ['verified supply', { supply_source_verified: true }],
    ['plan commit', { atomic_plan_committed: true }],
    ['wrong state', { state: 'OPTIMAL' }],
    ['wrong authority', { economic_version: 'readiness-recovery-runtime.v1' }],
    ['wrong schema', { schema_version: 'readiness-recovery.presentation.v1' }],
    ['invalid hash', { ir_semantic_hash: 'b'.repeat(63) }],
    ['invalid decision ID', { decision_id: '../outside' }],
    ['empty asset count', { asset_count: 0 }],
    ['fractional job count', { job_count: 1.2 }],
    ['negative offer count', { procurement_offer_count: -1 }],
    ['fake solver output', { selected_procurement_ids: ['order'] }],
  ])('rejects %s', (_name, change) => {
    expect(isRREconomicPreflight({ ...valid, ...change })).toBe(false)
  })

  it('rejects missing/null/array and prototype-shifted fields', () => {
    const { actionable: _actionable, ...missing } = valid
    expect(isRREconomicPreflight(missing)).toBe(false)
    expect(isRREconomicPreflight(null)).toBe(false)
    expect(isRREconomicPreflight([])).toBe(false)
  })

  it('binds a candidate response to a valid, explicit v2 request decision ID', () => {
    expect(economicRequestDecisionId({ operational: { decision_id: 'rr-synthetic-001' } })).toBe(
      'rr-synthetic-001'
    )
    for (const request of [
      null,
      [],
      {},
      { decision_id: 'rr-synthetic-001' },
      { operational: {} },
      { operational: [] },
      { operational: { decision_id: '../wrong' } },
      { operational: { decision_id: '..' } },
      { operational: { decision_id: 123 } },
    ]) {
      expect(economicRequestDecisionId(request)).toBeNull()
    }
  })
})
