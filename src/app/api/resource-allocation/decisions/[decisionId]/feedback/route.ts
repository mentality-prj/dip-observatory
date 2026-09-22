import { NextResponse } from 'next/server'

import {
  assertResourceAllocationDecisionAccess,
  assertSameOriginMutation,
  ResourceAllocationAccessError,
} from '@/features/resource-allocation/server/access'
import {
  getResourceAllocationDecision,
  ResourceAllocationLifecycleReadError,
} from '@/lib/resource-allocation-lifecycle-api'

import { DipApiError, recordResourceAllocationFeedback } from '@/lib/dip-api'

export async function POST(request: Request, context: { params: Promise<{ decisionId: string }> }) {
  try {
    assertSameOriginMutation(request)
    const { decisionId } = await context.params
    const decision = await getResourceAllocationDecision(decisionId)
    assertResourceAllocationDecisionAccess(request, decision)
    const feedback = (await request.json()) as Record<string, unknown>
    return NextResponse.json(await recordResourceAllocationFeedback(decisionId, feedback))
  } catch (error) {
    if (error instanceof ResourceAllocationAccessError)
      return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof ResourceAllocationLifecycleReadError)
      return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Unexpected Resource Allocation feedback error.' }, { status: 500 })
  }
}
