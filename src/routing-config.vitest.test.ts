import { describe, expect, it } from 'vitest'
import nextConfig from '../next.config'
import { isSurfaceHost, PLATFORM_HOST_PATTERNS, PLATFORM_HOSTS, PLATFORM_ORIGINS } from './routing-config'

describe('declarative platform routing', () => {
  it('assigns canonical and local hosts to exactly one surface', () => {
    const seen = new Map<string, string>()

    for (const [surface, hosts] of Object.entries(PLATFORM_HOSTS)) {
      for (const host of hosts) {
        expect(seen.has(host), host).toBe(false)
        seen.set(host, surface)
        expect(isSurfaceHost(surface as 'site' | 'studio' | 'observatory', host)).toBe(true)
        expect(isSurfaceHost(surface as 'site' | 'studio' | 'observatory', `${host}:3000`)).toBe(true)
      }
    }

    expect(isSurfaceHost('studio', 'studio.example.com')).toBe(false)
    expect(isSurfaceHost('observatory', 'foo.qdip.ai')).toBe(false)
  })

  it('reserves Vercel preview hosts for the marketing rewrite only', () => {
    expect(new RegExp(PLATFORM_HOST_PATTERNS.site).test('dip-observatory-git-feature.vercel.app')).toBe(true)
    expect(new RegExp(PLATFORM_HOST_PATTERNS.studio).test('dip-observatory-git-feature.vercel.app')).toBe(false)
    expect(new RegExp(PLATFORM_HOST_PATTERNS.observatory).test('dip-observatory-git-feature.vercel.app')).toBe(false)
  })

  it('declares host-conditioned rewrites in Next config', async () => {
    expect(nextConfig.rewrites).toBeTypeOf('function')
    const rewrites = await nextConfig.rewrites!()
    expect(Array.isArray(rewrites)).toBe(false)

    const beforeFiles = 'beforeFiles' in rewrites ? rewrites.beforeFiles : []
    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/:locale(en|uk|pl)',
          destination: '/platform/:locale',
          has: [{ type: 'host', value: PLATFORM_HOST_PATTERNS.site }],
        }),
        expect.objectContaining({
          source: '/:locale(en|uk|pl)/:path*',
          destination: '/studio/:path*?lang=:locale&route=:path*',
          has: [{ type: 'host', value: PLATFORM_HOST_PATTERNS.studio }],
        }),
      ])
    )
  })

  it('canonicalizes implementation namespaces with built-in redirects', async () => {
    expect(nextConfig.redirects).toBeTypeOf('function')
    const redirects = await nextConfig.redirects!()

    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/platform/:locale(en|uk|pl)/:path*',
          destination: `${PLATFORM_ORIGINS.site}/:locale/:path*`,
          permanent: true,
        }),
        expect.objectContaining({
          source: '/studio/:path*',
          destination: `${PLATFORM_ORIGINS.studio}/en/:path*`,
          permanent: true,
        }),
        expect.objectContaining({
          source: '/observatory/:path*',
          destination: `${PLATFORM_ORIGINS.observatory}/en/:path*`,
          permanent: true,
        }),
      ])
    )
  })
})
