import 'server-only'

import type { NextRequest } from 'next/server'
import { isOperatorSubject, operatorConfigured, sessionFromRequest } from '@/lib/qdip-oidc'
import { isSurfaceHost } from '@/routing-config'

export { operatorConfigured }

export function operatorAuthorized(request: NextRequest) {
  const session = sessionFromRequest(request)
  return Boolean(session && isOperatorSubject(session.sub))
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return Boolean(origin && origin === request.nextUrl.origin)
}

export function safeTransport(request: NextRequest) {
  const url = request.nextUrl
  if (!isSurfaceHost('observatory', url.host)) return false
  return url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname.endsWith('.localhost'))
}
