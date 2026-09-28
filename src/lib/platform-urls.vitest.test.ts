import { describe, expect, it } from 'vitest'
import { observatoryHref, studioHref, studioSurfaceHref } from './platform-urls'

describe('platform URLs', () => {
  it('localizes Observatory routes without duplicating locale segments', () => {
    expect(observatoryHref('resource-allocation', 'uk')).toBe('https://observatory.qdip.ai/uk/resource-allocation')
    expect(observatoryHref('pl/gtm-lab')).toBe('https://observatory.qdip.ai/pl/gtm-lab')
    expect(observatoryHref('uk/decisions?decision=abc', 'uk')).toBe(
      'https://observatory.qdip.ai/uk/decisions?decision=abc'
    )
  })

  it('keeps Studio cross-surface URLs absolute and canonical', () => {
    expect(studioHref('', 'en')).toBe('https://studio.qdip.ai/en')
    expect(studioHref('', 'uk')).toBe('https://studio.qdip.ai/uk')
    expect(studioHref('profiles', 'pl')).toBe('https://studio.qdip.ai/pl/profiles')
  })

  it('keeps Studio same-surface URLs relative to the current Studio host', () => {
    expect(studioSurfaceHref('', 'en')).toBe('/en')
    expect(studioSurfaceHref('profiles', 'uk')).toBe('/uk/profiles')
    expect(studioSurfaceHref('profiles/example/dimensions', 'pl')).toBe('/pl/profiles/example/dimensions')
  })
})
