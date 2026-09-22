import assert from 'node:assert/strict'
import test from 'node:test'
import { getRewrittenUrl, isRewrite } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'
function request(host: string, pathname = '/') {
  return new NextRequest(`https://${host}${pathname}`, { headers: { host } })
}
function forwardedRequest(forwardedHost: string, pathname = '/') {
  return new NextRequest(`http://127.0.0.1:3000${pathname}`, {
    headers: { host: '127.0.0.1:3000', 'x-forwarded-host': forwardedHost },
  })
}
test('routes localized Studio URLs to the Studio app', () => {
  const home = proxy(request('studio.qdip.ai', '/en'))
  const profiles = proxy(request('studio.qdip.ai', '/uk/profiles'))
  assert.equal(isRewrite(home), true)
  assert.equal(new URL(getRewrittenUrl(home)!).pathname, '/studio')
  assert.equal(new URL(getRewrittenUrl(home)!).searchParams.get('lang'), 'en')
  assert.equal(new URL(getRewrittenUrl(profiles)!).pathname, '/studio/profiles')
  assert.equal(new URL(getRewrittenUrl(profiles)!).searchParams.get('lang'), 'uk')
})

test('redirects legacy Studio URLs to the English canonical route', () => {
  const root = proxy(request('studio.qdip.ai'))
  const profiles = proxy(request('studio.qdip.ai', '/profiles'))
  assert.equal(root.status, 308)
  assert.equal(new URL(root.headers.get('location')!).pathname, '/en')
  assert.equal(profiles.status, 308)
  assert.equal(new URL(profiles.headers.get('location')!).pathname, '/en/profiles')
})
test('routes clean Observatory URLs to the localized app', () => {
  const home = proxy(request('observatory.qdip.ai'))
  const decisions = proxy(request('observatory.qdip.ai', '/decisions'))
  assert.equal(new URL(getRewrittenUrl(home)!).pathname, '/en')
  assert.equal(new URL(getRewrittenUrl(decisions)!).pathname, '/observatory/decisions')
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
  assert.equal(new URL(canonical.headers.get('location')!).pathname, '/pl/use-cases')
  assert.equal(isRewrite(preview), false)
  assert.equal(isRewrite(observatory), false)
})

test('keeps forwarded-host surface rewrites on the local origin in CI', () => {
  const response = proxy(forwardedRequest('studio.qdip.ai', '/en'))
  assert.equal(isRewrite(response), true)

  const rewritten = new URL(getRewrittenUrl(response)!)
  assert.equal(rewritten.origin, 'http://127.0.0.1:3000')
  assert.equal(rewritten.pathname, '/studio')
  assert.equal(rewritten.searchParams.get('lang'), 'en')
})
