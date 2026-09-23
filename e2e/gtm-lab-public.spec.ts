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
    total_evidence: 1,
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
        technologies: [],
        products: [],
        locations: [],
        source_refs: ['public-upload'],
      },
      lifecycle: null,
      problems: [],
      opportunities: [
        {
          id: 'opportunity:1',
          company_id: 'company:northroute',
          problem_id: 'problem:1',
          contact_ids: [],
          problem_probability: 0.5,
          qdip_fit: 0.63,
          capability_fit: {
            capability_id: 'resource-allocation',
            capability_name: 'Resource Allocation',
            fit: 0.63,
            problem_statement: 'Allocation decisions may benefit from explicit constraints.',
            rationale: [],
          },
          purchase_probability: null,
          expected_contract_value_eur: null,
          expected_acquisition_cost_eur: null,
          expected_implementation_cost_eur: null,
          strategic_value: 0.6,
          uncertainty: 0.5,
          evidence_ids: ['evidence:1'],
          state: 'DISCOVERED',
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
          provenance: null,
          rejected_alternatives: ['PURSUE', 'WATCH', 'SKIP'],
          model_version: 'gtm-opportunity-v1',
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

test('GTM Lab public CSV workflow is available and Ukrainian UI is localized', async ({ page }) => {
  await page.route('**/api/gtm-lab/import/validate', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(validation) })
  )
  await page.route('**/api/gtm-lab/pipeline', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(evaluation) })
  )

  await page.goto('/uk/gtm-lab')
  await expect(page.getByRole('heading', { name: 'Оцініть портфель потенційних клієнтів' })).toBeVisible()
  await expect(page.getByText('Evaluate your prospect portfolio')).toHaveCount(0)

  const input = page.locator('input[type="file"]')
  await input.setInputFiles({
    name: 'prospects.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'name,domain,country,industry,employee_count,description\n' +
        'NorthRoute Logistics,northroute.example,PL,Logistics,120,"Manual resource allocation and capacity scheduling."'
    ),
  })

  await expect(page.getByText('1 компаній перевірено. Можна запускати оцінювання.')).toBeVisible()
  await page.getByRole('button', { name: 'Запустити оцінювання (1)' }).click()
  await expect(page.getByText('NorthRoute Logistics').first()).toBeVisible()
  await expect(page.getByText('Дослідити').first()).toBeVisible()
  await expect(page.getByText('Сигнал')).toBeVisible()
  await expect(page.getByText('GTM Lab production data requires INTERNAL mode')).toHaveCount(0)
})
