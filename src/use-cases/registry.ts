import type { Locale } from "@/lib/observatory-i18n";
import type { DecisionPatternId } from "@/product/experience";

export type LocalizedText = Record<Locale, string>;
export type UseCaseIcon = "heart" | "sparkles";
export type UseCaseTheme = "cyan" | "violet" | "amber" | "emerald" | "rose";
export type StudioRendererId = "gas-forecast";

export type DipUseCase = {
  id: string;
  route: string;
  navigation: { visible: boolean; order: number };
  decisionPattern: DecisionPatternId;
  title: LocalizedText;
  description: LocalizedText;
  tag: LocalizedText;
  presentation: { icon: UseCaseIcon; theme: UseCaseTheme; studioRenderer?: StudioRendererId };
  plugin?: { id: string; capability: string };
};

const visible = (order: number) => ({ visible: true, order }) as const;

const useCases = [
  { id: "gas-forecast", route: "/gas-forecast", navigation: visible(10), decisionPattern: "decide", title: { en: "European Gas Forecasting", uk: "Прогнозування європейського газового ринку", pl: "Prognozowanie europejskiego rynku gazu" }, description: { en: "Market inputs, data providers and gas forecasting decision support in one workspace.", uk: "Ринкові дані, провайдери та підтримка рішень на основі прогнозу газового ринку в одному середовищі.", pl: "Dane rynkowe, dostawcy danych i wsparcie decyzji oparte na prognozie rynku gazu w jednym środowisku." }, tag: { en: "ENERGY", uk: "ЕНЕРГЕТИКА", pl: "ENERGIA" }, presentation: { icon: "sparkles", theme: "cyan", studioRenderer: "gas-forecast" }, plugin: { id: "gas-forecast", capability: "gas.forecast" } },
  { id: "resource-allocation", route: "/resource-allocation", navigation: visible(20), decisionPattern: "allocate", title: { en: "Resource Allocation", uk: "Розподіл ресурсів", pl: "Alokacja zasobów" }, description: { en: "Humanitarian mobile team allocation under capacity, skills, accessibility and travel constraints.", uk: "Розподіл гуманітарних мобільних команд з урахуванням пропускної здатності, навичок, доступності та обмежень на переміщення.", pl: "Alokacja mobilnych zespołów humanitarnych z uwzględnieniem przepustowości, kompetencji, dostępności i ograniczeń związanych z przejazdami." }, tag: { en: "HUMANITARIAN", uk: "ГУМАНІТАРНИЙ", pl: "HUMANITARNY" }, presentation: { icon: "heart", theme: "rose" } },
  { id: "gtm-lab", route: "/gtm-lab", navigation: visible(30), decisionPattern: "prioritize", title: { en: "GTM Decision Lab", uk: "Лабораторія GTM рішень", pl: "Laboratorium decyzji GTM" }, description: { en: "Evaluate commercial opportunities under incomplete market evidence and decide whether to pursue, research or skip.", uk: "Оцінка комерційних можливостей за неповних ринкових даних: опрацювати, дослідити або відхилити.", pl: "Ocena możliwości komercyjnych przy niepełnych danych rynkowych: rozwijać, zbadać lub pominąć." }, tag: { en: "GO-TO-MARKET", uk: "GO-TO-MARKET", pl: "GO-TO-MARKET" }, presentation: { icon: "sparkles", theme: "emerald" }, plugin: { id: "gtm-lab", capability: "gtm.demo.run" } },
] as const satisfies readonly DipUseCase[];

export type UseCaseId = (typeof useCases)[number]["id"];
export const DIP_USE_CASES: readonly DipUseCase[] = useCases;
export const observableUseCases = () => [...DIP_USE_CASES].filter((item) => item.navigation.visible).sort((a, b) => a.navigation.order - b.navigation.order);
export const findUseCaseById = (id: string) => DIP_USE_CASES.find((item) => item.id === id);
export const findUseCaseByRoute = (route: string) => DIP_USE_CASES.find((item) => item.route === route);
export function findUseCaseByPlugin(pluginId: string, capabilityId?: string): DipUseCase | undefined { return DIP_USE_CASES.find((item) => item.plugin?.id === pluginId && (!capabilityId || item.plugin.capability === capabilityId)); }
