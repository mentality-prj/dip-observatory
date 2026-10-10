import { describe, expect, it } from 'vitest'
import { orderReviewAlternatives, explainReviewDifference } from './decision-policy'
import type { ReadinessRecoveryResult, RecoveryScenario } from './domain'

const example = (id: string, time: number, parts: number, risk: number): RecoveryScenario => ({
  scenarioId: id,
  label: 'BALANCED',
  selectedActions: [],
  expectedCapabilityReadiness: 0.8,
  probabilityDemandSatisfied: 0.7,
  capabilityShortfall: 0.2,
  expectedRecoveryTimeHours: time,
  technicianHours: 10,
  scarcePartsConsumed: parts,
  recoveryFailureRisk: risk,
  repeatFailureRisk: 0,
  bottlenecks: [],
  bindingConstraints: [],
  drivers: [],
  uncertaintySummary: {
    samples: 500,
    seed: 1,
    demandSatisfiedSamples: 350,
    p10RecoveryTimeHours: 1,
    p50RecoveryTimeHours: 2,
    p90RecoveryTimeHours: 3,
  },
  paretoExplanation: '',
})
describe('explicit priorities affect presentation only', () => {
  const a = example('a', 9, 0.1, 0.3),
    b = example('b', 2, 0.9, 0.1)
  const result = { frontier: [a, b] } as unknown as ReadinessRecoveryResult
  it('orders time and parts priorities without mutating source candidates', () => {
    expect(orderReviewAlternatives(result, 'RECOVERY_TIME')[0].scenarioId).toBe('b')
    expect(orderReviewAlternatives(result, 'PARTS')[0].scenarioId).toBe('a')
    expect(result.frontier.map((x) => x.scenarioId)).toEqual(['a', 'b'])
  })
  it('expresses numerical deltas with correct sign', () => {
    expect(explainReviewDifference(a, b).recoveryHours).toBe(7)
    expect(explainReviewDifference(a, b).scarceParts).toBeCloseTo(-0.8)
  })
  it('handles empty candidate sets without inventing a winner', () => {
    expect(orderReviewAlternatives({ frontier: [] } as unknown as ReadinessRecoveryResult, 'READINESS')).toEqual([])
  })
})
