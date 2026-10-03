import { describe, expect, it } from 'vitest'
import {
  canonicalJson,
  deriveAttemptId,
  InMemoryTestALedgerStore,
  TestAAttemptLedger,
  type FailureInjectionStage,
  type InvalidityTaxonomy,
} from './test-a-attempt-ledger'

const EXECUTION_A = 'a'.repeat(64)
const EXECUTION_B = 'b'.repeat(64)

const TAXONOMY: InvalidityTaxonomy = {
  TRANSIENT_EXECUTOR_FAILURE: 'RETRYABLE',
  INPUT_PROVENANCE_INVALID: 'RUN_INVALID_NON_RETRYABLE',
  FROZEN_CONTRACT_BREACH: 'TEST_INVALIDATING',
}

const process = (overrides: Partial<{ startedAt: string; completedAt: string; executorId: string }> = {}) => ({
  startedAt: '2026-10-02T20:00:00.000Z',
  completedAt: '2026-10-02T20:00:01.000Z',
  executorId: 'executor-a',
  ...overrides,
})

describe('Test A attempt ledger', () => {
  it('derives deterministic attempt identities from execution identity and ordinal', () => {
    expect(deriveAttemptId(EXECUTION_A, 0)).toBe(deriveAttemptId(EXECUTION_A, 0))
    expect(deriveAttemptId(EXECUTION_A, 0)).not.toBe(deriveAttemptId(EXECUTION_A, 1))
    expect(deriveAttemptId(EXECUTION_A, 0)).not.toBe(deriveAttemptId(EXECUTION_B, 0))
  })

  it('canonicalizes keys with locale-independent lexical ordering', () => {
    const first = canonicalJson({ ä: 'umlaut', '2': 'two', '10': 'ten', a: 'latin' })
    const second = canonicalJson({ a: 'latin', '10': 'ten', ä: 'umlaut', '2': 'two' })

    expect(first).toBe('{"10":"ten","2":"two","a":"latin","ä":"umlaut"}')
    expect(second).toBe(first)
  })

  it('allocates ordinals atomically across concurrent executor instances sharing a CAS store', async () => {
    const store = new InMemoryTestALedgerStore()
    const executors = Array.from({ length: 8 }, () => new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY, store }))
    const attempts = await Promise.all(
      Array.from({ length: 64 }, (_, index) => executors[index % executors.length].allocateAttempt(EXECUTION_A))
    )

    expect(attempts.map((attempt) => attempt.attemptIndex).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 64 }, (_, index) => index)
    )
    expect(new Set(attempts.map((attempt) => attempt.attemptId)).size).toBe(64)
    expect((await executors[0].read()).executions[EXECUTION_A].nextAttemptIndex).toBe(64)
  })

  it('keeps independent atomic ordinals per execution identity', async () => {
    const store = new InMemoryTestALedgerStore()
    const firstExecutor = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY, store })
    const secondExecutor = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY, store })
    const [a0, b0, a1, b1] = await Promise.all([
      firstExecutor.allocateAttempt(EXECUTION_A),
      secondExecutor.allocateAttempt(EXECUTION_B),
      secondExecutor.allocateAttempt(EXECUTION_A),
      firstExecutor.allocateAttempt(EXECUTION_B),
    ])

    expect([a0.attemptIndex, a1.attemptIndex]).toEqual([0, 1])
    expect([b0.attemptIndex, b1.attemptIndex]).toEqual([0, 1])
  })

  it('does not consume an ordinal when allocation fails before CAS commit', async () => {
    let fail = true
    const store = new InMemoryTestALedgerStore()
    const failingExecutor = new TestAAttemptLedger({
      invalidityTaxonomy: TAXONOMY,
      store,
      failureInjector: (stage: FailureInjectionStage) => {
        if (stage === 'ALLOCATE_AFTER_DRAFT_BEFORE_COMMIT' && fail) {
          fail = false
          throw new Error('injected allocation failure')
        }
      },
    })
    const healthyExecutor = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY, store })

    await expect(failingExecutor.allocateAttempt(EXECUTION_A)).rejects.toThrow('injected allocation failure')
    const firstCommitted = await healthyExecutor.allocateAttempt(EXECUTION_A)

    expect(firstCommitted.attemptIndex).toBe(0)
    expect((await healthyExecutor.read()).executions[EXECUTION_A].nextAttemptIndex).toBe(1)
  })

  it('rolls back terminalization if finalization fails before CAS commit', async () => {
    let fail = true
    const store = new InMemoryTestALedgerStore()
    const failingExecutor = new TestAAttemptLedger({
      invalidityTaxonomy: TAXONOMY,
      store,
      failureInjector: (stage: FailureInjectionStage) => {
        if (stage === 'FINALIZE_AFTER_DRAFT_BEFORE_COMMIT' && fail) {
          fail = false
          throw new Error('injected finalization failure')
        }
      },
    })
    const healthyExecutor = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY, store })
    const attempt = await failingExecutor.allocateAttempt(EXECUTION_A)

    await expect(
      failingExecutor.finalizeAttempt(attempt.attemptId, {
        kind: 'INVALID',
        invalidityReason: 'FROZEN_CONTRACT_BREACH',
        process: process(),
      })
    ).rejects.toThrow('injected finalization failure')

    expect((await healthyExecutor.read()).testState).toBe('OPEN')
    expect((await healthyExecutor.read()).executions[EXECUTION_A].attempts[0].status).toBe('ALLOCATED')

    const finalized = await healthyExecutor.finalizeAttempt(attempt.attemptId, {
      kind: 'INVALID',
      invalidityReason: 'FROZEN_CONTRACT_BREACH',
      process: process(),
    })
    expect(finalized.status).toBe('INVALID')
    expect((await healthyExecutor.read()).testState).toBe('TERMINAL_INVALID')
  })

  it('creates result identity only for semantic SUCCESS', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const successAttempt = await ledger.allocateAttempt(EXECUTION_A)
    const inFlightAttempt = await ledger.allocateAttempt(EXECUTION_A)

    const success = await ledger.finalizeAttempt(successAttempt.attemptId, {
      kind: 'SUCCESS',
      resultPayload: { terminal: 'AUDIT_INCONCLUSIVE', nr: 0.12 },
      process: process(),
    })
    const invalid = await ledger.finalizeAttempt(inFlightAttempt.attemptId, {
      kind: 'INVALID',
      invalidityReason: 'TRANSIENT_EXECUTOR_FAILURE',
      process: process(),
    })

    expect(success.status).toBe('SUCCESS')
    expect(success.resultContentHash).toMatch(/^[a-f0-9]{64}$/)
    expect(success.runProvenanceHash).toMatch(/^[a-f0-9]{64}$/)
    expect(success.invalidity).toBeNull()

    expect(invalid.status).toBe('INVALID')
    expect(invalid.resultContentHash).toBeNull()
    expect(invalid.runProvenanceHash).toMatch(/^[a-f0-9]{64}$/)
    expect(invalid.invalidity).toEqual({
      reason: 'TRANSIENT_EXECUTOR_FAILURE',
      class: 'RETRYABLE',
      action: 'RETRY',
    })
    await expect(ledger.allocateAttempt(EXECUTION_A)).rejects.toThrow('EXECUTION_ATTEMPTS_CLOSED')
  })

  it('allows a retry only after RETRYABLE invalidity', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const first = await ledger.allocateAttempt(EXECUTION_A)
    await ledger.finalizeAttempt(first.attemptId, {
      kind: 'INVALID',
      invalidityReason: 'TRANSIENT_EXECUTOR_FAILURE',
      process: process(),
    })

    const retry = await ledger.allocateAttempt(EXECUTION_A)
    expect(retry.attemptIndex).toBe(1)
    expect((await ledger.read()).executions[EXECUTION_A].state).toBe('OPEN')
  })

  it('closes only the affected execution after RUN_INVALID_NON_RETRYABLE', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const first = await ledger.allocateAttempt(EXECUTION_A)
    await ledger.finalizeAttempt(first.attemptId, {
      kind: 'INVALID',
      invalidityReason: 'INPUT_PROVENANCE_INVALID',
      process: process(),
    })

    await expect(ledger.allocateAttempt(EXECUTION_A)).rejects.toThrow('EXECUTION_ATTEMPTS_CLOSED')
    const otherExecution = await ledger.allocateAttempt(EXECUTION_B)
    expect(otherExecution.attemptIndex).toBe(0)
    expect((await ledger.read()).testState).toBe('OPEN')
  })

  it('rejects SUCCESS without a valid canonical result payload and leaves the attempt open', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const attempt = await ledger.allocateAttempt(EXECUTION_A)

    await expect(
      ledger.finalizeAttempt(attempt.attemptId, {
        kind: 'SUCCESS',
        resultPayload: undefined as never,
        process: process(),
      })
    ).rejects.toThrow('Canonical JSON payload is required')

    const stored = (await ledger.read()).executions[EXECUTION_A].attempts[0]
    expect(stored.status).toBe('ALLOCATED')
    expect(stored.resultContentHash).toBeNull()
    expect(stored.runProvenanceHash).toBeNull()
    expect((await ledger.read()).executions[EXECUTION_A].state).toBe('OPEN')
  })

  it('keeps substantive result identity independent of volatile process metadata', async () => {
    const firstLedger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const secondLedger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const firstAttempt = await firstLedger.allocateAttempt(EXECUTION_A)
    const secondAttempt = await secondLedger.allocateAttempt(EXECUTION_A)

    const payload = { terminal: 'AUDIT_INCONCLUSIVE', evidence: { formulation: 'UNRESOLVED' } } as const
    const first = await firstLedger.finalizeAttempt(firstAttempt.attemptId, {
      kind: 'SUCCESS',
      resultPayload: payload,
      process: process({ executorId: 'executor-a' }),
    })
    const second = await secondLedger.finalizeAttempt(secondAttempt.attemptId, {
      kind: 'SUCCESS',
      resultPayload: payload,
      process: process({
        startedAt: '2026-10-02T21:00:00.000Z',
        completedAt: '2026-10-02T21:00:03.000Z',
        executorId: 'executor-b',
      }),
    })

    expect(first.resultContentHash).toBe(second.resultContentHash)
    expect(first.runProvenanceHash).not.toBe(second.runProvenanceHash)
  })

  it('accepts provenance with only the required process fields', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const attempt = await ledger.allocateAttempt(EXECUTION_A)
    const finalized = await ledger.finalizeAttempt(attempt.attemptId, {
      kind: 'SUCCESS',
      resultPayload: { terminal: 'AUDIT_INCONCLUSIVE' },
      process: {
        startedAt: '2026-10-02T20:00:00.000Z',
        completedAt: '2026-10-02T20:00:01.000Z',
      },
    })

    expect(finalized.resultContentHash).toMatch(/^[a-f0-9]{64}$/)
    expect(finalized.runProvenanceHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('linearizes the TEST_INVALIDATING terminal-lock race and rejects every post-lock allocation', async () => {
    const store = new InMemoryTestALedgerStore()
    const invalidatingExecutor = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY, store })
    const competingExecutor = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY, store })
    const invalidatingAttempt = await invalidatingExecutor.allocateAttempt(EXECUTION_A)

    const [finalization, concurrentAllocation] = await Promise.allSettled([
      invalidatingExecutor.finalizeAttempt(invalidatingAttempt.attemptId, {
        kind: 'INVALID',
        invalidityReason: 'FROZEN_CONTRACT_BREACH',
        process: process(),
      }),
      competingExecutor.allocateAttempt(EXECUTION_A),
    ])

    expect(finalization.status).toBe('fulfilled')
    expect(['fulfilled', 'rejected']).toContain(concurrentAllocation.status)
    expect((await competingExecutor.read()).testState).toBe('TERMINAL_INVALID')
    expect((await competingExecutor.read()).terminalAttemptId).toBe(invalidatingAttempt.attemptId)
    await expect(competingExecutor.allocateAttempt(EXECUTION_A)).rejects.toThrow('TEST_A_TERMINAL_LOCKED')
    await expect(competingExecutor.allocateAttempt(EXECUTION_B)).rejects.toThrow('TEST_A_TERMINAL_LOCKED')
  })

  it('does not let a later in-flight invalidating attempt overwrite the original terminal lock identity', async () => {
    const store = new InMemoryTestALedgerStore()
    const firstExecutor = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY, store })
    const secondExecutor = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY, store })
    const first = await firstExecutor.allocateAttempt(EXECUTION_A)
    const second = await secondExecutor.allocateAttempt(EXECUTION_A)

    await firstExecutor.finalizeAttempt(first.attemptId, {
      kind: 'INVALID',
      invalidityReason: 'FROZEN_CONTRACT_BREACH',
      process: process(),
    })
    await secondExecutor.finalizeAttempt(second.attemptId, {
      kind: 'INVALID',
      invalidityReason: 'FROZEN_CONTRACT_BREACH',
      process: process({ executorId: 'executor-b' }),
    })

    expect((await secondExecutor.read()).terminalAttemptId).toBe(first.attemptId)
  })

  it('rejects unknown invalidity reasons without partially finalizing the attempt', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const attempt = await ledger.allocateAttempt(EXECUTION_A)

    await expect(
      ledger.finalizeAttempt(attempt.attemptId, {
        kind: 'INVALID',
        invalidityReason: 'UNREGISTERED_REASON',
        process: process(),
      })
    ).rejects.toThrow('Unknown Test A invalidity reason')

    const stored = (await ledger.read()).executions[EXECUTION_A].attempts[0]
    expect(stored.status).toBe('ALLOCATED')
    expect(stored.resultContentHash).toBeNull()
    expect(stored.runProvenanceHash).toBeNull()
  })
})
