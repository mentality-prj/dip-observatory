export const QDIP_SITE_URL = 'https://qdip.ai'
export const QDIP_LOCALES = ['en', 'uk', 'pl'] as const
export const QDIP_OG_LOCALE = { en: 'en_US', uk: 'uk_UA', pl: 'pl_PL' } as const
export const QDIP_DEFAULT_LOCALE = 'en' as const
export const qdipLocaleUrl = (locale: string, path = '') => `${QDIP_SITE_URL}/${locale}${path ? `/${path}` : ''}`
