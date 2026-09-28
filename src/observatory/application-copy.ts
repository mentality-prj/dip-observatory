import type { Locale } from '@/lib/observatory-i18n'

type Copy = { title: string; description: string; tag: string; pattern: string }
const copy: Record<Locale, Record<'decision-challenge' | 'decision-intake', Copy>> = {
  en: {
    'decision-challenge': {
      title: 'Decision Challenge',
      description: 'Make the decision yourself, then compare it with QDIP under the same information and economic evaluation model.',
      tag: 'INTERACTIVE',
      pattern: 'COMPARE',
    },
    'decision-intake': {
      title: 'Decision Intake',
      description: 'Upload operational data, verify the inferred business semantics and turn the dataset into a DecisionContract for QDIP.',
      tag: 'DATA INTAKE',
      pattern: 'FRAME',
    },
  },
  uk: {
    'decision-challenge': {
      title: 'Виклик рішень',
      description: 'Прийміть рішення самостійно, а потім порівняйте його з QDIP за однакової інформації та моделі економічної оцінки.',
      tag: 'ІНТЕРАКТИВ',
      pattern: 'ПОРІВНЯННЯ',
    },
    'decision-intake': {
      title: 'Підготовка рішення',
      description: 'Завантажте операційні дані, перевірте визначену семантику бізнесу та сформуйте DecisionContract для QDIP.',
      tag: 'ВХІДНІ ДАНІ',
      pattern: 'ФОРМУВАННЯ',
    },
  },
  pl: {
    'decision-challenge': {
      title: 'Wyzwanie decyzyjne',
      description: 'Podejmij decyzję samodzielnie, a następnie porównaj ją z QDIP przy tej samej informacji i modelu oceny ekonomicznej.',
      tag: 'INTERAKTYWNE',
      pattern: 'PORÓWNANIE',
    },
    'decision-intake': {
      title: 'Przygotowanie decyzji',
      description: 'Prześlij dane operacyjne, zweryfikuj rozpoznaną semantykę biznesową i utwórz DecisionContract dla QDIP.',
      tag: 'DANE WEJŚCIOWE',
      pattern: 'FORMUŁOWANIE',
    },
  },
}
export function systemApplicationCopy(locale: Locale, id: 'decision-challenge' | 'decision-intake') {
  return copy[locale][id]
}
