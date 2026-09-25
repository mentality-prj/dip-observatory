import { expect, test } from '@playwright/test'

const run = {
  id: 'run-1',
  challenge_id: 'resource-allocation-v1',
  challenge_version: '1',
  status: 'DECIDING',
  snapshot: {
    snapshot_id: 'snapshot',
    snapshot_hash: 'snapshot',
    problem_id: 'problem',
    problem_hash: 'problem-hash',
    problem: {
      budget: 100,
      teams: [
        { id: 'alpha', current_community: 'north', allowed_communities: ['north', 'south'], skills: ['medical'], capacity: 10 },
        { id: 'bravo', current_community: 'south', allowed_communities: ['north', 'south'], skills: ['food'], capacity: 10 },
      ],
      communities: [
        { id: 'north', max_teams: 2, demand: [{ service: 'medical', units: 20, priority: 'critical' }] },
        { id: 'south', max_teams: 2, demand: [{ service: 'food', units: 20, priority: 'high' }] },
      ],
    },
    evidence_refs: [],
    evidence_revision: 'evidence',
    economic_model_hash: 'economics',
    model_versions_hash: 'versions',
    created_at: '2026-09-25T10:00:00Z',
  },
  result: null,
  created_at: '2026-09-25T10:00:00Z',
  updated_at: '2026-09-25T10:00:00Z',
}

test('locks the human choice before revealing QDIP comparison', async ({ page }) => {
  await page.route('**/api/decision-challenge', (route) =>
    route.fulfill({
      json: [{ id: 'resource-allocation-v1', version: '1', title: 'Resource Allocation', description: 'Allocate teams', scenario: {}, limitations: ['Simulated nominal value.'] }],
    })
  )
  await page.route('**/api/decision-challenge/runs', (route) => route.fulfill({ json: run }))
  await page.route('**/api/decision-challenge/runs/run-1/validate', (route) =>
    route.fulfill({ json: { feasible: true, violations: [] } })
  )
  await page.route('**/api/decision-challenge/runs/run-1/decision', (route) =>
    route.fulfill({
      json: {
        ...run,
        status: 'COMPLETED',
        submission_id: 'submission',
        human_action_hash: 'human-hash',
        result: {
          snapshot_id: 'snapshot',
          snapshot_hash: 'snapshot',
          problem_id: 'problem',
          problem_hash: 'problem-hash',
          human_action_hash: 'human-hash',
          qdip_action: { alpha: 'south', bravo: 'north' },
          qdip_action_hash: 'qdip-hash',
          human_evaluation: { feasible: true },
          qdip_evaluation: { feasible: true },
          optimizer_score: 1,
          human_economic_outcome: { policy_id: 'human', policy_version: '1', decision_id: 'run-1', objective: { objective_id: 'value', metric_id: 'nominal', direction: 'maximize', unit: 'EUR', currency: 'EUR' }, nominal_value: 1200 },
          qdip_economic_outcome: { policy_id: 'qdip', policy_version: '1', decision_id: 'run-1', objective: { objective_id: 'value', metric_id: 'nominal', direction: 'maximize', unit: 'EUR', currency: 'EUR' }, nominal_value: 1100 },
          economic_comparison: { delta: { nominal_delta: -100 } },
          available_economic_metrics: ['nominal_value'],
          explanation: [],
          reproducibility: { solver: 'exact', solver_version: '1', solver_config: {}, solver_config_hash: 'config', deterministic: true, reproducibility_token: 'replay' },
          evaluation_reproducibility: { evaluator_id: 'shared', evaluator_version: '1', context_hash: 'evaluation-context', common_random_numbers: false },
          data_quality_warnings: [],
        },
      },
    })
  )

  await page.route('**/api/decision-challenge/runs/run-1', (route) => route.fulfill({ json: run }))
  await page.goto('/en/challenges')
  await expect(page.getByTestId('challenge-comparison')).toHaveCount(0)
  await page.getByRole('button', { name: 'Check constraints' }).click()
  await page.getByRole('button', { name: 'Lock my decision' }).click()
  await expect(page.getByTestId('challenge-comparison')).toBeVisible()
  await expect(page.getByText('Your decision has the higher modeled value.')).toBeVisible()
  await expect(page.getByText('Expected value and probability risk are not shown')).toBeVisible()
})


test('rejects oversized challenge uploads at the public proxy boundary', async ({ request }) => {
  const response = await request.post('/api/decision-challenge/runs', {
    headers: { 'content-length': '1200000', 'content-type': 'application/json' },
    data: { challenge_id: 'resource-allocation-v1' },
  })
  expect(response.status()).toBe(413)
})
