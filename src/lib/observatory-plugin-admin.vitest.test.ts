import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))
const auth = vi.hoisted(() => ({ user: 'owner' as string | null, admin: true }))
vi.mock('@/lib/qdip-oidc', () => ({
  sessionFromRequest: () => (auth.user ? { sub: auth.user } : null),
  canAdministerObservatory: () => auth.admin,
}))
import { adminRequest } from './observatory-plugin-admin'

function request(host = 'observatory.qdip.ai', origin = 'https://observatory.qdip.ai') {
  return new NextRequest('https://observatory.qdip.ai/api/observatory/admin/plugins', {
    method: 'PUT',
    headers: { host, origin },
  })
}

describe('Observatory administration authorization', () => {
  it('denies anonymous and non-admin users', () => {
    auth.user = null
    expect(adminRequest(request(), true).error?.status).toBe(401)
    auth.user = 'user'
    auth.admin = false
    expect(adminRequest(request(), true).error?.status).toBe(403)
    auth.admin = true
  })
  it('rejects host spoofing and cross-origin mutation', () => {
    expect(adminRequest(request('attacker.example'), true).error?.status).toBe(404)
    expect(adminRequest(request('observatory.qdip.ai', 'https://evil.example'), true).error?.status).toBe(403)
    expect(adminRequest(request(), true).error).toBeNull()
  })
})
