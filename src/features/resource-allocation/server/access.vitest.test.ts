import { afterEach, describe, expect, it } from 'vitest'

import {
  assertResourceAllocationAccess,
  assertResourceAllocationDecisionAccess,
  assertSameOriginMutation,
  ResourceAllocationAccessError,
} from './access'

const originalPilotKey = process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY

afterEach(() => {
  if (originalPilotKey === undefined) delete process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY
  else process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY = originalPilotKey
})

function request(headers: Record<string, string> = {}) {
  return new Request('https://qdip.ai/api/resource-allocation/run', {
    method: 'POST',
    headers: { origin: 'https://qdip.ai', ...headers },
  })
}

describe('Resource Allocation pilot access', () => {
  it('keeps synthetic demo inputs public', () => {
    delete process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY
    expect(() =>
      assertResourceAllocationAccess(request(), {
        provenance: { source: 'responsible-citizens-canonical-v1' },
      })
    ).not.toThrow()
  })

  it('fails closed for imported client data when pilot access is not configured', () => {
    delete process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY
    expect(() =>
      assertResourceAllocationAccess(request(), {
        provenance: { source: 'client-import:week.csv' },
      })
    ).toThrowError(ResourceAllocationAccessError)

    try {
      assertResourceAllocationAccess(request(), {
        provenance: { source: 'client-import:week.csv' },
      })
    } catch (error) {
      expect(error).toMatchObject({ status: 503 })
    }
  })

  it('requires the configured pilot key for client data', () => {
    process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY = 'pilot-secret'

    expect(() =>
      assertResourceAllocationAccess(
        request({ 'x-qdip-pilot-key': 'pilot-secret' }),
        { provenance: { source: 'client-import:week.csv' } }
      )
    ).not.toThrow()

    expect(() =>
      assertResourceAllocationAccess(
        request({ 'x-qdip-pilot-key': 'wrong' }),
        { provenance: { source: 'client-import:week.csv' } }
      )
    ).toThrowError(ResourceAllocationAccessError)
  })

  it('requires pilot access for persisted client-import decisions', () => {
    process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY = 'pilot-secret'
    const decision = { provenance: { source: 'client-import:week.csv' } }

    expect(() =>
      assertResourceAllocationDecisionAccess(
        request({ 'x-qdip-pilot-key': 'pilot-secret' }),
        decision
      )
    ).not.toThrow()

    expect(() => assertResourceAllocationDecisionAccess(request(), decision)).toThrowError(
      ResourceAllocationAccessError
    )
  })

  it('keeps synthetic persisted decisions readable without pilot access', () => {
    process.env.QDIP_RESOURCE_ALLOCATION_PILOT_KEY = 'pilot-secret'
    expect(() =>
      assertResourceAllocationDecisionAccess(request(), {
        provenance: { source: 'responsible-citizens-canonical-v1' },
      })
    ).not.toThrow()
  })

  it('rejects cross-origin mutations', () => {
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
