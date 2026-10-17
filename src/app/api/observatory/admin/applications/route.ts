import { NextRequest, NextResponse } from 'next/server'
import { adminRequest } from '@/lib/observatory-plugin-admin'
import { createDeveloperCredentials, DeveloperKeyError } from '@/lib/observatory-developer-keys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function noStore(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      Pragma: 'no-cache',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

/** This is a privileged bootstrap endpoint, NOT public anonymous key generation. */
export async function POST(request: NextRequest) {
  const { error } = adminRequest(request, true)
  if (error) return error
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json')
    return noStore({ error: 'JSON required' }, 415)

  let data: unknown
  try {
    const input = await request.text()
    if (input.length > 1024) return noStore({ error: 'Request too large' }, 413)
    data = JSON.parse(input)
  } catch {
    return noStore({ error: 'Invalid JSON' }, 400)
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return noStore({ error: 'Invalid request' }, 422)
  const props = data as Record<string, unknown>
  if (
    Object.keys(props).some((key) => !['application', 'capability'].includes(key)) ||
    typeof props.application !== 'string' ||
    typeof props.capability !== 'string'
  )
    return noStore({ error: 'Invalid application request' }, 422)
  try {
    const credentials = await createDeveloperCredentials(props.application, props.capability)
    return noStore(credentials, 201)
  } catch (error) {
    if (error instanceof DeveloperKeyError) return noStore({ error: error.message }, error.status)
    return noStore({ error: 'Credential provisioning failed' }, 503)
  }
}
