import 'server-only'

import type { NextRequest } from 'next/server'
import { isOperatorSubject, operatorConfigured, sessionFromRequest } from '@/lib/qdip-oidc'
import { isSurfaceHost } from '@/routing-config'

export { operatorConfigured }

export function operatorAuthorized(request: NextRequest) {
  const session = sessionFromRequest(request)
  return Boolean(session && isOperatorSubject(session.sub))
}

/**
 * Next.js may set nextUrl.host to its internal listener (e.g. 127.0.0.1:3000)
 * even when the request Host is observatory.localhost / observatory.qdip.ai.
 * Authorization must use the externally routed Host header, never a spoofed
 * x-forwarded-host; TLS at a trusted reverse proxy is reflected in
 * x-forwarded-proto. Keep the HTTP exception exclusive to *.localhost.
 */
function rrExternalOrigin(request: NextRequest) {
  const host = request.headers.get('host') ?? request.nextUrl.host
  if (!host || !isSurfaceHost('observatory', host) || /[,\\s@\\/?#]/.test(host)) return null
  const normalizedHost = host.toLowerCase()
  let hostname: string
  try {
    hostname = new URL(`http://${normalizedHost}`).hostname
  } catch {
    return null
  }
  const forwardedProtocol = request.headers.get('x-forwarded-proto')
  if (forwardedProtocol && forwardedProtocol !== 'https' && forwardedProtocol !== 'http') return null
  const secure = request.nextUrl.protocol === 'https:' || forwardedProtocol === 'https'
  if (secure) return `https://${normalizedHost}`
  if (request.nextUrl.protocol === 'http:' && hostname.endsWith('.localhost'))
    return `http://${normalizedHost}`
  return null
}

export function sameOrigin(request: NextRequest) {
  const expectedOrigin = rrExternalOrigin(request)
  return Boolean(expectedOrigin && request.headers.get('origin') === expectedOrigin)
}

export function safeTransport(request: NextRequest) {
  return rrExternalOrigin(request) !== null
}
