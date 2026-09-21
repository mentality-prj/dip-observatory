import { NextResponse } from 'next/server'

import { DipApiError, recordResourceAllocationFeedback } from '@/lib/dip-api'

export async function POST(request: Request, context: { params: Promise<{ decisionId: string }> }) {
  try {
    const { decisionId } = await context.params
    const feedback = (await request.json()) as Record<string, unknown>
    return NextResponse.json(await recordResourceAllocationFeedback(decisionId, feedback))
  } catch (error) {
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Unexpected Resource Allocation feedback error.' }, { status: 500 })
  }
}
