import { NextResponse } from 'next/server'
import { z } from 'zod'
import { DipApiError, runGtmDemo } from '@/features/gtm-lab/server'

export async function POST() {
  try {
    return NextResponse.json(await runGtmDemo())
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: 'QDIP returned an incompatible GTM Lab contract.', issues: error.issues },
        { status: 502 }
      )
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'The GTM dataset could not be evaluated.' }, { status: 500 })
  }
}
