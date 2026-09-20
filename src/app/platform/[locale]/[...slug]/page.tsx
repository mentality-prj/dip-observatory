import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/marketing/public-page";
import { marketingLocales, type MarketingLocale } from "@/components/marketing/qdip-copy";

const pageKeys = ["how-it-works","use-cases","decision","core","core/architecture","core/decision-model","core/explainability","core/research"] as const;
type PageKey = (typeof pageKeys)[number];
type SeoCopy = Record<PageKey,{title:string;description:string}>;

const seo:Record<MarketingLocale,SeoCopy>={
  en:{
    "how-it-works":{title:"How QDIP Works",description:"See how QDIP evaluates alternatives, constraints, risk and uncertainty and provides a recommendation with supporting evidence for a human decision."},
    "use-cases":{title:"QDIP Use Cases",description:"Explore recurring decision patterns for resource allocation, action selection and opportunity prioritization using the QDIP Decision Engine."},
    decision:{title:"Describe Your Decision",description:"Describe a recurring decision your organization makes and determine whether it is a good fit for QDIP."},
    core:{title:"QDIP Core",description:"Technical overview of QDIP Core, the runtime behind explainable decision systems."},
    "core/architecture":{title:"QDIP Core Architecture",description:"Architecture, boundaries and execution flow of QDIP Core."},
    "core/decision-model":{title:"QDIP Decision Model",description:"The reusable QDIP decision model: state, alternatives, objectives, effects, costs, risk, uncertainty, constraints and evidence."},
    "core/explainability":{title:"QDIP Explainability",description:"How QDIP keeps recommendations, supporting evidence and decision execution inspectable."},
    "core/research":{title:"QDIP Research",description:"QDIP applied research direction and implemented decision experiments."},
  },
  uk:{
    "how-it-works":{title:"Як працює QDIP",description:"Як QDIP оцінює альтернативи, обмеження, ризик і невизначеність та надає рекомендацію з обґрунтуванням для остаточного рішення людини."},
    "use-cases":{title:"Сценарії використання QDIP",description:"Приклади регулярних рішень щодо розподілу ресурсів, вибору дії та пріоритезації можливостей за допомогою рушія прийняття рішень QDIP."},
    decision:{title:"Опишіть ваше рішення",description:"Опишіть регулярне рішення вашої організації, щоб визначити, чи підходить для нього QDIP."},
    core:{title:"QDIP Core",description:"Технічний огляд QDIP Core — середовища виконання для пояснюваних систем підтримки рішень."},
    "core/architecture":{title:"Архітектура QDIP Core",description:"Архітектура, межі компонентів і потік виконання QDIP Core."},
    "core/decision-model":{title:"Модель рішення QDIP",description:"Універсальна модель рішення QDIP: стан, альтернативи, цілі, очікувані ефекти, витрати, ризик, невизначеність, обмеження та обґрунтувальна інформація."},
    "core/explainability":{title:"Пояснюваність QDIP",description:"Як QDIP дає змогу перевіряти рекомендації, їх обґрунтування та виконання моделі рішення."},
    "core/research":{title:"Дослідження QDIP",description:"Напрями прикладних досліджень QDIP та реалізовані експерименти з прийняття рішень."},
  },
  pl:{
    "how-it-works":{title:"Jak działa QDIP",description:"Zobacz, jak QDIP ocenia alternatywy, ograniczenia, ryzyko i niepewność oraz przedstawia rekomendację z uzasadnieniem do ostatecznej decyzji człowieka."},
    "use-cases":{title:"Przypadki użycia QDIP",description:"Poznaj powtarzające się wzorce decyzji dotyczących alokacji zasobów, wyboru działania i priorytetyzacji szans z wykorzystaniem silnika decyzyjnego QDIP."},
    decision:{title:"Opisz swoją decyzję",description:"Opisz regularnie podejmowaną decyzję w swojej organizacji i sprawdź, czy QDIP jest do niej odpowiednim rozwiązaniem."},
    core:{title:"QDIP Core",description:"Techniczny przegląd QDIP Core — środowiska wykonawczego dla wyjaśnialnych systemów wspomagania decyzji."},
    "core/architecture":{title:"Architektura QDIP Core",description:"Architektura, granice komponentów i przepływ wykonania QDIP Core."},
    "core/decision-model":{title:"Model decyzyjny QDIP",description:"Uniwersalny model decyzyjny QDIP: stan, alternatywy, cele, oczekiwane efekty, koszty, ryzyko, niepewność, ograniczenia i informacje wspierające ocenę."},
    "core/explainability":{title:"Wyjaśnialność QDIP",description:"Jak QDIP umożliwia weryfikację rekomendacji, ich uzasadnienia oraz przebiegu oceny decyzji."},
    "core/research":{title:"Badania QDIP",description:"Kierunki badań stosowanych QDIP i zrealizowane eksperymenty dotyczące podejmowania decyzji."},
  },
};

function isLocale(value:string):value is MarketingLocale{return marketingLocales.includes(value as MarketingLocale)}
function isPageKey(value:string):value is PageKey{return pageKeys.includes(value as PageKey)}

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string[]}>}):Promise<Metadata>{
  const {locale,slug}=await params;
  if(!isLocale(locale))return{};
  const key=slug.join("/");
  if(!isPageKey(key))return{};
  const {title,description}=seo[locale][key];
  const canonical=`https://qdip.ai/${locale}/${key}`;
  return{
    title:{absolute:`${title} — QDIP`},description,
    alternates:{canonical,languages:{en:`https://qdip.ai/en/${key}`,uk:`https://qdip.ai/uk/${key}`,pl:`https://qdip.ai/pl/${key}`}},
    openGraph:{title:`${title} — QDIP`,description,url:canonical,type:"website",locale:locale==="en"?"en_US":locale==="uk"?"uk_UA":"pl_PL"},
  };
}

export default async function Page({params}:{params:Promise<{locale:string;slug:string[]}>}){
  const {locale,slug}=await params;
  if(!isLocale(locale))notFound();
  const key=slug.join("/");
  if(!isPageKey(key))notFound();
  return <PublicPage locale={locale} slug={key}/>;
}
