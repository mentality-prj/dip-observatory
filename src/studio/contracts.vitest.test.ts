import { describe, expect, it } from 'vitest'
import { pluginIdentity, type Plugin } from './contracts'

const plugin: Plugin = {
  id: 'readiness-recovery',
  name: 'Readiness Recovery',
  version: '1.0.0',
  enabled: true,
  capabilities: [],
  capability_versions: {},
  dimension_outputs: [],
  dimension_bindings: [],
  ui: {},
}

describe('pluginIdentity', () => {
  it('uses the route-safe plugin id instead of the display name', () => {
    expect(pluginIdentity(plugin)).toBe('readiness-recovery')
  })

  it('falls back to name for older plugin metadata', () => {
    expect(pluginIdentity({ ...plugin, id: undefined })).toBe('Readiness Recovery')
  })
})
