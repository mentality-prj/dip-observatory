import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { KernelReferencePreview } from './kernel-reference-preview'

describe('public RR reference is useful without a second solver', () => {
  it('shows a civilian input-only scenario before authentication in every locale', () => {
    for (const locale of ['en', 'uk', 'pl'] as const) {
      const html = renderToStaticMarkup(<KernelReferencePreview locale={locale} />)
      expect(html).toContain('data-testid="rr-reference-preview"')
      for (const task of ['diagnostic-check', 'filter-replacement', 'safety-cable-check', 'sensor-service']) {
        expect(html).toContain(task)
      }
      expect(html).not.toContain('OPTIMAL')
      expect(html).not.toContain('KERNEL_VERIFIED')
      expect(html).not.toContain('<form')
    }
  })

  it('uses backend outcomes for the decision-first result, not React calculations', () => {
    const root = join(process.cwd(), 'src/use-cases/readiness-recovery')
    const kernel = readFileSync(join(root, 'kernel-workspace.tsx'), 'utf8')
    const operator = readFileSync(join(root, 'production-operator-panel.tsx'), 'utf8')
    expect(kernel).toContain('<KernelReferencePreview locale={locale} />')
    expect(kernel).toContain('<RRProductionOperatorPanel locale={locale} />')
    expect(operator).toContain('data-testid="rr-decision-first"')
    expect(operator).toContain('visibleMetrics={view.metrics}')
    expect(operator).toContain('scheduleSearch={scheduleSearch}')
    expect(operator).toContain('<RRExecutionComparison')
    expect(operator).toContain('loadExistingPresentation()')
    expect(operator.indexOf('data-testid="rr-decision-first"')).toBeLessThan(
      operator.indexOf('data-testid="rr-operator-preferences"')
    )
    expect(operator).toContain('data-testid="rr-technical-response"')
    expect(operator).toContain('<details')
    expect(operator).not.toMatch(/planReadinessRecovery|new BoundedFeasibilityBackend/)
  })
})
