import { createHash, createHmac } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
import { signRrActor } from './rr-actor-assertion'

const issuer = 'https://identity.example.test'
const subject = 'oidc-sub-123'
const secret = 'unique-shared-rr-audit-assertion-secret-minimum-32'

describe('authenticated RR operator audit assertion', () => {
  it('binds immutable Zitadel subject and operation to a short-lived MAC', () => {
    const fixedNow = 1791676800000
    const assertion = signRrActor(issuer, subject, 'execute', secret, fixedNow)
    const pieces = assertion.split('.')
    expect(pieces).toHaveLength(5)
    expect(pieces[0]).toBe('v1')
    expect(Number(pieces[1])).toBe(Math.floor(fixedNow / 1000) + 30)
    const hash = createHash('sha256').update(issuer).update('\0').update(subject).digest('hex')
    expect(pieces[2]).toBe('zitadel:' + hash)
    expect(pieces[3]).toBe('execute')
    const payload = pieces.slice(0, 4).join('.')
    expect(pieces[4]).toBe(createHmac('sha256', secret).update(payload).digest('hex'))
    expect(signRrActor(issuer, subject, 'replan', secret, fixedNow)).not.toBe(assertion)
    expect(signRrActor(issuer, 'someone-else', 'execute', secret, fixedNow)).not.toBe(assertion)
  })

  it('refuses invalid issuer, missing subject and an absent signing secret', () => {
    expect(() => signRrActor('http://invalid.local', subject, 'execute', secret)).toThrow()
    expect(() => signRrActor(issuer, '', 'execute', secret)).toThrow()
    expect(() => signRrActor(issuer, subject, 'execute', 'short')).toThrow()
  })
})
