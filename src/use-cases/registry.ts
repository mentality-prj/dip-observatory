import type { Locale } from '@/lib/observatory-i18n'
import type { DecisionPatternId } from '@/product/experience'
import { PUBLIC_DEMO_NAMES } from '@/product/public-product-policy'

export type LocalizedText = Record<Locale, string>
export type UseCaseIcon = 'heart' | 'sparkles' | 'network'
export type UseCaseTheme = 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose'
export type StudioRendererId = 'gas-forecast'
export type DipUseCase = {
  id: string
  route: string
  navigation: { visible: boolean; order: number }
  decisionPattern: DecisionPatternId
  title: LocalizedText
  description: LocalizedText
  tag: LocalizedText
  presentation: { icon: UseCaseIcon; theme: UseCaseTheme; studioRenderer?: StudioRendererId }
  plugin: { id: string; capability: string }
}
const visible = (order: number) => ({ visible: true, order }) as const

const useCases = [
  {
    id: 'resource-allocation',
    route: '/resource-allocation',
    navigation: visible(10),
    decisionPattern: 'allocate',
    title: { en: PUBLIC_DEMO_NAMES.resourceAllocation, uk: PUBLIC_DEMO_NAMES.resourceAllocation, pl: PUBLIC_DEMO_NAMES.resourceAllocation },
    description: {
      en: 'Humanitarian mobile team allocation under capacity, skills, accessibility and travel constraints.',
      uk: 'Розподіл гуманітарних мобільних команд з урахуванням пропускної здатності, навичок, доступності та обмежень на переміщення.',
      pl: 'Alokacja mobilnych zespołów humanitarnych z uwzględnieniem przepustowości, kompetencji, dostępności i ograniczeń związanych z przejazdami.',
    },
    tag: { en: 'HUMANITARIAN', uk: 'ГУМАНІТАРНИЙ', pl: 'HUMANITARNY' },
    presentation: { icon: 'heart', theme: 'rose' },
    plugin: { id: 'resource-allocation', capability: 'humanitarian.resource-allocation.optimize' },
  },
  {
    id: 'supply-network-optimization',
    route: '/supply-network-optimization',
    navigation: visible(20),
    decisionPattern: 'allocate',
    title: {
      en: PUBLIC_DEMO_NAMES.supplyNetworkOptimization,
      uk: PUBLIC_DEMO_NAMES.supplyNetworkOptimization,
      pl: PUBLIC_DEMO_NAMES.supplyNetworkOptimization,
    },
    description: {
      en: 'Optimize inventory placement, inbound allocation and store fulfillment, then recalculate the network when capacity changes.',
      uk: 'Оптимізація розміщення запасів, вхідних поставок і постачання точок попиту з перерахунком мережі при зміні доступної потужності.',
      pl: 'Optymalizacja rozmieszczenia zapasów, dostaw przychodzących i obsługi punktów popytu z ponownym przeliczeniem sieci po zmianie dostępnej przepustowości.',
    },
    tag: { en: 'SUPPLY NETWORK', uk: 'МЕРЕЖА ПОСТАЧАННЯ', pl: 'SIEĆ DOSTAW' },
    presentation: { icon: 'network', theme: 'amber' },
    plugin: { id: 'supply-network', capability: 'supply.network.optimize' },
  },
  {
    id: 'gtm-lab',
    route: '/gtm-lab',
    navigation: visible(30),
    decisionPattern: 'prioritize',
    title: { en: PUBLIC_DEMO_NAMES.gtmLab, uk: PUBLIC_DEMO_NAMES.gtmLab, pl: PUBLIC_DEMO_NAMES.gtmLab },
    description: {
      en: 'Evaluate commercial opportunities under incomplete market evidence and decide whether to pursue, research or skip.',
      uk: 'Оцінка комерційних можливостей за неповних ринкових даних: опрацювати, дослідити або відхилити.',
      pl: 'Ocena możliwości komercyjnych przy niepełnych danych rynkowych: rozwijać, zbadać lub pominąć.',
    },
    tag: { en: 'GO-TO-MARKET', uk: 'ВИХІД НА РИНОК', pl: 'WEJŚCIE NA RYNEK' },
    presentation: { icon: 'sparkles', theme: 'emerald' },
    plugin: { id: 'gtm-lab', capability: 'gtm.demo.run' },
  },
] as const satisfies readonly DipUseCase[]

export type UseCaseId = (typeof useCases)[number]['id']
export const DIP_USE_CASES: readonly DipUseCase[] = useCases
export const observableUseCases = () =>
  [...DIP_USE_CASES].filter((item) => item.navigation.visible).sort((a, b) => a.navigation.order - b.navigation.order)
export const findUseCaseById = (id: string) => DIP_USE_CASES.find((item) => item.id === id)
export const findUseCaseByRoute = (route: string) => DIP_USE_CASES.find((item) => item.route === route)
export function findUseCaseByPlugin(pluginId: string, capabilityId?: string): DipUseCase | undefined {
  return DIP_USE_CASES.find(
    (item) => item.plugin.id === pluginId && (!capabilityId || item.plugin.capability === capabilityId)
  )
}
