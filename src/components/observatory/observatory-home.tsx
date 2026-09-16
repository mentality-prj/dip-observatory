import Link from "next/link";
import { ArrowRight, Building2, Factory, HeartHandshake, Sparkles } from "lucide-react";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";

const copy = {
  en: { eyebrow: "Decision Intelligence Platform", title: "DIP Observatory", subtitle: "Focused decision demonstrators. HR and other reference scenarios now live in their own lab; domain and partner pilots stay visible here.", defaultTitle: "Reference scenarios", defaultBody: "HR and other default DIP scenarios for exploring state, alternatives, risk, uncertainty and evidence.", open: "Open scenarios", partner: "Domain & partner demonstrators" },
  uk: { eyebrow: "Decision Intelligence Platform", title: "DIP Observatory", subtitle: "Окремі демонстратори для конкретних рішень. HR та інші базові сценарії тепер у власній лабораторії; доменні та партнерські пілоти залишаються тут.", defaultTitle: "Базові сценарії", defaultBody: "HR та інші стандартні DIP-сценарії для дослідження стану, альтернатив, ризику, невизначеності та evidence.", open: "Відкрити сценарії", partner: "Доменні та партнерські демонстратори" },
  pl: { eyebrow: "Decision Intelligence Platform", title: "DIP Observatory", subtitle: "Oddzielne demonstratory dla konkretnych decyzji. HR i inne scenariusze bazowe są teraz w osobnym laboratorium; pilotaże domenowe i partnerskie pozostają tutaj.", defaultTitle: "Scenariusze bazowe", defaultBody: "HR i inne standardowe scenariusze DIP do analizy stanu, alternatyw, ryzyka, niepewności i evidence.", open: "Otwórz scenariusze", partner: "Demonstratory domenowe i partnerskie" },
} as const;

const demos = [
  ["/resource-allocation", "Resource Allocation", "Humanitarian mobile-team allocation under capacity, skills, accessibility and travel constraints.", "HUMANITARIAN", HeartHandshake],
  ["/gas-forecast", "European Gas Forecasting", "Market inputs, data providers and gas forecasting decision support in one workspace.", "ENERGY", Sparkles],
  ["/production-decision", "Production Decision", "Operational production state translated into explicit alternatives and decisions.", "PRODUCTION", Factory],
  ["/production-replanning", "Production Replanning", "Real-time disruption response and production replanning.", "PRODUCTION", Factory],
  ["/production-scheduling", "Production Scheduling", "Capacity, deadlines and disruptions in an interactive scheduling decision lab.", "PRODUCTION", Factory],
  ["/supplier-decision", "Supplier Decision", "Multi-criteria supplier evaluation with explicit constraints and alternatives.", "SUPPLY", Building2],
  ["/wsp-demand-forecast", "WSP Demand Forecast", "Company-specific demand forecasting demonstrator.", "PARTNER", Building2],
  ["/vive-production-intelligence", "VIVE Production Intelligence", "Production and logistics bottleneck, propagation and what-if decision demonstrator.", "PARTNER", Building2],
] as const;

export function ObservatoryHome({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-white md:px-8 lg:py-16"><div className="mx-auto max-w-[1500px]">
    <header className="max-w-4xl"><div className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-300">{t.eyebrow}</div><h1 className="mt-4 text-5xl font-semibold tracking-[-.04em] md:text-7xl">{t.title}</h1><p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">{t.subtitle}</p></header>
    <Link href={buildLocalePath("/scenarios", locale)} className="group mt-10 grid gap-5 rounded-[28px] border border-cyan-300/20 bg-cyan-300/[.06] p-6 transition hover:border-cyan-300/40 hover:bg-cyan-300/[.09] md:grid-cols-[1fr_auto] md:items-end md:p-8"><div><div className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">DIP CORE LAB</div><h2 className="mt-3 text-2xl font-semibold md:text-3xl">{t.defaultTitle}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{t.defaultBody}</p></div><div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">{t.open}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div></Link>
    <section className="mt-12"><div className="mb-5 flex items-center gap-3"><div className="h-px flex-1 bg-white/10"/><h2 className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">{t.partner}</h2><div className="h-px flex-1 bg-white/10"/></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{demos.map(([href,title,description,tag,Icon]) => <Link key={href} href={buildLocalePath(href, locale)} className="group min-h-52 rounded-[24px] border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[.055]"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-cyan-300"/><span className="text-[10px] font-semibold tracking-[.16em] text-slate-600">{tag}</span></div><h3 className="mt-8 text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><ArrowRight className="mt-5 h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300"/></Link>)}</div></section>
  </div></main>;
}
