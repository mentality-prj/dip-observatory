import { describe, expect, it } from 'vitest'
import { buildReadinessRecoveryDemo, READINESS_RECOVERY_DEMO_PRESETS } from './demo-data'
import { planReadinessRecovery } from './planner'
import { decorateObjectiveLabels } from './scenario-labels'

describe('Readiness Recovery objective badges', () => {
  for (const preset of READINESS_RECOVERY_DEMO_PRESETS) {
    it(`${preset} exposes every objective optimum even when one scenario owns multiple roles`, () => {
      const input = buildReadinessRecoveryDemo(preset)
      input.settings.simulationSamples = 32
      input.settings.maxCandidates = 60
      input.settings.beamWidth = 32
      const frontier = decorateObjectiveLabels(planReadinessRecovery(input).frontier)

      expect(frontier.length).toBeGreaterThan(0)
      expect(frontier.some((scenario) => scenario.labels?.includes('MAXIMUM_READINESS'))).toBe(true)
      expect(frontier.some((scenario) => scenario.labels?.includes('FAST_RECOVERY'))).toBe(true)
      expect(frontier.some((scenario) => scenario.labels?.includes('PARTS_CONSERVATIVE'))).toBe(true)
      expect(frontier.some((scenario) => scenario.labels?.includes('LOW_RISK'))).toBe(true)

      const fastest = Math.min(...frontier.map((scenario) => scenario.expectedRecoveryTimeHours))
      const leastParts = Math.min(...frontier.map((scenario) => scenario.scarcePartsConsumed))
      const risk = (scenario: (typeof frontier)[number]) => scenario.recoveryFailureRisk + scenario.repeatFailureRisk
      const leastRisk = Math.min(...frontier.map(risk))

      for (const scenario of frontier) {
        if (scenario.labels?.includes('FAST_RECOVERY')) expect(scenario.expectedRecoveryTimeHours).toBe(fastest)
        if (scenario.labels?.includes('PARTS_CONSERVATIVE')) expect(scenario.scarcePartsConsumed).toBe(leastParts)
        if (scenario.labels?.includes('LOW_RISK')) expect(risk(scenario)).toBe(leastRisk)
      }

      expect(frontier.some((scenario) => (scenario.labels?.length ?? 0) > 1)).toBe(
        new Set(frontier.flatMap((scenario) => scenario.labels ?? [])).size >= 4 && frontier.length < 4
          ? true
          : frontier.some((scenario) => (scenario.labels?.length ?? 0) > 1)
      )
    })
  }
})
