import 'server-only'

import { z } from 'zod'

import { DipApiError, dipRequest, runDipPlugin } from '@/shared/dip/server-client'

export { assertSameOriginMutation, ResourceAllocationAccessError } from './server/access'
export { normalizeResourceAllocationBusinessMetrics } from './server/normalize-business-metrics'
export { resourceAllocationRequestSchema, runResourceAllocation, type UiLocale } from './server/run-resource-allocation'
export { DipApiError }

const lifecycleMutationSchema = z.object({
  decision_id: z.string(),
  status: z.string(),
})

const lifecycleCreateSchema = z.object({
  decision_id: z.string(),
  status: z.string(),
  result: z.record(z.string(), z.unknown()),
})

export function runResourceAllocationCapacityGap(input: Record<string, unknown>) {
  return runDipPlugin('resource-allocation', 'humanitarian.resource-allocation.optimize', {
    ...input,
    operation: 'capacity_gap',
  })
}

export function createResourceAllocationDecision(input: Record<string, unknown>) {
  return dipRequest('/api/v1/resource-allocation/decisions', lifecycleCreateSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function recordResourceAllocationFeedback(decisionId: string, feedback: Record<string, unknown>) {
  return dipRequest(
    `/api/v1/resource-allocation/decisions/${encodeURIComponent(decisionId)}/feedback`,
    lifecycleMutationSchema,
    {
      method: 'POST',
      body: JSON.stringify(feedback),
    }
  )
}

export function recordResourceAllocationOutcome(decisionId: string, outcome: Record<string, unknown>) {
  return dipRequest(
    `/api/v1/resource-allocation/decisions/${encodeURIComponent(decisionId)}/outcomes`,
    lifecycleMutationSchema,
    {
      method: 'POST',
      body: JSON.stringify(outcome),
    }
  )
}
