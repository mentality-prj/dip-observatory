import { NextResponse } from 'next/server'

import {
  assertResourceAllocationDecisionAccess,
  ResourceAllocationAccessError,
} from '@/features/resource-allocation/server/access'
import {
  getResourceAllocationDecision,
  ResourceAllocationLifecycleReadError,
} from '@/lib/resource-allocation-lifecycle-api'

export async function GET(request: Request, context: { params: Promise<{ decisionId: string }> }) {
  try {
    const { decisionId } = await context.params
    const decision = await getResourceAllocationDecision(decisionId)
    assertResourceAllocationDecisionAccess(request, decision)
    return NextResponse.json(decision)
  } catch (error) {
    if (error instanceof ResourceAllocationAccessError)
      return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof ResourceAllocationLifecycleReadError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Unexpected Resource Allocation lifecycle read error.' }, { status: 500 })
  }
}
