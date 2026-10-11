import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSign, generateKeyPairSync } from 'node:crypto'

vi.mock('server-only', () => ({}))
import {
  authorizationUrl,
  discoverOidc,
  canAccessStudio,
  canOperateRr,
  isAllowedSession,
  oidcConfigured,
  safeReturnTo,
  verifyIdToken,
} from './qdip-oidc'

const issuer = 'https://identity.example.test'
const clientId = '394566248211424533'
const projectId = '123456789'
const organizationId = '987654321'
const roleClaim = `urn:zitadel:iam:org:project:${projectId}:roles`
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
      [roleClaim]: { studio: { [organizationId]: 'qdip.example.test' } },
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
  vi.stubEnv('ZITADEL_QDIP_PROJECT_ID', projectId)
  vi.stubEnv('ZITADEL_QDIP_ORGANIZATION_ID', organizationId)
  vi.stubEnv('QDIP_STUDIO_ZITADEL_ROLE_KEY', 'studio')
  vi.stubEnv('QDIP_RR_ZITADEL_ROLE_KEY', 'rr_operator')
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
  it('requires a trustworthy issuer, client, project, organization and signing secret', () => {
    expect(oidcConfigured()).toBe(true)
    vi.stubEnv('ZITADEL_QDIP_ORGANIZATION_ID', '')
    expect(oidcConfigured()).toBe(false)
    vi.stubEnv('ZITADEL_QDIP_ORGANIZATION_ID', organizationId)
    vi.stubEnv('ZITADEL_QDIP_PROJECT_ID', '')
    expect(oidcConfigured()).toBe(false)
    vi.stubEnv('ZITADEL_QDIP_PROJECT_ID', projectId)
    vi.stubEnv('QDIP_RR_ZITADEL_ROLE_KEY', 'studio')
    expect(oidcConfigured()).toBe(false)
  })

  it('uses only verified project and organization roles, never the subject or a generic roles claim', async () => {
    const studio = await verifyIdToken(token(), flow, config)
    expect(isAllowedSession(studio)).toBe(true)
    expect(canAccessStudio(studio)).toBe(true)
    expect(studio.projectId).toBe(projectId)
    expect(studio.organizationId).toBe(organizationId)
    expect(canOperateRr(studio)).toBe(false)

    const rr = await verifyIdToken(
      token({ sub: 'user-1', [roleClaim]: { rr_operator: { [organizationId]: 'qdip.example.test' } } }),
      flow,
      config
    )
    expect(canAccessStudio(rr)).toBe(false)
    expect(canOperateRr(rr)).toBe(true)

    const both = await verifyIdToken(
      token({
        [roleClaim]: {
          studio: { [organizationId]: 'qdip.example.test' },
          rr_operator: { [organizationId]: 'qdip.example.test' },
        },
      }),
      flow,
      config
    )
    expect(both.roles).toEqual(['studio', 'rr_operator'])

    const otherOrg = await verifyIdToken(
      token({
        [roleClaim]: { studio: { '111111111': 'external.example.test' } },
      }),
      flow,
      config
    )
    expect(isAllowedSession(otherOrg)).toBe(false)

    const otherProject = await verifyIdToken(
      token({
        [roleClaim]: undefined,
        'urn:zitadel:iam:org:project:999999999:roles': {
          studio: { [organizationId]: 'qdip.example.test' },
        },
        'urn:zitadel:iam:org:project:roles': {
          studio: { [organizationId]: 'qdip.example.test' },
        },
      }),
      flow,
      config
    )
    expect(isAllowedSession(otherProject)).toBe(false)

    await expect(verifyIdToken(token({ [roleClaim]: ['studio'] }), flow, config)).rejects.toThrow()
  })

  it('constructs an exact callback and S256 PKCE authorization request', async () => {
    const discovered = await discoverOidc()
    const url = authorizationUrl(discovered, flow)
    expect(url.searchParams.get('redirect_uri')).toBe('https://qdip.ai/api/auth/callback/zitadel')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('state')).toBe(flow.state)
    expect(url.searchParams.get('nonce')).toBe(flow.nonce)
    expect(url.searchParams.get('scope')).toContain(`urn:zitadel:iam:org:project:id:${projectId}:aud`)
    expect(url.searchParams.get('scope')).toContain('urn:zitadel:iam:org:projects:roles')
    expect(url.searchParams.get('scope')).toContain(`urn:zitadel:iam:org:roles:id:${organizationId}`)
  })
  it('verifies Zitadel ID token signature, nonce, issuer and audience', async () => {
    await expect(verifyIdToken(token(), flow, config)).resolves.toMatchObject({ sub: 'user-1', roles: ['studio'] })
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
