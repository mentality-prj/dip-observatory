export type SupplyNode = {
  id: string
  label: string
  capacity: number
  inventoryValue: number
}

export type SupplyFlow = {
  from: string
  to: string
  share: number
}

export type SupplyResilienceScenario = {
  id: string
  label: string
  unavailableNodeId: string | null
}

export type SupplyResilienceInput = {
  nodes: readonly SupplyNode[]
  flows: readonly SupplyFlow[]
  scenarios: readonly SupplyResilienceScenario[]
  maxNodeExposure: number
  serviceLevelTarget: number
}

export type SupplyResilienceAlternative = {
  id: string
  label: string
  exposure: number
  serviceLevel: number
  incrementalCost: number
  recoveryDays: number
}

export type SupplyResilienceDecision = {
  recommendedAlternativeId: string
  alternatives: readonly SupplyResilienceAlternative[]
  rationale: readonly string[]
}

/**
 * Frontend port for the Supply Network Resilience capability.
 * The demo can use a deterministic adapter while the production implementation
 * is supplied by the QDIP plugin without leaking transport details into UI code.
 */
export interface SupplyResilienceDecisionPort {
  evaluate(input: SupplyResilienceInput): Promise<SupplyResilienceDecision>
}
