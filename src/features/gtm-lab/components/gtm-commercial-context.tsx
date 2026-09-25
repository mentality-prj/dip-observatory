'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/observatory-i18n'
import { gtmLabI18n } from '../i18n'
import { commercialContextSchema, type CommercialContext } from '../import-contracts'

type Props = {
  locale: Locale
  value: CommercialContext | null
  onChange: (context: CommercialContext) => void
}

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export function GtmCommercialContext({ locale, value, onChange }: Props) {
  const t = gtmLabI18n[locale].onboarding
  const [offering, setOffering] = useState(value?.offering ?? '')
  const [problems, setProblems] = useState(value?.problems_solved.join(', ') ?? '')
  const [industries, setIndustries] = useState(value?.target_industries.join(', ') ?? '')
  const [sizes, setSizes] = useState(value?.target_company_sizes.join(', ') ?? '')
  const [geographies, setGeographies] = useState(value?.target_geographies.join(', ') ?? '')
  const [roles, setRoles] = useState(value?.target_roles.join(', ') ?? '')
  const [error, setError] = useState<string | null>(null)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = commercialContextSchema.safeParse({
      offering: offering.trim(),
      problems_solved: splitList(problems),
      target_industries: splitList(industries),
      target_company_sizes: splitList(sizes),
      target_geographies: splitList(geographies),
      target_roles: splitList(roles),
    })
    if (!parsed.success) {
      setError(t.contextRequired)
      return
    }
    setError(null)
    onChange(parsed.data)
  }

  const fields = [
    [t.offering, offering, setOffering, t.offeringPlaceholder],
    [t.problems, problems, setProblems, t.problemsPlaceholder],
    [t.industries, industries, setIndustries, t.industriesPlaceholder],
    [t.sizes, sizes, setSizes, t.sizesPlaceholder],
    [t.geographies, geographies, setGeographies, t.geographiesPlaceholder],
    [t.roles, roles, setRoles, t.rolesPlaceholder],
  ] as const

  return (
    <section className="mt-7 border border-sky-400/20 bg-sky-400/[.04] p-5 md:p-7" aria-labelledby="gtm-context-title">
      <span className="text-[10px] font-semibold tracking-[.18em] text-sky-300">{t.eyebrow}</span>
      <h2 id="gtm-context-title" className="mt-2 text-2xl font-medium">
        {t.title}
      </h2>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{t.description}</p>
      <div className="mt-5 grid gap-2 text-xs font-semibold sm:grid-cols-3">
        <div className="border border-sky-400/30 p-3 text-sky-200">{t.stepContext}</div>
        <div className="border border-white/10 p-3 text-slate-400">{t.stepCompanies}</div>
        <div className="border border-white/10 p-3 text-slate-400">{t.stepDecision}</div>
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
        {fields.map(([label, fieldValue, setter, placeholder], index) => (
          <label key={label} className={index < 2 ? 'md:col-span-2' : ''}>
            <span className="mb-1.5 block text-xs font-semibold text-slate-300">{label}</span>
            {index < 2 ? (
              <textarea
                value={fieldValue}
                onChange={(event) => setter(event.target.value)}
                placeholder={placeholder}
                rows={2}
                className="w-full border border-white/15 bg-slate-950/70 p-3 text-sm"
              />
            ) : (
              <input
                value={fieldValue}
                onChange={(event) => setter(event.target.value)}
                placeholder={placeholder}
                className="w-full border border-white/15 bg-slate-950/70 p-3 text-sm"
              />
            )}
          </label>
        ))}
        <div className="md:col-span-2">
          <button type="submit" className="bg-sky-400 px-5 py-2.5 font-bold text-slate-950">
            {t.continue}
          </button>
          {value && <span className="ml-3 text-xs text-emerald-300">✓ {t.stepContext}</span>}
          {error && (
            <p role="alert" className="mt-2 text-sm text-rose-200">
              {error}
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
