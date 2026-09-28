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
    candidates: [],
    unknowns: [],
    ambiguities: [],
    clarification_questions: [
      'Which field represents the action a decision maker can control?',
      'What business objective should QDIP optimize?',
      'Which constraints were known and binding at decision time?',
      'Which fields were available before the action was chosen?',
      'Which field records the realized outcome?',
    ],
    assumptions: [],
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
    assumptions: [],
    unknowns: [],
    validation_status: 'discovered',
  },
  evidence_gate: {
    status: 'discovered',
    reasons: [],
    missing_evidence: [],
    blocking_assumptions: [],
    recommended_next_step: 'Confirm the controllable action and business objective.',
  },
}

test('Decision Intake reuses drag and drop and localizes runtime evidence text', async ({ page }) => {
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

  await expect(page.getByTestId('decision-intake-file')).toHaveText('decision.csv')
  await page.getByRole('button', { name: 'Проаналізувати дані' }).click()

  await expect(page.getByText('Яке поле відповідає дії, яку може контролювати особа, що приймає рішення?')).toBeVisible()
  await expect(page.getByText('Яку бізнес-мету має оптимізувати QDIP?')).toBeVisible()
  await expect(page.getByText('Які обмеження були відомі та обов’язкові на момент прийняття рішення?')).toBeVisible()
  await expect(page.getByText('Які поля були доступні до вибору дії?')).toBeVisible()
  await expect(page.getByText('Яке поле фіксує фактичний результат?')).toBeVisible()
  await expect(page.getByText('Виявлено')).toBeVisible()
  await expect(page.getByText('Підтвердьте керовану дію та бізнес-мету.')).toBeVisible()
  await expect(page.getByText('Which field represents the action a decision maker can control?')).toHaveCount(0)
})
