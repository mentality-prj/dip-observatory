import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { DipTestALedgerStore } from './test-a-dip-ledger-store'
import { TestAAttemptLedger, type TestAAttemptLedgerSnapshot } from './test-a-attempt-ledger'

const EXECUTION = 'a'.repeat(64)
const TAXONOMY = {
  TRANSIENT_EXECUTOR_FAILURE: 'RETRYABLE',
  INPUT_PROVENANCE_INVALID: 'RUN_INVALID_NON_RETRYABLE',
  FROZEN_CONTRACT_BREACH: 'TEST_INVALIDATING',
} as const

function emptySnapshot(): TestAAttemptLedgerSnapshot {
  return {
    testState: 'OPEN',
    terminalAttemptId: null,
    executions: {},
  }
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('DIP Test A ledger store', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('reads a versioned snapshot through the authenticated DIP transport', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret-key')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ version: 7, snapshot: emptySnapshot() }))
    vi.stubGlobal('fetch', fetchMock)

    const store = new DipTestALedgerStore('readiness-audit-1')
    const state = await store.read()

    expect(state).toEqual({ version: 7, snapshot: emptySnapshot() })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://dip.example/api/v1/observatory/test-a-ledgers/readiness-audit-1')
    expect(init.cache).toBe('no-store')
    expect(new Headers(init.headers).get('x-api-key')).toBe('secret-key')
  })

  it('forwards CAS version and exact snapshot without changing Test A semantics', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret-key')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ committed: false }))
    vi.stubGlobal('fetch', fetchMock)
    const snapshot = emptySnapshot()

    const store = new DipTestALedgerStore('readiness:audit:1')
    const committed = await store.compareAndSwap(4, snapshot)

    expect(committed).toBe(false)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://dip.example/api/v1/observatory/test-a-ledgers/readiness%3Aaudit%3A1/cas')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      expected_version: 4,
      next_snapshot: snapshot,
    })
  })

  it('rejects malformed persisted snapshots at the transport boundary', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret-key')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ version: 0, snapshot: { testState: 'BROKEN' } })))

    await expect(new DipTestALedgerStore('readiness-audit-1').read()).rejects.toThrow()
  })

  it('rejects unsafe ledger identities before making a backend request', () => {
    expect(() => new DipTestALedgerStore('unsafe ledger')).toThrow('Invalid Test A ledger identity')
  })

  it('runs the actual Test A allocator across two executors through the HTTP CAS boundary', async () => {
    vi.stubEnv('DIP_API_BASE_URL', 'https://dip.example')
    vi.stubEnv('DIP_API_KEY', 'secret-key')
    let version = 0
    let snapshot = emptySnapshot()

    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      await Promise.resolve()
      if (init.method === 'POST') {
        const body = JSON.parse(init.body as string) as {
          expected_version: number
          next_snapshot: TestAAttemptLedgerSnapshot
        }
        if (body.expected_version !== version) return jsonResponse({ committed: false })
        version += 1
        snapshot = structuredClone(body.next_snapshot)
        return jsonResponse({ committed: true })
      }
      return jsonResponse({ version, snapshot })
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = new TestAAttemptLedger({
      invalidityTaxonomy: TAXONOMY,
      store: new DipTestALedgerStore('readiness-audit-1'),
    })
    const second = new TestAAttemptLedger({
      invalidityTaxonomy: TAXONOMY,
      store: new DipTestALedgerStore('readiness-audit-1'),
    })

    const attempts = await Promise.all(
      Array.from({ length: 16 }, (_, index) => (index % 2 === 0 ? first : second).allocateAttempt(EXECUTION))
    )

    expect(attempts.map((attempt) => attempt.attemptIndex).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, index) => index)
    )
    expect(version).toBe(16)
    expect(snapshot.executions[EXECUTION].nextAttemptIndex).toBe(16)
  })
})
