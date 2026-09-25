import { describe, expect, it } from 'vitest'
import {
  buildLocalePath,
  detectLocaleFromHeader,
  SUPPORTED_LOCALES,
} from './observatory-i18n'

describe('Observatory locale routing', () => {
  it.each(SUPPORTED_LOCALES)('builds a canonical %s home path', (locale) => {
    expect(buildLocalePath('/', locale)).toBe(`/${locale}`)
    expect(buildLocalePath('/en', locale)).toBe(`/${locale}`)
    expect(buildLocalePath('/uk/', locale)).toBe(`/${locale}`)
  })

  it.each(SUPPORTED_LOCALES)('replaces an existing locale exactly once for %s', (locale) => {
    expect(
      buildLocalePath('/pl/supply-network-optimization', locale),
    ).toBe(`/${locale}/supply-network-optimization`)
  })

  it('preserves an unlocalized application route', () => {
    expect(
      buildLocalePath('/supply-network-optimization', 'uk'),
    ).toBe('/uk/supply-network-optimization')
  })

  it('uses the same canonical locale registry for Accept-Language detection', () => {
    expect(detectLocaleFromHeader('uk-UA,uk;q=0.9,en;q=0.8')).toBe('uk')
    expect(detectLocaleFromHeader('pl-PL,pl;q=0.9')).toBe('pl')
    expect(detectLocaleFromHeader('de-DE,de;q=0.9')).toBe('en')
  })
})
