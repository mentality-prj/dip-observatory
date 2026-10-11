import { expect, test } from '@playwright/test'

const pageUrl = 'http://observatory.localhost:3000/en/readiness-recovery'
const previous = {
  schema_version: 'readiness-recovery.presentation.v1',
  computation_authority: 'QDIP_KERNEL_RR_V1',
  execution_id: 'rr-001',
  decision_id: 'rr-decision',
  source_system: 'workshop',
  source_snapshot_id: 'snapshot-001',
  source_version: 'v1',
  payload_digest: 'a'.repeat(64),
  change_kind: 'INITIAL',
  predecessor_execution_id: null,
  outcome_kind: 'OPTIMAL_DECISION',
  backend_status: 'OPTIMAL',
  authoritative: true,
  actionable: true,
  summary: 'Kernel schedule',
  scheduled_jobs: [{ job_id: 'job-1', technician_id: 'tech-1', start_slot: 0, finish_slot: 1 }],
  selected_donor_ids: [],
  scheduled_job_count: 1,
  job_count: 1,
  technician_count: 1,
  probability_demand_satisfied: null,
  probability_confidence_interval: null,
  field_verified: false,
}
const current = {
  ...previous,
  execution_id: 'rr-002',
  predecessor_execution_id: 'rr-001',
  change_kind: 'REPLAN',
  source_snapshot_id: 'snapshot-002',
  payload_digest: 'b'.repeat(64),
  outcome_kind: 'INFEASIBLE',
  backend_status: 'INFEASIBLE',
  authoritative: true,
  actionable: false,
  summary: 'No feasible schedule in model',
  scheduled_jobs: [],
  scheduled_job_count: 0,
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/rr-operator/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: true, authenticated: true, mode: 'test-session' }),
    })
  )
})

test('retrieves server-owned predecessor, shows bounded comparison and does not persist private IDs', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/executions/rr-002/presentation', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(current) })
  )
  await page.route('**/api/rr-operator/kernel/executions/rr-001/presentation', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(previous) })
  )
  await page.goto(pageUrl)
  await page.getByLabel('Execution ID', { exact: true }).fill('rr-002')
  await page.getByRole('button', { name: 'Inspect saved execution' }).click()
  await expect(page.getByTestId('rr-execution-comparison')).toContainText('No ROI')
  await expect(page.getByTestId('rr-execution-comparison')).toContainText('snapshot-002')
  await expect(page.getByTestId('rr-outcome-guidance')).toContainText('No feasible schedule')
  await expect(page.getByTestId('rr-kernel-evidence')).toHaveAttribute('data-actionable', 'false')
  const preferences = await page.evaluate(() => localStorage.getItem('qdip.observatory.rr-kernel.view.v1'))
  expect(preferences).not.toContain('rr-002')
  expect(preferences).not.toContain('rr-decision')
})

test('mixed decision authority never produces a false comparison', async ({ page }) => {
  await page.route('**/api/rr-operator/kernel/executions/rr-002/presentation', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(current) })
  )
  await page.route('**/api/rr-operator/kernel/executions/rr-001/presentation', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...previous, decision_id: 'different-decision' }),
    })
  )
  await page.goto(pageUrl)
  await page.getByLabel('Execution ID', { exact: true }).fill('rr-002')
  await page.getByRole('button', { name: 'Inspect saved execution' }).click()
  await expect(page.getByTestId('rr-kernel-evidence')).toBeVisible()
  await expect(page.getByTestId('rr-execution-comparison')).toHaveCount(0)
})
