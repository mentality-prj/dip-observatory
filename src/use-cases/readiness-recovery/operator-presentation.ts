/** Kernel workspace presentation only. Never store decisions, tenant data or credentials here. */
export type KernelPanel = 'EXECUTE' | 'REPLAN' | 'EVIDENCE'
export const PANEL_KEYS: readonly KernelPanel[] = ['EXECUTE', 'REPLAN', 'EVIDENCE']
export type KernelMetric = 'INPUT_JOBS' | 'SCHEDULED_JOBS' | 'TECHNICIANS' | 'DONORS'
export const METRIC_KEYS: readonly KernelMetric[] = ['INPUT_JOBS', 'SCHEDULED_JOBS', 'TECHNICIANS', 'DONORS']
// Preserve this storage key to migrate existing v1 UI-only preferences in place.
export const KERNEL_VIEW_KEY = 'qdip.observatory.rr-kernel.view.v1'
export type KernelView = {
  version: 2
  density: 'COMFORTABLE' | 'COMPACT'
  panels: KernelPanel[]
  metrics: KernelMetric[]
}
export function defaultKernelView(): KernelView {
  return {
    version: 2,
    density: 'COMFORTABLE',
    panels: [...PANEL_KEYS],
    metrics: [...METRIC_KEYS],
  }
}
/** Presentation-only presets. No Kernel solver, objectives, input, policy or evidence can be altered. */
export function templateKernelView(template: 'BUSINESS' | 'ANALYST'): KernelView {
  return template === 'BUSINESS'
    ? {
        version: 2,
        density: 'COMFORTABLE',
        panels: ['EVIDENCE', 'EXECUTE', 'REPLAN'],
        metrics: ['INPUT_JOBS', 'SCHEDULED_JOBS'],
      }
    : defaultKernelView()
}
export function parseKernelView(data: unknown): KernelView {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return defaultKernelView()
  const x = data as Record<string, unknown>
  const isV1 = x.version === 1
  if (
    Object.keys(x).some(
      (k) => !(isV1 ? ['version', 'density', 'panels'] : ['version', 'density', 'panels', 'metrics']).includes(k)
    ) ||
    ![1, 2].includes(x.version as number) ||
    !['COMFORTABLE', 'COMPACT'].includes(String(x.density)) ||
    !Array.isArray(x.panels) ||
    x.panels.length !== PANEL_KEYS.length ||
    new Set(x.panels).size !== PANEL_KEYS.length ||
    x.panels.some((k) => !PANEL_KEYS.includes(k as KernelPanel))
  )
    return defaultKernelView()
  if (
    !isV1 &&
    (!Array.isArray(x.metrics) ||
      x.metrics.length < 1 ||
      x.metrics.length > METRIC_KEYS.length ||
      new Set(x.metrics).size !== x.metrics.length ||
      x.metrics.some((k) => !METRIC_KEYS.includes(k as KernelMetric)))
  )
    return defaultKernelView()
  // Exact known identifiers only; old v1 layouts gain all four non-sensitive metrics.
  const enabled = isV1 ? [...METRIC_KEYS] : METRIC_KEYS.filter((key) => (x.metrics as KernelMetric[]).includes(key))
  return {
    version: 2,
    density: x.density as KernelView['density'],
    panels: [...x.panels] as KernelPanel[],
    metrics: enabled,
  }
}
export function moveKernelPanel(view: KernelView, key: KernelPanel, direction: -1 | 1): KernelView {
  const panels = [...view.panels],
    at = panels.indexOf(key),
    target = at + direction
  if (at < 0 || target < 0 || target >= panels.length) return view
  ;[panels[at], panels[target]] = [panels[target], panels[at]]
  return { ...view, panels }
}
export function toggleKernelMetric(view: KernelView, key: KernelMetric): KernelView {
  if (!METRIC_KEYS.includes(key)) return view
  if (view.metrics.includes(key) && view.metrics.length === 1) return view
  const metrics = METRIC_KEYS.filter((item) =>
    item === key ? !view.metrics.includes(item) : view.metrics.includes(item)
  )
  return { ...view, metrics }
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
