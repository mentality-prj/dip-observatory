import { describe, expect, it } from 'vitest'

import { assertDecisionIntakeSameOrigin, DecisionIntakeAccessError } from './access'

describe('Decision Intake mutation access', () => {
  it('allows same-origin browser mutations', () => {
    const request = new Request('https://observatory.example/api/decision-intake/session/answers', {
      headers: {
        origin: 'https://observatory.example',
        'sec-fetch-site': 'same-origin',
      },
    })

    expect(() => assertDecisionIntakeSameOrigin(request)).not.toThrow()
  })

  it('rejects cross-origin mutations', () => {
    const request = new Request('https://observatory.example/api/decision-intake/session/answers', {
      headers: {
        origin: 'https://attacker.example',
        'sec-fetch-site': 'cross-site',
      },
    })

    expect(() => assertDecisionIntakeSameOrigin(request)).toThrowError(DecisionIntakeAccessError)
  })
})
