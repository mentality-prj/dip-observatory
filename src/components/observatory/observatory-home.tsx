import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, Route } from "lucide-react";

import { DecisionWorkflow } from "@/components/product/decision-workflow";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import { observableUseCases } from "@/use-cases/registry";

const copy = {
  en: {
    eyebrow: "QDIP OBSERVATORY · UNDERSTAND",
    title: "Understand the recommendation, not just the output.",
    subtitle: "Observatory is the inspection surface for QDIP decisions. Open a working application, change the context and inspect the recommendation, alternatives, constraints and evidence.",
    demos: "Live decision applications",
    demosBody: "Different domains, the same decision grammar. Each application exposes how context becomes alternatives, evaluation and an explainable recommendation.",
    open: "Inspect decision",
    inspect: "The four questions Observatory should answer",
    questions: [["What is recommended?", "See the selected action and viable alternatives."], ["Why?", "Inspect evidence, priorities, constraints and trade-offs."], ["What changed?", "Compare the state and scenario that produced a different result."], ["What would change it?", "Explore which constraints or evidence can move the recommendation."]],
    note: "Demos are preconfigured decision applications. Studio configures the decision model; QDIP Core evaluates it; Observatory makes the result inspectable.",
  },
  uk: {
    eyebrow: "QDIP OBSERVATORY · РОЗУМІТИ",
    title: "Розумійте рекомендацію, а не лише результат.",
    subtitle: "Observatory — простір перевірки рішень QDIP. Відкрийте робочий застосунок, змініть контекст і дослідіть рекомендацію, альтернативи, обмеження та докази.",
    demos: "Робочі decision applications",
    demosBody: "Різні домени, однакова логіка рішення. Кожен застосунок показує, як контекст перетворюється на альтернативи, оцінювання та пояснювану рекомендацію.",
    open: "Дослідити рішення",
    inspect: "Чотири питання, на які має відповідати Observatory",
    questions: [["Що рекомендовано?", "Побачте обрану дію та допустимі альтернативи."], ["Чому?", "Перевірте докази, пріоритети, обмеження й компроміси."], ["Що змінилося?", "Порівняйте стан і сценарій, які привели до іншого результату."], ["Що змінить рішення?", "Дослідіть, які обмеження або докази можуть змінити рекомендацію."]],
    note: "Demos — попередньо налаштовані decision applications. Studio конфігурує модель рішення, QDIP Core її оцінює, а Observatory робить результат доступним для перевірки.",
  },
  pl: {
    eyebrow: "QDIP OBSERVATORY · ZROZUMIEĆ",
    title: "Zrozum rekomendację, nie tylko wynik.",
    subtitle: "Observatory to warstwa inspekcji decyzji QDIP. Otwórz działającą aplikację, zmień kontekst i sprawdź rekomendację, alternatywy, ograniczenia oraz dowody.",
    demos: "Działające aplikacje decyzyjne",
    demosBody: "Różne domeny, ta sama logika decyzji. Każda aplikacja pokazuje, jak kontekst przechodzi w alternatywy, ocenę i wyjaśnialną rekomendację.",
    open: "Przeanalizuj decyzję",
    inspect: "Cztery pytania, na które powinno odpowiadać Observatory",
    questions: [["Co jest rekomendowane?", "Zobacz wybrane działanie i wykonalne alternatywy."], ["Dlaczego?", "Sprawdź dowody, priorytety, ograniczenia i kompromisy."], ["Co się zmieniło?", "Porównaj stan i scenariusz, które doprowadziły do innego wyniku."], ["Co zmieni decyzję?", "Sprawdź, które ograniczenia lub dowody mogą zmienić rekomendację."]],
    note: "Dema są wstępnie skonfigurowanymi aplikacjami decyzyjnymi. Studio konfiguruje model, QDIP Core go ocenia, a Observatory udostępnia wynik do inspekcji.",
  },
} as const;

const demoIcons = { "gas-forecast": BarChart3, "resource-allocation": Route } as const;

export function ObservatoryHome({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const useCases = observableUseCases();

  return (
    <main className="observatory-home relative min-h-[calc(100vh-6.5rem)] overflow-hidden px-4 pb-20 pt-8 text-white md:px-6 md:pt-12 xl:px-10">
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <header className="max-w-5xl">
          <div className="observatory-eyebrow">{t.eyebrow}</div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-.05em] md:text-6xl lg:text-7xl">{t.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">{t.subtitle}</p>
        </header>

        <DecisionWorkflow locale={locale} tone="dark" />

        <section className="mt-14" aria-labelledby="observatory-demos">
          <div className="mb-7 max-w-3xl">
            <h2 id="observatory-demos" className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">{t.demos}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">{t.demosBody}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {useCases.map((useCase) => {
              const Icon = demoIcons[useCase.id as keyof typeof demoIcons] ?? BrainCircuit;
              return (
                <Link key={useCase.id} href={buildLocalePath(useCase.route, locale)} data-use-case={useCase.id} data-theme={useCase.presentation.theme} className="observatory-demo-card group flex min-h-64 flex-col p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="observatory-icon-frame"><Icon className="h-5 w-5 text-cyan-200" /></span>
                    <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[.14em] text-slate-500"><b className="text-cyan-300">{useCase.decisionPattern.toUpperCase()}</b><span>·</span>{useCase.tag[locale]}</span>
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold tracking-[-.025em] md:text-3xl">{useCase.title[locale]}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{useCase.description[locale]}</p>
                  <div className="mt-auto flex items-center gap-2 pt-7 text-sm font-semibold text-cyan-200">{t.open}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-16 border-t border-white/10 pt-10" aria-labelledby="observatory-inspect">
          <h2 id="observatory-inspect" className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">{t.inspect}</h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
            {t.questions.map(([title, body], index) => <div key={title} className="bg-slate-950/80 p-6"><div className="text-xs font-semibold text-cyan-300">0{index + 1}</div><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{body}</p></div>)}
          </div>
          <p className="mt-6 max-w-4xl text-sm leading-6 text-slate-500">{t.note}</p>
        </section>
      </div>
    </main>
  );
}
