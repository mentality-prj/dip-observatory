import { NextResponse } from 'next/server'

import { DipApiError, runResourceAllocationCapacityGap } from '@/features/resource-allocation/server'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as Record<string, unknown>
    return NextResponse.json(
      await runResourceAllocationCapacityGap(input)
    )
  } catch (error) {
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected Resource Allocation capacity analysis error.' },
      { status: 500 }
    )
  }
}
