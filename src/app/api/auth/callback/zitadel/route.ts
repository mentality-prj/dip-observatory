import { NextRequest, NextResponse } from 'next/server'
import {
  attachSession,
  clearFlow,
  discoverOidc,
  exchangeCode,
  isAllowedSession,
  oidcConfigured,
  onSiteOrigin,
  readFlow,
  safeReturnTo,
} from '@/lib/qdip-oidc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!onSiteOrigin(request)) return NextResponse.json({ error: 'Invalid callback host' }, { status: 403 })
  if (!oidcConfigured()) return NextResponse.json({ error: 'OIDC unavailable' }, { status: 503 })
  const flow = readFlow(request, request.nextUrl.searchParams.get('state'))
  const code = request.nextUrl.searchParams.get('code')
  // Clear one-time PKCE state even when authentication fails.
  if (!flow || !code || code.length > 4096 || request.nextUrl.searchParams.has('error')) {
    const rejected = NextResponse.json({ error: 'Invalid or expired OIDC callback' }, { status: 401 })
    clearFlow(rejected, request)
    return rejected
  }
  try {
    const discovery = await discoverOidc()
    const session = await exchangeCode(code, flow, discovery)
    if (!isAllowedSession(session)) {
      const denied = NextResponse.json({ error: 'QDIP access has not been granted to this account' }, { status: 403 })
      clearFlow(denied, request)
      return denied
    }
    const result = NextResponse.redirect(safeReturnTo(flow.returnTo), 303)
    clearFlow(result, request)
    attachSession(result, request, session)
    result.headers.set('Cache-Control', 'no-store')
    return result
  } catch {
    const rejected = NextResponse.json({ error: 'OIDC token validation failed' }, { status: 401 })
    clearFlow(rejected, request)
    return rejected
  }
}
