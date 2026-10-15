import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
import { visibleUseCases, type CorePluginPublication } from './observatory-plugin-catalog'

const meta: CorePluginPublication = {
  name: 'readiness-recovery', version: '1.0', description: '', enabled: true,
  capabilities: ['operations.readiness-recovery.plan'], capability_versions: {},
  ui: {}, published: null, revision: 0, capability_id: null, published_version: null,
}

describe('public Observatory plugin projection', () => {
  it('retains existing explicit public demo allowlist before admin override', () => {
    expect(visibleUseCases([meta])).toContain('readiness-recovery')
  })
  it('unpublish hides an existing application card', () => {
    expect(visibleUseCases([{ ...meta, published: false }])).not.toContain('readiness-recovery')
  })
  it('refuses published metadata with a stale version or wrong capability', () => {
    const published = { ...meta, published: true, published_version: '1.0', capability_id: meta.capabilities[0] }
    expect(visibleUseCases([published])).toContain('readiness-recovery')
    expect(visibleUseCases([{ ...published, published_version: '2.0' }])).not.toContain('readiness-recovery')
    expect(visibleUseCases([{ ...published, capability_id: 'unknown' }])).not.toContain('readiness-recovery')
    expect(visibleUseCases([{ ...published, enabled: false }])).not.toContain('readiness-recovery')
  })
  it('does not add arbitrary plugin IDs to the compiled Observatory route registry', () => {
    expect(visibleUseCases([{ ...meta, name: 'untrusted', published: true }])).not.toContain('untrusted')
  })
})
