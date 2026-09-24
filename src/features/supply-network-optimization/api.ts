import type {
  CandidateResult,
  CandidateWarehouse,
  OptimizationResult,
  ScenarioComparison,
  SupplyNetwork,
} from './domain'

type Action =
  | { action: 'optimize'; network: SupplyNetwork }
  | { action: 'unavailable'; network: SupplyNetwork; warehouseId: string }
  | { action: 'candidates'; network: SupplyNetwork }
  | { action: 'candidate'; network: SupplyNetwork; candidate: CandidateWarehouse }

async function run<T>(input: Action): Promise<T> {
  const response = await fetch('/api/supply-network/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const payload = (await response.json()) as { result?: unknown; error?: string; causes?: string[] }
  if (!response.ok || payload.result === undefined) {
    const details = payload.causes?.length ? ` (${payload.causes.join(', ')})` : ''
    throw new Error((payload.error ?? 'Supply network optimization failed') + details)
  }
  return payload.result as T
}

export const runOptimization = (network: SupplyNetwork) =>
  run<OptimizationResult>({ action: 'optimize', network })

export const runUnavailableScenario = (network: SupplyNetwork, warehouseId: string) =>
  run<ScenarioComparison>({ action: 'unavailable', network, warehouseId })

export const runCandidateAreas = (network: SupplyNetwork) =>
  run<{
    disrupted_network: OptimizationResult
    candidates: CandidateResult[]
    recommended_candidate_id: string | null
    pareto_frontier_candidate_ids: string[]
    connectivity_rule: string
  }>({ action: 'candidates', network })

export const runManualCandidate = (network: SupplyNetwork, candidate: CandidateWarehouse) =>
  run<{
    baseline: OptimizationResult
    candidate: CandidateResult
    optimized_network: OptimizationResult
    connectivity_rule: string
  }>({ action: 'candidate', network, candidate })
