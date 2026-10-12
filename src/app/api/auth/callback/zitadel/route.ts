import { NextRequest, NextResponse } from 'next/server'
import { loginFailurePage } from '@/lib/oidc-login-error'
import {
  attachSession,
  clearFlow,
  discoverOidc,
  exchangeCode,
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
    const rejected = loginFailurePage('expired-flow', flow?.returnTo)
    clearFlow(rejected, request)
    return rejected
  }
  try {
    const discovery = await discoverOidc()
    const session = await exchangeCode(code, flow, discovery)
    const result = NextResponse.redirect(safeReturnTo(flow.returnTo), 303)
    clearFlow(result, request)
    attachSession(result, request, session)
    result.headers.set('Cache-Control', 'no-store')
    return result
  } catch {
    const rejected = loginFailurePage('invalid-token', flow.returnTo)
    clearFlow(rejected, request)
    return rejected
  }
}
