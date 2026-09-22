import { describe, expect, it } from 'vitest'

import { importResourceAllocationFile, summarizeResourceAllocationImport } from './importer'

function csvFile(lines: string[], name = 'pilot.csv') {
  return new File([lines.join('\n')], name, { type: 'text/csv' })
}

const header =
  'record_type,id,day,community,service,units,priority,program,current_community,skills,capacity,available,accessible,max_teams,allowed_communities,allowed_programs,programs,max_daily_capacity,max_travel_cost,max_travel_minutes,cost_per_capacity,from,to,cost,minutes,days,budget,target_priority_coverage,planning_unit,team'

describe('resource allocation real-pilot importer', () => {
  it('imports daily demand, availability, accessibility and a complete manual baseline', async () => {
    const input = await importResourceAllocationFile(
      csvFile([
        header,
        'settings,,,,,,,,,,,,,,,,,,,,,,,,,Mon|Tue,100,0.9,consultation,',
        'community,,,Hub A,,,,,,,,,true,2,,,,,,,,,,,,,,,,',
        'community,,,Hub B,,,,,,,,,true,2,,,,,,,,,,,,,,,,',
        'community_day,,Tue,Hub B,,,,,,,,,false,,,,,,,,,,,,,,,,',
        'demand,,,Hub A,psychosocial,10,high,,,,,,,,,,,,,,,,,,,',
        'demand,,Tue,Hub B,legal,4,critical,,,,,,,,,,,,,,,,,,,',
        'team,Team A,,,,,,,Hub A,psychosocial|legal,8,,,,Hub A|Hub B,,,10,20,60,1,,,,,,,,',
        'team,Team B,,,,,,,Hub B,legal,6,,,,Hub A|Hub B,,,8,20,60,1,,,,,,,,',
        'team_day,Team A,Tue,,,,,,,,0,false,,,,,,,,,,,,,,,,,',
        'travel,,,,,,,,,,,,,,,,,,,,,Hub A,Hub B,5,30,,,,',
        'baseline,,Mon,Hub A,,,,,,,,,,,,,,,,,,,,,,,,,,Team A',
        'baseline,,Mon,Hub B,,,,,,,,,,,,,,,,,,,,,,,,,,Team B',
        'baseline,,Tue,Hub B,,,,,,,,,,,,,,,,,,,,,,,,,,Team A',
        'baseline,,Tue,,,,,,,,,,,,,,,,,,,,,,,,,,,,Team B',
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
          'community,,,Hub A,,,,,,,,,true,2,,,,,,,,,,,,,,,,',
          'team,Team A,,,,,,,Hub A,psychosocial,not-a-number,,,,,,,,,,,,,,,,,,',
        ])
      )
    ).rejects.toThrow(/valid number/)
  })

  it('rejects unknown priorities instead of silently treating them as normal', async () => {
    await expect(
      importResourceAllocationFile(
        csvFile([
          header,
          'community,,,Hub A,,,,,,,,,true,2,,,,,,,,,,,,,,,,',
          'demand,,,Hub A,psychosocial,10,urgent,,,,,,,,,,,,,,,,,,,',
          'team,Team A,,,,,,,Hub A,psychosocial,8,,,,,,,,,,,,,,,,,,',
        ])
      )
    ).rejects.toThrow(/critical, high or normal/)
  })

  it('rejects incomplete baseline plans', async () => {
    await expect(
      importResourceAllocationFile(
        csvFile([
          header,
          'settings,,,,,,,,,,,,,,,,,,,,,,,,,Mon|Tue,,,,',
          'community,,,Hub A,,,,,,,,,true,2,,,,,,,,,,,,,,,,',
          'team,Team A,,,,,,,Hub A,psychosocial,8,,,,,,,,,,,,,,,,,,',
          'baseline,,Mon,Hub A,,,,,,,,,,,,,,,,,,,,,,,,,,Team A',
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
          'community,,,Hub A,,,,,,,,,true,2,,,,,,,,,,,,,,,,,+48123456789',
          'team,Team A,,,,,,,Hub A,psychosocial,8,,,,,,,,,,,,,,,,,,,',
        ])
      )
    ).rejects.toThrow(/Personal-data column "phone" is not allowed/)
  })
})
