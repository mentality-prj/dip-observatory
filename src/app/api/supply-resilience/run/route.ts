import { NextResponse } from 'next/server'
import { DipApiError } from '@/shared/dip/server-client'
import { evaluateSupplyResilience } from '@/features/supply-network-resilience/server'
import type { SupplyResilienceInput } from '@/features/supply-network-resilience/domain'

function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) throw new Error('same-origin-required')
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const input = (await request.json()) as SupplyResilienceInput
    const result = await evaluateSupplyResilience(input)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof Error && error.message === 'same-origin-required')
      return NextResponse.json({ error: 'A same-origin request is required.' }, { status: 403 })
    return NextResponse.json({ error: 'Unexpected supply resilience engine error.' }, { status: 500 })
  }
}
