import { describe, expect, it } from 'vitest'
import {
  buildReadinessRecoveryDemo,
  READINESS_RECOVERY_DEMO_PRESETS,
} from './demo-data'
import { planReadinessRecovery } from './planner'
import {
  decorateObjectiveLabels,
  operationalFrontier,
} from './scenario-labels'

describe('Readiness Recovery objective badges', () => {
  for (const preset of READINESS_RECOVERY_DEMO_PRESETS) {
    it(`${preset} assigns recovery badges only among best operational outcomes`, () => {
      const input = buildReadinessRecoveryDemo(preset)
      input.settings.simulationSamples = 32
      input.settings.maxCandidates = 60
      input.settings.beamWidth = 32
      const frontier = decorateObjectiveLabels(
        planReadinessRecovery(input).frontier
      )
      const operational = operationalFrontier(frontier)

      expect(frontier.length).toBeGreaterThan(0)
      expect(operational.length).toBeGreaterThan(0)
      expect(
        frontier.some((scenario) =>
          scenario.labels?.includes('MAXIMUM_READINESS')
        )
      ).toBe(true)
      expect(
        frontier.some((scenario) => scenario.labels?.includes('FAST_RECOVERY'))
      ).toBe(true)
      expect(
        frontier.some((scenario) =>
          scenario.labels?.includes('PARTS_CONSERVATIVE')
        )
      ).toBe(true)
      expect(
        frontier.some((scenario) => scenario.labels?.includes('LOW_RISK'))
      ).toBe(true)

      const fastest = Math.min(
        ...operational.map((scenario) => scenario.expectedRecoveryTimeHours)
      )
      const leastParts = Math.min(
        ...operational.map((scenario) => scenario.scarcePartsConsumed)
      )
      const risk = (scenario: (typeof frontier)[number]) =>
        scenario.recoveryFailureRisk + scenario.repeatFailureRisk
      const leastRisk = Math.min(...operational.map(risk))
      const operationalIds = new Set(
        operational.map((scenario) => scenario.scenarioId)
      )

      for (const scenario of frontier) {
        const recoveryLabels = (scenario.labels ?? []).filter((label) =>
          [
            'MAXIMUM_READINESS',
            'FAST_RECOVERY',
            'PARTS_CONSERVATIVE',
            'LOW_RISK',
          ].includes(label)
        )
        if (recoveryLabels.length)
          expect(operationalIds.has(scenario.scenarioId)).toBe(true)
        if (scenario.labels?.includes('FAST_RECOVERY'))
          expect(scenario.expectedRecoveryTimeHours).toBe(fastest)
        if (scenario.labels?.includes('PARTS_CONSERVATIVE'))
          expect(scenario.scarcePartsConsumed).toBe(leastParts)
        if (scenario.labels?.includes('LOW_RISK'))
          expect(risk(scenario)).toBe(leastRisk)

        if (
          scenario.selectedActions.length === 0 &&
          scenario.probabilityDemandSatisfied === 0
        ) {
          expect(recoveryLabels).toEqual([])
        }
      }
    })
  }
})
