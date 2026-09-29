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
        candidate_id: 'semantic-action',
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
    candidates: [],
    information_set: [],
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
