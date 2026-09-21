'use client'

import type { Locale } from '@/lib/observatory-i18n'
import type { ResourceAllocationAssignmentExplanation } from '../contracts'
import { localizeService } from '../presentation'

const copy = {
  uk: {
    title: 'Чому QDIP рекомендує це переміщення?',
    route: 'Маршрут',
    services: 'Відповідні компетенції',
    priority: 'Пріоритетний попит у локації',
    served: 'Планове покриття цією командою',
    travel: 'Індекс переміщення',
    minutes: 'хв',
    constraints: 'Перевірені обмеження',
    pass: 'виконується',
    fail: 'не виконується',
    HIGH_PRIORITY_DEMAND: 'У локації є критичні або високопріоритетні потреби, які команда може обслуговувати.',
    SKILL_MATCH: 'Компетенції команди відповідають потрібним послугам.',
    REACHABLE: 'Переміщення допустиме за travel-обмеженнями.',
    RELOCATION: 'Для виконання плану команда змінює локацію.',
    HORIZON_FEASIBLE: 'Призначення входить у допустимий план на весь горизонт, а не лише на один день.',
  },
  en: {
    title: 'Why does QDIP recommend this assignment?',
    route: 'Route',
    services: 'Matched skills',
    priority: 'Priority demand at destination',
    served: 'Planned demand served by this team',
    travel: 'Movement cost index',
    minutes: 'min',
    constraints: 'Constraint checks',
    pass: 'passed',
    fail: 'failed',
    HIGH_PRIORITY_DEMAND: 'The destination has critical/high-priority demand the team can serve.',
    SKILL_MATCH: 'The team skills match the requested services.',
    REACHABLE: 'The movement is feasible under the travel constraints.',
    RELOCATION: 'The team changes location to execute the plan.',
    HORIZON_FEASIBLE: 'The assignment belongs to a feasible full-horizon plan, not a one-day choice.',
  },
  pl: {
    title: 'Dlaczego QDIP rekomenduje ten przydział?',
    route: 'Trasa',
    services: 'Pasujące kompetencje',
    priority: 'Priorytetowy popyt w lokalizacji',
    served: 'Planowana obsługa przez ten zespół',
    travel: 'Indeks kosztu przemieszczenia',
    minutes: 'min',
    constraints: 'Sprawdzone ograniczenia',
    pass: 'spełnione',
    fail: 'niespełnione',
    HIGH_PRIORITY_DEMAND: 'Lokalizacja ma krytyczne lub wysokopriorytetowe potrzeby, które zespół może obsłużyć.',
    SKILL_MATCH: 'Kompetencje zespołu odpowiadają wymaganym usługom.',
    REACHABLE: 'Przemieszczenie spełnia ograniczenia podróży.',
    RELOCATION: 'Zespół zmienia lokalizację w ramach planu.',
    HORIZON_FEASIBLE: 'Przydział jest częścią dopuszczalnego planu całego horyzontu, a nie decyzją jednodniową.',
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
          value={`${explanation.travel_cost.toFixed(0)}${explanation.travel_time_minutes > 0 ? ` · ${explanation.travel_time_minutes.toFixed(0)} ${t.minutes}` : ''}`}
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
