import { NextResponse } from 'next/server'

import { DipApiError, runDipPlugin } from '@/lib/dip-api'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as Record<string, unknown>
    return NextResponse.json(
      await runDipPlugin('resource-allocation', 'humanitarian.resource-allocation.optimize', {
        ...input,
        operation: 'capacity_gap',
      })
    )
  } catch (error) {
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected Resource Allocation capacity analysis error.' },
      { status: 500 }
    )
  }
}
