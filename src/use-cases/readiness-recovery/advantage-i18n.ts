import type { Locale } from '@/lib/observatory-i18n'

export const readinessAdvantageI18n: Record<
  Locale,
  {
    eyebrow: string
    title: string
    body: string
    probabilityDelta: string
    readinessDelta: string
    shortfallReduction: string
    qdip: string
    baseline: string
    pathway: string
    pathwayDetected: string
    noMaterialAdvantage: string
  }
> = {
  en: {
    eyebrow: 'QDIP ADVANTAGE',
    title: 'What QDIP found that the heuristics missed',
    body: 'The strongest evaluated nondominated scenario is compared with the strongest FIFO, criticality or greedy baseline under the same input uncertainty assumptions.',
    probabilityDelta: 'Demand-satisfaction delta',
    readinessDelta: 'Readiness delta',
    shortfallReduction: 'Shortfall reduction',
    qdip: 'QDIP scenario',
    baseline: 'Best heuristic',
    pathway: 'Non-obvious recovery path',
    pathwayDetected: 'Cannibalize one donor asset to unlock two capability-critical repairs.',
    noMaterialAdvantage: 'No material advantage over the strongest heuristic is demonstrated in this scenario.',
  },
  uk: {
    eyebrow: 'ПЕРЕВАГА QDIP',
    title: 'Що QDIP знайшов, а евристики пропустили',
    body: 'Найсильніший оцінений недомінований сценарій порівнюється з найсильнішим варіантом FIFO, критичності або жадібної евристики за однакових вхідних припущень щодо невизначеності.',
    probabilityDelta: 'Приріст ймовірності виконання потреби',
    readinessDelta: 'Приріст готовності',
    shortfallReduction: 'Зменшення дефіциту',
    qdip: 'Сценарій QDIP',
    baseline: 'Найкраща евристика',
    pathway: 'Неочевидний шлях відновлення',
    pathwayDetected: 'Канібалізувати один донорський актив, щоб відкрити два ремонти, критичні для спроможності.',
    noMaterialAdvantage: 'У цьому сценарії суттєва перевага над найсильнішою евристикою не продемонстрована.',
  },
  pl: {
    eyebrow: 'PRZEWAGA QDIP',
    title: 'Co QDIP znalazł, a heurystyki pominęły',
    body: 'Najsilniejszy oceniony scenariusz niezdominowany jest porównywany z najlepszym wariantem FIFO, krytyczności lub heurystyki zachłannej przy tych samych wejściowych założeniach dotyczących niepewności.',
    probabilityDelta: 'Zmiana prawdopodobieństwa pokrycia potrzeb',
    readinessDelta: 'Zmiana gotowości',
    shortfallReduction: 'Zmniejszenie niedoboru',
    qdip: 'Scenariusz QDIP',
    baseline: 'Najlepsza heurystyka',
    pathway: 'Nieoczywista ścieżka odtworzenia',
    pathwayDetected: 'Kanibalizacja jednego aktywa-dawcy odblokowuje dwie naprawy krytyczne dla zdolności.',
    noMaterialAdvantage: 'W tym scenariuszu nie wykazano istotnej przewagi nad najsilniejszą heurystyką.',
  },
}
