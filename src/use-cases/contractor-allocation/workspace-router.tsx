'use client'

import { useState } from 'react'

import type { Locale } from '@/lib/observatory-i18n'
import { ContractorCapacityLossWorkspace } from './capacity-loss-workspace'
import { ContractorAllocationWorkspace } from './workspace'

type Mode = 'PORTFOLIO' | 'CAPACITY_LOSS'

const copy = {
  en: { label: 'Presentation mode', portfolio: 'Portfolio allocation', loss: '2022 contractor capacity-loss case' },
  uk: { label: 'Режим презентації', portfolio: 'Розподіл портфеля', loss: 'Кейс 2022: втрата потужності підрядника' },
  pl: { label: 'Tryb prezentacji', portfolio: 'Przydział portfela', loss: 'Przypadek 2022: utrata mocy wykonawcy' },
} as const

export function ContractorAllocationDemoRouter({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<Mode>('PORTFOLIO')
  const t = copy[locale]

  return (
    <>
      <div className="border-b border-white/10 bg-slate-950/70">
        <div className="mx-auto flex max-w-[1540px] flex-wrap items-center gap-2 px-4 py-3 sm:px-5 md:px-8 lg:px-10">
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">{t.label}</span>
          <button
            type="button"
            onClick={() => setMode('PORTFOLIO')}
            aria-pressed={mode === 'PORTFOLIO'}
            className={`border px-3 py-1.5 text-xs ${
              mode === 'PORTFOLIO'
                ? 'border-sky-400/50 bg-sky-400/10 text-sky-200'
                : 'border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.portfolio}
          </button>
          <button
            type="button"
            onClick={() => setMode('CAPACITY_LOSS')}
            aria-pressed={mode === 'CAPACITY_LOSS'}
            className={`border px-3 py-1.5 text-xs ${
              mode === 'CAPACITY_LOSS'
                ? 'border-sky-400/50 bg-sky-400/10 text-sky-200'
                : 'border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.loss}
          </button>
        </div>
      </div>
      {mode === 'PORTFOLIO' ? (
        <ContractorAllocationWorkspace locale={locale} />
      ) : (
        <ContractorCapacityLossWorkspace locale={locale} />
      )}
    </>
  )
}
