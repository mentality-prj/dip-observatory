'use client'

import type { Locale } from '@/lib/observatory-i18n'
import type { ResourceAllocationAssignmentExplanation } from '../contracts'
import { localizeService } from '../presentation'

const copy = {
  uk: {
    title: 'Чому саме сюди?',
    route: 'Маршрут',
    services: 'Компетенції команди',
    priority: 'Пріоритетні потреби в локації',
    served: 'Планове покриття цією командою',
    travel: 'Переміщення',
    minutes: 'хв',
    constraints: 'Технічні перевірки',
    pass: 'виконується',
    fail: 'не виконується',
    HIGH_PRIORITY_DEMAND: 'У цій локації є пріоритетні потреби, які команда може покрити.',
    SKILL_MATCH: 'Команда має потрібні для цих послуг компетенції.',
    REACHABLE: 'Команда може дістатися до локації в межах заданих обмежень.',
    RELOCATION: 'Для цього плану команда змінює локацію.',
    HORIZON_FEASIBLE: 'Це переміщення не блокує допустимі рішення наступних днів.',
  },
  en: {
    title: 'Why this location?',
    route: 'Route',
    services: 'Team skills',
    priority: 'Priority needs at this location',
    served: 'Planned coverage by this team',
    travel: 'Travel',
    minutes: 'min',
    constraints: 'Technical checks',
    pass: 'passed',
    fail: 'failed',
    HIGH_PRIORITY_DEMAND: 'This location has priority needs the team can cover.',
    SKILL_MATCH: 'The team has the skills required for these services.',
    REACHABLE: 'The team can reach the location within the configured constraints.',
    RELOCATION: 'The team changes location for this plan.',
    HORIZON_FEASIBLE: 'This move does not block feasible choices on following days.',
  },
  pl: {
    title: 'Dlaczego właśnie tutaj?',
    route: 'Trasa',
    services: 'Kompetencje zespołu',
    priority: 'Priorytetowe potrzeby w lokalizacji',
    served: 'Planowane pokrycie przez zespół',
    travel: 'Przejazd',
    minutes: 'min',
    constraints: 'Kontrole techniczne',
    pass: 'spełnione',
    fail: 'niespełnione',
    HIGH_PRIORITY_DEMAND: 'W tej lokalizacji są priorytetowe potrzeby, które zespół może obsłużyć.',
    SKILL_MATCH: 'Zespół ma kompetencje wymagane dla tych usług.',
    REACHABLE: 'Zespół może dotrzeć do lokalizacji w ramach zadanych ograniczeń.',
    RELOCATION: 'W tym planie zespół zmienia lokalizację.',
    HORIZON_FEASIBLE: 'To przemieszczenie nie blokuje dopuszczalnych decyzji w kolejnych dniach.',
  },
} as const

export function ResourceAllocationAssignmentExplanation({
  explanation,
  locale,
}: {
  explanation: ResourceAllocationAssignmentExplanation
  locale: Locale
}) {
  const t = copy[locale]
  return (
    <section data-testid="assignment-explanation" className="mt-5 border border-rose-300/20 bg-rose-300/[0.05] p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">{t.title}</div>
      <h3 className="mt-2 text-lg font-black">
        {explanation.team_id}: {explanation.from ?? '—'} → {explanation.to ?? '—'}
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact
          label={t.services}
          value={explanation.matched_services.map((item) => localizeService(item, locale)).join(', ') || '—'}
        />
        <Fact label={t.priority} value={explanation.priority_demand_units.toFixed(0)} />
        <Fact label={t.served} value={explanation.served_units.toFixed(0)} />
        <Fact
          label={t.travel}
          value={
            explanation.travel_time_minutes > 0 ? `${explanation.travel_time_minutes.toFixed(0)} ${t.minutes}` : '—'
          }
        />
      </div>
      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {explanation.rationale_codes.map((code) => {
          const text = t[code as keyof typeof t]
          return typeof text === 'string' ? (
            <div key={code} className="border-l-2 border-emerald-400 pl-3 text-sm text-slate-300">
              {text}
            </div>
          ) : null
        })}
      </div>
      <details className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-500">
        <summary className="cursor-pointer font-semibold text-slate-400">{t.constraints}</summary>
        <div className="mt-3 space-y-2">
          {explanation.constraint_checks.map((check) => (
            <div key={check.code} className="flex justify-between gap-4">
              <span>{check.code}</span>
              <b className={check.passed ? 'text-emerald-300' : 'text-rose-200'}>
                {check.passed ? t.pass : t.fail}
                {check.value !== undefined ? ` · ${check.value}` : ''}
              </b>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-slate-950/30 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <b className="mt-1 block break-words">{value}</b>
    </div>
  )
}
