import { describe, expect, it } from 'vitest'
import { SUPPLY_RESILIENCE_DEMO } from './demo-data'
import { createBaselineAllocation, evaluateBaseline } from './baseline-evaluator'

const totalByProduct = (productId: string) => SUPPLY_RESILIENCE_DEMO.nodes.reduce((sum, node) => sum + (node.inventoryUnits[productId] ?? 0), 0)

describe('supply resilience baseline evaluator', () => {
  it('preserves total inventory for both baselines', () => {
    for (const id of ['centralized-baseline', 'equal-decentralization'] as const) {
      const allocation = createBaselineAllocation(SUPPLY_RESILIENCE_DEMO, id)
      for (const product of SUPPLY_RESILIENCE_DEMO.productClasses) {
        expect(allocation.filter((item) => item.productClassId === product.id).reduce((sum, item) => sum + item.units, 0)).toBe(totalByProduct(product.id))
      }
    }
  })

  it('does not place controlled inventory in incompatible nodes', () => {
    const allocation = createBaselineAllocation(SUPPLY_RESILIENCE_DEMO, 'equal-decentralization')
    expect(allocation.some((item) => item.nodeId === 'south-hub' && item.productClassId === 'premium-import')).toBe(false)
  })

  it('produces one outcome per declared scenario', () => {
    const result = evaluateBaseline(SUPPLY_RESILIENCE_DEMO, 'centralized-baseline')
    expect(result.scenarioOutcomes.map((outcome) => outcome.scenarioId)).toEqual(SUPPLY_RESILIENCE_DEMO.scenarios.map((scenario) => scenario.id))
  })

  it('derives service level and loss from scenario availability', () => {
    const centralized = evaluateBaseline(SUPPLY_RESILIENCE_DEMO, 'centralized-baseline')
    const normal = centralized.scenarioOutcomes.find((outcome) => outcome.scenarioId === 'normal')
    const primaryUnavailable = centralized.scenarioOutcomes.find((outcome) => outcome.scenarioId === 'primary-unavailable')
    expect(normal?.serviceLevel).toBeGreaterThan(primaryUnavailable?.serviceLevel ?? 1)
    expect(primaryUnavailable?.inventoryValueAtRisk.amount).toBeGreaterThan(0)
    expect(centralized.worstCaseBusinessLoss.amount).toBeGreaterThan(0)
  })

  it('makes equal decentralization structurally different from centralization', () => {
    const centralized = createBaselineAllocation(SUPPLY_RESILIENCE_DEMO, 'centralized-baseline')
    const equal = createBaselineAllocation(SUPPLY_RESILIENCE_DEMO, 'equal-decentralization')
    expect(equal).not.toEqual(centralized)
  })
})
