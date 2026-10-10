import { describe, it, expect } from 'vitest'
import {
  OperatorRequestGuard,
  classifyOperatorHttpStatus,
  parsedExecutionIds,
  parseKernelRequestFile,
} from './operator-guards'

describe('Kernel operator authority and race controls', () => {
  it('invalidates old result completion after another request or logout', () => {
    const guard = new OperatorRequestGuard()
    const first = guard.begin()
    const second = guard.begin()
    expect(guard.current(first)).toBe(false)
    expect(guard.current(second)).toBe(true)
    guard.invalidate()
    expect(guard.current(second)).toBe(false)
  })
  it('classifies negative authoritative HTTP outcomes without manufacturing infeasibility', () => {
    expect(classifyOperatorHttpStatus(401)).toBe('AUTH_REQUIRED')
    expect(classifyOperatorHttpStatus(403)).toBe('ACCESS_DENIED')
    expect(classifyOperatorHttpStatus(409)).toBe('CONFLICT')
    expect(classifyOperatorHttpStatus(422)).toBe('INVALID_INPUT')
    expect(classifyOperatorHttpStatus(404)).toBe('UNSUPPORTED')
    expect(classifyOperatorHttpStatus(503)).toBe('UNAVAILABLE')
  })
  it('ignores malformed execution ids returned in arbitrary result fields', () => {
    expect(
      parsedExecutionIds({
        result: { workflow: { execution_id: 'safe-1', ingestion: { payload: { decision_id: 'safe.2' } } } },
      })
    ).toEqual({ executionId: 'safe-1', decisionId: 'safe.2' })
    expect(
      parsedExecutionIds({
        result: { workflow: { execution_id: '../../bad', ingestion: { payload: { decision_id: 42 } } } },
      })
    ).toEqual({ executionId: '', decisionId: '' })
  })
  it('rejects untrusted legacy packages or malformed Kernel requests', () => {
    for (const input of [
      null,
      { scenarioId: 'legacy', frontier: [] },
      { execution_id: 'bad/id', payload: {} },
      { execution_id: 'rr1', source: {}, ingested_at: '', payload: {} },
      {
        execution_id: 'rr1',
        source: {},
        ingested_at: new Date().toISOString(),
        payload: { decision_id: 'rr1' },
        apiKey: 'leak',
      },
    ]) {
      expect(() => parseKernelRequestFile(input)).toThrow()
    }
    const good = {
      execution_id: 'rr1',
      source: {},
      ingested_at: '2026-10-10T00:00:00Z',
      payload: { decision_id: 'decision-1' },
    }
    expect(parseKernelRequestFile(good)).toEqual(good)
  })
})
