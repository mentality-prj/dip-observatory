import { describe, expect, it } from 'vitest'
import { getRewrittenUrl, isRewrite } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

function request(host: string, pathname = '/') {
  return new NextRequest(`https://${host}${pathname}`, { headers: { host } })
}

function redirectPath(response: Response) {
  return new URL(response.headers.get('location')!).pathname
}

describe('platform proxy routing contract', () => {
  it('routes localized Studio URLs to the Studio app', () => {
    const home = proxy(request('studio.qdip.ai', '/en'))
    const profiles = proxy(request('studio.qdip.ai', '/uk/profiles'))
    const nested = proxy(request('studio.qdip.ai', '/pl/profiles/demo/dimensions'))

    expect(isRewrite(home)).toBe(true)
    expect(new URL(getRewrittenUrl(home)!).pathname).toBe('/studio')
    expect(new URL(getRewrittenUrl(home)!).searchParams.get('lang')).toBe('en')
    expect(new URL(getRewrittenUrl(profiles)!).pathname).toBe('/studio/profiles')
    expect(new URL(getRewrittenUrl(profiles)!).searchParams.get('lang')).toBe('uk')
    expect(new URL(getRewrittenUrl(nested)!).pathname).toBe('/studio/profiles/demo/dimensions')
    expect(new URL(getRewrittenUrl(nested)!).searchParams.get('lang')).toBe('pl')
  })

  it('redirects legacy Studio URLs to the English canonical route', () => {
    const root = proxy(request('studio.qdip.ai'))
    const profiles = proxy(request('studio.qdip.ai', '/profiles'))

    expect(root.status).toBe(308)
    expect(redirectPath(root)).toBe('/en')
    expect(profiles.status).toBe(308)
    expect(redirectPath(profiles)).toBe('/en/profiles')
  })

  it('canonicalizes Observatory root and legacy decision-audit URLs', () => {
    const root = proxy(request('observatory.qdip.ai'))
    const decisions = proxy(request('observatory.qdip.ai', '/decisions?decision=abc'))
    const leakedInternal = proxy(request('observatory.qdip.ai', '/observatory/decisions?decision=abc'))

    expect(root.status).toBe(308)
    expect(redirectPath(root)).toBe('/en')
    expect(decisions.status).toBe(308)
    expect(redirectPath(decisions)).toBe('/en/decisions')
    expect(new URL(decisions.headers.get('location')!).searchParams.get('decision')).toBe('abc')
    expect(leakedInternal.status).toBe(308)
    expect(redirectPath(leakedInternal)).toBe('/en/decisions')
  })

  it('leaves localized Observatory URLs on the public route', () => {
    for (const pathname of ['/en', '/uk/resource-allocation', '/pl/decisions']) {
      const response = proxy(request('observatory.qdip.ai', pathname))
      expect(isRewrite(response), pathname).toBe(false)
      expect(response.status, pathname).toBe(200)
    }
  })

  it('routes localized marketing URLs and nested public pages', () => {
    expect(isRewrite(proxy(request('qdip.ai')))).toBe(false)

    const home = proxy(request('qdip.ai', '/uk'))
    const core = proxy(request('qdip.ai', '/en/core/architecture'))
    const canonical = proxy(request('qdip.ai', '/platform/pl/use-cases'))
    const preview = proxy(request('feature-qdip.vercel.app', '/platform/uk'))
    const observatory = proxy(request('observatory.qdip.ai', '/pl'))

    expect(new URL(getRewrittenUrl(home)!).pathname).toBe('/platform/uk')
    expect(new URL(getRewrittenUrl(core)!).pathname).toBe('/platform/en/core/architecture')
    expect(canonical.status).toBe(308)
    expect(redirectPath(canonical)).toBe('/pl/use-cases')
    expect(isRewrite(preview)).toBe(false)
    expect(isRewrite(observatory)).toBe(false)
  })

  it('supports localhost product subdomains for local and CI routing', () => {
    const studio = proxy(request('studio.localhost', '/en'))
    const observatory = proxy(request('observatory.localhost', '/decisions'))
    const marketing = proxy(request('qdip.localhost', '/en'))

    expect(new URL(getRewrittenUrl(studio)!).pathname).toBe('/studio')
    expect(observatory.status).toBe(308)
    expect(redirectPath(observatory)).toBe('/en/decisions')
    expect(new URL(getRewrittenUrl(marketing)!).pathname).toBe('/platform/en')
  })

  it('does not claim unrelated or lookalike hosts', () => {
    for (const host of ['studio.example.com', 'observatory.example.com', 'foo.qdip.ai', 'feature-qdip.vercel.app']) {
      const response = proxy(request(host, '/en'))
      expect(isRewrite(response), host).toBe(false)
      expect(response.status, host).toBe(200)
    }
  })

  it('does not canonicalize an already rewritten internal route', () => {
    const internal = new NextRequest('http://studio.localhost:3000/studio/profiles', {
      headers: {
        host: 'studio.localhost:3000',
        'x-qdip-internal-rewrite': '1',
        'x-qdip-studio-locale': 'en',
        'x-qdip-studio-route': 'profiles',
      },
    })

    expect(isRewrite(proxy(internal))).toBe(false)
    expect(proxy(internal).status).toBe(200)
  })
})
