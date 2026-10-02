import { describe, expect, it } from 'vitest'
import { applicationScenarioContext } from './application-context'

const locales = ['en', 'uk', 'pl'] as const
const staticContextUseCases = ['resource-allocation', 'supply-network-optimization', 'gtm-lab'] as const

describe('application scenario context', () => {
  for (const locale of locales) {
    for (const id of staticContextUseCases) {
      it(`${locale}/${id} has analyst-readable decision context`, () => {
        const context = applicationScenarioContext(id, locale)
        expect(context).not.toBeNull()
        expect(context?.situation.length).toBeGreaterThan(20)
        expect(context?.decisionQuestion.length).toBeGreaterThan(20)
        expect(context?.dataSummary.length).toBeGreaterThan(0)
        expect(context?.constraints.length).toBeGreaterThan(0)
        expect(context?.uncertainty.length).toBeGreaterThan(0)
        expect(context?.testPurpose.length).toBeGreaterThan(20)
      })
    }
  }
})
