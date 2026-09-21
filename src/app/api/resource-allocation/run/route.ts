import { NextResponse } from 'next/server'
import { z } from 'zod'

import { normalizeResourceAllocationBusinessMetrics } from '@/features/resource-allocation/server/normalize-business-metrics'
import {
  resourceAllocationRequestSchema,
  runResourceAllocation,
  type UiLocale,
} from '@/features/resource-allocation/server/run-resource-allocation'
import { DipApiError } from '@/lib/dip-api'

export const maxDuration = 60

function requestLocale(request: Request): UiLocale {
  const language = request.headers.get('accept-language')?.toLowerCase() ?? ''
  return language.startsWith('pl') ? 'pl' : language.startsWith('en') ? 'en' : 'uk'
}

export async function POST(request: Request) {
  try {
    const input = resourceAllocationRequestSchema.parse(await request.json())
    const result = await runResourceAllocation(input, requestLocale(request))
    return NextResponse.json(normalizeResourceAllocationBusinessMetrics(result))
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: 'Invalid resource-allocation state.', issues: error.issues }, { status: 422 })
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Unexpected resource-allocation engine error.' }, { status: 500 })
  }
}
