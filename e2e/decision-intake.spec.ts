import { expect, test } from '@playwright/test'

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
  await expect(page.getByText('Бізнес-контекст підтримує зіставлення поля «action» з роллю «дія».')).toBeVisible()
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
  await expect(page.getByText('Версія контракту:')).toBeVisible()
  await expect(page.getByText('2', { exact: true })).toBeVisible()

  await page.getByTestId('decision-intake-compile').click()
  await expect(page.getByTestId('decision-intake-compiled')).toBeVisible()
  await expect(page.getByText(/team-a/)).toBeVisible()
})
