import { describe, expect, it } from 'vitest'

import { normalizeIntakeAnalysis } from './contracts'

describe('Decision Intake contract compatibility', () => {
  it('normalizes legacy v1 payloads into the v2 structured model', () => {
    const result = normalizeIntakeAnalysis({
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
        candidates: [
          {
            field: 'capacity',
            role: 'constraint',
            source_columns: ['capacity'],
            reason: 'legacy prose',
            status: 'inferred',
          },
        ],
        unknowns: [],
        ambiguities: [],
        clarification_questions: ['What business objective should QDIP optimize?', 'Custom AI clarification?'],
        assumptions: ['legacy assumption'],
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
        assumptions: ['legacy assumption'],
        unknowns: [],
        validation_status: 'inferred',
      },
      evidence_gate: {
        status: 'discovered',
        reasons: ['verified critical decision semantics are missing'],
        missing_evidence: ['action', 'objective'],
        blocking_assumptions: [],
        recommended_next_step: 'Confirm the controllable action and business objective.',
      },
    })

    expect(result.schema_version).toBe(2)
    expect(result.interpretation.clarifications[0]?.code).toBe('clarification.business_objective')
    expect(result.interpretation.candidates[0]?.reason.code).toBe('semantic_reason.model_inference')
    expect(result.interpretation.candidates[0]?.candidate_id).toBe('legacy:capacity:constraint')
    expect(result.interpretation.legacy_clarifications).toEqual(['Custom AI clarification?'])
    expect(result.contract.archetype).toBe('constrained_resource_allocation')
    expect(result.evidence_gate.recommended_next_step.code).toBe(
      'next_step.confirm_controllable_action_and_business_objective'
    )
  })

  it('accepts native v2 payloads without compatibility rewriting', () => {
    const result = normalizeIntakeAnalysis({
      schema_version: 2,
      profile: {
        source_hash: 'v2',
        row_count: 1,
        column_count: 1,
        columns: [],
        candidate_entity_columns: [],
        candidate_time_columns: [],
        duplicate_rows: 0,
        warnings: [],
      },
      interpretation: {
        archetype: 'generic_decision',
        candidates: [],
        clarifications: [],
        assumptions: [],
        provider: 'deterministic',
        model: null,
      },
      contract: {
        schema_version: 2,
        contract_id: 'v2',
        version: 1,
        source_hash: 'v2',
        archetype: 'generic_decision',
        candidates: [],
        information_set: [],
        assumptions: [],
        validation_status: 'inferred',
      },
      evidence_gate: {
        status: 'discovered',
        reasons: [],
        missing_evidence: [],
        blocking_assumptions: [],
        recommended_next_step: {
          code: 'next_step.select_decision_adapter',
          params: { field: null, role: null },
        },
      },
    })

    expect(result.schema_version).toBe(2)
    expect(result.contract.archetype).toBe('generic_decision')
    expect(result.evidence_gate.recommended_next_step.code).toBe('next_step.select_decision_adapter')
  })
})
