import 'server-only'

// Defense in depth for the single-process reference installation, NOT a
// distributed authentication rate limit. Public production needs upstream
// distributed throttling/identity; serverless workers do not share this state.
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5
let startedAt = 0
let failures = 0
let blockedUntil = 0

export function loginAllowed(now = Date.now()) {
  if (now < blockedUntil) return false
  if (!startedAt || now - startedAt >= WINDOW_MS) {
    startedAt = now
    failures = 0
    blockedUntil = 0
  }
  return true
}

export function loginRejected(now = Date.now()) {
  if (!startedAt || now - startedAt >= WINDOW_MS) {
    startedAt = now
    failures = 0
  }
  failures++
  if (failures >= MAX_FAILURES) blockedUntil = now + WINDOW_MS
}

export function loginSucceeded() {
  startedAt = 0
  failures = 0
  blockedUntil = 0
}

export function resetForTest() {
  loginSucceeded()
}
