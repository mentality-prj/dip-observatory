import { describe, it, expect } from 'vitest'
import {
  parseRRViewPreferences,
  readRRViewPreferences,
  saveRRViewPreferences,
  templatePreferences,
  toggleRRWidget,
  RR_VIEW_PREFERENCE_KEY,
} from './view-preferences'

describe('safe RR view personalization', () => {
  it('accepts only versioned presentation fields', () => {
    const sample = { version: 1, template: 'ANALYST', density: 'COMPACT', widgets: ['EVIDENCE'] }
    expect(parseRRViewPreferences(sample)).toEqual(sample)
    for (const bad of [
      { ...sample, accessToken: 's3cr3t' },
      { ...sample, scenarioId: 'private' },
      { ...sample, widgets: ['UNKNOWN'] },
      { ...sample, version: 2 },
      { ...sample, widgets: ['EVIDENCE', 'private-result'] },
    ])
      expect(parseRRViewPreferences(bad).template).toBe('BUSINESS')
  })
  it('uses safe fallback for malformed storage and quota failures', () => {
    const storage = {
      getItem: () => '{invalid',
      setItem: () => {
        throw Error('quota')
      },
    }
    expect(readRRViewPreferences(storage).template).toBe('BUSINESS')
    expect(saveRRViewPreferences(storage, templatePreferences('ANALYST'))).toBe(false)
  })
  it('persists a normalized presentation-only JSON payload', () => {
    let raw = ''
    const storage = {
      getItem: () => raw,
      setItem: (k: string, v: string) => {
        expect(k).toBe(RR_VIEW_PREFERENCE_KEY)
        raw = v
      },
    }
    const view = toggleRRWidget(templatePreferences('BUSINESS'), 'EVIDENCE')
    expect(saveRRViewPreferences(storage, view)).toBe(true)
    expect(readRRViewPreferences(storage)).toEqual(view)
    expect(raw).not.toContain('scenarioId')
  })
  it('resets invalid widget lists, and copies templates defensively', () => {
    const template = templatePreferences('BUSINESS')
    template.widgets.pop()
    expect(templatePreferences('BUSINESS').widgets).toContain('DECISION_SUMMARY')
    expect(
      parseRRViewPreferences({ version: 1, template: 'ANALYST', density: 'COMPACT', widgets: [42] }).template
    ).toBe('BUSINESS')
  })
})
