import { expect, test } from '@playwright/test'
import { oidcTestCookies } from './oidc-test-session'

const origin = 'http://observatory.localhost:3000'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/rr-operator/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: true, authenticated: true, mode: 'test-session' }),
    })
  )
})
const locales = {
  en: { operations: 'RR operations', start: 'Start at', details: 'Evidence details' },
  uk: { operations: 'Операційний RR', start: 'Початкова секція', details: 'Деталізація доказів' },
  pl: { operations: 'Operacje RR', start: 'Widok początkowy', details: 'Szczegóły dowodów' },
} as const

for (const [locale, copy] of Object.entries(locales)) {
  test('UX-03: keyboard-friendly presets, safe preferences and locale ' + locale, async ({ page }) => {
    await page.goto(origin + '/' + locale + '/readiness-recovery')
    const prefs = page.getByTestId('rr-operator-preferences')
    await expect(prefs).toBeVisible()
    await expect(page.getByTestId('rr-workflow-steps')).toBeVisible()
    await prefs.getByRole('button', { name: copy.operations }).click()
    await prefs.getByLabel(copy.start).selectOption('REPLAN')
    await prefs.getByLabel(copy.details).selectOption('DETAILED')
    await prefs
      .getByRole('button', {
        name: locale === 'uk' ? 'Вище: EVIDENCE' : locale === 'pl' ? 'Wyżej: EVIDENCE' : 'Move up: EVIDENCE',
      })
      .click()
    await page.reload()
    await expect(prefs.getByLabel(copy.start)).toHaveValue('REPLAN')
    await expect(prefs.getByLabel(copy.details)).toHaveValue('DETAILED')
    const raw = await page.evaluate(() => localStorage.getItem('qdip.observatory.rr-kernel.view.v1'))
    expect(raw).toContain('"version":3')
    expect(raw).not.toContain('decision_id')
    expect(raw).not.toContain('payload')
    expect(raw).not.toContain('organization')
    expect(raw).not.toContain('token')
  })
}

test('UX-03: invalid and private-data preferences reset safely', async ({ page }) => {
  await page.goto(origin + '/en/readiness-recovery')
  await page.evaluate(() => {
    localStorage.setItem(
      'qdip.observatory.rr-kernel.view.v1',
      JSON.stringify({
        version: 3,
        panels: ['EXECUTE', 'REPLAN', 'EVIDENCE'],
        metrics: ['INPUT_JOBS'],
        density: 'COMPACT',
        startPanel: 'EVIDENCE',
        details: 'DETAILED',
        tenantId: 'other-org',
      })
    )
  })
  await page.reload()
  await expect(page.getByTestId('rr-operator-preferences').getByLabel('Start at')).toHaveValue('EXECUTE')
  const stored = await page.evaluate(() => localStorage.getItem('qdip.observatory.rr-kernel.view.v1'))
  expect(stored).not.toContain('tenantId')
})

test('UX-03: unauthorized role cannot display protected RR dashboard or preferences', async ({ page }) => {
  await page.context().clearCookies()
  await page.context().addCookies(oidcTestCookies(['studio']))
  await page.goto(origin + '/en/readiness-recovery')
  await expect(page.getByTestId('qdip-access-gate')).toBeVisible()
  await expect(page.getByTestId('rr-operator-preferences')).toHaveCount(0)
  await expect(page.getByTestId('rr-production-operator')).toHaveCount(0)
})

test('UX-01/02: small-screen workflow keeps Core trust and review non-actionable', async ({ page }) => {
  const projection = {
    schema_version: 'readiness-recovery.presentation.v1',
    computation_authority: 'QDIP_KERNEL_RR_V1',
    execution_id: 'mobile-001',
    decision_id: 'mobile-decision',
    source_system: 'workshop',
    source_snapshot_id: 'sample-001',
    source_version: 'v1',
    payload_digest: 'a'.repeat(64),
    change_kind: 'INITIAL',
    predecessor_execution_id: null,
    outcome_kind: 'TIME_LIMIT',
    backend_status: 'TIME_LIMIT',
    authoritative: false,
    actionable: false,
    summary: 'No certified decision',
    scheduled_jobs: [],
    selected_donor_ids: [],
    scheduled_job_count: 0,
    job_count: 1,
    technician_count: 1,
    probability_demand_satisfied: null,
    probability_confidence_interval: null,
    field_verified: false,
  }
  await page.route('**/api/rr-operator/kernel/executions/mobile-001/presentation', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(projection) })
  )
  await page.setViewportSize({ width: 375, height: 780 })
  await page.goto(origin + '/uk/readiness-recovery')
  await page.getByLabel('Ідентифікатор виконання').first().fill('mobile-001')
  await page.getByRole('button', { name: 'Переглянути збережене виконання' }).click()
  const evidence = page.getByTestId('rr-decision-first')
  await expect(evidence).toBeVisible()
  await expect(page.getByTestId('rr-decision-review')).toContainText('не наказ на виконання')
  await expect(page.getByTestId('rr-decision-review')).toContainText('P10/P50/P90')
  await expect(page.getByTestId('rr-outcome-guidance')).toContainText('Недопустимість не доведена')
  await expect(page.getByTestId('rr-execution-comparison')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Apply$/ })).toHaveCount(0)
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(385)
})
