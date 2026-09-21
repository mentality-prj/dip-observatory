'use client'

import { useMemo, useState } from 'react'
import { CircleAlert, Play, RotateCcw, Route, Users } from 'lucide-react'
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
    run: 'Розрахувати рекомендований розподіл',
    running: 'Розрахунок…',
    whatIf: 'ЩО ЗМІНИЛОСЯ СЬОГОДНІ',
    profile: 'Профіль даних',
    imported: 'Імпортовані дані',
    capacity: 'Зміна доступної потужності від базового плану',
    inaccessible: 'Локація недоступна для виїзду',
    none: 'Немає',
    state: 'ДАНІ ТА ПОТОЧНА СИТУАЦІЯ',
    communities: 'Громади',
    teams: 'Команди',
    opening: 'Одиниці потреб',
    services: 'Види послуг',
    days: 'днів',
    emptyText:
      'QDIP врахує потреби, спеціалізації команд, їх поточне розташування, доступність локацій і переміщення на весь плановий період.',
    valueProp:
      'QDIP допомагає визначити, куди направити мобільні команди, щоб покрити більше пріоритетних потреб наявними ресурсами.',
    startHint: 'Перевірте дані та умови зліва, після чого запустіть розрахунок.',
    weekly: 'РЕКОМЕНДОВАНИЙ ПЛАН',
    weeklyTitle: 'Куди направити команди',
    served: 'покрито сьогодні',
    moved: 'Змінять локацію',
    needsStart: 'Потреб на початку дня',
    needsServed: 'Буде покрито',
    needsUnmet: 'Залишок після дня',
    alternatives: 'ІНШІ ДОПУСТИМІ ВАРІАНТИ',
    recommended: 'Рекомендований план',
    alternative: 'Альтернатива',
    why: 'ЧОМУ QDIP РЕКОМЕНДУЄ ЦЕЙ ПЛАН',
    whyTitle: 'Перевірте логіку рекомендації перед рішенням',
    tryOwnData: 'Спробувати на своїх даних',
    baselineCapacityHint: '100% — поточна запланована доступність; нижче або вище — what-if сценарій.',
    unavailableHint: 'Симуляція ситуації, коли мобільні команди тимчасово не можуть працювати в обраній локації.',
    reviewRecommendation: 'Перевірити рекомендацію',
    testOwnPlan: 'Перевірити свій варіант',
    moves: 'переміщень',
    travel: 'вартість переміщень',
    rawEvidence: 'Детальні показники моделі',
    rationalePriority: 'Пріоритетні потреби',
    rationaleHorizon: 'Планування всього горизонту',
    rationaleConstraints: 'Компетенції та обмеження',
    rationaleCost: 'Переміщення та вартість',
    heuristic:
      'Для великих просторів рішень використовується детермінований branch-aware beam search; інтерфейс не називає евристичний результат математично гарантованим глобальним оптимумом.',
  },
  en: {
    title: 'Mobile team allocation plan',
    run: 'Calculate recommended allocation',
    running: 'Calculating…',
    whatIf: 'WHAT CHANGED TODAY',
    profile: 'Data profile',
    imported: 'Imported data',
    capacity: 'Available capacity versus the baseline plan',
    inaccessible: 'Location unavailable for field work',
    none: 'None',
    state: 'DATA AND CURRENT SITUATION',
    communities: 'Communities',
    teams: 'Teams',
    opening: 'Demand units',
    services: 'Service types',
    days: 'days',
    emptyText:
      'QDIP accounts for needs, team skills, current locations, location availability and movement across the full planning horizon.',
    valueProp:
      'QDIP helps decide where to send mobile teams so more priority needs are covered with the resources already available.',
    startHint: 'Review the data and conditions on the left, then run the calculation.',
    weekly: 'RECOMMENDED PLAN',
    weeklyTitle: 'Where to send teams',
    served: 'covered today',
    moved: 'Teams changing location',
    needsStart: 'Needs at start of day',
    needsServed: 'Expected covered',
    needsUnmet: 'Remaining after the day',
    alternatives: 'OTHER FEASIBLE OPTIONS',
    recommended: 'Recommended plan',
    alternative: 'Alternative',
    why: 'WHY QDIP RECOMMENDS THIS PLAN',
    whyTitle: 'Review the recommendation logic before deciding',
    tryOwnData: 'Try your own data',
    baselineCapacityHint: '100% is the currently planned availability; lower or higher values are what-if scenarios.',
    unavailableHint: 'Simulate a location that mobile teams temporarily cannot serve.',
    reviewRecommendation: 'Review the recommendation',
    testOwnPlan: 'Test your own plan',
    moves: 'moves',
    travel: 'movement cost',
    rawEvidence: 'Detailed model metrics',
    rationalePriority: 'Priority needs',
    rationaleHorizon: 'Full-horizon planning',
    rationaleConstraints: 'Skills and constraints',
    rationaleCost: 'Movement and cost',
    heuristic:
      'Large decision spaces use deterministic branch-aware beam search; the interface does not present a heuristic result as a mathematically guaranteed global optimum.',
  },
  pl: {
    title: 'Plan alokacji zespołów mobilnych',
    run: 'Oblicz rekomendowany przydział',
    running: 'Obliczanie…',
    whatIf: 'CO ZMIENIŁO SIĘ DZISIAJ',
    profile: 'Profil danych',
    imported: 'Dane importowane',
    capacity: 'Zmiana dostępnej zdolności względem planu bazowego',
    inaccessible: 'Lokalizacja niedostępna dla zespołów',
    none: 'Brak',
    state: 'DANE I BIEŻĄCA SYTUACJA',
    communities: 'Społeczności',
    teams: 'Zespoły',
    opening: 'Jednostki potrzeb',
    services: 'Rodzaje usług',
    days: 'dni',
    emptyText:
      'QDIP uwzględnia potrzeby, kompetencje zespołów, bieżące lokalizacje, dostępność i przemieszczenia w całym horyzoncie planowania.',
    valueProp:
      'QDIP pomaga zdecydować, dokąd skierować zespoły mobilne, aby pokryć więcej priorytetowych potrzeb przy dostępnych zasobach.',
    startHint: 'Sprawdź dane i warunki po lewej stronie, a następnie uruchom obliczenie.',
    weekly: 'REKOMENDOWANY PLAN',
    weeklyTitle: 'Dokąd skierować zespoły',
    served: 'pokryto dziś',
    moved: 'Zespoły zmieniające lokalizację',
    needsStart: 'Potrzeby na początku dnia',
    needsServed: 'Zostanie pokryte',
    needsUnmet: 'Pozostanie po dniu',
    alternatives: 'INNE DOPUSZCZALNE WARIANTY',
    recommended: 'Rekomendowany plan',
    alternative: 'Alternatywa',
    why: 'DLACZEGO QDIP REKOMENDUJE TEN PLAN',
    whyTitle: 'Sprawdź logikę rekomendacji przed decyzją',
    tryOwnData: 'Wypróbuj własne dane',
    baselineCapacityHint: '100% oznacza bieżącą planowaną dostępność; niższe lub wyższe wartości to scenariusz what-if.',
    unavailableHint: 'Symulacja sytuacji, w której zespoły mobilne tymczasowo nie mogą obsługiwać wybranej lokalizacji.',
    reviewRecommendation: 'Sprawdź rekomendację',
    testOwnPlan: 'Sprawdź własny wariant',
    moves: 'przemieszczeń',
    travel: 'koszt przemieszczeń',
    rawEvidence: 'Szczegółowe wskaźniki modelu',
    rationalePriority: 'Potrzeby priorytetowe',
    rationaleHorizon: 'Planowanie całego horyzontu',
    rationaleConstraints: 'Kompetencje i ograniczenia',
    rationaleCost: 'Przemieszczenia i koszt',
    heuristic:
      'Dla dużych przestrzeni decyzyjnych używany jest deterministyczny branch-aware beam search; interfejs nie przedstawia wyniku heurystyki jako matematycznie gwarantowanego optimum globalnego.',
  },
} satisfies Record<Locale, Record<string, string>>

function countPlanMoves(
  daily: Array<{ recommended: { assignments: Record<string, string | null> } }>,
  initial: Record<string, string | null>
) {
  let previous = { ...initial }
  let moves = 0
  for (const day of daily) {
    for (const [team, target] of Object.entries(day.recommended.assignments)) {
      if (target !== null && previous[team] !== target) moves += 1
    }
    previous = { ...previous, ...day.recommended.assignments }
  }
  return moves
}

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
  const topPriorityCommunities = useMemo(
    () =>
      inputData.communities
        .map((community) => {
          const base = community.demand ?? []
          const daily = Object.values(community.daily_demand ?? {}).flat()
          const priorityUnits = [...base, ...daily]
            .filter((item) => item.priority === 'critical' || item.priority === 'high')
            .reduce((sum, item) => sum + item.units, 0)
          return { id: community.id, priorityUnits }
        })
        .filter((item) => item.priorityUnits > 0)
        .sort((a, b) => b.priorityUnits - a.priorityUnits)
        .slice(0, 2),
    [inputData]
  )
  const sourceBadge =
    profileId === 'imported'
      ? `${locale === 'uk' ? 'Імпортований набір' : locale === 'pl' ? 'Zaimportowany zestaw' : 'Imported dataset'} · ${importedName ?? ''}`
      : locale === 'uk'
        ? 'Demo dataset · synthetic aggregate data · без персональних даних'
        : locale === 'pl'
          ? 'Demo dataset · syntetyczne dane zagregowane · bez danych osobowych'
          : 'Demo dataset · synthetic aggregate data · no beneficiary PII'

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
            <span data-testid="resource-data-source" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs">
              {sourceBadge}
            </span>
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-4xl text-lg leading-relaxed text-slate-300">{t.valueProp}</p>
          <p className="mt-4 text-slate-400">{summary}</p>
          <p className="mt-2 text-xs text-slate-600">
            {profileLabel(profileId, importedName, t.imported)}
          </p>
        </header>


        <section className="grid min-w-0 gap-5 py-6 xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-4">
            <div className="order-2 rounded-[var(--radius-card)] border border-white/10 bg-slate-950/70 p-6 text-white">
              <div className="flex items-center justify-between">
                <b>{t.whatIf}</b>
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
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{t.baselineCapacityHint}</p>
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
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{t.unavailableHint}</p>
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

            <details className="order-3 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03] p-4">
              <summary className="cursor-pointer text-sm font-bold text-rose-200">{t.tryOwnData}</summary>
              <div className="mt-3">
                <ResourceAllocationImport locale={locale} onImported={useImportedData} />
              </div>
            </details>

            <div className="order-1 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
              <b>01 · {t.state}</b>
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
                  <p className="mt-3 text-slate-400">{t.emptyText}</p>
                  <p className="mt-4 text-sm font-semibold text-rose-200">{t.startHint}</p>
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
                  planningDays={stats.days}
                  locale={locale}
                />

                <div className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">03 · {t.weekly}</div>
                      <h2 className="mt-2 text-2xl font-black">
                        {t.weeklyTitle} · {stats.days} {t.days}
                      </h2>
                    </div>
                    <details className="min-w-0 max-w-full text-left text-xs text-slate-500 sm:text-right">
                      <summary className="cursor-pointer font-semibold text-slate-500">Technical details</summary>
                      <div className="mt-2 break-words [overflow-wrap:anywhere]">{result.engine_version}</div>
                      <div className="break-words [overflow-wrap:anywhere]">
                        {result.solver} · evaluated {result.evaluated_plans}
                      </div>
                    </details>
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
                          {t.served}: {item.demand.served.toFixed(0)}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          {t.needsUnmet.toLowerCase()}: {item.demand.closing_unmet.toFixed(0)}
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

                <details className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03]">
                  <summary className="cursor-pointer p-6 text-lg font-black">{t.reviewRecommendation}</summary>
                  <div className="grid gap-5 border-t border-white/10 p-6 lg:grid-cols-[.8fr_1.2fr]">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">{t.alternatives}</div>
                      <div className="mt-4 space-y-2">
                        {result.alternatives.map((alternative, index) => {
                          const planMoves = countPlanMoves(alternative.daily, currentAllocation)
                          return (
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
                              <div className="flex justify-between gap-3">
                                <b>{index === 0 ? t.recommended : `${t.alternative} ${index + 1}`}</b>
                                <span>{pct(alternative.aggregate_metrics.priority_coverage)}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {t.needsServed.toLowerCase()} {alternative.demand_summary.served.toFixed(0)} ·{' '}
                                {t.needsUnmet.toLowerCase()} {alternative.demand_summary.closing_unmet.toFixed(0)}
                              </div>
                              <div className="mt-1 text-xs text-slate-600">
                                {planMoves} {t.moves} · {t.travel} {alternative.aggregate_metrics.travel_cost.toFixed(0)}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">{t.why}</div>
                      <h3 className="mt-2 text-xl font-black">{t.whyTitle}</h3>
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="border-l-2 border-rose-300/40 pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t.rationalePriority}</b>
                          {topPriorityCommunities.length > 0
                            ? `${topPriorityCommunities.map((item) => item.id).join(', ')} · ${topPriorityCommunities.reduce((sum, item) => sum + item.priorityUnits, 0)}`
                            : t.emptyText}
                        </div>
                        <div className="border-l-2 border-rose-300/40 pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t.rationaleHorizon}</b>
                          {locale === 'uk'
                            ? `QDIP оцінює всі ${stats.days} днів разом: місце завершення одного дня впливає на можливості наступного.`
                            : locale === 'pl'
                              ? `QDIP ocenia wszystkie ${stats.days} dni łącznie: lokalizacja na koniec dnia wpływa na możliwości kolejnego.`
                              : `QDIP evaluates all ${stats.days} days together: where a team ends one day changes what is feasible next.`}
                        </div>
                        <div className="border-l-2 border-rose-300/40 pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t.rationaleConstraints}</b>
                          {locale === 'uk'
                            ? 'Розподіл враховує спеціалізації команд, доступність локацій та допустимі призначення.'
                            : locale === 'pl'
                              ? 'Przydział uwzględnia kompetencje zespołów, dostępność lokalizacji i dopuszczalne przydziały.'
                              : 'Allocation respects team skills, location availability and feasible assignments.'}
                        </div>
                        <div className="border-l-2 border-rose-300/40 pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t.rationaleCost}</b>
                          {locale === 'uk'
                            ? `План використовує ${countPlanMoves(activePlan.daily, currentAllocation)} переміщень; оцінена вартість переміщень — ${activePlan.aggregate_metrics.travel_cost.toFixed(0)}.`
                            : locale === 'pl'
                              ? `Plan wykorzystuje ${countPlanMoves(activePlan.daily, currentAllocation)} przemieszczeń; szacowany koszt przemieszczeń to ${activePlan.aggregate_metrics.travel_cost.toFixed(0)}.`
                              : `The plan uses ${countPlanMoves(activePlan.daily, currentAllocation)} moves; estimated movement cost is ${activePlan.aggregate_metrics.travel_cost.toFixed(0)}.`}
                        </div>
                      </div>
                      <details className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-500">
                        <summary className="cursor-pointer font-semibold text-slate-400">{t.rawEvidence}</summary>
                        <div className="mt-3 grid gap-2">
                          {result.evidence.slice(0, 8).map((item, index) => (
                            <div key={`${item}-${index}`}>{item}</div>
                          ))}
                        </div>
                        <div className="mt-4">{t.heuristic}</div>
                      </details>
                    </div>
                  </div>
                </details>

                {lastInput && (
                  <details className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03]">
                    <summary className="cursor-pointer p-6 text-lg font-black">{t.testOwnPlan}</summary>
                    <div className="border-t border-white/10">
                      <ResourceAllocationManualEditor
                        key={`manual-${runRevision}`}
                        input={lastInput}
                        plan={activePlan}
                        referenceMetrics={activePlan.aggregate_metrics}
                        referenceSummary={activePlan.demand_summary}
                        communities={communityNames}
                        teams={teamIds}
                        onUseModified={setManualSelected}
                        locale={locale}
                      />
                    </div>
                  </details>
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
                    moved={countPlanMoves(activePlan.daily, currentAllocation)}
                    totalTeams={inputData.teams.length}
                    planningDays={stats.days}
                    selectionKind={selectedAlternative === 0 ? 'recommended' : 'alternative'}
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
