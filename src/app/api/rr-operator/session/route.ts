import { NextRequest, NextResponse } from 'next/server'
import { operatorAuthorized, operatorConfigured, safeTransport } from '@/lib/rr-operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  if (!safeTransport(request)) return NextResponse.json({ error: 'TLS required' }, { status: 403 })
  return NextResponse.json(
    {
      configured: operatorConfigured(),
      authenticated: operatorAuthorized(request),
      mode: 'zitadel-oidc',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

// Deliberately no password-grant or legacy shared-operator login.
export function POST() {
  return NextResponse.json({ error: 'Password authentication retired; use Zitadel OIDC' }, { status: 410 })
}
