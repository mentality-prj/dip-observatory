import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

import {
  createOperatorSession,
  operatorConfigured,
  safeTransport,
  sameOrigin,
  verifyOperatorPassword,
  verifyOperatorSession,
} from './rr-operator-auth'

beforeEach(() => {
  vi.stubEnv('RR_OPERATOR_PASSWORD', 'reference-operator-long-secret')
  vi.stubEnv('RR_OPERATOR_SESSION_SECRET', 'long-independent-session-signing-key-123456789')
  vi.stubEnv('DIP_API_BASE_URL', 'http://127.0.0.1:8000')
  vi.stubEnv('DIP_API_KEY', 'org-scoped-private-test-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('RR single-tenant operator session boundary', () => {
  it('fails closed on unconfigured credentials', () => {
    vi.stubEnv('RR_OPERATOR_SESSION_SECRET', '')
    expect(operatorConfigured()).toBe(false)
    expect(verifyOperatorPassword('reference-operator-long-secret')).toBe(false)
    expect(verifyOperatorSession('v1.9999999999.bad')).toBe(false)
  })

  it('compares credentials and verifies short-lived HMAC cookies', () => {
    expect(operatorConfigured()).toBe(true)
    expect(verifyOperatorPassword('reference-operator-long-secret')).toBe(true)
    expect(verifyOperatorPassword('wrong-secret')).toBe(false)
    const now = Date.UTC(2026, 9, 10, 12)
    const session = createOperatorSession(now)
    expect(verifyOperatorSession(session, now)).toBe(true)
    expect(verifyOperatorSession(session, now + 9 * 60 * 60 * 1000)).toBe(false)
    expect(verifyOperatorSession(session.slice(0, -1) + (session.endsWith('0') ? '1' : '0'), now)).toBe(false)
    vi.stubEnv('RR_OPERATOR_SESSION_SECRET', 'rotated-independent-session-signing-key-123456')
    expect(verifyOperatorSession(session, now)).toBe(false)
    vi.stubEnv('RR_OPERATOR_SESSION_SECRET', 'long-independent-session-signing-key-123456789')
    vi.stubEnv('RR_OPERATOR_PASSWORD', 'different-strong-operator-password')
    expect(verifyOperatorSession(session, now)).toBe(false)
  })

  it('requires literal origin and TLS or local development transport', () => {
    const make = (url: string, origin?: string) =>
      ({ nextUrl: new URL(url), headers: new Headers(origin ? { origin } : {}) }) as unknown as NextRequest
    expect(sameOrigin(make('https://observatory.qdip.ai/api/rr-operator/session', 'https://observatory.qdip.ai'))).toBe(true)
    expect(sameOrigin(make('https://observatory.qdip.ai/api/rr-operator/session', 'https://example.com'))).toBe(false)
    expect(sameOrigin(make('https://observatory.qdip.ai/api/rr-operator/session'))).toBe(false)
    expect(safeTransport(make('https://observatory.qdip.ai/api/rr-operator/session'))).toBe(true)
    expect(safeTransport(make('http://observatory.qdip.ai/api/rr-operator/session'))).toBe(false)
    expect(safeTransport(make('http://observatory.localhost:3000/api/rr-operator/session'))).toBe(true)
    expect(safeTransport(make('https://qdip.ai/api/rr-operator/session'))).toBe(false)
  })
})
