import { describe, expect, it } from 'vitest'

import { assertSameOriginMutation, ResourceAllocationAccessError } from './access'

describe('Resource Allocation request boundary', () => {
  it('allows same-origin browser mutations without a prospect access code', () => {
    expect(() =>
      assertSameOriginMutation(
        new Request('https://qdip.ai/api/resource-allocation/run', {
          method: 'POST',
          headers: { origin: 'https://qdip.ai', 'sec-fetch-site': 'same-origin' },
        })
      )
    ).not.toThrow()
  })

  it('allows server-side smoke requests without browser origin headers', () => {
    expect(() =>
      assertSameOriginMutation(
        new Request('https://qdip.ai/api/resource-allocation/run', {
          method: 'POST',
        })
      )
    ).not.toThrow()
  })

  it('rejects cross-origin browser mutations', () => {
    expect(() =>
      assertSameOriginMutation(
        new Request('https://qdip.ai/api/resource-allocation/run', {
          method: 'POST',
          headers: { origin: 'https://attacker.example', 'sec-fetch-site': 'cross-site' },
        })
      )
    ).toThrowError(ResourceAllocationAccessError)
  })
})
