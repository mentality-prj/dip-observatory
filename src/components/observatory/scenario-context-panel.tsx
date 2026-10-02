import type { Locale } from '@/lib/observatory-i18n'

export type ScenarioContextView = {
  situation: string
  decisionQuestion: string
  dataSummary: string[]
  constraints: string[]
  uncertainty: string[]
  testPurpose: string
}

const copy = {
  en: {
    title: 'Scenario context',
    situation: 'Business situation',
    decision: 'Decision to make',
    data: 'Data used',
    constraints: 'Constraints',
    uncertainty: 'Uncertainty',
    purpose: 'What this scenario tests',
  },
  uk: {
    title: 'Контекст сценарію',
    situation: 'Бізнес-ситуація',
    decision: 'Рішення, яке треба прийняти',
    data: 'Дані сценарію',
    constraints: 'Обмеження',
    uncertainty: 'Невизначеність',
    purpose: 'Що перевіряє цей сценарій',
  },
  pl: {
    title: 'Kontekst scenariusza',
    situation: 'Sytuacja biznesowa',
    decision: 'Decyzja do podjęcia',
    data: 'Dane scenariusza',
    constraints: 'Ograniczenia',
    uncertainty: 'Niepewność',
    purpose: 'Co sprawdza ten scenariusz',
  },
} as const

function List({ values }: { values: string[] }) {
  return (
    <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
      {values.map((value) => (
        <li key={value}>• {value}</li>
      ))}
    </ul>
  )
}

export function ScenarioContextPanel({ locale, context }: { locale: Locale; context: ScenarioContextView }) {
  const t = copy[locale]
  return (
    <section data-testid="scenario-context" className="mt-5 border border-white/10 bg-white/[.025] p-5 md:p-6">
      <h2 className="text-lg font-medium text-slate-100">{t.title}</h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{t.situation}</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{context.situation}</p>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{t.decision}</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{context.decisionQuestion}</p>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{t.purpose}</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{context.testPurpose}</p>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{t.data}</div>
          <List values={context.dataSummary} />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{t.constraints}</div>
          <List values={context.constraints} />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{t.uncertainty}</div>
          <List values={context.uncertainty} />
        </div>
      </div>
    </section>
  )
}
