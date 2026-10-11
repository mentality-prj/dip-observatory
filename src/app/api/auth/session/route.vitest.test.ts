import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('server-only', () => ({}))

import { GET } from './route'
import { attachSession } from '@/lib/qdip-oidc'

beforeEach(() => {
  vi.stubEnv('ZITADEL_ISSUER', 'https://identity.example.test')
  vi.stubEnv('ZITADEL_CLIENT_ID', 'qdip-e2e-client')
  vi.stubEnv('QDIP_WEB_SESSION_SIGNING_SECRET', 'independent-test-session-signing-secret-more-than-32-characters')
  vi.stubEnv('ZITADEL_QDIP_PROJECT_ID', '123456789')
  vi.stubEnv('ZITADEL_QDIP_ORGANIZATION_ID', '987654321')
})

afterEach(() => vi.unstubAllEnvs())

function signedSession(sub: string) {
  const source = new NextRequest('https://observatory.qdip.ai/api/auth/session')
  const response = NextResponse.json({})
  const roles: Array<'studio' | 'rr_operator'> = sub === 'studio-only' ? ['studio'] : sub === 'rr-only' ? ['rr_operator'] : []
  attachSession(response, source, {
    sub,
    roles,
    issuer: 'https://identity.example.test',
    clientId: 'qdip-e2e-client',
    expiresAt: Math.floor(Date.now() / 1000) + 300,
  })
  const token = response.cookies.get('qdip_oidc_session')?.value
  if (!token) throw new Error('Missing signed OIDC session')
  return token
}

function proxiedRequest(host: string, sub?: string, forwardedHost?: string) {
  return new NextRequest('http://127.0.0.1:3000/api/auth/session', {
    headers: {
      host,
      ...(sub ? { cookie: `qdip_oidc_session=${signedSession(sub)}` } : {}),
      ...(forwardedHost ? { 'x-forwarded-host': forwardedHost } : {}),
    },
  })
}

describe('global OIDC session endpoint with reverse proxy Host', () => {
  it('accepts exact externally routed Observatory Host, not the internal listener', async () => {
    const response = GET(proxiedRequest('observatory.localhost:3000', 'studio-only'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      configured: true,
      authenticated: true,
      studio: true,
      operator: false,
    })
  })

  it('enforces disjoint Studio and RR authorization on the same signed session', async () => {
    const response = GET(proxiedRequest('observatory.localhost:3000', 'rr-only'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      authenticated: true,
      studio: false,
      operator: true,
    })
  })

  it('rejects an unrecognized external Host even if x-forwarded-host claims a trusted host', () => {
    const response = GET(proxiedRequest('evil.localhost:3000', 'studio-only', 'observatory.localhost:3000'))
    expect(response.status).toBe(403)
  })

  it('rejects ambiguous/malformed Host values', () => {
    expect(GET(proxiedRequest('observatory.localhost:3000,evil.localhost:3000')).status).toBe(403)
    expect(GET(proxiedRequest('observatory.localhost:3000@evil.test')).status).toBe(403)
  })
})
