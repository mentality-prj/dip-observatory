'use client'

import { useMemo, useState } from 'react'
import { CircleAlert, FlaskConical, Search } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import { gtmDemoSchema } from '../contracts'
import { gtmLabI18n, type GtmLabCopy } from '../i18n'
import type { CommercialContext } from '../import-contracts'
import { fromDemo, fromPipeline, type GtmDecision, type PortfolioItem, type PortfolioModel } from '../portfolio-model'
import { GtmCommercialContext } from './gtm-commercial-context'
import { GtmEvaluationGuide } from './gtm-evaluation-guide'
import { GtmProductionImport } from './gtm-production-import'

type Level = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'
const decisions: GtmDecision[] = ['PURSUE', 'RESEARCH', 'WATCH', 'SKIP']
const tones: Record<GtmDecision, string> = {
  PURSUE: 'ds-state-chip-selected',
  RESEARCH: 'ds-state-chip-uncertainty',
  WATCH: 'ds-state-chip-risk',
  SKIP: 'ds-state-chip-blocked',
}
const decisionText: Record<GtmDecision, string> = {
  PURSUE: 'ds-state-selected',
  RESEARCH: 'ds-state-uncertainty',
  WATCH: 'ds-state-risk',
  SKIP: 'ds-state-blocked',
}
const pct = (value: number) => `${Math.round(value * 100)}%`
const level = (value: number): Exclude<Level, 'ALL'> => (value >= 0.7 ? 'HIGH' : value >= 0.4 ? 'MEDIUM' : 'LOW')

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 py-3">
      <span className="text-xs text-slate-500">{label}</span>
      <b className="block text-xl font-medium">{value}</b>
    </div>
  )
}
function List({ title, items, tone = 'text-slate-300' }: { title: string; items: string[]; tone?: string }) {
  if (!items.length) return null
  return (
    <section className="mt-7">
      <h3 className={`text-xs font-semibold tracking-wider ${tone}`}>{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </section>
  )
}

function CompanyAnalysis({
  item,
  model,
  locale,
  t,
}: {
  item: PortfolioItem
  model: PortfolioModel
  locale: Locale
  t: GtmLabCopy
}) {
  return (
    <article className="min-w-0 border border-white/10 bg-white/[.04] p-6 md:p-8">
      <div className="border-b border-white/10 pb-5">
        <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">{t.recommendation}</div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <strong className={`text-3xl font-medium tracking-[-.03em] ${decisionText[item.decision]}`}>
            {t.decisions[item.decision]}
          </strong>
          <span className="text-xs text-slate-500">{item.domain ?? '—'}</span>
        </div>
        <h2 className="mt-2 text-xl font-medium text-slate-200">{item.name}</h2>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label={t.opportunity} value={pct(item.opportunity)} />
        <Metric label={t.uncertainty} value={pct(item.uncertainty)} />
        <Metric label={t.quality} value={pct(item.evidenceQuality)} />
        <Metric label={t.fit} value={pct(item.qdipFit)} />
        <Metric label={t.confidence} value={item.confidence == null ? '—' : pct(item.confidence)} />
      </div>
      <List title={t.why} items={item.reasons} tone="ds-state-success" />
      <List title={t.risks} items={item.risks} tone="ds-state-blocked" />
      <List title={t.unknown} items={item.missingInformation} tone="ds-state-uncertainty" />
      {item.decision === 'RESEARCH' && (
        <List title={t.research} items={item.researchObjectives} tone="text-amber-300" />
      )}
      <section className="mt-7">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400">{t.evidence}</h3>
        {item.evidence.length ? (
          <div className="mt-3 space-y-3">
            {item.evidence.map((evidence) => (
              <div key={evidence.id} className="border border-white/10 p-4">
                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span
                    className={
                      evidence.kind === 'HYPOTHESIS' || evidence.kind === 'UNKNOWN'
                        ? 'ds-state-uncertainty'
                        : 'ds-state-success'
                    }
                  >
                    {evidence.kind ? t.evidenceKinds[evidence.kind] : t.evidenceKinds.SOURCED}
                  </span>
                  <span className="text-slate-500">
                    {evidence.sourceType} · {evidence.source}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{evidence.content}</p>
                {evidence.observedAt && (
                  <div className="mt-2 text-xs text-slate-500">
                    {new Date(evidence.observedAt).toLocaleDateString(locale)}
                    {evidence.confidence == null ? '' : ` · ${t.confidence.toLowerCase()} ${pct(evidence.confidence)}`}
                    {evidence.freshness == null ? '' : ` · ${t.freshness.toLowerCase()} ${pct(evidence.freshness)}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t.unavailable}</p>
        )}
      </section>
      {item.capability && (
        <section className="mt-7 border border-sky-400/20 p-5">
          <h3 className="text-xs font-semibold tracking-wider text-sky-300">{t.fit}</h3>
          <p className="mt-2 text-lg font-bold">{item.capability.name}</p>
          {item.capability.problem && <p className="mt-2 text-sm text-slate-300">{item.capability.problem}</p>}
          <List title={t.rationale} items={item.capability.rationale} />
        </section>
      )}
      <section className="mt-7 border-t border-white/10 pt-5">
        <h3 className="text-xs font-semibold tracking-wider ds-state-selected">{t.next}</h3>
        {item.nextAction ? (
          <>
            <p className="mt-2 text-lg font-bold">{item.nextAction.title}</p>
            {item.nextAction.description && (
              <p className="mt-2 text-sm text-slate-300">{item.nextAction.description}</p>
            )}
            {item.nextAction.targetRole && (
              <p className="mt-2 text-xs text-slate-500">
                {t.target}: {item.nextAction.targetRole}
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-slate-500">{t.unavailable}</p>
        )}
      </section>
      <details className="mt-7 border-t border-white/10 pt-4">
        <summary className="cursor-pointer text-sm font-bold">{t.details}</summary>
        <dl className="mt-3 grid gap-2 text-xs text-slate-400">
          <div>
            {t.source}: {t.sources[model.source]}
          </div>
          <div>
            {t.runDataset}: {model.id}
          </div>
          <div>
            {t.status}: {model.status}
          </div>
          {item.provenance && (
            <>
              <div>
                {t.decisionId}: {item.provenance.decisionId}
              </div>
              <div>
                {t.plugin}: {item.provenance.pluginId} {item.provenance.pluginVersion ?? ''}
              </div>
              <div>
                {t.model}: {item.provenance.modelVersion ?? '—'}
              </div>
              <div>
                {t.trace}: {item.provenance.traceId ?? '—'}
              </div>
            </>
          )}
        </dl>
      </details>
    </article>
  )
}

export function GtmLabWorkspace({ locale }: { locale: Locale }) {
  const t = gtmLabI18n[locale]
  const [commercialContext, setCommercialContext] = useState<CommercialContext | null>(null)
  const [model, setModel] = useState<PortfolioModel | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [decision, setDecision] = useState<GtmDecision | 'ALL'>('ALL')
  const [industry, setIndustry] = useState('ALL')
  const [query, setQuery] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const acceptModel = (next: PortfolioModel) => {
    setModel(next)
    setSelected(next.items[0]?.id ?? null)
    setDecision('ALL')
    setError(null)
  }
  async function runDemo() {
    setRunning(true)
    setError(null)
    try {
      const response = await fetch('/api/gtm-lab/demo', { method: 'POST' })
      const json = await response.json()
      if (!response.ok) throw new Error(t.evaluationFailed)
      acceptModel(fromDemo(gtmDemoSchema.parse(json)))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.evaluationFailed)
    } finally {
      setRunning(false)
    }
  }
  const industries = useMemo(
    () =>
      [
        ...new Set(model?.items.map((item) => item.industry).filter((value): value is string => Boolean(value)) ?? []),
      ].sort(),
    [model]
  )
  const visible = useMemo(
    () =>
      model?.items.filter(
        (item) =>
          (decision === 'ALL' || item.decision === decision) &&
          (industry === 'ALL' || item.industry === industry) &&
          item.name.toLowerCase().includes(query.trim().toLowerCase())
      ) ?? [],
    [model, decision, industry, query]
  )
  const active = model?.items.find((item) => item.id === selected) ?? visible[0]
  const counts = useMemo(
    () =>
      Object.fromEntries(
        decisions.map((value) => [value, model?.items.filter((item) => item.decision === value).length ?? 0])
      ),
    [model]
  )

  return (
    <main className="min-h-[calc(100vh-7rem)] text-white">
      <div className="mx-auto max-w-[1540px] px-5 py-8 md:px-10 lg:py-12">
        <header className="border-b border-white/15 pb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-[.18em] ds-text-accent">QDIP · GTM LAB</span>
            {model && (
              <span className="border border-amber-300/30 px-3 py-1 text-xs font-bold text-amber-200">
                {model.source === 'DEMO' ? t.demo : t.imported}
              </span>
            )}
          </div>
          <h1 className="mt-5 text-4xl font-medium md:text-6xl">GTM Lab</h1>
          <p className="mt-3 max-w-3xl text-slate-400">{t.subtitle}</p>
        </header>
        {!model && (
          <>
            <GtmCommercialContext locale={locale} value={commercialContext} onChange={setCommercialContext} />
            <GtmEvaluationGuide locale={locale} />
            <section className="mt-6 border border-emerald-400/20 bg-emerald-400/[.03] p-5">
              <h2 className="text-lg font-medium">{t.onboarding.demoTitle}</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">{t.onboarding.demoDescription}</p>
              <button
                onClick={() => void runDemo()}
                disabled={running}
                className="mt-4 bg-emerald-500 px-5 py-2.5 font-bold text-slate-950 disabled:opacity-50"
              >
                {running ? t.running : t.onboarding.demoAction}
              </button>
              <span className="sr-only" aria-live="polite">
                {running ? t.running : ''}
              </span>
            </section>
            <GtmProductionImport
              locale={locale}
              commercialContext={commercialContext}
              onEvaluated={(run) => acceptModel(fromPipeline(run))}
            />
          </>
        )}
        {error && (
          <div role="alert" className="mt-6 border border-rose-400/30 p-4 text-rose-200">
            <CircleAlert className="mr-2 inline h-4 w-4" />
            {error}
          </div>
        )}
        {!model && !error && (
          <div className="mt-7 flex min-h-[180px] items-center justify-center border border-dashed border-white/15 bg-white/[.03] text-center">
            <div className="max-w-lg">
              <FlaskConical className="mx-auto h-10 w-10 ds-text-accent" />
              <p className="mt-4 text-slate-400">{t.empty}</p>
            </div>
          </div>
        )}
        {model && (
          <>
            <section aria-label={t.portfolioSummary} className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-5">
              <div className="border border-white/10 bg-white/[.04] p-4">
                <div className="text-xs text-slate-500">{t.portfolio}</div>
                <b className="text-2xl">{model.items.length}</b>
                <div className="text-xs text-slate-500">{t.records}</div>
              </div>
              {decisions.map((value) => (
                <button
                  key={value}
                  onClick={() => setDecision(value)}
                  aria-pressed={decision === value}
                  className={`border bg-white/[.04] p-4 text-left ${tones[value]}`}
                >
                  <div className="text-xs font-bold">{t.decisions[value]}</div>
                  <b className="text-2xl">{counts[value]}</b>
                </button>
              ))}
            </section>
            {model.failed > 0 && (
              <p role="status" className="mb-4 border border-amber-400/20 p-3 text-sm text-amber-200">
                {t.failedRecords(model.failed)}
              </p>
            )}
            <section className="grid gap-5 xl:grid-cols-[430px_1fr]">
              <aside className="min-w-0">
                <label className="relative block">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <span className="sr-only">{t.search}</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.search}
                    className="w-full border border-white/10 bg-white/[.04] py-2.5 pl-9 pr-3"
                  />
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select
                    aria-label={t.decision}
                    value={decision}
                    onChange={(event) => setDecision(event.target.value as GtmDecision | 'ALL')}
                    className="border border-white/10 bg-slate-950 p-2"
                  >
                    <option value="ALL">{t.all}</option>
                    {decisions.map((value) => (
                      <option key={value} value={value}>
                        {t.decisions[value]}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={t.industry}
                    value={industry}
                    onChange={(event) => setIndustry(event.target.value)}
                    className="border border-white/10 bg-slate-950 p-2"
                  >
                    <option value="ALL">
                      {t.industry}: {t.all}
                    </option>
                    {industries.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 space-y-2" role="list">
                  {visible.map((item) => (
                    <button
                      role="listitem"
                      key={item.id}
                      onClick={() => setSelected(item.id)}
                      className={`w-full border p-4 text-left ${selected === item.id ? 'border-sky-400/40 bg-sky-400/[.06]' : 'border-white/10 bg-white/[.03]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <b>{item.name}</b>
                          <div className="mt-1 text-xs text-slate-500">{item.industry ?? item.domain ?? '—'}</div>
                        </div>
                        <span className={`text-xs font-bold ${decisionText[item.decision]}`}>
                          {t.decisions[item.decision]}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <span>
                          {t.opportunity}
                          <b className="block">{t.levels[level(item.opportunity)]}</b>
                        </span>
                        <span>
                          {t.uncertainty}
                          <b className="block">{t.levels[level(item.uncertainty)]}</b>
                        </span>
                        <span>
                          {t.quality}
                          <b className="block">{t.levels[level(item.evidenceQuality)]}</b>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
              {active ? (
                <CompanyAnalysis item={active} model={model} locale={locale} t={t} />
              ) : (
                <div className="border border-white/10 p-6 text-slate-500">{t.unavailable}</div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
