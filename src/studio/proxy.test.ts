import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server'
import { GET } from '../app/api/studio/[...path]/route'

test('Studio uses the existing DIP key and ignores the removed Studio key', async () => {
  const originalEnv = { ...process.env }
  const originalFetch = globalThis.fetch
  try {
    process.env.DIP_API_BASE_URL = 'https://backend.example'
    process.env.DIP_API_KEY = 'existing-dip-key'
    process.env.DIP_STUDIO_API_KEY = 'obsolete-key'
    process.env.DIP_ADMIN_API_KEY = 'legacy-key'
    let expectedKey = 'existing-dip-key'
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'https://backend.example/api/v1/decision-profiles')
      assert.equal(new Headers(init?.headers).get('x-api-key'), expectedKey)
      return Response.json([])
    }
    const request = () =>
      GET(new NextRequest('https://frontend.example/api/studio/decision-profiles'), {
        params: Promise.resolve({ path: ['decision-profiles'] }),
      })
    assert.equal((await request()).status, 200)
    delete process.env.DIP_API_KEY
    expectedKey = 'legacy-key'
    assert.equal((await request()).status, 200)
    delete process.env.DIP_ADMIN_API_KEY
    assert.equal((await request()).status, 503)
  } finally {
    globalThis.fetch = originalFetch
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key]
    Object.assign(process.env, originalEnv)
  }
})
