import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/qdip-oidc'
import { isSurfaceHost } from '@/routing-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST(request: NextRequest) {
  if (!(['site', 'studio', 'observatory'] as const).some((surface) => isSurfaceHost(surface, request.nextUrl.host)) ||
      request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const response = NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } })
  clearSession(response, request)
  return response
}
