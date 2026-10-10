import { describe, expect, it } from 'vitest'
import { assessObservatoryDecision } from './decision-trust'
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
