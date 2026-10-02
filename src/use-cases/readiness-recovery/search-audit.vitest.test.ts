import { describe, expect, it } from 'vitest'
import { buildReadinessRecoveryDemo } from './demo-data'
import { auditStrongBaselineInjection } from './search-audit'

describe('Readiness Recovery strong-baseline search audit', () => {
  it('checks whether the risk-aware baseline survives native search and forced injection', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    input.settings.simulationSamples = 12
    input.settings.maxCandidates = 36
    input.settings.beamWidth = 24
    input.settings.maxSearchNodes = 8_000
    input.settings.maxSolveTimeMs = 2_000

    const audit = auditStrongBaselineInjection(input, 'RISK_AWARE_GREEDY')

    expect(audit.baselineCandidateKey).not.toBeNull()
    expect(audit.baselineSelectedActions.length).toBeGreaterThan(0)
    expect(audit.nativeGeneratedCandidates).toBeGreaterThan(0)
    expect(audit.nativeSearchNodes).toBeGreaterThan(0)
    expect(audit.injectedEvaluatedCandidates).toBeGreaterThan(0)
    expect(
      [
        'NATIVE_SEARCH_RETAINED_BASELINE',
        'BASELINE_SURVIVES_AFTER_INJECTION',
        'BASELINE_DOMINATED_AFTER_INJECTION',
        'BASELINE_REMOVED_BY_FRONTIER_SELECTION',
      ]
    ).toContain(audit.classification)

    if (!audit.nativeSearchRetained) {
      expect(audit.classification).not.toBe('NATIVE_SEARCH_RETAINED_BASELINE')
    }
  })
})
