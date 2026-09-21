import { expect, test } from '@playwright/test'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const aggregateMetrics = {
  priority_coverage: 0.455578,
  total_coverage: 0.284163,
  unmet_need: 121.6,
  capacity_utilization: 0.644295,
  travel_cost: 13.2,
  operating_cost: 53.65,
}

const canonicalAssignments: Record<string, Record<string, string | null>> = {
  Mon: {
    'Мобільна команда 1': 'Краматорський напрямок',
    'Мобільна команда 2': 'Покровський напрямок',
    'Мобільна команда 3': 'Слов’янський напрямок',
    'Мобільна команда 4': 'Запорізький хаб',
    'Мобільна команда 5': 'Покровський напрямок',
  },
  Tue: {
    'Мобільна команда 1': 'Краматорський напрямок',
    'Мобільна команда 2': 'Покровський напрямок',
    'Мобільна команда 3': 'Краматорський напрямок',
    'Мобільна команда 4': 'Запорізький хаб',
    'Мобільна команда 5': 'Слов’янський напрямок',
  },
  Wed: {
    'Мобільна команда 1': 'Покровський напрямок',
    'Мобільна команда 2': 'Покровський напрямок',
    'Мобільна команда 3': 'Слов’янський напрямок',
    'Мобільна команда 4': 'Запорізький хаб',
    'Мобільна команда 5': 'Слов’янський напрямок',
  },
  Thu: {
    'Мобільна команда 1': 'Покровський напрямок',
    'Мобільна команда 2': 'Покровський напрямок',
    'Мобільна команда 3': 'Краматорський напрямок',
    'Мобільна команда 4': null,
    'Мобільна команда 5': 'Слов’янський напрямок',
  },
  Fri: {
    'Мобільна команда 1': 'Покровський напрямок',
    'Мобільна команда 2': 'Краматорський напрямок',
    'Мобільна команда 3': 'Краматорський напрямок',
    'Мобільна команда 5': 'Покровський напрямок',
  },
}

const demandByDay: Record<string, { opening: number; served: number; closing_unmet: number }> = {
  Mon: { opening: 307, served: 82, closing_unmet: 225 },
  Tue: { opening: 225, served: 77, closing_unmet: 148 },
  Wed: { opening: 161, served: 64, closing_unmet: 97 },
  Thu: { opening: 97, served: 20, closing_unmet: 77 },
  Fri: { opening: 77, served: 16, closing_unmet: 61 },
}

function dayPlan(day: string) {
  return {
    day,
    status: 'ok',
    recommended: {
      assignments: canonicalAssignments[day],
      metrics: aggregateMetrics,
      assignment_explanations:
        day === 'Mon'
          ? [
              {
                day,
                team_id: 'Мобільна команда 1',
                from: 'Дніпровський хаб',
                to: 'Краматорський напрямок',
                matched_services: ['psychosocial'],
                priority_demand_units: 48,
                served_units: 18,
                priority_served_units: 18,
                travel_cost: 12,
                travel_time_minutes: 155,
                constraint_checks: [
                  { code: 'LOCATION_ACCESSIBLE', passed: true },
                  { code: 'PROGRAM_COMPATIBLE', passed: true },
                  { code: 'TRAVEL_FEASIBLE', passed: true, value: 155 },
                ],
                rationale_codes: ['HIGH_PRIORITY_DEMAND', 'SKILL_MATCH', 'REACHABLE', 'RELOCATION', 'HORIZON_FEASIBLE'],
              },
            ]
          : [],
      evidence: [],
    },
    demand: demandByDay[day],
  }
}

const recommendedSummary = {
  initial_stock: 307,
  new_demand: 13,
  total_available: 320,
  served: 259,
  closing_unmet: 61,
  initial_priority_stock: 259,
  new_priority_demand: 13,
  total_priority_available: 272,
  priority_served: 259,
  closing_priority_unmet: 13,
  priority_coverage: 0.952206,
}

const baselineSummary = {
  initial_stock: 307,
  new_demand: 13,
  total_available: 320,
  served: 239,
  closing_unmet: 81,
  initial_priority_stock: 259,
  new_priority_demand: 13,
  total_priority_available: 272,
  priority_served: 191,
  closing_priority_unmet: 81,
  priority_coverage: 0.702206,
}

const allocationResult = {
  status: 'ok',
  daily: days.map(dayPlan),
  aggregate_metrics: aggregateMetrics,
  demand_summary: recommendedSummary,
  baseline: {
    kind: 'canonical-plan',
    metrics: {
      priority_coverage: 0.218536,
      total_coverage: 0.256,
      unmet_need: 130,
      capacity_utilization: 0.59,
      travel_cost: 4,
      operating_cost: 46,
    },
    summary: baselineSummary,
  },
  alternatives: [
    {
      daily: days.map(dayPlan),
      aggregate_metrics: aggregateMetrics,
      period_score: 2321.74498,
      demand_summary: recommendedSummary,
    },
  ],
  solver: 'deterministic-branch-aware-period-beam-search',
  search_space: 1000000,
  evaluated_plans: 164,
  engine_version: 'resource-allocation/0.7.0',
  evidence: ['Canonical case: horizon priority coverage = 95%'],
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
        typeof item === 'object' && item !== null && (item as Record<string, unknown>).id === 'Краматорський напрямок'
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
        engine_version: 'resource-allocation/0.7.0',
        plugin_version: '0.7.0',
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
      metrics: recordedOutcomeBody.metrics as Record<string, unknown>,
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ decision_id: 'demo-decision-1', status }),
    })
  })

  await page.goto('/en/resource-allocation')

  await expect(page.getByTestId('community-count')).toHaveText('5')
  await expect(page.getByTestId('team-count')).toHaveText('5')
  await expect(page.getByText('Can the same teams cover more priority demand?')).toBeVisible()
  await expect(page.getByTestId('resource-scenario-details')).toHaveCount(0)

  await page.getByRole('button', { name: 'Calculate recommended allocation' }).click()
  await expect(page.getByText(/Where to send teams · 5 days/)).toBeVisible()
  await expect(page.getByText('Reference manual plan').first()).toBeVisible()
  await expect(page.getByText('+20', { exact: true })).toBeVisible()
  await expect(page.getByText('more demand units', { exact: true })).toBeVisible()
  await expect(page.getByText('without adding teams', { exact: true })).toBeVisible()
  await expect(
    page.getByLabel(
      'Share of priority demand units the modelled plan can serve across the full planning horizon.'
    )
  ).toBeVisible()
  expect(sawResponsibleCitizensInput).toBe(true)

  await page.getByRole('button', { name: 'Мобільна команда 1' }).first().click()
  await expect(page.getByTestId('assignment-explanation')).toBeVisible()
  await expect(page.getByText('Psychosocial support')).toBeVisible()
  await expect(page.getByText('48', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Accept QDIP recommendation' }).click()
  await expect(page.getByText(/Decision ID · demo-decision-1/)).toBeVisible()
  await expect(page.getByText('Plan approved')).toBeVisible()
  await expect(page.getByLabel('Actual priority-needs coverage, %')).toBeHidden()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download plan CSV' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^qdip-resource-allocation-\d{4}-\d{2}-\d{2}\.csv$/)

  await page.getByText('After the plan is executed', { exact: true }).click()
  await page.getByLabel('Actual priority-needs coverage, %').fill('81')
  await page.getByLabel('Demand units actually covered').fill('96')
  await page.getByLabel('Demand units actually left uncovered').fill('32')
  await page
    .getByPlaceholder('What actually happened after the decision was executed')
    .fill('Executed with one field change')
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
    .poll(() => page.getByTestId('resource-primary-cta').evaluate((element) => getComputedStyle(element).marginBottom))
    .toBe('32px')
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
  await expect(page.getByTestId('manual-mobile-cards')).toBeHidden()
  await page.getByText('Advanced editing', { exact: true }).click()
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
    '2 teams · 2 communities · 20 demand units · 5 days'
  )
})

test('client can simulate an operational disruption after seeing value', async ({ page }) => {
  const requestBodies: Array<Record<string, unknown>> = []

  await page.route('**/api/resource-allocation/run', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    requestBodies.push(body)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operation: 'simulate',
        scenario: body.scenario ?? {},
        result: allocationResult,
      }),
    })
  })

  await page.goto('/en/resource-allocation')
  await expect(page.getByTestId('resource-scenario-details')).toHaveCount(0)

  await page.getByRole('button', { name: 'Calculate recommended allocation' }).click()
  await expect(page.getByTestId('resource-scenario-details')).toBeVisible()

  await page.getByTestId('resource-scenario-details').locator('summary').click()
  const blocked = page.getByTestId('blocked-community')
  await expect(blocked).toContainText('Краматорський напрямок')
  await blocked.selectOption({ label: 'Краматорський напрямок' })
  await page.getByRole('button', { name: 'Recalculate plan' }).click()

  await expect(page.getByText('SCENARIO CHANGED')).toBeVisible()
  expect(requestBodies).toHaveLength(2)
  const scenario = requestBodies[1].scenario as Record<string, unknown>
  expect(scenario.inaccessible_communities).toEqual(['Краматорський напрямок'])
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
  await expect(page.getByText(/Where to send teams · 5 days/)).toBeVisible()

  await page.getByTestId('capacity-gap-details').locator('summary').click()

  const analyze = page.getByRole('button', {
    name: 'Calculate required resources',
  })

  await analyze.click()
  await expect(page.getByText('Gap to target')).toBeVisible()
  await expect(page.getByText('Psychosocial support')).toBeVisible()

  await analyze.click()
  await expect(page.getByText('An error occurred while executing capacity analysis')).toBeVisible()
  await expect(page.getByText(/Unexpected token/)).toHaveCount(0)
})
