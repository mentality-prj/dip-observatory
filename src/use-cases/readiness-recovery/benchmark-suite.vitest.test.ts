import { describe, expect, it } from 'vitest'
import { buildReadinessRecoveryDemo } from './demo-data'
import {
  planReadinessRecoveryWithBenchmarkSuite,
  qdipAdvantageRetention,
  runCascadingRobustnessSweep,
} from './benchmark-suite'

describe('readiness benchmark suite', () => {
  it('executes both stronger baselines on the same normalized action space', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    input.settings.simulationSamples = 24
    input.settings.maxCandidates = 36
    input.settings.beamWidth = 24
    input.settings.maxSearchNodes = 8_000
    input.settings.maxSolveTimeMs = 2_000

    const result = planReadinessRecoveryWithBenchmarkSuite(input)
    const kinds = result.baselines.map((baseline) => baseline.kind)
    expect(kinds).toContain('RISK_AWARE_GREEDY')
    expect(kinds).toContain('LOOKAHEAD_2')
    expect(result.baselines.find((baseline) => baseline.kind === 'RISK_AWARE_GREEDY')?.scenario).not.toBeNull()
    expect(result.baselines.find((baseline) => baseline.kind === 'LOOKAHEAD_2')?.scenario).not.toBeNull()

    const actionIds = new Set(input.recoveryActions.map((action) => action.actionId))
    for (const baseline of result.baselines) {
      for (const actionId of baseline.scenario?.selectedActions ?? []) expect(actionIds.has(actionId)).toBe(true)
    }
  })

  it('runs every declared robustness variant and reports retention without hardcoding a win', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    input.settings.simulationSamples = 12
    input.settings.maxCandidates = 20
    input.settings.beamWidth = 16
    input.settings.maxSearchNodes = 4_000
    input.settings.maxSolveTimeMs = 1_500

    const sweep = runCascadingRobustnessSweep(input)
    expect(sweep.map((item) => item.variantId)).toEqual([
      'base',
      'deadline-minus-10',
      'deadline-plus-10',
      'technicians-minus-20',
      'parts-minus-20',
      'success-minus-10',
      'success-plus-10',
    ])
    expect(
      sweep.every((item) =>
        ['QDIP_ADVANTAGE', 'HEURISTIC_PARITY', 'HEURISTIC_ADVANTAGE', 'INSUFFICIENT_EVIDENCE'].includes(item.verdict)
      )
    ).toBe(true)
    const retention = qdipAdvantageRetention(sweep)
    expect(retention.total).toBe(7)
    expect(retention.retained).toBeGreaterThanOrEqual(0)
    expect(retention.retained).toBeLessThanOrEqual(7)
  })
})
