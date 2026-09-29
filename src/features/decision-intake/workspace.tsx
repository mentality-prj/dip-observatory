'use client'

import { useState, type FormEvent } from 'react'
import { Check, FileUp, Plus, ShieldCheck, Trash2, Wrench, X } from 'lucide-react'

import { FileUploader } from '@/components/file-uploader'
import type { Locale } from '@/lib/observatory-i18n'
import {
  compiledResourceAllocationSchema,
  contractResponseSchema,
  intakeAnalysisSchema,
  semanticRoleSchema,
  type CompiledResourceAllocation,
  type IntakeAnalysis,
  type IntakeAnswers,
} from './model/contracts'
import {
  renderAssumption,
  renderClarification,
  renderNextStep,
  renderSemanticReason,
  renderSemanticRole,
} from './semantic-copy'

type CandidateChoice = 'user_confirmed' | 'rejected'
type AvailabilityChoice = 'available' | 'not_available'
type SemanticMapping = NonNullable<IntakeAnswers['semantic_mappings']>[number]

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
    uploadTooLarge: 'The dataset exceeds Decision Intake limits.',
    verificationTitle: 'Human verification',
    verificationBody: 'Confirm or reject inferred semantics, add missing field-role mappings, and verify which fields existed before the decision.',
    contractVersion: 'Contract version',
    candidateReview: 'Semantic hypotheses',
    confirm: 'Confirm',
    reject: 'Reject',
    mappingTitle: 'Add a missing semantic mapping',
    mappingHint: 'Use this when QDIP did not propose a required field-role mapping.',
    field: 'Field',
    role: 'Role',
    addMapping: 'Add mapping',
    pendingMappings: 'Pending mappings',
    remove: 'Remove',
    availabilityTitle: 'Decision-time availability',
    availabilityHint: 'For each input field, state whether it was available before the action was chosen.',
    notReviewed: 'Not reviewed',
    available: 'Available before decision',
    unavailable: 'Not available before decision',
    verify: 'Verify evidence',
    verifying: 'Verifying…',
    verificationFailed: 'Decision Intake verification failed.',
    missingEvidence: 'Missing evidence',
    compile: 'Compile resource-allocation request',
    compiling: 'Compiling…',
    compileFailed: 'Decision Intake compilation failed.',
    compiledTitle: 'Compiled adapter request',
    noCandidates: 'No semantic hypotheses were proposed. Add the required mappings manually.',
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
    legacySemanticsHint:
      'Ці елементи v1 збережено дослівно, оскільки їх неможливо безпечно локалізувати без втрати змісту.',
    privacy: 'Не завантажуйте зайві персональні дані.',
    requestFailed: 'Не вдалося виконати запит Decision Intake.',
    invalidDataset: 'Набір даних не вдалося проаналізувати. Перевірте його структуру та значення.',
    uploadTooLarge: 'Набір даних перевищує ліміти Decision Intake.',
    verificationTitle: 'Перевірка людиною',
    verificationBody:
      'Підтвердьте або відхиліть запропоновану семантику, додайте відсутні зіставлення поле-роль і перевірте, які поля існували до рішення.',
    contractVersion: 'Версія контракту',
    candidateReview: 'Семантичні гіпотези',
    confirm: 'Підтвердити',
    reject: 'Відхилити',
    mappingTitle: 'Додати відсутнє семантичне зіставлення',
    mappingHint: 'Використовуйте, якщо QDIP не запропонував потрібне зіставлення поля з роллю.',
    field: 'Поле',
    role: 'Роль',
    addMapping: 'Додати зіставлення',
    pendingMappings: 'Нові зіставлення',
    remove: 'Видалити',
    availabilityTitle: 'Доступність на момент рішення',
    availabilityHint: 'Для кожного вхідного поля вкажіть, чи було воно доступне до вибору дії.',
    notReviewed: 'Не перевірено',
    available: 'Було доступне до рішення',
    unavailable: 'Не було доступне до рішення',
    verify: 'Перевірити докази',
    verifying: 'Перевіряю…',
    verificationFailed: 'Не вдалося виконати перевірку Decision Intake.',
    missingEvidence: 'Відсутні докази',
    compile: 'Скомпілювати запит розподілу ресурсів',
    compiling: 'Компілюю…',
    compileFailed: 'Не вдалося скомпілювати Decision Intake.',
    compiledTitle: 'Скомпільований запит адаптера',
    noCandidates: 'Семантичних гіпотез немає. Додайте потрібні зіставлення вручну.',
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
    legacySemanticsHint:
      'Te elementy v1 zachowano dosłownie, ponieważ nie można ich bezpiecznie zlokalizować bez utraty znaczenia.',
    privacy: 'Nie przesyłaj zbędnych danych osobowych.',
    requestFailed: 'Nie udało się wykonać żądania Decision Intake.',
    invalidDataset: 'Nie udało się przeanalizować zbioru. Sprawdź jego strukturę i wartości.',
    uploadTooLarge: 'Zbiór przekracza limity Decision Intake.',
    verificationTitle: 'Weryfikacja przez człowieka',
    verificationBody:
      'Potwierdź lub odrzuć proponowaną semantykę, dodaj brakujące mapowania pole-rola i sprawdź, które pola istniały przed decyzją.',
    contractVersion: 'Wersja kontraktu',
    candidateReview: 'Hipotezy semantyczne',
    confirm: 'Potwierdź',
    reject: 'Odrzuć',
    mappingTitle: 'Dodaj brakujące mapowanie semantyczne',
    mappingHint: 'Użyj, jeśli QDIP nie zaproponował wymaganego mapowania pola do roli.',
    field: 'Pole',
    role: 'Rola',
    addMapping: 'Dodaj mapowanie',
    pendingMappings: 'Nowe mapowania',
    remove: 'Usuń',
    availabilityTitle: 'Dostępność w momencie decyzji',
    availabilityHint: 'Dla każdego pola wejściowego określ, czy było dostępne przed wyborem działania.',
    notReviewed: 'Niezweryfikowane',
    available: 'Dostępne przed decyzją',
    unavailable: 'Niedostępne przed decyzją',
    verify: 'Zweryfikuj dowody',
    verifying: 'Weryfikowanie…',
    verificationFailed: 'Weryfikacja Decision Intake nie powiodła się.',
    missingEvidence: 'Brakujące dowody',
    compile: 'Skompiluj żądanie alokacji zasobów',
    compiling: 'Kompilowanie…',
    compileFailed: 'Kompilacja Decision Intake nie powiodła się.',
    compiledTitle: 'Skompilowane żądanie adaptera',
    noCandidates: 'Brak hipotez semantycznych. Dodaj wymagane mapowania ręcznie.',
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
  const [verifying, setVerifying] = useState(false)
  const [compiling, setCompiling] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [compileError, setCompileError] = useState('')
  const [candidateAnswers, setCandidateAnswers] = useState<Record<string, CandidateChoice>>({})
  const [availabilityAnswers, setAvailabilityAnswers] = useState<Record<string, AvailabilityChoice>>({})
  const [semanticMappings, setSemanticMappings] = useState<SemanticMapping[]>([])
  const [mappingField, setMappingField] = useState('')
  const [mappingRole, setMappingRole] = useState<SemanticMapping['role']>('action')
  const [compiled, setCompiled] = useState<CompiledResourceAllocation | null>(null)

  function resetVerification(nextAnalysis?: IntakeAnalysis | null) {
    setCandidateAnswers({})
    setAvailabilityAnswers({})
    setSemanticMappings([])
    setVerificationError('')
    setCompileError('')
    setCompiled(null)
    setMappingRole('action')
    setMappingField(nextAnalysis?.contract.information_set[0]?.field ?? '')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError(t.fileRequired)
      return
    }

    setBusy(true)
    setError('')
    setAnalysis(null)
    resetVerification(null)

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

      const nextAnalysis = intakeAnalysisSchema.parse(payload)
      setAnalysis(nextAnalysis)
      resetVerification(nextAnalysis)
    } catch {
      setError(t.requestFailed)
    } finally {
      setBusy(false)
    }
  }

  function addSemanticMapping() {
    if (!analysis || !mappingField) return
    const existing = analysis.contract.candidates.find(
      (candidate) => candidate.field === mappingField && candidate.role === mappingRole
    )
    if (existing) {
      setCandidateAnswers((current) => ({ ...current, [existing.candidate_id]: 'user_confirmed' }))
      return
    }
    const duplicate = semanticMappings.some((mapping) => mapping.field === mappingField && mapping.role === mappingRole)
    if (duplicate) return
    setSemanticMappings((current) => [...current, { field: mappingField, role: mappingRole }])
  }

  async function verifyEvidence() {
    if (!analysis) return
    setVerifying(true)
    setVerificationError('')
    setCompileError('')
    setCompiled(null)

    const input: IntakeAnswers = {}
    if (Object.keys(candidateAnswers).length) input.candidate_statuses_by_id = candidateAnswers
    if (Object.keys(availabilityAnswers).length) input.information_availability = availabilityAnswers
    if (semanticMappings.length) input.semantic_mappings = semanticMappings

    try {
      const response = await fetch(
        `/api/decision-intake/${encodeURIComponent(analysis.contract.contract_id)}/answers`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }
      )
      const payload: unknown = await response.json()
      if (!response.ok) {
        setVerificationError(t.verificationFailed)
        return
      }
      const result = contractResponseSchema.parse(payload)
      setAnalysis((current) =>
        current
          ? {
              ...current,
              contract: result.contract,
              evidence_gate: result.evidence_gate,
              interpretation: {
                ...current.interpretation,
                candidates: result.contract.candidates,
              },
            }
          : current
      )
      setCandidateAnswers({})
      setAvailabilityAnswers({})
      setSemanticMappings([])
    } catch {
      setVerificationError(t.verificationFailed)
    } finally {
      setVerifying(false)
    }
  }

  async function compileContract() {
    if (!analysis) return
    setCompiling(true)
    setCompileError('')
    setCompiled(null)
    try {
      const response = await fetch(
        `/api/decision-intake/${encodeURIComponent(analysis.contract.contract_id)}/compile`,
        { method: 'POST' }
      )
      const payload: unknown = await response.json()
      if (!response.ok) {
        setCompileError(t.compileFailed)
        return
      }
      setCompiled(compiledResourceAllocationSchema.parse(payload))
    } catch {
      setCompileError(t.compileFailed)
    } finally {
      setCompiling(false)
    }
  }

  const hasPendingVerification =
    Object.keys(candidateAnswers).length > 0 ||
    Object.keys(availabilityAnswers).length > 0 ||
    semanticMappings.length > 0

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
              resetVerification(null)
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
        <>
          <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-live="polite">
            <article className="rounded-xl border border-white/10 bg-slate-950/70 p-6">
              <h2 className="text-xl font-medium">{t.result}</h2>
              <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-400">
                <span>
                  {t.rows}: <b className="text-white">{analysis.profile.row_count}</b>
                </span>
                <span>
                  {t.columns}: <b className="text-white">{analysis.profile.column_count}</b>
                </span>
                <span>
                  {t.contractVersion}: <b className="text-white">{analysis.contract.version}</b>
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {analysis.contract.candidates.map((candidate) => (
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
                <b>{t.gate}:</b>{' '}
                <span className="text-cyan-200">{t.gateStatuses[analysis.evidence_gate.status]}</span>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {renderNextStep(locale, analysis.evidence_gate.recommended_next_step)}
                </p>
                {analysis.evidence_gate.missing_evidence.length ? (
                  <p className="mt-2 text-xs text-amber-200">
                    {t.missingEvidence}: {analysis.evidence_gate.missing_evidence.join(', ')}
                  </p>
                ) : null}
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

          <section className="mt-6 rounded-xl border border-cyan-300/20 bg-slate-950/70 p-6 md:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="text-xl font-medium">{t.verificationTitle}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{t.verificationBody}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold">{t.candidateReview}</h3>
              {analysis.contract.candidates.length ? (
                <div className="mt-3 grid gap-3">
                  {analysis.contract.candidates.map((candidate) => {
                    const pending = candidateAnswers[candidate.candidate_id]
                    const confirmed =
                      pending === 'user_confirmed' ||
                      (!pending && ['user_confirmed', 'data_validated', 'evidence_supported'].includes(candidate.status))
                    const rejected = pending === 'rejected' || (!pending && candidate.status === 'rejected')
                    return (
                      <div
                        key={candidate.candidate_id}
                        className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-4 md:grid-cols-[1fr_auto]"
                      >
                        <div className="min-w-0 text-sm">
                          <b>{candidate.field}</b> →{' '}
                          <span className="text-cyan-200">{renderSemanticRole(locale, candidate.role)}</span>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {renderSemanticReason(locale, candidate.reason)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            data-testid={`confirm-${candidate.candidate_id}`}
                            onClick={() =>
                              setCandidateAnswers((current) => ({
                                ...current,
                                [candidate.candidate_id]: 'user_confirmed',
                              }))
                            }
                            className={`inline-flex items-center gap-1 border px-3 py-2 text-xs font-semibold ${
                              confirmed
                                ? 'border-emerald-300/50 bg-emerald-300/10 text-emerald-200'
                                : 'border-white/15 text-slate-300'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" /> {t.confirm}
                          </button>
                          <button
                            type="button"
                            data-testid={`reject-${candidate.candidate_id}`}
                            onClick={() =>
                              setCandidateAnswers((current) => ({
                                ...current,
                                [candidate.candidate_id]: 'rejected',
                              }))
                            }
                            className={`inline-flex items-center gap-1 border px-3 py-2 text-xs font-semibold ${
                              rejected
                                ? 'border-rose-300/50 bg-rose-300/10 text-rose-200'
                                : 'border-white/15 text-slate-300'
                            }`}
                          >
                            <X className="h-3.5 w-3.5" /> {t.reject}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">{t.noCandidates}</p>
              )}
            </div>

            <div className="mt-7 border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold">{t.mappingTitle}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t.mappingHint}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <label className="grid gap-1 text-xs text-slate-400">
                  {t.field}
                  <select
                    data-testid="decision-intake-mapping-field"
                    value={mappingField}
                    onChange={(event) => setMappingField(event.target.value)}
                    className="border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">—</option>
                    {analysis.contract.information_set.map((item) => (
                      <option key={item.field} value={item.field}>
                        {item.field}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-slate-400">
                  {t.role}
                  <select
                    data-testid="decision-intake-mapping-role"
                    value={mappingRole}
                    onChange={(event) => setMappingRole(event.target.value as SemanticMapping['role'])}
                    className="border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    {semanticRoleSchema.options.map((role) => (
                      <option key={role} value={role}>
                        {renderSemanticRole(locale, role)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  data-testid="decision-intake-add-mapping"
                  disabled={!mappingField}
                  onClick={addSemanticMapping}
                  className="mt-auto inline-flex items-center justify-center gap-2 border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" /> {t.addMapping}
                </button>
              </div>
              {semanticMappings.length ? (
                <div className="mt-4">
                  <b className="text-xs text-slate-400">{t.pendingMappings}</b>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {semanticMappings.map((mapping) => (
                      <span
                        key={`${mapping.field}:${mapping.role}`}
                        className="inline-flex items-center gap-2 border border-cyan-300/20 bg-cyan-300/[0.06] px-2 py-1 text-xs"
                      >
                        {mapping.field} → {renderSemanticRole(locale, mapping.role)}
                        <button
                          type="button"
                          aria-label={t.remove}
                          onClick={() =>
                            setSemanticMappings((current) =>
                              current.filter(
                                (item) => !(item.field === mapping.field && item.role === mapping.role)
                              )
                            )
                          }
                          className="text-slate-400 hover:text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <details className="mt-7 border-t border-white/10 pt-6" open>
              <summary className="cursor-pointer text-sm font-semibold">{t.availabilityTitle}</summary>
              <p className="mt-2 text-xs leading-5 text-slate-500">{t.availabilityHint}</p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {analysis.contract.information_set.map((item) => {
                  const value =
                    availabilityAnswers[item.field] ?? (item.availability === 'unknown' ? '' : item.availability)
                  return (
                    <label
                      key={item.field}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(150px,auto)] items-center gap-3 border border-white/10 bg-white/[0.02] px-3 py-2 text-xs"
                    >
                      <span className="truncate text-slate-300">{item.field}</span>
                      <select
                        data-testid={`availability-${item.field}`}
                        value={value}
                        onChange={(event) => {
                          const next = event.target.value as AvailabilityChoice | ''
                          setAvailabilityAnswers((current) => {
                            const updated = { ...current }
                            if (next) updated[item.field] = next
                            else delete updated[item.field]
                            return updated
                          })
                        }}
                        className="border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">{t.notReviewed}</option>
                        <option value="available">{t.available}</option>
                        <option value="not_available">{t.unavailable}</option>
                      </select>
                    </label>
                  )
                })}
              </div>
            </details>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="decision-intake-verify"
                disabled={verifying || !hasPendingVerification}
                onClick={verifyEvidence}
                className="inline-flex items-center gap-2 bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"
              >
                <ShieldCheck className="h-4 w-4" /> {verifying ? t.verifying : t.verify}
              </button>
              {analysis.evidence_gate.status === 'ready_for_decision' &&
              analysis.contract.archetype === 'constrained_resource_allocation' ? (
                <button
                  type="button"
                  data-testid="decision-intake-compile"
                  disabled={compiling}
                  onClick={compileContract}
                  className="inline-flex items-center gap-2 border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 disabled:opacity-40"
                >
                  <Wrench className="h-4 w-4" /> {compiling ? t.compiling : t.compile}
                </button>
              ) : null}
            </div>

            {verificationError ? (
              <p role="alert" className="mt-3 text-sm text-rose-300">
                {verificationError}
              </p>
            ) : null}
            {compileError ? (
              <p role="alert" className="mt-3 text-sm text-rose-300">
                {compileError}
              </p>
            ) : null}

            {compiled ? (
              <div data-testid="decision-intake-compiled" className="mt-6 border-t border-white/10 pt-5">
                <h3 className="text-sm font-semibold text-emerald-200">{t.compiledTitle}</h3>
                <pre className="mt-3 max-h-80 overflow-auto bg-black/30 p-4 text-xs text-slate-300">
                  {JSON.stringify(compiled.request, null, 2)}
                </pre>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  )
}
