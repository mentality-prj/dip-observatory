import type { Locale } from '@/lib/observatory-i18n'

export type I18nNamespace = 'marketing' | 'observatory' | 'studio' | 'shared' | 'useCases'
export type Localized<T> = Record<Locale, T>

export const sharedI18n = {
  en: {
    language: 'Language',
    home: 'QDIP home',
    primaryNavigation: 'Primary navigation',
    mobileNavigation: 'Mobile navigation',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    products: 'QDIP products',
    footerNavigation: 'Footer navigation',
    breadcrumb: 'Breadcrumb',
  },
  uk: {
    language: 'Мова',
    home: 'Головна QDIP',
    primaryNavigation: 'Основна навігація',
    mobileNavigation: 'Мобільна навігація',
    openNavigation: 'Відкрити навігацію',
    closeNavigation: 'Закрити навігацію',
    products: 'Продукти QDIP',
    footerNavigation: 'Навігація у футері',
    breadcrumb: 'Навігаційний ланцюжок',
  },
  pl: {
    language: 'Język',
    home: 'Strona główna QDIP',
    primaryNavigation: 'Nawigacja główna',
    mobileNavigation: 'Nawigacja mobilna',
    openNavigation: 'Otwórz nawigację',
    closeNavigation: 'Zamknij nawigację',
    products: 'Produkty QDIP',
    footerNavigation: 'Nawigacja w stopce',
    breadcrumb: 'Ścieżka nawigacyjna',
  },
} as const satisfies Localized<Record<string, string>>

export const observatoryI18n = {
  en: { applications: 'Observatory applications', mobileApplications: 'Applications' },
  uk: { applications: 'Застосунки Observatory', mobileApplications: 'Застосунки' },
  pl: { applications: 'Aplikacje Observatory', mobileApplications: 'Aplikacje' },
} as const satisfies Localized<Record<string, string>>

export const marketingA11yI18n = {
  en: { evidence: 'QDIP evidence and trust', technicalEvidence: 'Technical evidence' },
  uk: { evidence: 'Докази та надійність QDIP', technicalEvidence: 'Технічні докази' },
  pl: { evidence: 'Dowody i wiarygodność QDIP', technicalEvidence: 'Dowody techniczne' },
} as const satisfies Localized<Record<string, string>>
