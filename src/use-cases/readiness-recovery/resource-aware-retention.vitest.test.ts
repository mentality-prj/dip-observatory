import { describe, expect, it } from 'vitest'
import { benchmarkReadinessResult } from './benchmark'
import { planReadinessRecoveryWithBenchmarkSuite } from './benchmark-suite'
import { CASCADING_ROBUSTNESS_VARIANTS } from './cascading-resource-conflict'
import {
  READINESS_RECOVERY_DEMO_PRESETS,
  buildReadinessRecoveryDemo,
  type ReadinessRecoveryDemoPreset,
} from './demo-data'
import type { ReadinessRecoveryInput, RecoveryScenario } from './domain'
import {
  BoundedFeasibilityBackend,
  LegacyBoundedFeasibilityBackend,
  bindingResourceSignature,
  emptyCandidate,
  extendCandidate,
  hasUnresolvedDependency,
} from './optimization-backend'
import { epsilonDominates, planReadinessRecovery } from './planner'

const scenarioKey = (scenario: RecoveryScenario) => [...scenario.selectedActions].sort().join('|')
const candidateKey = (actions: string[]) => [...actions].sort().join('|')

const OBJECTIVES = [
  { value: (scenario: RecoveryScenario) => scenario.expectedCapabilityReadiness, direction: 'MAX' as const },
  { value: (scenario: RecoveryScenario) => scenario.probabilityDemandSatisfied, direction: 'MAX' as const },
  { value: (scenario: RecoveryScenario) => scenario.capabilityShortfall, direction: 'MIN' as const },
  { value: (scenario: RecoveryScenario) => scenario.expectedRecoveryTimeHours, direction: 'MIN' as const },
  { value: (scenario: RecoveryScenario) => scenario.scarcePartsConsumed, direction: 'MIN' as const },
  { value: (scenario: RecoveryScenario) => scenario.technicianHours, direction: 'MIN' as const },
  { value: (scenario: RecoveryScenario) => scenario.recoveryFailureRisk, direction: 'MIN' as const },
  { value: (scenario: RecoveryScenario) => scenario.repeatFailureRisk, direction: 'MIN' as const },
]

function tolerance(value: number, epsilon: number) {
  return epsilon * Math.max(1, Math.abs(value))
}

function epsilonEquivalent(left: RecoveryScenario, right: RecoveryScenario, epsilon: number) {
  return OBJECTIVES.every((objective) => {
    const leftValue = objective.value(left)
    const rightValue = objective.value(right)
    return Math.abs(leftValue - rightValue) <= tolerance(rightValue, epsilon)
  })
}

function frontierCovered(legacy: RecoveryScenario[], current: RecoveryScenario[], epsilon: number) {
  return legacy.every((legacyPoint) =>
    current.some(
      (newPoint) => epsilonDominates(newPoint, legacyPoint, epsilon) || epsilonEquivalent(newPoint, legacyPoint, epsilon)
    )
  )
}

function applyRobustnessVariant(
  input: ReadinessRecoveryInput,
  variant: (typeof CASCADING_ROBUSTNESS_VARIANTS)[number]
) {
  const changed = structuredClone(input)
  const deadlinePct = 'deadlinePct' in variant.changes ? variant.changes.deadlinePct : undefined
  const technicianPct = 'technicianPct' in variant.changes ? variant.changes.technicianPct : undefined
  const partsPct = 'partsPct' in variant.changes ? variant.changes.partsPct : undefined
  const successPct = 'successPct' in variant.changes ? variant.changes.successPct : undefined

  if (deadlinePct) {
    const asOf = Date.parse(changed.asOf)
    changed.capabilityDemand = changed.capabilityDemand.map((demand) => ({
      ...demand,
      deadline: new Date(asOf + (Date.parse(demand.deadline) - asOf) * (deadlinePct / 100)).toISOString(),
    }))
  }
  if (technicianPct) {
    changed.resources.technicianHours = Object.fromEntries(
      Object.entries(changed.resources.technicianHours).map(([key, value]) => [key, value * (technicianPct / 100)])
    )
  }
  if (partsPct) {
    changed.resources.spareParts = Object.fromEntries(
      Object.entries(changed.resources.spareParts).map(([key, value]) => [key, Math.floor(value * (partsPct / 100))])
    )
  }
  if (successPct) {
    changed.recoveryActions = changed.recoveryActions.map((action) => ({
      ...action,
      successProbability: Math.min(1, Math.max(0, action.successProbability * (successPct / 100))),
    }))
  }
  changed.scenarioId = `${input.scenarioId}:robustness:${variant.id}`
  return changed
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

function measureSearch(input: ReadinessRecoveryInput, legacy: boolean) {
  const backend = legacy ? new LegacyBoundedFeasibilityBackend() : new BoundedFeasibilityBackend()
  const started = performance.now()
  const result = backend.generateCandidates(input)
  return { durationMs: performance.now() - started, result }
}

function compareFrontiers(input: ReadinessRecoveryInput) {
  const legacy = planReadinessRecovery(input, new LegacyBoundedFeasibilityBackend())
  const current = planReadinessRecovery(input, new BoundedFeasibilityBackend())
  return {
    covered: frontierCovered(legacy.frontier, current.frontier, input.settings.epsilon),
    legacy,
    current,
  }
}

describe('Readiness Recovery frozen resource-aware retention repair', () => {
  it('uses generic canonical dependency and binding-resource semantics', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const donorRepair = input.recoveryActions.find((action) => action.actionId === 'ASSET-003:cascade-donor-repair')
    const donor = input.recoveryActions.find((action) => action.actionId === 'ASSET-100:cannibalize-cascade')

    expect(donorRepair).toBeDefined()
    expect(donor).toBeDefined()
    if (!donorRepair || !donor) return

    const unresolved = extendCandidate(input, emptyCandidate(), donorRepair)
    expect(unresolved).not.toBeNull()
    if (!unresolved) return
    expect(hasUnresolvedDependency(input, unresolved)).toBe(true)

    const resolved = extendCandidate(input, unresolved, donor)
    expect(resolved).not.toBeNull()
    if (!resolved) return
    expect(hasUnresolvedDependency(input, resolved)).toBe(false)

    resolved.bindingConstraints = ['TECHNICIAN_SKILL:mechanical', 'WORKSHOP_CAPACITY']
    expect(bindingResourceSignature(resolved)).toBe('TECHNICIAN_SKILL:mechanical|WORKSHOP_CAPACITY')
  })

  it('passes the base economic/search-quality gate without scenario-specific rules', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const benchmarked = planReadinessRecoveryWithBenchmarkSuite(input)
    const baseline = benchmarked.baselines.find((item) => item.kind === 'RISK_AWARE_GREEDY')?.scenario

    expect(baseline).toBeDefined()
    if (!baseline) return

    const knownSuperiorKeys = new Set([
      candidateKey(baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-002:limited')),
      candidateKey(baseline.selectedActions.filter((actionId) => actionId !== 'ASSET-022:full')),
    ])
    const generated = new BoundedFeasibilityBackend().generateCandidates(input)
    const generatedKeys = new Set(generated.candidates.map((candidate) => candidateKey(candidate.selectedActionIds)))
    const evaluated = planReadinessRecovery(input, new BoundedFeasibilityBackend())
    const benchmark = benchmarkReadinessResult(benchmarked)

    console.info(
      'RR_RESOURCE_AWARE_BASE_GATE',
      JSON.stringify({
        verdict: benchmark.verdict,
        generatedCandidates: generated.candidates.length,
        searchNodes: generated.searchNodes,
        knownSuperiorRetained: [...knownSuperiorKeys].filter((key) => generatedKeys.has(key)).length,
        epsilonDominators: evaluated.frontier.filter((scenario) => epsilonDominates(scenario, baseline, input.settings.epsilon)).map(scenarioKey),
      })
    )

    expect([...knownSuperiorKeys].some((key) => generatedKeys.has(key))).toBe(true)
    expect(evaluated.diagnostics.evaluatedCandidates).toBe(generated.candidates.length)
    expect(evaluated.frontier.some((scenario) => epsilonDominates(scenario, baseline, input.settings.epsilon))).toBe(true)
    expect(benchmark.verdict).toBe('QDIP_ADVANTAGE')
    expect(generated.truncatedByNodeBudget).toBe(false)
    expect(generated.truncatedByTimeBudget).toBe(false)
  }, 20_000)

  it('has zero material regressions across existing RR presets', () => {
    const results = READINESS_RECOVERY_DEMO_PRESETS.map((preset: ReadinessRecoveryDemoPreset) => {
      const input = buildReadinessRecoveryDemo(preset)
      const compared = compareFrontiers(input)
      return {
        preset,
        covered: compared.covered,
        legacyFrontier: compared.legacy.frontier.length,
        currentFrontier: compared.current.frontier.length,
        legacyTruncated: compared.legacy.diagnostics.truncatedByNodeBudget || compared.legacy.diagnostics.truncatedByTimeBudget,
        currentTruncated: compared.current.diagnostics.truncatedByNodeBudget || compared.current.diagnostics.truncatedByTimeBudget,
      }
    })

    console.info('RR_RESOURCE_AWARE_PRESET_GATE', JSON.stringify(results))
    expect(results.every((result) => result.covered)).toBe(true)
    expect(results.every((result) => !result.currentTruncated)).toBe(true)
  }, 60_000)

  it('has zero material regressions across frozen cascading robustness variants', () => {
    const base = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')
    const results = CASCADING_ROBUSTNESS_VARIANTS.map((variant) => {
      const input = applyRobustnessVariant(base, variant)
      const compared = compareFrontiers(input)
      return {
        variantId: variant.id,
        covered: compared.covered,
        legacyFrontier: compared.legacy.frontier.length,
        currentFrontier: compared.current.frontier.length,
        currentTruncated: compared.current.diagnostics.truncatedByNodeBudget || compared.current.diagnostics.truncatedByTimeBudget,
      }
    })

    console.info('RR_RESOURCE_AWARE_ROBUSTNESS_GATE', JSON.stringify(results))
    expect(results.every((result) => result.covered)).toBe(true)
    expect(results.every((result) => !result.currentTruncated)).toBe(true)
  }, 60_000)

  it('is deterministic and stays within the frozen 1.20x search budget gate', () => {
    const input = buildReadinessRecoveryDemo('CASCADING_RESOURCE_CONFLICT')

    new LegacyBoundedFeasibilityBackend().generateCandidates(input)
    new BoundedFeasibilityBackend().generateCandidates(input)

    const legacyDurations: number[] = []
    const currentDurations: number[] = []
    let legacyResult = new LegacyBoundedFeasibilityBackend().generateCandidates(input)
    let currentResult = new BoundedFeasibilityBackend().generateCandidates(input)

    for (let index = 0; index < 7; index += 1) {
      const legacyFirst = index % 2 === 0
      const first = measureSearch(input, legacyFirst)
      const second = measureSearch(input, !legacyFirst)
      if (legacyFirst) {
        legacyDurations.push(first.durationMs)
        currentDurations.push(second.durationMs)
        legacyResult = first.result
        currentResult = second.result
      } else {
        currentDurations.push(first.durationMs)
        legacyDurations.push(second.durationMs)
        currentResult = first.result
        legacyResult = second.result
      }
    }

    const rerun = new BoundedFeasibilityBackend().generateCandidates(input)
    const runtimeRatio = median(currentDurations) / Math.max(Number.EPSILON, median(legacyDurations))
    const nodeRatio = currentResult.searchNodes / Math.max(1, legacyResult.searchNodes)
    const keys = (result: typeof currentResult) => result.candidates.map((candidate) => candidateKey(candidate.selectedActionIds))

    console.info(
      'RR_RESOURCE_AWARE_PERFORMANCE_GATE',
      JSON.stringify({
        legacyMedianMs: median(legacyDurations),
        currentMedianMs: median(currentDurations),
        runtimeRatio,
        legacySearchNodes: legacyResult.searchNodes,
        currentSearchNodes: currentResult.searchNodes,
        nodeRatio,
      })
    )

    expect(keys(rerun)).toEqual(keys(currentResult))
    expect(runtimeRatio).toBeLessThanOrEqual(1.2)
    expect(nodeRatio).toBeLessThanOrEqual(1.2)
    expect(currentResult.truncatedByNodeBudget).toBe(false)
    expect(currentResult.truncatedByTimeBudget).toBe(false)
  }, 30_000)
})
