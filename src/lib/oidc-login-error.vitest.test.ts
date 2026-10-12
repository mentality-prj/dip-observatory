import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { loginFailurePage } from './oidc-login-error'

describe('Zitadel callback error pages', () => {
  it('explains unverified project/org roles without granting access', async () => {
    const response = loginFailurePage('missing-role', 'https://studio.qdip.ai/uk')
    expect(response.status).toBe(403)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const html = await response.text()
    expect(html).toContain('Немає призначеної ролі QDIP')
    expect(html).toContain('Якщо ролі вже призначені')
    expect(html).toContain('https://qdip.ai/api/auth/login')
    expect(html).toContain('https%3A%2F%2Fstudio.qdip.ai%2Fuk')
    expect(html).not.toContain('id_token')
  })

  it('shows a fresh-login action instead of reusing expired callback state', async () => {
    const response = loginFailurePage('expired-flow', 'https://observatory.qdip.ai/pl')
    expect(response.status).toBe(401)
    const html = await response.text()
    expect(html).toContain('Sesja logowania wygasła')
    expect(html).toContain('Zaloguj się ponownie')
  })

  it('does not echo untrusted redirect destinations', async () => {
    const response = loginFailurePage('invalid-token', 'https://evil.example/login')
    const html = await response.text()
    expect(html).toContain('https%3A%2F%2Fqdip.ai%2Fen')
    expect(html).not.toContain('evil.example')
  })
})
