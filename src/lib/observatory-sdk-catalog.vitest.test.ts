import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
import { readCorePublications } from './observatory-plugin-catalog'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Observatory delegates catalog reads through @qdip/client', () => {
  it('requests the single QDIP registry using only the server admin SDK credential', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://core.example.test')
    vi.stubEnv('DIP_ADMIN_API_KEY', 'test-platform-admin-not-real')
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            name: 'remote-secretary',
            version: '0.1.0',
            description: 'VHV planner',
            enabled: true,
            capabilities: ['secretary.plan'],
            capability_versions: { 'secretary.plan': '1' },
            ui: { label: 'VHV', category: 'Productivity' },
            published: false,
            revision: 0,
            capability_id: null,
            published_version: null,
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )
    vi.stubGlobal('fetch', fetcher)
    const result = await readCorePublications()
    expect(result[0].ui.label).toBe('VHV')
    expect(result[0].capabilities).toContain('secretary.plan')
    expect(fetcher).toHaveBeenCalledWith(
      'https://core.example.test/api/v1/plugin-publications',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'x-api-key': 'test-platform-admin-not-real' }),
      })
    )
  })
})
