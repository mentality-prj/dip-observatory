'use client'

import { useMemo, useState } from 'react'
import { CircleAlert, Play, RotateCcw, Route, Users } from 'lucide-react'
import { DecisionWorkflow } from '@/components/product/decision-workflow'
import type { Locale } from '@/lib/observatory-i18n'
import { buildResourceAllocationInput, runResourceAllocationScenario } from '../api'
import type { ResourceAllocationInput, ResourceAllocationResult } from '../contracts'
import {
  cloneResourceAllocationInput,
  RESOURCE_ALLOCATION_PROFILES,
  resourceAllocationStats,
  type ResourceAllocationProfileId,
} from '../demo-data'
import { ResourceAllocationDecisionPanel } from './resource-allocation-decision-panel'
import { ResourceAllocationImpact } from './resource-allocation-impact'
import { ResourceAllocationImport } from './resource-allocation-import'
import {
  ResourceAllocationManualEditor,
  type EvaluatedManualAllocation,
} from './resource-allocation-manual-editor'

const pct = (value: number) => `${Math.round(value * 100)}%`

const copy = {
  uk: {
    title: 'План розподілу мобільних команд',
    run: 'Розрахувати план на тиждень',
    running: 'Розрахунок…',
    whatIf: 'СЦЕНАРІЙ',
    profile: 'Профіль даних',
    imported: 'Імпортовані дані',
    capacity: 'Доступна потужність команд',
    inaccessible: 'Тимчасово недоступна громада',
    none: 'Немає',
    state: 'ОПЕРАЦІЙНА СИТУАЦІЯ',
    communities: 'Громади',
    teams: 'Команди',
    opening: 'Початкові потреби',
    services: 'Види послуг',
    days: 'днів',
    emptyText:
      'Розташування команди сьогодні впливає на те, які громади вона зможе обслуговувати далі протягом тижня. QDIP розрахує узгоджений план на весь горизонт.',
    weekly: 'ПЛАН НА ТИЖДЕНЬ',
    weeklyTitle: 'Куди направити команди кожного дня',
    served: 'покрито',
    moved: 'Змінять локацію',
    needsStart: 'Потреб на початку дня',
    needsServed: 'Буде покрито',
    needsUnmet: 'Залишиться без покриття',
    alternatives: 'ВАРІАНТИ РІШЕННЯ',
    recommended: 'Рекомендований план',
    alternative: 'Альтернатива',
    why: 'ОБҐРУНТУВАННЯ РІШЕННЯ',
    whyTitle: 'Чому рекомендовано саме цей план?',
    heuristic:
      'Для великих просторів рішень використовується детермінований branch-aware beam search; інтерфейс не називає евристичний результат математично гарантованим глобальним оптимумом.',
  },
  en: {
    title: 'Mobile team allocation plan',
    run: 'Calculate weekly plan',
    running: 'Calculating…',
    whatIf: 'SCENARIO',
    profile: 'Data profile',
    imported: 'Imported data',
    capacity: 'Available team capacity',
    inaccessible: 'Temporarily inaccessible community',
    none: 'None',
    state: 'OPERATIONAL STATE',
    communities: 'Communities',
    teams: 'Teams',
    opening: 'Opening needs',
    services: 'Service types',
    days: 'days',
    emptyText:
      'A team location today changes which communities remain reachable later in the week. QDIP calculates one coherent plan across the full horizon.',
    weekly: 'WEEKLY PLAN',
    weeklyTitle: 'Where to send teams each day',
    served: 'covered',
    moved: 'Teams changing location',
    needsStart: 'Needs at start of day',
    needsServed: 'Expected covered',
    needsUnmet: 'Expected uncovered',
    alternatives: 'DECISION OPTIONS',
    recommended: 'Recommended plan',
    alternative: 'Alternative',
    why: 'DECISION RATIONALE',
    whyTitle: 'Why is this plan recommended?',
    heuristic:
      'Large decision spaces use deterministic branch-aware beam search; the interface does not present a heuristic result as a mathematically guaranteed global optimum.',
  },
  pl: {
    title: 'Plan alokacji zespołów mobilnych',
    run: 'Oblicz plan tygodniowy',
    running: 'Obliczanie…',
    whatIf: 'SCENARIUSZ',
    profile: 'Profil danych',
    imported: 'Dane importowane',
    capacity: 'Dostępna zdolność zespołów',
    inaccessible: 'Tymczasowo niedostępna społeczność',
    none: 'Brak',
    state: 'SYTUACJA OPERACYJNA',
    communities: 'Społeczności',
    teams: 'Zespoły',
    opening: 'Potrzeby początkowe',
    services: 'Rodzaje usług',
    days: 'dni',
    emptyText:
      'Lokalizacja zespołu dzisiaj wpływa na to, które społeczności pozostają dostępne w kolejnych dniach. QDIP oblicza spójny plan dla całego horyzontu.',
    weekly: 'PLAN TYGODNIOWY',
    weeklyTitle: 'Dokąd skierować zespoły każdego dnia',
    served: 'pokryto',
    moved: 'Zespoły zmieniające lokalizację',
    needsStart: 'Potrzeby na początku dnia',
    needsServed: 'Zostanie pokryte',
    needsUnmet: 'Pozostanie bez pokrycia',
    alternatives: 'WARIANTY DECYZJI',
    recommended: 'Rekomendowany plan',
    alternative: 'Alternatywa',
    why: 'UZASADNIENIE DECYZJI',
    whyTitle: 'Dlaczego rekomendowany jest ten plan?',
    heuristic:
      'Dla dużych przestrzeni decyzyjnych używany jest deterministyczny branch-aware beam search; interfejs nie przedstawia wyniku heurystyki jako matematycznie gwarantowanego optimum globalnego.',
  },
} satisfies Record<Locale, Record<string, string>>

function profileLabel(profileId: string, importedName: string | null, importedLabel: string) {
  if (profileId === 'imported') return importedName ? `${importedLabel}: ${importedName}` : importedLabel
  return RESOURCE_ALLOCATION_PROFILES[profileId as ResourceAllocationProfileId]?.label ?? profileId
}

export function ResourceAllocationWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [profileId, setProfileId] = useState<string>('responsible-citizens')
  const [importedName, setImportedName] = useState<string | null>(null)
  const [inputData, setInputData] = useState<ResourceAllocationInput>(() =>
    cloneResourceAllocationInput(RESOURCE_ALLOCATION_PROFILES['responsible-citizens'].input)
  )
  const [result, setResult] = useState<ResourceAllocationResult | null>(null)
  const [selectedAlternative, setSelectedAlternative] = useState(0)
  const [selectedDay, setSelectedDay] = useState(0)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capacityFactor, setCapacityFactor] = useState(100)
  const [blockedCommunity, setBlockedCommunity] = useState('')
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null)
  const [manualSelected, setManualSelected] = useState<EvaluatedManualAllocation | null>(null)
  const [runRevision, setRunRevision] = useState(0)

  const stats = useMemo(() => resourceAllocationStats(inputData), [inputData])
  const communityNames = useMemo(() => inputData.communities.map((community) => community.id), [inputData])
  const blockableCommunities = useMemo(
    () => inputData.communities.filter((community) => community.accessible !== false).map((community) => community.id),
    [inputData]
  )
  const teamIds = useMemo(() => inputData.teams.map((team) => team.id), [inputData])
  const currentAllocation = useMemo(
    () =>
      inputData.current_allocation ??
      Object.fromEntries(inputData.teams.map((team) => [team.id, team.current_community ?? null])),
    [inputData]
  )
  const summary = `${stats.teams} ${t.teams.toLowerCase()} · ${stats.communities} ${t.communities.toLowerCase()} · ${stats.openingNeeds} ${t.opening.toLowerCase()} · ${stats.days} ${t.days}`

  function resetRunState() {
    setCapacityFactor(100)
    setBlockedCommunity('')
    setResult(null)
    setLastInput(null)
    setManualSelected(null)
    setSelectedAlternative(0)
    setSelectedDay(0)
  }

  function changeProfile(nextProfileId: ResourceAllocationProfileId) {
    setProfileId(nextProfileId)
    setImportedName(null)
    setInputData(cloneResourceAllocationInput(RESOURCE_ALLOCATION_PROFILES[nextProfileId].input))
    resetRunState()
  }

  function useImportedData(input: ResourceAllocationInput, fileName: string) {
    setProfileId('imported')
    setImportedName(fileName)
    setInputData(input)
    resetRunState()
  }

  async function run() {
    setRunning(true)
    setError(null)
    setManualSelected(null)
    const scenario = {
      capacity_factor: capacityFactor / 100,
      inaccessible_communities: blockedCommunity ? [blockedCommunity] : [],
    }
    try {
      const nextResult = await runResourceAllocationScenario(inputData, scenario)
      setResult(nextResult)
      setLastInput(buildResourceAllocationInput(inputData, scenario) as Record<string, unknown>)
      setSelectedAlternative(0)
      setSelectedDay(0)
      setRunRevision((revision) => revision + 1)
    } catch (reason) {
      setResult(null)
      setLastInput(null)
      setError(reason instanceof Error ? reason.message : 'DIP request failed')
    } finally {
      setRunning(false)
    }
  }

  const activePlan = result
    ? (result.alternatives[selectedAlternative] ?? {
        daily: result.daily,
        aggregate_metrics: result.aggregate_metrics,
        demand_summary: result.demand_summary,
        period_score: 0,
      })
    : null
  const day = activePlan?.daily[selectedDay] ?? null
  const moved = useMemo(
    () =>
      day
        ? Object.entries(day.recommended.assignments).filter(
            ([team, target]) => currentAllocation[team] !== target
          ).length
        : 0,
    [currentAllocation, day]
  )

  return (
    <main className="resource-allocation-workspace min-h-[calc(100vh-7rem)] w-full max-w-full overflow-x-clip bg-transparent text-white">
      <div className="mx-auto w-full max-w-[1540px] min-w-0 px-4 py-6 sm:px-5 md:px-8 lg:px-10 lg:py-12">
        <header className="border-b border-white/15 pb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[.18em] text-rose-300">
              QDIP · Resource Allocation · Decision Demo
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs">
              Synthetic / aggregate operational data · no beneficiary PII
            </span>
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{t.title}</h1>
          <p className="mt-4 text-slate-400">{summary}</p>
          <p className="mt-2 text-xs text-slate-600">
            {profileLabel(profileId, importedName, t.imported)}
          </p>
        </header>

        <DecisionWorkflow locale={locale} tone="dark" compact />

        <section className="grid min-w-0 gap-5 py-6 xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-4">
            <div className="rounded-[var(--radius-card)] border border-white/10 bg-slate-950/70 p-6 text-white">
              <div className="flex items-center justify-between">
                <b>01 · {t.whatIf}</b>
                <button type="button" onClick={resetRunState} aria-label="Reset scenario">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <label className="mt-6 block text-sm">
                <span>{t.profile}</span>
                <select
                  data-testid="resource-profile"
                  className="mt-2 w-full border border-white/15 bg-slate-950 p-2 text-white [color-scheme:dark]"
                  value={profileId}
                  onChange={(event) => {
                    if (event.target.value === 'imported') return
                    changeProfile(event.target.value as ResourceAllocationProfileId)
                  }}
                >
                  {Object.entries(RESOURCE_ALLOCATION_PROFILES).map(([id, profile]) => (
                    <option key={id} value={id} className="bg-slate-950 text-white">
                      {profile.label}
                    </option>
                  ))}
                  {profileId === 'imported' && (
                    <option value="imported" className="bg-slate-950 text-white">
                      {profileLabel(profileId, importedName, t.imported)}
                    </option>
                  )}
                </select>
              </label>

              <label className="mt-5 block text-sm">
                <span className="flex justify-between">
                  <span>{t.capacity}</span>
                  <b>{capacityFactor}%</b>
                </span>
                <input
                  className="mt-3 w-full accent-rose-400"
                  type="range"
                  min="70"
                  max="130"
                  step="5"
                  value={capacityFactor}
                  onChange={(event) => setCapacityFactor(Number(event.target.value))}
                />
              </label>

              <label className="mt-5 block text-sm">
                <span>{t.inaccessible}</span>
                <select
                  data-testid="blocked-community"
                  className="mt-2 w-full border border-white/15 bg-slate-950 p-2 text-white [color-scheme:dark]"
                  value={blockedCommunity}
                  onChange={(event) => setBlockedCommunity(event.target.value)}
                >
                  <option value="" className="bg-slate-950 text-white">
                    {t.none}
                  </option>
                  {blockableCommunities.map((name) => (
                    <option key={name} value={name} className="bg-slate-950 text-white">
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                disabled={running}
                onClick={run}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-rose-500 p-4 font-bold disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {running ? t.running : t.run}
              </button>
            </div>

            <ResourceAllocationImport locale={locale} onImported={useImportedData} />

            <div className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
              <b>02 · {t.state}</b>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="block text-slate-500">{t.communities}</span>
                  <b className="text-2xl" data-testid="community-count">
                    {stats.communities}
                  </b>
                </div>
                <div>
                  <span className="block text-slate-500">{t.teams}</span>
                  <b className="text-2xl" data-testid="team-count">
                    {stats.teams}
                  </b>
                </div>
                <div>
                  <span className="block text-slate-500">{t.opening}</span>
                  <b className="text-2xl">{stats.openingNeeds}</b>
                </div>
                <div>
                  <span className="block text-slate-500">{t.services}</span>
                  <b className="text-2xl">{stats.services}</b>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            {error && (
              <div role="alert" className="border border-rose-300/25 bg-white/[0.04] p-4 text-rose-200">
                <CircleAlert className="mr-2 inline h-4 w-4" />
                {error}
              </div>
            )}

            {!result && (
              <div className="flex min-h-[560px] items-center justify-center border border-dashed border-white/15 bg-white/[0.04] text-center">
                <div className="max-w-xl px-8">
                  <Route className="mx-auto h-11 w-11 text-rose-300" />
                  <h2 data-testid="resource-active-summary" className="mt-5 text-3xl font-black">
                    {stats.teams} {t.teams.toLowerCase()}. {stats.communities} {t.communities.toLowerCase()}.{' '}
                    {stats.openingNeeds} {t.opening.toLowerCase()}. {stats.days} {t.days}.
                  </h2>
                  <p className="mt-3 text-slate-500">{t.emptyText}</p>
                </div>
              </div>
            )}

            {result && activePlan && day && (
              <>
                <ResourceAllocationImpact
                  metrics={activePlan.aggregate_metrics}
                  summary={activePlan.demand_summary}
                  baseline={result.baseline}
                  moved={moved}
                  totalTeams={inputData.teams.length}
                  locale={locale}
                />

                <div className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">03 · {t.weekly}</div>
                      <h2 className="mt-2 text-2xl font-black">{t.weeklyTitle}</h2>
                    </div>
                    <div className="min-w-0 max-w-full break-words text-left text-xs text-slate-600 [overflow-wrap:anywhere] sm:text-right">
                      <div>{result.engine_version}</div>
                      <div>
                        {result.solver} · evaluated {result.evaluated_plans}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {activePlan.daily.map((item, index) => (
                      <button
                        type="button"
                        key={item.day}
                        onClick={() => setSelectedDay(index)}
                        className={`min-w-0 border px-3 py-3 text-left sm:px-4 ${
                          selectedDay === index ? 'border-rose-300/40 bg-rose-300/10' : 'border-white/10'
                        }`}
                      >
                        <b>{item.day}</b>
                        <div className="mt-1 text-xs text-slate-500">
                          {t.served} {item.demand.served.toFixed(0)}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {communityNames.map((community) => (
                      <div key={community} className="min-w-0 min-h-32 border border-white/10 p-3">
                        <b className="break-words text-sm [overflow-wrap:anywhere]">{community}</b>
                        <div className="mt-3 space-y-1">
                          {Object.entries(day.recommended.assignments)
                            .filter(([, target]) => target === community)
                            .map(([team]) => (
                              <div key={team} className="break-words bg-slate-950/70 px-2 py-1 text-xs font-semibold text-white [overflow-wrap:anywhere]">
                                {team}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm">
                    <span>
                      <Users className="mr-1 inline h-4 w-4" />
                      {t.moved}: <b>{moved}</b>
                    </span>
                    <span>
                      {t.needsStart}: <b>{day.demand.opening.toFixed(0)}</b>
                    </span>
                    <span>
                      {t.needsServed}: <b>{day.demand.served.toFixed(0)}</b>
                    </span>
                    <span>
                      {t.needsUnmet}: <b>{day.demand.closing_unmet.toFixed(0)}</b>
                    </span>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
                  <div className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-300">
                      05 · {t.alternatives}
                    </div>
                    <div className="mt-4 space-y-2">
                      {result.alternatives.map((alternative, index) => (
                        <button
                          type="button"
                          key={index}
                          onClick={() => {
                            setSelectedAlternative(index)
                            setSelectedDay(0)
                            setManualSelected(null)
                          }}
                          className={`w-full border p-4 text-left ${
                            selectedAlternative === index
                              ? 'border-rose-300/40 bg-rose-300/10'
                              : 'border-white/10'
                          }`}
                        >
                          <div className="flex justify-between">
                            <b>{index === 0 ? t.recommended : `${t.alternative} ${index + 1}`}</b>
                            <span>{pct(alternative.aggregate_metrics.priority_coverage)}</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {t.needsServed.toLowerCase()} {alternative.demand_summary.served.toFixed(0)} ·{' '}
                            {t.needsUnmet.toLowerCase()} {alternative.demand_summary.closing_unmet.toFixed(0)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-300">06 · {t.why}</div>
                    <h3 className="mt-2 text-xl font-black">{t.whyTitle}</h3>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {result.evidence.slice(0, 8).map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="border-l-2 border-rose-300/40 pl-3 text-sm text-slate-300"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-500">{t.heuristic}</div>
                  </div>
                </div>

                {lastInput && (
                  <ResourceAllocationManualEditor
                    key={`manual-${runRevision}`}
                    input={lastInput}
                    plan={activePlan}
                    communities={communityNames}
                    teams={teamIds}
                    onUseModified={setManualSelected}
                    locale={locale}
                  />
                )}

                {lastInput && (
                  <ResourceAllocationDecisionPanel
                    key={`decision-${runRevision}`}
                    input={lastInput}
                    selected={activePlan as unknown as Record<string, unknown>}
                    manualSelected={manualSelected}
                    priorityCoverage={activePlan.aggregate_metrics.priority_coverage}
                    served={activePlan.demand_summary.served}
                    unmet={activePlan.demand_summary.closing_unmet}
                    locale={locale}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
