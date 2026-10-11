import type { Locale } from '@/lib/observatory-i18n'
import { isKernelRRPresentation, type KernelRRPresentation } from './operator-evidence'

/**
 * Descriptive comparison of two distinct, persisted Kernel presentations.
 * This is neither a new optimizer nor a claim of plan superiority.
 */
export function canCompareRRExecutions(
  previous: unknown,
  current: unknown
): previous is KernelRRPresentation {
  if (!isKernelRRPresentation(previous) || !isKernelRRPresentation(current)) return false
  return (
    previous.authoritative &&
    current.authoritative &&
    previous.decision_id === current.decision_id &&
    previous.execution_id !== current.execution_id &&
    current.predecessor_execution_id === previous.execution_id &&
    previous.computation_authority === current.computation_authority &&
    previous.source_system === current.source_system &&
    previous.source_version === current.source_version
  )
}

const copy = {
  en: {
    title: 'Execution-to-execution review',
    warning:
      'Descriptive model outputs only. Different inputs and source snapshots are not controlled alternatives. No ROI, Pareto frontier, independent baseline, statistical winner, confidence interval or field outcome is established.',
    metric: 'Recorded value',
    previous: 'Previous execution',
    current: 'Current execution',
    jobs: 'Input jobs',
    scheduled: 'Scheduled jobs',
    technicians: 'Input technicians',
    donors: 'Selected donors',
    snapshot: 'Source snapshot',
    status: 'Kernel outcome',
    unknown: 'Not provided by Core',
  },
  uk: {
    title: 'Порівняння двох виконань',
    warning:
      'Лише опис результатів моделі. Різні вхідні дані та snapshots не є контрольованими альтернативами. ROI, Pareto, незалежний baseline, статистичну перевагу, довірчий інтервал і польовий результат не встановлено.',
    metric: 'Записане значення',
    previous: 'Попереднє виконання',
    current: 'Поточне виконання',
    jobs: 'Вхідні роботи',
    scheduled: 'Заплановані роботи',
    technicians: 'Спеціалісти у вхідних даних',
    donors: 'Вибрані донори',
    snapshot: 'Snapshot джерела',
    status: 'Результат Kernel',
    unknown: 'Core не надав',
  },
  pl: {
    title: 'Porównanie dwóch wykonań',
    warning:
      'Tylko opis wyników modelu. Różne dane wejściowe i migawki nie są kontrolowanymi alternatywami. ROI, Pareto, niezależny baseline, przewaga statystyczna, przedział ufności i wynik terenowy nie są potwierdzone.',
    metric: 'Wartość z Core',
    previous: 'Poprzednie wykonanie',
    current: 'Bieżące wykonanie',
    jobs: 'Zadania wejściowe',
    scheduled: 'Zaplanowane zadania',
    technicians: 'Technicy na wejściu',
    donors: 'Wybrani dawcy',
    snapshot: 'Migawka źródła',
    status: 'Wynik Kernel',
    unknown: 'Brak danych Core',
  },
} as const

export function RRExecutionComparison({
  locale,
  previous,
  current,
}: {
  locale: Locale
  previous: KernelRRPresentation | null
  current: KernelRRPresentation | null
}) {
  if (!canCompareRRExecutions(previous, current)) return null
  const t = copy[locale]
  const rows = [
    [t.jobs, previous.job_count, current.job_count],
    [t.scheduled, previous.scheduled_job_count, current.scheduled_job_count],
    [t.technicians, previous.technician_count, current.technician_count],
    [t.donors, previous.selected_donor_ids.length, current.selected_donor_ids.length],
    [t.snapshot, previous.source_snapshot_id, current.source_snapshot_id],
    [t.status, previous.outcome_kind, current.outcome_kind],
  ]
  return (
    <section
      data-testid="rr-execution-comparison"
      aria-label={t.title}
      className="mt-4 border border-sky-400/20 p-3"
    >
      <h4 className="font-semibold text-sky-200">{t.title}</h4>
      <p className="mt-2 text-xs text-amber-200">{t.warning}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[460px] text-left text-xs">
          <thead>
            <tr>
              <th scope="col" className="p-2">{t.metric}</th>
              <th scope="col" className="p-2">{t.previous}: {previous.execution_id}</th>
              <th scope="col" className="p-2">{t.current}: {current.execution_id}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, before, after]) => (
              <tr key={label} className="border-t border-white/15">
                <th scope="row" className="p-2 font-medium">{label}</th>
                <td className="break-all p-2">{before ?? t.unknown}</td>
                <td className="break-all p-2">{after ?? t.unknown}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
