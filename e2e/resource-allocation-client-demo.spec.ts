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

  await page.getByRole('button', { name: 'Calculate weekly plan' }).click()
  await expect(page.getByText('Where to send teams each day')).toBeVisible()
  expect(sawResponsibleCitizensInput).toBe(true)

  await page.getByRole('button', { name: 'Create immutable decision snapshot' }).click()
  await expect(page.getByText('Decision ID · demo-decision-1')).toBeVisible()
  await expect(page.getByText('resource-allocation/0.6.0 · 0.6.0')).toBeVisible()

  await page.getByRole('button', { name: 'Accept DIP plan' }).click()
  await expect(page.getByText('ACCEPTED', { exact: true })).toBeVisible()

  await page.getByPlaceholder('What actually happened after the decision was executed').fill('Executed as planned')
  await page.getByRole('button', { name: 'Record actual outcome' }).click()
  await expect(page.getByText('Decision completed.')).toBeVisible()
  await expect(page.getByText('Actual outcome recorded')).toBeVisible()
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

  await page.getByRole('button', { name: 'Calculate weekly plan' }).click()
  await expect(page.getByText('Where to send teams each day')).toBeVisible()
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
  await expect(page.getByText('Drop the file to import')).toBeVisible()

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
})
