import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'

import { GasProcurementDecisionDemo } from './gas-procurement-decision-demo'

test('shows customer decision context before any unvalidated value claim', () => {
  const html = renderToStaticMarkup(
    <GasProcurementDecisionDemo volumeMwh={10_000} deadline="2026-10-01" horizonDays={7} />
  )

  assert.equal(html.includes('10,000 MWh'), true)
  assert.equal(html.includes('2026-10-01'), true)
  assert.equal(html.includes('No robust recommendation yet'), true)
  assert.equal(html.includes('VALUE NOT YET VALIDATED'), true)
  assert.equal(html.includes('X% buy now / Y% defer'), true)
  assert.equal(html.includes('QDIP saves'), false)
})
