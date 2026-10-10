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
        'Use QDIP Kernel to schedule repair jobs against technician availability, workshop capacity, inventory and donor constraints. Restricted authenticated reference access; no stochastic Pareto claims.',
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
        'QDIP Kernel планує ремонтні роботи з урахуванням доступності техніків, місткості майстерні, запасів і донорських ресурсів. Обмежений авторизований референсний доступ.',
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
        'QDIP Kernel planuje prace serwisowe z uwzględnieniem dostępności techników, warsztatu, części i zasobów dawców. Dostęp referencyjny wymaga autoryzacji.',
      tag: 'GOTOWOŚĆ',
    },
  },
}
