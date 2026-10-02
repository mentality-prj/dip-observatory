import { describe, expect, it } from 'vitest'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { buildReadinessRecoveryDemo } from './demo-data'

const build = () => buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')

describe('Cascading Resource Conflict benchmark', () => {
  it('locks the preregistered scenario shape and common action space', () => {
    const input = build()
    const impaired = input.assets.filter(
      (asset) => asset.currentState === 'FAILED' || asset.currentState === 'DEGRADED'
    )

    expect(input.scenarioId).toBe('readiness-cascading-resource-conflict')
    expect(input.assets).toHaveLength(100)
    expect(impaired.length).toBeGreaterThanOrEqual(25)
    expect(impaired.length).toBeLessThanOrEqual(35)
    expect(input.capabilityDemand).toHaveLength(4)
    expect(new Set(input.capabilityDemand.map((demand) => demand.deadline)).size).toBeGreaterThanOrEqual(2)
    expect(input.recoveryActions.length).toBeGreaterThanOrEqual(20)
    expect(input.recoveryActions.length).toBeLessThanOrEqual(80)
    expect(input.resources.spareParts['PART-SCARCE-A']).toBe(2)
    expect(input.resources.spareParts['PART-DONOR']).toBe(0)
    expect(input.recoveryActions.some((action) => action.type === 'CANNIBALIZE')).toBe(true)
    expect(input.recoveryActions.filter((action) => action.dependsOnActionIds?.length).length).toBeGreaterThanOrEqual(3)
    expect(input.assets.filter((asset) => asset.providedCapabilities.length > 1).length).toBeGreaterThan(3)
  })

  it('evaluates every declared baseline against the same normalized input, seed and sample budget', () => {
    const input = build()
    input.settings.simulationSamples = 24
    input.settings.maxCandidates = 36
    input.settings.beamWidth = 24
    input.settings.maxSearchNodes = 8_000
    input.settings.maxSolveTimeMs = 2_000

    const result = planReadinessRecoveryWithBenchmarkSuite(input)
    expect(result.scenarioId).toBe(input.scenarioId)
    expect(result.frontier.length).toBeGreaterThan(0)
    expect(new Set(result.baselines.map((baseline) => baseline.kind))).toEqual(
      new Set(['FIFO', 'CRITICALITY', 'GREEDY_READINESS', 'RISK_AWARE_GREEDY', 'LOOKAHEAD_2'])
    )

    const actionIds = new Set(input.recoveryActions.map((action) => action.actionId))
    const executableBaselines = result.baselines.filter((baseline) => baseline.scenario !== null)
    expect(executableBaselines.length).toBeGreaterThan(0)

    for (const baseline of executableBaselines) {
      expect(baseline.scenario?.uncertaintySummary.seed).toBe(input.settings.seed)
      expect(baseline.scenario?.uncertaintySummary.samples).toBe(input.settings.simulationSamples)
      for (const actionId of baseline.scenario?.selectedActions ?? []) expect(actionIds.has(actionId)).toBe(true)
    }
  })

  it('never recovers a cannibalized donor in the same selected plan', () => {
    const input = build()
    input.settings.simulationSamples = 16
    input.settings.maxCandidates = 24
    input.settings.beamWidth = 20
    input.settings.maxSearchNodes = 6_000
    input.settings.maxSolveTimeMs = 1_500
    const result = planReadinessRecoveryWithBenchmarkSuite(input)
    const donor = 'ASSET-100:cannibalize-cascade'
    for (const scenario of [
      ...result.frontier,
      ...result.baselines.flatMap((item) => (item.scenario ? [item.scenario] : [])),
    ]) {
      if (!scenario.selectedActions.includes(donor)) continue
      expect(scenario.selectedActions.filter((id) => id.startsWith('ASSET-100:'))).toEqual([donor])
    }
  })

  it('keeps deadline, hard-resource and multi-capability constraints material to the benchmark', () => {
    const input = build()
    expect(input.recoveryActions.some((action) => action.workshopHours >= 10)).toBe(true)
    expect(
      input.recoveryActions.some((action) =>
        action.requiredParts.some((part) => part.partId === 'PART-SCARCE-A')
      )
    ).toBe(true)
    expect(input.recoveryActions.some((action) => action.requiredSkills.length > 1)).toBe(true)
    expect(input.assets.some((asset) => asset.providedCapabilities.length >= 2)).toBe(true)
    expect(
      input.capabilityDemand.some(
        (demand) => Date.parse(demand.deadline) - Date.parse(input.asOf) <= 14 * 3_600_000
      )
    ).toBe(true)
  })
})
