import { expect, test } from '@playwright/test'

const validation = {
  valid: true,
  total_rows: 1,
  valid_rows: 1,
  invalid_rows: 0,
  rows: [
    {
      name: 'NorthRoute Logistics',
      domain: 'northroute.example',
      country: 'PL',
      industry: 'Logistics',
      employee_count: 120,
      revenue_eur: null,
      description: 'Manual resource allocation and capacity scheduling.',
      metadata: {},
    },
  ],
  issues: [],
}
const evaluation = {
  run_id: 'public:test',
  status: 'COMPLETED',
  imported_rows: 1,
  deduplicated_rows: 0,
  summary: {
    total_prospects: 1,
    evaluated_prospects: 1,
    failed_prospects: 0,
    total_opportunities: 1,
    total_evidence: 2,
    decisions: { PURSUE: 0, RESEARCH: 1, WATCH: 0, SKIP: 0 },
  },
  prospects: [
    {
      company: {
        id: 'company:northroute',
        name: 'NorthRoute Logistics',
        domain: 'northroute.example',
        country: 'PL',
        industry: 'Logistics',
        employee_count: 120,
        revenue_eur: null,
        description: 'Manual resource allocation and capacity scheduling.',
      },
      problems: [],
      opportunities: [
        {
          id: 'opportunity:1',
          company_id: 'company:northroute',
          problem_id: 'problem:1',
          problem_probability: 0.5,
          qdip_fit: 0.63,
          capability_fit: null,
          purchase_probability: null,
          expected_contract_value_eur: null,
          expected_acquisition_cost_eur: null,
          expected_implementation_cost_eur: null,
          strategic_value: 0.6,
          uncertainty: 0.5,
          evidence_ids: ['evidence:1'],
        },
      ],
      decisions: [
        {
          opportunity_id: 'opportunity:1',
          decision: 'RESEARCH',
          expected_opportunity_value_eur: null,
          uncertainty: 0.5,
          evidence_quality: 0.24,
          confidence: 0.5,
          missing_information: ['purchase_probability'],
          research_objectives: ['Validate the decision process'],
          explanation: ['Backend explanation'],
          explanation_details: {
            reasons: ['Backend explanation'],
            risks: [],
            missing_information: ['purchase_probability'],
            research_objectives: ['Validate the decision process'],
          },
          qdip_capability_fit: null,
          next_action: {
            type: 'RESEARCH',
            title: 'Validate the decision process',
            description: null,
            target_role: null,
            reason: null,
          },
        },
      ],
      evidence: [
        {
          id: 'evidence:1',
          company_id: 'company:northroute',
          kind: 'SIGNAL',
          source: 'uploaded CSV',
          source_type: 'user_supplied',
          content: 'Manual resource allocation and capacity scheduling.',
          url: null,
          observed_at: null,
          credibility: 0.5,
          freshness: 1,
          relevance: 0.8,
          confidence: 0.6,
        },
      ],
      evidence_count: 1,
      error: null,
    },
  ],
}

test('GTM Lab explains context before evaluating public CSV', async ({ page }) => {
  let evaluationBody: Record<string, unknown> | undefined
  await page.route('**/api/gtm-lab/import/validate', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(validation) })
  )
  await page.route('**/api/gtm-lab/pipeline', async (route) => {
    evaluationBody = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(evaluation) })
  })
  await page.goto('/uk/gtm-lab')
  await expect(page.getByRole('heading', { name: 'Розкажіть GTM Lab, що ви продаєте' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Як QDIP оцінює потенційних клієнтів' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Скачати шаблон CSV' })).toBeVisible()

  await page.getByLabel('Що ви продаєте?').fill('ПЗ для підтримки рішень щодо розподілу ресурсів')
  await page.getByLabel('Які проблеми ви вирішуєте?').fill('ручний розподіл ресурсів, планування персоналу')
  await page.getByLabel('Цільові галузі').fill('логістика')
  await page.getByLabel('Типовий покупець / особа, що приймає рішення').fill('Head of Operations')
  await page.getByRole('button', { name: 'Використати цей контекст' }).click()

  await page.locator('input[type="file"]').setInputFiles({
    name: 'prospects.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'name,domain,country,industry,employee_count,description\nNorthRoute Logistics,northroute.example,PL,Logistics,120,"Manual resource allocation and capacity scheduling."'
    ),
  })
  await expect(page.getByText('1 компаній перевірено. Можна запускати оцінювання.')).toBeVisible()
  await page.getByRole('button', { name: 'Оцінити 1 компаній' }).click()
  expect(evaluationBody).toMatchObject({
    commercialContext: { target_industries: ['логістика'], target_roles: ['Head of Operations'] },
  })
  await expect(page.getByText('NorthRoute Logistics').first()).toBeVisible()
  await expect(page.locator('strong').filter({ hasText: 'Дослідити' })).toBeVisible()
})
