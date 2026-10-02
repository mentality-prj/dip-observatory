import { describe, expect, it } from 'vitest'
import { buildReadinessRecoveryDemo } from './demo-data'
import { planReadinessRecovery } from './planner'

const build = () => buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')

describe('Cascading Resource Conflict benchmark', () => {
  it('models the intended operational conflicts without a QDIP-only action space', () => {
    const input = build()
    expect(input.scenarioId).toBe('readiness-cascading-resource-conflict')
    expect(input.assets).toHaveLength(100)
    expect(input.capabilityDemand).toHaveLength(4)
    expect(new Set(input.capabilityDemand.map((demand) => demand.deadline)).size).toBe(2)
    expect(input.resources.spareParts['PART-SCARCE-A']).toBe(2)
    expect(input.resources.spareParts['PART-DONOR']).toBe(0)
    expect(input.recoveryActions.some((action) => action.type === 'CANNIBALIZE')).toBe(true)
    expect(input.recoveryActions.filter((action) => action.dependsOnActionIds?.length).length).toBeGreaterThanOrEqual(3)
    expect(input.assets.filter((asset) => asset.providedCapabilities.length > 1).length).toBeGreaterThan(3)
  })

  it('evaluates every baseline against the same normalized input and stochastic seed', () => {
    const input = build()
    const result = planReadinessRecovery(input)
    expect(result.scenarioId).toBe(input.scenarioId)
    expect(result.frontier.length).toBeGreaterThan(0)
    for (const baseline of result.baselines) {
      if (!baseline.scenario) continue
      expect(baseline.scenario.uncertaintySummary.seed).toBe(input.settings.seed)
      expect(baseline.scenario.uncertaintySummary.samples).toBe(input.settings.simulationSamples)
      for (const actionId of baseline.scenario.selectedActions) {
        expect(input.recoveryActions.some((action) => action.actionId === actionId)).toBe(true)
      }
    }
  })

  it('never recovers a cannibalized donor in the same selected plan', () => {
    const input = build()
    const result = planReadinessRecovery(input)
    const donor = 'ASSET-100:cannibalize-cascade'
    for (const scenario of [
      ...result.frontier,
      ...result.baselines.flatMap((item) => (item.scenario ? [item.scenario] : [])),
    ]) {
      if (!scenario.selectedActions.includes(donor)) continue
      expect(scenario.selectedActions.filter((id) => id.startsWith('ASSET-100:'))).toEqual([donor])
    }
  })
})
