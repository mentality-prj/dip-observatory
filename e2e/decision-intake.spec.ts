import { expect, test } from '@playwright/test'

const baseSufficiency = {
  structural_status: 'blocked',
  compilation_status: 'unsupported',
  causal_identifiability: 'requires_causal_model',
  blockers: ['role:action:not_verified', 'role:objective:not_verified'],
  compilation_blockers: ['compiler:unsupported_archetype:generic_decision'],
  compilation_validation_error: null,
  causal_blockers: ['role:outcome:not_verified', 'causal_identification:not_run'],
  statistical_blockers: ['causal_identification:not_ready'],
  requirements: [],
  questions: [],
  next_question: null,
  compilation_questions: [],
  compilation_next_question: null,
  certificate: {
    issued: false,
    scope: 'decision-contract-structural-v2',
    satisfied_requirements: [],
    blocking_requirements: ['structural.role.action', 'structural.role.objective'],
    claim: 'Structural sufficiency is not certified because required evidence is unresolved.',
  },
  causal_certificate: null,
  causal_evidence_plan: null,
  estimand_requirements: null,
  empirical_support: null,
  planner_strategy: 'max-requirement-reduction-per-cost-v1',
  proof_scope: 'decision-contract-structural-v2',
}

const readyRaSufficiency = {
  ...baseSufficiency,
  structural_status: 'ready',
  compilation_status: 'ready',
  blockers: [],
  compilation_blockers: [],
  statistical_blockers: [],
  certificate: {
    ...baseSufficiency.certificate,
    issued: true,
    satisfied_requirements: ['structural.role.action', 'structural.role.objective'],
    blocking_requirements: [],
    claim: 'The DecisionContract satisfies the current structural intake requirements.',
  },
}

const analysis = {
  schema_version: 2,
  profile: {
    source_hash: 'test-source',
    row_count: 2,
    column_count: 3,
    columns: [],
    candidate_entity_columns: [],
    candidate_time_columns: [],
    duplicate_rows: 0,
    warnings: [],
  },
  interpretation: {
    archetype: 'generic_decision',
    candidates: [
      {
        candidate_id: 'semantic:action:action',
        field: 'action',
        role: 'action',
        source_columns: ['action'],
        reason: {
          code: 'semantic_reason.business_context_match',
          params: { field: 'action', role: 'action' },
        },
        status: 'inferred',
      },
    ],
    clarifications: [
      { code: 'clarification.controllable_action', params: { field: null, role: null } },
      { code: 'clarification.business_objective', params: { field: null, role: null } },
      { code: 'clarification.binding_constraints', params: { field: null, role: null } },
      { code: 'clarification.decision_time_information', params: { field: null, role: null } },
      { code: 'clarification.realized_outcome', params: { field: null, role: null } },
      {
        code: 'clarification.field_role',
        params: { field: 'capacity', role: 'constraint' },
      },
      {
        code: 'clarification.field_meaning',
        params: { field: 'capacity', role: null },
      },
    ],
    assumptions: [
      {
        code: 'assumption.business_semantics_require_confirmation',
        params: { field: null, role: null },
      },
      {
        code: 'assumption.field_availability_inferred',
        params: { field: 'capacity', role: null },
      },
    ],
    provider: 'openai-compatible',
    model: 'test-model',
  },
  contract: {
    schema_version: 2,
    contract_id: 'test-contract',
    version: 1,
    source_hash: 'test-source',
    archetype: 'generic_decision',
    candidates: [
      {
        candidate_id: 'semantic:action:action',
        field: 'action',
        role: 'action',
        source_columns: ['action'],
        reason: {
          code: 'semantic_reason.business_context_match',
          params: { field: 'action', role: 'action' },
        },
        status: 'inferred',
      },
    ],
    information_set: [
      { field: 'action', availability: 'unknown', status: 'inferred' },
      { field: 'capacity', availability: 'unknown', status: 'inferred' },
      { field: 'outcome', availability: 'unknown', status: 'inferred' },
    ],
    assumptions: [
      {
        code: 'assumption.business_semantics_require_confirmation',
        params: { field: null, role: null },
      },
      {
        code: 'assumption.field_availability_inferred',
        params: { field: 'capacity', role: null },
      },
    ],
    validation_status: 'inferred',
  },
  evidence_gate: {
    status: 'discovered',
    reasons: [
      {
        code: 'evidence_reason.verified_critical_semantics_missing',
        params: { field: null, role: null },
      },
    ],
    missing_evidence: ['action', 'objective'],
    blocking_assumptions: [],
    recommended_next_step: {
      code: 'next_step.confirm_controllable_action_and_business_objective',
      params: { field: null, role: null },
    },
  },
  sufficiency: baseSufficiency,
}

test('Decision Intake preserves structured AI semantics and localizes them without prose leakage', async ({ page }) => {
  await page.route('**/api/decision-intake/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(analysis),
    })
  })

  await page.goto('/uk/decision-intake')

  const dropzone = page.getByTestId('decision-intake-dropzone')
  const csv = ['action,capacity,outcome', 'keep,10,8'].join('\n')

  await dropzone.evaluate((element, contents) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([contents], 'decision.csv', { type: 'text/csv' }))
    element.dispatchEvent(
      new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      })
    )
  }, csv)

  await expect(dropzone).toHaveAttribute('data-dragging', 'true')
  await expect(page.getByTestId('decision-intake-file')).toHaveText('Відпустіть файл, щоб додати його')

  await dropzone.evaluate((element, contents) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([contents], 'decision.csv', { type: 'text/csv' }))
    element.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      })
    )
  }, csv)

  await expect(page.getByTestId('decision-intake-file')).toContainText('decision.csv')
  await expect(page.getByText('Замінити файл')).toBeVisible()
  await page.getByRole('button', { name: 'Проаналізувати дані' }).click()

  await expect(
    page.getByText('Яке поле відповідає дії, яку може контролювати особа, що приймає рішення?')
  ).toBeVisible()
  await expect(page.getByText('Яку бізнес-мету має оптимізувати QDIP?')).toBeVisible()
  await expect(page.getByText('Які обмеження були відомі та обов’язкові на момент прийняття рішення?')).toBeVisible()
  await expect(page.getByText('Які поля були доступні до вибору дії?')).toBeVisible()
  await expect(page.getByText('Яке поле фіксує фактичний результат?')).toBeVisible()

  await expect(page.getByText('Чи має поле «capacity» відповідати ролі «обмеження»?')).toBeVisible()
  await expect(page.getByText('Яке бізнес-значення має поле «capacity»?')).toBeVisible()
  await expect(
    page.getByText('Бізнес-контекст підтримує зіставлення поля «action» з роллю «дія».').first()
  ).toBeVisible()
  await expect(page.getByText('Бізнес-семантика потребує підтвердження людиною.')).toBeVisible()
  await expect(
    page.getByText('Доступність поля «capacity» на момент рішення є припущенням і потребує підтвердження.')
  ).toBeVisible()

  await expect(page.getByText('Виявлено')).toBeVisible()
  await expect(page.getByText('Підтвердьте керовану дію та бізнес-мету.')).toBeVisible()

  await expect(page.getByText(/clarification\./)).toHaveCount(0)
  await expect(page.getByText(/semantic_reason\./)).toHaveCount(0)
  await expect(page.getByText(/assumption\./)).toHaveCount(0)
  await expect(page.getByText(/next_step\./)).toHaveCount(0)
})

test('legacy Decision Intake semantics remain available without leaking into the primary localized flow', async ({
  page,
}) => {
  const legacyAnalysis = {
    ...analysis,
    interpretation: {
      ...analysis.interpretation,
      legacy_clarifications: ['Custom AI clarification?'],
      legacy_assumptions: ['Custom legacy assumption'],
      legacy_unknowns: [],
      legacy_ambiguities: [],
    },
  }

  await page.route('**/api/decision-intake/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(legacyAnalysis),
    })
  })

  await page.goto('/uk/decision-intake')
  const dropzone = page.getByTestId('decision-intake-dropzone')
  const csv = ['action,capacity,outcome', 'keep,10,8'].join('\n')
  await dropzone.evaluate((element, contents) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([contents], 'decision.csv', { type: 'text/csv' }))
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }))
  }, csv)
  await page.getByRole('button', { name: 'Проаналізувати дані' }).click()

  await expect(page.getByText('Custom AI clarification?')).toBeHidden()
  await page.getByText('Legacy-семантика v1 (оригінальне формулювання)').click()
  await expect(page.getByText('Custom AI clarification?')).toBeVisible()
  await expect(page.getByText('Custom legacy assumption')).toBeVisible()
})

test('human verification can create missing semantics and compile a ready RA contract', async ({ page }) => {
  const candidates = [
    ['team_id', 'action'],
    ['community', 'community_id'],
    ['team_id', 'team_id'],
    ['capacity', 'capacity'],
    ['demand', 'demand'],
  ].map(([field, role]) => ({
    candidate_id: `semantic:${role}:${field}`,
    field,
    role,
    source_columns: [field],
    reason: {
      code: 'semantic_reason.model_inference',
      params: { field, role },
    },
    status: 'inferred',
  }))
  const informationSet = ['community', 'team_id', 'capacity', 'demand'].map((field) => ({
    field,
    availability: 'unknown',
    status: 'inferred',
  }))
  const raAnalysis = {
    ...analysis,
    interpretation: {
      ...analysis.interpretation,
      archetype: 'constrained_resource_allocation',
      candidates,
    },
    contract: {
      ...analysis.contract,
      contract_id: 'ra-contract',
      archetype: 'constrained_resource_allocation',
      candidates,
      information_set: informationSet,
    },
    evidence_gate: {
      ...analysis.evidence_gate,
      status: 'needs_more_data',
      missing_evidence: ['objective'],
      recommended_next_step: {
        code: 'next_step.confirm_controllable_action_and_business_objective',
        params: { field: null, role: null },
      },
    },
    sufficiency: {
      ...baseSufficiency,
      compilation_status: 'blocked',
      compilation_blockers: [
        'compiler_role:community_id:not_verified',
        'compiler_role:team_id:not_verified',
        'compiler_role:capacity:not_verified',
        'compiler_role:demand:not_verified',
      ],
    },
  }

  const verifiedCandidates = [
    ...candidates.map((candidate) => ({ ...candidate, status: 'user_confirmed' })),
    {
      candidate_id: 'semantic:objective:demand',
      field: 'demand',
      role: 'objective',
      source_columns: ['demand'],
      reason: {
        code: 'semantic_reason.user_selection',
        params: { field: 'demand', role: 'objective' },
      },
      status: 'user_confirmed',
    },
  ]
  const verifiedContract = {
    ...raAnalysis.contract,
    version: 2,
    previous_version: 1,
    candidates: verifiedCandidates,
    information_set: informationSet.map((item) => ({
      ...item,
      availability: 'available',
      status: 'user_confirmed',
    })),
    validation_status: 'verified',
  }

  await page.route('**/api/decision-intake/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(raAnalysis),
    })
  })
  await page.route('**/api/decision-intake/ra-contract/answers', async (route) => {
    const body = route.request().postDataJSON()
    expect(body.semantic_mappings).toEqual([{ field: 'demand', role: 'objective' }])
    expect(body.candidate_statuses_by_id).toHaveProperty('semantic:action:team_id', 'user_confirmed')
    expect(body.information_availability).toEqual({
      community: 'available',
      team_id: 'available',
      capacity: 'available',
      demand: 'available',
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        contract: verifiedContract,
        evidence_gate: {
          status: 'ready_for_decision',
          reasons: [
            {
              code: 'evidence_reason.minimum_verified_semantics_present',
              params: { field: null, role: null },
            },
          ],
          missing_evidence: [],
          blocking_assumptions: [],
          recommended_next_step: {
            code: 'next_step.compile_resource_allocation',
            params: { field: null, role: null },
          },
        },
        sufficiency: readyRaSufficiency,
      }),
    })
  })
  await page.route('**/api/decision-intake/ra-contract/compile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        archetype: 'constrained_resource_allocation',
        request: {
          teams: [{ id: 'team-a', capacity: 10 }],
          communities: [{ id: 'north', demand: [{ service: 'default', units: 8 }] }],
        },
      }),
    })
  })

  await page.goto('/uk/decision-intake')
  const dropzone = page.getByTestId('decision-intake-dropzone')
  const csv = ['community,team_id,capacity,demand', 'north,team-a,10,8'].join('\n')
  await dropzone.evaluate((element, contents) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([contents], 'ra.csv', { type: 'text/csv' }))
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }))
  }, csv)
  await page.getByRole('button', { name: 'Проаналізувати дані' }).click()

  for (const candidate of candidates) {
    await page.getByTestId(`confirm-${candidate.candidate_id}`).click()
  }

  await page.getByTestId('decision-intake-mapping-field').selectOption('demand')
  await page.getByTestId('decision-intake-mapping-role').selectOption('objective')
  await page.getByTestId('decision-intake-add-mapping').click()

  for (const field of ['community', 'team_id', 'capacity', 'demand']) {
    await page.getByTestId(`availability-${field}`).selectOption('available')
  }

  await page.getByTestId('decision-intake-verify').click()
  await expect(page.getByText('Готово до рішення')).toBeVisible()
  await expect(page.getByText('Версія контракту:').locator('..')).toContainText('2')

  await page.getByTestId('decision-intake-compile').click()
  await expect(page.getByTestId('decision-intake-compiled')).toBeVisible()
  await expect(page.getByText(/team-a/)).toBeVisible()
})

test('automatic formalization can be accepted and executed end to end', async ({ page }) => {
  const compilerCandidates = [
    ['community', 'community_id'],
    ['team_id', 'team_id'],
    ['capacity', 'capacity'],
    ['demand', 'demand'],
    ['service', 'service'],
  ].map(([field, role]) => ({
    candidate_id: `semantic:${role}:${field}`,
    field,
    role,
    source_columns: [field],
    reason: {
      code: 'semantic_reason.field_name_match',
      params: { field, role },
    },
    scope: null,
    status: 'inferred',
  }))

  const formalization = {
    version: 1,
    archetype_hypotheses: [
      {
        archetype: 'constrained_resource_allocation',
        score: 0.99,
        evidence: ['community dimension', 'capacity', 'demand quantity'],
      },
      {
        archetype: 'generic_decision',
        score: 0.05,
        evidence: ['fallback when no supported specialized formulation is strong'],
      },
    ],
    row_subtypes: [],
    decision_variables: [
      {
        id: 'decision_variable:resource_allocation',
        kind: 'allocation',
        expression: 'x[team, community] in {0,1}: assign each team to at most one community',
        indexed_by: ['team_id', 'community'],
        value_field: null,
        score: 0.98,
        evidence: ['community', 'capacity', 'demand'],
        supported_compilers: ['resource_allocation.v1'],
        status: 'inferred',
      },
    ],
    objectives: [
      {
        id: 'objective:resource_allocation_score',
        sense: 'maximize',
        expression:
          'maximize 1000*priority_coverage + 400*weighted_coverage + 250*total_coverage + 50*capacity_utilization - travel_cost - 2*unmet_need',
        field: 'priority',
        score: 0.99,
        evidence: ['priority', 'demand'],
        supported_compilers: ['resource_allocation.v1'],
        status: 'inferred',
      },
    ],
    assumptions: [
      {
        id: 'assumption:resource_allocation:skills',
        parameter: 'skills',
        value: 'all_demand_services',
        provenance: 'compiler_default',
        impact: 'decision_relevant',
        rationale: 'Missing skills require explicit confirmation.',
        supported_compilers: ['resource_allocation.v1'],
        status: 'inferred',
      },
      {
        id: 'assumption:resource_allocation:travel',
        parameter: 'travel',
        value: 'zero_cost_unrestricted',
        provenance: 'compiler_default',
        impact: 'decision_relevant',
        rationale: 'Missing travel graph requires explicit confirmation.',
        supported_compilers: ['resource_allocation.v1'],
        status: 'inferred',
      },
      {
        id: 'assumption:resource_allocation:operation',
        parameter: 'operation',
        value: 'optimize',
        provenance: 'system_default',
        impact: 'decision_relevant',
        rationale: 'Optimize is the selected Decision Intake adapter operation.',
        supported_compilers: ['resource_allocation.v1'],
        status: 'inferred',
      },
    ],
    constraints: [
      {
        id: 'constraint:budget',
        kind: 'hard',
        expression: 'total operating cost <= budget',
        parameter: 'budget',
        field: 'budget',
        operator: '<=',
        value: null,
        score: 0.96,
        evidence: ['budget'],
        supported_compilers: ['resource_allocation.v1'],
        status: 'inferred',
      },
    ],
    timing: ['community', 'team_id', 'capacity', 'demand', 'service', 'priority', 'budget'].map((field) => ({
      field,
      timing: 'pre_decision',
      score: 0.9,
      evidence: ['operational input field'],
      status: 'inferred',
    })),
    questions: [
      {
        id: 'formalization:compiler-mapping',
        kind: 'confirm_compiler_mapping',
        hypothesis_ids: compilerCandidates.map((item) => item.candidate_id),
        field: null,
        options: [],
        score: 1,
        rationale: 'Verify mappings required by the selected compiler adapter.',
      },
    ],
    discovery_completeness_score: 1,
    completeness_score: 1,
    claim: 'Candidate mathematical formalization only.',
  }

  const informationSet = ['community', 'team_id', 'capacity', 'demand', 'service', 'priority', 'budget'].map(
    (field) => ({ field, availability: 'available', status: 'inferred' })
  )
  const autoAnalysis = {
    ...analysis,
    interpretation: {
      ...analysis.interpretation,
      archetype: 'unclassified',
      candidates: compilerCandidates,
      clarifications: [],
      formalization,
    },
    contract: {
      ...analysis.contract,
      contract_id: 'auto-contract',
      archetype: 'unclassified',
      candidates: compilerCandidates,
      information_set: informationSet,
      formalization,
    },
    sufficiency: {
      ...baseSufficiency,
      compilation_status: 'blocked',
      compilation_blockers: ['compiler:archetype_unclassified'],
      compilation_validation_error: null,
    },
  }

  const verifiedFormalization = {
    ...formalization,
    decision_variables: formalization.decision_variables.map((item) => ({ ...item, status: 'user_confirmed' })),
    objectives: formalization.objectives.map((item) => ({ ...item, status: 'user_confirmed' })),
    constraints: formalization.constraints.map((item) => ({ ...item, status: 'user_confirmed' })),
    assumptions: formalization.assumptions.map((item) => ({
      ...item,
      status: item.impact === 'decision_relevant' ? 'user_confirmed' : 'inferred',
    })),
    timing: formalization.timing.map((item) => ({ ...item, status: 'user_confirmed' })),
  }
  const verifiedContract = {
    ...autoAnalysis.contract,
    version: 2,
    previous_version: 1,
    archetype: 'constrained_resource_allocation',
    candidates: compilerCandidates.map((item) => ({ ...item, status: 'user_confirmed' })),
    information_set: informationSet.map((item) => ({
      ...item,
      availability: 'available',
      status: 'user_confirmed',
    })),
    formalization: verifiedFormalization,
    validation_status: 'verified',
  }

  await page.route('**/api/decision-intake/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(autoAnalysis),
    })
  })
  await page.route('**/api/decision-intake/auto-contract/answers', async (route) => {
    const body = route.request().postDataJSON()
    expect(body.archetype).toBe('constrained_resource_allocation')
    expect(body.accept_timing_suggestions).toBeUndefined()
    expect(body.information_availability).toEqual({
      community: 'available',
      team_id: 'available',
      capacity: 'available',
      demand: 'available',
      service: 'available',
      priority: 'available',
      budget: 'available',
    })
    expect(body.formalization_statuses).toEqual({
      'decision_variable:resource_allocation': 'user_confirmed',
      'objective:resource_allocation_score': 'user_confirmed',
      'constraint:budget': 'user_confirmed',
      'assumption:resource_allocation:skills': 'user_confirmed',
      'assumption:resource_allocation:travel': 'user_confirmed',
      'assumption:resource_allocation:operation': 'user_confirmed',
    })
    expect(body.candidate_statuses_by_id).toEqual({
      'semantic:community_id:community': 'user_confirmed',
      'semantic:team_id:team_id': 'user_confirmed',
      'semantic:capacity:capacity': 'user_confirmed',
      'semantic:demand:demand': 'user_confirmed',
      'semantic:service:service': 'user_confirmed',
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        contract: verifiedContract,
        evidence_gate: {
          status: 'ready_for_structural_intake',
          reasons: [
            {
              code: 'evidence_reason.minimum_verified_semantics_present',
              params: { field: null, role: null },
            },
          ],
          missing_evidence: [],
          blocking_assumptions: [],
          recommended_next_step: {
            code: 'next_step.compile_resource_allocation',
            params: { field: null, role: null },
          },
        },
        sufficiency: readyRaSufficiency,
      }),
    })
  })
  await page.route('**/api/decision-intake/auto-contract/execute', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        archetype: 'constrained_resource_allocation',
        request: {
          communities: [{ id: 'north', demand: [{ service: 'medical', units: 8 }] }],
          teams: [{ id: 'team-a', capacity: 10, skills: ['medical'] }],
          budget: 100,
        },
        result: {
          status: 'ok',
          recommended: {
            assignments: { 'team-a': 'north' },
            score: 1000,
          },
          alternatives: [],
        },
      }),
    })
  })

  await page.goto('/uk/decision-intake')
  const dropzone = page.getByTestId('decision-intake-dropzone')
  const csv = ['community,team_id,capacity,demand,service,priority,budget', 'north,team-a,10,8,medical,high,100'].join(
    '\n'
  )
  await dropzone.evaluate((element, contents) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([contents], 'auto-ra.csv', { type: 'text/csv' }))
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }))
  }, csv)
  await page.getByRole('button', { name: 'Проаналізувати дані' }).click()

  await expect(page.getByTestId('decision-intake-formalization')).toBeVisible()
  await expect(page.getByText(/1000\*priority_coverage/)).toBeVisible()
  await expect(page.getByText('skills = all_demand_services')).toBeVisible()
  await expect(page.getByText('travel = zero_cost_unrestricted')).toBeVisible()
  await expect(page.getByText('operation = optimize')).toBeVisible()
  await expect(page.getByTestId('decision-intake-timing-community')).toContainText('pre_decision')
  await expect(page.getByTestId('decision-intake-timing-budget')).toContainText('pre_decision')
  await expect(page.getByTestId('decision-intake-accept-formalization')).toBeDisabled()
  await page.getByTestId('formalization-objective-objective:resource_allocation_score').check()
  await page.getByTestId('decision-intake-review-timing').check()
  await page.getByTestId('decision-intake-accept-formalization').click()

  await expect(page.getByTestId('decision-intake-execute')).toBeVisible()
  await page.getByTestId('decision-intake-execute').click()
  await expect(page.getByTestId('decision-intake-executed')).toBeVisible()
  await expect(page.getByText(/team-a/)).toBeVisible()
  await expect(page.getByText(/north/)).toBeVisible()
})
