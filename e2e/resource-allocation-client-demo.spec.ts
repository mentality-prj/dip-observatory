import { expect, test } from '@playwright/test'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const metrics = {
  priority_coverage: 0.86,
  total_coverage: 0.74,
  unmet_need: 28,
  capacity_utilization: 0.82,
  travel_cost: 24,
  operating_cost: 128,
}

function dayPlan(day: string) {
  return {
    day,
    status: 'ok',
    recommended: {
      assignments: {
        'Мобільна команда 1': 'Краматорський напрямок',
        'Мобільна команда 2': 'Покровський напрямок',
        'Мобільна команда 3': 'Слов’янський напрямок',
        'Мобільна команда 4': 'Запорізький хаб',
        'Мобільна команда 5': 'Дніпровський хаб',
      },
      metrics,
      evidence: [],
    },
    demand: { opening: 128, served: 100, closing_unmet: 28 },
  }
}

const allocationResult = {
  status: 'ok',
  daily: days.map(dayPlan),
  aggregate_metrics: metrics,
  demand_summary: { total_available: 128, served: 100, closing_unmet: 28 },
  alternatives: [
    {
      daily: days.map(dayPlan),
      aggregate_metrics: metrics,
      period_score: 1234,
      demand_summary: { total_available: 128, served: 100, closing_unmet: 28 },
    },
  ],
  solver: 'exact-branch-aware-period-search',
  search_space: 120,
  evaluated_plans: 24,
  engine_version: 'resource-allocation/0.6.0',
  evidence: ['Priority coverage = 86%', 'Travel constraints respected'],
}

test('Responsible Citizens demo is dynamic and completes decision lifecycle', async ({ page }) => {
  let sawResponsibleCitizensInput = false
  let status: 'proposed' | 'accepted' | 'completed' = 'proposed'
  const feedback: Array<Record<string, unknown>> = []
  const outcomes: Array<Record<string, unknown>> = []
  let recordedOutcomeBody: Record<string, unknown> = {}

  await page.route('**/api/resource-allocation/run', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    const communities = Array.isArray(body.communities) ? body.communities : []
    sawResponsibleCitizensInput = communities.some(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        (item as Record<string, unknown>).id === 'Краматорський напрямок'
    )
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ operation: 'simulate', scenario: body.scenario, result: allocationResult }),
    })
  })

  await page.route('**/api/resource-allocation/decisions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ decision_id: 'demo-decision-1', status: 'proposed', result: allocationResult }),
    })
  })

  await page.route('**/api/resource-allocation/decisions/demo-decision-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        decision_id: 'demo-decision-1',
        status,
        created_at: '2026-09-21T12:00:00Z',
        state_hash: '1234567890abcdef',
        engine_version: 'resource-allocation/0.6.0',
        plugin_version: '0.6.0',
        feedback,
        outcomes,
      }),
    })
  })

  await page.route('**/api/resource-allocation/decisions/demo-decision-1/feedback', async (route) => {
    status = 'accepted'
    feedback.push({
      status: 'accepted',
      timestamp: '2026-09-21T12:05:00Z',
      actor_id: 'api-key:demo',
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ decision_id: 'demo-decision-1', status }),
    })
  })

  await page.route('**/api/resource-allocation/decisions/demo-decision-1/outcomes', async (route) => {
    recordedOutcomeBody = route.request().postDataJSON() as Record<string, unknown>
    status = 'completed'
    outcomes.push({
      recorded_at: '2026-09-21T12:10:00Z',
      actor_id: 'api-key:demo',
      notes: 'Executed as planned',
      metrics: { priority_coverage: 0.86 },
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ decision_id: 'demo-decision-1', status }),
    })
  })

  await page.goto('/en/resource-allocation')

  await expect(page.getByTestId('resource-profile')).toHaveValue('responsible-citizens')
  await expect(page.getByTestId('community-count')).toHaveText('5')
  await expect(page.getByTestId('team-count')).toHaveText('5')

  const blocked = page.getByTestId('blocked-community')
  await expect(blocked).toContainText('Краматорський напрямок')
  await expect(blocked).not.toContainText('Громада A')
  await expect(blocked).toHaveCSS('color-scheme', 'dark')
  await expect(blocked).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')

  await page.getByRole('button', { name: 'Calculate recommended allocation' }).click()
  await expect(page.getByText(/Where to send teams · 5 days/)).toBeVisible()
  expect(sawResponsibleCitizensInput).toBe(true)

  await page.getByRole('button', { name: 'Accept QDIP recommendation' }).click()
  await expect(page.getByText(/Decision ID · demo-decision-1/)).toBeVisible()

  await page.getByLabel('Actual priority-needs coverage, %').fill('81')
  await page.getByLabel('Demand units actually covered').fill('96')
  await page.getByLabel('Demand units actually left uncovered').fill('32')
  await page.getByPlaceholder('What actually happened after the decision was executed').fill('Executed with one field change')
  await page.getByRole('button', { name: 'Record actual outcome' }).click()
  await expect(page.getByText('Decision completed.')).toBeVisible()
  await expect(page.getByText('Actual outcome recorded')).toBeVisible()
  expect(recordedOutcomeBody.metrics).toBeDefined()
  const recordedMetrics = recordedOutcomeBody.metrics as Record<string, unknown>
  expect(recordedMetrics.priority_coverage).toBe(0.81)
  expect(recordedMetrics.served).toBe(96)
  expect(recordedMetrics.closing_unmet).toBe(32)
})


test('Resource Allocation stays within a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })

  await page.route('**/api/resource-allocation/run', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'simulate',
        scenario: {},
        result: allocationResult,
      }),
    })
  })

  await page.goto('/en/resource-allocation')
  await expect(page.getByTestId('community-count')).toHaveText('5')
  await expect
    .poll(() =>
      page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
    )
    .toEqual({ scrollWidth: 390, clientWidth: 390 })

  await page.getByRole('button', { name: 'Calculate recommended allocation' }).click()
  await expect(page.getByText(/Where to send teams · 5 days/)).toBeVisible()
  await page.getByText('Test your own plan', { exact: true }).click()
  await expect(page.getByTestId('manual-mobile-cards')).toBeVisible()
  await expect(page.getByTestId('manual-desktop-table')).toBeHidden()

  await expect
    .poll(() =>
      page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
    )
    .toEqual({ scrollWidth: 390, clientWidth: 390 })
})


test('client data importer gives feedback and supports drag and drop', async ({ page }) => {
  await page.goto('/en/resource-allocation')
  await page.getByText('Try your own data', { exact: true }).click()

  const pickerCsv = [
    'record_type,id,community,service,units,priority,current_community,skills,capacity,max_teams,from,to,cost,minutes,days,budget',
    'community,Hub A,,,,,,,,2,,,,,,',
    'demand,,Hub A,psychosocial,12,high,,,,,,,,,,',
    'team,Team A,,,,,Hub A,psychosocial,10,,,,,,,',
    'settings,,,,,,,,,,,,,,,Mon|Tue|Wed|Thu|Fri,100',
  ].join('\n')

  const input = page.locator('input[type="file"]')
  await input.setInputFiles({
    name: 'picker-test.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(pickerCsv),
  })

  await expect(page.getByText('Dataset activated')).toBeVisible()
  await expect(page.getByTestId('resource-import-file')).toContainText('picker-test.csv')
  await expect(page.getByTestId('community-count')).toHaveText('1')
  await expect(page.getByTestId('team-count')).toHaveText('1')

  const dropCsv = [
    'record_type,id,community,service,units,priority,current_community,skills,capacity,max_teams,from,to,cost,minutes,days,budget',
    'community,Hub A,,,,,,,,2,,,,,,',
    'community,Hub B,,,,,,,,2,,,,,,',
    'demand,,Hub A,psychosocial,12,high,,,,,,,,,,',
    'demand,,Hub B,legal,8,normal,,,,,,,,,,',
    'team,Team A,,,,,Hub A,psychosocial|legal,10,,,,,,,',
    'team,Team B,,,,,Hub B,legal,8,,,,,,,',
    'settings,,,,,,,,,,,,,,,Mon|Tue|Wed|Thu|Fri,120',
  ].join('\n')

  const dropzone = page.getByTestId('resource-import-dropzone')

  await dropzone.evaluate((element, csv) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([csv], 'drop-test.csv', { type: 'text/csv' }))
    element.dispatchEvent(
      new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      })
    )
  }, dropCsv)

  await expect(dropzone).toHaveAttribute('data-dragging', 'true')
  await expect(page.getByTestId('resource-import-drag-prompt')).toContainText('Drop the file to import')

  await dropzone.evaluate((element, csv) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([csv], 'drop-test.csv', { type: 'text/csv' }))
    element.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      })
    )
  }, dropCsv)

  await expect(page.getByText('Dataset activated')).toBeVisible()
  await expect(page.getByTestId('resource-import-file')).toContainText('drop-test.csv')
  await expect(page.getByTestId('community-count')).toHaveText('2')
  await expect(page.getByTestId('team-count')).toHaveText('2')
  await expect(page.getByTestId('resource-data-source')).toContainText('Imported dataset · drop-test.csv')
  await expect(page.getByTestId('resource-active-summary')).toContainText(
    '2 teams. 2 communities. 20 demand units. 5 days.'
  )
})


test('capacity gap handles success and non-JSON backend errors', async ({ page }) => {
  let capacityCalls = 0

  await page.route('**/api/resource-allocation/run', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'simulate',
        scenario: {},
        result: allocationResult,
      }),
    })
  })

  await page.route('**/api/resource-allocation/capacity-gap', async (route) => {
    capacityCalls += 1
    if (capacityCalls === 1) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          operation: 'capacity_gap',
          current: { priority_coverage: 0.86 },
          target_priority_coverage: 0.9,
          gap_to_target: 0.04,
          target_status: 'gap',
          minimum_capacity_to_target: [
            {
              resource: 'psychosocial',
              extra_team_equivalents: 1,
              added_capacity: 16,
              priority_coverage: 0.91,
              delta_priority_coverage: 0.05,
              marginal_gain: 0.05,
              diminishing_returns: false,
              target_reached: true,
            },
          ],
          bottlenecks: [],
          marginal_scenarios: [],
        }),
      })
      return
    }

    await route.fulfill({
      status: 502,
      contentType: 'text/plain',
      body: 'An error occurred while executing capacity analysis',
    })
  })

  await page.goto('/en/resource-allocation')
  await page.getByRole('button', { name: 'Calculate recommended allocation' }).click()

  await page.getByText('WHAT IS NEEDED FOR A BETTER RESULT', { exact: true }).click()

  const analyze = page.getByRole('button', {
    name: 'Calculate required resources',
  })

  await analyze.click()
  await expect(page.getByText('Gap to target')).toBeVisible()
  await expect(page.getByText('psychosocial')).toBeVisible()

  await analyze.click()
  await expect(
    page.getByText('An error occurred while executing capacity analysis')
  ).toBeVisible()
  await expect(page.getByText(/Unexpected token/)).toHaveCount(0)
})
