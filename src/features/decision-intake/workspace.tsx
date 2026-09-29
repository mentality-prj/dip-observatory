'use client'

import { useState, type FormEvent } from 'react'
import { FileUp } from 'lucide-react'

import { FileUploader } from '@/components/file-uploader'
import type { Locale } from '@/lib/observatory-i18n'
import { intakeAnalysisSchema, type IntakeAnalysis } from './model/contracts'
import {
  renderAssumption,
  renderClarification,
  renderNextStep,
  renderSemanticReason,
  renderSemanticRole,
} from './semantic-copy'

const copy = {
  en: {
    eyebrow: 'QDIP OBSERVATORY · DECISION INTAKE',
    title: 'Turn operational data into a decision QDIP can evaluate.',
    body: 'Upload CSV, XLSX or JSON. QDIP profiles the dataset and proposes business semantics as hypotheses. You verify them before they can become decision inputs.',
    context: 'Business context',
    contextHint: 'Describe the recurring decision, objective and operational constraints.',
    file: 'Dataset',
    drop: 'Drag and drop a file here',
    dropActive: 'Drop the file to analyze',
    or: 'or',
    choose: 'Choose CSV / XLSX / JSON',
    replace: 'Replace file',
    fileRequired: 'Choose a dataset before analysis.',
    submit: 'Analyze dataset',
    busy: 'Analyzing…',
    result: 'Interpretation',
    rows: 'Rows',
    columns: 'Columns',
    questions: 'Questions to verify',
    gate: 'Evidence gate',
    assumptions: 'Assumptions',
    legacySemantics: 'Legacy v1 semantics (original wording)',
    legacySemanticsHint: 'These opaque v1 items are preserved verbatim because they cannot be localized safely.',
    privacy: 'Do not upload unnecessary personal data.',
    requestFailed: 'Decision Intake request failed.',
    invalidDataset: 'The dataset could not be analyzed. Check its structure and values.',
    uploadTooLarge: 'The dataset is too large for Decision Intake.',
    gateStatuses: {
      no_opportunity: 'No opportunity',
      discovered: 'Discovered',
      ready_for_decision: 'Ready for decision',
      ready_for_historical_evaluation: 'Ready for historical evaluation',
      needs_more_data: 'Needs more data',
      needs_prospective_pilot: 'Needs prospective pilot',
      invalid: 'Invalid',
    },
  },
  uk: {
    eyebrow: 'QDIP OBSERVATORY · ПІДГОТОВКА РІШЕННЯ',
    title: 'Перетворіть операційні дані на рішення, яке може оцінити QDIP.',
    body: 'Завантажте CSV, XLSX або JSON. QDIP профілює набір даних і пропонує бізнес-семантику лише як гіпотези. Ви перевіряєте її до використання в рішенні.',
    context: 'Бізнес-контекст',
    contextHint: 'Опишіть повторюване рішення, мету та операційні обмеження.',
    file: 'Набір даних',
    drop: 'Перетягніть файл сюди',
    dropActive: 'Відпустіть файл, щоб додати його',
    or: 'або',
    choose: 'Вибрати CSV / XLSX / JSON',
    replace: 'Замінити файл',
    fileRequired: 'Виберіть набір даних перед аналізом.',
    submit: 'Проаналізувати дані',
    busy: 'Аналізую…',
    result: 'Інтерпретація',
    rows: 'Рядків',
    columns: 'Колонок',
    questions: 'Питання для перевірки',
    gate: 'Перевірка доказів',
    assumptions: 'Припущення',
    legacySemantics: 'Legacy-семантика v1 (оригінальне формулювання)',
    legacySemanticsHint: 'Ці елементи v1 збережено дослівно, оскільки їх неможливо безпечно локалізувати без втрати змісту.',
    privacy: 'Не завантажуйте зайві персональні дані.',
    requestFailed: 'Не вдалося виконати запит Decision Intake.',
    invalidDataset: 'Набір даних не вдалося проаналізувати. Перевірте його структуру та значення.',
    uploadTooLarge: 'Набір даних завеликий для Decision Intake.',
    gateStatuses: {
      no_opportunity: 'Немає можливості',
      discovered: 'Виявлено',
      ready_for_decision: 'Готово до рішення',
      ready_for_historical_evaluation: 'Готово до історичної оцінки',
      needs_more_data: 'Потрібно більше даних',
      needs_prospective_pilot: 'Потрібен проспективний пілот',
      invalid: 'Некоректно',
    },
  },
  pl: {
    eyebrow: 'QDIP OBSERVATORY · PRZYGOTOWANIE DECYZJI',
    title: 'Przekształć dane operacyjne w decyzję, którą QDIP może ocenić.',
    body: 'Prześlij CSV, XLSX lub JSON. QDIP profiluje zbiór i proponuje semantykę biznesową wyłącznie jako hipotezy. Weryfikujesz ją przed użyciem w decyzji.',
    context: 'Kontekst biznesowy',
    contextHint: 'Opisz powtarzalną decyzję, cel i ograniczenia operacyjne.',
    file: 'Zbiór danych',
    drop: 'Przeciągnij i upuść plik tutaj',
    dropActive: 'Upuść plik, aby go dodać',
    or: 'lub',
    choose: 'Wybierz CSV / XLSX / JSON',
    replace: 'Zastąp plik',
    fileRequired: 'Wybierz zbiór danych przed analizą.',
    submit: 'Analizuj dane',
    busy: 'Analizowanie…',
    result: 'Interpretacja',
    rows: 'Wiersze',
    columns: 'Kolumny',
    questions: 'Pytania do weryfikacji',
    gate: 'Bramka dowodowa',
    assumptions: 'Założenia',
    legacySemantics: 'Semantyka legacy v1 (oryginalne brzmienie)',
    legacySemanticsHint: 'Te elementy v1 zachowano dosłownie, ponieważ nie można ich bezpiecznie zlokalizować bez utraty znaczenia.',
    privacy: 'Nie przesyłaj zbędnych danych osobowych.',
    requestFailed: 'Nie udało się wykonać żądania Decision Intake.',
    invalidDataset: 'Nie udało się przeanalizować zbioru. Sprawdź jego strukturę i wartości.',
    uploadTooLarge: 'Zbiór danych jest zbyt duży dla Decision Intake.',
    gateStatuses: {
      no_opportunity: 'Brak możliwości',
      discovered: 'Wykryto',
      ready_for_decision: 'Gotowe do decyzji',
      ready_for_historical_evaluation: 'Gotowe do oceny historycznej',
      needs_more_data: 'Potrzeba więcej danych',
      needs_prospective_pilot: 'Wymagany pilotaż prospektywny',
      invalid: 'Nieprawidłowe',
    },
  },
} as const

export function DecisionIntakeWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError(t.fileRequired)
      return
    }

    setBusy(true)
    setError('')
    setAnalysis(null)

    try {
      const form = new FormData(event.currentTarget)
      form.set('file', file)
      const response = await fetch('/api/decision-intake/analyze', { method: 'POST', body: form })
      const payload: unknown = await response.json()

      if (!response.ok) {
        setError(
          response.status === 413 ? t.uploadTooLarge : response.status === 422 ? t.invalidDataset : t.requestFailed
        )
        return
      }

      setAnalysis(intakeAnalysisSchema.parse(payload))
    } catch {
      setError(t.requestFailed)
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

        <div className="grid gap-2 text-sm text-slate-300">
          <span className="font-semibold text-white">{t.file}</span>
          <FileUploader
            accept=".csv,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            copy={{
              drop: t.drop,
              dropActive: t.dropActive,
              or: t.or,
              choose: t.choose,
              replace: t.replace,
              busy: t.busy,
            }}
            file={file ? { name: file.name, size: file.size } : null}
            formats="CSV · XLSX · JSON"
            state={busy ? 'busy' : file ? 'selected' : 'idle'}
            statusLabel={busy ? t.busy : undefined}
            disabled={busy}
            onFile={(nextFile) => {
              setFile(nextFile)
              setAnalysis(null)
              setError('')
            }}
            tone="cyan"
            testId="decision-intake-dropzone"
            fileTestId="decision-intake-file"
          />
        </div>

        <p className="text-xs text-slate-500">{t.privacy}</p>
        <button
          disabled={busy || !file}
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
                <div key={candidate.candidate_id} className="border-t border-white/10 pt-3 text-sm">
                  <b>{candidate.field}</b> →{' '}
                  <span className="text-cyan-200">{renderSemanticRole(locale, candidate.role)}</span>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {renderSemanticReason(locale, candidate.reason)}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-xl font-medium">{t.questions}</h2>
            <ol className="mt-4 grid gap-3 text-sm text-slate-300">
              {analysis.interpretation.clarifications.map((item, index) => (
                <li key={`${item.code}:${index}`}>{renderClarification(locale, item)}</li>
              ))}
            </ol>

            <div className="mt-6 border-t border-white/10 pt-4 text-sm">
              <b>{t.gate}:</b> <span className="text-cyan-200">{t.gateStatuses[analysis.evidence_gate.status]}</span>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {renderNextStep(locale, analysis.evidence_gate.recommended_next_step)}
              </p>
            </div>

            {analysis.contract.assumptions.length ? (
              <div className="mt-5">
                <b className="text-sm">{t.assumptions}</b>
                <ul className="mt-2 text-xs leading-5 text-slate-500">
                  {analysis.contract.assumptions.map((item, index) => (
                    <li key={`${item.code}:${index}`}>{renderAssumption(locale, item)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {analysis.interpretation.legacy_clarifications.length ||
            analysis.interpretation.legacy_assumptions.length ||
            analysis.interpretation.legacy_unknowns.length ||
            analysis.interpretation.legacy_ambiguities.length ? (
              <details className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-500">
                <summary className="cursor-pointer font-semibold text-slate-300">{t.legacySemantics}</summary>
                <p className="mt-2 leading-5">{t.legacySemanticsHint}</p>
                <ul className="mt-2 grid gap-1">
                  {[
                    ...analysis.interpretation.legacy_clarifications,
                    ...analysis.interpretation.legacy_assumptions,
                    ...analysis.interpretation.legacy_unknowns,
                    ...analysis.interpretation.legacy_ambiguities,
                  ].map((item, index) => (
                    <li key={`legacy:${index}`}>{item}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </article>
        </section>
      ) : null}
    </main>
  )
}
