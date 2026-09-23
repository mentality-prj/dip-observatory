import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  assertSameOriginMutation,
  DipApiError,
  normalizeResourceAllocationBusinessMetrics,
  resourceAllocationRequestSchema,
  ResourceAllocationAccessError,
  runResourceAllocation,
  type UiLocale,
} from '@/features/resource-allocation/server'

export const maxDuration = 60

function requestLocale(request: Request): UiLocale {
  const language = request.headers.get('accept-language')?.toLowerCase() ?? ''
  return language.startsWith('pl') ? 'pl' : language.startsWith('en') ? 'en' : 'uk'
}

export async function POST(request: Request) {
  try {
    const input = resourceAllocationRequestSchema.parse(await request.json())
    assertSameOriginMutation(request)
    const result = await runResourceAllocation(input, requestLocale(request))
    return NextResponse.json(normalizeResourceAllocationBusinessMetrics(result))
  } catch (error) {
    if (error instanceof ResourceAllocationAccessError)
      return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: 'Invalid resource-allocation state.', issues: error.issues }, { status: 422 })
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Unexpected resource-allocation engine error.' }, { status: 500 })
  }
}
