import { observableUseCases, type UseCaseTheme } from '@/use-cases/registry'

export type ObservatoryApplicationKind = 'challenge' | 'intake' | 'use-case'
export type ObservatoryApplicationIcon = 'scale' | 'upload' | 'heart' | 'network' | 'sparkles'
export type ObservatoryApplication = {
  id: string
  route: string
  kind: ObservatoryApplicationKind
  order: number
  theme: UseCaseTheme
  icon: ObservatoryApplicationIcon
  useCaseId?: string
}

const SYSTEM_APPLICATIONS: readonly ObservatoryApplication[] = [
  { id: 'decision-challenge', route: '/challenges', kind: 'challenge', order: 10, theme: 'cyan', icon: 'scale' },
  { id: 'decision-intake', route: '/decision-intake', kind: 'intake', order: 20, theme: 'violet', icon: 'upload' },
]

const USE_CASE_ICONS: Record<string, ObservatoryApplicationIcon> = {
  'resource-allocation': 'heart',
  'supply-network-optimization': 'network',
  'gtm-lab': 'sparkles',
}

export const observableApplications = (): ObservatoryApplication[] =>
  [
    ...SYSTEM_APPLICATIONS,
    ...observableUseCases().map((item) => ({
      id: item.id,
      route: item.route,
      kind: 'use-case' as const,
      order: item.navigation.order + 20,
      theme: item.presentation.theme,
      icon: USE_CASE_ICONS[item.id] ?? 'sparkles',
      useCaseId: item.id,
    })),
  ].sort((a, b) => a.order - b.order)

export const findObservatoryApplicationByRoute = (route: string) =>
  observableApplications().find((item) => route === item.route || route.startsWith(`${item.route}/`))
