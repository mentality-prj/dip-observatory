import 'server-only'

import { z } from 'zod'

import { dipRequest } from '@/shared/dip/server-client'
import type { TestAAttemptLedgerSnapshot, TestALedgerStore, VersionedTestALedgerState } from './test-a-attempt-ledger'

const LEDGER_ID_RE = /^[A-Za-z0-9._:-]{1,200}$/

const invaliditySchema = z.object({
  reason: z.string(),
  class: z.enum(['RETRYABLE', 'RUN_INVALID_NON_RETRYABLE', 'TEST_INVALIDATING']),
  action: z.enum(['RETRY', 'STOP_EXECUTION', 'INVALIDATE_TEST']),
})

const attemptSchema = z.object({
  executionManifestHash: z.string().regex(/^[a-f0-9]{64}$/),
  attemptIndex: z.number().int().nonnegative(),
  attemptId: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.enum(['ALLOCATED', 'SUCCESS', 'INVALID']),
  invalidity: invaliditySchema.nullable(),
  resultContentHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  runProvenanceHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
})

const executionSchema = z.object({
  state: z.enum(['OPEN', 'SUCCESS_LOCKED', 'NON_RETRYABLE_INVALID']),
  closedByAttemptId: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  nextAttemptIndex: z.number().int().nonnegative(),
  attempts: z.array(attemptSchema),
})

const snapshotSchema = z.object({
  testState: z.enum(['OPEN', 'TERMINAL_INVALID']),
  terminalAttemptId: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  executions: z.record(z.string().regex(/^[a-f0-9]{64}$/), executionSchema),
})

const stateResponseSchema = z.object({
  version: z.number().int().nonnegative(),
  snapshot: snapshotSchema,
})

const casResponseSchema = z.object({ committed: z.boolean() })

function validateLedgerId(ledgerId: string) {
  if (!LEDGER_ID_RE.test(ledgerId)) throw new Error('Invalid Test A ledger identity')
  return ledgerId
}

function ledgerPath(ledgerId: string) {
  return `/api/v1/observatory/test-a-ledgers/${encodeURIComponent(validateLedgerId(ledgerId))}`
}

export class DipTestALedgerStore implements TestALedgerStore {
  private readonly path: string

  constructor(ledgerId: string) {
    this.path = ledgerPath(ledgerId)
  }

  async read(): Promise<VersionedTestALedgerState> {
    const response = await dipRequest(this.path, stateResponseSchema)
    return {
      version: response.version,
      snapshot: response.snapshot as TestAAttemptLedgerSnapshot,
    }
  }

  async compareAndSwap(expectedVersion: number, nextSnapshot: TestAAttemptLedgerSnapshot): Promise<boolean> {
    const response = await dipRequest(`${this.path}/cas`, casResponseSchema, {
      method: 'POST',
      body: JSON.stringify({
        expected_version: expectedVersion,
        next_snapshot: nextSnapshot,
      }),
    })
    return response.committed
  }
}
