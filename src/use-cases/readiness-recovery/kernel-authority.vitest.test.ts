import { describe, expect, it } from 'vitest'
import { GET, POST } from '@/app/readiness/scenarios/[[...path]]/route'

describe('canonical RR has one solver authority', () => {
  it('retires the second public TypeScript solver for both GET and POST', async () => {
    for (const response of [await GET(), await POST()]) {
      expect(response.status).toBe(410)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(await response.json()).toMatchObject({ code: 'RR_LEGACY_SOLVER_RETIRED' })
    }
  })
})
