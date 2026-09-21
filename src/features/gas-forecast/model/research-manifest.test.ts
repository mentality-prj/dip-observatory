import assert from 'node:assert/strict'
import test from 'node:test'

import { parseResearchManifest } from './research-manifest'

const manifest = {
  experiment_id: 'gas-forecast-v0.4',
  version: '0.4',
  hypothesis: 'Can QDIP reduce OOS procurement cost?',
  decision_problem: 'Choose BUY_NOW or WAIT.',
  dataset: {
    version: 'gas-market-dataset.v1',
    hash: 'abc123',
    observation_window: '2021-01-01/2026-09-20',
    sources: ['ttf', 'agsi', 'entsog', 'weather'],
  },
  prediction_tasks: ['direction', 'conditional_magnitude', 'uncertainty'],
  decision_alternatives: ['BUY_NOW', 'WAIT'],
  horizons: [1, 2, 3, 5, 7],
  baselines: ['immediate_buy', 'fixed_delay'],
  primary_metrics: ['cost_eur_per_mwh', 'regret_vs_oracle'],
  secondary_metrics: ['mae', 'roc_auc'],
  status: 'FROZEN',
}

test('accepts the backend-owned frozen experiment manifest', () => {
  const parsed = parseResearchManifest({ research_manifest: manifest })
  assert.equal(parsed?.dataset.hash, 'abc123')
  assert.deepEqual(parsed?.decision_alternatives, ['BUY_NOW', 'WAIT'])
  assert.equal(parsed?.status, 'FROZEN')
})

test('fails closed when dataset identity is incomplete', () => {
  const invalid = { ...manifest, dataset: { ...manifest.dataset, hash: null } }
  assert.equal(parseResearchManifest({ research_manifest: invalid }), null)
  assert.equal(parseResearchManifest({}), null)
})
