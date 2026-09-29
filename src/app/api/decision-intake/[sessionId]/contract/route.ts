import { NextResponse } from 'next/server'

import { DecisionIntakeApiError, getDecisionIntakeContract } from '@/features/decision-intake/server'

export async function GET(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params
    return NextResponse.json(await getDecisionIntakeContract(sessionId), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof DecisionIntakeApiError)
      return NextResponse.json({ detail: error.message }, { status: error.status })
    return NextResponse.json({ detail: 'Decision Intake contract request failed.' }, { status: 500 })
  }
}
