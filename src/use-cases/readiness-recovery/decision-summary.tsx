import type { Locale } from '@/lib/observatory-i18n'
import type { ReadinessRecoveryInput, ReadinessRecoveryResult, RecoveryScenario } from './domain'
import { explainReviewDifference, type ViewingPriority } from './decision-policy'

const labels = {
  en: {
    title: 'Decision review',
    stage: 'Review only · no work orders issued',
    question: 'What changes if this plan is selected?',
    none: 'No plan is available for review. Inspect input quality and search limits.',
    actions: 'Selected recovery actions',
    noneSelected: 'No action selected',
    selected: 'Selected alternative',
    competitor: 'Compared with',
    hours: 'Recovery time difference (h)',
    readiness: 'Readiness difference (pp)',
    probability: 'Demand satisfaction difference (pp)',
    parts: 'Scarce parts difference',
    failure: 'Failure risk difference (pp)',
    policy: 'Viewing priority',
    explanation: 'Ordering only: the planner was not rerun and no global best plan has been established.',
    risk: 'Result depends on input reliability, model assumptions and simulation samples. Not verified against production Kernel.',
    resources: 'Available repair resources',
    tech: 'Skill-hour pools',
    workshop: 'Workshop hours',
    inventory: 'Spare part types',
    noBaseline: 'There is no independent comparison that justifies a winner.',
  },
  uk: {
    title: 'Перегляд рішення',
    stage: 'Лише перегляд · ремонтних наказів не створено',
    question: 'Що зміниться за вибору цього плану?',
    none: 'Немає плану для перегляду. Перевірте вхідні дані та ліміти пошуку.',
    actions: 'Обрані ремонтні дії',
    noneSelected: 'Жодної дії не обрано',
    selected: 'Обрана альтернатива',
    competitor: 'Порівняння з',
    hours: 'Різниця часу відновлення (год)',
    readiness: 'Різниця готовності (в.п.)',
    probability: 'Різниця ймовірності виконання потреби (в.п.)',
    parts: 'Різниця дефіцитних деталей',
    failure: 'Різниця ризику відмови (в.п.)',
    policy: 'Пріоритет перегляду',
    explanation: 'Лише порядок показу: планувальник не перезапускався, найкращий план загалом не встановлено.',
    risk: 'Результат залежить від якості даних, припущень моделі та симуляцій. Production Kernel його не перевіряв.',
    resources: 'Доступні ресурси ремонту',
    tech: 'Пули робочих годин',
    workshop: 'Години майстерні',
    inventory: 'Типи запчастин',
    noBaseline: 'Незалежного порівняння для визначення переможця немає.',
  },
  pl: {
    title: 'Przegląd decyzji',
    stage: 'Tylko podgląd · nie zlecono napraw',
    question: 'Co zmieni wybór tego planu?',
    none: 'Brak planu do przeglądu. Sprawdź dane wejściowe i limity wyszukiwania.',
    actions: 'Wybrane działania naprawcze',
    noneSelected: 'Nie wybrano działań',
    selected: 'Wybrany wariant',
    competitor: 'Porównanie z',
    hours: 'Różnica czasu naprawy (h)',
    readiness: 'Różnica gotowości (pp)',
    probability: 'Różnica prawdopodobieństwa spełnienia potrzeb (pp)',
    parts: 'Różnica zużycia rzadkich części',
    failure: 'Różnica ryzyka awarii (pp)',
    policy: 'Priorytet przeglądania',
    explanation:
      'Wyłącznie kolejność prezentacji: nie przeliczono planu i nie ustalono globalnie najlepszego wariantu.',
    risk: 'Wynik zależy od jakości danych, założeń i symulacji. Nie zweryfikowano go przez produkcyjny Kernel.',
    resources: 'Dostępne zasoby napraw',
    tech: 'Pule godzin umiejętności',
    workshop: 'Godziny warsztatu',
    inventory: 'Rodzaje części',
    noBaseline: 'Brak niezależnego porównania uzasadniającego zwycięzcę.',
  },
} as const

export function DecisionSummary({
  locale,
  input,
  result,
  selected,
  comparator,
  priority,
}: {
  locale: Locale
  input: ReadinessRecoveryInput
  result: ReadinessRecoveryResult
  selected: RecoveryScenario | null
  comparator: RecoveryScenario | null
  priority: ViewingPriority
}) {
  const t = labels[locale]
  const difference =
    selected && comparator && selected.scenarioId !== comparator.scenarioId
      ? explainReviewDifference(selected, comparator)
      : null
  const fmt = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(value)
  return (
    <section
      aria-label={t.title}
      className="mt-5 border border-sky-400/25 bg-sky-400/[.035] p-5 md:p-6"
      data-testid="rr-decision-summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-medium">{t.title}</h2>
        <span className="border border-amber-300/35 px-2 py-1 text-xs text-amber-200">{t.stage}</span>
      </div>
      <p className="mt-3 text-sm text-slate-300">
        {t.resources}: {t.tech}: {Object.keys(input.resources.technicianHours).length} · {t.workshop}:{' '}
        {input.resources.workshopHours} · {t.inventory}: {Object.keys(input.resources.spareParts).length}
      </p>
      {selected ? (
        <>
          <p className="mt-4 text-sm font-semibold text-slate-200">
            {t.selected}: {selected.scenarioId}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {t.actions}: {selected.selectedActions.length || t.noneSelected}
          </p>
          <h3 className="mt-5 text-base font-medium">{t.question}</h3>
          {difference ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="rr-tradeoffs">
              {(
                [
                  [t.hours, difference.recoveryHours],
                  [t.readiness, difference.readiness * 100],
                  [t.probability, difference.probability * 100],
                  [t.parts, difference.scarceParts],
                  [t.failure, difference.failureRisk * 100],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="border border-white/10 p-3 text-sm">
                  <div className="text-slate-400">{label}</div>
                  <strong className="text-slate-100">{fmt(value)}</strong>
                </div>
              ))}
              <p className="col-span-full text-xs text-slate-400">
                {t.competitor}: {comparator?.scenarioId}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">{t.noBaseline}</p>
          )}
          <p className="mt-4 text-sm text-slate-400">
            {t.policy}: {priority}. {t.explanation}
          </p>
          <p className="mt-3 text-xs text-slate-400">{t.risk}</p>
        </>
      ) : (
        <p role="status" className="mt-4 text-sm text-amber-200">
          {t.none}
        </p>
      )}
      {result.diagnostics.truncatedByNodeBudget || result.diagnostics.truncatedByTimeBudget ? (
        <p role="status" className="mt-3 text-sm text-amber-200">
          PARTIAL / SEARCH LIMIT REACHED
        </p>
      ) : null}
    </section>
  )
}
