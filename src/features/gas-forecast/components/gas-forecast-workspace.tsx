'use client'

import { Activity, BrainCircuit, Database, FlaskConical } from 'lucide-react'
import { useState } from 'react'

import { DecisionWorkflow } from '@/components/product/decision-workflow'
import type { Locale } from '@/lib/observatory-i18n'
import { cn } from '@/lib/utils'
import { GasForecastEidosPage } from './gas-forecast-eidos-page'
import { GasForecastProvidersPage } from './gas-forecast-providers-page'

type GasForecastView = 'context' | 'decision'

const copy = {
  en: {
    eyebrow: 'QDIP · DECIDE',
    title: 'European Gas Decision Workspace',
    body: 'Inspect market evidence and uncertainty, then evaluate a concrete action through the same QDIP decision flow.',
    context: 'Context & evidence',
    contextBody: 'Validate TTF, ENTSOG and weather inputs',
    decision: 'Decision evaluation',
    decisionBody: 'Evaluate the gas decision capability',
    badge: 'QDIP decision application',
  },
  uk: {
    eyebrow: 'QDIP · DECIDE',
    title: 'Простір рішень для європейського газового ринку',
    body: 'Перевірте ринкові дані й невизначеність, а потім оцініть конкретну дію через спільний процес QDIP.',
    context: 'Контекст і докази',
    contextBody: 'Перевірка TTF, ENTSOG та погодних даних',
    decision: 'Оцінювання рішення',
    decisionBody: 'Оцінювання gas decision capability',
    badge: 'QDIP decision application',
  },
  pl: {
    eyebrow: 'QDIP · DECIDE',
    title: 'Przestrzeń decyzji dla europejskiego rynku gazu',
    body: 'Sprawdź dane rynkowe i niepewność, a następnie oceń konkretne działanie w tym samym przepływie decyzyjnym QDIP.',
    context: 'Kontekst i dowody',
    contextBody: 'Walidacja danych TTF, ENTSOG i pogody',
    decision: 'Ocena decyzji',
    decisionBody: 'Ocena możliwości decyzyjnej dla gazu',
    badge: 'Aplikacja decyzyjna QDIP',
  },
} as const

export function GasForecastWorkspace({ locale = 'en' }: { locale?: Locale }) {
  const [view, setView] = useState<GasForecastView>('context')
  const t = copy[locale]
  const tabs = [
    { id: 'context' as const, label: t.context, description: t.contextBody, icon: Database },
    { id: 'decision' as const, label: t.decision, description: t.decisionBody, icon: BrainCircuit },
  ]

  return (
    <main className="relative min-h-[calc(100vh-8rem)] overflow-hidden px-4 py-6 md:px-6 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {t.eyebrow}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{t.title}</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{t.body}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-slate-400">
              <FlaskConical className="h-3.5 w-3.5 text-cyan-300" />
              {t.badge}
            </div>
          </div>
        </header>
        <DecisionWorkflow locale={locale} tone="dark" compact />
        <div className="grid gap-2 rounded-[24px] border border-white/10 bg-white/4 p-2 md:grid-cols-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = view === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  'flex items-start gap-3 rounded-[18px] px-4 py-3 text-left transition',
                  active
                    ? 'border border-cyan-300/20 bg-cyan-300/10 text-white'
                    : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                )}
              >
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', active ? 'text-cyan-300' : 'text-slate-500')} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{tab.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{tab.description}</span>
                </span>
              </button>
            )
          })}
        </div>
        <section className="min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-black/10 [&>main]:min-h-0 [&>main]:px-0 [&>main]:py-0 [&>main>div]:max-w-none [&>main>div]:gap-5 [&>main>div>header]:hidden">
          {view === 'context' ? <GasForecastProvidersPage /> : <GasForecastEidosPage />}
        </section>
      </div>
    </main>
  )
}
