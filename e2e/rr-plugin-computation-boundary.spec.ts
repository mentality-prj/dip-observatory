import { expect, test } from '@playwright/test'

const PAGE_URL = 'http://observatory.localhost:3000/en/readiness-recovery'
const request = {
  execution_id: 'plugin-only-001',
  source: {
    source_system: 'synthetic',
    snapshot_id: 'snapshot-001',
    source_version: 'v1',
    captured_at: '2026-10-10T08:00:00Z',
  },
  ingested_at: '2026-10-10T08:00:00Z',
  payload: {
    decision_id: 'plugin-only-decision',
    horizon_slots: 6,
    workshop_capacity: 2,
    jobs: [
      { id: 'job-1', duration_slots: 1, required_skills: ['mechanical'], deadline_slot: 4, readiness_gain_units: 100 },
    ],
    technicians: [{ id: 'tech-1', skills: ['mechanical'], available_slots: [0, 1, 2, 3, 4, 5] }],
  },
}
const preflight = {
  schema_version: 'readiness-recovery.presentation.v1',
  validation_scope: 'SCHEMA_AND_ADMISSION_ONLY',
  accepted_for_kernel_submission: true,
  execution_id: request.execution_id,
  decision_id: request.payload.decision_id,
  source_system: request.source.source_system,
  source_snapshot_id: request.source.snapshot_id,
  source_version: request.source.source_version,
  payload_digest: 'a'.repeat(64),
  job_count: 1,
  technician_count: 1,
  inventory_item_types: 0,
  donor_count: 0,
  horizon_slots: 6,
  workshop_capacity: 2,
  warning: 'NOT_EXECUTION_OR_FEASIBILITY_PROOF',
}
const projection = {
  schema_version: 'readiness-recovery.presentation.v1',
  computation_authority: 'QDIP_KERNEL_RR_V1',
  execution_id: request.execution_id,
  decision_id: request.payload.decision_id,
  source_system: request.source.source_system,
  source_snapshot_id: request.source.snapshot_id,
  source_version: request.source.source_version,
  payload_digest: 'a'.repeat(64),
  change_kind: 'INITIAL',
  predecessor_execution_id: null,
  outcome_kind: 'OPTIMAL_DECISION',
  backend_status: 'OPTIMAL',
  authoritative: true,
  actionable: true,
  summary: 'Kernel optimal schedule',
  scheduled_jobs: [{ job_id: 'job-1', technician_id: 'tech-1', start_slot: 0, finish_slot: 1 }],
  selected_donor_ids: [],
  scheduled_job_count: 1,
  job_count: 1,
  technician_count: 1,
  probability_demand_satisfied: null,
  probability_confidence_interval: null,
  field_verified: false,
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/rr-operator/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: true, authenticated: true, mode: 'single-organization-reference' }),
    })
  )
})

test('web does not calculate or approve RR input when plugin preflight rejects it', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/preflight', (route) =>
    route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { code: 'invalid_rr_plugin_schema' } }),
    })
  )
  await page.goto(PAGE_URL)
  await page.getByLabel('Kernel execution JSON').fill(JSON.stringify(request))
  await expect(page.getByTestId('rr-kernel-preflight')).toContainText('Server preflight')
  await expect(page.getByRole('button', { name: 'Create execution', exact: true })).toBeDisabled()
  await expect(page.getByTestId('rr-kernel-evidence')).toHaveCount(0)
})

test('server-owned preflight and stored evidence are rendered without any browser solver', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/preflight', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(preflight) })
  )
  let sentInput: unknown = null
  await page.route('**/api/rr-operator/kernel/executions', async (route) => {
    sentInput = JSON.parse(route.request().postData() ?? '{}') as unknown
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          workflow: {
            execution_id: request.execution_id,
            ingestion: { payload_digest: 'a'.repeat(64), payload: { decision_id: request.payload.decision_id } },
          },
        },
      }),
    })
  })
  await page.route('**/api/rr-operator/kernel/executions/plugin-only-001/presentation', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(projection) })
  )
  await page.goto(PAGE_URL)
  await page.getByLabel('Kernel execution JSON').fill(JSON.stringify(request))
  await expect(page.getByTestId('rr-kernel-preflight')).toContainText('Kernel preflight')
  await page.getByRole('button', { name: 'Create execution', exact: true }).click()
  await expect(page.getByTestId('rr-kernel-evidence')).toContainText('snapshot-001')
  await expect(page.getByTestId('rr-kernel-evidence')).toContainText('job-1')
  await expect(page.getByTestId('rr-decision-first')).toBeVisible()
  await expect(page.getByTestId('rr-kernel-schedule')).toBeVisible()
  await page.route('**/api/rr-operator/kernel/decisions/plugin-only-decision/history', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ decision_id: request.payload.decision_id, executions: [] }),
    })
  )
  await page.getByRole('button', { name: 'History', exact: true }).click()
  await expect(page.getByTestId('rr-kernel-evidence')).toContainText('snapshot-001')
  expect(sentInput).toEqual(request)
})

test('mismatched normalized input digest is rejected even with the same execution ID', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/preflight', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(preflight) })
  )
  await page.route('**/api/rr-operator/kernel/executions', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          workflow: {
            execution_id: request.execution_id,
            ingestion: {
              payload_digest: 'b'.repeat(64),
              payload: { decision_id: request.payload.decision_id },
            },
          },
        },
      }),
    })
  )
  await page.goto(PAGE_URL)
  await page.getByLabel('Kernel execution JSON').fill(JSON.stringify(request))
  await expect(page.getByRole('button', { name: 'Create execution', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Create execution', exact: true }).click()
  await expect(page.locator('p[role="alert"][data-error-kind]')).toContainText('Kernel response was not valid')
  await expect(page.getByTestId('rr-kernel-evidence')).toHaveCount(0)
})

test('transport-only multi-page export preserves server attestation and page order', async ({ page }) => {
  await page.goto(PAGE_URL)
  await page.getByLabel('Decision ID').fill(request.payload.decision_id)
  const path = '**/api/rr-operator/kernel/decisions/plugin-only-decision/history/verified-export-page*'
  const calls: string[] = []
  await page.route(path, (route) => {
    const next = new URL(route.request().url())
    const cursor = next.searchParams.get('cursor')
    calls.push(cursor ?? 'start')
    const final = cursor === 'rr-exec-001'
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schema_version: 'readiness-recovery.presentation.v1',
        decision_id: request.payload.decision_id,
        head_execution_id: 'rr-exec-002',
        history_manifest_digest: 'a'.repeat(64),
        executions: [{ result: { workflow: { execution_id: final ? 'rr-exec-002' : 'rr-exec-001' } } }],
        next_cursor: final ? null : 'rr-exec-001',
        export_complete: final,
        history_verified: true,
      }),
    })
  })
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export complete history' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('rr-history-plugin-only-decision.json')
  expect(calls).toEqual(['start', 'rr-exec-001'])
  await expect(page.getByText('"history_verified": true', { exact: false })).toHaveCount(1)
})

test('changed decision head refuses complete download', async ({ page }) => {
  await page.goto(PAGE_URL)
  await page.getByLabel('Decision ID').fill(request.payload.decision_id)
  await page.route(
    '**/api/rr-operator/kernel/decisions/plugin-only-decision/history/verified-export-page*',
    (route) => {
      const cursor = new URL(route.request().url()).searchParams.get('cursor')
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          schema_version: 'readiness-recovery.presentation.v1',
          decision_id: request.payload.decision_id,
          head_execution_id: cursor ? 'new-head' : 'original-head',
          history_manifest_digest: 'b'.repeat(64),
          executions: [{ result: { workflow: { execution_id: cursor ? 'rr-2' : 'rr-1' } } }],
          next_cursor: cursor ? null : 'rr-1',
          export_complete: Boolean(cursor),
          history_verified: true,
        }),
      })
    }
  )
  const downloads: string[] = []
  page.on('download', (file) => downloads.push(file.suggestedFilename()))
  await page.getByRole('button', { name: 'Export complete history' }).click()
  await expect(page.locator('p[role="alert"][data-error-kind]')).toContainText(
    'Kernel decision head changed during export'
  )
  expect(downloads).toEqual([])
})
