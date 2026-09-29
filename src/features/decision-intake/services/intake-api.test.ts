import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { analyzeDecisionDataset, submitDecisionIntakeAnswers } from './intake-api'

const legacyGate = {
  status: 'discovered',
  reasons: ['verified critical decision semantics are missing'],
  missing_evidence: ['action', 'objective'],
  blocking_assumptions: [],
  recommended_next_step: 'Confirm the controllable action and business objective.',
}

function legacyAnalysis() {
  return {
    profile: {
      source_hash: 'legacy',
      row_count: 1,
      column_count: 1,
      columns: [],
      candidate_entity_columns: [],
      candidate_time_columns: [],
      duplicate_rows: 0,
      warnings: [],
    },
    interpretation: {
      candidates: [],
      unknowns: [],
      ambiguities: [],
      clarification_questions: ['What business objective should QDIP optimize?'],
      assumptions: [],
      provider: 'deterministic',
      model: null,
    },
    contract: {
      contract_id: 'legacy',
      version: 1,
      source_hash: 'legacy',
      archetype: 'constrained_resource_allocation',
      candidates: [],
      information_set: [],
      assumptions: [],
      unknowns: [],
      validation_status: 'inferred',
    },
    evidence_gate: legacyGate,
  }
}

describe('Decision Intake API compatibility transport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('falls back from v2 analyze to v1 on 404 and normalizes the response', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(legacyAnalysis()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await analyzeDecisionDataset({
      file: new File(['action\nkeep\n'], 'decision.csv', { type: 'text/csv' }),
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://dip.example/api/v1/intake/v2/analyze')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://dip.example/api/v1/intake/analyze')
    expect(result.schema_version).toBe(2)
  })

  it('refuses ambiguous field-only confirmation when v2 is unavailable', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret')
    const legacyContract = {
      contract: {
        contract_id: 'legacy',
        version: 1,
        source_hash: 'legacy',
        archetype: 'constrained_resource_allocation',
        candidates: [
          {
            field: 'demand',
            role: 'action',
            source_columns: ['demand'],
            reason: 'legacy',
            status: 'inferred',
          },
          {
            field: 'demand',
            role: 'objective',
            source_columns: ['demand'],
            reason: 'legacy',
            status: 'inferred',
          },
        ],
        information_set: [],
        assumptions: [],
        unknowns: [],
        validation_status: 'inferred',
      },
      evidence_gate: legacyGate,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(legacyContract), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      submitDecisionIntakeAnswers('legacy', {
        candidate_statuses_by_id: {
          'semantic:action:demand': 'user_confirmed',
        },
      })
    ).rejects.toMatchObject({ status: 409 })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not treat a missing v2 session as a missing route', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'http_error', message: 'decision intake session not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      submitDecisionIntakeAnswers('missing', {
        candidate_statuses_by_id: {
          'semantic:action:action': 'user_confirmed',
        },
      })
    ).rejects.toMatchObject({ status: 404 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('requires Decision Intake v2 for problem formalization verification', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret')
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'http_error', message: 'Not Found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      submitDecisionIntakeAnswers('legacy', {
        formalization_statuses: {
          'objective:resource_allocation_score': 'user_confirmed',
        },
        accept_timing_suggestions: true,
      })
    ).rejects.toMatchObject({ status: 409 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('requires Decision Intake v2 for human-created semantic mappings', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret')
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      submitDecisionIntakeAnswers('legacy', {
        semantic_mappings: [{ field: 'profit', role: 'objective' }],
      })
    ).rejects.toMatchObject({ status: 409 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
