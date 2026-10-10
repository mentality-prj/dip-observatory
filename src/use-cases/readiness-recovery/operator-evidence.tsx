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
  en: { title: 'Kernel evidence', status: 'Kernel status', execution: 'Execution', decision: 'Decision',
    source: 'Source snapshot', digest: 'Input digest', revision: 'Predecessor',
    authority: 'Kernel evidence', allowed: 'Kernel reports actionable', denied: 'Non-actionable',
    jobs: 'Scheduled jobs', donors: 'Donors', unknown: 'Unknown / not recorded',
    warning: 'This view does not issue real-world work orders. Backend authority is not field acceptance.' },
  uk: { title: 'Докази Kernel', status: 'Статус Kernel', execution: 'Виконання', decision: 'Рішення',
    source: 'Snapshot джерела', digest: 'Хеш вхідних даних', revision: 'Попереднє виконання',
    authority: 'Докази Kernel', allowed: 'Kernel визначив рішення придатним до виконання',
    denied: 'Не дозволено до виконання', jobs: 'Заплановані роботи', donors: 'Донори',
    unknown: 'Невідомо / не записано',
    warning: 'Інтерфейс не видає реальних ремонтних наказів. Авторитет Kernel не означає польового приймання.' },
  pl: { title: 'Dowody Kernel', status: 'Status Kernel', execution: 'Wykonanie', decision: 'Decyzja',
    source: 'Migawka źródła', digest: 'Skrót danych wejściowych', revision: 'Poprzednik',
    authority: 'Dowody Kernel', allowed: 'Kernel zgłasza wykonalność',
    denied: 'Brak zgody na wykonanie', jobs: 'Zaplanowane zadania', donors: 'Dawcy',
    unknown: 'Brak danych', warning: 'Interfejs nie wydaje zleceń napraw. Wynik Kernel nie jest akceptacją terenową.' },
} as const

/** A defensive shape gate for a *server projection*, not RR decision logic. */
export function isKernelRRPresentation(value: unknown): value is KernelRRPresentation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Partial<KernelRRPresentation>
  return v.schema_version === 'readiness-recovery.presentation.v1' &&
    v.computation_authority === 'QDIP_KERNEL_RR_V1' &&
    typeof v.execution_id === 'string' &&
    typeof v.decision_id === 'string' &&
    typeof v.authoritative === 'boolean' &&
    typeof v.actionable === 'boolean' &&
    typeof v.outcome_kind === 'string' &&
    Array.isArray(v.scheduled_jobs) &&
    Array.isArray(v.selected_donor_ids)
}

export function OperatorEvidence({ locale, record }: { locale: Locale; record: KernelRRPresentation | null }) {
  const t = copy[locale]
  if (!record) return <p role="status" className="mt-3 text-sm text-amber-200">{t.unknown}</p>
  const cells = [
    [t.execution, record.execution_id], [t.decision, record.decision_id],
    [t.status, record.outcome_kind], [t.source, record.source_snapshot_id],
    [t.digest, record.payload_digest], [t.revision, record.predecessor_execution_id],
    [t.authority, record.authoritative ? record.backend_status : t.denied],
    [t.jobs, record.scheduled_job_count], [t.donors, record.selected_donor_ids.join(', ')],
  ]
  return (
    <section data-testid="rr-kernel-evidence" data-kernel-authoritative={String(record.authoritative)}
      data-actionable={String(record.actionable)} className="mt-3 border border-white/20 p-4">
      <h4 className="font-semibold">{t.title}</h4>
      <p className="mt-2 text-sm">{record.actionable ? t.allowed : t.denied} · {record.summary}</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {cells.map(([label, value])=>(
          <div key={label}><dt className="text-xs text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-slate-100">{value ?? t.unknown}</dd></div>
        ))}
      </dl>
      <ul className="mt-3 space-y-1 text-xs font-mono">{record.scheduled_jobs.map(job=>(
        <li key={job.job_id}>{job.job_id} · {job.technician_id} · {job.start_slot}–{job.finish_slot}</li>
      ))}</ul>
      <p className="mt-4 text-xs text-amber-200">{t.warning}</p>
    </section>
  )
}
