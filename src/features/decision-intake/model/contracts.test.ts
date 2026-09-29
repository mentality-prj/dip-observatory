import { describe, expect, it } from 'vitest'

import {
  decisionSufficiencySchema,
  intakeAnswersSchema,
  problemFormalizationSchema,
  sufficiencyQuestionSchema,
} from './contracts'

describe('Decision Intake sufficiency contract', () => {
  it('parses an identified effect that still requires estimability work', () => {
    const result = decisionSufficiencySchema.parse({
      structural_status: 'ready',
      compilation_status: 'blocked',
      causal_identifiability: 'identified',
      blockers: [],
      compilation_blockers: ['compiler_role:capacity:not_verified'],
      causal_blockers: [],
      statistical_blockers: ['positivity:requires_full_analysis'],
      requirements: [
        {
          id: 'causal.identification',
          layer: 'causal',
          state: 'satisfied',
          mode: 'all',
          depends_on: ['causal.query', 'causal.graph', 'causal.assumptions'],
          blockers: [],
          evidence: ['P(Y|do(X))'],
          description: 'identified',
        },
        {
          id: 'statistical.estimability',
          layer: 'statistical',
          state: 'blocked',
          mode: 'all',
          depends_on: ['causal.identification', 'statistical.estimand_obligations'],
          blockers: ['positivity:requires_full_analysis'],
          evidence: ['X:2'],
          description: 'requires support analysis',
        },
      ],
      questions: [
        {
          id: 'assess-statistical-estimability',
          kind: 'assess_estimability',
          role: null,
          field: null,
          options: [],
          resolves: ['positivity:requires_full_analysis'],
          effect: 'enables_estimability_check',
          estimated_cost: 3,
          priority_score: 0,
          rationale: 'Full model-aware positivity analysis is required.',
          evidence_action_id: null,
          evidence_kind: null,
          evidence_variables: ['X', 'Y', 'M'],
          evidence_targets: [],
        },
      ],
      next_question: {
        id: 'assess-statistical-estimability',
        kind: 'assess_estimability',
        role: null,
        field: null,
        options: [],
        resolves: ['positivity:requires_full_analysis'],
        effect: 'enables_estimability_check',
        estimated_cost: 3,
        priority_score: 0,
        rationale: 'Full model-aware positivity analysis is required.',
        evidence_action_id: null,
        evidence_kind: null,
        evidence_variables: ['X', 'Y', 'M'],
        evidence_targets: [],
      },
      compilation_questions: [
        {
          id: 'select-compiler-capacity',
          kind: 'select_field',
          role: 'capacity',
          field: null,
          options: ['X', 'Y', 'M'],
          resolves: ['compiler_role:capacity:not_verified'],
          effect: 'removes_blocker',
          estimated_cost: 2,
          priority_score: 0.5,
          rationale: 'Compiler requires one verified capacity mapping.',
          evidence_action_id: null,
          evidence_kind: null,
          evidence_variables: [],
          evidence_targets: [],
        },
      ],
      compilation_next_question: {
        id: 'select-compiler-capacity',
        kind: 'select_field',
        role: 'capacity',
        field: null,
        options: ['X', 'Y', 'M'],
        resolves: ['compiler_role:capacity:not_verified'],
        effect: 'removes_blocker',
        estimated_cost: 2,
        priority_score: 0.5,
        rationale: 'Compiler requires one verified capacity mapping.',
        evidence_action_id: null,
        evidence_kind: null,
        evidence_variables: [],
        evidence_targets: [],
      },
      certificate: {
        issued: true,
        scope: 'decision-contract-structural-v2',
        satisfied_requirements: ['structural.role.action'],
        blocking_requirements: [],
        claim: 'Structural intake requirements are satisfied.',
      },
      causal_certificate: {
        issued: true,
        status: 'identified',
        method: 'id-v1',
        estimand: 'P(Y|do(X))',
        estimand_ast: {
          kind: 'conditional',
          variables: [],
          target: 'Y',
          given: ['X', 'M'],
          children: [],
        },
        proof_steps: ['ID-6'],
        failure_witness: null,
        assumptions: ['semi_markovian_admg', 'causal_markov', 'consistency'],
        scope: 'graphical-identification-semi-markovian-admg-v1',
        claim: 'Graphically identified.',
      },
      causal_evidence_plan: null,
      estimand_requirements: {
        obligations: [
          {
            id: 'conditional:Y|X,M',
            kind: 'conditional_kernel',
            target: 'Y',
            given: ['X', 'M'],
            variables: ['Y', 'X', 'M'],
            expression_path: 'root',
            claim: 'Kernel support required.',
          },
        ],
        scope: 'identified-estimand-obligations-v1',
        claim: 'Derived from the estimand AST.',
      },
      empirical_support: {
        status: 'requires_full_analysis',
        treatment_levels: { X: 2 },
        checked_strata: 0,
        missing_strata: [],
        checked_obligations: [],
        failed_obligations: [],
        deferred_obligations: ['conditional:Y|X,M'],
        claim: 'Full model-aware support analysis is required.',
      },
      planner_strategy: 'max-requirement-reduction-per-cost-v1',
      proof_scope: 'decision-contract-structural-v2',
    })

    expect(result.next_question?.kind).toBe('assess_estimability')
    expect(result.compilation_next_question?.role).toBe('capacity')
    expect(result.empirical_support?.deferred_obligations).toEqual(['conditional:Y|X,M'])
    expect(result.causal_certificate?.status).toBe('identified')
  })

  it('parses explicit archetype selection as a compiler goal step', () => {
    const result = sufficiencyQuestionSchema.parse({
      id: 'select-compiler-archetype',
      kind: 'select_archetype',
      role: null,
      field: null,
      options: ['constrained_resource_allocation'],
      resolves: ['compiler:archetype_unclassified'],
      effect: 'removes_blocker',
      estimated_cost: 1,
      priority_score: 1,
      rationale: 'Select an explicit supported decision archetype.',
      evidence_action_id: null,
      evidence_kind: null,
      evidence_variables: [],
      evidence_targets: [],
    })

    expect(result.kind).toBe('select_archetype')
    expect(result.options).toEqual(['constrained_resource_allocation'])
  })
  it('parses a compiler-aware resource-allocation formalization', () => {
    const result = problemFormalizationSchema.parse({
      version: 1,
      archetype_hypotheses: [
        {
          archetype: 'constrained_resource_allocation',
          score: 0.99,
          evidence: ['community dimension', 'capacity', 'demand quantity'],
        },
      ],
      row_subtypes: [
        {
          discriminator: 'record_type',
          value: 'team',
          semantic_type: 'team',
          score: 0.98,
        },
      ],
      decision_variables: [
        {
          id: 'decision_variable:resource_allocation',
          kind: 'allocation',
          expression: 'x[team, community] in {0,1}: assign each team to at most one community',
          indexed_by: ['id', 'community'],
          value_field: null,
          score: 0.98,
          evidence: ['community', 'capacity', 'units'],
          status: 'inferred',
        },
      ],
      objectives: [
        {
          id: 'objective:resource_allocation_score',
          sense: 'maximize',
          expression: 'maximize the resource-allocation composite score',
          field: 'priority',
          score: 0.97,
          evidence: ['priority', 'units', 'cost'],
          supported_compilers: ['resource_allocation.v1'],
          status: 'inferred',
        },
      ],
      constraints: [
        {
          id: 'constraint:budget',
          kind: 'hard',
          expression: 'total operating cost <= budget',
          field: 'budget',
          operator: '<=',
          score: 0.96,
          evidence: ['budget'],
          status: 'inferred',
        },
      ],
      timing: [
        {
          field: 'capacity',
          timing: 'pre_decision',
          score: 0.9,
          evidence: ['operational input field'],
          status: 'inferred',
        },
      ],
      questions: [],
      completeness_score: 0.95,
      claim: 'Candidate mathematical formalization only.',
    })

    expect(result.objectives[0]?.supported_compilers).toEqual(['resource_allocation.v1'])
    expect(result.decision_variables[0]?.expression).toContain('assign each team')
  })

  it('accepts one-shot formalization and timing verification payloads', () => {
    const result = intakeAnswersSchema.parse({
      formalization_statuses: {
        'decision_variable:resource_allocation': 'user_confirmed',
        'objective:resource_allocation_score': 'user_confirmed',
        'constraint:budget': 'user_confirmed',
      },
      accept_timing_suggestions: true,
      candidate_statuses_by_id: {
        'semantic:team_id:id': 'user_confirmed',
      },
    })

    expect(result.accept_timing_suggestions).toBe(true)
  })

  it('parses compiler objective reselection questions', () => {
    const result = sufficiencyQuestionSchema.parse({
      id: 'select-compiler-objective',
      kind: 'select_objective',
      role: 'objective',
      field: null,
      hypothesis_id: null,
      hypothesis_ids: ['objective:resource_allocation_score'],
      options: ['objective:resource_allocation_score'],
      resolves: ['compiler:objective_not_supported:objective:minimize_operating_cost'],
      effect: 'removes_blocker',
      estimated_cost: 1,
      priority_score: 1,
      rationale: 'Choose a compiler-compatible objective.',
      evidence_action_id: null,
      evidence_kind: null,
      evidence_variables: [],
      evidence_targets: [],
    })

    expect(result.kind).toBe('select_objective')
  })
})
