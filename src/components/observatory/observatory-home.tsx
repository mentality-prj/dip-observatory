import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, Route } from "lucide-react";

import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import { observableUseCases } from "@/use-cases/registry";

const copy = {
  en: {
    eyebrow: "QDIP · Decision Intelligence in practice",
    title: "Observe how decisions are made.",
    subtitle: "QDIP Observatory is the public execution layer for real decision applications. Each demo exposes inputs, constraints, uncertainty, alternatives and the evidence behind the resulting decision.",
    demos: "Live decision applications",
    demosBody: "These are working domain applications, not generic UI scenarios. Each one exercises a different decision problem through the same QDIP architecture.",
    open: "Open application",
    pipeline: "What to observe",
    steps: [
      ["Context", "Domain data is converted into an explicit decision state."],
      ["Alternatives", "QDIP evaluates feasible actions under domain constraints."],
      ["Decision evidence", "Risk, uncertainty and supporting evidence remain inspectable."],
    ],
    note: "The Observatory shows application behaviour. QDIP Studio is where decision profiles, bindings and execution configuration are managed.",
  },
  uk: {
    eyebrow: "QDIP · Decision Intelligence на практиці",
    title: "Спостерігайте, як приймаються рішення.",
    subtitle: "QDIP Observatory — публічний execution layer для реальних decision applications. Кожне демо показує вхідні дані, обмеження, невизначеність, альтернативи та докази, на яких базується рішення.",
    demos: "Робочі decision applications",
    demosBody: "Це не абстрактні UI-сценарії, а робочі доменні застосунки. Кожен демонструє інший клас задачі через спільну архітектуру QDIP.",
    open: "Відкрити застосунок",
    pipeline: "Що спостерігати",
    steps: [
      ["Контекст", "Доменні дані перетворюються на явний стан задачі прийняття рішення."],
      ["Альтернативи", "QDIP оцінює допустимі дії з урахуванням доменних обмежень."],
      ["Докази рішення", "Ризик, невизначеність і supporting evidence залишаються доступними для перевірки."],
    ],
    note: "Observatory показує поведінку застосунків. QDIP Studio використовується для керування decision profiles, bindings та конфігурацією виконання.",
  },
  pl: {
    eyebrow: "QDIP · Decision Intelligence w praktyce",
    title: "Obserwuj, jak powstają decyzje.",
    subtitle: "QDIP Observatory to publiczna warstwa wykonawcza rzeczywistych aplikacji decyzyjnych. Każde demo pokazuje dane wejściowe, ograniczenia, niepewność, alternatywy i dowody stojące za decyzją.",
    demos: "Działające aplikacje decyzyjne",
    demosBody: "To działające aplikacje domenowe, a nie ogólne scenariusze UI. Każda realizuje inny problem decyzyjny przez wspólną architekturę QDIP.",
    open: "Otwórz aplikację",
    pipeline: "Co obserwować",
    steps: [
      ["Kontekst", "Dane domenowe są przekształcane w jawny stan problemu decyzyjnego."],
      ["Alternatywy", "QDIP ocenia wykonalne działania z uwzględnieniem ograniczeń domenowych."],
      ["Dowody decyzji", "Ryzyko, niepewność i dowody pozostają dostępne do inspekcji."],
    ],
    note: "Observatory pokazuje zachowanie aplikacji. QDIP Studio służy do zarządzania profilami decyzji, powiązaniami i konfiguracją wykonania.",
  },
} as const;

const demoIcons = { "gas-forecast": BarChart3, "resource-allocation": Route } as const;

export function ObservatoryHome({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const useCases = observableUseCases();

  return (
    <main className="observatory-home relative min-h-[calc(100vh-6.5rem)] overflow-hidden px-4 pb-20 pt-8 text-white md:px-6 md:pt-14 xl:px-10">
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <header className="max-w-5xl">
          <div className="observatory-eyebrow">{t.eyebrow}</div>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-.055em] md:text-7xl lg:text-[5.5rem]">{t.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">{t.subtitle}</p>
        </header>

        <section className="mt-14" aria-labelledby="observatory-demos">
          <div className="mb-7 max-w-3xl">
            <h2 id="observatory-demos" className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">{t.demos}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">{t.demosBody}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {useCases.map((useCase) => {
              const Icon = demoIcons[useCase.id as keyof typeof demoIcons] ?? BrainCircuit;
              return (
                <Link key={useCase.id} href={buildLocalePath(useCase.route, locale)} data-use-case={useCase.id} data-theme={useCase.presentation.theme} className="observatory-demo-card group flex min-h-72 flex-col p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="observatory-icon-frame"><Icon className="h-5 w-5 text-cyan-200" /></span>
                    <span className="text-[10px] font-semibold tracking-[.16em] text-slate-500">{useCase.tag[locale]}</span>
                  </div>
                  <h3 className="mt-10 text-2xl font-semibold tracking-[-.025em] md:text-3xl">{useCase.title[locale]}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{useCase.description[locale]}</p>
                  <div className="mt-auto flex items-center gap-2 pt-8 text-sm font-semibold text-cyan-200">{t.open}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-16 border-t border-white/10 pt-10" aria-labelledby="observatory-pipeline">
          <h2 id="observatory-pipeline" className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">{t.pipeline}</h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
            {t.steps.map(([title, body], index) => <div key={title} className="bg-slate-950/80 p-6"><div className="text-xs font-semibold text-cyan-300">0{index + 1}</div><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{body}</p></div>)}
          </div>
          <p className="mt-6 max-w-4xl text-sm leading-6 text-slate-500">{t.note}</p>
        </section>
      </div>
    </main>
  );
}
