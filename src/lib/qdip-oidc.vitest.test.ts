import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSign, generateKeyPairSync } from 'node:crypto'

vi.mock('server-only', () => ({}))
import {
  authorizationUrl,
  discoverOidc,
  isAllowedSubject,
  isOperatorSubject,
  isStudioSubject,
  oidcConfigured,
  safeReturnTo,
  verifyIdToken,
} from './qdip-oidc'

const issuer = 'https://identity.example.test'
const clientId = '394566248211424533'
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'kid-1', use: 'sig', alg: 'RS256' }
const flow = {
  state: 'a'.repeat(40),
  nonce: 'nonce-123',
  verifier: 'verifier-123',
  returnTo: 'https://qdip.ai/en',
  issuedAt: Date.now(),
}
const config = {
  issuer,
  authorization_endpoint: issuer + '/oauth/v2/authorize',
  token_endpoint: issuer + '/oauth/v2/token',
  jwks_uri: issuer + '/oauth/v2/keys',
}
function token(changes: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'kid-1' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      iss: issuer,
      aud: clientId,
      sub: 'user-1',
      nonce: flow.nonce,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 1200,
      ...changes,
    })
  ).toString('base64url')
  const input = header + '.' + payload
  const sign = createSign('RSA-SHA256')
  sign.update(input)
  return input + '.' + sign.sign(privateKey).toString('base64url')
}
beforeEach(() => {
  vi.stubEnv('ZITADEL_ISSUER', issuer)
  vi.stubEnv('ZITADEL_CLIENT_ID', clientId)
  vi.stubEnv('QDIP_WEB_SESSION_SIGNING_SECRET', 'long-cookie-secret-with-a-minimum-of-32-characters')
  vi.stubEnv('QDIP_STUDIO_ALLOWED_ZITADEL_USER_IDS', 'user-1')
  vi.stubEnv('QDIP_RR_ALLOWED_ZITADEL_USER_IDS', '')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: true,
      text: async () => JSON.stringify(String(url).endsWith('openid-configuration') ? config : { keys: [jwk] }),
    }))
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('QDIP Zitadel OIDC PKCE', () => {
  it('requires an issuer, a client ID, an allowlist and a server-side secret', () => {
    expect(oidcConfigured()).toBe(true)
    vi.stubEnv('QDIP_STUDIO_ALLOWED_ZITADEL_USER_IDS', '')
    expect(oidcConfigured()).toBe(false)
    vi.stubEnv('QDIP_RR_ALLOWED_ZITADEL_USER_IDS', 'rr-user')
    expect(oidcConfigured()).toBe(true)
  })
  it('enforces separate Studio and RR Zitadel User ID allowlists', () => {
    vi.stubEnv('QDIP_STUDIO_ALLOWED_ZITADEL_USER_IDS', 'studio-only')
    vi.stubEnv('QDIP_RR_ALLOWED_ZITADEL_USER_IDS', 'rr-only')
    expect(isStudioSubject('studio-only')).toBe(true)
    expect(isStudioSubject('rr-only')).toBe(false)
    expect(isOperatorSubject('studio-only')).toBe(false)
    expect(isOperatorSubject('rr-only')).toBe(true)
    expect(isAllowedSubject('studio-only')).toBe(true)
    expect(isAllowedSubject('rr-only')).toBe(true)
    expect(isAllowedSubject('outsider')).toBe(false)
  })
  it('constructs an exact callback and S256 PKCE authorization request', async () => {
    const discovered = await discoverOidc()
    const url = authorizationUrl(discovered, flow)
    expect(url.searchParams.get('redirect_uri')).toBe('https://qdip.ai/api/auth/callback/zitadel')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('state')).toBe(flow.state)
    expect(url.searchParams.get('nonce')).toBe(flow.nonce)
  })
  it('verifies Zitadel ID token signature, nonce, issuer and audience', async () => {
    await expect(verifyIdToken(token(), flow, config)).resolves.toMatchObject({ sub: 'user-1' })
    await expect(verifyIdToken(token({ aud: 'another-app' }), flow, config)).rejects.toThrow()
    await expect(verifyIdToken(token({ nonce: 'wrong' }), flow, config)).rejects.toThrow()
    await expect(verifyIdToken(token({ iss: 'https://evil.example' }), flow, config)).rejects.toThrow()
    await expect(verifyIdToken(token({ exp: Math.floor(Date.now() / 1000) - 10 }), flow, config)).rejects.toThrow()
    const signed = token()
    await expect(verifyIdToken(signed.slice(0, -4) + 'ABCD', flow, config)).rejects.toThrow()
  })
  it('disallows external return_to redirect targets', () => {
    expect(safeReturnTo('//evil.example')).toBe('https://qdip.ai/en')
    expect(safeReturnTo('https://evil.example')).toBe('https://qdip.ai/en')
  })
})
