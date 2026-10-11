/** Separate from legacy Monte Carlo dashboard settings: Kernel operator widgets are not simulation widgets. */
export type KernelPanel = 'EXECUTE' | 'REPLAN' | 'EVIDENCE'
export const PANEL_KEYS: readonly KernelPanel[] = ['EXECUTE', 'REPLAN', 'EVIDENCE']
export const KERNEL_VIEW_KEY = 'qdip.observatory.rr-kernel.view.v1'
export type KernelView = { version: 1; density: 'COMFORTABLE' | 'COMPACT'; panels: KernelPanel[] }
export function defaultKernelView(): KernelView {
  return { version: 1, density: 'COMFORTABLE', panels: [...PANEL_KEYS] }
}
/** Presentation-only presets; never touch Kernel goals, solver parameters or evidence. */
export function templateKernelView(template: 'BUSINESS' | 'ANALYST'): KernelView {
  return template === 'BUSINESS'
    ? { version: 1, density: 'COMFORTABLE', panels: ['EVIDENCE', 'EXECUTE', 'REPLAN'] }
    : defaultKernelView()
}
export function parseKernelView(data: unknown): KernelView {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return defaultKernelView()
  const x = data as Record<string, unknown>
  if (
    Object.keys(x).some((k) => !['version', 'density', 'panels'].includes(k)) ||
    x.version !== 1 ||
    !['COMFORTABLE', 'COMPACT'].includes(String(x.density)) ||
    !Array.isArray(x.panels) ||
    x.panels.length !== 3 ||
    new Set(x.panels).size !== 3 ||
    x.panels.some((k) => !PANEL_KEYS.includes(k as KernelPanel))
  )
    return defaultKernelView()
  return { version: 1, density: x.density as KernelView['density'], panels: [...x.panels] as KernelPanel[] }
}
export function moveKernelPanel(view: KernelView, key: KernelPanel, direction: -1 | 1): KernelView {
  const panels = [...view.panels],
    at = panels.indexOf(key),
    target = at + direction
  if (at < 0 || target < 0 || target >= panels.length) return view
  ;[panels[at], panels[target]] = [panels[target], panels[at]]
  return { ...view, panels }
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
