import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

import { operatorAuthorized, operatorConfigured, safeTransport, sameOrigin } from './rr-operator-auth'
import { attachSession, getQdipSession, isOperatorSubject, safeReturnTo } from './qdip-oidc'
import { NextResponse } from 'next/server'

beforeEach(() => {
  vi.stubEnv('ZITADEL_ISSUER', 'https://identity.example.test')
  vi.stubEnv('ZITADEL_CLIENT_ID', '394566248211424533')
  vi.stubEnv('QDIP_WEB_SESSION_SIGNING_SECRET', 'a-strong-and-independent-oidc-cookie-signing-secret')
  vi.stubEnv('QDIP_STUDIO_ALLOWED_ZITADEL_USER_IDS', 'user-2')
  vi.stubEnv('QDIP_RR_ALLOWED_ZITADEL_USER_IDS', 'user-1')
  vi.stubEnv('DIP_API_BASE_URL', 'http://127.0.0.1:8000')
  vi.stubEnv('DIP_API_KEY', 'test-org-scoped-key')
  vi.stubEnv('RR_ACTOR_ASSERTION_SECRET', 'this-is-an-independent-core-rr-actor-signing-secret')
})

afterEach(() => vi.unstubAllEnvs())

describe('Zitadel-backed RR session boundary', () => {
  it('fails closed without configured identity and operator subjects', () => {
    vi.stubEnv('QDIP_RR_ALLOWED_ZITADEL_USER_IDS', '')
    expect(operatorConfigured()).toBe(false)
    vi.stubEnv('QDIP_RR_ALLOWED_ZITADEL_USER_IDS', 'user-1')
    vi.stubEnv('ZITADEL_ISSUER', '')
    expect(operatorConfigured()).toBe(false)
  })

  it('derives operator permission from server allowlist, not an unverified browser field', () => {
    expect(operatorConfigured()).toBe(true)
    expect(isOperatorSubject('user-1')).toBe(true)
    expect(isOperatorSubject('user-2')).toBe(false)
    vi.stubEnv('QDIP_STUDIO_ALLOWED_ZITADEL_USER_IDS', '')
    expect(operatorConfigured()).toBe(true)
    expect(isOperatorSubject('user-1')).toBe(true)
    const req = { nextUrl: new URL('https://observatory.qdip.ai/en/readiness-recovery') } as NextRequest
    const response = NextResponse.json({})
    attachSession(response, req, {
      sub: 'user-1',
      issuer: 'https://identity.example.test',
      clientId: '394566248211424533',
      expiresAt: Math.floor(Date.now() / 1000) + 300,
    })
    const cookie = response.cookies.get('qdip_oidc_session')?.value
    expect(getQdipSession(cookie)?.sub).toBe('user-1')
    const request = { cookies: { get: () => ({ value: cookie }) } } as unknown as NextRequest
    expect(operatorAuthorized(request)).toBe(true)
    vi.stubEnv('QDIP_RR_ALLOWED_ZITADEL_USER_IDS', 'user-2')
    expect(operatorAuthorized(request)).toBe(false)
    expect(getQdipSession(cookie + 'tampered')).toBeNull()
  })

  it('rejects open redirects and cross-origin mutation', () => {
    expect(safeReturnTo('https://evil.example/path')).toBe('https://qdip.ai/en')
    expect(safeReturnTo('https://observatory.qdip.ai/en')).toBe('https://observatory.qdip.ai/en')
    const make = (url: string, origin?: string) =>
      ({ nextUrl: new URL(url), headers: new Headers(origin ? { origin } : {}) }) as unknown as NextRequest
    expect(sameOrigin(make('https://observatory.qdip.ai/api/rr-operator/session', 'https://evil.example'))).toBe(false)
    expect(sameOrigin(make('https://observatory.qdip.ai/api/rr-operator/session', 'https://observatory.qdip.ai'))).toBe(
      true
    )
    expect(safeTransport(make('https://observatory.qdip.ai/api/rr-operator/session'))).toBe(true)
    expect(safeTransport(make('http://observatory.qdip.ai/api/rr-operator/session'))).toBe(false)
    expect(safeTransport(make('https://qdip.ai/api/rr-operator/session'))).toBe(false)
  })
})
