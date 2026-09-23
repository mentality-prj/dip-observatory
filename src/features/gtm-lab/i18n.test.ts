import { describe, expect, it } from 'vitest'
import { gtmLabI18n } from './i18n'

describe('GTM Lab localization', () => {
  it('localizes the public import workflow and decision labels', () => {
    expect(gtmLabI18n.uk.import.title).toBe('Оцініть портфель потенційних клієнтів')
    expect(gtmLabI18n.uk.import.upload).toBe('Завантажити CSV')
    expect(gtmLabI18n.uk.decisions.RESEARCH).toBe('Дослідити')
    expect(gtmLabI18n.pl.import.title).toBe('Oceń portfel potencjalnych klientów')
    expect(gtmLabI18n.pl.decisions.WATCH).toBe('Obserwować')
  })
})
