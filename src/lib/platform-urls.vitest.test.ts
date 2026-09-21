import { describe, expect, it } from 'vitest'
import { observatoryHref, studioHref } from './platform-urls'

describe('platform URLs', () => {
  it('localizes Observatory routes without duplicating locale segments', () => {
    expect(observatoryHref('resource-allocation', 'uk')).toBe(
      'https://observatory.qdip.ai/uk/resource-allocation'
    )
    expect(observatoryHref('pl/gtm-lab')).toBe('https://observatory.qdip.ai/pl/gtm-lab')
  })

  it('preserves Studio locale through canonical path-based routes', () => {
    expect(studioHref('', 'en')).toBe('https://studio.qdip.ai/en')
    expect(studioHref('', 'uk')).toBe('https://studio.qdip.ai/uk')
    expect(studioHref('profiles', 'pl')).toBe('https://studio.qdip.ai/pl/profiles')
  })
})
