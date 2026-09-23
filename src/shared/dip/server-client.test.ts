import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { runDipPlugin, runPublicDipPlugin } from './server-client'

describe('DIP plugin transports', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('does not send an API key for public plugin execution', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret-key')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: { ok: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await runPublicDipPlugin('gtm-lab', 'gtm.demo.run', {})

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('x-api-key')).toBeNull()
  })

  it('preserves API-key authentication for trusted plugin execution', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret-key')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: { ok: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await runDipPlugin('gtm-lab', 'gtm.pipeline.run', {})

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('x-api-key')).toBe('secret-key')
  })
})
