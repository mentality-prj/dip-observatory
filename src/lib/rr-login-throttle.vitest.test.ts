import { afterEach, describe, expect, it } from 'vitest'
import { loginAllowed, loginRejected, loginSucceeded, resetForTest } from './rr-login-throttle'

afterEach(() => resetForTest())

describe('reference operator password attempt throttle', () => {
  it('temporarily locks out after five failed attempts and later resets', () => {
    const start = 1_800_000_000_000
    for (let i = 0; i < 5; i++) {
      expect(loginAllowed(start + i)).toBe(true)
      loginRejected(start + i)
    }
    expect(loginAllowed(start + 1000)).toBe(false)
    expect(loginAllowed(start + 14 * 60_000)).toBe(false)
    expect(loginAllowed(start + 16 * 60_000)).toBe(true)
  })

  it('resets the reference throttle after a valid login', () => {
    const start = 1_800_000_000_000
    loginRejected(start)
    loginSucceeded()
    expect(loginAllowed(start + 100)).toBe(true)
  })
})
