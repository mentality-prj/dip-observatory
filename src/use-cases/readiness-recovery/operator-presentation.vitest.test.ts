import { describe, expect, it } from 'vitest'
import {
  defaultKernelView,
  templateKernelView,
  parseKernelView,
  moveKernelPanel,
  readKernelView,
  saveKernelView,
  KERNEL_VIEW_KEY,
  METRIC_KEYS,
  toggleKernelMetric,
} from './operator-presentation'
describe('Kernel operator presentation stays private-data free', () => {
  it('supports real reordering and density, with strict safe schema', () => {
    const view = moveKernelPanel(defaultKernelView(), 'EVIDENCE', -1)
    expect(view.panels).toEqual(['EXECUTE', 'EVIDENCE', 'REPLAN'])
    expect(parseKernelView({ ...view, density: 'COMPACT' }).density).toBe('COMPACT')
    expect(parseKernelView({ ...view, decisionId: 'private' })).toEqual(defaultKernelView())
    expect(parseKernelView({ ...view, panels: ['EXECUTE', 'EXECUTE', 'EVIDENCE'] })).toEqual(defaultKernelView())
  })
  it('applies operator-friendly presets without changing the decision contract', () => {
    const business = templateKernelView('BUSINESS')
    const analyst = templateKernelView('ANALYST')
    expect(business.panels).toEqual(['EVIDENCE', 'EXECUTE', 'REPLAN'])
    expect(analyst.panels).toEqual(['EVIDENCE', 'REPLAN', 'EXECUTE'])
    expect(business.version).toBe(3)
    expect(business.metrics).toEqual(['INPUT_JOBS', 'SCHEDULED_JOBS'])
    expect(analyst.metrics).toEqual(METRIC_KEYS)
    expect(analyst.details).toBe('DETAILED')
    expect(templateKernelView('OPERATIONS').startPanel).toBe('EXECUTE')
    expect(business.startPanel).toBe('EVIDENCE')
    expect(business).not.toHaveProperty('decisionId')
    expect(business).not.toHaveProperty('solver')
    expect(business).not.toHaveProperty('policy')
  })

  it('migrates v1 presentation-only settings and strictly rejects unsafe preferences', () => {
    const v1 = { version: 1, density: 'COMPACT', panels: ['EVIDENCE', 'EXECUTE', 'REPLAN'] }
    expect(parseKernelView(v1)).toEqual({
      ...v1,
      version: 3,
      startPanel: 'EXECUTE',
      details: 'SUMMARY',
      metrics: [...METRIC_KEYS],
    })
    expect(parseKernelView({ ...v1, decisionId: 'tenant-private' })).toEqual(defaultKernelView())
    const current = { ...defaultKernelView(), metrics: ['DONORS'] }
    expect(parseKernelView(current).metrics).toEqual(['DONORS'])
    expect(parseKernelView({ ...current, metrics: [] })).toEqual(defaultKernelView())
    expect(parseKernelView({ ...current, metrics: ['DONORS', 'DONORS'] })).toEqual(defaultKernelView())
    expect(parseKernelView({ ...current, metrics: ['API_KEY'] })).toEqual(defaultKernelView())
    expect(parseKernelView({ ...current, tenantId: 'secret' })).toEqual(defaultKernelView())
  })

  it('migrates v2, rejects private fields and invalid starting-view configuration', () => {
    const old = {
      version: 2,
      density: 'COMPACT',
      panels: ['EVIDENCE', 'EXECUTE', 'REPLAN'],
      metrics: ['TECHNICIANS', 'DONORS'],
    }
    const migrated = parseKernelView(old)
    expect(migrated).toMatchObject({
      version: 3,
      startPanel: 'EXECUTE',
      details: 'SUMMARY',
      metrics: ['TECHNICIANS', 'DONORS'],
    })
    expect(parseKernelView({ ...defaultKernelView(), startPanel: 'SECRET' })).toEqual(defaultKernelView())
    expect(parseKernelView({ ...defaultKernelView(), details: 'PRIVATE' })).toEqual(defaultKernelView())
    expect(parseKernelView({ ...defaultKernelView(), tenantId: 'org-1' })).toEqual(defaultKernelView())
    expect(parseKernelView({ ...defaultKernelView(), optimizer: 'override' })).toEqual(defaultKernelView())
  })

  it('changes displayed metric selection without touching solver or evidence', () => {
    const original = defaultKernelView()
    const hidden = toggleKernelMetric(original, 'DONORS')
    expect(hidden.metrics).toEqual(['INPUT_JOBS', 'SCHEDULED_JOBS', 'TECHNICIANS'])
    expect(original.metrics).toEqual(METRIC_KEYS)
    expect(toggleKernelMetric(hidden, 'DONORS').metrics).toEqual(METRIC_KEYS)
    const last = parseKernelView({ ...original, metrics: ['INPUT_JOBS'] })
    expect(toggleKernelMetric(last, 'INPUT_JOBS')).toEqual(last)
    expect(toggleKernelMetric(last, 'UNKNOWN' as 'DONORS')).toEqual(last)
    expect(hidden).not.toHaveProperty('decisionId')
    expect(hidden).not.toHaveProperty('solver')
  })

  it('restores and fails closed without localStorage availability', () => {
    let raw = ''
    const storage = {
      getItem: (key: string) => {
        expect(key).toBe(KERNEL_VIEW_KEY)
        return raw
      },
      setItem: (k: string, value: string) => {
        expect(k).toBe(KERNEL_VIEW_KEY)
        raw = value
      },
    }
    const view = moveKernelPanel(defaultKernelView(), 'EVIDENCE', -1)
    expect(saveKernelView(storage, view)).toBe(true)
    expect(readKernelView(storage)).toEqual(view)
    expect(
      saveKernelView(
        {
          setItem: () => {
            throw new Error('denied')
          },
        },
        view
      )
    ).toBe(false)
    expect(readKernelView({ getItem: () => '{broken' })).toEqual(defaultKernelView())
  })
})
