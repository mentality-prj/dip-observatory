import { createHash } from 'node:crypto'

export const TEST_A_LEDGER_SCHEMA_VERSION = 'readiness-test-a-ledger.v1' as const
export const TEST_A_CANONICALIZATION_VERSION = 'json-sorted-v1' as const

type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type InvalidityClass = 'RETRYABLE' | 'RUN_INVALID_NON_RETRYABLE' | 'TEST_INVALIDATING'
export type InvalidityAction = 'RETRY' | 'STOP_EXECUTION' | 'INVALIDATE_TEST'
export type TestAState = 'OPEN' | 'TERMINAL_INVALID'
export type AttemptStatus = 'ALLOCATED' | 'SUCCESS' | 'INVALID'

export type InvalidityTaxonomy = Readonly<Record<string, InvalidityClass>>

export type NormalizedInvalidityRecord = {
  reason: string
  class: InvalidityClass
  action: InvalidityAction
}

export type ProcessMetadata = {
  startedAt: string
  completedAt: string
  executorId?: string
  hostFingerprint?: string
  exitCode?: number | null
  signal?: string | null
  stderrHash?: string | null
}

export type AttemptRecord = {
  executionManifestHash: string
  attemptIndex: number
  attemptId: string
  status: AttemptStatus
  invalidity: NormalizedInvalidityRecord | null
  resultContentHash: string | null
  runProvenanceHash: string | null
}

export type TestAAttemptLedgerSnapshot = {
  testState: TestAState
  terminalAttemptId: string | null
  executions: Record<
    string,
    {
      nextAttemptIndex: number
      attempts: AttemptRecord[]
    }
  >
}

export type AttemptOutcome =
  | {
      kind: 'SUCCESS'
      resultPayload: JsonValue
      process: ProcessMetadata
    }
  | {
      kind: 'INVALID'
      invalidityReason: string
      process: ProcessMetadata
    }

export type FailureInjectionStage = 'ALLOCATE_AFTER_DRAFT_BEFORE_COMMIT' | 'FINALIZE_AFTER_DRAFT_BEFORE_COMMIT'

export type TestALedgerOptions = {
  invalidityTaxonomy: InvalidityTaxonomy
  failureInjector?: (stage: FailureInjectionStage) => void
}

const HASH_RE = /^[a-f0-9]{64}$/

function assertHash(value: string, name: string) {
  if (!HASH_RE.test(value)) throw new Error(`${name} must be a lowercase SHA-256 hex digest`)
}

function normalizeJson(value: JsonValue): JsonValue {
  if ((value as unknown) === undefined) throw new Error('Canonical JSON payload is required')
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Canonical JSON does not allow non-finite numbers')
    return Object.is(value, -0) ? 0 : value
  }
  if (Array.isArray(value)) return value.map(normalizeJson)

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalizeJson(nested)])
  )
}

export function canonicalJson(value: JsonValue) {
  return JSON.stringify(normalizeJson(value))
}

function hashArtifact(artifactType: string, payload: JsonValue) {
  const envelope: JsonValue = {
    artifact_type: artifactType,
    schema_version: TEST_A_LEDGER_SCHEMA_VERSION,
    canonicalization_version: TEST_A_CANONICALIZATION_VERSION,
    payload,
  }
  return createHash('sha256').update(canonicalJson(envelope), 'utf8').digest('hex')
}

function processMetadataPayload(process: ProcessMetadata): JsonValue {
  const payload: { [key: string]: JsonValue } = {
    started_at: process.startedAt,
    completed_at: process.completedAt,
  }
  if (process.executorId !== undefined) payload.executor_id = process.executorId
  if (process.hostFingerprint !== undefined) payload.host_fingerprint = process.hostFingerprint
  if (process.exitCode !== undefined) payload.exit_code = process.exitCode
  if (process.signal !== undefined) payload.signal = process.signal
  if (process.stderrHash !== undefined) payload.stderr_hash = process.stderrHash
  return payload
}

function invalidityPayload(invalidity: NormalizedInvalidityRecord): JsonValue {
  return {
    reason: invalidity.reason,
    class: invalidity.class,
    action: invalidity.action,
  }
}

export function deriveAttemptId(executionManifestHash: string, attemptIndex: number) {
  assertHash(executionManifestHash, 'executionManifestHash')
  if (!Number.isSafeInteger(attemptIndex) || attemptIndex < 0) {
    throw new Error('attemptIndex must be a non-negative safe integer')
  }
  return hashArtifact('test_a_attempt_identity', {
    execution_manifest_hash: executionManifestHash,
    attempt_index: attemptIndex,
  })
}

export function normalizeInvalidity(reason: string, taxonomy: InvalidityTaxonomy): NormalizedInvalidityRecord {
  const invalidityClass = taxonomy[reason]
  if (!invalidityClass) throw new Error(`Unknown Test A invalidity reason: ${reason}`)
  const action: InvalidityAction =
    invalidityClass === 'RETRYABLE'
      ? 'RETRY'
      : invalidityClass === 'RUN_INVALID_NON_RETRYABLE'
        ? 'STOP_EXECUTION'
        : 'INVALIDATE_TEST'
  return { reason, class: invalidityClass, action }
}

function cloneSnapshot(snapshot: TestAAttemptLedgerSnapshot): TestAAttemptLedgerSnapshot {
  return {
    testState: snapshot.testState,
    terminalAttemptId: snapshot.terminalAttemptId,
    executions: Object.fromEntries(
      Object.entries(snapshot.executions).map(([executionHash, execution]) => [
        executionHash,
        {
          nextAttemptIndex: execution.nextAttemptIndex,
          attempts: execution.attempts.map((attempt) => ({
            ...attempt,
            invalidity: attempt.invalidity ? { ...attempt.invalidity } : null,
          })),
        },
      ])
    ),
  }
}

function allAttempts(snapshot: TestAAttemptLedgerSnapshot) {
  return Object.values(snapshot.executions).flatMap((execution) => execution.attempts)
}

function validateSnapshot(snapshot: TestAAttemptLedgerSnapshot) {
  const attemptIds = new Set<string>()
  for (const [executionHash, execution] of Object.entries(snapshot.executions)) {
    assertHash(executionHash, 'executionManifestHash')
    const indexes = new Set<number>()
    for (const attempt of execution.attempts) {
      if (attempt.executionManifestHash !== executionHash) throw new Error('Attempt execution identity mismatch')
      if (attempt.attemptId !== deriveAttemptId(executionHash, attempt.attemptIndex)) {
        throw new Error('Attempt identity mismatch')
      }
      if (indexes.has(attempt.attemptIndex)) throw new Error('Duplicate attempt index for execution identity')
      if (attemptIds.has(attempt.attemptId)) throw new Error('Duplicate attempt identity')
      indexes.add(attempt.attemptIndex)
      attemptIds.add(attempt.attemptId)

      if (attempt.status === 'SUCCESS') {
        if (!attempt.resultContentHash || !attempt.runProvenanceHash || attempt.invalidity) {
          throw new Error('SUCCESS attempt must have result identity and provenance without invalidity')
        }
      } else if (attempt.status === 'INVALID') {
        if (attempt.resultContentHash || !attempt.runProvenanceHash || !attempt.invalidity) {
          throw new Error('INVALID attempt must have provenance and no result identity')
        }
      } else if (attempt.resultContentHash || attempt.runProvenanceHash || attempt.invalidity) {
        throw new Error('ALLOCATED attempt cannot carry terminal artifacts')
      }
    }

    const expectedNext = execution.attempts.length
      ? Math.max(...execution.attempts.map((attempt) => attempt.attemptIndex)) + 1
      : 0
    if (execution.nextAttemptIndex !== expectedNext) throw new Error('Attempt ordinal gap detected')
  }

  if (snapshot.testState === 'OPEN') {
    if (snapshot.terminalAttemptId) throw new Error('OPEN Test A cannot have a terminal attempt identity')
    return
  }

  if (!snapshot.terminalAttemptId) throw new Error('Terminal Test A state requires the invalidating attempt identity')
  const terminalAttempt = allAttempts(snapshot).find((attempt) => attempt.attemptId === snapshot.terminalAttemptId)
  if (terminalAttempt?.invalidity?.class !== 'TEST_INVALIDATING') {
    throw new Error('Terminal Test A state must point to a TEST_INVALIDATING attempt')
  }
}

function findAttempt(snapshot: TestAAttemptLedgerSnapshot, attemptId: string) {
  for (const [executionHash, execution] of Object.entries(snapshot.executions)) {
    const attemptIndex = execution.attempts.findIndex((attempt) => attempt.attemptId === attemptId)
    if (attemptIndex >= 0) return { executionHash, attemptIndex, attempt: execution.attempts[attemptIndex] }
  }
  return null
}

export class TestAAttemptLedger {
  private snapshot: TestAAttemptLedgerSnapshot = {
    testState: 'OPEN',
    terminalAttemptId: null,
    executions: {},
  }

  private tail: Promise<void> = Promise.resolve()

  constructor(private readonly options: TestALedgerOptions) {}

  private async atomic<T>(operation: () => T | Promise<T>): Promise<T> {
    const previous = this.tail
    let release!: () => void
    this.tail = new Promise<void>((resolve) => {
      release = resolve
    })
    await previous
    try {
      return await operation()
    } finally {
      release()
    }
  }

  read(): TestAAttemptLedgerSnapshot {
    return cloneSnapshot(this.snapshot)
  }

  async allocateAttempt(executionManifestHash: string): Promise<AttemptRecord> {
    assertHash(executionManifestHash, 'executionManifestHash')
    return this.atomic(() => {
      if (this.snapshot.testState !== 'OPEN') throw new Error('TEST_A_TERMINAL_LOCKED')

      const draft = cloneSnapshot(this.snapshot)
      const execution = draft.executions[executionManifestHash] ?? { nextAttemptIndex: 0, attempts: [] }
      const attemptIndex = execution.nextAttemptIndex
      const attempt: AttemptRecord = {
        executionManifestHash,
        attemptIndex,
        attemptId: deriveAttemptId(executionManifestHash, attemptIndex),
        status: 'ALLOCATED',
        invalidity: null,
        resultContentHash: null,
        runProvenanceHash: null,
      }
      execution.attempts.push(attempt)
      execution.nextAttemptIndex += 1
      draft.executions[executionManifestHash] = execution

      validateSnapshot(draft)
      this.options.failureInjector?.('ALLOCATE_AFTER_DRAFT_BEFORE_COMMIT')
      this.snapshot = draft
      return { ...attempt }
    })
  }

  async finalizeAttempt(attemptId: string, outcome: AttemptOutcome): Promise<AttemptRecord> {
    return this.atomic(() => {
      const draft = cloneSnapshot(this.snapshot)
      const located = findAttempt(draft, attemptId)
      if (!located) throw new Error(`Unknown attempt: ${attemptId}`)
      if (located.attempt.status !== 'ALLOCATED') throw new Error(`Attempt already finalized: ${attemptId}`)

      const execution = draft.executions[located.executionHash]
      const attempt = execution.attempts[located.attemptIndex]

      if (outcome.kind === 'SUCCESS') {
        const normalizedResult = normalizeJson(outcome.resultPayload)
        const resultContentHash = hashArtifact('test_a_result_content', {
          execution_manifest_hash: attempt.executionManifestHash,
          result_payload: normalizedResult,
        })
        attempt.status = 'SUCCESS'
        attempt.resultContentHash = resultContentHash
        attempt.invalidity = null
        attempt.runProvenanceHash = hashArtifact('test_a_run_provenance', {
          execution_manifest_hash: attempt.executionManifestHash,
          attempt_id: attempt.attemptId,
          attempt_index: attempt.attemptIndex,
          result_content_hash: resultContentHash,
          invalidity: null,
          process: processMetadataPayload(outcome.process),
        })
      } else {
        const invalidity = normalizeInvalidity(outcome.invalidityReason, this.options.invalidityTaxonomy)
        attempt.status = 'INVALID'
        attempt.invalidity = invalidity
        attempt.resultContentHash = null
        attempt.runProvenanceHash = hashArtifact('test_a_run_provenance', {
          execution_manifest_hash: attempt.executionManifestHash,
          attempt_id: attempt.attemptId,
          attempt_index: attempt.attemptIndex,
          result_content_hash: null,
          invalidity: invalidityPayload(invalidity),
          process: processMetadataPayload(outcome.process),
        })

        if (invalidity.class === 'TEST_INVALIDATING' && draft.testState === 'OPEN') {
          draft.testState = 'TERMINAL_INVALID'
          draft.terminalAttemptId = attempt.attemptId
        }
      }

      validateSnapshot(draft)
      this.options.failureInjector?.('FINALIZE_AFTER_DRAFT_BEFORE_COMMIT')
      this.snapshot = draft
      return { ...attempt, invalidity: attempt.invalidity ? { ...attempt.invalidity } : null }
    })
  }
}
