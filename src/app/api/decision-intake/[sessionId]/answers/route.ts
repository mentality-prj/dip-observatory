import { NextResponse } from 'next/server'

import {
  assertDecisionIntakeSameOrigin,
  DecisionIntakeAccessError,
  DecisionIntakeApiError,
  intakeAnswersSchema,
  submitDecisionIntakeAnswers,
} from '@/features/decision-intake/server'

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    assertDecisionIntakeSameOrigin(request)
    const { sessionId } = await context.params
    const input = intakeAnswersSchema.parse(await request.json())
    return NextResponse.json(await submitDecisionIntakeAnswers(sessionId, input), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof DecisionIntakeAccessError)
      return NextResponse.json({ detail: error.message }, { status: error.status })
    if (error instanceof DecisionIntakeApiError)
      return NextResponse.json({ detail: error.message }, { status: error.status })
    return NextResponse.json({ detail: 'Invalid Decision Intake verification request.' }, { status: 422 })
  }
}
