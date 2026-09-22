import { NextResponse } from 'next/server'

import {
  assertSameOriginMutation,
  ResourceAllocationAccessError,
} from '@/features/resource-allocation/server/access'
import { DipApiError, recordResourceAllocationOutcome } from '@/lib/dip-api'

export async function POST(request: Request, context: { params: Promise<{ decisionId: string }> }) {
  try {
    assertSameOriginMutation(request)
    const { decisionId } = await context.params
    const outcome = (await request.json()) as Record<string, unknown>
    return NextResponse.json(await recordResourceAllocationOutcome(decisionId, outcome))
  } catch (error) {
    if (error instanceof ResourceAllocationAccessError)
      return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Unexpected Resource Allocation outcome error.' }, { status: 500 })
  }
}
