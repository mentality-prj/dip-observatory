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

export const localeLabels: Localized<string> = {
  en: 'EN',
  uk: 'UA',
  pl: 'PL',
}

export const observatoryI18n = {
  en: {
    applications: 'Observatory applications',
    mobileApplications: 'Applications',
    challenge: 'Decision Challenge',
    openStudio: 'Open Studio',
  },
  uk: {
    applications: 'Застосунки Observatory',
    mobileApplications: 'Застосунки',
    challenge: 'Виклик рішень',
    openStudio: 'Відкрити Studio',
  },
  pl: {
    applications: 'Aplikacje Observatory',
    mobileApplications: 'Aplikacje',
    challenge: 'Wyzwanie decyzyjne',
    openStudio: 'Otwórz Studio',
  },
} as const satisfies Localized<Record<string, string>>

export const marketingA11yI18n = {
  en: { evidence: 'QDIP evidence and trust', technicalEvidence: 'Technical evidence' },
  uk: { evidence: 'Докази та надійність QDIP', technicalEvidence: 'Технічні докази' },
  pl: { evidence: 'Dowody i wiarygodność QDIP', technicalEvidence: 'Dowody techniczne' },
} as const satisfies Localized<Record<string, string>>


export const footerI18n = {
  en: {
    how: 'How it works',
    useCases: 'Use cases',
    core: 'QDIP Core',
    research: 'Research',
    disclaimer: 'Your team makes the final decision.',
  },
  uk: {
    how: 'Як це працює',
    useCases: 'Сценарії',
    core: 'QDIP Core',
    research: 'Дослідження',
    disclaimer: 'Остаточне рішення приймає ваша команда.',
  },
  pl: {
    how: 'Jak to działa',
    useCases: 'Przypadki użycia',
    core: 'QDIP Core',
    research: 'Badania',
    disclaimer: 'Ostateczną decyzję podejmuje Twój zespół.',
  },
} as const satisfies Localized<Record<string, string>>


export const observatoryHomeI18n = {
  en: {
    eyebrow: 'QDIP OBSERVATORY · UNDERSTAND',
    title: 'Understand the recommendation, not just the output.',
    subtitle:
      'Observatory is the inspection surface for QDIP decisions. Every application follows the same narrative: recommendation first, then alternatives, evidence and trace.',
    inspectLabel: 'Resource Allocation · decision preview',
    recommendation: 'Recommendation',
    recommended: 'Recommended allocation plan',
    confidence: 'Generated from the configured scenario and operational constraints',
    recommendedLabel: 'QDIP recommendation',
    evidence: 'Evidence',
    evidenceItems: ['Capacity and skill constraints checked', 'Priority coverage compared', 'Team movements and trade-offs exposed'],
    alternatives: 'Alternatives',
    alternativeItems: [
      ['Current allocation', 'Keep the existing team placement'],
      ['Manual override', 'Responsible person changes the proposed plan'],
    ],
    trace: 'Open decision trace',
    traceBody:
      'Needs and available teams → feasible allocations → constraint checks → priority evaluation → recommended allocation.',
    previewCta: 'Open Resource Allocation',
    demos: 'Live decision applications',
    demosBody:
      'Different domains, the same inspection grammar. Open an application to examine a real recommendation and the evidence behind it.',
    open: 'Inspect decision',
    inspect: 'The four questions Observatory should answer',
    questions: [
      ['What is recommended?', 'See the selected action and viable alternatives.'],
      ['Why?', 'Inspect evidence, priorities, constraints and trade-offs.'],
      ['What changed?', 'Compare the state and scenario that produced a different result.'],
      ['What would change it?', 'Explore which constraints or evidence can move the recommendation.'],
    ],
    note: 'Demos are preconfigured decision applications. Studio configures the decision model; QDIP Core evaluates it; Observatory makes the result inspectable.',
  },
  uk: {
    eyebrow: 'QDIP OBSERVATORY · ПЕРЕВІРКА РІШЕНЬ',
    title: 'Перевіряйте не лише результат, а й обґрунтування рекомендації.',
    subtitle:
      'Observatory — простір для перевірки рішень QDIP. У кожному застосунку ви бачите рекомендацію, альтернативи, докази та історію рішення.',
    inspectLabel: 'Розподіл ресурсів · попередній перегляд рішення',
    recommendation: 'Рекомендація',
    recommended: 'Рекомендований план розподілу',
    confidence: 'Сформовано з налаштованого сценарію та операційних обмежень',
    recommendedLabel: 'Рекомендація QDIP',
    evidence: 'Докази',
    evidenceItems: ['Перевірено обмеження спроможності та навичок', 'Порівняно покриття пріоритетних потреб', 'Показано переміщення команд і компроміси'],
    alternatives: 'Альтернативи',
    alternativeItems: [
      ['Поточний розподіл', 'Зберегти поточне розміщення команд'],
      ['Ручне коригування', 'Відповідальна людина змінює запропонований план'],
    ],
    trace: 'Відкрити історію рішення',
    traceBody:
      'Потреби й доступні команди → допустимі розподіли → перевірка обмежень → оцінка пріоритетів → рекомендований розподіл.',
    previewCta: 'Відкрити Resource Allocation',
    demos: 'Діючі застосунки для прийняття рішень',
    demosBody:
      'Різні домени, однакова логіка перевірки. Відкрийте застосунок, щоб дослідити реальну рекомендацію та докази.',
    open: 'Дослідити рішення',
    inspect: 'Чотири питання, на які має відповідати Observatory',
    questions: [
      ['Що рекомендовано?', 'Побачте обрану дію та допустимі альтернативи.'],
      ['Чому?', 'Перевірте докази, пріоритети, обмеження й компроміси.'],
      ['Що змінилося?', 'Порівняйте стан і сценарій, які привели до іншого результату.'],
      ['Що змінить рішення?', 'Дослідіть, які обмеження або докази можуть змінити рекомендацію.'],
    ],
    note: 'Демо — попередньо налаштовані застосунки для рішень. Studio конфігурує модель рішення, QDIP Core її оцінює, а Observatory робить результат доступним для перевірки.',
  },
  pl: {
    eyebrow: 'QDIP OBSERVATORY · WERYFIKACJA DECYZJI',
    title: 'Sprawdzaj nie tylko wynik, ale też uzasadnienie rekomendacji.',
    subtitle:
      'Observatory to przestrzeń do weryfikacji decyzji QDIP. W każdej aplikacji zobaczysz rekomendację, alternatywy, dowody i ślad decyzji.',
    inspectLabel: 'Alokacja zasobów · podgląd decyzji',
    recommendation: 'Rekomendacja',
    recommended: 'Rekomendowany plan alokacji',
    confidence: 'Wygenerowany z konfiguracji scenariusza i ograniczeń operacyjnych',
    recommendedLabel: 'Rekomendacja QDIP',
    evidence: 'Dowody',
    evidenceItems: ['Sprawdzono ograniczenia pojemności i kompetencji', 'Porównano pokrycie potrzeb priorytetowych', 'Pokazano przeniesienia zespołów i kompromisy'],
    alternatives: 'Alternatywy',
    alternativeItems: [
      ['Bieżąca alokacja', 'Zachowaj obecne rozmieszczenie zespołów'],
      ['Ręczne nadpisanie', 'Osoba odpowiedzialna zmienia proponowany plan'],
    ],
    trace: 'Otwórz ślad decyzji',
    traceBody:
      'Potrzeby i dostępne zespoły → wykonalne alokacje → kontrola ograniczeń → ocena priorytetów → rekomendowany przydział.',
    previewCta: 'Otwórz Resource Allocation',
    demos: 'Działające aplikacje decyzyjne',
    demosBody:
      'Różne domeny, ta sama logika weryfikacji. Otwórz aplikację, aby przeanalizować rzeczywistą rekomendację i stojące za nią dowody.',
    open: 'Przeanalizuj decyzję',
    inspect: 'Cztery pytania, na które powinno odpowiadać Observatory',
    questions: [
      ['Co jest rekomendowane?', 'Zobacz wybrane działanie i wykonalne alternatywy.'],
      ['Dlaczego?', 'Sprawdź dowody, priorytety, ograniczenia i kompromisy.'],
      ['Co się zmieniło?', 'Porównaj stan i scenariusz, które doprowadziły do innego wyniku.'],
      ['Co zmieni decyzję?', 'Sprawdź, które ograniczenia lub dowody mogą zmienić rekomendację.'],
    ],
    note: 'Dema są wstępnie skonfigurowanymi aplikacjami decyzyjnymi. Studio konfiguruje model, QDIP Core go ocenia, a Observatory udostępnia wynik do inspekcji.',
  },
} as const
