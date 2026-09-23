import { NextResponse } from 'next/server'
import { z } from 'zod'
import { DipApiError, getGtmImportTemplate } from '@/features/gtm-lab/server'

export async function GET() {
  try {
    return NextResponse.json(await getGtmImportTemplate())
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: 'QDIP returned an incompatible GTM import contract.', issues: error.issues },
        { status: 502 }
      )
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'The GTM import template is unavailable.' }, { status: 500 })
  }
}
