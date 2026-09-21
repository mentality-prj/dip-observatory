import Link from 'next/link'
import { ArrowRight, BarChart3, BrainCircuit, Check, ChevronDown, Route } from 'lucide-react'

import { DecisionWorkflow } from '@/components/product/decision-workflow'
import { buildLocalePath, type Locale } from '@/lib/observatory-i18n'
import { observableUseCases } from '@/use-cases/registry'

const copy = {
  en: {
    eyebrow: 'QDIP OBSERVATORY · UNDERSTAND',
    title: 'Understand the recommendation, not just the output.',
    subtitle: 'Observatory is the inspection surface for QDIP decisions. Every application follows the same narrative: recommendation first, then alternatives, evidence and trace.',
    inspectLabel: 'Decision inspection model', recommendation: 'Recommendation', recommended: 'Option B', confidence: 'Supported by current evidence',
    evidence: 'Evidence', evidenceItems: ['Constraints satisfied', 'Priority fit is strongest', 'Trade-offs remain visible'],
    alternatives: 'Alternatives', alternativeItems: [['Option A', 'Higher cost'], ['Option C', 'Constraint conflict']], trace: 'Open decision trace', traceBody: 'Context → alternatives → evaluation → recommendation. The trace remains secondary until deeper inspection is needed.',
    demos: 'Live decision applications', demosBody: 'Different domains, the same inspection grammar. Open an application to examine a real recommendation and the evidence behind it.', open: 'Inspect decision',
    inspect: 'The four questions Observatory should answer', questions: [['What is recommended?', 'See the selected action and viable alternatives.'], ['Why?', 'Inspect evidence, priorities, constraints and trade-offs.'], ['What changed?', 'Compare the state and scenario that produced a different result.'], ['What would change it?', 'Explore which constraints or evidence can move the recommendation.']],
    note: 'Demos are preconfigured decision applications. Studio configures the decision model; QDIP Core evaluates it; Observatory makes the result inspectable.',
  },
  uk: {
    eyebrow: 'QDIP OBSERVATORY · РОЗУМІТИ', title: 'Розумійте рекомендацію, а не лише результат.',
    subtitle: 'Observatory — простір перевірки рішень QDIP. Кожен застосунок має однакову логіку: спочатку рекомендація, потім альтернативи, докази та trace.',
    inspectLabel: 'Модель перевірки рішення', recommendation: 'Рекомендація', recommended: 'Варіант B', confidence: 'Підтверджено поточними доказами',
    evidence: 'Докази', evidenceItems: ['Обмеження виконані', 'Найкраща відповідність пріоритетам', 'Компроміси залишаються видимими'],
    alternatives: 'Альтернативи', alternativeItems: [['Варіант A', 'Вищі витрати'], ['Варіант C', 'Конфлікт з обмеженням']], trace: 'Відкрити trace рішення', traceBody: 'Контекст → альтернативи → оцінювання → рекомендація. Trace залишається другим рівнем, доки не потрібна глибша перевірка.',
    demos: 'Робочі decision applications', demosBody: 'Різні домени, однакова логіка перевірки. Відкрийте застосунок, щоб дослідити реальну рекомендацію та докази.', open: 'Дослідити рішення',
    inspect: 'Чотири питання, на які має відповідати Observatory', questions: [['Що рекомендовано?', 'Побачте обрану дію та допустимі альтернативи.'], ['Чому?', 'Перевірте докази, пріоритети, обмеження й компроміси.'], ['Що змінилося?', 'Порівняйте стан і сценарій, які привели до іншого результату.'], ['Що змінить рішення?', 'Дослідіть, які обмеження або докази можуть змінити рекомендацію.']],
    note: 'Demos — попередньо налаштовані decision applications. Studio конфігурує модель рішення, QDIP Core її оцінює, а Observatory робить результат доступним для перевірки.',
  },
  pl: {
    eyebrow: 'QDIP OBSERVATORY · ZROZUMIEĆ', title: 'Zrozum rekomendację, nie tylko wynik.',
    subtitle: 'Observatory to warstwa inspekcji decyzji QDIP. Każda aplikacja ma tę samą narrację: najpierw rekomendacja, potem alternatywy, dowody i trace.',
    inspectLabel: 'Model inspekcji decyzji', recommendation: 'Rekomendacja', recommended: 'Opcja B', confidence: 'Potwierdzone aktualnymi dowodami',
    evidence: 'Dowody', evidenceItems: ['Ograniczenia spełnione', 'Najlepsze dopasowanie priorytetów', 'Kompromisy pozostają widoczne'],
    alternatives: 'Alternatywy', alternativeItems: [['Opcja A', 'Wyższy koszt'], ['Opcja C', 'Konflikt z ograniczeniem']], trace: 'Otwórz trace decyzji', traceBody: 'Kontekst → alternatywy → ocena → rekomendacja. Trace pozostaje drugim poziomem, dopóki nie jest potrzebna głębsza inspekcja.',
    demos: 'Działające aplikacje decyzyjne', demosBody: 'Różne domeny, ta sama logika inspekcji. Otwórz aplikację, aby zbadać rzeczywistą rekomendację i stojące za nią dowody.', open: 'Przeanalizuj decyzję',
    inspect: 'Cztery pytania, na które powinno odpowiadać Observatory', questions: [['Co jest rekomendowane?', 'Zobacz wybrane działanie i wykonalne alternatywy.'], ['Dlaczego?', 'Sprawdź dowody, priorytety, ograniczenia i kompromisy.'], ['Co się zmieniło?', 'Porównaj stan i scenariusz, które doprowadziły do innego wyniku.'], ['Co zmieni decyzję?', 'Sprawdź, które ograniczenia lub dowody mogą zmienić rekomendację.']],
    note: 'Dema są wstępnie skonfigurowanymi aplikacjami decyzyjnymi. Studio konfiguruje model, QDIP Core go ocenia, a Observatory udostępnia wynik do inspekcji.',
  },
} as const

const demoIcons = { 'gas-forecast': BarChart3, 'resource-allocation': Route } as const

export function ObservatoryHome({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const useCases = observableUseCases()
  return (
    <main className="observatory-home relative min-h-[calc(100vh-6.5rem)] overflow-hidden px-4 pb-20 pt-8 text-white md:px-6 md:pt-12 xl:px-10">
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <header className="max-w-5xl">
          <div className="observatory-eyebrow">{t.eyebrow}</div>
          <h1 className="mt-5 max-w-4xl text-4xl font-medium tracking-[-.045em] md:text-6xl lg:text-7xl">{t.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">{t.subtitle}</p>
        </header>

        <DecisionWorkflow locale={locale} tone="dark" />

        <section className="mt-10" aria-labelledby="observatory-inspection-model">
          <h2 id="observatory-inspection-model" className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">{t.inspectLabel}</h2>
          <div className="mt-5 grid overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 lg:grid-cols-[1.4fr_.8fr]">
            <div className="border-b border-white/10 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-300">{t.recommendation}</span>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                <div><strong className="text-3xl font-medium tracking-[-.035em] md:text-4xl">{t.recommended}</strong><p className="mt-2 text-sm text-slate-400">{t.confidence}</p></div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-300">Recommended</span>
              </div>
              <div className="mt-8 border-t border-white/10 pt-5">
                <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">{t.alternatives}</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">{t.alternativeItems.map(([name, reason]) => <div key={name} className="rounded-xl border border-white/8 bg-white/[.025] p-4"><strong className="text-sm font-medium text-slate-200">{name}</strong><span className="mt-1 block text-xs text-slate-500">{reason}</span></div>)}</div>
              </div>
              <details className="mt-5 border-t border-white/10 pt-4 group">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-cyan-200">{t.trace}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
                <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-500">{t.traceBody}</p>
              </details>
            </div>
            <aside className="bg-white/[.018] p-6 md:p-8" aria-label={t.evidence}>
              <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">{t.evidence}</span>
              <div className="mt-5 grid gap-4">{t.evidenceItems.map((item, index) => <div key={item} className="flex gap-3 border-b border-white/8 pb-4 last:border-0"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-cyan-300"><Check className="h-3 w-3" /></span><div><strong className="block text-sm font-medium text-slate-200">0{index + 1}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{item}</span></div></div>)}</div>
            </aside>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="observatory-demos">
          <div className="mb-7 max-w-3xl"><h2 id="observatory-demos" className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">{t.demos}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{t.demosBody}</p></div>
          <div className="grid gap-5 lg:grid-cols-2">{useCases.map((useCase) => { const Icon = demoIcons[useCase.id as keyof typeof demoIcons] ?? BrainCircuit; return <Link key={useCase.id} href={buildLocalePath(useCase.route, locale)} data-use-case={useCase.id} data-theme={useCase.presentation.theme} className="observatory-demo-card group flex min-h-64 flex-col p-6 md:p-8"><div className="flex items-center justify-between gap-4"><span className="observatory-icon-frame"><Icon className="h-5 w-5 text-cyan-200" /></span><span className="flex items-center gap-2 text-[10px] font-semibold tracking-[.14em] text-slate-500"><b className="text-cyan-300">{useCase.decisionPattern.toUpperCase()}</b><span>·</span>{useCase.tag[locale]}</span></div><h3 className="mt-8 text-2xl font-medium tracking-[-.025em] md:text-3xl">{useCase.title[locale]}</h3><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{useCase.description[locale]}</p><div className="mt-auto flex items-center gap-2 pt-7 text-sm font-semibold text-cyan-200">{t.open}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div></Link> })}</div>
        </section>

        <section className="mt-16 border-t border-white/10 pt-10" aria-labelledby="observatory-inspect">
          <h2 id="observatory-inspect" className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">{t.inspect}</h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">{t.questions.map(([title, body], index) => <div key={title} className="bg-slate-950/80 p-6"><div className="text-xs font-semibold text-cyan-300">0{index + 1}</div><h3 className="mt-4 text-lg font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{body}</p></div>)}</div>
          <p className="mt-6 max-w-4xl text-sm leading-6 text-slate-500">{t.note}</p>
        </section>
      </div>
    </main>
  )
}
