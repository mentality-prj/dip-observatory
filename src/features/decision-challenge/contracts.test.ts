import { describe, expect, it } from 'vitest'

import {
  actionValidationSchema,
  challengeDefinitionSchema,
  challengeRunSchema,
} from './contracts'

describe('Decision Challenge contracts', () => {
  it('accepts the sanitized pre-lock backend view without economic hints', () => {
    const run = challengeRunSchema.parse({
      id: 'run-1',
      challenge_id: 'resource-allocation-v1',
      challenge_version: '1.0.0',
      status: 'DECIDING',
      snapshot: {
        snapshot_id: 'snapshot',
        snapshot_hash: 'snapshot',
        problem_id: 'problem',
        problem_hash: 'hash',
        problem: {
          teams: [{ id: 'alpha', current_community: 'north' }],
          communities: [{ id: 'north' }],
        },
        evidence_refs: [],
        evidence_revision: 'evidence',
        economic_model_hash: 'economics',
        model_versions_hash: 'versions',
        created_at: '2026-09-25T10:00:00Z',
      },
      result: null,
      created_at: '2026-09-25T10:00:00Z',
      updated_at: '2026-09-25T10:00:00Z',
    })

    expect(run.status).toBe('DECIDING')
    expect(run.result).toBeNull()
    expect(run.snapshot.problem).not.toHaveProperty('economic_model')
  })

  it('keeps unsupported uncertainty metrics absent instead of inventing them', () => {
    const run = challengeRunSchema.parse({
      id: 'run-1',
      challenge_id: 'resource-allocation-v1',
      challenge_version: '1.0.0',
      status: 'COMPLETED',
      snapshot: {
        snapshot_id: 'snapshot',
        snapshot_hash: 'snapshot',
        problem_id: 'problem',
        problem_hash: 'hash',
        problem: {},
        evidence_refs: [],
        evidence_revision: 'evidence',
        economic_model_hash: 'economics',
        model_versions_hash: 'versions',
        created_at: '2026-09-25T10:00:00Z',
      },
      result: {
        snapshot_id: 'snapshot',
        snapshot_hash: 'snapshot',
        problem_id: 'problem',
        problem_hash: 'hash',
        human_action_hash: 'human',
        qdip_action: { alpha: 'north' },
        qdip_action_hash: 'qdip',
        human_evaluation: { feasible: true },
        qdip_evaluation: { feasible: true },
        optimizer_score: 1,
        human_economic_outcome: {
          policy_id: 'human',
          policy_version: '1',
          decision_id: 'run-1',
          objective: {
            objective_id: 'value',
            metric_id: 'nominal',
            direction: 'maximize',
            unit: 'EUR',
            currency: 'EUR',
          },
          nominal_value: 100,
        },
        qdip_economic_outcome: {
          policy_id: 'qdip',
          policy_version: '1',
          decision_id: 'run-1',
          objective: {
            objective_id: 'value',
            metric_id: 'nominal',
            direction: 'maximize',
            unit: 'EUR',
            currency: 'EUR',
          },
          nominal_value: 90,
        },
        economic_comparison: { delta: { nominal_delta: -10 } },
        available_economic_metrics: ['nominal_value'],
        explanation: [],
        reproducibility: {
          solver: 'exact',
          solver_version: '1',
          solver_config: {},
          solver_config_hash: 'config',
          deterministic: true,
          reproducibility_token: 'token',
        },
        evaluation_reproducibility: {
          evaluator_id: 'shared',
          evaluator_version: '1',
          context_hash: 'evaluation-context',
          common_random_numbers: false,
        },
        data_quality_warnings: [],
      },
      created_at: '2026-09-25T10:00:00Z',
      updated_at: '2026-09-25T10:01:00Z',
    })

    expect(run.result?.available_economic_metrics).toEqual(['nominal_value'])
    expect(run.result?.human_economic_outcome.expected_value).toBeUndefined()
    expect(run.result?.economic_comparison.delta.nominal_delta).toBe(-10)
  })

  it('parses validation violations and challenge definitions', () => {
    expect(actionValidationSchema.parse({ feasible: false, violations: ['budget'] }).feasible).toBe(false)
    expect(
      challengeDefinitionSchema.parse({
        id: 'resource-allocation-v1',
        version: '1',
        title: 'Resource Allocation',
        description: 'Allocate teams',
        scenario: {},
        limitations: [],
      }).id
    ).toBe('resource-allocation-v1')
  })
})
