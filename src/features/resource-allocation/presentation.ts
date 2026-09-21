import type { Locale } from '@/lib/observatory-i18n'
import type { ResourceAllocationDayPlan, ResourceAllocationTeamInput } from './contracts'

export type MovementSummary = {
  teamsMoved: number
  totalTeams: number
  moveEvents: number
}

const DAY_LABELS: Record<Locale, Record<string, string>> = {
  uk: { Mon: 'Пн', Tue: 'Вт', Wed: 'Ср', Thu: 'Чт', Fri: 'Пт', Sat: 'Сб', Sun: 'Нд' },
  en: { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun' },
  pl: { Mon: 'Pn', Tue: 'Wt', Wed: 'Śr', Thu: 'Czw', Fri: 'Pt', Sat: 'Sob', Sun: 'Nd' },
}

const SERVICE_LABELS: Record<string, Record<Locale, string>> = {
  psychosocial: {
    uk: 'Психосоціальна підтримка',
    en: 'Psychosocial support',
    pl: 'Wsparcie psychospołeczne',
  },
  legal: { uk: 'Правова допомога', en: 'Legal support', pl: 'Wsparcie prawne' },
  'case-management': {
    uk: 'Кейс-менеджмент',
    en: 'Case management',
    pl: 'Case management',
  },
  'child-support': {
    uk: 'Підтримка дітей',
    en: 'Child support',
    pl: 'Wsparcie dzieci',
  },
  'cash-assistance': {
    uk: 'Грошова допомога',
    en: 'Cash assistance',
    pl: 'Pomoc finansowa',
  },
}

export function localizePlanningDay(day: string, locale: Locale): string {
  const normalized = day.slice(0, 1).toUpperCase() + day.slice(1, 3).toLowerCase()
  return DAY_LABELS[locale][normalized] ?? day
}

export function localizeService(service: string, locale: Locale): string {
  return SERVICE_LABELS[service]?.[locale] ?? service
}

export function summarizeMovements(
  daily: Array<{ recommended: { assignments: Record<string, string | null> } }>,
  initial: Record<string, string | null>,
  totalTeams: number
): MovementSummary {
  const previous = { ...initial }
  const movedTeams = new Set<string>()
  let moveEvents = 0

  for (const day of daily) {
    for (const [team, target] of Object.entries(day.recommended.assignments)) {
      if (target === null) continue
      const origin = previous[team] ?? null
      if (origin !== target) {
        movedTeams.add(team)
        moveEvents += 1
      }
      previous[team] = target
    }
  }

  return { teamsMoved: movedTeams.size, totalTeams, moveEvents }
}

function csvCell(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value)
  return /[",\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw
}

export function buildAllocationCsv(daily: ResourceAllocationDayPlan[], teams: ResourceAllocationTeamInput[]): string {
  const teamById = new Map(teams.map((team) => [team.id, team]))
  const rows: Array<Array<string | number | null | undefined>> = [
    ['day', 'team', 'from', 'to', 'skills', 'planned_capacity', 'travel_cost_index'],
  ]

  for (const day of daily) {
    const explanationByTeam = new Map(
      (day.recommended.assignment_explanations ?? []).map((item) => [item.team_id, item])
    )
    for (const [teamId, target] of Object.entries(day.recommended.assignments)) {
      const team = teamById.get(teamId)
      const explanation = explanationByTeam.get(teamId)
      rows.push([
        day.day,
        teamId,
        explanation?.from ?? team?.current_community ?? null,
        target,
        team?.skills.join('|') ?? '',
        team?.capacity ?? '',
        explanation?.travel_cost ?? '',
      ])
    }
  }

  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

export type ResourceAllocationAnalyticsEvent =
  | 'ra_demo_opened'
  | 'ra_calculation_started'
  | 'ra_calculation_completed'
  | 'ra_scenario_opened'
  | 'ra_scenario_recalculated'
  | 'ra_explanation_opened'
  | 'ra_alternative_selected'
  | 'ra_manual_plan_evaluated'
  | 'ra_decision_accepted'
  | 'ra_decision_modified'
  | 'ra_decision_rejected'
  | 'ra_plan_exported'
  | 'ra_actual_outcome_recorded'

export function trackResourceAllocation(
  event: ResourceAllocationAnalyticsEvent,
  locale: Locale,
  metadata: {
    profile_type?: 'demo' | 'imported'
    communities_count?: number
    teams_count?: number
    planning_days?: number
  } = {}
) {
  if (typeof window === 'undefined') return
  const target = window as Window & { dataLayer?: Array<Record<string, string | number>> }
  target.dataLayer?.push({ event, locale, ...metadata })
}
