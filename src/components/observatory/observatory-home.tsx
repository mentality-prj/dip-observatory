import { ArrowRight, BrainCircuit, Check, ChevronDown, Network, Route } from 'lucide-react'

import { DecisionWorkflow } from '@/components/product/decision-workflow'
import { buildLocalePath, type Locale } from '@/lib/observatory-i18n'
import { observatoryHomeI18n } from '@/lib/product-i18n'
import { decisionPatternLabel } from '@/product/experience'
import { observableUseCases } from '@/use-cases/registry'

const demoIcons = { 'resource-allocation': Route, 'supply-network-optimization': Network } as const

export function ObservatoryHome({ locale }: { locale: Locale }) {
  const t = observatoryHomeI18n[locale]
  const useCases = observableUseCases()
  return (
    <main className="observatory-home relative min-h-[calc(100vh-6.5rem)] overflow-hidden px-4 pb-20 pt-8 text-white md:px-6 md:pt-12 xl:px-10">
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <header className="max-w-5xl">
          <div className="observatory-eyebrow">{t.eyebrow}</div>
          <h1 className="mt-5 max-w-4xl text-3xl font-normal tracking-[-.025em] md:text-5xl lg:text-[3.5rem]">
            {t.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">{t.subtitle}</p>
        </header>

        <DecisionWorkflow locale={locale} tone="dark" />

        <section className="mt-10" aria-labelledby="observatory-inspection-model">
          <h2
            id="observatory-inspection-model"
            className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500"
          >
            {t.inspectLabel}
          </h2>
          <div className="mt-5 grid overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 lg:grid-cols-[1.4fr_.8fr]">
            <div className="border-b border-white/10 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-300">
                {t.recommendation}
              </span>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <strong className="text-3xl font-medium tracking-[-.035em] md:text-4xl">{t.recommended}</strong>
                  <p className="mt-2 text-sm text-slate-400">{t.confidence}</p>
                </div>
                <span className="ds-state-chip-selected rounded-full border px-3 py-1 text-xs">
                  {t.recommendedLabel}
                </span>
              </div>
              <div className="mt-8 border-t border-white/10 pt-5">
                <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">
                  {t.alternatives}
                </span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {t.alternativeItems.map(([name, reason]) => (
                    <div key={name} className="rounded-lg border-t border-white/8 bg-transparent p-4">
                      <strong className="text-sm font-medium text-slate-200">{name}</strong>
                      <span className="mt-1 block text-xs text-slate-500">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
              <details className="mt-5 border-t border-white/10 pt-4 group">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-cyan-200">
                  {t.trace}
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-500">{t.traceBody}</p>
              </details>
              <a
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"
                href={buildLocalePath('/resource-allocation', locale)}
              >
                {t.previewCta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <aside className="bg-white/[.018] p-6 md:p-8" aria-label={t.evidence}>
              <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">{t.evidence}</span>
              <div className="mt-5 grid gap-4">
                {t.evidenceItems.map((item, index) => (
                  <div key={item} className="flex gap-3 border-b border-white/8 pb-4 last:border-0">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-cyan-300">
                      <Check className="h-3 w-3" />
                    </span>
                    <div>
                      <strong className="block text-sm font-medium text-slate-200">0{index + 1}</strong>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="observatory-demos">
          <div className="mb-7 max-w-3xl">
            <h2 id="observatory-demos" className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">
              {t.demos}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">{t.demosBody}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {useCases.map((useCase) => {
              const Icon = demoIcons[useCase.id as keyof typeof demoIcons] ?? BrainCircuit
              return (
                <a
                  key={useCase.id}
                  href={buildLocalePath(useCase.route, locale)}
                  data-use-case={useCase.id}
                  data-theme={useCase.presentation.theme}
                  className="observatory-demo-card group flex min-h-64 flex-col p-6 md:p-8"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="observatory-icon-frame">
                      <Icon className="h-5 w-5 text-cyan-200" />
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[.14em] text-slate-500">
                      <b className="text-cyan-300">{decisionPatternLabel(useCase.decisionPattern, locale)}</b>
                      <span>·</span>
                      {useCase.tag[locale]}
                    </span>
                  </div>
                  <h3 className="mt-8 text-xl font-medium tracking-[-.02em] md:text-2xl">{useCase.title[locale]}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{useCase.description[locale]}</p>
                  <div className="mt-auto flex items-center gap-2 pt-7 text-sm font-semibold text-cyan-200">
                    {t.open}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        <section className="mt-16 border-t border-white/10 pt-10" aria-labelledby="observatory-inspect">
          <h2 id="observatory-inspect" className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">
            {t.inspect}
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
            {t.questions.map(([title, body], index) => (
              <div key={title} className="border-t border-white/10 pt-5">
                <div className="text-xs font-semibold text-cyan-300">0{index + 1}</div>
                <h3 className="mt-4 text-base font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-sm leading-6 text-slate-500">{t.note}</p>
        </section>
      </div>
    </main>
  )
}
