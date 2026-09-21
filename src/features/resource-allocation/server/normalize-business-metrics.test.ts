import { describe, expect, it } from 'vitest'
import { normalizeResourceAllocationBusinessMetrics } from './normalize-business-metrics'

const plan = {
  aggregate_metrics: {
    priority_coverage: 0.455578,
    total_coverage: 0.284163,
    travel_cost: 13.2,
  },
  demand_summary: {
    total_available: 320,
    served: 259,
    closing_unmet: 61,
    priority_coverage: 0.952206,
  },
}

describe('normalizeResourceAllocationBusinessMetrics', () => {
  it('uses horizon coverage instead of average daily coverage', () => {
    const normalized = normalizeResourceAllocationBusinessMetrics(plan) as typeof plan
    expect(normalized.aggregate_metrics.priority_coverage).toBe(0.952206)
    expect(normalized.aggregate_metrics.total_coverage).toBeCloseTo(259 / 320)
    expect(normalized.aggregate_metrics.travel_cost).toBe(13.2)
  })

  it('normalizes simulated result and every alternative', () => {
    const normalized = normalizeResourceAllocationBusinessMetrics({
      operation: 'simulate',
      result: { ...plan, alternatives: [plan] },
    }) as {
      result: typeof plan & { alternatives: typeof plan[] }
    }

    expect(normalized.result.aggregate_metrics.priority_coverage).toBe(0.952206)
    expect(normalized.result.alternatives[0].aggregate_metrics.priority_coverage).toBe(0.952206)
  })
})
