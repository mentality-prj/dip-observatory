import type {
  ResourceAllocationInput,
  ResourceAllocationResult,
  ResourceAllocationScenario,
  ResourceAllocationSimulationResponse,
} from './contracts'

const REQUEST_FAILED = 'DIP request failed'
const INFEASIBLE = 'DIP scenario is infeasible for the selected constraints.'

export function buildResourceAllocationInput(
  input: ResourceAllocationInput,
  scenario: ResourceAllocationScenario
): ResourceAllocationInput {
  return {
    ...structuredClone(input),
    operation: 'simulate',
    scenario,
  }
}

export async function runResourceAllocationScenario(
  input: ResourceAllocationInput,
  scenario: ResourceAllocationScenario
): Promise<ResourceAllocationResult> {
  const request = buildResourceAllocationInput(input, scenario)
  const response = await fetch('/api/resource-allocation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  const payload = (await response.json()) as ResourceAllocationSimulationResponse & { error?: string }
  if (!response.ok) throw new Error(payload.error ?? REQUEST_FAILED)
  if (!payload.result || payload.result.status !== 'ok') throw new Error(INFEASIBLE)
  return payload.result
}
