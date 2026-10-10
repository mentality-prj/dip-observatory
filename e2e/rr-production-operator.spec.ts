import { readFileSync } from 'node:fs'
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

test('reference operator: Kernel execution, reasoned replan, durable history and replay', async ({ page }) => {
  test.setTimeout(180_000)
  test.skip(
    !process.env.RR_E2E_OPERATOR_PASSWORD || !process.env.RR_E2E_API_REQUEST_PATH,
    'Requires explicit operator credentials, live isolated Mongo RR backend and synthetic API request path'
  )
  const requestPath = process.env.RR_E2E_API_REQUEST_PATH!
  const original = JSON.parse(readFileSync(requestPath, 'utf8')) as {
    execution_id: string
    source: { captured_at: string; snapshot_id: string }
    ingested_at: string
    payload: {
      decision_id: string
      operator_directives?: { excluded_job_ids?: string[] }
    }
  }
  const unique = Date.now().toString(36)
  const now = new Date().toISOString()
  original.execution_id = `rr-e2e-${unique}-001`
  original.source.captured_at = now
  original.source.snapshot_id = `snapshot-${unique}`
  original.ingested_at = now
  original.payload.decision_id = `civilian-e2e-${unique}`

  await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
  const panel = page.getByTestId('rr-production-operator')
  await expect(panel).toBeVisible()
  await panel.getByLabel('Operator access password').fill(process.env.RR_E2E_OPERATOR_PASSWORD!)
  await panel.getByRole('button', { name: 'Unlock reference operator' }).click()
  await expect(panel.getByRole('button', { name: 'Sign out' })).toBeVisible()

  await panel.getByLabel('Kernel execution JSON').fill(JSON.stringify(original, null, 2))
  const [created] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/rr-operator/kernel/executions') && response.request().method() === 'POST'
    ),
    panel.getByRole('button', { name: 'Create execution', exact: true }).click(),
  ])
  expect(created.status()).toBe(201)
  const initialRecord = (await created.json()) as {
    organization_id?: string
    result?: { workflow?: { execution_id?: string } }
  }
  expect(initialRecord.organization_id).toBeTruthy()
  expect(initialRecord.result?.workflow?.execution_id).toBe(original.execution_id)

  const successorId = `rr-e2e-${unique}-002`
  const newer = new Date(Date.now() + 1000).toISOString()
  const replan = {
    execution_id: successorId,
    change_id: `rr-change-${unique}`,
    kind: 'OVERRIDE',
    reason: 'Exclude the invented sensor service pending operator review.',
    requested_at: newer,
    source: original.source,
    ingested_at: newer,
    payload: {
      ...original.payload,
      operator_directives: { excluded_job_ids: ['sensor-service'] },
    },
  }
  await panel.getByLabel('Kernel replan JSON').fill(JSON.stringify(replan, null, 2))
  const [replanned] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/rr-operator/kernel/executions/${original.execution_id}/replan`) &&
        response.request().method() === 'POST'
    ),
    panel.getByRole('button', { name: 'Replan from predecessor' }).click(),
  ])
  expect(replanned.status()).toBe(201)
  const revision = (await replanned.json()) as {
    result?: { workflow?: { execution_id?: string; change?: { predecessor_execution_id?: string } } }
  }
  expect(revision.result?.workflow?.execution_id).toBe(successorId)
  expect(revision.result?.workflow?.change?.predecessor_execution_id).toBe(original.execution_id)
  const [history] = await Promise.all([
    page.waitForResponse((response) => response.url().endsWith(`/decisions/${original.payload.decision_id}/history`)),
    panel.getByRole('button', { name: 'History', exact: true }).click(),
  ])
  expect(history.status()).toBe(200)
  const historical = (await history.json()) as { executions?: unknown[] }
  expect(historical.executions).toHaveLength(2)

  const [integrity] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith(`/decisions/${original.payload.decision_id}/history-integrity`)
    ),
    panel.getByRole('button', { name: 'Integrity' }).click(),
  ])
  expect(integrity.status()).toBe(200)
  expect(((await integrity.json()) as { complete_chain?: boolean }).complete_chain).toBe(true)

  await panel.getByRole('button', { name: 'Export complete history' }).click()
  await expect(panel.getByText('"export_complete": true', { exact: false }).last()).toBeVisible()

  const [replay] = await Promise.all([
    page.waitForResponse((response) => response.url().endsWith(`/executions/${successorId}/replay-verification`)),
    panel.getByRole('button', { name: 'Replay' }).click(),
  ])
  expect(replay.status()).toBe(200)
  expect(((await replay.json()) as { verified?: boolean }).verified).toBe(true)

  await panel.getByRole('button', { name: 'Sign out' }).click()
  const denied = await page.request.get(`${ORIGIN}/api/rr-operator/kernel/executions/${successorId}`)
  expect(denied.status()).toBe(401)
})
