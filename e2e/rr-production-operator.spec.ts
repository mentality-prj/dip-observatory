import { expect, test } from '@playwright/test'

const ORIGIN = 'http://observatory.localhost:3000'
const PAGE = `${ORIGIN}/uk/readiness-recovery`

test('production RR requires a logged-in operator, with no public API-key fallback', async ({ page }) => {
  const response = await page.request.get(`${ORIGIN}/api/rr-operator/kernel/executions/rr-reference-001`)
  expect([401, 403, 503]).toContain(response.status())
})

test('public RR demo does not expose a prior scenario through an anonymous GET', async ({ page }) => {
  const response = await page.request.get(`${ORIGIN}/readiness/scenarios/another-user-scenario`)
  expect(response.status()).toBe(410)
})

// The positive OIDC → Core → Mongo operator journey lives in the independent
// SHA-pinned real E2E suite. This browser CI must never skip a retired login.
test('legacy RR password login is rejected; anonymous operator writes stay closed', async ({ page }) => {
  const retired = await page.request.post(`${ORIGIN}/api/rr-operator/session`, {
    data: { password: 'obsolete-password' },
  })
  expect(retired.status()).toBe(410)

  const denied = await page.request.post(`${ORIGIN}/api/rr-operator/kernel/executions`, {
    data: { execution_id: 'forged-client', decision_id: 'forged-decision' },
    headers: { 'x-api-key': 'forged-browser-api-key' },
  })
  expect([401, 403, 503]).toContain(denied.status())
})
