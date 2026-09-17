import Link from "next/link";
import { ArrowRight, Building2, Factory, HeartHandshake, Sparkles, Users } from "lucide-react";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import { DIP_USE_CASES, type UseCaseIcon } from "@/use-cases/registry";

const copy = {
  en: { eyebrow: "Quality-driven Decision Intelligence Platform", title: "QDIP Observatory", subtitle: "Focused decision demonstrators. HR and other reference scenarios live in their own lab; domain and partner pilots stay visible here.", defaultTitle: "Reference scenarios", defaultBody: "HR and other QDIP scenarios for exploring state, alternatives, risk, uncertainty and evidence.", open: "Open scenarios", partner: "Domain & partner demonstrators" },
  uk: { eyebrow: "Quality-driven Decision Intelligence Platform", title: "QDIP Observatory", subtitle: "Окремі демонстратори для конкретних рішень. HR та інші базові сценарії знаходяться у власній лабораторії; доменні та партнерські пілоти залишаються тут.", defaultTitle: "Базові сценарії", defaultBody: "HR та інші QDIP-сценарії для дослідження стану, альтернатив, ризику, невизначеності та доказів.", open: "Відкрити сценарії", partner: "Доменні та партнерські демонстратори" },
  pl: { eyebrow: "Quality-driven Decision Intelligence Platform", title: "QDIP Observatory", subtitle: "Oddzielne demonstratory dla konkretnych decyzji. HR i inne scenariusze bazowe są w osobnym laboratorium; pilotaże domenowe i partnerskie pozostają tutaj.", defaultTitle: "Scenariusze bazowe", defaultBody: "HR i inne scenariusze QDIP do analizy stanu, alternatyw, ryzyka, niepewności i dowodów.", open: "Otwórz scenariusze", partner: "Demonstratory domenowe i partnerskie" },
} as const;

const icons: Record<UseCaseIcon, typeof Building2> = {
  building: Building2,
  factory: Factory,
  heart: HeartHandshake,
  sparkles: Sparkles,
  users: Users,
};

export function ObservatoryHome({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return <main className="observatory-home relative min-h-[calc(100vh-6.5rem)] overflow-hidden px-4 pb-20 pt-8 text-white md:px-6 md:pt-14 xl:px-10"><div className="relative z-10 mx-auto max-w-[1500px]">
    <header className="max-w-5xl"><div className="observatory-eyebrow">{t.eyebrow}</div><h1 className="mt-5 text-5xl font-semibold tracking-[-.055em] md:text-7xl lg:text-[5.5rem]">{t.title}</h1><p className="mt-6 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">{t.subtitle}</p></header>
    <Link href={buildLocalePath("/scenarios", locale)} className="observatory-core-card group mt-12 grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8"><div><div className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">QDIP CORE LAB</div><h2 className="mt-3 text-2xl font-semibold tracking-[-.025em] md:text-3xl">{t.defaultTitle}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{t.defaultBody}</p></div><div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">{t.open}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div></Link>
    <section className="mt-14"><div className="mb-6 flex items-center gap-4"><h2 className="shrink-0 text-xs font-semibold uppercase tracking-[.2em] text-slate-500">{t.partner}</h2><div className="h-px flex-1 bg-white/10"/></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{DIP_USE_CASES.map((useCase) => { const Icon = icons[useCase.icon]; return <Link key={useCase.id} href={buildLocalePath(useCase.route, locale)} className="observatory-demo-card group min-h-56 p-5"><div className="flex items-center justify-between"><span className="observatory-icon-frame"><Icon className="h-4 w-4 text-cyan-200"/></span><span className="text-[10px] font-semibold tracking-[.16em] text-slate-600">{useCase.tag[locale]}</span></div><h3 className="mt-8 text-xl font-semibold tracking-[-.02em]">{useCase.title[locale]}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{useCase.description[locale]}</p><ArrowRight className="mt-5 h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300"/></Link>; })}</div></section>
  </div></main>;
}
