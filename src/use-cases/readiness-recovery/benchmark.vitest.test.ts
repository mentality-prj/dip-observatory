import { describe, expect, it } from 'vitest'
import { benchmarkReadinessResult } from './benchmark'
import { buildReadinessRecoveryDemo, READINESS_RECOVERY_DEMO_PRESETS } from './demo-data'
import { planReadinessRecovery } from './planner'

describe('Readiness Recovery benchmark evidence', () => {
  for (const preset of READINESS_RECOVERY_DEMO_PRESETS) {
    it(`${preset} compares QDIP with a feasible heuristic under the same experiment`, () => {
      const input = buildReadinessRecoveryDemo(preset)
      input.settings.simulationSamples = 32
      input.settings.maxCandidates = 60
      input.settings.beamWidth = 32
      const result = planReadinessRecovery(input)
      const benchmark = benchmarkReadinessResult(result)

      expect(benchmark.qdip).not.toBeNull()
      expect(benchmark.baseline).not.toBeNull()
      expect(benchmark.baselineKind).not.toBeNull()
      expect(['QDIP_ADVANTAGE', 'HEURISTIC_PARITY', 'HEURISTIC_ADVANTAGE']).toContain(benchmark.verdict)
      expect(benchmark.qdip!.uncertaintySummary.seed).toBe(input.settings.seed)
      expect(benchmark.baseline!.uncertaintySummary.seed).toBe(input.settings.seed)
    })
  }

  it('does not call a resource-expensive operational gain a QDIP advantage', () => {
    const input = buildReadinessRecoveryDemo('CAPABILITY_RESCUE')
    input.settings.simulationSamples = 40
    input.settings.maxCandidates = 60
    const benchmark = benchmarkReadinessResult(planReadinessRecovery(input))

    if (benchmark.verdict === 'QDIP_ADVANTAGE') {
      expect(benchmark.technicianHoursDelta).toBeLessThanOrEqual(8)
      expect(benchmark.scarcePartsDelta).toBeLessThanOrEqual(0.75)
      expect(benchmark.failureRiskDelta).toBeLessThanOrEqual(0.1)
    }
  })
})
