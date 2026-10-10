import { expect, test } from '@playwright/test'

const base = 'http://observatory.localhost:3000'

test('obsolete RR Monte Carlo route is not an alternative solver or result store', async ({ request }) => {
  const endpoint = base + '/readiness/scenarios/another-users-result'
  expect((await request.get(endpoint)).status()).toBe(410)
  const post = await request.post(base + '/readiness/scenarios', {
    data: { input: { scenarioId: 'untrusted', assets: [] } },
  })
  expect(post.status()).toBe(410)
  expect(((await post.json()) as { code: string }).code).toBe('RR_LEGACY_SOLVER_RETIRED')
})

for (const locale of ['en', 'uk', 'pl'] as const) {
  test(`Kernel-only operator respects ${locale} locale and never displays legacy simulator`, async ({ page }) => {
    await page.route('**/api/rr-operator/session', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ configured: true, authenticated: true, mode: 'single-organization-reference' }),
      })
    })
    await page.goto(`${base}/${locale}/readiness-recovery`)
    await expect(page.getByTestId('rr-kernel-only-workspace')).toBeVisible()
    await expect(page.getByTestId('rr-production-operator')).toBeVisible()
    const loginCopy = { en: 'Create Kernel execution', uk: 'Створити виконання Kernel', pl: 'Utwórz wykonanie Kernel' }
    await expect(page.getByRole('heading', { name: new RegExp(loginCopy[locale]) })).toBeVisible()
    await expect(page.getByTestId('rr-decision-summary')).toHaveCount(0)
  })
}

test('safe operator settings persist without private decisions', async ({ page }) => {
  await page.route('**/api/rr-operator/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: true, authenticated: true, mode: 'single-organization-reference' }),
    })
  )
  await page.goto(base + '/en/readiness-recovery')
  const prefs = page.getByTestId('rr-operator-preferences')
  await expect(prefs).toBeVisible()
  await prefs.getByRole('combobox', { name: 'Display density' }).selectOption('COMPACT')
  await prefs.getByRole('button', { name: 'Move up: EVIDENCE' }).click()
  await page.reload()
  await expect(prefs.getByRole('combobox', { name: 'Display density' })).toHaveValue('COMPACT')
  const stored = await page.evaluate(() => localStorage.getItem('qdip.observatory.rr-kernel.view.v1'))
  expect(stored).toContain('"COMPACT"')
  expect(stored).not.toContain('decision_id')
  expect(stored).not.toContain('password')
})

test('editing a Kernel request invalidates its obsolete delayed response', async ({ page }) => {
  await page.route('**/api/rr-operator/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: true, authenticated: true, mode: 'single-organization-reference' }),
    })
  )
  await page.route('**/api/rr-operator/kernel/executions', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350))
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        result: { workflow: { execution_id: 'old-result', ingestion: { payload: { decision_id: 'old-result' } } } },
      }),
    })
  })
  await page.goto(base + '/en/readiness-recovery')
  const input = page.getByLabel('Kernel execution JSON')
  await input.fill(
    '{"execution_id":"first","source":{},"ingested_at":"2026-10-11T00:00:00Z","payload":{"decision_id":"first"}}'
  )
  await page.getByRole('button', { name: 'Create execution', exact: true }).click()
  await input.fill(
    '{"execution_id":"second","source":{},"ingested_at":"2026-10-11T00:00:00Z","payload":{"decision_id":"second"}}'
  )
  await page.waitForTimeout(600)
  await expect(page.getByText('old-result')).toHaveCount(0)
  await expect(page.getByLabel('Execution ID')).toHaveValue('')
})
