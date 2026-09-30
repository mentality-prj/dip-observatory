import { NextResponse } from 'next/server'

import {
  assertDecisionIntakeSameOrigin,
  DecisionIntakeAccessError,
  DecisionIntakeApiError,
  executeDecisionIntake,
} from '@/features/decision-intake/server'

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    assertDecisionIntakeSameOrigin(request)
    const { sessionId } = await context.params
    return NextResponse.json(await executeDecisionIntake(sessionId), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof DecisionIntakeAccessError)
      return NextResponse.json({ detail: error.message }, { status: error.status })
    if (error instanceof DecisionIntakeApiError)
      return NextResponse.json({ detail: error.message }, { status: error.status })
    return NextResponse.json({ detail: 'Decision Intake execution failed.' }, { status: 500 })
  }
}
