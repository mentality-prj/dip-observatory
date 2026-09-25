import { LOCALE_TAGS, type Locale } from '@/i18n/config'
import { rawMessage } from '@/i18n/runtime'

export function getDecisionChallengeI18n(locale: Locale) {
  return rawMessage<Record<string, unknown>>(locale, 'decisionChallenge')
}

export function getDecisionChallengeMetadataI18n(locale: Locale) {
  return rawMessage<{ title: string; description: string }>(locale, 'decisionChallenge.metadata')
}

export function formatChallengeMoney(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
