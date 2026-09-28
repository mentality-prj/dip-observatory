import { NextResponse } from 'next/server'

import { analyzeDecisionDataset, DecisionIntakeApiError } from '@/features/decision-intake/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    const businessContext = form.get('business_context')
    if (!(file instanceof File)) return NextResponse.json({ detail: 'Dataset file is required.' }, { status: 400 })
    const result = await analyzeDecisionDataset({
      file,
      businessContext: typeof businessContext === 'string' ? businessContext : undefined,
    })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const status = error instanceof DecisionIntakeApiError ? error.status : 500
    const detail = error instanceof Error ? error.message : 'Decision Intake failed.'
    return NextResponse.json({ detail }, { status })
  }
}
