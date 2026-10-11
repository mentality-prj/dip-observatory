import type { Locale } from '@/lib/observatory-i18n'

/**
 * This is a typed VIEW CONTRACT owned by qdip-core's RR plugin.
 * No Monte Carlo, Pareto, optimization, capability scores or outcome
 * classification is performed in qdip-web.
 */
export type KernelRRPresentation = {
  schema_version: 'readiness-recovery.presentation.v1'
  computation_authority: 'QDIP_KERNEL_RR_V1'
  execution_id: string
  decision_id: string
  source_system: string
  source_snapshot_id: string
  source_version: string
  payload_digest: string
  change_kind: string
  predecessor_execution_id: string | null
  outcome_kind: string
  backend_status: string
  authoritative: boolean
  actionable: boolean
  summary: string
  scheduled_jobs: { job_id: string; technician_id: string; start_slot: number; finish_slot: number }[]
  selected_donor_ids: string[]
  scheduled_job_count: number
  job_count: number
  technician_count: number
  probability_demand_satisfied: null
  probability_confidence_interval: null
  field_verified: false
}

const copy = {
  en: {
    title: 'Kernel evidence',
    status: 'Kernel status',
    execution: 'Execution',
    decision: 'Decision',
    source: 'Source snapshot',
    digest: 'Input digest',
    revision: 'Predecessor',
    authority: 'Kernel evidence',
    allowed: 'Kernel reports actionable',
    denied: 'Non-actionable',
    jobs: 'Scheduled jobs',
    donors: 'Donors',
    technician: 'Technician',
    slotRange: 'Scheduled slots',
    details: 'Show technical provenance',
    empty: 'No jobs scheduled',
    unknown: 'Unknown / not recorded',
    warning: 'This view does not issue real-world work orders. Backend authority is not field acceptance.',
  },
  uk: {
    title: 'Докази Kernel',
    status: 'Статус Kernel',
    execution: 'Виконання',
    decision: 'Рішення',
    source: 'Snapshot джерела',
    digest: 'Хеш вхідних даних',
    revision: 'Попереднє виконання',
    authority: 'Докази Kernel',
    allowed: 'Kernel визначив рішення придатним до виконання',
    denied: 'Не дозволено до виконання',
    jobs: 'Заплановані роботи',
    donors: 'Донори',
    technician: 'Спеціаліст',
    slotRange: 'Часові слоти',
    details: 'Показати технічне походження даних',
    empty: 'Запланованих робіт немає',
    unknown: 'Невідомо / не записано',
    warning: 'Інтерфейс не видає реальних ремонтних наказів. Авторитет Kernel не означає польового приймання.',
  },
  pl: {
    title: 'Dowody Kernel',
    status: 'Status Kernel',
    execution: 'Wykonanie',
    decision: 'Decyzja',
    source: 'Migawka źródła',
    digest: 'Skrót danych wejściowych',
    revision: 'Poprzednik',
    authority: 'Dowody Kernel',
    allowed: 'Kernel zgłasza wykonalność',
    denied: 'Brak zgody na wykonanie',
    jobs: 'Zaplanowane zadania',
    donors: 'Dawcy',
    technician: 'Technik',
    slotRange: 'Sloty harmonogramu',
    details: 'Pokaż pochodzenie techniczne',
    empty: 'Brak zaplanowanych zadań',
    unknown: 'Brak danych',
    warning: 'Interfejs nie wydaje zleceń napraw. Wynik Kernel nie jest akceptacją terenową.',
  },
} as const

/** A defensive shape gate for a *server projection*, not RR decision logic. */
export function isKernelRRPresentation(value: unknown): value is KernelRRPresentation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Partial<KernelRRPresentation>
  const validId = (id: unknown) => typeof id === 'string' && /^[a-zA-Z0-9][\\w.-]{0,127}$/.test(id)
  return v.schema_version === 'readiness-recovery.presentation.v1' &&
    v.computation_authority === 'QDIP_KERNEL_RR_V1' &&
    validId(v.execution_id) && validId(v.decision_id) &&
    typeof v.source_system === 'string' && v.source_system.length > 0 &&
    typeof v.source_snapshot_id === 'string' && v.source_snapshot_id.length > 0 &&
    typeof v.source_version === 'string' && v.source_version.length > 0 &&
    typeof v.payload_digest === 'string' && /^[a-f0-9]{64}$/.test(v.payload_digest) &&
    typeof v.change_kind === 'string' && typeof v.outcome_kind === 'string' &&
    typeof v.backend_status === 'string' && typeof v.summary === 'string' &&
    (v.predecessor_execution_id === null || validId(v.predecessor_execution_id)) &&
    typeof v.authoritative === 'boolean' && typeof v.actionable === 'boolean' &&
    (!v.actionable || v.authoritative) &&
    v.field_verified === false &&
    v.probability_demand_satisfied === null &&
    v.probability_confidence_interval === null &&
    typeof v.scheduled_job_count === 'number' && Number.isSafeInteger(v.scheduled_job_count) &&
    v.scheduled_job_count >= 0 && typeof v.job_count === 'number' &&
    Number.isSafeInteger(v.job_count) && v.job_count > 0 &&
    typeof v.technician_count === 'number' && Number.isSafeInteger(v.technician_count) &&
    v.technician_count > 0 &&
    Array.isArray(v.selected_donor_ids) && v.selected_donor_ids.every(validId) &&
    Array.isArray(v.scheduled_jobs) &&
    v.scheduled_jobs.length === v.scheduled_job_count &&
    v.scheduled_jobs.every((item) =>
      Boolean(item) && typeof item === 'object' &&
      validId(item.job_id) && validId(item.technician_id) &&
      Number.isSafeInteger(item.start_slot) && Number.isSafeInteger(item.finish_slot) &&
      item.start_slot >= 0 && item.finish_slot > item.start_slot
    )
}

export function OperatorEvidence({ locale, record }: { locale: Locale; record: KernelRRPresentation | null }) {
  const t = copy[locale]
  if (!record)
    return (
      <p role="status" className="mt-3 text-sm text-amber-200">
        {t.unknown}
      </p>
    )
  const cells = [
    [t.execution, record.execution_id],
    [t.decision, record.decision_id],
    [t.status, record.outcome_kind],
    [t.source, record.source_snapshot_id],
    [t.digest, record.payload_digest],
    [t.revision, record.predecessor_execution_id],
    [t.authority, record.authoritative ? record.backend_status : t.denied],
    [t.jobs, record.scheduled_job_count],
    [t.donors, record.selected_donor_ids.join(', ')],
  ]
  return (
    <section
      data-testid="rr-kernel-evidence"
      data-kernel-authoritative={String(record.authoritative)}
      data-actionable={String(record.actionable)}
      className="mt-3 border border-white/20 p-4"
    >
      <h4 className="font-semibold">{t.title}</h4>
      <p className="mt-2 text-sm">
        {record.actionable ? t.allowed : t.denied} · {record.summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <span>{t.status}: <strong>{record.outcome_kind}</strong></span>
        <span>{t.jobs}: <strong>{record.scheduled_job_count}</strong></span>
      </div>
      {record.scheduled_jobs.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm" data-testid="rr-kernel-schedule">
            <thead>
              <tr className="border-b border-white/20 text-slate-400">
                <th scope="col" className="py-2 pr-3">{t.jobs}</th>
                <th scope="col" className="py-2 pr-3">{t.technician}</th>
                <th scope="col" className="py-2">{t.slotRange}</th>
              </tr>
            </thead>
            <tbody>
              {record.scheduled_jobs.map((job) => (
                <tr key={job.job_id} className="border-b border-white/10">
                  <td className="py-2 pr-3 font-mono text-xs">{job.job_id}</td>
                  <td className="py-2 pr-3">{job.technician_id}</td>
                  <td className="py-2">{job.start_slot}–{job.finish_slot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-amber-200">{t.empty}</p>
      )}
      <details className="mt-4 border-t border-white/15 pt-3">
        <summary className="cursor-pointer text-sm text-slate-300">{t.details}</summary>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {cells.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="mt-1 break-words text-slate-100">{value ?? t.unknown}</dd>
            </div>
          ))}
        </dl>
      </details>
      <p className="mt-4 text-xs text-amber-200">{t.warning}</p>
    </section>
  )
}
