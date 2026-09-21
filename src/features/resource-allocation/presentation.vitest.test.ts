import { describe, expect, it } from 'vitest'
import { buildAllocationCsv, localizePlanningDay, summarizeMovements } from './presentation'

describe('resource allocation presentation helpers', () => {
  it('distinguishes unique moved teams from move events', () => {
    const summary = summarizeMovements(
      [
        { recommended: { assignments: { t1: 'b', t2: 'a' } } },
        { recommended: { assignments: { t1: 'c', t2: 'a' } } },
      ],
      { t1: 'a', t2: 'a' },
      2
    )
    expect(summary).toEqual({ teamsMoved: 1, totalTeams: 2, moveEvents: 2 })
  })

  it('localizes canonical planning day codes without changing unknown values', () => {
    expect(localizePlanningDay('Mon', 'uk')).toBe('Пн')
    expect(localizePlanningDay('Tue', 'pl')).toBe('Wt')
    expect(localizePlanningDay('special-day', 'uk')).toBe('special-day')
  })

  it('exports UTF-8 BOM CSV with stable machine columns and escaped values', () => {
    const csv = buildAllocationCsv(
      [
        {
          day: 'Mon',
          status: 'ok',
          recommended: {
            assignments: { 'Команда 1': 'Локація, A' },
            metrics: {
              priority_coverage: 1,
              total_coverage: 1,
              unmet_need: 0,
              capacity_utilization: 1,
              travel_cost: 2,
            },
            assignment_explanations: [
              {
                day: 'Mon',
                team_id: 'Команда 1',
                from: 'Локація B',
                to: 'Локація, A',
                matched_services: ['psychosocial'],
                priority_demand_units: 8,
                served_units: 8,
                priority_served_units: 8,
                travel_cost: 2,
                travel_time_minutes: 15,
                constraint_checks: [],
                rationale_codes: ['SKILL_MATCH'],
              },
            ],
          },
          demand: { opening: 8, served: 8, closing_unmet: 0 },
        },
      ],
      [
        {
          id: 'Команда 1',
          current_community: 'Локація B',
          skills: ['psychosocial'],
          capacity: 8,
        },
      ]
    )
    expect(csv.startsWith('\uFEFFday,team,from,to,skills,planned_capacity,travel_cost_index')).toBe(true)
    expect(csv).toContain('"Локація, A"')
    expect(csv).toContain('psychosocial')
  })
})
