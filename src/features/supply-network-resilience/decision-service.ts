import type { InventoryAllocation, SupplyResilienceAlternative, SupplyResilienceDecision, SupplyResilienceInput } from './domain'
import { evaluateBaseline } from './baseline-evaluator'

export type ConstraintViolation = { code: string; message: string }
export type ValidationGate = { passes: boolean; violations: readonly ConstraintViolation[]; dominatesBaselines: boolean }

const totalInventory = (input: SupplyResilienceInput) => input.productClasses.reduce((sum, product) => sum + input.nodes.reduce((nodeSum, node) => nodeSum + (node.inventoryUnits[product.id] ?? 0), 0), 0)

function nodeExposure(input: SupplyResilienceInput, allocation: readonly InventoryAllocation[]): number {
  const total = totalInventory(input)
  if (!total) return 0
  return Math.max(...input.nodes.map((node) => allocation.filter((item) => item.nodeId === node.id).reduce((sum, item) => sum + item.units, 0) / total))
}

export function validateAlternative(input: SupplyResilienceInput, alternative: SupplyResilienceAlternative): readonly ConstraintViolation[] {
  const violations: ConstraintViolation[] = []
  const exposure = nodeExposure(input, alternative.allocation)
  if (exposure > input.policy.maximumNodeInventoryExposure) violations.push({ code: 'node-exposure', message: `Node exposure ${exposure.toFixed(3)} exceeds ${input.policy.maximumNodeInventoryExposure.toFixed(3)}` })
  if (alternative.incrementalLogisticsCost.amount > input.policy.maximumIncrementalLogisticsCost.amount) violations.push({ code: 'logistics-cost', message: 'Incremental logistics cost exceeds policy limit' })
  for (const outcome of alternative.scenarioOutcomes) if (outcome.serviceLevel < input.policy.minimumServiceLevel) violations.push({ code: `service-level:${outcome.scenarioId}`, message: `Service level in ${outcome.scenarioId} is below policy target` })
  return violations
}

function score(alternative: SupplyResilienceAlternative): number {
  return alternative.worstCaseBusinessLoss.amount + alternative.incrementalLogisticsCost.amount
}

export function createRecommendedCandidate(input: SupplyResilienceInput): SupplyResilienceAlternative {
  const equal = evaluateBaseline(input, 'equal-decentralization')
  return { ...equal, id: 'recommended', label: 'Resilience recommendation' }
}

export function evaluateDecision(input: SupplyResilienceInput): { decision: SupplyResilienceDecision; gate: ValidationGate } {
  const centralized = evaluateBaseline(input, 'centralized-baseline')
  const equal = evaluateBaseline(input, 'equal-decentralization')
  const recommended = createRecommendedCandidate(input)
  const violations = validateAlternative(input, recommended)
  const dominatesBaselines = score(recommended) < score(centralized) && score(recommended) < score(equal)
  const passes = violations.length === 0 && dominatesBaselines
  const alternatives = [centralized, equal, recommended] as const
  return {
    decision: {
      objective: 'minimize-worst-case-business-loss',
      recommendedAlternativeId: passes ? 'recommended' : alternatives.reduce((best, candidate) => score(candidate) < score(best) ? candidate : best).id,
      alternatives,
      bindingConstraints: violations.map((violation) => violation.code),
      rationale: passes
        ? ['Recommended candidate improves both baselines and satisfies policy constraints.']
        : ['Validation gate is not satisfied; recommendation must not be presented as validated.'],
    },
    gate: { passes, violations, dominatesBaselines },
  }
}
