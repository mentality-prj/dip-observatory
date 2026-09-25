'use client'

import { useTranslations } from '@/i18n/provider'
import type { Locale } from '@/lib/observatory-i18n'
import type { ResourceAllocationAssignmentExplanation } from '../contracts'
import { localizeService } from '../presentation'


export function ResourceAllocationAssignmentExplanation({ explanation, locale }: { explanation: ResourceAllocationAssignmentExplanation; locale: Locale }) {
  const t = useTranslations('resourceAllocation.assignmentExplanation')
  return (
    <section data-testid="assignment-explanation" className="mt-5 border border-rose-300/20 bg-rose-300/[0.05] p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">{t('title')}</div>
      <h3 className="mt-2 text-lg font-black">{explanation.team_id}: {explanation.from ?? '—'} → {explanation.to ?? '—'}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label={t('services')} value={explanation.matched_services.map((item) => localizeService(item, locale)).join(', ') || '—'} />
        <Fact label={t('priority')} value={explanation.priority_demand_units.toFixed(0)} />
        <Fact label={t('served')} value={explanation.served_units.toFixed(0)} />
        <Fact label={t('travel')} value={explanation.travel_time_minutes > 0 ? `${explanation.travel_time_minutes.toFixed(0)} ${t('minutes')}` : '—'} />
      </div>
      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {explanation.rationale_codes.map((code) => {
          const text = t.has(code) ? t(code) : null
          return typeof text === 'string' ? <div key={code} className="border-l-2 border-emerald-400 pl-3 text-sm text-slate-300">{text}</div> : null
        })}
      </div>
      <details className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-500">
        <summary className="cursor-pointer font-semibold text-slate-400">{t('constraints')}</summary>
        <div className="mt-3 space-y-2">
          {explanation.constraint_checks.map((check) => (
            <div key={check.code} className="flex justify-between gap-4"><span>{check.code}</span><b className={check.passed ? 'text-emerald-300' : 'text-rose-200'}>{check.passed ? t('pass') : t('fail')}{check.value !== undefined ? ` · ${check.value}` : ''}</b></div>
          ))}
        </div>
      </details>
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="border border-white/10 bg-slate-950/30 p-3"><div className="text-xs text-slate-500">{label}</div><b className="mt-1 block break-words">{value}</b></div>
}
