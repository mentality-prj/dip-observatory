import type { Locale } from '@/lib/observatory-i18n'

export type DecisionStageId = 'context' | 'alternatives' | 'evaluation' | 'recommendation'
export type DecisionPatternId = 'allocate' | 'decide' | 'prioritize'
export type ProductSurfaceId = 'demo' | 'studio' | 'core' | 'observatory'
type Localized<T> = Record<Locale, T>

export type DecisionPatternDefinition = {
  id: DecisionPatternId
  inputs: Localized<readonly string[]>
  output: Localized<string>
}

export const DECISION_PATTERNS: Record<DecisionPatternId, DecisionPatternDefinition> = {
  allocate: {
    id: 'allocate',
    inputs: {
      en: ['Needs', 'Resources', 'Priorities', 'Constraints'],
      uk: ['Потреби', 'Ресурси', 'Пріоритети', 'Обмеження'],
      pl: ['Potrzeby', 'Zasoby', 'Priorytety', 'Ograniczenia'],
    },
    output: { en: 'Recommended allocation', uk: 'Рекомендований розподіл', pl: 'Rekomendowany przydział' },
  },
  decide: {
    id: 'decide',
    inputs: {
      en: ['Current state', 'Actions', 'Expected effects', 'Uncertainty'],
      uk: ['Поточний стан', 'Дії', 'Очікувані ефекти', 'Невизначеність'],
      pl: ['Stan bieżący', 'Działania', 'Oczekiwane efekty', 'Niepewność'],
    },
    output: { en: 'Recommended action', uk: 'Рекомендована дія', pl: 'Rekomendowane działanie' },
  },
  prioritize: {
    id: 'prioritize',
    inputs: {
      en: ['Opportunities', 'Objectives', 'Costs', 'Evidence'],
      uk: ['Можливості', 'Цілі', 'Витрати', 'Обґрунтування'],
      pl: ['Szanse', 'Cele', 'Koszty', 'Uzasadnienie'],
    },
    output: { en: 'Recommended priority', uk: 'Рекомендований пріоритет', pl: 'Rekomendowany priorytet' },
  },
}

export const DECISION_PATTERN_LABELS: Record<DecisionPatternId, Localized<string>> = {
  allocate: { en: 'ALLOCATE', uk: 'РОЗПОДІЛ', pl: 'ALOKACJA' },
  decide: { en: 'DECIDE', uk: 'ВИБІР ДІЇ', pl: 'WYBÓR DZIAŁANIA' },
  prioritize: { en: 'PRIORITIZE', uk: 'ПРІОРИТЕТИ', pl: 'PRIORYTETY' },
}

export const decisionPattern = (id: DecisionPatternId) => DECISION_PATTERNS[id]
export const decisionPatternLabel = (id: DecisionPatternId, locale: Locale) => DECISION_PATTERN_LABELS[id][locale]

export const DECISION_WORKFLOW_COPY: Record<Locale, readonly { id: DecisionStageId; label: string; detail: string }[]> =
  {
    en: [
      { id: 'context', label: 'Context', detail: 'Evidence · priorities · constraints' },
      { id: 'alternatives', label: 'Alternatives', detail: 'Feasible actions' },
      { id: 'evaluation', label: 'Evaluation', detail: 'Effects · uncertainty · trade-offs' },
      { id: 'recommendation', label: 'Recommendation', detail: 'Why · human decision' },
    ],
    uk: [
      { id: 'context', label: 'Контекст', detail: 'Докази · пріоритети · обмеження' },
      { id: 'alternatives', label: 'Альтернативи', detail: 'Допустимі дії' },
      { id: 'evaluation', label: 'Оцінювання', detail: 'Ефекти · невизначеність · компроміси' },
      { id: 'recommendation', label: 'Рекомендація', detail: 'Чому · рішення людини' },
    ],
    pl: [
      { id: 'context', label: 'Kontekst', detail: 'Dowody · priorytety · ograniczenia' },
      { id: 'alternatives', label: 'Alternatywy', detail: 'Wykonalne działania' },
      { id: 'evaluation', label: 'Ocena', detail: 'Efekty · niepewność · kompromisy' },
      { id: 'recommendation', label: 'Rekomendacja', detail: 'Dlaczego · decyzja człowieka' },
    ],
  }

export const PRODUCT_SURFACE_COPY: Record<
  Locale,
  readonly { id: ProductSurfaceId; verb: string; title: string; body: string; cta: string }[]
> = {
  en: [
    {
      id: 'demo',
      verb: 'TRY',
      title: 'Decision demos',
      body: 'Start with a working decision pattern and change a real constraint.',
      cta: 'Try a demo',
    },
    {
      id: 'studio',
      verb: 'CONFIGURE',
      title: 'QDIP Studio',
      body: 'Model alternatives, priorities, evidence, rules and constraints.',
      cta: 'Open Studio',
    },
    {
      id: 'core',
      verb: 'EVALUATE',
      title: 'QDIP Core',
      body: 'Evaluate the configured decision consistently through one governed engine.',
      cta: 'Explore Core',
    },
    {
      id: 'observatory',
      verb: 'UNDERSTAND',
      title: 'QDIP Observatory',
      body: 'Inspect the recommendation, alternatives, evidence and what changed.',
      cta: 'Open Observatory',
    },
  ],
  uk: [
    {
      id: 'demo',
      verb: 'СПРОБУВАТИ',
      title: 'Демонстраційні рішення',
      body: 'Почніть із готової моделі рішення та змініть реальне обмеження.',
      cta: 'Спробувати демо',
    },
    {
      id: 'studio',
      verb: 'НАЛАШТУВАТИ',
      title: 'QDIP Studio',
      body: 'Опишіть альтернативи, пріоритети, докази, правила та обмеження.',
      cta: 'Відкрити Studio',
    },
    {
      id: 'core',
      verb: 'ОЦІНИТИ',
      title: 'QDIP Core',
      body: 'Послідовно оцінюйте налаштоване рішення через один керований рушій.',
      cta: 'Дослідити Core',
    },
    {
      id: 'observatory',
      verb: 'ПЕРЕВІРКА',
      title: 'QDIP Observatory',
      body: 'Перевірте рекомендацію, альтернативи, докази та те, що змінилося.',
      cta: 'Відкрити Observatory',
    },
  ],
  pl: [
    {
      id: 'demo',
      verb: 'SPRAWDŹ',
      title: 'Dema decyzyjne',
      body: 'Zacznij od gotowego modelu decyzyjnego i zmień rzeczywiste ograniczenie.',
      cta: 'Wypróbuj demo',
    },
    {
      id: 'studio',
      verb: 'KONFIGURUJ',
      title: 'QDIP Studio',
      body: 'Modeluj alternatywy, priorytety, dowody, reguły i ograniczenia.',
      cta: 'Otwórz Studio',
    },
    {
      id: 'core',
      verb: 'OCEŃ',
      title: 'QDIP Core',
      body: 'Oceniaj skonfigurowaną decyzję spójnie w jednym zarządzanym silniku.',
      cta: 'Poznaj Core',
    },
    {
      id: 'observatory',
      verb: 'WERYFIKACJA',
      title: 'QDIP Observatory',
      body: 'Sprawdź rekomendację, alternatywy, dowody i to, co się zmieniło.',
      cta: 'Otwórz Observatory',
    },
  ],
}
