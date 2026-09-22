'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { ResourceAllocationManualEditor, type EvaluatedManualAllocation } from './resource-allocation-manual-editor'
import { buildAllocationCsv, localizePlanningDay, summarizeMovements, trackResourceAllocation } from '../presentation'
import { ResourceAllocationAssignmentExplanation } from './resource-allocation-assignment-explanation'

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
    heroQuestion: 'Чи можна покрити більше пріоритетних потреб тими самими командами?',
    differentiation:
      'На відміну від таблиці, QDIP оцінює наслідки розподілу на весь горизонт: де команда опиниться сьогодні впливає на доступні рішення завтра.',
    simulate: 'Симулювати зміну ситуації',
    recalculate: 'Перерахувати план',
    scenarioChanged: 'СЦЕНАРІЙ ЗМІНЕНО',
    technicalDetails: 'Технічні деталі',
    technicalMethod: 'Метод розрахунку',
    fewerMoves: 'Менше переміщень',
    lowerMovement: 'Нижчий індекс переміщень',
    balanced: 'Збалансований варіант',
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
    baselineCapacityHint: '100% — поточна запланована доступність; нижче або вище — сценарій зміни умов.',
    unavailableHint: 'Симуляція ситуації, коли мобільні команди тимчасово не можуть працювати в обраній локації.',
    reviewRecommendation: 'Перевірити рекомендацію',
    testOwnPlan: 'Перевірити свій варіант',
    moves: 'переміщень',
    travel: 'індекс переміщень',
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
    heroQuestion: 'Can the same teams cover more priority demand?',
    differentiation:
      'Unlike a spreadsheet, QDIP evaluates consequences across the full horizon: where a team ends today changes what is feasible tomorrow.',
    simulate: 'Simulate a change',
    recalculate: 'Recalculate plan',
    scenarioChanged: 'SCENARIO CHANGED',
    technicalDetails: 'Technical details',
    technicalMethod: 'Calculation method',
    fewerMoves: 'Fewer moves',
    lowerMovement: 'Lower movement index',
    balanced: 'Balanced option',
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
    baselineCapacityHint:
      '100% is the currently planned availability; lower or higher values simulate changed conditions.',
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
    heroQuestion: 'Czy te same zespoły mogą pokryć więcej potrzeb priorytetowych?',
    differentiation:
      'W przeciwieństwie do arkusza QDIP ocenia skutki w całym horyzoncie: miejsce zakończenia pracy dziś wpływa na możliwości jutro.',
    simulate: 'Symuluj zmianę sytuacji',
    recalculate: 'Przelicz plan',
    scenarioChanged: 'SCENARIUSZ ZMIENIONY',
    technicalDetails: 'Szczegóły techniczne',
    technicalMethod: 'Metoda obliczeń',
    fewerMoves: 'Mniej przemieszczeń',
    lowerMovement: 'Niższy indeks przemieszczeń',
    balanced: 'Wariant zrównoważony',
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
    baselineCapacityHint:
      '100% oznacza bieżącą planowaną dostępność; niższe lub wyższe wartości symulują zmianę warunków.',
    unavailableHint:
      'Symulacja sytuacji, w której zespoły mobilne tymczasowo nie mogą obsługiwać wybranej lokalizacji.',
    reviewRecommendation: 'Sprawdź rekomendację',
    testOwnPlan: 'Sprawdź własny wariant',
    moves: 'przemieszczeń',
    travel: 'indeks kosztu przemieszczeń',
    rawEvidence: 'Szczegółowe wskaźniki modelu',
    rationalePriority: 'Potrzeby priorytetowe',
    rationaleHorizon: 'Planowanie całego horyzontu',
    rationaleConstraints: 'Kompetencje i ograniczenia',
    rationaleCost: 'Przemieszczenia i koszt',
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
  const [selectedExplanationTeam, setSelectedExplanationTeam] = useState<string | null>(null)
  const openedTracked = useRef(false)

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
  const summary = `${stats.teams} ${t.teams.toLowerCase()} · ${stats.communities} ${t.communities.toLowerCase()} · ${stats.horizonNeeds} ${t.opening.toLowerCase()} · ${stats.days} ${t.days}`
  const sourceBadge =
    profileId === 'imported'
      ? `${locale === 'uk' ? 'Імпортований набір' : locale === 'pl' ? 'Zaimportowany zestaw' : 'Imported dataset'} · ${importedName ?? ''}`
      : locale === 'uk'
        ? 'Демо-дані · синтетичні агреговані · без персональних даних'
        : locale === 'pl'
          ? 'Dane demo · syntetyczne i zagregowane · bez danych osobowych'
          : 'Demo dataset · synthetic aggregate data · no beneficiary PII'

  useEffect(() => {
    if (openedTracked.current) return
    openedTracked.current = true
    trackResourceAllocation('ra_demo_opened', locale, {
      profile_type: profileId === 'imported' ? 'imported' : 'demo',
      communities_count: stats.communities,
      teams_count: stats.teams,
      planning_days: stats.days,
    })
  }, [locale, profileId, stats.communities, stats.days, stats.teams])

  function resetRunState() {
    setCapacityFactor(100)
    setBlockedCommunity('')
    setResult(null)
    setLastInput(null)
    setManualSelected(null)
    setSelectedAlternative(0)
    setSelectedDay(0)
    setSelectedExplanationTeam(null)
  }

  function useImportedData(input: ResourceAllocationInput, fileName: string) {
    setProfileId('imported')
    setImportedName(fileName)
    setInputData(input)
    resetRunState()
  }

  async function run() {
    const recalculating = Boolean(result)
    trackResourceAllocation(recalculating ? 'ra_scenario_recalculated' : 'ra_calculation_started', locale, {
      profile_type: profileId === 'imported' ? 'imported' : 'demo',
      communities_count: stats.communities,
      teams_count: stats.teams,
      planning_days: stats.days,
    })
    setRunning(true)
    setError(null)
    setManualSelected(null)
    setSelectedExplanationTeam(null)
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
      trackResourceAllocation('ra_calculation_completed', locale, {
        profile_type: profileId === 'imported' ? 'imported' : 'demo',
        communities_count: stats.communities,
        teams_count: stats.teams,
        planning_days: stats.days,
      })
    } catch (reason) {
      setResult(null)
      setLastInput(null)
      setError(reason instanceof Error ? reason.message : 'DIP request failed')
    } finally {
      setRunning(false)
    }
  }

  const activePlan = useMemo(
    () =>
      result
        ? (result.alternatives[selectedAlternative] ?? {
            daily: result.daily,
            aggregate_metrics: result.aggregate_metrics,
            demand_summary: result.demand_summary,
            period_score: 0,
          })
        : null,
    [result, selectedAlternative]
  )
  const day = activePlan?.daily[selectedDay] ?? null
  const movementSummary = useMemo(
    () =>
      activePlan
        ? summarizeMovements(activePlan.daily, currentAllocation, inputData.teams.length)
        : { teamsMoved: 0, totalTeams: inputData.teams.length, moveEvents: 0 },
    [activePlan, currentAllocation, inputData.teams.length]
  )
  const defaultExplanationTeam = day?.recommended.assignment_explanations?.[0]?.team_id ?? null
  const activeExplanationTeam = selectedExplanationTeam ?? defaultExplanationTeam
  const selectedExplanation =
    day?.recommended.assignment_explanations?.find((item) => item.team_id === activeExplanationTeam) ?? null
  const planCsv = useMemo(
    () => (activePlan ? buildAllocationCsv(activePlan.daily, inputData.teams) : undefined),
    [activePlan, inputData.teams]
  )
  const exportFileName = `qdip-resource-allocation-${new Date().toISOString().slice(0, 10)}.csv`
  const businessPriorityCoverage =
    activePlan?.demand_summary.priority_coverage ?? activePlan?.aggregate_metrics.priority_coverage ?? 0
  const businessTotalCoverage =
    activePlan && activePlan.demand_summary.total_available > 0
      ? activePlan.demand_summary.served / activePlan.demand_summary.total_available
      : activePlan?.aggregate_metrics.total_coverage ?? 0
  const businessMetrics = activePlan
    ? {
        ...activePlan.aggregate_metrics,
        priority_coverage: businessPriorityCoverage,
        total_coverage: businessTotalCoverage,
      }
    : null

  return (
    <main className="resource-allocation-workspace min-h-[calc(100vh-7rem)] w-full max-w-full overflow-x-clip bg-transparent text-white">
      <div className="mx-auto w-full max-w-[1540px] min-w-0 px-4 py-6 sm:px-5 md:px-8 lg:px-10 lg:py-12">
        <header className="border-b border-white/15 pb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[.18em] text-rose-300">
              QDIP · Resource Allocation
            </div>
            <span
              data-testid="resource-data-source"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs"
            >
              {sourceBadge}
            </span>
          </div>
          <h1 className="mt-5 text-4xl font-medium tracking-tight md:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-4xl text-lg leading-relaxed text-slate-300">{t.valueProp}</p>
          <p className="mt-4 text-slate-400">{summary}</p>
          <p className="mt-2 text-xs text-slate-600">{profileLabel(profileId, importedName, t.imported)}</p>
        </header>

        <section className="grid min-w-0 gap-5 py-6 xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-4">
            <details id="resource-import" className="order-2 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03] p-4">
              <summary className="cursor-pointer text-sm font-bold text-rose-200">{t.tryOwnData}</summary>
              <div className="mt-3">
                <ResourceAllocationImport locale={locale} onImported={useImportedData} />
              </div>
            </details>

            <div className="order-1 rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.04] p-6">
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
                  <span className="block text-slate-500">
                    {locale === 'uk'
                      ? 'Потреби горизонту'
                      : locale === 'pl'
                        ? 'Potrzeby w horyzoncie'
                        : 'Horizon demand'}
                  </span>
                  <b className="text-2xl">{stats.horizonNeeds}</b>
                  {stats.incomingNeeds > 0 && (
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
                      {stats.openingNeeds} + {stats.incomingNeeds}{' '}
                      {locale === 'uk'
                        ? 'очікуваних протягом періоду'
                        : locale === 'pl'
                          ? 'oczekiwanych w okresie'
                          : 'expected during the horizon'}
                    </span>
                  )}
                  <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
                    {locale === 'uk'
                      ? 'Одиниця потреб — синтетична планова одиниця; у pilot вона буде відповідати вашому кейсу, консультації або іншій робочій одиниці.'
                      : locale === 'pl'
                        ? 'Jednostka potrzeby jest syntetyczną jednostką planowania; w pilotażu zostanie powiązana z Państwa sprawą, konsultacją lub inną jednostką pracy.'
                        : 'A demand unit is a synthetic planning unit; in a pilot it is mapped to your case, consultation or other operational unit.'}
                  </span>
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
              <div
                data-testid="resource-empty-state"
                className="flex min-h-[560px] items-center justify-center border border-dashed border-white/15 bg-white/[0.04] text-center"
              >
                <div className="max-w-2xl px-8">
                  <Route className="mx-auto h-11 w-11 text-rose-300" />
                  <h2 className="mt-5 text-3xl font-black md:text-4xl">{t.heroQuestion}</h2>
                  <div data-testid="resource-active-summary" className="mt-5 text-lg font-bold text-slate-200">
                    {stats.teams} {t.teams.toLowerCase()} · {stats.communities} {t.communities.toLowerCase()} ·{' '}
                    {stats.horizonNeeds} {t.opening.toLowerCase()} · {stats.days} {t.days}
                  </div>
                  <p className="mx-auto mt-4 max-w-xl text-slate-400">{t.emptyText}</p>
                  <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">{t.differentiation}</p>
                  <button
                    type="button"
                    disabled={running}
                    onClick={run}
                    data-testid="resource-primary-cta"
                    className="mb-8 mt-7 inline-flex items-center justify-center gap-2 bg-rose-500 px-6 py-4 font-bold disabled:opacity-50 sm:mb-0"
                  >
                    <Play className="h-4 w-4" />
                    {running ? t.running : t.run}
                  </button>
                </div>
              </div>
            )}

            {result && activePlan && day && (
              <>
                <ResourceAllocationImpact
                  metrics={activePlan.aggregate_metrics}
                  summary={activePlan.demand_summary}
                  baseline={result.baseline}
                  teamsMoved={movementSummary.teamsMoved}
                  totalTeams={movementSummary.totalTeams}
                  moveEvents={movementSummary.moveEvents}
                  planningDays={stats.days}
                  locale={locale}
                />

                <details
                  open
                  data-testid="resource-why-details"
                  className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03]"
                  onToggle={(event) => {
                    if (event.currentTarget.open) trackResourceAllocation('ra_explanation_opened', locale)
                  }}
                >
                  <summary className="cursor-pointer p-6 text-lg font-black">03 · {t.why}</summary>
                  <div className="grid gap-5 border-t border-white/10 p-6 lg:grid-cols-[.8fr_1.2fr]">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">{t.alternatives}</div>
                      <div className="mt-4 space-y-2">
                        {result.alternatives.map((alternative, index) => {
                          const alternativeMovement = summarizeMovements(
                            alternative.daily,
                            currentAllocation,
                            inputData.teams.length
                          )
                          const recommendedAlternative = result.alternatives[0]
                          const recommendedMovement = recommendedAlternative
                            ? summarizeMovements(
                                recommendedAlternative.daily,
                                currentAllocation,
                                inputData.teams.length
                              )
                            : movementSummary
                          const label = index === 0 ? t.recommended : `${t.alternative} ${index + 1}`
                          const alternativePriority =
                            alternative.demand_summary.priority_coverage ??
                            alternative.aggregate_metrics.priority_coverage
                          const recommendedPriority =
                            recommendedAlternative?.demand_summary.priority_coverage ??
                            recommendedAlternative?.aggregate_metrics.priority_coverage ??
                            alternativePriority
                          const coverageDeltaPp = Math.round(
                            (alternativePriority - recommendedPriority) * 100
                          )
                          const moveDelta =
                            alternativeMovement.moveEvents - recommendedMovement.moveEvents
                          return (
                            <button
                              type="button"
                              key={index}
                              onClick={() => {
                                setSelectedAlternative(index)
                                setSelectedDay(0)
                                setSelectedExplanationTeam(null)
                                setManualSelected(null)
                                trackResourceAllocation('ra_alternative_selected', locale)
                              }}
                              className={`w-full border p-4 text-left ${
                                selectedAlternative === index ? 'ds-selection-surface' : 'border-white/10'
                              }`}
                            >
                              <div className="flex justify-between gap-3">
                                <b>{label}</b>
                                <span>{pct(alternativePriority)}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {t.needsServed.toLowerCase()} {alternative.demand_summary.served.toFixed(0)} ·{' '}
                                {t.needsUnmet.toLowerCase()} {alternative.demand_summary.closing_unmet.toFixed(0)}
                              </div>
                              <div className="mt-1 text-xs text-slate-600">
                                {alternativeMovement.teamsMoved}/{alternativeMovement.totalTeams}{' '}
                                {locale === 'uk' ? 'команд' : locale === 'pl' ? 'zespołów' : 'teams'} ·{' '}
                                {alternativeMovement.moveEvents} {t.moves}
                                {index > 0 && (
                                  <>
                                    {' · '}
                                    {coverageDeltaPp > 0 ? '+' : ''}
                                    {coverageDeltaPp} pp
                                    {' · '}
                                    {moveDelta > 0 ? '+' : ''}
                                    {moveDelta} {t.moves}
                                  </>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">{t.why}</div>
                      <h3 className="mt-2 text-xl font-medium">{t.whyTitle}</h3>
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="border-l-2 border-rose-300/40 pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t.rationalePriority}</b>
                          {locale === 'uk'
                            ? 'QDIP пріоритезує потреби високої важливості лише там, де призначена команда має потрібні компетенції.'
                            : locale === 'pl'
                              ? 'QDIP priorytetyzuje potrzeby o wysokim znaczeniu tam, gdzie przydzielony zespół ma odpowiednie kompetencje.'
                              : 'QDIP prioritizes high-importance demand where the assigned team has the required skills.'}
                        </div>
                        <div className="border-l-2 border-rose-300/40 pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t.rationaleHorizon}</b>
                          {locale === 'uk'
                            ? `QDIP оцінює всі ${stats.days} днів разом: локація завершення дня змінює допустимі рішення наступного дня.`
                            : locale === 'pl'
                              ? `QDIP ocenia wszystkie ${stats.days} dni łącznie: lokalizacja na koniec dnia zmienia dopuszczalne decyzje dnia następnego.`
                              : `QDIP evaluates all ${stats.days} days jointly: the end-of-day location changes what is feasible next.`}
                        </div>
                        <div className="border-l-2 border-rose-300/40 pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t.rationaleConstraints}</b>
                          {locale === 'uk'
                            ? 'QDIP перевіряє доступність локації, допустимість призначення, відповідність компетенцій, можливість переміщення та ліміти команд.'
                            : locale === 'pl'
                              ? 'QDIP sprawdza dostępność lokalizacji, dopuszczalność przydziału, zgodność kompetencji, możliwość przemieszczenia i limity zespołów.'
                              : 'QDIP checks location availability, assignment eligibility, skill compatibility, movement feasibility and team limits.'}
                        </div>
                        <div className="border-l-2 border-rose-300/40 pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t.rationaleCost}</b>
                          {locale === 'uk'
                            ? `План: ${movementSummary.teamsMoved}/${movementSummary.totalTeams} команд змінюють локацію, ${movementSummary.moveEvents} переміщень за ${stats.days} днів.`
                            : locale === 'pl'
                              ? `Plan: ${movementSummary.teamsMoved}/${movementSummary.totalTeams} zespołów zmienia lokalizację, ${movementSummary.moveEvents} przemieszczeń w ciągu ${stats.days} dni.`
                              : `Plan: ${movementSummary.teamsMoved}/${movementSummary.totalTeams} teams change location, with ${movementSummary.moveEvents} move events over ${stats.days} days.`}
                        </div>
                      </div>
                      <details className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-500">
                        <summary className="cursor-pointer font-semibold text-slate-400">{t.rawEvidence}</summary>
                        <div className="mt-3 grid gap-2">
                          {result.evidence.slice(0, 8).map((item, index) => (
                            <div key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <b>{t.technicalMethod}:</b> {t.heuristic}
                        </div>
                      </details>
                    </div>
                  </div>
                </details>

                <div className="rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-300">04 · {t.weekly}</div>
                      <h2 className="mt-2 text-2xl font-medium">
                        {t.weeklyTitle} · {stats.days} {t.days}
                      </h2>
                    </div>
                    <details className="min-w-0 max-w-full text-left text-xs text-slate-500 sm:text-right">
                      <summary className="cursor-pointer font-semibold text-slate-500">{t.technicalDetails}</summary>
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
                        onClick={() => {
                          setSelectedDay(index)
                          setSelectedExplanationTeam(null)
                        }}
                        className={`min-w-0 border px-3 py-3 text-left sm:px-4 ${
                          selectedDay === index ? 'ds-selection-surface' : 'border-white/10'
                        }`}
                      >
                        <b>{localizePlanningDay(item.day, locale)}</b>
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
                              <button
                                type="button"
                                key={team}
                                onClick={() => setSelectedExplanationTeam(team)}
                                className={`w-full break-words px-2 py-1 text-left text-xs font-semibold [overflow-wrap:anywhere] ${
                                  activeExplanationTeam === team
                                    ? 'bg-rose-300/15 text-rose-100'
                                    : 'bg-slate-950/70 text-white'
                                }`}
                              >
                                {team}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedExplanation && (
                    <ResourceAllocationAssignmentExplanation explanation={selectedExplanation} locale={locale} />
                  )}

                  <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm">
                    <span>
                      <Users className="mr-1 inline h-4 w-4" />
                      {locale === 'uk'
                        ? 'Переміщень цього дня'
                        : locale === 'pl'
                          ? 'Przemieszczenia tego dnia'
                          : 'Moves today'}
                      :{' '}
                      <b>
                        {day.recommended.assignment_explanations?.filter(
                          (item) => item.from !== item.to && item.to !== null
                        ).length ?? 0}
                      </b>
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

                <details
                  data-testid="resource-scenario-details"
                  className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03]"
                  onToggle={(event) => {
                    if (event.currentTarget.open) trackResourceAllocation('ra_scenario_opened', locale)
                  }}
                >
                  <summary className="cursor-pointer p-6 text-lg font-black">05 · {t.simulate}</summary>
                  <div className="border-t border-white/10 p-6">
                    {(capacityFactor !== 100 || blockedCommunity) && (
                      <div className="mb-5 border-l-2 border-amber-300 bg-amber-300/[0.06] px-4 py-3 text-sm">
                        <b className="text-amber-200">{t.scenarioChanged}</b>
                        <div className="mt-1 text-slate-400">
                          {t.capacity}: {capacityFactor}%
                          {blockedCommunity ? ` · ${t.inaccessible}: ${blockedCommunity}` : ''}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="text-sm">
                        <span className="flex justify-between gap-3">
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
                      <label className="text-sm">
                        <span>{t.inaccessible}</span>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">{t.unavailableHint}</p>
                        <select
                          data-testid="blocked-community"
                          className="mt-3 w-full border border-white/15 bg-slate-950 p-3 text-white [color-scheme:dark]"
                          value={blockedCommunity}
                          onChange={(event) => setBlockedCommunity(event.target.value)}
                        >
                          <option value="">{t.none}</option>
                          {blockableCommunities.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={running}
                        onClick={run}
                        className="inline-flex items-center gap-2 bg-rose-500 px-5 py-3 font-bold disabled:opacity-50"
                      >
                        <Play className="h-4 w-4" />
                        {running ? t.running : t.recalculate}
                      </button>
                      <button
                        type="button"
                        onClick={resetRunState}
                        className="inline-flex items-center gap-2 border border-white/15 px-5 py-3 text-sm font-bold"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {locale === 'uk'
                          ? 'Повернути базовий сценарій'
                          : locale === 'pl'
                            ? 'Przywróć scenariusz bazowy'
                            : 'Restore baseline scenario'}
                      </button>
                    </div>
                  </div>
                </details>



                {lastInput && (
                  <details className="rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.03]">
                    <summary className="cursor-pointer p-6 text-lg font-medium">{t.testOwnPlan}</summary>
                    <div className="border-t border-white/10">
                      <ResourceAllocationManualEditor
                        key={`manual-${runRevision}`}
                        input={lastInput}
                        plan={activePlan}
                        referenceMetrics={businessMetrics ?? activePlan.aggregate_metrics}
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
                  <>
                    <ResourceAllocationDecisionPanel
                      key={`decision-${runRevision}`}
                      input={lastInput}
                      selected={activePlan as unknown as Record<string, unknown>}
                      manualSelected={manualSelected}
                      priorityCoverage={businessPriorityCoverage}
                      served={activePlan.demand_summary.served}
                      unmet={activePlan.demand_summary.closing_unmet}
                      teamsMoved={movementSummary.teamsMoved}
                      totalTeams={movementSummary.totalTeams}
                      moveEvents={movementSummary.moveEvents}
                      planningDays={stats.days}
                      planCsv={planCsv}
                      exportFileName={exportFileName}
                      selectionKind={selectedAlternative === 0 ? 'recommended' : 'alternative'}
                      locale={locale}
                    />

                  <section
                    data-testid="resource-pilot-cta"
                    className="rounded-[var(--ds-radius-panel)] border border-emerald-300/20 bg-emerald-300/[0.05] p-6"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      {locale === 'uk'
                        ? '07 · ПЕРЕВІРИТИ НА ВАШИХ ДАНИХ'
                        : locale === 'pl'
                          ? '07 · SPRAWDŹ NA WŁASNYCH DANYCH'
                          : '07 · TEST ON YOUR DATA'}
                    </div>
                    <h2 className="mt-2 text-2xl font-medium">
                      {locale === 'uk'
                        ? 'Перевірте QDIP на одному реальному тижні'
                        : locale === 'pl'
                          ? 'Sprawdź QDIP na jednym rzeczywistym tygodniu'
                          : 'Test QDIP on one real week'}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                      {locale === 'uk'
                        ? 'Достатньо агрегованих даних: локації, потреби за видами послуг, команди, їх компетенції та потужність, доступність і маршрути. Персональні дані бенефіціарів не потрібні.'
                        : locale === 'pl'
                          ? 'Wystarczą dane zagregowane: lokalizacje, potrzeby według usług, zespoły, ich kompetencje i zdolność, dostępność oraz trasy. Dane osobowe beneficjentów nie są potrzebne.'
                          : 'Aggregated data is enough: locations, demand by service, teams, skills and capacity, availability and routes. Beneficiary personal data is not required.'}
                    </p>
                    <a
                      href="#resource-import"
                      className="mt-5 inline-flex border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-sm font-bold text-emerald-200"
                    >
                      {locale === 'uk'
                        ? 'Завантажити агреговані дані'
                        : locale === 'pl'
                          ? 'Wczytaj dane zagregowane'
                          : 'Upload aggregated data'}
                    </a>
                  </section>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
