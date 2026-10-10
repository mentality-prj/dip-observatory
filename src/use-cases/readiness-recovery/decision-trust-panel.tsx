import type { Locale } from '@/lib/observatory-i18n'
import type { ObservatoryDecisionTrust, ObservatoryResultState } from './decision-trust'

const copy = {
  en: {
    title: 'Decision source and limitations',
    origin: 'Input origin',
    synthetic: 'Synthetic demonstration preset',
    imported: 'Imported data (not independently verified)',
    authorityLabel: 'Computation',
    authority: 'Observatory simulation — NOT a QDIP Kernel execution',
    evidenceLabel: 'Evidence',
    evidence: 'Model-only · exploratory comparison; not field-validated',
    restricted: 'Review or export scenarios only. Production application is not available.',
    states: {
      NOT_RUN: 'No result yet.',
      CANDIDATES_AVAILABLE: 'Alternatives are available for review; no universal best plan is established.',
      SEARCH_TRUNCATED: 'Search budget reached. Alternatives may be incomplete; do not infer an optimum.',
      NO_COMPARABLE_CANDIDATES: 'No comparable plans returned. This does not prove mathematical infeasibility.',
      INVALID_RESULT: 'Invalid result structure. No decision can be supported.',
    },
  },
  uk: {
    title: 'Джерело рішення та обмеження',
    origin: 'Походження даних',
    synthetic: 'Синтетичний демонстраційний сценарій',
    imported: 'Імпортовані дані (незалежно не перевірені)',
    authorityLabel: 'Обчислення',
    authority: 'Симуляція Observatory — НЕ виконання QDIP Kernel',
    evidenceLabel: 'Докази',
    evidence: 'Лише математична модель · дослідницьке порівняння; без польової перевірки',
    restricted: 'Дозволено лише перегляд або експорт. Застосування в production недоступне.',
    states: {
      NOT_RUN: 'Результату ще немає.',
      CANDIDATES_AVAILABLE: 'Альтернативи доступні для огляду; універсально найкращий план не визначено.',
      SEARCH_TRUNCATED: 'Ліміт пошуку вичерпано. Список альтернатив може бути неповним.',
      NO_COMPARABLE_CANDIDATES: 'Порівнюваних планів не отримано. Це не доводить математичну недопустимість.',
      INVALID_RESULT: 'Неправильна структура результату. Рішення не підтверджено.',
    },
  },
  pl: {
    title: 'Źródło decyzji i ograniczenia',
    origin: 'Pochodzenie danych',
    synthetic: 'Syntetyczny scenariusz demonstracyjny',
    imported: 'Dane zaimportowane (bez niezależnej weryfikacji)',
    authorityLabel: 'Obliczenia',
    authority: 'Symulacja Observatory — NIE wykonanie QDIP Kernel',
    evidenceLabel: 'Dowody',
    evidence: 'Tylko model · porównanie eksploracyjne; bez walidacji terenowej',
    restricted: 'Można jedynie przeglądać lub eksportować. Wdrożenie produkcyjne jest niedostępne.',
    states: {
      NOT_RUN: 'Brak wyniku.',
      CANDIDATES_AVAILABLE: 'Można porównać warianty; nie wyznaczono uniwersalnie najlepszego planu.',
      SEARCH_TRUNCATED: 'Przekroczono budżet wyszukiwania. Lista wariantów może być niepełna.',
      NO_COMPARABLE_CANDIDATES: 'Nie zwrócono porównywalnych planów. Nie dowodzi to matematycznej niewykonalności.',
      INVALID_RESULT: 'Nieprawidłowy format wyniku. Decyzja nie jest potwierdzona.',
    },
  },
} as const satisfies Record<Locale, {
  title: string
  origin: string
  synthetic: string
  imported: string
  authorityLabel: string
  authority: string
  evidenceLabel: string
  evidence: string
  restricted: string
  states: Record<ObservatoryResultState, string>
}>

export function DecisionTrustPanel({ locale, trust }: { locale: Locale; trust: ObservatoryDecisionTrust }) {
  const t = copy[locale]
  return (
    <section
      role="status"
      data-testid="rr-decision-trust"
      data-result-state={trust.state}
      data-production-actionable={String(trust.productionApplyEligible)}
      className="mt-5 border border-amber-300/25 bg-amber-300/[.045] p-5 md:p-6"
    >
      <h2 className="text-lg font-medium text-slate-100">{t.title}</h2>
      <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-400">{t.origin}</dt>
          <dd className="mt-1 text-slate-200">{trust.origin === 'SYNTHETIC_PRESET' ? t.synthetic : t.imported}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">{t.authorityLabel}</dt>
          <dd className="mt-1 text-slate-200">{t.authority}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">{t.evidenceLabel}</dt>
          <dd className="mt-1 text-slate-200">{t.evidence}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-amber-100">{t.states[trust.state]}</p>
      <p className="mt-2 text-sm text-slate-300">{t.restricted}</p>
    </section>
  )
}
