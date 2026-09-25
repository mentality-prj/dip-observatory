import type {
  CandidateResult,
  CandidateWarehouse,
  EconomicComparison,
  OptimizationResult,
  ScenarioComparison,
  SupplyNetwork,
} from './domain'

type Action =
  | { action: 'optimize'; network: SupplyNetwork }
  | { action: 'unavailable'; network: SupplyNetwork; warehouseId: string }
  | { action: 'candidates'; network: SupplyNetwork }
  | { action: 'candidate'; network: SupplyNetwork; candidate: CandidateWarehouse }

export type SupplyNetworkRequestErrorKind = 'invalid' | 'infeasible' | 'unavailable' | 'request'

export class SupplyNetworkRequestError extends Error {
  kind: SupplyNetworkRequestErrorKind

  constructor(kind: SupplyNetworkRequestErrorKind) {
    super(kind)
    this.name = 'SupplyNetworkRequestError'
    this.kind = kind
  }
}

function errorKind(status: number): SupplyNetworkRequestErrorKind {
  if (status === 400 || status === 403) return 'invalid'
  if (status === 409 || status === 422) return 'infeasible'
  if (status === 502 || status === 503 || status === 504) return 'unavailable'
  return 'request'
}

async function run<T>(input: Action): Promise<{ result: T; decisionValue?: EconomicComparison }> {
  let response: Response
  try {
    response = await fetch('/api/supply-network/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new SupplyNetworkRequestError('unavailable')
  }

  let payload: { result?: unknown; decision_value?: unknown }
  try {
    payload = (await response.json()) as { result?: unknown; decision_value?: unknown }
  } catch {
    throw new SupplyNetworkRequestError(response.ok ? 'request' : errorKind(response.status))
  }

  if (!response.ok) throw new SupplyNetworkRequestError(errorKind(response.status))
  if (payload.result === undefined) throw new SupplyNetworkRequestError('request')
  return { result: payload.result as T, decisionValue: payload.decision_value as EconomicComparison | undefined }
}

export const runOptimization = async (network: SupplyNetwork) =>
  (await run<OptimizationResult>({ action: 'optimize', network })).result

export const runUnavailableScenario = (network: SupplyNetwork, warehouseId: string) =>
  run<ScenarioComparison>({ action: 'unavailable', network, warehouseId })

export const runCandidateAreas = async (network: SupplyNetwork) =>
  (
    await run<{
      disrupted_network: OptimizationResult
      candidates: CandidateResult[]
      pareto_frontier_candidate_ids: string[]
      connectivity_rule: string
    }>({ action: 'candidates', network })
  ).result

export const runManualCandidate = (network: SupplyNetwork, candidate: CandidateWarehouse) =>
  run<{
    baseline: OptimizationResult
    candidate: CandidateResult
    optimized_network: OptimizationResult
    connectivity_rule: string
  }>({ action: 'candidate', network, candidate })
