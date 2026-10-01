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
    title: 'Measured QDIP advantage over the strongest heuristic',
    body: 'The strongest evaluated nondominated scenario is compared with the strongest FIFO, criticality or greedy baseline under the same input uncertainty assumptions.',
    probabilityDelta: 'Demand-satisfaction delta',
    readinessDelta: 'Readiness delta',
    shortfallReduction: 'Shortfall reduction',
    qdip: 'QDIP scenario',
    baseline: 'Best heuristic',
    pathway: 'Efficient recovery path',
    pathwayDetected: 'The selected plan uses the donor-dependent repair chain as part of its measured efficiency advantage; the same action space is available to the heuristics.',
    noMaterialAdvantage: 'No material advantage over the strongest heuristic is demonstrated in this scenario.',
  },
  uk: {
    eyebrow: 'ПЕРЕВАГА QDIP',
    title: 'Виміряна перевага QDIP над найсильнішою евристикою',
    body: 'Найсильніший оцінений недомінований сценарій порівнюється з найсильнішим варіантом FIFO, критичності або жадібної евристики за однакових вхідних припущень щодо невизначеності.',
    probabilityDelta: 'Приріст ймовірності виконання потреби',
    readinessDelta: 'Приріст готовності',
    shortfallReduction: 'Зменшення дефіциту',
    qdip: 'Сценарій QDIP',
    baseline: 'Найкраща евристика',
    pathway: 'Ефективний шлях відновлення',
    pathwayDetected: 'Обраний план використовує залежний від донора ланцюг ремонтів як частину виміряної переваги за ефективністю; той самий простір дій доступний евристикам.',
    noMaterialAdvantage: 'У цьому сценарії суттєва перевага над найсильнішою евристикою не продемонстрована.',
  },
  pl: {
    eyebrow: 'PRZEWAGA QDIP',
    title: 'Zmierzona przewaga QDIP nad najsilniejszą heurystyką',
    body: 'Najsilniejszy oceniony scenariusz niezdominowany jest porównywany z najlepszym wariantem FIFO, krytyczności lub heurystyki zachłannej przy tych samych wejściowych założeniach dotyczących niepewności.',
    probabilityDelta: 'Zmiana prawdopodobieństwa pokrycia potrzeb',
    readinessDelta: 'Zmiana gotowości',
    shortfallReduction: 'Zmniejszenie niedoboru',
    qdip: 'Scenariusz QDIP',
    baseline: 'Najlepsza heurystyka',
    pathway: 'Efektywna ścieżka odtworzenia',
    pathwayDetected: 'Wybrany plan wykorzystuje zależny od dawcy łańcuch napraw jako część zmierzonej przewagi efektywności; ten sam zestaw działań jest dostępny heurystykom.',
    noMaterialAdvantage: 'W tym scenariuszu nie wykazano istotnej przewagi nad najsilniejszą heurystyką.',
  },
}
