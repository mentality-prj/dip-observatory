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
    eyebrow: 'QDIP OBSERVATORY · DECIDE',
    title: 'From operational data to a decision you can inspect.',
    subtitle:
      'Explore how QDIP frames a decision, evaluates alternatives under uncertainty and constraints, explains the recommendation, and keeps the result open to human review.',
    challengeCta: 'Try Decision Challenge',
    intakeCta: 'Bring your data',
    inspect: 'What every QDIP decision makes visible',
    inspectBody:
      'The Observatory is not a single domain demo. It is the inspection surface for the decision process across QDIP applications.',
    questions: [
      ['What should we do?', 'See the recommended action and the alternatives that remained feasible.'],
      ['Why?', 'Inspect expected effects, evidence, costs, constraints and trade-offs.'],
      ['How uncertain is it?', 'See where the decision depends on uncertain information and changing scenarios.'],
      ['What happened next?', 'Connect decisions to observed outcomes so future decisions can be calibrated.'],
    ],
    demos: 'Explore QDIP',
    demosBody:
      'Start with your own judgment, bring operational data, or open a working decision application. Each path exposes a different part of the same decision engine.',
    open: 'Open application',
    note: 'AI may help interpret the problem. Human verification establishes the business meaning. QDIP evaluates the decision. Evidence and observed outcomes show what the recommendation was based on and what happened next.',
  },
  uk: {
    eyebrow: 'QDIP OBSERVATORY · РІШЕННЯ',
    title: 'Від операційних даних до рішення, яке можна перевірити.',
    subtitle:
      'Дослідіть, як QDIP формулює задачу, оцінює альтернативи за невизначеності та обмежень, пояснює рекомендацію й залишає результат під контролем людини.',
    challengeCta: 'Спробувати Виклик рішень',
    intakeCta: 'Завантажити свої дані',
    inspect: 'Що робить видимим кожне рішення QDIP',
    inspectBody:
      'Observatory — не демо одного домену. Це простір для перевірки процесу прийняття рішень у різних застосунках QDIP.',
    questions: [
      ['Що робити?', 'Побачте рекомендовану дію та альтернативи, які залишилися допустимими.'],
      ['Чому?', 'Перевірте очікуваний ефект, докази, вартість, обмеження й компроміси.'],
      ['Наскільки це невизначено?', 'Побачте, де рішення залежить від невизначеної інформації та зміни сценарію.'],
      ['Що сталося потім?', 'Пов’язуйте рішення зі спостережуваними результатами, щоб калібрувати наступні рішення.'],
    ],
    demos: 'Дослідіть QDIP',
    demosBody:
      'Почніть із власного рішення, завантажте операційні дані або відкрийте робочий застосунок. Кожен шлях показує іншу частину того самого рушія рішень.',
    open: 'Відкрити застосунок',
    note: 'ШІ може допомогти інтерпретувати задачу. Людина підтверджує бізнес-семантику. QDIP оцінює рішення. Докази та спостережувані результати показують, на чому ґрунтувалася рекомендація і що сталося після неї.',
  },
  pl: {
    eyebrow: 'QDIP OBSERVATORY · DECYZJE',
    title: 'Od danych operacyjnych do decyzji, którą można zweryfikować.',
    subtitle:
      'Zobacz, jak QDIP formułuje problem, ocenia alternatywy przy niepewności i ograniczeniach, wyjaśnia rekomendację i pozostawia wynik pod kontrolą człowieka.',
    challengeCta: 'Wypróbuj Wyzwanie decyzyjne',
    intakeCta: 'Prześlij swoje dane',
    inspect: 'Co ujawnia każda decyzja QDIP',
    inspectBody:
      'Observatory nie jest demonstracją jednej domeny. To przestrzeń do weryfikacji procesu decyzyjnego w różnych aplikacjach QDIP.',
    questions: [
      ['Co zrobić?', 'Zobacz rekomendowane działanie i alternatywy, które pozostały wykonalne.'],
      ['Dlaczego?', 'Sprawdź oczekiwany efekt, dowody, koszty, ograniczenia i kompromisy.'],
      ['Jak duża jest niepewność?', 'Zobacz, gdzie decyzja zależy od niepewnych informacji i zmian scenariusza.'],
      ['Co wydarzyło się później?', 'Łącz decyzje z obserwowanymi wynikami, aby kalibrować kolejne decyzje.'],
    ],
    demos: 'Poznaj QDIP',
    demosBody:
      'Zacznij od własnej decyzji, prześlij dane operacyjne albo otwórz działającą aplikację. Każda ścieżka pokazuje inną część tego samego silnika decyzyjnego.',
    open: 'Otwórz aplikację',
    note: 'AI może pomóc zinterpretować problem. Człowiek potwierdza znaczenie biznesowe. QDIP ocenia decyzję. Dowody i obserwowane wyniki pokazują, na czym opierała się rekomendacja i co wydarzyło się później.',
  },
} as const

export const observatoryDecisionNarrativeI18n = {
  en: {
    labels: ['Situation', 'Alternatives', 'Evaluation', 'Risk / uncertainty', 'Recommendation', 'Evidence', 'Trace'],
    helper: 'One inspection grammar across every QDIP application.',
    ariaLabel: 'Decision narrative',
  },
  uk: {
    labels: [
      'Ситуація',
      'Альтернативи',
      'Оцінювання',
      'Ризик / невизначеність',
      'Рекомендація',
      'Докази',
      'Історія рішення',
    ],
    helper: 'Одна логіка перевірки для кожного застосунку QDIP.',
    ariaLabel: 'Логіка рішення',
  },
  pl: {
    labels: ['Sytuacja', 'Alternatywy', 'Ocena', 'Ryzyko / niepewność', 'Rekomendacja', 'Dowody', 'Ślad decyzji'],
    helper: 'Jedna logika weryfikacji dla każdej aplikacji QDIP.',
    ariaLabel: 'Logika decyzji',
  },
} as const
