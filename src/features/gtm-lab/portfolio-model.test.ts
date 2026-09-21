import assert from 'node:assert/strict'
import test from 'node:test'
import { pipelineRunSchema } from './import-contracts'
import { fromPipeline } from './portfolio-model'

const decision = (opportunityId: string, state: 'PURSUE' | 'RESEARCH' | 'WATCH' | 'SKIP') => ({
  opportunity_id: opportunityId,
  decision: state,
  expected_opportunity_value_eur: null,
  uncertainty: state === 'WATCH' ? 0.6 : 0.2,
  evidence_quality: 0.8,
  confidence: 0.7,
  missing_information: [],
  research_objectives: [],
  explanation: [`${state} explanation`],
  explanation_details: null,
  qdip_capability_fit: null,
  next_action: state === 'WATCH' ? { type: 'WATCH', title: 'Re-evaluate later' } : null,
  provenance: {
    decision_id: `decision-${opportunityId}`,
    executed_at: '2026-09-21T00:00:00Z',
    plugin_id: 'gtm-lab',
    plugin_version: '1.0',
    evidence_ids: [],
  },
  rejected_alternatives: [],
  model_version: 'gtm-v1',
})

const opportunity = (id: string, probability: number) => ({
  id,
  company_id: 'company-a',
  problem_id: `problem-${id}`,
  contact_ids: [],
  problem_probability: probability,
  qdip_fit: probability,
  capability_fit: null,
  strategic_value: 0.5,
  uncertainty: 0.3,
  evidence_ids: [],
  state: 'EVALUATED',
})

test('normalizes every backend decision instead of selecting decisions[0]', () => {
  const run = pipelineRunSchema.parse({
    run_id: 'run-multi',
    status: 'COMPLETED',
    imported_rows: 1,
    deduplicated_rows: 0,
    summary: {
      total_prospects: 1,
      evaluated_prospects: 1,
      failed_prospects: 0,
      total_opportunities: 2,
      total_evidence: 0,
      decisions: { PURSUE: 1, RESEARCH: 0, WATCH: 1, SKIP: 0 },
    },
    prospects: [
      {
        company: { id: 'company-a', name: 'Acme' },
        lifecycle: null,
        problems: [],
        opportunities: [opportunity('opportunity-a', 0.9), opportunity('opportunity-b', 0.5)],
        decisions: [decision('opportunity-a', 'PURSUE'), decision('opportunity-b', 'WATCH')],
        evidence_count: 0,
        error: null,
      },
    ],
  })

  const model = fromPipeline(run)

  assert.equal(model.items.length, 2)
  assert.deepEqual(
    model.items.map((item) => item.decision),
    ['PURSUE', 'WATCH']
  )
  assert.equal(new Set(model.items.map((item) => item.id)).size, 2)
  assert.deepEqual(
    model.items.map((item) => item.companyId),
    ['company-a', 'company-a']
  )
  assert.deepEqual(
    model.items.map((item) => item.opportunityId),
    ['opportunity-a', 'opportunity-b']
  )
})

test('preserves PARTIAL status and successful decisions when another prospect fails', () => {
  const run = pipelineRunSchema.parse({
    run_id: 'run-partial',
    status: 'PARTIAL',
    imported_rows: 2,
    deduplicated_rows: 0,
    summary: {
      total_prospects: 2,
      evaluated_prospects: 1,
      failed_prospects: 1,
      total_opportunities: 1,
      total_evidence: 0,
      decisions: { PURSUE: 0, RESEARCH: 0, WATCH: 1, SKIP: 0 },
    },
    prospects: [
      {
        company: { id: 'company-a', name: 'Acme' },
        lifecycle: null,
        problems: [],
        opportunities: [opportunity('opportunity-a', 0.6)],
        decisions: [decision('opportunity-a', 'WATCH')],
        evidence_count: 0,
        error: null,
      },
      {
        company: { id: 'company-failed', name: 'Broken Import' },
        lifecycle: null,
        problems: [],
        opportunities: [],
        decisions: [],
        evidence_count: 0,
        error: 'Evaluation failed',
      },
    ],
  })

  const model = fromPipeline(run)

  assert.equal(model.status, 'PARTIAL')
  assert.equal(model.failed, 1)
  assert.equal(model.items.length, 1)
  assert.equal(model.items[0]?.decision, 'WATCH')
  assert.equal(model.items[0]?.nextAction?.title, 'Re-evaluate later')
})
