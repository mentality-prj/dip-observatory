'use client'

import { useState, type FormEvent } from 'react'
import { FileUp } from 'lucide-react'

import type { Locale } from '@/lib/observatory-i18n'
import { intakeAnalysisSchema, type IntakeAnalysis } from './model/contracts'

const copy = {
  en: {
    eyebrow: 'QDIP OBSERVATORY · DECISION INTAKE',
    title: 'Turn operational data into a decision QDIP can evaluate.',
    body: 'Upload CSV, XLSX or JSON. QDIP profiles the dataset and proposes business semantics as hypotheses. You verify them before they can become decision inputs.',
    context: 'Business context',
    contextHint: 'Describe the recurring decision, objective and operational constraints.',
    file: 'Dataset',
    submit: 'Analyze dataset',
    busy: 'Analyzing…',
    result: 'Interpretation',
    rows: 'Rows',
    columns: 'Columns',
    questions: 'Questions to verify',
    gate: 'Evidence gate',
    assumptions: 'Assumptions',
    privacy: 'Do not upload unnecessary personal data.',
  },
  uk: {
    eyebrow: 'QDIP OBSERVATORY · ПІДГОТОВКА РІШЕННЯ',
    title: 'Перетворіть операційні дані на рішення, яке може оцінити QDIP.',
    body: 'Завантажте CSV, XLSX або JSON. QDIP профілює набір даних і пропонує бізнес-семантику лише як гіпотези. Ви перевіряєте її до використання в рішенні.',
    context: 'Бізнес-контекст',
    contextHint: 'Опишіть повторюване рішення, мету та операційні обмеження.',
    file: 'Набір даних',
    submit: 'Проаналізувати дані',
    busy: 'Аналізую…',
    result: 'Інтерпретація',
    rows: 'Рядків',
    columns: 'Колонок',
    questions: 'Питання для перевірки',
    gate: 'Перевірка доказів',
    assumptions: 'Припущення',
    privacy: 'Не завантажуйте зайві персональні дані.',
  },
  pl: {
    eyebrow: 'QDIP OBSERVATORY · PRZYGOTOWANIE DECYZJI',
    title: 'Przekształć dane operacyjne w decyzję, którą QDIP może ocenić.',
    body: 'Prześlij CSV, XLSX lub JSON. QDIP profiluje zbiór i proponuje semantykę biznesową wyłącznie jako hipotezy. Weryfikujesz ją przed użyciem w decyzji.',
    context: 'Kontekst biznesowy',
    contextHint: 'Opisz powtarzalną decyzję, cel i ograniczenia operacyjne.',
    file: 'Zbiór danych',
    submit: 'Analizuj dane',
    busy: 'Analizowanie…',
    result: 'Interpretacja',
    rows: 'Wiersze',
    columns: 'Kolumny',
    questions: 'Pytania do weryfikacji',
    gate: 'Bramka dowodowa',
    assumptions: 'Założenia',
    privacy: 'Nie przesyłaj zbędnych danych osobowych.',
  },
} as const

export function DecisionIntakeWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setAnalysis(null)
    try {
      const form = new FormData(event.currentTarget)
      const response = await fetch('/api/decision-intake/analyze', { method: 'POST', body: form })
      const payload: unknown = await response.json()
      if (!response.ok) {
        const detail =
          typeof payload === 'object' && payload && 'detail' in payload ? String(payload.detail) : 'Request failed.'
        throw new Error(detail)
      }
      setAnalysis(intakeAnalysisSchema.parse(payload))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 text-white md:px-8 md:pt-12">
      <header className="max-w-4xl">
        <div className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">{t.eyebrow}</div>
        <h1 className="mt-5 text-3xl font-normal tracking-[-.025em] md:text-5xl">{t.title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">{t.body}</p>
      </header>

      <form onSubmit={submit} className="mt-10 grid gap-6 rounded-xl border border-white/10 bg-slate-950/70 p-6 md:p-8">
        <label className="grid gap-2 text-sm text-slate-300">
          <span className="font-semibold text-white">{t.context}</span>
          <textarea
            name="business_context"
            rows={4}
            placeholder={t.contextHint}
            className="rounded-lg border border-white/10 bg-slate-900 p-3"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          <span className="font-semibold text-white">{t.file}</span>
          <input
            name="file"
            type="file"
            required
            accept=".csv,.xlsx,.json,text/csv,application/json"
            className="rounded-lg border border-white/10 bg-slate-900 p-3"
          />
        </label>
        <p className="text-xs text-slate-500">{t.privacy}</p>
        <button
          disabled={busy}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          <FileUp className="h-4 w-4" /> {busy ? t.busy : t.submit}
        </button>
        {error ? (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        ) : null}
      </form>

      {analysis ? (
        <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-live="polite">
          <article className="rounded-xl border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-xl font-medium">{t.result}</h2>
            <div className="mt-4 flex gap-6 text-sm text-slate-400">
              <span>
                {t.rows}: <b className="text-white">{analysis.profile.row_count}</b>
              </span>
              <span>
                {t.columns}: <b className="text-white">{analysis.profile.column_count}</b>
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {analysis.interpretation.candidates.map((candidate) => (
                <div key={`${candidate.field}:${candidate.role}`} className="border-t border-white/10 pt-3 text-sm">
                  <b>{candidate.field}</b> → <span className="text-cyan-200">{candidate.role}</span>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{candidate.reason}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-xl font-medium">{t.questions}</h2>
            <ol className="mt-4 grid gap-3 text-sm text-slate-300">
              {analysis.interpretation.clarification_questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
            <div className="mt-6 border-t border-white/10 pt-4 text-sm">
              <b>{t.gate}:</b> <span className="text-cyan-200">{analysis.evidence_gate.status}</span>
              <p className="mt-2 text-xs leading-5 text-slate-500">{analysis.evidence_gate.recommended_next_step}</p>
            </div>
            {analysis.contract.assumptions.length ? (
              <div className="mt-5">
                <b className="text-sm">{t.assumptions}</b>
                <ul className="mt-2 text-xs leading-5 text-slate-500">
                  {analysis.contract.assumptions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        </section>
      ) : null}
    </main>
  )
}
