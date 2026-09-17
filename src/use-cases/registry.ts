import type { Locale } from "@/lib/observatory-i18n";

export type LocalizedText = Record<Locale, string>;
export type UseCaseIcon = "building" | "factory" | "heart" | "sparkles" | "users";
export type UseCaseTheme = "cyan" | "violet" | "amber" | "emerald" | "rose";
export type StudioRendererId = "gas-forecast";

export type DipUseCase = {
  id: string;
  route: string;
  navigation: { visible: boolean; order: number };
  title: LocalizedText;
  description: LocalizedText;
  tag: LocalizedText;
  presentation: { icon: UseCaseIcon; theme: UseCaseTheme; studioRenderer?: StudioRendererId };
  plugin?: { id: string; capability: string };
};

const visible = (order: number) => ({ visible: true, order }) as const;

export const DIP_USE_CASES: readonly DipUseCase[] = [
  { id: "customer-opportunities", route: "/customer-opportunities", navigation: visible(10), title: { en: "Customer Opportunities", uk: "Потенційні клієнти", pl: "Szanse sprzedażowe" }, description: { en: "Evidence-aware outreach prioritization with explicit opportunity, uncertainty and next action.", uk: "Пріоритизація потенційних клієнтів на основі доказів, потенціалу, невизначеності та наступної дії.", pl: "Priorytetyzacja kontaktów na podstawie dowodów, potencjału, niepewności i kolejnego działania." }, tag: { en: "COMMERCIAL", uk: "КОМЕРЦІЙНИЙ", pl: "KOMERCYJNY" }, presentation: { icon: "users", theme: "cyan" }, plugin: { id: "customer-opportunity", capability: "customer-opportunity-evaluation" } },
  { id: "resource-allocation", route: "/resource-allocation", navigation: visible(20), title: { en: "Resource Allocation", uk: "Розподіл ресурсів", pl: "Alokacja zasobów" }, description: { en: "Humanitarian mobile team allocation under capacity, skills, accessibility and travel constraints.", uk: "Розподіл гуманітарних мобільних команд з урахуванням пропускної здатності, навичок, доступності та обмежень на переміщення.", pl: "Alokacja mobilnych zespołów humanitarnych z uwzględnieniem przepustowości, kompetencji, dostępności i ograniczeń związanych z przejazdami." }, tag: { en: "HUMANITARIAN", uk: "ГУМАНІТАРНИЙ", pl: "HUMANITARNY" }, presentation: { icon: "heart", theme: "rose" } },
  { id: "gas-forecast", route: "/gas-forecast", navigation: visible(30), title: { en: "European Gas Forecasting", uk: "Прогнозування європейського газового ринку", pl: "Prognozowanie europejskiego rynku gazu" }, description: { en: "Market inputs, data providers and gas forecasting decision support in one workspace.", uk: "Ринкові дані, провайдери та підтримка рішень на основі прогнозу газового ринку в одному середовищі.", pl: "Dane rynkowe, dostawcy danych i wsparcie decyzji oparte na prognozie rynku gazu w jednym środowisku." }, tag: { en: "ENERGY", uk: "ЕНЕРГЕТИКА", pl: "ENERGIA" }, presentation: { icon: "sparkles", theme: "cyan", studioRenderer: "gas-forecast" }, plugin: { id: "gas-forecast", capability: "gas.forecast" } },
  { id: "production-decision", route: "/production-decision", navigation: visible(40), title: { en: "Production Decision", uk: "Виробничі рішення", pl: "Decyzje produkcyjne" }, description: { en: "Operational production state translated into explicit alternatives and decisions.", uk: "Перетворення операційного стану виробництва на явні альтернативи та рішення.", pl: "Przekształcenie stanu operacyjnego produkcji w jawne alternatywy i decyzje." }, tag: { en: "PRODUCTION", uk: "ВИРОБНИЦТВО", pl: "PRODUKCJA" }, presentation: { icon: "factory", theme: "emerald" } },
  { id: "production-replanning", route: "/production-replanning", navigation: visible(50), title: { en: "Production Replanning", uk: "Перепланування виробництва", pl: "Przeplanowanie produkcji" }, description: { en: "Real-time disruption response and production replanning.", uk: "Реакція на збої та перепланування виробництва в реальному часі.", pl: "Reakcja na zakłócenia i przeplanowanie produkcji w czasie rzeczywistym." }, tag: { en: "PRODUCTION", uk: "ВИРОБНИЦТВО", pl: "PRODUKCJA" }, presentation: { icon: "factory", theme: "amber" } },
  { id: "production-scheduling", route: "/production-scheduling", navigation: visible(60), title: { en: "Production Scheduling", uk: "Планування виробництва", pl: "Planowanie produkcji" }, description: { en: "Capacity, deadlines and disruptions in an interactive scheduling decision lab.", uk: "Потужності, терміни та збої в інтерактивній лабораторії планування.", pl: "Moce, terminy i zakłócenia w interaktywnym laboratorium planowania." }, tag: { en: "PRODUCTION", uk: "ВИРОБНИЦТВО", pl: "PRODUKCJA" }, presentation: { icon: "factory", theme: "cyan" } },
  { id: "supplier-decision", route: "/supplier-decision", navigation: visible(70), title: { en: "Supplier Decision", uk: "Вибір постачальника", pl: "Wybór dostawcy" }, description: { en: "Multi-criteria supplier evaluation with explicit constraints and alternatives.", uk: "Багатокритеріальна оцінка постачальників з явними обмеженнями та альтернативами.", pl: "Wielokryterialna ocena dostawców z jawnymi ograniczeniami i alternatywami." }, tag: { en: "SUPPLY", uk: "ПОСТАЧАННЯ", pl: "DOSTAWY" }, presentation: { icon: "building", theme: "emerald" } },
] as const;

export const observableUseCases = () => DIP_USE_CASES.filter((item) => item.navigation.visible).sort((a, b) => a.navigation.order - b.navigation.order);
export const findUseCaseById = (id: string) => DIP_USE_CASES.find((item) => item.id === id);
export const findUseCaseByRoute = (route: string) => DIP_USE_CASES.find((item) => item.route === route);
export function findUseCaseByPlugin(pluginId: string, capabilityId?: string): DipUseCase | undefined {
  return DIP_USE_CASES.find((item) => item.plugin?.id === pluginId && (!capabilityId || item.plugin.capability === capabilityId));
}
