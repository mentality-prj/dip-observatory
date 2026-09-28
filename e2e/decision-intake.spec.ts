import { expect, test } from '@playwright/test'

const analysis = {
  profile: {
    source_hash: 'test-source',
    row_count: 2,
    column_count: 2,
    columns: [],
    candidate_entity_columns: [],
    candidate_time_columns: [],
    duplicate_rows: 0,
    warnings: [],
  },
  interpretation: {
    candidates: [
      {
        field: 'action',
        role: 'action',
        source_columns: ['action'],
        reason: 'English AI reason that must not leak into the Ukrainian UI.',
        status: 'inferred',
      },
    ],
    unknowns: [],
    ambiguities: [],
    clarification_questions: ['Legacy English question that should not be rendered.'],
    assumptions: ['English assumption that must not leak into the Ukrainian UI.'],
    provider: 'deterministic',
    model: null,
  },
  contract: {
    contract_id: 'test-contract',
    version: 1,
    source_hash: 'test-source',
    archetype: 'unknown',
    candidates: [],
    information_set: [],
    assumptions: ['English assumption that must not leak into the Ukrainian UI.'],
    unknowns: [],
    validation_status: 'discovered',
  },
  evidence_gate: {
    status: 'discovered',
    reasons: ['Legacy English evidence reason.'],
    reason_codes: ['reason.verified_critical_semantics_missing'],
    missing_evidence: [],
    blocking_assumptions: [],
    recommended_next_step: 'Legacy English next step that should not be rendered.',
    recommended_next_step_code: 'next.confirm_controllable_action_and_business_objective',
  },
  semantic_codes: {
    clarification_questions: [
      'question.controllable_action',
      'question.business_objective',
      'question.binding_constraints',
      'question.decision_time_information',
      'question.realized_outcome',
    ],
  },
}

test('Decision Intake reuses uploader UI and localizes semantic codes without English prose leakage', async ({ page }) => {
  await page.route('**/api/decision-intake/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(analysis),
    })
  })

  await page.goto('/uk/decision-intake')

  const dropzone = page.getByTestId('decision-intake-dropzone')
  const csv = ['action,outcome', 'keep,10'].join('\n')

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
  await expect(page.getByText('Виявлено')).toBeVisible()
  await expect(page.getByText('Підтвердьте керовану дію та бізнес-мету.')).toBeVisible()
  await expect(page.getByText('Гіпотеза, визначена ШІ; потрібне підтвердження людиною.')).toBeVisible()
  await expect(page.getByText('1 неструктурованих припущень моделі потребують перевірки.')).toBeVisible()

  await expect(page.getByText('Legacy English question that should not be rendered.')).toHaveCount(0)
  await expect(page.getByText('Legacy English next step that should not be rendered.')).toHaveCount(0)
  await expect(page.getByText('English AI reason that must not leak into the Ukrainian UI.')).toHaveCount(0)
  await expect(page.getByText('English assumption that must not leak into the Ukrainian UI.')).toHaveCount(0)
})
