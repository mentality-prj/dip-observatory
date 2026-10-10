import { expect, test } from '@playwright/test'

const URL = 'http://observatory.localhost:3000/en/readiness-recovery'
const request = {
  execution_id: 'plugin-only-001',
  source: { source_system: 'synthetic', snapshot_id: 'snapshot-001', source_version: 'v1', captured_at: '2026-10-10T08:00:00Z' },
  ingested_at: '2026-10-10T08:00:00Z',
  payload: { decision_id: 'plugin-only-decision', horizon_slots: 6, workshop_capacity: 2, jobs: [{}], technicians: [{}] },
}
const preflight = {
  schema_version: 'readiness-recovery.presentation.v1',
  validation_scope: 'SCHEMA_AND_ADMISSION_ONLY',
  execution_id: request.execution_id,
  decision_id: request.payload.decision_id,
  source_snapshot_id: request.source.snapshot_id,
  job_count: 1,
  technician_count: 1,
  warning: 'NOT_EXECUTION_OR_FEASIBILITY_PROOF',
}
const projection = {
  schema_version: 'readiness-recovery.presentation.v1',
  computation_authority: 'QDIP_KERNEL_RR_V1',
  execution_id: request.execution_id, decision_id: request.payload.decision_id,
  source_system: request.source.source_system, source_snapshot_id: request.source.snapshot_id,
  source_version: request.source.source_version, payload_digest: 'abcdef',
  change_kind: 'INITIAL', predecessor_execution_id: null, outcome_kind: 'OPTIMAL_DECISION',
  backend_status: 'OPTIMAL', authoritative: true, actionable: true, summary: 'Kernel optimal schedule',
  scheduled_jobs: [{ job_id: 'job-1', technician_id: 'tech-1', start_slot: 0, finish_slot: 1 }],
  selected_donor_ids: [], scheduled_job_count: 1, job_count: 1, technician_count: 1,
  probability_demand_satisfied: null, probability_confidence_interval: null, field_verified: false,
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/rr-operator/session', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ configured: true, authenticated: true, mode: 'single-organization-reference' }) }))
})

test('web does not calculate or approve RR input when plugin preflight rejects it', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/preflight', (route) =>
    route.fulfill({ status: 422, contentType: 'application/json',
      body: JSON.stringify({ detail: { code: 'invalid_rr_plugin_schema' } }) }))
  await page.goto(URL)
  await page.getByLabel('Kernel execution JSON').fill(JSON.stringify(request))
  await expect(page.getByTestId('rr-kernel-preflight')).toContainText('Server preflight')
  await expect(page.getByRole('button', { name: 'Create execution', exact: true })).toBeDisabled()
  await expect(page.getByTestId('rr-kernel-evidence')).toHaveCount(0)
})

test('server-owned preflight and stored evidence are rendered without any browser solver', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/preflight', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(preflight) }))
  let sentInput: unknown = null
  await page.route('**/api/rr-operator/kernel/executions', async (route) => {
    sentInput = JSON.parse(route.request().postData() ?? '{}') as unknown
    await route.fulfill({ status: 201, contentType: 'application/json',
      body: JSON.stringify({ result: { workflow: { execution_id: request.execution_id,
        ingestion: { payload: { decision_id: request.payload.decision_id } } } } }) })
  })
  await page.route('**/api/rr-operator/kernel/executions/plugin-only-001/presentation', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(projection) }))
  await page.goto(URL)
  await page.getByLabel('Kernel execution JSON').fill(JSON.stringify(request))
  await expect(page.getByTestId('rr-kernel-preflight')).toContainText('Kernel preflight')
  await page.getByRole('button', { name: 'Create execution', exact: true }).click()
  await expect(page.getByTestId('rr-kernel-evidence')).toContainText('snapshot-001')
  await expect(page.getByTestId('rr-kernel-evidence')).toContainText('job-1')
  expect(sentInput).toEqual(request)
})

test('complete-history download is issued only after backend verification', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/preflight', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(preflight) }))
  await page.route('**/api/rr-operator/kernel/decisions/plugin-only-decision/history/export-complete', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      schema_version: 'readiness-recovery.presentation.v1',
      decision_id: request.payload.decision_id, head_execution_id: request.execution_id,
      executions: [{ result: { workflow: { execution_id: request.execution_id } } }],
      export_complete: true, history_verified: true,
    }) }))
  await page.goto(URL)
  await page.getByLabel('Decision ID').fill(request.payload.decision_id)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export complete history' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('rr-history-plugin-only-decision.json')
})
