"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Building2, Factory, HeartHandshake, Sparkles } from "lucide-react";
import { startTransition } from "react";
import {
  buildLocalePath,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/observatory-i18n";

const copy = {
  en: { eyebrow: "Decision Intelligence Platform", title: "DIP Observatory", subtitle: "Focused decision demonstrators. HR and other reference scenarios live in their own lab; domain and partner pilots stay visible here.", defaultTitle: "Reference scenarios", defaultBody: "HR and other default DIP scenarios for exploring state, alternatives, risk, uncertainty and evidence.", open: "Open scenarios", partner: "Domain & partner demonstrators", language: "Language" },
  uk: { eyebrow: "Decision Intelligence Platform", title: "DIP Observatory", subtitle: "Окремі демонстратори для конкретних рішень. HR та інші базові сценарії знаходяться у власній лабораторії; доменні та партнерські пілоти залишаються тут.", defaultTitle: "Базові сценарії", defaultBody: "HR та інші стандартні DIP-сценарії для дослідження стану, альтернатив, ризику, невизначеності та доказів.", open: "Відкрити сценарії", partner: "Доменні та партнерські демонстратори", language: "Мова" },
  pl: { eyebrow: "Decision Intelligence Platform", title: "DIP Observatory", subtitle: "Oddzielne demonstratory dla konkretnych decyzji. HR i inne scenariusze bazowe są w osobnym laboratorium; pilotaże domenowe i partnerskie pozostają tutaj.", defaultTitle: "Scenariusze bazowe", defaultBody: "HR i inne standardowe scenariusze DIP do analizy stanu, alternatyw, ryzyka, niepewności i dowodów.", open: "Otwórz scenariusze", partner: "Demonstratory domenowe i partnerskie", language: "Język" },
} as const;

const localeLabel: Record<Locale, string> = { en: "EN", uk: "UA", pl: "PL" };

type Localized = Record<Locale, string>;
type Demo = { href: string; title: Localized; description: Localized; tag: Localized; icon: typeof Building2 };

const demos: Demo[] = [
  { href: "/resource-allocation", title: { en: "Resource Allocation", uk: "Розподіл ресурсів", pl: "Alokacja zasobów" }, description: { en: "Humanitarian mobile-team allocation under capacity, skills, accessibility and travel constraints.", uk: "Розподіл гуманітарних мобільних команд з урахуванням місткості, навичок, доступності та переміщення.", pl: "Alokacja mobilnych zespołów humanitarnych z uwzględnieniem pojemności, kompetencji, dostępności i przejazdów." }, tag: { en: "HUMANITARIAN", uk: "ГУМАНІТАРНИЙ", pl: "HUMANITARNY" }, icon: HeartHandshake },
  { href: "/gas-forecast", title: { en: "European Gas Forecasting", uk: "Прогнозування європейського газового ринку", pl: "Prognozowanie europejskiego rynku gazu" }, description: { en: "Market inputs, data providers and gas forecasting decision support in one workspace.", uk: "Ринкові дані, провайдери та підтримка рішень на основі прогнозу газового ринку в одному середовищі.", pl: "Dane rynkowe, dostawcy danych i wsparcie decyzji oparte na prognozie rynku gazu w jednym środowisku." }, tag: { en: "ENERGY", uk: "ЕНЕРГЕТИКА", pl: "ENERGIA" }, icon: Sparkles },
  { href: "/production-decision", title: { en: "Production Decision", uk: "Виробничі рішення", pl: "Decyzje produkcyjne" }, description: { en: "Operational production state translated into explicit alternatives and decisions.", uk: "Перетворення операційного стану виробництва на явні альтернативи та рішення.", pl: "Przekształcenie stanu operacyjnego produkcji w jawne alternatywy i decyzje." }, tag: { en: "PRODUCTION", uk: "ВИРОБНИЦТВО", pl: "PRODUKCJA" }, icon: Factory },
  { href: "/production-replanning", title: { en: "Production Replanning", uk: "Перепланування виробництва", pl: "Przeplanowanie produkcji" }, description: { en: "Real-time disruption response and production replanning.", uk: "Реакція на збої та перепланування виробництва в реальному часі.", pl: "Reakcja na zakłócenia i przeplanowanie produkcji w czasie rzeczywistym." }, tag: { en: "PRODUCTION", uk: "ВИРОБНИЦТВО", pl: "PRODUKCJA" }, icon: Factory },
  { href: "/production-scheduling", title: { en: "Production Scheduling", uk: "Планування виробництва", pl: "Planowanie produkcji" }, description: { en: "Capacity, deadlines and disruptions in an interactive scheduling decision lab.", uk: "Потужності, терміни та збої в інтерактивній лабораторії планування.", pl: "Moce, terminy i zakłócenia w interaktywnym laboratorium planowania." }, tag: { en: "PRODUCTION", uk: "ВИРОБНИЦТВО", pl: "PRODUKCJA" }, icon: Factory },
  { href: "/supplier-decision", title: { en: "Supplier Decision", uk: "Вибір постачальника", pl: "Wybór dostawcy" }, description: { en: "Multi-criteria supplier evaluation with explicit constraints and alternatives.", uk: "Багатокритеріальна оцінка постачальників з явними обмеженнями та альтернативами.", pl: "Wielokryterialna ocena dostawców z jawnymi ograniczeniami i alternatywami." }, tag: { en: "SUPPLY", uk: "ПОСТАЧАННЯ", pl: "DOSTAWY" }, icon: Building2 },
  { href: "/wsp-demand-forecast", title: { en: "WSP Demand Forecast", uk: "WSP прогноз попиту", pl: "WSP prognoza popytu" }, description: { en: "Company-specific demand forecasting demonstrator.", uk: "Демонстратор прогнозування попиту для конкретної компанії.", pl: "Demonstrator prognozowania popytu dla konkretnej firmy." }, tag: { en: "PARTNER", uk: "ПАРТНЕР", pl: "PARTNER" }, icon: Building2 },
  { href: "/vive-production-intelligence", title: { en: "VIVE Production Intelligence", uk: "VIVE виробничі рішення", pl: "VIVE Production Intelligence" }, description: { en: "Production and logistics bottleneck, propagation and what-if decision demonstrator.", uk: "Демонстратор виробничих і логістичних вузьких місць, поширення ризику та what-if рішень.", pl: "Demonstrator wąskich gardeł produkcji i logistyki, propagacji ryzyka oraz decyzji what-if." }, tag: { en: "PARTNER", uk: "ПАРТНЕР", pl: "PARTNER" }, icon: Building2 },
];

export function ObservatoryHome({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const pathname = usePathname();
  const router = useRouter();

  function changeLocale(next: Locale) {
    if (next === locale) return;
    if (typeof window !== "undefined") window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    startTransition(() => router.replace(buildLocalePath(pathname, next)));
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-white md:px-8 lg:py-16"><div className="mx-auto max-w-[1500px]">
    <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between"><div className="max-w-4xl"><div className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-300">{t.eyebrow}</div><h1 className="mt-4 text-5xl font-semibold tracking-[-.04em] md:text-7xl">{t.title}</h1><p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">{t.subtitle}</p></div><div aria-label={t.language} className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[.04] p-1">{SUPPORTED_LOCALES.map(option => <button key={option} type="button" onClick={() => changeLocale(option)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${option === locale ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{localeLabel[option]}</button>)}</div></header>
    <Link href={buildLocalePath("/scenarios", locale)} className="group mt-10 grid gap-5 rounded-[28px] border border-cyan-300/20 bg-cyan-300/[.06] p-6 transition hover:border-cyan-300/40 hover:bg-cyan-300/[.09] md:grid-cols-[1fr_auto] md:items-end md:p-8"><div><div className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">DIP CORE LAB</div><h2 className="mt-3 text-2xl font-semibold md:text-3xl">{t.defaultTitle}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{t.defaultBody}</p></div><div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">{t.open}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div></Link>
    <section className="mt-12"><div className="mb-5 flex items-center gap-3"><div className="h-px flex-1 bg-white/10"/><h2 className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">{t.partner}</h2><div className="h-px flex-1 bg-white/10"/></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{demos.map(({ href,title,description,tag,icon: Icon }) => <Link key={href} href={buildLocalePath(href, locale)} className="group min-h-52 rounded-[24px] border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[.055]"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-cyan-300"/><span className="text-[10px] font-semibold tracking-[.16em] text-slate-600">{tag[locale]}</span></div><h3 className="mt-8 text-xl font-semibold">{title[locale]}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description[locale]}</p><ArrowRight className="mt-5 h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300"/></Link>)}</div></section>
  </div></main>;
}
