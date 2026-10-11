import { expect, test } from '@playwright/test'

// Browser transport tests with mocked Core responses. Production Zitadel,
// Mongo and actual CP-SAT acceptance remain separate pinned E2E gates.
const pageUrl = 'http://observatory.localhost:3000/en/readiness-recovery'
const request = { operational: { decision_id: 'synthetic-economic-001' }, snapshot_id: 'synthetic-v2' }
const compiled = {
  schema_version: 'readiness-recovery.economic-preflight.v2',
  economic_version: 'readiness-recovery.economic-state.v2',
  decision_id: 'synthetic-economic-001',
  ir_semantic_hash: 'f'.repeat(64),
  job_count: 2,
  asset_count: 3,
  procurement_offer_count: 1,
  donor_extraction_count: 1,
  state: 'COMPILED_PREVIEW_ONLY',
  actionable: false,
  supply_source_verified: false,
  atomic_plan_committed: false,
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/rr-operator/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: true, authenticated: true, mode: 'zitadel-oidc' }),
    })
  )
})

test('economic preview transports unchanged input and never offers execute or ordering', async ({ page }) => {
  const sent: unknown[] = []
  await page.route('**/api/rr-operator/kernel/economic-v2/preflight', (route) => {
    sent.push(JSON.parse(route.request().postData() ?? '{}') as unknown)
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(compiled) })
  })
  const intercepted: string[] = []
  page.on('request', (outgoing) => {
    if (
      outgoing.url().includes('/api/rr-operator/kernel/economic-v2/') &&
      !outgoing.url().endsWith('/economic-v2/preflight')
    )
      intercepted.push(outgoing.url())
  })

  await page.goto(pageUrl)
  await page.getByLabel('RR-ECON-v2 JSON').fill(JSON.stringify(request))
  await page.getByRole('button', { name: 'Validate in Core (no execution)' }).click()
  const result = page.getByTestId('rr-economic-v2-result')
  await expect(result).toContainText('Core compiled preview only')
  await expect(result).toContainText('Jobs: 2')
  await expect(result).toContainText('f'.repeat(64))
  await expect(result).toHaveAttribute('data-actionable', 'false')
  await expect(page.getByTestId('rr-economic-v2-warning')).toContainText('NOT ACTIONABLE')
  expect(sent).toEqual([request])
  expect(intercepted).toEqual([])
  await expect(page.getByRole('button', { name: /place order|apply plan|execute economic/i })).toHaveCount(0)
})

test('response with a different decision ID or fabricated action cannot be presented', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/economic-v2/preflight', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...compiled, decision_id: 'someone-else', actionable: true }),
    })
  )
  await page.goto(pageUrl)
  await page.getByLabel('RR-ECON-v2 JSON').fill(JSON.stringify(request))
  await page.getByRole('button', { name: 'Validate in Core (no execution)' }).click()
  await expect(page.getByRole('alert')).toContainText('incompatible')
  await expect(page.getByTestId('rr-economic-v2-result')).toHaveCount(0)
})

test('changed request prevents delayed stale Core preview', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/economic-v2/preflight', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(compiled) }).catch(() => {})
  })
  await page.goto(pageUrl)
  await page.getByLabel('RR-ECON-v2 JSON').fill(JSON.stringify(request))
  await page.getByRole('button', { name: 'Validate in Core (no execution)' }).click()
  await page.getByLabel('RR-ECON-v2 JSON').fill(JSON.stringify({
    ...request,
    operational: { decision_id: 'updated-economic-002' },
  }))
  await page.waitForTimeout(400)
  await expect(page.getByTestId('rr-economic-v2-result')).toHaveCount(0)
})

test('invalid JSON never reaches the backend; rejected Core input never shows a preview', async ({ page }) => {
  let calls = 0
  await page.route('**/api/rr-operator/kernel/economic-v2/preflight', (route) => {
    calls += 1
    return route.fulfill({ status: 422, contentType: 'application/json', body: '{}' })
  })
  await page.goto(pageUrl)
  await page.getByLabel('RR-ECON-v2 JSON').fill('not-json')
  await page.getByRole('button', { name: 'Validate in Core (no execution)' }).click()
  await expect(page.getByRole('alert')).toContainText('valid RREconomicInput')
  expect(calls).toBe(0)
  await page.getByLabel('RR-ECON-v2 JSON').fill(JSON.stringify(request))
  await page.getByRole('button', { name: 'Validate in Core (no execution)' }).click()
  await expect(page.getByRole('alert')).toContainText('Core rejected')
  await expect(page.getByTestId('rr-economic-v2-result')).toHaveCount(0)
  expect(calls).toBe(1)
})


test('anonymous visitor cannot access the economic preflight editor', async ({ page }) => {
  await page.route('**/api/rr-operator/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: true, authenticated: false, mode: 'zitadel-oidc' }),
    })
  )
  await page.goto(pageUrl)
  await expect(page.getByTestId('rr-economic-v2-preflight')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sign in with Zitadel' })).toBeVisible()
})

test('Core 401 fails closed and cannot preserve a previous preview', async ({ page }) => {
  let calls = 0
  await page.route('**/api/rr-operator/kernel/economic-v2/preflight', (route) => {
    calls += 1
    return route.fulfill({
      status: calls === 1 ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify(calls === 1 ? compiled : { error: 'Operator login required' }),
    })
  })
  await page.goto(pageUrl)
  await page.getByLabel('RR-ECON-v2 JSON').fill(JSON.stringify(request))
  await page.getByRole('button', { name: 'Validate in Core (no execution)' }).click()
  await expect(page.getByTestId('rr-economic-v2-result')).toBeVisible()
  await page.getByRole('button', { name: 'Validate in Core (no execution)' }).click()
  await expect(page.getByTestId('rr-economic-v2-result')).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText('no longer authorized')
})
