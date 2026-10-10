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
    eyebrow: 'EXPLORATORY · LOCAL PLANNER COMPARISON',
    title: 'Observatory planner outperformed the strongest local heuristic in this simulation',
    body: 'Exploratory comparison within the Observatory simulator, not independent verification of the production QDIP Kernel. This does not establish general statistical superiority.',
    probabilityDelta: 'Demand-satisfaction delta',
    readinessDelta: 'Readiness delta',
    shortfallReduction: 'Shortfall reduction',
    qdip: 'Observatory scenario',
    baseline: 'Best heuristic',
    pathway: 'Efficient recovery path',
    pathwayDetected:
      'The selected plan uses the donor-dependent repair chain as part of its measured efficiency advantage; the same action space is available to the heuristics.',
    noMaterialAdvantage: 'No material advantage over the strongest heuristic is demonstrated in this scenario.',
  },
  uk: {
    eyebrow: 'ДОСЛІДНИЦЬКЕ · ЛОКАЛЬНЕ ПОРІВНЯННЯ',
    title: 'Планувальник Observatory перевершив локальну евристику в цій симуляції',
    body: 'Дослідницьке порівняння всередині симулятора Observatory, а не незалежна перевірка production QDIP Kernel. Загальну статистичну перевагу не доведено.',
    probabilityDelta: 'Приріст ймовірності виконання потреби',
    readinessDelta: 'Приріст готовності',
    shortfallReduction: 'Зменшення дефіциту',
    qdip: 'Сценарій Observatory',
    baseline: 'Найкраща евристика',
    pathway: 'Ефективний шлях відновлення',
    pathwayDetected:
      'Обраний план використовує залежний від донора ланцюг ремонтів як частину виміряної переваги за ефективністю; той самий простір дій доступний евристикам.',
    noMaterialAdvantage: 'У цьому сценарії суттєва перевага над найсильнішою евристикою не продемонстрована.',
  },
  pl: {
    eyebrow: 'EKSPLORACYJNE · LOKALNE PORÓWNANIE',
    title: 'Planer Observatory przewyższył lokalną heurystykę w tej symulacji',
    body: 'Porównanie eksploracyjne w symulatorze Observatory, bez niezależnej weryfikacji produkcyjnego QDIP Kernel. Nie dowodzi ogólnej przewagi statystycznej.',
    probabilityDelta: 'Zmiana prawdopodobieństwa pokrycia potrzeb',
    readinessDelta: 'Zmiana gotowości',
    shortfallReduction: 'Zmniejszenie niedoboru',
    qdip: 'Scenariusz Observatory',
    baseline: 'Najlepsza heurystyka',
    pathway: 'Efektywna ścieżka odtworzenia',
    pathwayDetected:
      'Wybrany plan wykorzystuje zależny od dawcy łańcuch napraw jako część zmierzonej przewagi efektywności; ten sam zestaw działań jest dostępny heurystykom.',
    noMaterialAdvantage: 'W tym scenariuszu nie wykazano istotnej przewagi nad najsilniejszą heurystyką.',
  },
}
