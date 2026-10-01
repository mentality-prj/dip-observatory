import { describe, expect, it } from 'vitest'
import { buildReadinessRecoveryDemo } from './demo-data'
import type { ReadinessRecoveryInput, RecoveryScenario } from './domain'
import { BoundedFeasibilityBackend } from './optimization-backend'
import { epsilonDominates, paretoFrontier, planReadinessRecovery } from './planner'

function scenario(overrides: Partial<RecoveryScenario>): RecoveryScenario {
  return {
    scenarioId: 'scenario',
    label: 'BALANCED',
    selectedActions: [],
    expectedCapabilityReadiness: 0.8,
    probabilityDemandSatisfied: 0.7,
    capabilityShortfall: 2,
    expectedRecoveryTimeHours: 20,
    technicianHours: 10,
    scarcePartsConsumed: 1,
    recoveryFailureRisk: 0.1,
    repeatFailureRisk: 0.05,
    bottlenecks: [],
    bindingConstraints: [],
    uncertaintySummary: {
      samples: 100,
      seed: 1,
      demandSatisfiedSamples: 70,
      p10RecoveryTimeHours: 10,
      p50RecoveryTimeHours: 20,
      p90RecoveryTimeHours: 30,
    },
    paretoExplanation: '',
    drivers: [],
    ...overrides,
  }
}

describe('Readiness Recovery Planner', () => {
  it('builds bounded feasible scenarios for the 100 asset synthetic data set', () => {
    const input = buildReadinessRecoveryDemo('BALANCED')
    input.settings.simulationSamples = 12
    input.settings.beamWidth = 24
    input.settings.maxCandidates = 40
    const result = planReadinessRecovery(input)
    expect(result.inputSummary.assets).toBe(100)
    expect(result.inputSummary.impairedAssets).toBeGreaterThanOrEqual(20)
    expect(result.inputSummary.impairedAssets).toBeLessThanOrEqual(40)
    expect(result.diagnostics.evaluatedCandidates).toBeLessThanOrEqual(input.settings.maxCandidates)
    expect(result.frontier.length).toBeGreaterThanOrEqual(3)
    expect(result.frontier.every((item) => item.uncertaintySummary.samples === 12)).toBe(true)
  })

  it('enforces parts, technician-hours and workshop capacity before stochastic evaluation', () => {
    const input = buildReadinessRecoveryDemo('BALANCED')
    input.resources.workshopHours = 0
    input.resources.technicianHours = Object.fromEntries(
      Object.keys(input.resources.technicianHours).map((skill) => [skill, 0])
    )
    input.resources.spareParts = Object.fromEntries(Object.keys(input.resources.spareParts).map((part) => [part, 0]))
    const generated = new BoundedFeasibilityBackend().generateCandidates(input)
    expect(generated.candidates.every((candidate) => candidate.workshopHours === 0)).toBe(true)
    expect(generated.candidates.every((candidate) => candidate.technicianHours === 0)).toBe(true)
    expect(
      generated.candidates.every((candidate) => Object.values(candidate.partsConsumed).every((value) => value === 0))
    ).toBe(true)
  })

  it('does not allow a cannibalization-dependent repair without its donor action', () => {
    const input = buildReadinessRecoveryDemo('CANNIBALIZATION')
    const generated = new BoundedFeasibilityBackend().generateCandidates(input)
    for (const candidate of generated.candidates) {
      if (candidate.selectedActionIds.includes('ASSET-004:limited')) {
        expect(candidate.selectedActionIds).toContain('ASSET-100:cannibalize')
      }
    }
  })

  it('uses epsilon dominance without collapsing material trade-offs', () => {
    const readiness = scenario({ scenarioId: 'readiness', probabilityDemandSatisfied: 0.9, technicianHours: 20 })
    const efficient = scenario({ scenarioId: 'efficient', probabilityDemandSatisfied: 0.75, technicianHours: 7 })
    const dominated = scenario({
      scenarioId: 'dominated',
      probabilityDemandSatisfied: 0.68,
      expectedCapabilityReadiness: 0.76,
      capabilityShortfall: 3,
      expectedRecoveryTimeHours: 25,
      technicianHours: 12,
      scarcePartsConsumed: 1.4,
      recoveryFailureRisk: 0.14,
      repeatFailureRisk: 0.08,
    })
    expect(epsilonDominates(efficient, dominated, 0.001)).toBe(true)
    expect(
      paretoFrontier([readiness, efficient, dominated], 0.001)
        .map((item) => item.scenarioId)
        .sort()
    ).toEqual(['efficient', 'readiness'])
  })

  it('gives heuristics access to the same donor action space as QDIP', () => {
    const input = buildReadinessRecoveryDemo('CAPABILITY_RESCUE')
    input.settings.simulationSamples = 40
    input.settings.maxCandidates = 60
    const result = planReadinessRecovery(input)
    const donorId = 'ASSET-100:cannibalize-rescue'
    const dependentIds = new Set(['ASSET-001:rescue-repair', 'ASSET-006:rescue-repair'])

    for (const baseline of result.baselines) {
      if (!baseline.scenario) continue
      const selected = new Set(baseline.scenario.selectedActions)
      if ([...dependentIds].some((id) => selected.has(id))) expect(selected.has(donorId)).toBe(true)
    }
    expect(result.baselines.some((baseline) => baseline.scenario?.selectedActions.includes(donorId))).toBe(true)
  })

  it('adds dependency completion time before a dependent repair can complete', () => {
    const input = buildReadinessRecoveryDemo('CAPABILITY_RESCUE')
    input.settings.simulationSamples = 40
    input.settings.maxCandidates = 60
    const result = planReadinessRecovery(input)
    const rescueScenario = result.frontier.find(
      (item) =>
        item.selectedActions.includes('ASSET-100:cannibalize-rescue') &&
        item.selectedActions.includes('ASSET-001:rescue-repair') &&
        item.selectedActions.includes('ASSET-006:rescue-repair')
    )
    expect(rescueScenario).toBeDefined()
    expect(rescueScenario!.uncertaintySummary.p10RecoveryTimeHours).toBeGreaterThanOrEqual(8)
  })

  it('uses common random numbers so the same action has candidate-independent stochastic draws', () => {
    const input = buildReadinessRecoveryDemo('LOW_SUCCESS_CRITICAL')
    input.settings.simulationSamples = 20
    input.settings.beamWidth = 16
    input.settings.maxCandidates = 24
    const first = planReadinessRecovery(input)
    const second = planReadinessRecovery(structuredClone(input))
    expect(second.frontier).toEqual(first.frontier)
    expect(second.baselines).toEqual(first.baselines)
    expect(
      [...first.frontier, ...first.baselines.flatMap((item) => (item.scenario ? [item.scenario] : []))].every(
        (item) => item.uncertaintySummary.seed === input.settings.seed
      )
    ).toBe(true)
  })

  it('rejects an incompatible replacement type', () => {
    const input = buildReadinessRecoveryDemo('BALANCED') as ReadinessRecoveryInput
    const asset = input.assets.find((item) => item.currentState === 'FAILED')!
    input.recoveryActions = [
      {
        actionId: `${asset.assetId}:bad-replacement`,
        assetId: asset.assetId,
        type: 'REPLACE',
        requiredParts: [],
        requiredSkills: [],
        workshopHours: 0,
        durationDistribution: { kind: 'DETERMINISTIC', value: 1 },
        successProbability: 1,
        resultingReliabilityDistribution: { kind: 'DETERMINISTIC', value: 1 },
        repeatFailureProbability: 0,
        replacementAssetType: 'INCOMPATIBLE-TYPE',
      },
    ]
    input.resources.replacementAssets['INCOMPATIBLE-TYPE'] = 10
    const generated = new BoundedFeasibilityBackend().generateCandidates(input)
    expect(
      generated.candidates.every(
        (candidate) => !candidate.selectedActionIds.includes(`${asset.assetId}:bad-replacement`)
      )
    ).toBe(true)
  })
})
