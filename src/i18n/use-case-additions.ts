import type { Locale } from './config'

type UseCaseCatalogEntry = {
  title: string
  description: string
  tag: string
}

export const USE_CASE_MESSAGE_ADDITIONS: Record<Locale, Record<string, UseCaseCatalogEntry>> = {
  en: {
    'contractor-allocation': {
      title: 'Contractor Allocation',
      description:
        'Non-discretionary contractor assignment from approved scope, contracts, rates and capacity, optimized for portfolio cost.',
      tag: 'COST CONTROL',
    },
    'readiness-recovery': {
      title: 'Readiness Recovery Planner',
      description:
        'Generate feasible recovery strategies from capability demand, fleet state, constrained resources and uncertain repair outcomes, then expose the Pareto trade-offs to the planner.',
      tag: 'READINESS',
    },
  },
  uk: {
    'contractor-allocation': {
      title: 'Розподіл робіт між підрядниками',
      description:
        'Недискреційний вибір підрядника за затвердженим обсягом робіт, договорами, ставками та доступною потужністю з оптимізацією сукупних витрат.',
      tag: 'КОНТРОЛЬ ВИТРАТ',
    },
    'readiness-recovery': {
      title: 'Планувальник відновлення готовності',
      description:
        'Формує допустимі стратегії відновлення з потреби у спроможностях, стану парку, обмежених ресурсів та невизначених результатів ремонту і показує планувальнику Парето-компроміси.',
      tag: 'ГОТОВНІСТЬ',
    },
  },
  pl: {
    'contractor-allocation': {
      title: 'Przydział prac wykonawcom',
      description:
        'Niedyskrecjonalny wybór wykonawcy na podstawie zatwierdzonego zakresu, umów, stawek i dostępnej mocy z optymalizacją łącznego kosztu.',
      tag: 'KONTROLA KOSZTÓW',
    },
    'readiness-recovery': {
      title: 'Planer odtwarzania gotowości',
      description:
        'Tworzy wykonalne strategie odtwarzania na podstawie zapotrzebowania na zdolności, stanu floty, ograniczonych zasobów i niepewnych wyników napraw, pokazując planiście kompromisy Pareto.',
      tag: 'GOTOWOŚĆ',
    },
  },
}
