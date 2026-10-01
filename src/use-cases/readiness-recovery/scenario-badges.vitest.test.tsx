import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ScenarioLabel } from './domain'
import { ScenarioBadges, scenarioRoles } from './scenario-badges'

const translations: Record<ScenarioLabel, string> = {
  MAXIMUM_READINESS: 'Maximum readiness',
  FAST_RECOVERY: 'Fast recovery',
  PARTS_CONSERVATIVE: 'Parts conservative',
  LOW_RISK: 'Low risk',
  BALANCED: 'Balanced',
}

describe('Readiness Recovery scenario badges', () => {
  it('keeps every objective role instead of collapsing to the primary label', () => {
    expect(
      scenarioRoles('MAXIMUM_READINESS', ['MAXIMUM_READINESS', 'FAST_RECOVERY', 'LOW_RISK'])
    ).toEqual(['MAXIMUM_READINESS', 'FAST_RECOVERY', 'LOW_RISK'])
  })

  it('renders all objective roles for one scenario', () => {
    render(
      <ScenarioBadges
        label="MAXIMUM_READINESS"
        labels={['MAXIMUM_READINESS', 'FAST_RECOVERY', 'LOW_RISK']}
        translations={translations}
      />
    )

    expect(screen.getByText('Maximum readiness')).toBeInTheDocument()
    expect(screen.getByText('Fast recovery')).toBeInTheDocument()
    expect(screen.getByText('Low risk')).toBeInTheDocument()
    expect(screen.getAllByTestId('scenario-objective-badges')).toHaveLength(1)
  })

  it('falls back to the primary label for legacy scenarios', () => {
    expect(scenarioRoles('BALANCED')).toEqual(['BALANCED'])
  })
})
