import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prospectSeedSchema } from '@/features/gtm-lab'
import { DipApiError, runGtmPublicEvaluation } from '@/features/gtm-lab/server'

const requestSchema = z.object({ rows: z.array(prospectSeedSchema).min(1).max(10) })

export async function POST(request: Request) {
  try {
    const { rows } = requestSchema.parse(await request.json())
    return NextResponse.json(await runGtmPublicEvaluation(rows))
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: 'Invalid GTM public evaluation payload.', issues: error.issues }, { status: 400 })
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'The GTM public evaluation could not be executed.' }, { status: 500 })
  }
}
