import { describe, expect, it } from 'vitest'
import { PLATFORM_ORIGINS } from '@/routing-config'
import { PLATFORM_SURFACES, surfacePath } from './platform-routing'
import { marketingHref, marketingLocaleHref, observatoryHref, studioHref, studioSurfaceHref } from './platform-urls'

describe('platform routing URLs', () => {
  it('uses one canonical localized path shape on every surface', () => {
    expect(surfacePath('en')).toBe('/en')
    expect(surfacePath('uk', 'profiles')).toBe('/uk/profiles')
    expect(surfacePath('pl', '/profiles/example/dimensions/')).toBe('/pl/profiles/example/dimensions')

    expect(studioSurfaceHref('', 'en')).toBe('/en')
    expect(studioSurfaceHref('profiles', 'uk')).toBe('/uk/profiles')
    expect(marketingLocaleHref('pl')).toBe('/pl')
  })

  it('keeps cross-surface URLs absolute and canonical', () => {
    expect(marketingHref('uk')).toBe(`${PLATFORM_ORIGINS.site}/uk`)
    expect(studioHref('', 'en')).toBe(`${PLATFORM_ORIGINS.studio}/en`)
    expect(studioHref('profiles', 'pl')).toBe(`${PLATFORM_ORIGINS.studio}/pl/profiles`)
    expect(observatoryHref('resource-allocation', 'uk')).toBe(`${PLATFORM_ORIGINS.observatory}/uk/resource-allocation`)
  })

  it('localizes Observatory routes without duplicating locale segments or dropping query strings', () => {
    expect(observatoryHref('pl/gtm-lab')).toBe(`${PLATFORM_ORIGINS.observatory}/pl/gtm-lab`)
    expect(observatoryHref('uk/decisions?decision=abc', 'uk')).toBe(
      `${PLATFORM_ORIGINS.observatory}/uk/decisions?decision=abc`
    )
  })

  it('keeps compatibility surface origins aligned with the declarative routing config', () => {
    expect(PLATFORM_SURFACES.site.origin).toBe(PLATFORM_ORIGINS.site)
    expect(PLATFORM_SURFACES.studio.origin).toBe(PLATFORM_ORIGINS.studio)
    expect(PLATFORM_SURFACES.observatory.origin).toBe(PLATFORM_ORIGINS.observatory)
  })
})
