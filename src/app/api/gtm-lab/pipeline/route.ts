import { NextResponse } from 'next/server'
import { z } from 'zod'
import { commercialContextSchema, prospectSeedSchema } from '@/features/gtm-lab/import-contracts'
import { DipApiError, runGtmPublicEvaluation } from '@/features/gtm-lab/server'

const requestSchema = z.object({
  rows: z.array(prospectSeedSchema).min(1).max(10),
  commercialContext: commercialContextSchema,
})

export async function POST(request: Request) {
  try {
    const { rows, commercialContext } = requestSchema.parse(await request.json())
    return NextResponse.json(await runGtmPublicEvaluation(rows, commercialContext))
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: 'Invalid GTM public evaluation payload.', issues: error.issues },
        { status: 400 }
      )
    if (error instanceof DipApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'The GTM public evaluation could not be executed.' }, { status: 500 })
  }
}
