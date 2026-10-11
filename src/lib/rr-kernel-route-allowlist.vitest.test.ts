import { describe, expect, it } from 'vitest'
import { allowedKernelPath } from './rr-kernel-route-allowlist'

describe('Kernel RR proxy allowlist', () => {
  it('allows only production RR execution and bounded evidence operations', () => {
    expect(allowedKernelPath(['executions'], 'POST')).toBe(true)
    expect(allowedKernelPath(['economic-v2', 'preflight'], 'POST')).toBe(true)
    expect(allowedKernelPath(['executions', 'rr-001'], 'GET')).toBe(true)
    expect(allowedKernelPath(['executions', 'rr-001', 'replan'], 'POST')).toBe(true)
    expect(allowedKernelPath(['executions', 'rr-001', 'replay-verification'], 'GET')).toBe(true)
    expect(allowedKernelPath(['decisions', 'civil-case', 'history'], 'GET')).toBe(true)
    expect(allowedKernelPath(['decisions', 'civil-case', 'history-integrity'], 'GET')).toBe(true)
    expect(allowedKernelPath(['decisions', 'civil-case', 'history', 'verified-export-page'], 'GET')).toBe(true)
    expect(allowedKernelPath(['decisions', 'civil-case', 'history', 'export'], 'GET')).toBe(false)
    expect(allowedKernelPath(['decisions', 'civil-case', 'history', 'export-complete'], 'GET')).toBe(false)
  })

  it('rejects arbitrary endpoints, traversal, extra segments and privilege escalation', () => {
    expect(allowedKernelPath(['plugins', 'foo', 'execute'], 'POST')).toBe(false)
    expect(allowedKernelPath(['economic-v2', 'preflight'], 'GET')).toBe(false)
    expect(allowedKernelPath(['economic-v2', 'execute'], 'POST')).toBe(false)
    expect(allowedKernelPath(['economic-v2', 'orders'], 'POST')).toBe(false)
    expect(allowedKernelPath(['economic-v2', 'preflight', 'apply'], 'POST')).toBe(false)
    expect(allowedKernelPath(['organizations'], 'GET')).toBe(false)
    expect(allowedKernelPath(['executions', '..'], 'GET')).toBe(false)
    expect(allowedKernelPath(['executions', '%2F'], 'GET')).toBe(false)
    expect(allowedKernelPath(['executions', 'rr-001', 'replan'], 'GET')).toBe(false)
    expect(allowedKernelPath(['decisions', 'civil-case', 'history', 'export'], 'POST')).toBe(false)
    expect(allowedKernelPath(['decisions', 'civil-case', 'history', 'export', 'extra'], 'GET')).toBe(false)
    expect(allowedKernelPath(['executions', 'rr-001', 'delete'], 'DELETE')).toBe(false)
    expect(allowedKernelPath([], 'GET')).toBe(false)
  })
})
