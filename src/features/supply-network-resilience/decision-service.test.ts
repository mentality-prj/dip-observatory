import { describe, expect, it } from 'vitest'
import { SUPPLY_RESILIENCE_DEMO } from './demo-data'
import { evaluateDecision, validateAlternative } from './decision-service'

describe('supply resilience decision gate', () => {
  it('does not validate a recommendation that merely copies a baseline', () => {
    const { decision, gate } = evaluateDecision(SUPPLY_RESILIENCE_DEMO)
    expect(decision.alternatives).toHaveLength(3)
    expect(gate.dominatesBaselines).toBe(false)
    expect(gate.passes).toBe(false)
    expect(decision.rationale[0]).toContain('not satisfied')
  })

  it('reports policy violations explicitly', () => {
    const { decision } = evaluateDecision(SUPPLY_RESILIENCE_DEMO)
    const candidate = decision.alternatives.find((alternative) => alternative.id === 'recommended')
    expect(candidate).toBeDefined()
    expect(validateAlternative(SUPPLY_RESILIENCE_DEMO, candidate!)).toEqual(expect.any(Array))
  })
})
