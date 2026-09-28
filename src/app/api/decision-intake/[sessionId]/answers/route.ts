import { NextResponse } from 'next/server'

import { DecisionIntakeApiError, submitDecisionIntakeAnswers } from '@/features/decision-intake/server'

export const runtime = 'nodejs'

type AnswerPayload = {
  candidate_statuses?: Record<string, string>
  information_availability?: Record<string, string>
  semantic_mappings?: Record<string, string>
}

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params
    const payload = (await request.json()) as AnswerPayload
    const result = await submitDecisionIntakeAnswers(sessionId, payload)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const status = error instanceof DecisionIntakeApiError ? error.status : 500
    const detail = error instanceof Error ? error.message : 'Decision Intake answer failed.'
    return NextResponse.json({ detail }, { status })
  }
}
