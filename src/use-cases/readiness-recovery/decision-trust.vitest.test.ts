import { describe, expect, it } from 'vitest'
import { assessObservatoryDecision, isObservatoryPlannerResult } from './decision-trust'
import type { ReadinessRecoveryResult } from './domain'

function partialResult(frontier: unknown[], truncatedByNodeBudget = false, truncatedByTimeBudget = false) {
  return {
    frontier,
    diagnostics: { truncatedByNodeBudget, truncatedByTimeBudget },
    computeAuthority: 'KERNEL_VERIFIED',
    productionApplyEligible: true,
  } as unknown as ReadinessRecoveryResult
}

describe('Observatory RR decision authority boundary', () => {
  it('never treats even a spoofed Kernel-verification response as production-actionable', () => {
    const trust = assessObservatoryDecision('USER_IMPORTED', partialResult([{ scenarioId: 'a' }]))
    expect(trust).toMatchObject({
      origin: 'USER_IMPORTED',
      computeAuthority: 'OBSERVATORY_SIMULATION',
      validationScope: 'MODEL_ONLY',
      comparativeEvidence: 'EXPLORATORY',
      state: 'CANDIDATES_AVAILABLE',
      productionApplyEligible: false,
      actionRestriction: 'REVIEW_OR_EXPORT_ONLY',
    })
  })

  it('synthetic preset remains demo evidence and is never production-actionable', () => {
    const trust = assessObservatoryDecision('SYNTHETIC_PRESET', partialResult([{ scenarioId: 'a' }]))
    expect(trust.origin).toBe('SYNTHETIC_PRESET')
    expect(trust.productionApplyEligible).toBe(false)
  })

  it('does not call an empty frontier mathematically infeasible', () => {
    const trust = assessObservatoryDecision('USER_IMPORTED', partialResult([]))
    expect(trust.state).toBe('NO_COMPARABLE_CANDIDATES')
  })

  it('reports a bounded search as partial, even if candidates were returned', () => {
    const trust = assessObservatoryDecision('SYNTHETIC_PRESET', partialResult([{ scenarioId: 'a' }], true))
    expect(trust.state).toBe('SEARCH_TRUNCATED')
    expect(trust.productionApplyEligible).toBe(false)
  })

  it('reports time-budget truncation even when the frontier is empty', () => {
    expect(assessObservatoryDecision('USER_IMPORTED', partialResult([], false, true)).state).toBe('SEARCH_TRUNCATED')
  })

  it('fails closed on missing, invalid, or unexecuted planner results', () => {
    expect(assessObservatoryDecision('USER_IMPORTED', null).state).toBe('NOT_RUN')
    for (const invalid of [undefined, {}, { frontier: null }, { frontier: [], diagnostics: {} }]) {
      const trust = assessObservatoryDecision('USER_IMPORTED', invalid as ReadinessRecoveryResult)
      expect(trust.state).toBe('INVALID_RESULT')
      expect(trust.productionApplyEligible).toBe(false)
    }
  })
})

describe('Observatory planner response integrity gate', () => {
  const scenario = {
    scenarioId: 'simulated:1',
    label: 'BALANCED',
    selectedActions: ['repair-a'],
    expectedCapabilityReadiness: 0.8,
    probabilityDemandSatisfied: 0.6,
    capabilityShortfall: 0.4,
    expectedRecoveryTimeHours: 5,
    technicianHours: 4,
    scarcePartsConsumed: 0,
    recoveryFailureRisk: 0.1,
    repeatFailureRisk: 0.05,
    bottlenecks: [],
    bindingConstraints: [],
    drivers: [],
    uncertaintySummary: {
      samples: 500,
      seed: 42,
      demandSatisfiedSamples: 300,
      p10RecoveryTimeHours: 3,
      p50RecoveryTimeHours: 5,
      p90RecoveryTimeHours: 8,
    },
  }

  const response = {
    scenarioId: 'simulated',
    frontier: [scenario],
    baselines: [{ kind: 'FIFO', scenario: null, infeasibleActionIds: [] }],
    diagnostics: {
      searchNodes: 20,
      generatedCandidates: 4,
      feasibleCandidates: 3,
      evaluatedCandidates: 3,
      dominatedPlansRemoved: 1,
      elapsedMs: 14,
      truncatedByNodeBudget: false,
      truncatedByTimeBudget: false,
    },
    inputSummary: { assets: 2, impairedAssets: 1, demands: 1, actions: 1 },
  }

  it('recognizes the existing simulated result shape without elevating authority', () => {
    expect(isObservatoryPlannerResult(response)).toBe(true)
    expect(
      assessObservatoryDecision('USER_IMPORTED', response as ReadinessRecoveryResult).productionApplyEligible
    ).toBe(false)
  })

  it('rejects null, incomplete data, invalid metrics and malformed alternatives', () => {
    const invalid: unknown[] = [
      null,
      { frontier: [] },
      { ...response, frontier: [null] },
      { ...response, frontier: [{ ...scenario, probabilityDemandSatisfied: null }] },
      { ...response, frontier: [{ ...scenario, recoveryFailureRisk: Number.POSITIVE_INFINITY }] },
      { ...response, diagnostics: { ...response.diagnostics, truncatedByTimeBudget: 'yes' } },
      { ...response, baselines: [{ kind: 'FIFO', scenario: {}, infeasibleActionIds: [] }] },
    ]
    for (const value of invalid) expect(isObservatoryPlannerResult(value)).toBe(false)
  })

  it('accepts an empty frontier as a valid negative result, not infeasibility proof', () => {
    const value = { ...response, frontier: [] }
    expect(isObservatoryPlannerResult(value)).toBe(true)
    expect(assessObservatoryDecision('SYNTHETIC_PRESET', value as ReadinessRecoveryResult).state).toBe(
      'NO_COMPARABLE_CANDIDATES'
    )
  })
})
