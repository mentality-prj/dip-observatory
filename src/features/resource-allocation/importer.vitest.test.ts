import { describe, expect, it } from 'vitest'

import { importResourceAllocationFile, summarizeResourceAllocationImport } from './importer'

const columns = [
  'record_type',
  'id',
  'day',
  'community',
  'service',
  'units',
  'priority',
  'program',
  'current_community',
  'skills',
  'capacity',
  'available',
  'accessible',
  'max_teams',
  'allowed_communities',
  'allowed_programs',
  'programs',
  'max_daily_capacity',
  'max_travel_cost',
  'max_travel_minutes',
  'cost_per_capacity',
  'from',
  'to',
  'cost',
  'minutes',
  'days',
  'budget',
  'target_priority_coverage',
  'planning_unit',
  'team',
] as const

const header = columns.join(',')

function row(values: Partial<Record<(typeof columns)[number], string | number | boolean>>) {
  return columns.map((column) => String(values[column] ?? '')).join(',')
}

function csvFile(lines: string[], name = 'pilot.csv'): File {
  const content = lines.join('\n')
  return {
    name,
    text: async () => content,
    arrayBuffer: async () => new TextEncoder().encode(content).buffer,
  } as File
}

describe('resource allocation real-pilot importer', () => {
  it('imports daily demand, availability, accessibility and a complete manual baseline', async () => {
    const input = await importResourceAllocationFile(
      csvFile([
        header,
        row({
          record_type: 'settings',
          days: 'Mon|Tue',
          budget: 100,
          target_priority_coverage: 0.9,
          planning_unit: 'consultation',
        }),
        row({ record_type: 'community', community: 'Hub A', accessible: true, max_teams: 2 }),
        row({ record_type: 'community', community: 'Hub B', accessible: true, max_teams: 2 }),
        row({ record_type: 'community_day', community: 'Hub B', day: 'Tue', accessible: false }),
        row({
          record_type: 'demand',
          community: 'Hub A',
          service: 'psychosocial',
          units: 10,
          priority: 'high',
        }),
        row({
          record_type: 'demand',
          day: 'Tue',
          community: 'Hub B',
          service: 'legal',
          units: 4,
          priority: 'critical',
        }),
        row({
          record_type: 'team',
          id: 'Team A',
          current_community: 'Hub A',
          skills: 'psychosocial|legal',
          capacity: 8,
          allowed_communities: 'Hub A|Hub B',
          max_daily_capacity: 10,
          max_travel_cost: 20,
          max_travel_minutes: 60,
          cost_per_capacity: 1,
        }),
        row({
          record_type: 'team',
          id: 'Team B',
          current_community: 'Hub B',
          skills: 'legal',
          capacity: 6,
          allowed_communities: 'Hub A|Hub B',
          max_daily_capacity: 8,
          max_travel_cost: 20,
          max_travel_minutes: 60,
          cost_per_capacity: 1,
        }),
        row({ record_type: 'team_day', id: 'Team A', day: 'Tue', available: false, capacity: 0 }),
        row({ record_type: 'travel', from: 'Hub A', to: 'Hub B', cost: 5, minutes: 30 }),
        row({ record_type: 'baseline', day: 'Mon', team: 'Team A', community: 'Hub A' }),
        row({ record_type: 'baseline', day: 'Mon', team: 'Team B', community: 'Hub B' }),
        row({ record_type: 'baseline', day: 'Tue', team: 'Team A', community: 'Hub B' }),
        row({ record_type: 'baseline', day: 'Tue', team: 'Team B' }),
      ])
    )

    expect(input.planning_period?.days).toEqual(['Mon', 'Tue'])
    expect(input.provenance).toMatchObject({
      mapping_version: 'resource-allocation-import/2',
      planning_unit: 'consultation',
    })
    expect(input.communities.find((community) => community.id === 'Hub B')?.daily_demand?.Tue).toEqual([
      { service: 'legal', units: 4, priority: 'critical', program: undefined },
    ])
    expect(input.communities.find((community) => community.id === 'Hub B')?.accessibility?.Tue).toBe(false)
    expect(input.teams.find((team) => team.id === 'Team A')?.availability?.Tue).toBe(false)
    expect(input.teams.find((team) => team.id === 'Team A')?.daily_capacity?.Tue).toBe(0)
    expect(input.baseline_plan).toEqual({
      Mon: { 'Team A': 'Hub A', 'Team B': 'Hub B' },
      Tue: { 'Team A': 'Hub B', 'Team B': null },
    })

    expect(summarizeResourceAllocationImport(input)).toMatchObject({
      days: 2,
      communities: 2,
      teams: 2,
      openingDemand: 10,
      scheduledDemand: 4,
      horizonDemand: 14,
      baselineProvided: true,
      dailyDemandDays: 1,
    })
  })

  it('rejects invalid numeric values instead of coercing them to zero', async () => {
    await expect(
      importResourceAllocationFile(
        csvFile([
          header,
          row({ record_type: 'community', community: 'Hub A', accessible: true, max_teams: 2 }),
          row({
            record_type: 'team',
            id: 'Team A',
            current_community: 'Hub A',
            skills: 'psychosocial',
            capacity: 'not-a-number',
          }),
        ])
      )
    ).rejects.toThrow(/valid number/)
  })

  it('rejects unknown priorities instead of silently treating them as normal', async () => {
    await expect(
      importResourceAllocationFile(
        csvFile([
          header,
          row({ record_type: 'community', community: 'Hub A', accessible: true, max_teams: 2 }),
          row({
            record_type: 'demand',
            community: 'Hub A',
            service: 'psychosocial',
            units: 10,
            priority: 'urgent',
          }),
          row({
            record_type: 'team',
            id: 'Team A',
            current_community: 'Hub A',
            skills: 'psychosocial',
            capacity: 8,
          }),
        ])
      )
    ).rejects.toThrow(/critical, high or normal/)
  })

  it('rejects incomplete baseline plans', async () => {
    await expect(
      importResourceAllocationFile(
        csvFile([
          header,
          row({ record_type: 'settings', days: 'Mon|Tue' }),
          row({ record_type: 'community', community: 'Hub A', accessible: true, max_teams: 2 }),
          row({
            record_type: 'team',
            id: 'Team A',
            current_community: 'Hub A',
            skills: 'psychosocial',
            capacity: 8,
          }),
          row({ record_type: 'baseline', day: 'Mon', team: 'Team A', community: 'Hub A' }),
        ])
      )
    ).rejects.toThrow(/Baseline plan must contain every team for every planning day/)
  })

  it('rejects personal-data columns when they contain values', async () => {
    const piiHeader = `${header},phone`
    await expect(
      importResourceAllocationFile(
        csvFile([
          piiHeader,
          `${row({ record_type: 'community', community: 'Hub A', accessible: true, max_teams: 2 })},+48123456789`,
          `${row({
            record_type: 'team',
            id: 'Team A',
            current_community: 'Hub A',
            skills: 'psychosocial',
            capacity: 8,
          })},`,
        ])
      )
    ).rejects.toThrow(/Personal-data column "phone" is not allowed/)
  })
})
