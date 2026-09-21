import assert from 'node:assert/strict'
import test from 'node:test'
import { gtmDemoSchema } from './contracts'

const evidence = {
  id: 'e1',
  company_id: 'c1',
  source: 'cached-demo',
  source_type: 'web_research',
  content: 'Observed operational evidence',
  collected_at: '2026-09-20T00:00:00Z',
  structured_data: {},
  credibility: 0.9,
  freshness: 0.8,
  relevance: 0.9,
  confidence: 0.85,
}
const base = {
  dataset_id: 'gtm-lab-demo-v1',
  network_access: false,
  persistence: false,
  external_actions: false,
  summary: { PURSUE: 0, RESEARCH: 1, SKIP: 0 },
  prospects: [
    {
      company: { id: 'c1', name: 'Atlas', industry: 'logistics', country: 'DE' },
      evidence: [evidence],
      opportunity: {
        id: 'o1',
        company_id: 'c1',
        problem_id: 'p1',
        problem_probability: 0.7,
        qdip_fit: 0.8,
        purchase_probability: null,
        expected_contract_value_eur: null,
        expected_acquisition_cost_eur: 900,
        expected_implementation_cost_eur: null,
        strategic_value: 0.7,
        uncertainty: 0.55,
        evidence_ids: ['e1'],
      },
      decision: {
        opportunity_id: 'o1',
        decision: 'RESEARCH',
        expected_opportunity_value_eur: null,
        uncertainty: 0.55,
        evidence_quality: 0.8,
        missing_information: ['Current tooling'],
        research_objectives: ['Verify planning tooling'],
        explanation: ['Opportunity is plausible but uncertainty remains high'],
        rejected_alternatives: ['PURSUE', 'SKIP'],
        model_version: 'gtm-opportunity-v1',
      },
      outreach_draft: null,
    },
  ],
}

test('accepts the actual GTM demo contract and RESEARCH as a valid decision', () => {
  const parsed = gtmDemoSchema.parse(base)
  assert.equal(parsed.prospects[0].decision.decision, 'RESEARCH')
  assert.equal(parsed.prospects[0].outreach_draft, null)
})
test('rejects fabricated/legacy prospect shapes', () => {
  assert.equal(
    gtmDemoSchema.safeParse({ dataset: 'legacy', prospects: [{ company: 'Atlas', decision: 'CONTACT' }] }).success,
    false
  )
})
test('does not require optional company metadata', () => {
  const parsed = gtmDemoSchema.parse(base)
  assert.equal(parsed.prospects[0].company.domain, undefined)
})
