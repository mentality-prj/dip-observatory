import assert from 'node:assert/strict'
import test from 'node:test'
import { getRewrittenUrl, isRewrite } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

function request(host: string, pathname = '/') {
  return new NextRequest(`https://${host}${pathname}`, { headers: { host } })
}

function redirectPath(response: Response) {
  return new URL(response.headers.get('location')!).pathname
}

test('routes localized Studio URLs to the Studio app', () => {
  const home = proxy(request('studio.qdip.ai', '/en'))
  const profiles = proxy(request('studio.qdip.ai', '/uk/profiles'))
  const nested = proxy(request('studio.qdip.ai', '/pl/profiles/demo/dimensions'))

  assert.equal(isRewrite(home), true)
  assert.equal(new URL(getRewrittenUrl(home)!).pathname, '/studio')
  assert.equal(new URL(getRewrittenUrl(home)!).searchParams.get('lang'), 'en')
  assert.equal(new URL(getRewrittenUrl(profiles)!).pathname, '/studio/profiles')
  assert.equal(new URL(getRewrittenUrl(profiles)!).searchParams.get('lang'), 'uk')
  assert.equal(new URL(getRewrittenUrl(nested)!).pathname, '/studio/profiles/demo/dimensions')
  assert.equal(new URL(getRewrittenUrl(nested)!).searchParams.get('lang'), 'pl')
})

test('redirects legacy Studio URLs to the English canonical route', () => {
  const root = proxy(request('studio.qdip.ai'))
  const profiles = proxy(request('studio.qdip.ai', '/profiles'))

  assert.equal(root.status, 308)
  assert.equal(redirectPath(root), '/en')
  assert.equal(profiles.status, 308)
  assert.equal(redirectPath(profiles), '/en/profiles')
})

test('canonicalizes Observatory root and legacy decision-audit URLs', () => {
  const root = proxy(request('observatory.qdip.ai'))
  const decisions = proxy(request('observatory.qdip.ai', '/decisions?decision=abc'))
  const leakedInternal = proxy(request('observatory.qdip.ai', '/observatory/decisions?decision=abc'))

  assert.equal(root.status, 308)
  assert.equal(redirectPath(root), '/en')
  assert.equal(decisions.status, 308)
  assert.equal(redirectPath(decisions), '/en/decisions')
  assert.equal(new URL(decisions.headers.get('location')!).searchParams.get('decision'), 'abc')
  assert.equal(leakedInternal.status, 308)
  assert.equal(redirectPath(leakedInternal), '/en/decisions')
})

test('leaves localized Observatory URLs on the public route', () => {
  for (const pathname of ['/en', '/uk/resource-allocation', '/pl/decisions']) {
    const response = proxy(request('observatory.qdip.ai', pathname))
    assert.equal(isRewrite(response), false)
    assert.equal(response.status, 200)
  }
})

test('leaves the QDIP marketing root unchanged', () => {
  assert.equal(isRewrite(proxy(request('qdip.ai'))), false)
})

test('routes localized marketing URLs and nested public pages', () => {
  const home = proxy(request('qdip.ai', '/uk'))
  const core = proxy(request('qdip.ai', '/en/core/architecture'))
  const canonical = proxy(request('qdip.ai', '/platform/pl/use-cases'))
  const preview = proxy(request('feature-qdip.vercel.app', '/platform/uk'))
  const observatory = proxy(request('observatory.qdip.ai', '/pl'))

  assert.equal(new URL(getRewrittenUrl(home)!).pathname, '/platform/uk')
  assert.equal(new URL(getRewrittenUrl(core)!).pathname, '/platform/en/core/architecture')
  assert.equal(canonical.status, 308)
  assert.equal(redirectPath(canonical), '/pl/use-cases')
  assert.equal(isRewrite(preview), false)
  assert.equal(isRewrite(observatory), false)
})

test('supports localhost product subdomains for local and CI routing', () => {
  const studio = proxy(request('studio.localhost', '/en'))
  const observatory = proxy(request('observatory.localhost', '/decisions'))
  const marketing = proxy(request('qdip.localhost', '/en'))

  assert.equal(new URL(getRewrittenUrl(studio)!).pathname, '/studio')
  assert.equal(observatory.status, 308)
  assert.equal(redirectPath(observatory), '/en/decisions')
  assert.equal(new URL(getRewrittenUrl(marketing)!).pathname, '/platform/en')
})

test('does not claim unrelated or lookalike hosts', () => {
  for (const host of ['studio.example.com', 'observatory.example.com', 'foo.qdip.ai', 'feature-qdip.vercel.app']) {
    const response = proxy(request(host, '/en'))
    assert.equal(isRewrite(response), false, host)
    assert.equal(response.status, 200, host)
  }
})

test('does not canonicalize an already rewritten internal route', () => {
  const internal = new NextRequest('http://studio.localhost:3000/studio/profiles', {
    headers: {
      host: 'studio.localhost:3000',
      'x-qdip-internal-rewrite': '1',
      'x-qdip-studio-locale': 'en',
      'x-qdip-studio-route': 'profiles',
    },
  })

  assert.equal(isRewrite(proxy(internal)), false)
  assert.equal(proxy(internal).status, 200)
})
