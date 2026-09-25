'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { Locale } from '@/lib/observatory-i18n'
import { buildResourceAllocationInput, runResourceAllocationScenario } from '../api'
import type { EvaluatedManualAllocation, ResourceAllocationInput, ResourceAllocationResult } from '../contracts'
import { cloneResourceAllocationInput, RESOURCE_ALLOCATION_PROFILES, resourceAllocationStats } from '../demo-data'
import {
  buildAllocationCsv,
  buildAllocationShortText,
  summarizeMovements,
  trackResourceAllocation,
} from '../presentation'

export function useResourceAllocationWorkspace(locale: Locale) {
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
  const [unavailableTeam, setUnavailableTeam] = useState('')
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
    setUnavailableTeam('')
    setResult(null)
    setLastInput(null)
    setManualSelected(null)
    setSelectedAlternative(0)
    setSelectedDay(0)
    setSelectedExplanationTeam(null)
    setError(null)
  }

  function useImportedData(input: ResourceAllocationInput, fileName: string) {
    setProfileId('imported')
    setImportedName(fileName)
    setInputData(input)
    trackResourceAllocation('ra_pilot_dataset_imported', locale, {
      profile_type: 'imported',
      communities_count: input.communities.length,
      teams_count: input.teams.length,
      planning_days: input.planning_period?.days.length ?? 0,
    })
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
      unavailable_teams: unavailableTeam ? [unavailableTeam] : [],
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

  function selectAlternative(index: number) {
    setSelectedAlternative(index)
    setSelectedDay(0)
    setSelectedExplanationTeam(null)
    setManualSelected(null)
    trackResourceAllocation('ra_alternative_selected', locale)
  }

  function selectDay(index: number) {
    setSelectedDay(index)
    setSelectedExplanationTeam(null)
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
        : {
            teamsMoved: 0,
            totalTeams: inputData.teams.length,
            moveEvents: 0,
          },
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
  const planShortText = useMemo(
    () => (activePlan ? buildAllocationShortText(activePlan.daily, locale) : undefined),
    [activePlan, locale]
  )

  const exportFileName = `qdip-resource-allocation-${new Date().toISOString().slice(0, 10)}.csv`
  const businessPriorityCoverage =
    activePlan?.demand_summary.priority_coverage ?? activePlan?.aggregate_metrics.priority_coverage ?? 0
  const businessTotalCoverage =
    activePlan && activePlan.demand_summary.total_available > 0
      ? activePlan.demand_summary.served / activePlan.demand_summary.total_available
      : (activePlan?.aggregate_metrics.total_coverage ?? 0)
  const businessMetrics = activePlan
    ? {
        ...activePlan.aggregate_metrics,
        priority_coverage: businessPriorityCoverage,
        total_coverage: businessTotalCoverage,
      }
    : null

  return {
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
    selectExplanationTeam: setSelectedExplanationTeam,
    setCapacityFactor,
    setBlockedCommunity,
    setUnavailableTeam,
    setManualSelected,
  }
}
