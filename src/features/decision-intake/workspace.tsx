'use client'

import { useState, type FormEvent } from 'react'
import { FileUp } from 'lucide-react'

import { FileUploader } from '@/components/file-uploader'
import type { Locale } from '@/lib/observatory-i18n'
import {
  intakeAnalysisSchema,
  type IntakeAnalysis,
  type IntakeMessageCode,
} from './model/contracts'

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
    privacy: 'Do not upload unnecessary personal data.',
    requestFailed: 'Decision Intake request failed.',
    invalidDataset: 'The dataset could not be analyzed. Check its structure and values.',
    uploadTooLarge: 'The dataset is too large for Decision Intake.',
    unstructuredQuestion: 'Additional business clarification is required.',
    unstructuredNextStep: 'Additional evidence is required before the decision can proceed.',
    inferredReason: 'AI-inferred hypothesis; human confirmation is required.',
    verifiedReason: 'Verified semantic mapping.',
    assumptionsSummary: '{count} unstructured model assumption(s) require verification.',
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
    privacy: 'Не завантажуйте зайві персональні дані.',
    requestFailed: 'Не вдалося виконати запит Decision Intake.',
    invalidDataset: 'Набір даних не вдалося проаналізувати. Перевірте його структуру та значення.',
    uploadTooLarge: 'Набір даних завеликий для Decision Intake.',
    unstructuredQuestion: 'Потрібне додаткове уточнення бізнес-семантики.',
    unstructuredNextStep: 'Перед продовженням рішення потрібні додаткові докази.',
    inferredReason: 'Гіпотеза, визначена ШІ; потрібне підтвердження людиною.',
    verifiedReason: 'Підтверджене семантичне зіставлення.',
    assumptionsSummary: '{count} неструктурованих припущень моделі потребують перевірки.',
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
    privacy: 'Nie przesyłaj zbędnych danych osobowych.',
    requestFailed: 'Nie udało się wykonać żądania Decision Intake.',
    invalidDataset: 'Nie udało się przeanalizować zbioru. Sprawdź jego strukturę i wartości.',
    uploadTooLarge: 'Zbiór danych jest zbyt duży dla Decision Intake.',
    unstructuredQuestion: 'Wymagane jest dodatkowe doprecyzowanie semantyki biznesowej.',
    unstructuredNextStep: 'Przed kontynuacją decyzji potrzebne są dodatkowe dowody.',
    inferredReason: 'Hipoteza wywnioskowana przez AI; wymaga potwierdzenia przez człowieka.',
    verifiedReason: 'Zweryfikowane mapowanie semantyczne.',
    assumptionsSummary: '{count} nieustrukturyzowanych założeń modelu wymaga weryfikacji.',
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

const messageText: Record<Locale, Record<IntakeMessageCode, string>> = {
  en: {
    'question.controllable_action': 'Which field represents the action a decision maker can control?',
    'question.business_objective': 'What business objective should QDIP optimize?',
    'question.binding_constraints': 'Which constraints were known and binding at decision time?',
    'question.decision_time_information': 'Which fields were available before the action was chosen?',
    'question.realized_outcome': 'Which field records the realized outcome?',
    'reason.critical_semantics_ai_inferred': 'Critical decision semantics are still AI-inferred.',
    'reason.verified_critical_semantics_missing': 'Verified critical decision semantics are missing.',
    'reason.information_set_unresolved_or_unverified': 'The decision-time information set is unresolved or unverified.',
    'reason.minimum_verified_semantics_present': 'Minimum verified decision semantics and information set are present.',
    'next.confirm_or_reject_inferred_critical_semantic': 'Confirm or reject every inferred critical semantic.',
    'next.confirm_controllable_action_and_business_objective': 'Confirm the controllable action and business objective.',
    'next.verify_decision_time_availability': 'Verify decision-time availability for every input field.',
    'next.compile_resource_allocation': 'Compile through the constrained resource-allocation adapter.',
  },
  uk: {
    'question.controllable_action': 'Яке поле відповідає дії, яку може контролювати особа, що приймає рішення?',
    'question.business_objective': 'Яку бізнес-мету має оптимізувати QDIP?',
    'question.binding_constraints': 'Які обмеження були відомі та обов’язкові на момент прийняття рішення?',
    'question.decision_time_information': 'Які поля були доступні до вибору дії?',
    'question.realized_outcome': 'Яке поле фіксує фактичний результат?',
    'reason.critical_semantics_ai_inferred': 'Критична семантика рішення досі визначена лише ШІ.',
    'reason.verified_critical_semantics_missing': 'Немає підтвердженої критичної семантики рішення.',
    'reason.information_set_unresolved_or_unverified': 'Набір інформації на момент рішення не визначений або не підтверджений.',
    'reason.minimum_verified_semantics_present': 'Мінімально необхідна семантика рішення та набір інформації підтверджені.',
    'next.confirm_or_reject_inferred_critical_semantic': 'Підтвердьте або відхиліть кожну критичну семантику, визначену ШІ.',
    'next.confirm_controllable_action_and_business_objective': 'Підтвердьте керовану дію та бізнес-мету.',
    'next.verify_decision_time_availability': 'Підтвердьте доступність кожного вхідного поля на момент прийняття рішення.',
    'next.compile_resource_allocation': 'Скомпілюйте контракт через адаптер обмеженого розподілу ресурсів.',
  },
  pl: {
    'question.controllable_action': 'Które pole reprezentuje działanie, które może kontrolować osoba podejmująca decyzję?',
    'question.business_objective': 'Jaki cel biznesowy powinien optymalizować QDIP?',
    'question.binding_constraints': 'Które ograniczenia były znane i wiążące w momencie podejmowania decyzji?',
    'question.decision_time_information': 'Które pola były dostępne przed wyborem działania?',
    'question.realized_outcome': 'Które pole rejestruje rzeczywisty wynik?',
    'reason.critical_semantics_ai_inferred': 'Krytyczna semantyka decyzji nadal jest wyłącznie wnioskiem AI.',
    'reason.verified_critical_semantics_missing': 'Brakuje zweryfikowanej krytycznej semantyki decyzji.',
    'reason.information_set_unresolved_or_unverified': 'Zbiór informacji dostępnych w momencie decyzji jest nierozstrzygnięty lub niezweryfikowany.',
    'reason.minimum_verified_semantics_present': 'Minimalna wymagana semantyka decyzji i zbiór informacji zostały zweryfikowane.',
    'next.confirm_or_reject_inferred_critical_semantic': 'Potwierdź lub odrzuć każdą krytyczną semantykę wywnioskowaną przez AI.',
    'next.confirm_controllable_action_and_business_objective': 'Potwierdź kontrolowane działanie i cel biznesowy.',
    'next.verify_decision_time_availability': 'Zweryfikuj dostępność każdego pola wejściowego w momencie podejmowania decyzji.',
    'next.compile_resource_allocation': 'Skompiluj kontrakt przez adapter ograniczonej alokacji zasobów.',
  },
}

const roleLabels: Record<Locale, Record<string, string>> = {
  en: {
    action: 'action',
    objective: 'objective',
    constraint: 'constraint',
    community_id: 'community',
    team_id: 'team',
    capacity: 'capacity',
    demand: 'demand',
    service: 'service',
  },
  uk: {
    action: 'дія',
    objective: 'мета',
    constraint: 'обмеження',
    community_id: 'спільнота',
    team_id: 'команда',
    capacity: 'спроможність',
    demand: 'потреба',
    service: 'послуга',
  },
  pl: {
    action: 'działanie',
    objective: 'cel',
    constraint: 'ograniczenie',
    community_id: 'społeczność',
    team_id: 'zespół',
    capacity: 'zdolność',
    demand: 'zapotrzebowanie',
    service: 'usługa',
  },
}

const legacyMessageCode: Record<string, IntakeMessageCode> = {
  'Which field represents the action a decision maker can control?': 'question.controllable_action',
  'What business objective should QDIP optimize?': 'question.business_objective',
  'Which constraints were known and binding at decision time?': 'question.binding_constraints',
  'Which fields were available before the action was chosen?': 'question.decision_time_information',
  'Which field records the realized outcome?': 'question.realized_outcome',
  'Confirm or reject every inferred critical semantic.': 'next.confirm_or_reject_inferred_critical_semantic',
  'Confirm the controllable action and business objective.': 'next.confirm_controllable_action_and_business_objective',
  'Verify decision-time availability for every input field.': 'next.verify_decision_time_availability',
  'Compile through the constrained resource-allocation adapter.': 'next.compile_resource_allocation',
}

function localizeLegacyMessage(locale: Locale, text: string, fallback: string): string {
  if (locale === 'en') return text
  const code = legacyMessageCode[text]
  return code ? messageText[locale][code] : fallback
}

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
        setError(response.status === 413 ? t.uploadTooLarge : response.status === 422 ? t.invalidDataset : t.requestFailed)
        return
      }

      setAnalysis(intakeAnalysisSchema.parse(payload))
    } catch {
      setError(t.requestFailed)
    } finally {
      setBusy(false)
    }
  }

  const clarificationQuestions = analysis
    ? analysis.semantic_codes?.clarification_questions.length
      ? analysis.semantic_codes.clarification_questions.map((code) => messageText[locale][code])
      : analysis.interpretation.clarification_questions.map((question) =>
          localizeLegacyMessage(locale, question, t.unstructuredQuestion)
        )
    : []

  const nextStep = analysis
    ? analysis.evidence_gate.recommended_next_step_code
      ? messageText[locale][analysis.evidence_gate.recommended_next_step_code]
      : localizeLegacyMessage(locale, analysis.evidence_gate.recommended_next_step, t.unstructuredNextStep)
    : ''

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
                <div key={`${candidate.field}:${candidate.role}`} className="border-t border-white/10 pt-3 text-sm">
                  <b>{candidate.field}</b> →{' '}
                  <span className="text-cyan-200">{roleLabels[locale][candidate.role] ?? candidate.role}</span>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {locale === 'en'
                      ? candidate.reason
                      : candidate.status === 'inferred'
                        ? t.inferredReason
                        : t.verifiedReason}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-xl font-medium">{t.questions}</h2>
            <ol className="mt-4 grid gap-3 text-sm text-slate-300">
              {clarificationQuestions.map((question, index) => (
                <li key={`${index}:${question}`}>{question}</li>
              ))}
            </ol>

            <div className="mt-6 border-t border-white/10 pt-4 text-sm">
              <b>{t.gate}:</b>{' '}
              <span className="text-cyan-200">{t.gateStatuses[analysis.evidence_gate.status]}</span>
              <p className="mt-2 text-xs leading-5 text-slate-500">{nextStep}</p>
            </div>

            {analysis.contract.assumptions.length ? (
              <div className="mt-5">
                <b className="text-sm">{t.assumptions}</b>
                <ul className="mt-2 text-xs leading-5 text-slate-500">
                  {locale === 'en' ? (
                    analysis.contract.assumptions.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>{t.assumptionsSummary.replace('{count}', String(analysis.contract.assumptions.length))}</li>
                  )}
                </ul>
              </div>
            ) : null}
          </article>
        </section>
      ) : null}
    </main>
  )
}
