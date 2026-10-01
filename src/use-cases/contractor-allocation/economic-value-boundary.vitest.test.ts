import { describe, expect, it } from 'vitest'

import { calculateEconomicValueBoundary } from './economic-value-boundary'

describe('contractor recovery economic value boundary', () => {
  it('reports no value when the current process matches the optimum and QDIP has operating cost', () => {
    const result = calculateEconomicValueBoundary({
      qdipRecoverySpend: 100_000,
      currentAllocationPremiumPct: 0,
      plannerHours: 0,
      plannerHourlyCost: 0,
      delayDays: 0,
      delayCostPerDay: 0,
      qdipOperatingCost: 5_000,
    })

    expect(result.status).toBe('NO_VALUE')
    expect(result.economicAdvantage).toBe(-5_000)
    expect(result.breakEvenAllocationPremiumPct).toBe(5)
  })

  it('reports positive value only from explicitly supplied current-process costs', () => {
    const result = calculateEconomicValueBoundary({
      qdipRecoverySpend: 100_000,
      currentAllocationPremiumPct: 4,
      plannerHours: 20,
      plannerHourlyCost: 100,
      delayDays: 2,
      delayCostPerDay: 1_000,
      qdipOperatingCost: 3_000,
    })

    expect(result.currentProcessCost).toBe(108_000)
    expect(result.qdipProcessCost).toBe(103_000)
    expect(result.economicAdvantage).toBe(5_000)
    expect(result.status).toBe('POSITIVE_VALUE')
    expect(result.breakEvenAllocationPremiumPct).toBe(0)
  })

  it('sanitizes negative assumptions instead of manufacturing value', () => {
    const result = calculateEconomicValueBoundary({
      qdipRecoverySpend: 100_000,
      currentAllocationPremiumPct: -10,
      plannerHours: -20,
      plannerHourlyCost: 100,
      delayDays: -2,
      delayCostPerDay: 1_000,
      qdipOperatingCost: 0,
    })

    expect(result.currentProcessCost).toBe(100_000)
    expect(result.economicAdvantage).toBe(0)
    expect(result.status).toBe('BREAK_EVEN')
  })
})
