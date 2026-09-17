import type { Locale } from "@/lib/observatory-i18n";

export type LocalizedText = Record<Locale, string>;
export type UseCaseIcon = "building" | "factory" | "heart" | "sparkles" | "users";

export type DipUseCase = {
  id: string;
  route: string;
  title: LocalizedText;
  description: LocalizedText;
  tag: LocalizedText;
  icon: UseCaseIcon;
  plugin?: {
    id: string;
    capability: string;
    /** Optional specialized Studio audit renderer. Generic rendering is the default. */
    studioRenderer?: "gas-forecast";
  };
};

/**
 * Single frontend manifest for QDIP applications.
 *
 * Adding a use case here makes it discoverable by Observatory and, when `plugin`
 * is declared, lets Studio link the registered DIP plugin to its demonstrator.
 * Keep domain execution/configuration in the DIP plugin; this registry only owns
 * frontend discovery and presentation metadata.
 */
export const DIP_USE_CASES: readonly DipUseCase[] = [
  { id: "customer-opportunities", route: "/customer-opportunities", title: { en: "Customer Opportunities", uk: "Потенційні клієнти", pl: "Szanse sprzedażowe" }, description: { en: "Evidence-aware outreach prioritization with explicit opportunity, uncertainty and next action.", uk: "Пріоритизація потенційних клієнтів за доказами, можливістю, невизначеністю та наступною дією.", pl: "Priorytetyzacja kontaktów na podstawie dowodów, szansy, niepewności i następnej akcji." }, tag: { en: "COMMERCIAL", uk: "КОМЕРЦІЙНИЙ", pl: "KOMERCYJNY" }, icon: "users", plugin: { id: "customer-opportunity", capability: "customer-opportunity-evaluation" } },
  { id: "resource-allocation", route: "/resource-allocation", title: { en: "Resource Allocation", uk: "Розподіл ресурсів", pl: "Alokacja zasobów" }, description: { en: "Humanitarian mobile-team allocation under capacity, skills, accessibility and travel constraints.", uk: "Розподіл гуманітарних мобільних команд з урахуванням місткості, навичок, доступності та переміщення.", pl: "Alokacja mobilnych zespołów humanitarnych z uwzględnieniem pojemności, kompetencji, dostępności i przejazdów." }, tag: { en: "HUMANITARIAN", uk: "ГУМАНІТАРНИЙ", pl: "HUMANITARNY" }, icon: "heart" },
  { id: "gas-forecast", route: "/gas-forecast", title: { en: "European Gas Forecasting", uk: "Прогнозування європейського газового ринку", pl: "Prognozowanie europejskiego rynku gazu" }, description: { en: "Market inputs, data providers and gas forecasting decision support in one workspace.", uk: "Ринкові дані, провайдери та підтримка рішень на основі прогнозу газового ринку в одному середовищі.", pl: "Dane rynkowe, dostawcy danych i wsparcie decyzji oparte na prognozie rynku gazu w jednym środowisku." }, tag: { en: "ENERGY", uk: "ЕНЕРГЕТИКА", pl: "ENERGIA" }, icon: "sparkles", plugin: { id: "gas-forecast", capability: "gas.forecast", studioRenderer: "gas-forecast" } },
  { id: "production-decision", route: "/production-decision", title: { en: "Production Decision", uk: "Виробничі рішення", pl: "Decyzje produkcyjne" }, description: { en: "Operational production state translated into explicit alternatives and decisions.", uk: "Перетворення операційного стану виробництва на явні альтернативи та рішення.", pl: "Przekształcenie stanu operacyjnego produkcji w jawne alternatywy i decyzje." }, tag: { en: "PRODUCTION", uk: "ВИРОБНИЦТВО", pl: "PRODUKCJA" }, icon: "factory" },
  { id: "production-replanning", route: "/production-replanning", title: { en: "Production Replanning", uk: "Перепланування виробництва", pl: "Przeplanowanie produkcji" }, description: { en: "Real-time disruption response and production replanning.", uk: "Реакція на збої та перепланування виробництва в реальному часі.", pl: "Reakcja na zakłócenia i przeplanowanie produkcji w czasie rzeczywistym." }, tag: { en: "PRODUCTION", uk: "ВИРОБНИЦТВО", pl: "PRODUKCJA" }, icon: "factory" },
  { id: "production-scheduling", route: "/production-scheduling", title: { en: "Production Scheduling", uk: "Планування виробництва", pl: "Planowanie produkcji" }, description: { en: "Capacity, deadlines and disruptions in an interactive scheduling decision lab.", uk: "Потужності, терміни та збої в інтерактивній лабораторії планування.", pl: "Moce, terminy i zakłócenia w interaktywnej laboratorium planowania." }, tag: { en: "PRODUCTION", uk: "ВИРОБНИЦТВО", pl: "PRODUKCJA" }, icon: "factory" },
  { id: "supplier-decision", route: "/supplier-decision", title: { en: "Supplier Decision", uk: "Вибір постачальника", pl: "Wybór dostawcy" }, description: { en: "Multi-criteria supplier evaluation with explicit constraints and alternatives.", uk: "Багатокритеріальна оцінка постачальників з явними обмеженнями та альтернативами.", pl: "Wielokryterialna ocena dostawców z jawnymi ograniczeniami i alternatywami." }, tag: { en: "SUPPLY", uk: "ПОСТАЧАННЯ", pl: "DOSTAWY" }, icon: "building" },
  { id: "wsp-demand-forecast", route: "/wsp-demand-forecast", title: { en: "WSP Demand Forecast", uk: "WSP прогноз попиту", pl: "WSP prognoza popytu" }, description: { en: "Company-specific demand forecasting demonstrator.", uk: "Демонстратор прогнозування попиту для конкретної компанії.", pl: "Demonstrator prognozowania popytu dla konkretnej firmy." }, tag: { en: "PARTNER", uk: "ПАРТНЕР", pl: "PARTNER" }, icon: "building", plugin: { id: "wsp-demand-forecast", capability: "wsp.demand.forecast" } },
  { id: "vive-production-intelligence", route: "/vive-production-intelligence", title: { en: "VIVE Production Intelligence", uk: "VIVE виробничі рішення", pl: "VIVE Production Intelligence" }, description: { en: "Production and logistics bottleneck, propagation and what-if decision demonstrator.", uk: "Демонстратор виробничих і логістичних вузьких місць, поширення ризику та what-if рішень.", pl: "Demonstrator wąskich gardeł produkcji i logistyki, propagacji ryzyka oraz decyzji what-if." }, tag: { en: "PARTNER", uk: "ПАРТНЕР", pl: "PARTNER" }, icon: "building" },
] as const;

export function findUseCaseByPlugin(pluginId: string, capabilityId?: string): DipUseCase | undefined {
  return DIP_USE_CASES.find((item) => item.plugin?.id === pluginId && (!capabilityId || item.plugin.capability === capabilityId));
}
