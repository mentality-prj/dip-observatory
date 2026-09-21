import { describe, expect, it } from 'vitest'
import { RESPONSIBLE_CITIZENS_PROFILE, resourceAllocationStats } from './demo-data'

describe('Responsible Citizens canonical demo case', () => {
  it('keeps the canonical demand arithmetic stable', () => {
    const stats = resourceAllocationStats(RESPONSIBLE_CITIZENS_PROFILE)
    expect(stats).toMatchObject({
      communities: 5,
      teams: 5,
      openingNeeds: 307,
      incomingNeeds: 13,
      horizonNeeds: 320,
      services: 4,
      days: 5,
    })
    expect(RESPONSIBLE_CITIZENS_PROFILE.provenance).toMatchObject({
      source: 'responsible-citizens-canonical-v1',
      case_id: 'responsible-citizens-canonical-v1',
      planning_unit: 'synthetic-service-demand-unit',
    })
  })

  it('defines a complete five-day baseline plan', () => {
    const days = RESPONSIBLE_CITIZENS_PROFILE.planning_period?.days ?? []
    const baseline = RESPONSIBLE_CITIZENS_PROFILE.baseline_plan
    expect(baseline).toBeTruthy()
    expect(Object.keys(baseline ?? {})).toEqual(days)
    for (const day of days) {
      expect(Object.keys(baseline?.[day] ?? {})).toHaveLength(5)
    }
  })
})
