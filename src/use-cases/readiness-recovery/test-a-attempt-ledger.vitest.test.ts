import { describe, expect, it } from 'vitest'
import {
  deriveAttemptId,
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

  it('allocates ordinals atomically under concurrent requests', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const attempts = await Promise.all(Array.from({ length: 32 }, () => ledger.allocateAttempt(EXECUTION_A)))

    expect(attempts.map((attempt) => attempt.attemptIndex).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 32 }, (_, index) => index)
    )
    expect(new Set(attempts.map((attempt) => attempt.attemptId)).size).toBe(32)
    expect(ledger.read().executions[EXECUTION_A].nextAttemptIndex).toBe(32)
  })

  it('keeps independent atomic ordinals per execution identity', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const [a0, b0, a1, b1] = await Promise.all([
      ledger.allocateAttempt(EXECUTION_A),
      ledger.allocateAttempt(EXECUTION_B),
      ledger.allocateAttempt(EXECUTION_A),
      ledger.allocateAttempt(EXECUTION_B),
    ])

    expect([a0.attemptIndex, a1.attemptIndex]).toEqual([0, 1])
    expect([b0.attemptIndex, b1.attemptIndex]).toEqual([0, 1])
  })

  it('does not consume an ordinal when allocation fails before commit', async () => {
    let fail = true
    const ledger = new TestAAttemptLedger({
      invalidityTaxonomy: TAXONOMY,
      failureInjector: (stage: FailureInjectionStage) => {
        if (stage === 'ALLOCATE_AFTER_DRAFT_BEFORE_COMMIT' && fail) {
          fail = false
          throw new Error('injected allocation failure')
        }
      },
    })

    await expect(ledger.allocateAttempt(EXECUTION_A)).rejects.toThrow('injected allocation failure')
    const firstCommitted = await ledger.allocateAttempt(EXECUTION_A)

    expect(firstCommitted.attemptIndex).toBe(0)
    expect(ledger.read().executions[EXECUTION_A].nextAttemptIndex).toBe(1)
  })

  it('rolls back terminalization if finalization fails before commit', async () => {
    let fail = true
    const ledger = new TestAAttemptLedger({
      invalidityTaxonomy: TAXONOMY,
      failureInjector: (stage: FailureInjectionStage) => {
        if (stage === 'FINALIZE_AFTER_DRAFT_BEFORE_COMMIT' && fail) {
          fail = false
          throw new Error('injected finalization failure')
        }
      },
    })
    const attempt = await ledger.allocateAttempt(EXECUTION_A)

    await expect(
      ledger.finalizeAttempt(attempt.attemptId, {
        kind: 'INVALID',
        invalidityReason: 'FROZEN_CONTRACT_BREACH',
        process: process(),
      })
    ).rejects.toThrow('injected finalization failure')

    expect(ledger.read().testState).toBe('OPEN')
    expect(ledger.read().executions[EXECUTION_A].attempts[0].status).toBe('ALLOCATED')

    const finalized = await ledger.finalizeAttempt(attempt.attemptId, {
      kind: 'INVALID',
      invalidityReason: 'FROZEN_CONTRACT_BREACH',
      process: process(),
    })
    expect(finalized.status).toBe('INVALID')
    expect(ledger.read().testState).toBe('TERMINAL_INVALID')
  })

  it('creates result identity only for semantic SUCCESS', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const successAttempt = await ledger.allocateAttempt(EXECUTION_A)
    const invalidAttempt = await ledger.allocateAttempt(EXECUTION_A)

    const success = await ledger.finalizeAttempt(successAttempt.attemptId, {
      kind: 'SUCCESS',
      resultPayload: { terminal: 'AUDIT_INCONCLUSIVE', nr: 0.12 },
      process: process(),
    })
    const invalid = await ledger.finalizeAttempt(invalidAttempt.attemptId, {
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

  it('atomically terminal-locks Test A on TEST_INVALIDATING and rejects later allocation', async () => {
    const ledger = new TestAAttemptLedger({ invalidityTaxonomy: TAXONOMY })
    const invalidatingAttempt = await ledger.allocateAttempt(EXECUTION_A)

    const [finalization, allocation] = await Promise.allSettled([
      ledger.finalizeAttempt(invalidatingAttempt.attemptId, {
        kind: 'INVALID',
        invalidityReason: 'FROZEN_CONTRACT_BREACH',
        process: process(),
      }),
      ledger.allocateAttempt(EXECUTION_A),
    ])

    expect(finalization.status).toBe('fulfilled')
    expect(allocation.status).toBe('rejected')
    expect(ledger.read().testState).toBe('TERMINAL_INVALID')
    expect(ledger.read().terminalAttemptId).toBe(invalidatingAttempt.attemptId)
    await expect(ledger.allocateAttempt(EXECUTION_B)).rejects.toThrow('TEST_A_TERMINAL_LOCKED')
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

    const stored = ledger.read().executions[EXECUTION_A].attempts[0]
    expect(stored.status).toBe('ALLOCATED')
    expect(stored.resultContentHash).toBeNull()
    expect(stored.runProvenanceHash).toBeNull()
  })
})
