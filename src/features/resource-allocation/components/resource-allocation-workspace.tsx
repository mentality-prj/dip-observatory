'use client'

import { CircleAlert, Play, RotateCcw, Route, Users } from 'lucide-react'
import { useTranslations } from '@/i18n/provider'
import { pluralMessage } from '@/i18n/runtime'
import type { Locale } from '@/lib/observatory-i18n'
import {
  RESOURCE_ALLOCATION_PROFILES,
  type ResourceAllocationProfileId,
} from '../demo-data'
import { ResourceAllocationDecisionPanel } from './resource-allocation-decision-panel'
import { ResourceAllocationImpact } from './resource-allocation-impact'
import { ResourceAllocationImport } from './resource-allocation-import'
import { ResourceAllocationManualEditor } from './resource-allocation-manual-editor'
import {
  localizePlanningDay,
  summarizeMovements,
  trackResourceAllocation,
} from '../presentation'
import { useResourceAllocationWorkspace } from '../hooks/use-resource-allocation-workspace'
import { ResourceAllocationAssignmentExplanation } from './resource-allocation-assignment-explanation'

const pct = (value: number) => `${Math.round(value * 100)}%`

type CountKind = 'teams' | 'communities' | 'demand' | 'days'


function countPhrase(locale: Locale, count: number, kind: CountKind): string {
  return `${count} ${pluralMessage(
    locale,
    `resourceAllocation.countForms.${kind}`,
    count,
  )}`
}


function profileLabel(profileId: string, importedName: string | null, importedLabel: string) {
  if (profileId === 'imported') return importedName ? `${importedLabel}: ${importedName}` : importedLabel
  return RESOURCE_ALLOCATION_PROFILES[profileId as ResourceAllocationProfileId]?.label ?? profileId
}

export function ResourceAllocationWorkspace({ locale }: { locale: Locale }) {
  const t = useTranslations('resourceAllocation.workspace')
  const source = useTranslations('resourceAllocation.sourceBadge')
  const {
    profileId,
    importedName,
    inputData,
    result,
    selectedAlternative,
    selectedDay,
    running,
    error,
    capacityFactor,
    blockedCommunity,
    unavailableTeam,
    lastInput,
    manualSelected,
    runRevision,
    stats,
    communityNames,
    blockableCommunities,
    teamIds,
    currentAllocation,
    activePlan,
    day,
    movementSummary,
    activeExplanationTeam,
    selectedExplanation,
    planCsv,
    planShortText,
    exportFileName,
    businessPriorityCoverage,
    businessMetrics,
    resetRunState,
    useImportedData,
    run,
    selectAlternative,
    selectDay,
    selectExplanationTeam,
    setCapacityFactor,
    setBlockedCommunity,
    setUnavailableTeam,
    setManualSelected,
  } = useResourceAllocationWorkspace(locale)

  const summary = [
    countPhrase(locale, stats.teams, 'teams'),
    countPhrase(locale, stats.communities, 'communities'),
    countPhrase(locale, stats.horizonNeeds, 'demand'),
    countPhrase(locale, stats.days, 'days'),
  ].join(' · ')

  const sourceBadge =
    profileId === 'imported'
      ? `${source('imported')} · ${importedName ?? ''}`
      : source('demo')

  return (
    <main className="resource-allocation-workspace min-h-[calc(100vh-7rem)] w-full max-w-full overflow-x-clip bg-transparent text-white">
      <div className="mx-auto w-full max-w-[1540px] min-w-0 px-4 py-6 sm:px-5 md:px-8 lg:px-10 lg:py-12">
        <header className="border-b border-white/15 pb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[.18em] ds-text-accent">
              QDIP · Resource Allocation
            </div>
            <span
              data-testid="resource-data-source"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs"
            >
              {sourceBadge}
            </span>
          </div>
          <h1 className="mt-5 text-4xl font-medium tracking-tight md:text-6xl">{t('title')}</h1>
          <p className="mt-4 max-w-4xl text-lg leading-relaxed text-slate-300">{t('valueProp')}</p>
          <p className="mt-4 text-slate-400">{summary}</p>
          <p className="mt-2 text-xs text-slate-600">{profileLabel(profileId, importedName, t('imported'))}</p>
        </header>

        <section className="grid min-w-0 gap-5 py-6 xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-4">
            <details id="resource-import" className="order-2 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03] p-4">
              <summary className="cursor-pointer text-sm font-bold text-rose-200">{t('tryOwnData')}</summary>
              <div className="mt-3">
                <ResourceAllocationImport locale={locale} onImported={useImportedData} />
              </div>
            </details>

            <div className="order-1 rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.04] p-6">
              <b>01 · {t('state')}</b>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="block text-slate-500">{t('communities')}</span>
                  <b className="text-2xl" data-testid="community-count">
                    {stats.communities}
                  </b>
                </div>
                <div>
                  <span className="block text-slate-500">{t('teams')}</span>
                  <b className="text-2xl" data-testid="team-count">
                    {stats.teams}
                  </b>
                </div>
                <div>
                  <span className="block text-slate-500">
                    {t('horizonDemand')}
                  </span>
                  <b className="text-2xl">{stats.horizonNeeds}</b>
                  {stats.incomingNeeds > 0 && (
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
                      {stats.openingNeeds} + {stats.incomingNeeds}{' '}
                      {t('expectedDuringHorizon')}
                    </span>
                  )}
                  <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
                    {t('demandUnitHelp')}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500">{t('services')}</span>
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
                  <Route className="mx-auto h-11 w-11 ds-text-accent" />
                  <h2 className="mt-5 text-3xl font-black md:text-4xl">{t('heroQuestion')}</h2>
                  <div data-testid="resource-active-summary" className="mt-5 text-lg font-bold text-slate-200">
                    {summary}
                  </div>
                  <p className="mx-auto mt-4 max-w-xl text-slate-400">{t('emptyText')}</p>
                  <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">{t('differentiation')}</p>
                  <button
                    type="button"
                    disabled={running}
                    onClick={run}
                    data-testid="resource-primary-cta"
                    className="mb-8 mt-7 inline-flex items-center justify-center gap-2 ds-accent-background px-6 py-4 font-bold disabled:opacity-50 sm:mb-0"
                  >
                    <Play className="h-4 w-4" />
                    {running ? t('running') : t('run')}
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
                  <summary className="cursor-pointer p-6 text-lg font-black">03 · {t('why')}</summary>
                  <div className="grid gap-5 border-t border-white/10 p-6 lg:grid-cols-[.8fr_1.2fr]">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider ds-text-accent">{t('alternatives')}</div>
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
                          const label = index === 0 ? t('recommended') : `${t('alternative')} ${index + 1}`
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
                              onClick={() => selectAlternative(index)}
                              className={`w-full border p-4 text-left ${
                                selectedAlternative === index ? 'ds-selection-surface' : 'border-white/10'
                              }`}
                            >
                              <div className="flex justify-between gap-3">
                                <b>{label}</b>
                                <span>{pct(alternativePriority)}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {t('needsServed').toLowerCase()} {alternative.demand_summary.served.toFixed(0)} ·{' '}
                                {t('needsUnmet').toLowerCase()} {alternative.demand_summary.closing_unmet.toFixed(0)}
                              </div>
                              <div className="mt-1 text-xs text-slate-600">
                                {alternativeMovement.teamsMoved}/{alternativeMovement.totalTeams}{' '}
                                {pluralMessage(locale, 'resourceAllocation.countForms.teams', alternativeMovement.totalTeams)} ·{' '}
                                {alternativeMovement.moveEvents} {t('moves')}
                                {index > 0 && (
                                  <>
                                    {' · '}
                                    {coverageDeltaPp > 0 ? '+' : ''}
                                    {coverageDeltaPp} pp
                                    {' · '}
                                    {moveDelta > 0 ? '+' : ''}
                                    {moveDelta} {t('moves')}
                                  </>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider ds-text-accent">{t('why')}</div>
                      <h3 className="mt-2 text-xl font-medium">{t('whyTitle')}</h3>
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="border-l-2 ds-accent-border-left pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t('rationalePriority')}</b>
                          {t('rationalePriorityBody')}
                        </div>
                        <div className="border-l-2 ds-accent-border-left pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t('rationaleHorizon')}</b>
                          {t('rationaleHorizonBody', { days: stats.days })}
                        </div>
                        <div className="border-l-2 ds-accent-border-left pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t('rationaleConstraints')}</b>
                          {t('rationaleConstraintsBody')}
                        </div>
                        <div className="border-l-2 ds-accent-border-left pl-3 text-sm text-slate-300">
                          <b className="block text-white">{t('rationaleCost')}</b>
                          {t('rationaleCostBody', {
                              moved: movementSummary.teamsMoved,
                              total: movementSummary.totalTeams,
                              events: movementSummary.moveEvents,
                              days: stats.days,
                            })}
                        </div>
                      </div>
                      <details className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-500">
                        <summary className="cursor-pointer font-semibold text-slate-400">{t('rawEvidence')}</summary>
                        <div className="mt-3 grid gap-2">
                          {result.evidence.slice(0, 8).map((item, index) => (
                            <div key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <b>{t('technicalMethod')}:</b> {t('heuristic')}
                        </div>
                      </details>
                    </div>
                  </div>
                </details>

                <div className="rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider ds-text-accent">04 · {t('weekly')}</div>
                      <h2 className="mt-2 text-2xl font-medium">
                        {t('weeklyTitle')} · {stats.days} {t('days')}
                      </h2>
                    </div>
                    <details className="min-w-0 max-w-full text-left text-xs text-slate-500 sm:text-right">
                      <summary className="cursor-pointer font-semibold text-slate-500">{t('technicalDetails')}</summary>
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
                        onClick={() => selectDay(index)}
                        className={`min-w-0 border px-3 py-3 text-left sm:px-4 ${
                          selectedDay === index ? 'ds-selection-surface' : 'border-white/10'
                        }`}
                      >
                        <b>{localizePlanningDay(item.day, locale)}</b>
                        <div className="mt-1 text-xs text-slate-500">
                          {t('served')}: {item.demand.served.toFixed(0)}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          {t('needsUnmet').toLowerCase()}: {item.demand.closing_unmet.toFixed(0)}
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
                                onClick={() => selectExplanationTeam(team)}
                                className={`w-full break-words px-2 py-1 text-left text-xs font-semibold [overflow-wrap:anywhere] ${
                                  activeExplanationTeam === team
                                    ? 'ds-selection-surface'
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
                      {t('movesToday')}
                      :{' '}
                      <b>
                        {day.recommended.assignment_explanations?.filter(
                          (item) => item.from !== item.to && item.to !== null
                        ).length ?? 0}
                      </b>
                    </span>
                    <span>
                      {t('needsStart')}: <b>{day.demand.opening.toFixed(0)}</b>
                    </span>
                    <span>
                      {t('needsServed')}: <b>{day.demand.served.toFixed(0)}</b>
                    </span>
                    <span>
                      {t('needsUnmet')}: <b>{day.demand.closing_unmet.toFixed(0)}</b>
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
                  <summary className="cursor-pointer p-6 text-lg font-black">05 · {t('simulate')}</summary>
                  <div className="border-t border-white/10 p-6">
                    {(capacityFactor !== 100 || blockedCommunity || unavailableTeam) && (
                      <div className="mb-5 border-l-2 border-amber-300 bg-amber-300/[0.06] px-4 py-3 text-sm">
                        <b className="text-amber-200">{t('scenarioChanged')}</b>
                        <div className="mt-1 text-slate-400">
                          {t('capacity')}: {capacityFactor}%
                          {blockedCommunity ? ` · ${t('inaccessible')}: ${blockedCommunity}` : ''}
                          {unavailableTeam ? ` · ${t('unavailableTeam')}: ${unavailableTeam}` : ''}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-5 md:grid-cols-3">
                      <label className="text-sm">
                        <span className="flex justify-between gap-3">
                          <span>{t('capacity')}</span>
                          <b>{capacityFactor}%</b>
                        </span>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">{t('baselineCapacityHint')}</p>
                        <input
                          className="mt-3 w-full ds-accent-control"
                          type="range"
                          min="70"
                          max="130"
                          step="5"
                          value={capacityFactor}
                          onChange={(event) => setCapacityFactor(Number(event.target.value))}
                        />
                      </label>
                      <label className="text-sm">
                        <span>{t('inaccessible')}</span>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">{t('unavailableHint')}</p>
                        <select
                          data-testid="blocked-community"
                          className="mt-3 w-full border border-white/15 bg-slate-950 p-3 text-white [color-scheme:dark]"
                          value={blockedCommunity}
                          onChange={(event) => setBlockedCommunity(event.target.value)}
                        >
                          <option value="">{t('none')}</option>
                          {blockableCommunities.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm">
                        <span>{t('unavailableTeam')}</span>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">{t('unavailableTeamHint')}</p>
                        <select
                          data-testid="unavailable-team"
                          className="mt-3 w-full border border-white/15 bg-slate-950 p-3 text-white [color-scheme:dark]"
                          value={unavailableTeam}
                          onChange={(event) => setUnavailableTeam(event.target.value)}
                        >
                          <option value="">{t('none')}</option>
                          {teamIds.map((team) => (
                            <option key={team} value={team}>
                              {team}
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
                        className="inline-flex items-center gap-2 ds-accent-background px-5 py-3 font-bold disabled:opacity-50"
                      >
                        <Play className="h-4 w-4" />
                        {running ? t('running') : t('recalculate')}
                      </button>
                      <button
                        type="button"
                        onClick={resetRunState}
                        className="inline-flex items-center gap-2 border border-white/15 px-5 py-3 text-sm font-bold"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t('restoreBaseline')}
                      </button>
                    </div>
                  </div>
                </details>



                {lastInput && (
                  <details className="rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.03]">
                    <summary className="cursor-pointer p-6 text-lg font-medium">{t('testOwnPlan')}</summary>
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
                      planShortText={planShortText}
                      exportFileName={exportFileName}
                      selectionKind={selectedAlternative === 0 ? 'recommended' : 'alternative'}
                      locale={locale}
                    />

                  <section
                    data-testid="resource-pilot-cta"
                    className="rounded-[var(--ds-radius-panel)] border border-emerald-300/20 bg-emerald-300/[0.05] p-6"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      {t('pilotKicker')}
                    </div>
                    <h2 className="mt-2 text-2xl font-medium">
                      {t('pilotTitle')}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                      {t('pilotBody')}
                    </p>
                    <a
                      href="#resource-import"
                      onClick={() => trackResourceAllocation('ra_pilot_cta_clicked', locale)}
                      className="mt-5 inline-flex border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-sm font-bold text-emerald-200"
                    >
                      {t('pilotUpload')}
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
