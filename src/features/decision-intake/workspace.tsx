'use client'

import { useState, type FormEvent } from 'react'
import { FileUp } from 'lucide-react'

import type { Locale } from '@/lib/observatory-i18n'
import {
  contractResponseSchema,
  intakeAnalysisSchema,
  type IntakeAnalysis,
  type SufficiencyQuestion,
} from './model/contracts'

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
    questions: 'Decision sufficiency',
    gate: 'Evidence gate',
    assumptions: 'Assumptions',
    privacy: 'Do not upload unnecessary personal data.',
    structural: 'Structural decision',
    structuralBlocked: 'insufficient',
    structuralReady: 'decidable',
    causal: 'Causal identifiability',
    causalNeedsModel: 'not assessed — causal query and graph required',
    causalIdentified: 'identified',
    causalNotIdentified: 'not identified',
    nextQuestion: 'Next question',
    actionQuestion: 'Which field represents the action a decision maker can control?',
    objectiveQuestion: 'Which field represents the business objective QDIP should optimize?',
    outcomeQuestion: 'Which field records the realized outcome?',
    availableQuestion: 'Which fields were available before the action was chosen?',
    causalModelQuestion:
      'Define the causal query and causal graph before claiming that an intervention effect is identifiable.',
    confirmQuestion: 'Confirm whether “{field}” really represents the {role}.',
    choose: 'Choose a field',
    confirm: 'Confirm',
    reject: 'Reject',
    apply: 'Apply answer',
    answerBusy: 'Applying…',
    effectDecidable: 'If verified, this removes the last structural blocker.',
    effectRemoves: 'If verified, this removes one necessary blocker.',
    effectCausal: 'This enables a formal causal-identification test; it does not guarantee identifiability.',
    boundary: 'QDIP will not infer causal identifiability from column names or correlations alone.',
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
    questions: 'Достатність рішення',
    gate: 'Перевірка доказів',
    assumptions: 'Припущення',
    privacy: 'Не завантажуйте зайві персональні дані.',
    structural: 'Структура рішення',
    structuralBlocked: 'недостатньо даних',
    structuralReady: 'рішення формально визначене',
    causal: 'Каузальна ідентифікованість',
    causalNeedsModel: 'не перевірено — потрібні каузальний запит і граф',
    causalIdentified: 'ідентифіковано',
    causalNotIdentified: 'не ідентифіковано',
    nextQuestion: 'Наступне необхідне питання',
    actionQuestion: 'Яке поле представляє дію, яку може контролювати особа, що приймає рішення?',
    objectiveQuestion: 'Яке поле представляє бізнес-мету, яку QDIP має оптимізувати?',
    outcomeQuestion: 'Яке поле фіксує фактично отриманий результат?',
    availableQuestion: 'Які поля були доступні до моменту вибору дії?',
    causalModelQuestion:
      'Задайте каузальний запит і каузальний граф, перш ніж стверджувати, що ефект втручання ідентифікований.',
    confirmQuestion: 'Підтвердіть, чи «{field}» справді представляє роль «{role}».',
    choose: 'Оберіть поле',
    confirm: 'Підтвердити',
    reject: 'Відхилити',
    apply: 'Застосувати відповідь',
    answerBusy: 'Застосовую…',
    effectDecidable: 'Після підтвердження буде усунуто останній структурний blocker.',
    effectRemoves: 'Після підтвердження буде усунуто один необхідний blocker.',
    effectCausal: 'Це дозволить запустити формальний тест ідентифікованості, але не гарантує її.',
    boundary: 'QDIP не робить висновок про каузальну ідентифікованість лише з назв колонок або кореляцій.',
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
    questions: 'Wystarczalność decyzji',
    gate: 'Bramka dowodowa',
    assumptions: 'Założenia',
    privacy: 'Nie przesyłaj zbędnych danych osobowych.',
    structural: 'Struktura decyzji',
    structuralBlocked: 'niewystarczająca',
    structuralReady: 'decyzja jest formalnie określona',
    causal: 'Identyfikowalność przyczynowa',
    causalNeedsModel: 'nie oceniono — wymagane są zapytanie przyczynowe i graf',
    causalIdentified: 'zidentyfikowano',
    causalNotIdentified: 'nie zidentyfikowano',
    nextQuestion: 'Następne wymagane pytanie',
    actionQuestion: 'Które pole reprezentuje działanie kontrolowane przez osobę podejmującą decyzję?',
    objectiveQuestion: 'Które pole reprezentuje cel biznesowy, który QDIP ma optymalizować?',
    outcomeQuestion: 'Które pole zapisuje zrealizowany wynik?',
    availableQuestion: 'Które pola były dostępne przed wyborem działania?',
    causalModelQuestion:
      'Zdefiniuj zapytanie przyczynowe i graf przyczynowy przed stwierdzeniem identyfikowalności efektu interwencji.',
    confirmQuestion: 'Potwierdź, czy „{field}” rzeczywiście reprezentuje rolę „{role}”.',
    choose: 'Wybierz pole',
    confirm: 'Potwierdź',
    reject: 'Odrzuć',
    apply: 'Zastosuj odpowiedź',
    answerBusy: 'Stosowanie…',
    effectDecidable: 'Po weryfikacji zostanie usunięta ostatnia blokada strukturalna.',
    effectRemoves: 'Po weryfikacji zostanie usunięta jedna wymagana blokada.',
    effectCausal: 'Umożliwi to formalny test identyfikowalności przyczynowej, ale jej nie gwarantuje.',
    boundary: 'QDIP nie wnioskuje o identyfikowalności przyczynowej wyłącznie z nazw kolumn lub korelacji.',
  },
} as const

function questionText(locale: Locale, question: SufficiencyQuestion) {
  const t = copy[locale]
  if (question.kind === 'select_field') {
    if (question.role === 'action') return t.actionQuestion
    if (question.role === 'objective') return t.objectiveQuestion
    if (question.role === 'outcome') return t.outcomeQuestion
  }
  if (question.kind === 'select_available_fields') return t.availableQuestion
  if (question.kind === 'define_causal_model') return t.causalModelQuestion
  if (question.kind === 'confirm_semantic') {
    return t.confirmQuestion.replace('{field}', question.field ?? '').replace('{role}', question.role ?? '')
  }
  return question.id
}

function questionEffect(locale: Locale, question: SufficiencyQuestion) {
  const t = copy[locale]
  if (question.effect === 'makes_structurally_decidable') return t.effectDecidable
  if (question.effect === 'enables_causal_identification_test') return t.effectCausal
  return t.effectRemoves
}

export function DecisionIntakeWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [answerBusy, setAnswerBusy] = useState(false)
  const [selectedField, setSelectedField] = useState('')
  const [availableFields, setAvailableFields] = useState<string[]>([])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setAnalysis(null)
    setSelectedField('')
    setAvailableFields([])
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

  async function applyAnswer(action?: 'confirm' | 'reject') {
    const question = analysis?.sufficiency.next_question
    if (!analysis || !question || question.kind === 'define_causal_model') return

    const body: {
      candidate_statuses?: Record<string, string>
      information_availability?: Record<string, string>
      semantic_mappings?: Record<string, string>
    } = {}

    if (question.kind === 'confirm_semantic' && question.field) {
      body.candidate_statuses = {
        [question.field]: action === 'reject' ? 'rejected' : 'user_confirmed',
      }
    }

    if (question.kind === 'select_field' && question.role && selectedField) {
      body.semantic_mappings = { [question.role]: selectedField }
    }

    if (question.kind === 'select_available_fields') {
      const selected = new Set(availableFields)
      body.information_availability = Object.fromEntries(
        question.options.map((field) => [field, selected.has(field) ? 'available' : 'not_available'])
      )
    }

    if (!Object.keys(body).length) return

    setAnswerBusy(true)
    setError('')
    try {
      const response = await fetch(
        `/api/decision-intake/${encodeURIComponent(analysis.contract.contract_id)}/answers`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const payload: unknown = await response.json()
      if (!response.ok) {
        const detail =
          typeof payload === 'object' && payload && 'detail' in payload ? String(payload.detail) : 'Request failed.'
        throw new Error(detail)
      }
      const updated = contractResponseSchema.parse(payload)
      setAnalysis((current) =>
        current
          ? {
              ...current,
              contract: updated.contract,
              evidence_gate: updated.evidence_gate,
              sufficiency: updated.sufficiency,
            }
          : current
      )
      setSelectedField('')
      setAvailableFields([])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed.')
    } finally {
      setAnswerBusy(false)
    }
  }

  const nextQuestion = analysis?.sufficiency.next_question ?? null

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
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                <dt className="text-slate-400">{t.structural}</dt>
                <dd className="text-cyan-200">
                  {analysis.sufficiency.structural_status === 'ready' ? t.structuralReady : t.structuralBlocked}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                <dt className="text-slate-400">{t.causal}</dt>
                <dd className="text-right text-cyan-200">
                  {analysis.sufficiency.causal_identifiability === 'identified'
                    ? t.causalIdentified
                    : analysis.sufficiency.causal_identifiability === 'not_identified'
                      ? t.causalNotIdentified
                      : t.causalNeedsModel}
                </dd>
              </div>
            </dl>

            {nextQuestion ? (
              <div className="mt-6 border-t border-white/10 pt-4">
                <b className="text-sm">{t.nextQuestion}</b>
                <p className="mt-2 text-sm leading-6 text-slate-300">{questionText(locale, nextQuestion)}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{questionEffect(locale, nextQuestion)}</p>

                {nextQuestion.kind === 'select_field' ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <select
                      value={selectedField}
                      onChange={(event) => setSelectedField(event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 p-2.5 text-sm"
                    >
                      <option value="">{t.choose}</option>
                      {nextQuestion.options.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedField || answerBusy}
                      onClick={() => void applyAnswer()}
                      className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {answerBusy ? t.answerBusy : t.apply}
                    </button>
                  </div>
                ) : null}

                {nextQuestion.kind === 'confirm_semantic' ? (
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      disabled={answerBusy}
                      onClick={() => void applyAnswer('confirm')}
                      className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {t.confirm}
                    </button>
                    <button
                      type="button"
                      disabled={answerBusy}
                      onClick={() => void applyAnswer('reject')}
                      className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {t.reject}
                    </button>
                  </div>
                ) : null}

                {nextQuestion.kind === 'select_available_fields' ? (
                  <div className="mt-4 grid gap-2">
                    <div className="grid max-h-56 gap-2 overflow-auto rounded-lg border border-white/10 bg-slate-900/70 p-3">
                      {nextQuestion.options.map((field) => (
                        <label key={field} className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={availableFields.includes(field)}
                            onChange={(event) =>
                              setAvailableFields((current) =>
                                event.target.checked ? [...current, field] : current.filter((item) => item !== field)
                              )
                            }
                          />
                          {field}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={answerBusy}
                      onClick={() => void applyAnswer()}
                      className="w-fit rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {answerBusy ? t.answerBusy : t.apply}
                    </button>
                  </div>
                ) : null}

                {nextQuestion.kind === 'define_causal_model' ? (
                  <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100">
                    {t.boundary}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 border-t border-white/10 pt-4 text-sm">
              <b>{t.gate}:</b> <span className="text-cyan-200">{analysis.evidence_gate.status}</span>
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
