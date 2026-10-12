/** RR display preferences only. No tenant, input, evidence, policy or decision state may be stored. */
export type KernelPanel = 'EXECUTE' | 'REPLAN' | 'EVIDENCE'
export const PANEL_KEYS: readonly KernelPanel[] = ['EXECUTE', 'REPLAN', 'EVIDENCE']
export type KernelMetric = 'INPUT_JOBS' | 'SCHEDULED_JOBS' | 'TECHNICIANS' | 'DONORS'
export const METRIC_KEYS: readonly KernelMetric[] = ['INPUT_JOBS', 'SCHEDULED_JOBS', 'TECHNICIANS', 'DONORS']
// Preserve the existing key: migrate v1/v2 in place without copying sensitive state.
export const KERNEL_VIEW_KEY = 'qdip.observatory.rr-kernel.view.v1'
export type KernelView = {
  version: 3
  density: 'COMFORTABLE' | 'COMPACT'
  panels: KernelPanel[]
  metrics: KernelMetric[]
  startPanel: KernelPanel
  details: 'SUMMARY' | 'DETAILED'
}

export function defaultKernelView(): KernelView {
  return {
    version: 3,
    density: 'COMFORTABLE',
    panels: [...PANEL_KEYS],
    metrics: [...METRIC_KEYS],
    startPanel: 'EXECUTE',
    details: 'SUMMARY',
  }
}

/** Bounded presentation-only templates; no new solver, evidence engine or permission implied. */
export type KernelTemplate = 'BUSINESS' | 'OPERATIONS' | 'ANALYST'
export function templateKernelView(template: KernelTemplate): KernelView {
  switch (template) {
    case 'BUSINESS':
      return {
        ...defaultKernelView(),
        panels: ['EVIDENCE', 'EXECUTE', 'REPLAN'],
        metrics: ['INPUT_JOBS', 'SCHEDULED_JOBS'],
        startPanel: 'EVIDENCE',
      }
    case 'OPERATIONS':
      return {
        ...defaultKernelView(),
        panels: ['EXECUTE', 'REPLAN', 'EVIDENCE'],
        startPanel: 'EXECUTE',
      }
    case 'ANALYST':
      return {
        ...defaultKernelView(),
        panels: ['EVIDENCE', 'REPLAN', 'EXECUTE'],
        startPanel: 'EVIDENCE',
        details: 'DETAILED',
      }
  }
}

export function parseKernelView(data: unknown): KernelView {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return defaultKernelView()
  const x = data as Record<string, unknown>
  const v1 = x.version === 1
  const v2 = x.version === 2
  const v3 = x.version === 3
  const keys = v1
    ? ['version', 'density', 'panels']
    : v2
      ? ['version', 'density', 'panels', 'metrics']
      : ['version', 'density', 'panels', 'metrics', 'startPanel', 'details']
  if (
    !(v1 || v2 || v3) ||
    Object.keys(x).some((k) => !keys.includes(k)) ||
    !['COMFORTABLE', 'COMPACT'].includes(String(x.density)) ||
    !Array.isArray(x.panels) ||
    x.panels.length !== PANEL_KEYS.length ||
    new Set(x.panels).size !== PANEL_KEYS.length ||
    x.panels.some((k) => !PANEL_KEYS.includes(k as KernelPanel)) ||
    (!v1 &&
      (!Array.isArray(x.metrics) ||
        x.metrics.length < 1 ||
        x.metrics.length > METRIC_KEYS.length ||
        new Set(x.metrics).size !== x.metrics.length ||
        x.metrics.some((k) => !METRIC_KEYS.includes(k as KernelMetric)))) ||
    (v3 && (!PANEL_KEYS.includes(x.startPanel as KernelPanel) || !['SUMMARY', 'DETAILED'].includes(String(x.details))))
  )
    return defaultKernelView()

  return {
    version: 3,
    density: x.density as KernelView['density'],
    panels: [...x.panels] as KernelPanel[],
    metrics: v1 ? [...METRIC_KEYS] : METRIC_KEYS.filter((key) => (x.metrics as KernelMetric[]).includes(key)),
    startPanel: v3 ? (x.startPanel as KernelPanel) : 'EXECUTE',
    details: v3 ? (x.details as KernelView['details']) : 'SUMMARY',
  }
}

export function moveKernelPanel(view: KernelView, key: KernelPanel, direction: -1 | 1): KernelView {
  const panels = [...view.panels]
  const at = panels.indexOf(key)
  const target = at + direction
  if (at < 0 || target < 0 || target >= panels.length) return view
  ;[panels[at], panels[target]] = [panels[target], panels[at]]
  return { ...view, panels }
}
export function toggleKernelMetric(view: KernelView, key: KernelMetric): KernelView {
  if (!METRIC_KEYS.includes(key)) return view
  if (view.metrics.includes(key) && view.metrics.length === 1) return view
  return {
    ...view,
    metrics: METRIC_KEYS.filter((item) => (item === key ? !view.metrics.includes(item) : view.metrics.includes(item))),
  }
}
export function readKernelView(storage: Pick<Storage, 'getItem'>): KernelView {
  try {
    return parseKernelView(JSON.parse(storage.getItem(KERNEL_VIEW_KEY) ?? 'null') as unknown)
  } catch {
    return defaultKernelView()
  }
}
export function saveKernelView(storage: Pick<Storage, 'setItem'>, view: KernelView): boolean {
  try {
    storage.setItem(KERNEL_VIEW_KEY, JSON.stringify(parseKernelView(view)))
    return true
  } catch {
    return false
  }
}
