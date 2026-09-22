import { NextResponse } from 'next/server'

import {
  assertSameOriginMutation,
  ResourceAllocationAccessError,
} from '@/features/resource-allocation/server/access'
import { createResourceAllocationDecision, DipApiError } from '@/lib/dip-api'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as Record<string, unknown>
    assertSameOriginMutation(request)
    return NextResponse.json(await createResourceAllocationDecision(input))
  } catch (error) {
    if (error instanceof ResourceAllocationAccessError)
      return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected Resource Allocation decision error.' },
      { status: 500 }
    )
  }
}
