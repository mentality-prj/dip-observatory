import { describe, expect, it } from 'vitest'
import { buildReadinessRecoveryDemo } from './demo-data'
import {
  auditStrongBaselineInjection,
  sweepStrongBaselineRetention,
  traceStrongBaselineRetention,
} from './search-audit'

describe('Readiness Recovery strong-baseline search audit', () => {
  it('checks whether the risk-aware baseline survives native search and forced injection', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    input.settings.simulationSamples = 12
    input.settings.maxCandidates = 36
    input.settings.beamWidth = 24
    input.settings.maxSearchNodes = 8_000
    input.settings.maxSolveTimeMs = 2_000

    const audit = auditStrongBaselineInjection(input, 'RISK_AWARE_GREEDY')

    console.info('RR_SEARCH_AUDIT', JSON.stringify(audit))

    expect(audit.baselineCandidateKey).not.toBeNull()
    expect(audit.baselineSelectedActions.length).toBeGreaterThan(0)
    expect(audit.nativeGeneratedCandidates).toBeGreaterThan(0)
    expect(audit.nativeSearchNodes).toBeGreaterThan(0)
    expect(audit.injectedEvaluatedCandidates).toBeGreaterThan(0)
    expect([
      'NATIVE_SEARCH_RETAINED_BASELINE',
      'BASELINE_SURVIVES_AFTER_INJECTION',
      'BASELINE_DOMINATED_AFTER_INJECTION',
      'BASELINE_REMOVED_BY_FRONTIER_SELECTION',
    ]).toContain(audit.classification)

    if (!audit.nativeSearchRetained) {
      expect(audit.classification).not.toBe('NATIVE_SEARCH_RETAINED_BASELINE')
    }
  })

  it(
    'traces the risk-aware baseline at the declared scenario settings and across wider beams',
    () => {
      const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
      const audit = auditStrongBaselineInjection(input, 'RISK_AWARE_GREEDY')

      expect(audit.baselineSelectedActions.length).toBeGreaterThan(0)

      const trace = traceStrongBaselineRetention(input, audit.baselineSelectedActions)
      const sweep = sweepStrongBaselineRetention(input, audit.baselineSelectedActions, [24, 72, 144, 288, 576])

      console.info('RR_SEARCH_AUDIT_DEFAULT', JSON.stringify(audit))
      console.info('RR_RETENTION_FIRST_LOSS', JSON.stringify(trace.firstLoss))
      console.info('RR_BEAM_SWEEP', JSON.stringify(sweep))

      expect(trace.stages.length).toBeGreaterThan(0)
      expect(trace.searchNodes).toBeGreaterThan(0)
      expect(sweep.map((point) => point.beamWidth)).toEqual([24, 72, 144, 288, 576])
      expect(sweep.every((point) => !point.truncatedByNodeBudget && !point.truncatedByTimeBudget)).toBe(true)
    },
    20_000
  )
})
