import type {
  ResourceAllocationResult,
  ResourceAllocationScenario,
  ResourceAllocationSimulationResponse,
} from './contracts'
import { RESOURCE_ALLOCATION_DEMO } from './demo-data'

const REQUEST_FAILED = 'DIP request failed'
const INFEASIBLE = 'DIP scenario is infeasible for the selected constraints.'

export function buildResourceAllocationInput(scenario: ResourceAllocationScenario) {
  return { ...RESOURCE_ALLOCATION_DEMO, operation: 'simulate' as const, scenario }
}

export async function runResourceAllocationScenario(
  scenario: ResourceAllocationScenario
): Promise<ResourceAllocationResult> {
  const response = await fetch('/api/resource-allocation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildResourceAllocationInput(scenario)),
  })

  const payload = (await response.json()) as ResourceAllocationSimulationResponse & { error?: string }
  if (!response.ok) throw new Error(payload.error ?? REQUEST_FAILED)
  if (!payload.result || payload.result.status !== 'ok') throw new Error(INFEASIBLE)
  return payload.result
}
