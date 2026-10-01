import { describe, expect, it } from 'vitest'
import { benchmarkReadinessResult } from './benchmark'
import { buildReadinessRecoveryDemo, READINESS_RECOVERY_DEMO_PRESETS } from './demo-data'
import { epsilonDominates, planReadinessRecovery } from './planner'

describe('Readiness Recovery benchmark evidence', () => {
  for (const preset of READINESS_RECOVERY_DEMO_PRESETS) {
    it(`${preset} has internally consistent evidence, frontier and labels`, () => {
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

      for (const candidate of result.frontier) {
        expect(
          result.frontier.some(
            (other) =>
              other.scenarioId !== candidate.scenarioId && epsilonDominates(other, candidate, input.settings.epsilon)
          )
        ).toBe(false)
      }

      const fast = result.frontier.find((scenario) => scenario.label === 'FAST_RECOVERY')
      if (fast) {
        expect(fast.expectedRecoveryTimeHours).toBe(
          Math.min(...result.frontier.map((scenario) => scenario.expectedRecoveryTimeHours))
        )
      }
      const parts = result.frontier.find((scenario) => scenario.label === 'PARTS_CONSERVATIVE')
      if (parts) {
        expect(parts.scarcePartsConsumed).toBe(
          Math.min(...result.frontier.map((scenario) => scenario.scarcePartsConsumed))
        )
      }
      const lowRisk = result.frontier.find((scenario) => scenario.label === 'LOW_RISK')
      if (lowRisk) {
        const risk = (scenario: (typeof result.frontier)[number]) =>
          scenario.recoveryFailureRisk + scenario.repeatFailureRisk
        expect(risk(lowRisk)).toBe(Math.min(...result.frontier.map(risk)))
      }

      if (benchmark.verdict === 'QDIP_ADVANTAGE' && benchmark.advantageKind === 'CAPABILITY') {
        expect(
          benchmark.probabilityDelta >= 0.05 || benchmark.readinessDelta >= 0.03 || benchmark.shortfallReduction >= 0.5
        ).toBe(true)
        expect(benchmark.technicianHoursDelta).toBeLessThanOrEqual(8)
        expect(benchmark.scarcePartsDelta).toBeLessThanOrEqual(0.75)
        expect(benchmark.failureRiskDelta).toBeLessThanOrEqual(0.1)
      }

      if (benchmark.verdict === 'QDIP_ADVANTAGE' && benchmark.advantageKind === 'EFFICIENCY') {
        expect(Math.abs(benchmark.probabilityDelta)).toBeLessThan(0.05)
        expect(Math.abs(benchmark.readinessDelta)).toBeLessThan(0.03)
        expect(Math.abs(benchmark.shortfallReduction)).toBeLessThan(0.5)
        expect(benchmark.recoveryTimeDeltaHours).toBeLessThanOrEqual(0)
        expect(benchmark.technicianHoursDelta).toBeLessThanOrEqual(0)
        expect(benchmark.scarcePartsDelta).toBeLessThanOrEqual(0)
        expect(benchmark.failureRiskDelta).toBeLessThanOrEqual(0)
      }
    })
  }

  it('classifies the capability-rescue report as efficiency advantage when capability outcomes are tied', () => {
    const input = buildReadinessRecoveryDemo('CAPABILITY_RESCUE')
    input.settings.simulationSamples = 180
    input.settings.maxCandidates = 72
    input.settings.beamWidth = 48
    const benchmark = benchmarkReadinessResult(planReadinessRecovery(input))

    if (
      Math.abs(benchmark.probabilityDelta) < 0.05 &&
      Math.abs(benchmark.readinessDelta) < 0.03 &&
      Math.abs(benchmark.shortfallReduction) < 0.5 &&
      benchmark.recoveryTimeDeltaHours <= -4 &&
      benchmark.technicianHoursDelta <= 0 &&
      benchmark.scarcePartsDelta <= 0 &&
      benchmark.failureRiskDelta <= 0
    ) {
      expect(benchmark.verdict).toBe('QDIP_ADVANTAGE')
      expect(benchmark.advantageKind).toBe('EFFICIENCY')
    }
  })
})
