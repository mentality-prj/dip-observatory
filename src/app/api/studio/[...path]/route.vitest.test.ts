import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/qdip-oidc', () => ({
  sessionFromRequest: () => ({ sub: 'studio-only' }),
  isStudioSubject: (subject: string) => subject === 'studio-only',
}))

import { GET, POST } from './route'

const context = { params: Promise.resolve({ path: ['decision-profiles'] }) }

function request(
  method: 'GET' | 'POST',
  host: string,
  extras: Record<string, string> = {},
  body?: string
): NextRequest {
  return new NextRequest('http://127.0.0.1:3000/api/studio/decision-profiles', {
    method,
    headers: { host, ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...extras },
    ...(body === undefined ? {} : { body }),
  })
}

beforeEach(() => {
  vi.stubEnv('DIP_API_BASE_URL', 'http://127.0.0.1:8000')
  vi.stubEnv('DIP_API_KEY', 'test-org-scoped-api-key')
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ result: 'authorized' }))
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Studio BFF reverse proxy trust boundary', () => {
  it('routes a valid externally hosted Studio request via the authenticated backend key', async () => {
    const response = await GET(request('GET', 'studio.localhost:3000'), context)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ result: 'authorized' })
    const upstream = vi.mocked(fetch)
    expect(upstream).toHaveBeenCalledOnce()
    expect(upstream.mock.calls[0]?.[1]?.headers).toMatchObject({ 'x-api-key': 'test-org-scoped-api-key' })
  })

  it('rejects forwarded-host spoofing, malformed/multiple Host headers and non-Studio hosts', async () => {
    for (const host of [
      'evil.localhost:3000',
      'observatory.localhost:3000',
      'studio.localhost:3000,evil.localhost',
      'studio.localhost@evil.test',
    ]) {
      const response = await GET(request('GET', host, { 'x-forwarded-host': 'studio.localhost:3000' }), context)
      expect(response.status, host).toBe(403)
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('ignores a forged forwarded host when the actual Host is valid', async () => {
    const response = await GET(request('GET', 'studio.localhost:3000', { 'x-forwarded-host': 'evil.example' }), context)
    expect(response.status).toBe(200)
  })

  it('enforces external browser Origin for mutations behind internal Next.js listener', async () => {
    const body = JSON.stringify({ name: 'demo' })
    const valid = await POST(
      request('POST', 'studio.localhost:3000', { origin: 'http://studio.localhost:3000' }, body),
      context
    )
    expect(valid.status).toBe(200)
    expect((vi.mocked(fetch).mock.calls[0]?.[1]?.body as Buffer).toString()).toBe(body)
    for (const origin of ['http://127.0.0.1:3000', 'https://evil.example', 'http://observatory.localhost:3000']) {
      const denied = await POST(request('POST', 'studio.localhost:3000', { origin }, body), context)
      expect(denied.status, origin).toBe(403)
    }
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('rejects plain HTTP on production host and only accepts matching HTTPS Origin', async () => {
    expect((await GET(request('GET', 'studio.qdip.ai'), context)).status).toBe(403)
    expect(
      (
        await POST(
          request(
            'POST',
            'studio.qdip.ai',
            {
              'x-forwarded-proto': 'https',
              origin: 'http://studio.qdip.ai',
            },
            '{}'
          ),
          context
        )
      ).status
    ).toBe(403)
    const response = await POST(
      request(
        'POST',
        'studio.qdip.ai',
        {
          'x-forwarded-proto': 'https',
          origin: 'https://studio.qdip.ai',
        },
        '{}'
      ),
      context
    )
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('bounds request bytes even without a content-length header and rejects non-JSON writes', async () => {
    const oversized = await POST(
      request(
        'POST',
        'studio.localhost:3000',
        {
          origin: 'http://studio.localhost:3000',
        },
        'x'.repeat(2_150_001)
      ),
      context
    )
    expect(oversized.status).toBe(413)
    const nonJson = await POST(
      request(
        'POST',
        'studio.localhost:3000',
        {
          origin: 'http://studio.localhost:3000',
          'content-type': 'text/plain',
        },
        '{}'
      ),
      context
    )
    expect(nonJson.status).toBe(415)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects oversized upstream response and non-TLS remote backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('x'.repeat(4_194_305)))
    )
    expect((await GET(request('GET', 'studio.localhost:3000'), context)).status).toBe(502)
    vi.stubEnv('DIP_API_BASE_URL', 'http://remote.internal:8000')
    expect((await GET(request('GET', 'studio.localhost:3000'), context)).status).toBe(503)
  })
})
