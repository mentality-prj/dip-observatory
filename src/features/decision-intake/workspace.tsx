'use client'

import { useState, type FormEvent } from 'react'
import { Check, FileUp, Plus, ShieldCheck, Trash2, Wrench, X } from 'lucide-react'

import { FileUploader } from '@/components/file-uploader'
import type { Locale } from '@/lib/observatory-i18n'
import {
  compiledResourceAllocationSchema,
  contractResponseSchema,
  executedDecisionIntakeSchema,
  decisionArchetypeSchema,
  intakeAnalysisSchema,
  semanticRoleSchema,
  type CausalSpecification,
  type CompiledResourceAllocation,
  type ExecutedDecisionIntake,
  type IntakeAnalysis,
  type IntakeAnswers,
  type SufficiencyQuestion,
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
    questions: 'Decision sufficiency',
    gate: 'Evidence gate',
    assumptions: 'Assumptions',
    legacySemantics: 'Legacy v1 semantics (original wording)',
    legacySemanticsHint: 'These opaque v1 items are preserved verbatim because they cannot be localized safely.',
    privacy: 'Do not upload unnecessary personal data.',
    requestFailed: 'Decision Intake request failed.',
    invalidDataset: 'The dataset could not be analyzed. Check its structure and values.',
    uploadTooLarge: 'The dataset exceeds Decision Intake limits.',
    verificationTitle: 'Human verification',
    verificationBody:
      'Review QDIP’s candidate mathematical formulation. Confirm the model; edit only material exceptions.',
    formalizationTitle: 'Candidate problem formalization',
    formalizationBody:
      'QDIP inferred the decision structure, objective candidates, constraints, compiler mappings and decision-time inputs. These remain hypotheses until you confirm them.',
    completeness: 'Formalization completeness',
    decisionVariable: 'Decision variable',
    objectiveCandidates: 'Objective candidates',
    constraintsTitle: 'Inferred constraints',
    compilerMappings: 'Compiler mappings',
    timingSuggestions: 'Decision-time suggestions',
    acceptFormalization: 'Accept suggested formalization',
    acceptingFormalization: 'Applying formalization…',
    selectObjective: 'Select objective',
    supportedByCompiler: 'supported by compiler',
    requiresDifferentCompiler: 'requires another compiler',
    hardConstraint: 'hard',
    softConstraint: 'soft',
    ambiguousConstraint: 'ambiguous',
    scopedTo: 'when',
    contractVersion: 'Contract version',
    candidateReview: 'Semantic hypotheses',
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
    execute: 'Run decision',
    executing: 'Running decision…',
    executionFailed: 'Decision execution failed.',
    executedTitle: 'QDIP decision result',
    preflightError: 'Compiler preflight',
    editFormalization: 'Edit exception',
    saveOverride: 'Save override',
    expression: 'Expression',
    operator: 'Operator',
    value: 'Value',
    scopeField: 'Scope field',
    scopeValues: 'Scope values (comma-separated)',
    noCandidates: 'No semantic hypotheses were proposed. Add the required mappings manually.',
    gateStatuses: {
      no_opportunity: 'No opportunity',
      discovered: 'Discovered',
      ready_for_structural_intake: 'Structural intake ready',
      ready_for_decision: 'Ready for decision',
      ready_for_historical_evaluation: 'Ready for historical evaluation',
      needs_more_data: 'Needs more data',
      needs_prospective_pilot: 'Needs prospective pilot',
      invalid: 'Invalid',
    },

    structural: 'Structural decision',
    structuralBlocked: 'insufficient',
    structuralReady: 'structural intake requirements satisfied',
    compilation: 'Compiler readiness',
    compilationReady: 'ready for supported compiler',
    compilationBlocked: 'compiler path incomplete',
    compilationUnsupported: 'no supported compiler for this archetype',
    compilerNextStep: 'Compiler next required step',
    compilerMapping: 'Required compiler mapping',
    decisionArchetype: 'Decision archetype',
    causal: 'Causal identifiability',
    causalNeedsModel: 'not assessed — causal query and graph required',
    causalIdentified: 'identified',
    causalNotIdentified: 'not identified',
    nextQuestion: 'Next required step',
    actionQuestion: 'Which field represents the action a decision maker can control?',
    causalActionQuestion: 'Which observed field records the historical action or treatment for causal analysis?',
    objectiveQuestion: 'Which field represents the business objective QDIP should optimize?',
    outcomeQuestion: 'Which field records the realized outcome?',
    availableQuestion: 'Which fields were available before the action was chosen?',
    causalModelQuestion:
      'Define the causal query and causal graph before claiming that an intervention effect is identifiable.',
    confirmQuestion: 'Confirm whether “{field}” really represents the {role}.',
    chooseField: 'Choose a field',
    confirm: 'Confirm',
    reject: 'Reject',
    apply: 'Apply answer',
    answerBusy: 'Applying…',
    effectDecidable: 'If verified, this removes the last structural blocker.',
    effectRemoves: 'If verified, this removes one necessary blocker.',
    effectCausal: 'This enables a formal causal-identification test; it does not guarantee identifiability.',
    boundary: 'QDIP will not infer causal identifiability from column names or correlations alone.',
    certificate: 'Structural certificate',
    certificateIssued: 'issued',
    certificateBlocked: 'blocked',
    planner: 'Question planner',
    requirements: 'Requirement graph',
    priority: 'Priority score',
    estimatedCost: 'Estimated acquisition cost',
    causalNeedsVerification: 'causal specification requires verification',
    causalInvalid: 'invalid causal specification',
    causalEvidenceQuestion: 'The current observational model is not sufficient. Plan additional causal evidence.',
    causalEdges: 'Causal edges',
    causalEdgesHint: 'One edge per line: A -> B or A <-> B',
    graphWarning:
      'Omitted directed or bidirected edges are causal assumptions, not unknown relationships. Confirm the graph only if those absences are defensible.',
    treatments: 'Interventions',
    outcomes: 'Outcomes',
    conditioning: 'Conditioning variables',
    commaSeparated: 'Comma-separated field names',
    verifyCausalAssumptions: 'I confirm the graph semantics and identification assumptions for this causal model.',
    runIdentification: 'Run ID/IDC identification',
    causalCertificate: 'Causal identification certificate',
    estimand: 'Identifying estimand',
    failureWitness: 'ID non-identifiability failure witness',
    proof: 'Identification trace',
    effectEvidence:
      'ID reached a non-identifiability failure; observational data alone cannot identify this effect under the verified graph.',
    evidencePlan: 'Evidence acquisition plan',
    evidenceVerify: 'Verify absence of latent confounding',
    evidenceRandomize: 'Collect prospective interventional data',
    preferred: 'preferred',
    empiricalSupport: 'Empirical support check',
    supportPassed: 'basic overlap check passed — full positivity is not certified',
    supportFailed: 'basic overlap check failed',
    supportFull: 'full model-aware positivity analysis required',
    supportNot: 'not assessed',
    treatmentLevels: 'Treatment levels',
    checkedStrata: 'Checked strata',
    checkedObligations: 'Checked estimand obligations',
    failedObligations: 'Unsupported estimand obligations',
    deferredObligations: 'Obligations requiring full analysis',
    evidenceVerifyQuestion: 'Can independent domain evidence justify absence of latent confounding for {variables}?',
    evidenceRandomizeQuestion: 'Can you collect prospective interventional data for {variables}?',
    estimabilityQuestion:
      'The causal effect is identified. Complete the statistical estimability and positivity checks before using it for a decision.',
    effectEstimability:
      'This does not change causal identification; it determines whether the identified estimand can be supported by the available data.',
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
    questions: 'Достатність рішення',
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
      'Перевірте candidate mathematical formalization, яку побудував QDIP. Підтверджуйте модель, а вручну змінюйте лише суттєві винятки.',
    formalizationTitle: 'Кандидатна формалізація задачі',
    formalizationBody:
      'QDIP сам визначив структуру рішення, варіанти objective, constraints, compiler mappings і decision-time inputs. До підтвердження це гіпотези.',
    completeness: 'Повнота формалізації',
    decisionVariable: 'Decision variable',
    objectiveCandidates: 'Варіанти objective',
    constraintsTitle: 'Виявлені constraints',
    compilerMappings: 'Compiler mappings',
    timingSuggestions: 'Припущення про decision-time',
    acceptFormalization: 'Прийняти запропоновану formalization',
    acceptingFormalization: 'Застосовую formalization…',
    selectObjective: 'Оберіть objective',
    supportedByCompiler: 'підтримується compiler',
    requiresDifferentCompiler: 'потрібен інший compiler',
    hardConstraint: 'hard',
    softConstraint: 'soft',
    ambiguousConstraint: 'ambiguous',
    scopedTo: 'коли',
    contractVersion: 'Версія контракту',
    candidateReview: 'Семантичні гіпотези',
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
    execute: 'Запустити рішення',
    executing: 'Виконую рішення…',
    executionFailed: 'Не вдалося виконати рішення.',
    executedTitle: 'Результат рішення QDIP',
    preflightError: 'Compiler preflight',
    editFormalization: 'Редагувати виняток',
    saveOverride: 'Зберегти override',
    expression: 'Вираз',
    operator: 'Оператор',
    value: 'Значення',
    scopeField: 'Поле scope',
    scopeValues: 'Значення scope через кому',
    noCandidates: 'Семантичних гіпотез немає. Додайте потрібні зіставлення вручну.',
    gateStatuses: {
      no_opportunity: 'Немає можливості',
      discovered: 'Виявлено',
      ready_for_structural_intake: 'Структурний intake готовий',
      ready_for_decision: 'Готово до рішення',
      ready_for_historical_evaluation: 'Готово до історичної оцінки',
      needs_more_data: 'Потрібно більше даних',
      needs_prospective_pilot: 'Потрібен проспективний пілот',
      invalid: 'Некоректно',
    },

    structural: 'Структура рішення',
    structuralBlocked: 'недостатньо даних',
    structuralReady: 'структурні вимоги intake виконано',
    compilation: 'Готовність compiler',
    compilationReady: 'готово до supported compiler',
    compilationBlocked: 'compiler path не завершено',
    compilationUnsupported: 'для цього archetype немає supported compiler',
    compilerNextStep: 'Наступний необхідний крок compiler',
    compilerMapping: 'Обов’язковий compiler mapping',
    decisionArchetype: 'Archetype рішення',
    causal: 'Каузальна ідентифікованість',
    causalNeedsModel: 'не перевірено — потрібні каузальний запит і граф',
    causalIdentified: 'ідентифіковано',
    causalNotIdentified: 'не ідентифіковано',
    nextQuestion: 'Наступний необхідний крок',
    actionQuestion: 'Яке поле представляє дію, яку може контролювати особа, що приймає рішення?',
    causalActionQuestion: 'Яке observed поле фіксує історичну дію або treatment для каузального аналізу?',
    objectiveQuestion: 'Яке поле представляє бізнес-мету, яку QDIP має оптимізувати?',
    outcomeQuestion: 'Яке поле фіксує фактично отриманий результат?',
    availableQuestion: 'Які поля були доступні до моменту вибору дії?',
    causalModelQuestion:
      'Задайте каузальний запит і каузальний граф, перш ніж стверджувати, що ефект втручання ідентифікований.',
    confirmQuestion: 'Підтвердіть, чи «{field}» справді представляє роль «{role}».',
    chooseField: 'Оберіть поле',
    confirm: 'Підтвердити',
    reject: 'Відхилити',
    apply: 'Застосувати відповідь',
    answerBusy: 'Застосовую…',
    effectDecidable: 'Після підтвердження буде усунуто останній структурний blocker.',
    effectRemoves: 'Після підтвердження буде усунуто один необхідний blocker.',
    effectCausal: 'Це дозволить запустити формальний тест ідентифікованості, але не гарантує її.',
    boundary: 'QDIP не робить висновок про каузальну ідентифікованість лише з назв колонок або кореляцій.',
    certificate: 'Структурний сертифікат',
    certificateIssued: 'видано',
    certificateBlocked: 'заблоковано',
    planner: 'Планувальник питань',
    requirements: 'Граф вимог',
    priority: 'Оцінка пріоритету',
    estimatedCost: 'Оціночна вартість отримання відповіді',
    causalNeedsVerification: 'каузальна специфікація потребує перевірки',
    causalInvalid: 'некоректна каузальна специфікація',
    causalEvidenceQuestion:
      'Поточної observational-моделі недостатньо. Потрібно спланувати додатковий causal evidence.',
    causalEdges: 'Каузальні зв’язки',
    causalEdgesHint: 'Один зв’язок на рядок: A -> B або A <-> B',
    graphWarning:
      'Відсутні directed або bidirected edges — це causal assumptions, а не невідомі зв’язки. Підтверджуйте граф лише якщо їхню відсутність можна обґрунтувати.',
    treatments: 'Втручання',
    outcomes: 'Результати',
    conditioning: 'Умовні змінні',
    commaSeparated: 'Назви полів через кому',
    verifyCausalAssumptions: 'Я підтверджую семантику графа та assumptions ідентифікації для цієї causal model.',
    runIdentification: 'Запустити ID/IDC identification',
    causalCertificate: 'Сертифікат каузальної ідентифікації',
    estimand: 'Ідентифікуючий estimand',
    failureWitness: 'ID witness неідентифікованості',
    proof: 'Трасування identification',
    effectEvidence:
      'ID дійшов до failure неідентифікованості: лише observational data не ідентифікують цей ефект за підтвердженого графа.',
    evidencePlan: 'План отримання causal evidence',
    evidenceVerify: 'Перевірити відсутність latent confounding',
    evidenceRandomize: 'Зібрати prospective interventional data',
    preferred: 'пріоритетний',
    empiricalSupport: 'Перевірка empirical support',
    supportPassed: 'базову перевірку overlap пройдено — повну positivity не сертифіковано',
    supportFailed: 'базову перевірку overlap не пройдено',
    supportFull: 'потрібен повний model-aware positivity analysis',
    supportNot: 'не перевірено',
    treatmentLevels: 'Рівні treatment',
    checkedStrata: 'Перевірено strata',
    checkedObligations: 'Перевірені estimand obligations',
    failedObligations: 'Estimand obligations без support',
    deferredObligations: 'Obligations, що потребують full analysis',
    evidenceVerifyQuestion:
      'Чи підтверджують незалежні domain evidence відсутність latent confounding для {variables}?',
    evidenceRandomizeQuestion: 'Чи можете ви зібрати prospective interventional data для {variables}?',
    estimabilityQuestion:
      'Каузальний ефект ідентифікований. Завершіть перевірку statistical estimability та positivity перед використанням у рішенні.',
    effectEstimability:
      'Це не змінює causal identification; перевірка визначає, чи можна підтримати identified estimand наявними даними.',
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
    questions: 'Wystarczalność decyzji',
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
      'Sprawdź kandydacką formalizację matematyczną zbudowaną przez QDIP. Potwierdź model i edytuj ręcznie tylko istotne wyjątki.',
    formalizationTitle: 'Kandydacka formalizacja problemu',
    formalizationBody:
      'QDIP wywnioskował strukturę decyzji, kandydatów celu, ograniczenia, mapowania kompilatora i dane dostępne przed decyzją. Do potwierdzenia są to hipotezy.',
    completeness: 'Kompletność formalizacji',
    decisionVariable: 'Zmienna decyzyjna',
    objectiveCandidates: 'Kandydaci celu',
    constraintsTitle: 'Wywnioskowane ograniczenia',
    compilerMappings: 'Mapowania kompilatora',
    timingSuggestions: 'Sugestie dostępności w czasie decyzji',
    acceptFormalization: 'Zaakceptuj proponowaną formalizację',
    acceptingFormalization: 'Stosowanie formalizacji…',
    selectObjective: 'Wybierz cel',
    supportedByCompiler: 'obsługiwane przez kompilator',
    requiresDifferentCompiler: 'wymaga innego kompilatora',
    hardConstraint: 'twarde',
    softConstraint: 'miękkie',
    ambiguousConstraint: 'niejednoznaczne',
    scopedTo: 'gdy',
    contractVersion: 'Wersja kontraktu',
    candidateReview: 'Hipotezy semantyczne',
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
    execute: 'Uruchom decyzję',
    executing: 'Uruchamianie decyzji…',
    executionFailed: 'Wykonanie decyzji nie powiodło się.',
    executedTitle: 'Wynik decyzji QDIP',
    preflightError: 'Compiler preflight',
    editFormalization: 'Edytuj wyjątek',
    saveOverride: 'Zapisz nadpisanie',
    expression: 'Wyrażenie',
    operator: 'Operator',
    value: 'Wartość',
    scopeField: 'Pole zakresu',
    scopeValues: 'Wartości zakresu (po przecinku)',
    noCandidates: 'Brak hipotez semantycznych. Dodaj wymagane mapowania ręcznie.',
    gateStatuses: {
      no_opportunity: 'Brak możliwości',
      discovered: 'Wykryto',
      ready_for_structural_intake: 'Strukturalny intake gotowy',
      ready_for_decision: 'Gotowe do decyzji',
      ready_for_historical_evaluation: 'Gotowe do oceny historycznej',
      needs_more_data: 'Potrzeba więcej danych',
      needs_prospective_pilot: 'Wymagany pilotaż prospektywny',
      invalid: 'Nieprawidłowe',
    },

    structural: 'Struktura decyzji',
    structuralBlocked: 'niewystarczająca',
    structuralReady: 'wymagania strukturalne intake spełnione',
    compilation: 'Gotowość kompilatora',
    compilationReady: 'gotowe dla obsługiwanego kompilatora',
    compilationBlocked: 'ścieżka kompilatora jest niekompletna',
    compilationUnsupported: 'brak obsługiwanego kompilatora dla tego archetypu',
    compilerNextStep: 'Następny wymagany krok kompilatora',
    compilerMapping: 'Wymagane mapowanie kompilatora',
    decisionArchetype: 'Archetyp decyzji',
    causal: 'Identyfikowalność przyczynowa',
    causalNeedsModel: 'nie oceniono — wymagane są zapytanie przyczynowe i graf',
    causalIdentified: 'zidentyfikowano',
    causalNotIdentified: 'nie zidentyfikowano',
    nextQuestion: 'Następny wymagany krok',
    actionQuestion: 'Które pole reprezentuje działanie kontrolowane przez osobę podejmującą decyzję?',
    causalActionQuestion:
      'Które obserwowane pole zapisuje historyczne działanie lub treatment dla analizy przyczynowej?',
    objectiveQuestion: 'Które pole reprezentuje cel biznesowy, który QDIP ma optymalizować?',
    outcomeQuestion: 'Które pole zapisuje zrealizowany wynik?',
    availableQuestion: 'Które pola były dostępne przed wyborem działania?',
    causalModelQuestion:
      'Zdefiniuj zapytanie przyczynowe i graf przyczynowy przed stwierdzeniem identyfikowalności efektu interwencji.',
    confirmQuestion: 'Potwierdź, czy „{field}” rzeczywiście reprezentuje rolę „{role}”.',
    chooseField: 'Wybierz pole',
    confirm: 'Potwierdź',
    reject: 'Odrzuć',
    apply: 'Zastosuj odpowiedź',
    answerBusy: 'Stosowanie…',
    effectDecidable: 'Po weryfikacji zostanie usunięta ostatnia blokada strukturalna.',
    effectRemoves: 'Po weryfikacji zostanie usunięta jedna wymagana blokada.',
    effectCausal: 'Umożliwi to formalny test identyfikowalności przyczynowej, ale jej nie gwarantuje.',
    boundary: 'QDIP nie wnioskuje o identyfikowalności przyczynowej wyłącznie z nazw kolumn lub korelacji.',
    certificate: 'Certyfikat strukturalny',
    certificateIssued: 'wydany',
    certificateBlocked: 'zablokowany',
    planner: 'Planer pytań',
    requirements: 'Graf wymagań',
    priority: 'Wynik priorytetu',
    estimatedCost: 'Szacowany koszt pozyskania odpowiedzi',
    causalNeedsVerification: 'specyfikacja przyczynowa wymaga weryfikacji',
    causalInvalid: 'nieprawidłowa specyfikacja przyczynowa',
    causalEvidenceQuestion: 'Obecny model obserwacyjny jest niewystarczający. Zaplanuj dodatkowe dowody przyczynowe.',
    causalEdges: 'Krawędzie przyczynowe',
    causalEdgesHint: 'Jedna krawędź na wiersz: A -> B lub A <-> B',
    graphWarning:
      'Pominięte krawędzie directed lub bidirected są założeniami przyczynowymi, a nie nieznanymi relacjami. Potwierdź graf tylko, jeśli ich brak można uzasadnić.',
    treatments: 'Interwencje',
    outcomes: 'Wyniki',
    conditioning: 'Zmienne warunkujące',
    commaSeparated: 'Nazwy pól oddzielone przecinkami',
    verifyCausalAssumptions: 'Potwierdzam semantykę grafu i założenia identyfikacji dla tego modelu przyczynowego.',
    runIdentification: 'Uruchom identyfikację ID/IDC',
    causalCertificate: 'Certyfikat identyfikacji przyczynowej',
    estimand: 'Estymanda identyfikująca',
    failureWitness: 'Świadek błędu nieidentyfikowalności ID',
    proof: 'Ślad identyfikacji',
    effectEvidence:
      'ID osiągnął błąd nieidentyfikowalności; same dane obserwacyjne nie identyfikują tego efektu przy zweryfikowanym grafie.',
    evidencePlan: 'Plan pozyskania dowodów przyczynowych',
    evidenceVerify: 'Zweryfikuj brak ukrytego confoundingu',
    evidenceRandomize: 'Zbierz prospektywne dane interwencyjne',
    preferred: 'preferowane',
    empiricalSupport: 'Kontrola empirical support',
    supportPassed: 'podstawowa kontrola overlap zaliczona — pełna positivity nie jest certyfikowana',
    supportFailed: 'podstawowa kontrola overlap nie powiodła się',
    supportFull: 'wymagana pełna analiza positivity zależna od modelu',
    supportNot: 'nie oceniono',
    treatmentLevels: 'Poziomy treatment',
    checkedStrata: 'Sprawdzone strata',
    checkedObligations: 'Sprawdzone obowiązki estimandy',
    failedObligations: 'Obowiązki estimandy bez wsparcia',
    deferredObligations: 'Obowiązki wymagające pełnej analizy',
    evidenceVerifyQuestion: 'Czy niezależne dowody dziedzinowe uzasadniają brak latent confounding dla {variables}?',
    evidenceRandomizeQuestion: 'Czy możesz zebrać prospektywne dane interwencyjne dla {variables}?',
    estimabilityQuestion:
      'Efekt przyczynowy jest zidentyfikowany. Ukończ kontrolę estimability i positivity przed użyciem go w decyzji.',
    effectEstimability:
      'Nie zmienia to identyfikacji przyczynowej; sprawdza, czy zidentyfikowana estymanda ma wystarczające wsparcie w danych.',
  },
} as const

function questionText(locale: Locale, question: SufficiencyQuestion) {
  const t = copy[locale]
  if (question.kind === 'select_field') {
    if (question.id === 'select-causal-action') return t.causalActionQuestion
    if (question.role === 'action') return t.actionQuestion
    if (question.role === 'objective') return t.objectiveQuestion
    if (question.role === 'outcome') return t.outcomeQuestion
  }
  if (question.kind === 'select_objective') return t.selectObjective
  if (question.kind === 'select_available_fields') return t.availableQuestion
  if (question.kind === 'define_causal_model') return t.causalModelQuestion
  if (question.kind === 'plan_causal_evidence') {
    const variables = question.evidence_variables.join(', ')
    const targets = question.evidence_targets.length ? question.evidence_targets.join(', ') : variables
    if (question.evidence_kind === 'verify_no_latent_confounding') {
      return t.evidenceVerifyQuestion.replace('{variables}', targets)
    }
    if (question.evidence_kind === 'randomized_intervention') {
      return t.evidenceRandomizeQuestion.replace('{variables}', variables)
    }
    return t.causalEvidenceQuestion
  }
  if (question.kind === 'confirm_semantic') {
    if (question.hypothesis_id) {
      return question.rationale || question.hypothesis_id
    }
    if (question.hypothesis_ids.length) {
      return question.rationale || question.hypothesis_ids.join(', ')
    }
    return t.confirmQuestion.replace('{field}', question.field ?? '').replace('{role}', question.role ?? '')
  }
  return question.id
}

function questionEffect(locale: Locale, question: SufficiencyQuestion) {
  const t = copy[locale]
  if (question.effect === 'makes_structurally_decidable') return t.effectDecidable
  if (question.effect === 'enables_causal_identification_test') return t.effectCausal
  if (question.effect === 'requires_interventional_evidence') return t.effectEvidence
  if (question.effect === 'enables_estimability_check') return t.effectEstimability
  return t.effectRemoves
}

function causalStatusText(locale: Locale, status: IntakeAnalysis['sufficiency']['causal_identifiability']) {
  const t = copy[locale]
  if (status === 'identified') return t.causalIdentified
  if (status === 'not_identified') return t.causalNotIdentified
  if (status === 'requires_verification') return t.causalNeedsVerification
  if (status === 'invalid_model') return t.causalInvalid
  return t.causalNeedsModel
}

function supportStatusText(
  locale: Locale,
  status: NonNullable<IntakeAnalysis['sufficiency']['empirical_support']>['status']
) {
  const t = copy[locale]
  if (status === 'basic_check_passed') return t.supportPassed
  if (status === 'basic_check_failed') return t.supportFailed
  if (status === 'requires_full_analysis') return t.supportFull
  return t.supportNot
}

function evidenceActionText(
  locale: Locale,
  kind: NonNullable<IntakeAnalysis['sufficiency']['causal_evidence_plan']>['actions'][number]['kind']
) {
  return kind === 'verify_no_latent_confounding' ? copy[locale].evidenceVerify : copy[locale].evidenceRandomize
}

function splitFields(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseCausalEdges(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)\s*(<->|->)\s*(.+)$/)
      if (!match) throw new Error(`Invalid causal edge: ${line}`)
      return {
        source: match[1].trim(),
        target: match[3].trim(),
        type: match[2] === '<->' ? ('bidirected' as const) : ('directed' as const),
      }
    })
}

function verifiedRoleField(analysis: IntakeAnalysis, role: string) {
  const verified = new Set(['user_confirmed', 'data_validated', 'evidence_supported'])
  return analysis.contract.candidates.find((candidate) => candidate.role === role && verified.has(candidate.status))
    ?.field
}

type IntakeAnswerBody = IntakeAnswers

export function DecisionIntakeWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [formalizationAccepting, setFormalizationAccepting] = useState(false)
  const [compiling, setCompiling] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [compileError, setCompileError] = useState('')
  const [candidateAnswers, setCandidateAnswers] = useState<Record<string, CandidateChoice>>({})
  const [availabilityAnswers, setAvailabilityAnswers] = useState<Record<string, AvailabilityChoice>>({})
  const [semanticMappings, setSemanticMappings] = useState<SemanticMapping[]>([])
  const [mappingField, setMappingField] = useState('')
  const [mappingRole, setMappingRole] = useState<SemanticMapping['role']>('action')
  const [compiled, setCompiled] = useState<CompiledResourceAllocation | null>(null)
  const [executed, setExecuted] = useState<ExecutedDecisionIntake | null>(null)
  const [executionError, setExecutionError] = useState('')
  const [answerBusy, setAnswerBusy] = useState(false)
  const [selectedField, setSelectedField] = useState('')
  const [selectedCompilerField, setSelectedCompilerField] = useState('')
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [causalEdges, setCausalEdges] = useState('')
  const [causalTreatments, setCausalTreatments] = useState('')
  const [causalOutcomes, setCausalOutcomes] = useState('')
  const [causalConditioning, setCausalConditioning] = useState('')
  const [causalAssumptionsVerified, setCausalAssumptionsVerified] = useState(false)
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('')

  function resetVerification(nextAnalysis?: IntakeAnalysis | null) {
    setCandidateAnswers({})
    setAvailabilityAnswers({})
    setSemanticMappings([])
    setVerificationError('')
    setCompileError('')
    setCompiled(null)
    setExecuted(null)
    setExecutionError('')
    setMappingRole('action')
    setMappingField(nextAnalysis?.contract.information_set[0]?.field ?? '')
    setSelectedObjectiveId(nextAnalysis?.contract.formalization?.objectives[0]?.id ?? '')
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
    setSelectedField('')
    setSelectedCompilerField('')
    setAvailableFields([])
    setCausalEdges('')
    setCausalTreatments('')
    setCausalOutcomes('')
    setCausalConditioning('')
    setCausalAssumptionsVerified(false)
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
    setExecuted(null)

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
              sufficiency: result.sufficiency,
              interpretation: {
                ...current.interpretation,
                candidates: result.contract.candidates,
                formalization: result.contract.formalization,
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

  async function acceptSuggestedFormalization() {
    if (!analysis?.contract.formalization) return
    const formalization = analysis.contract.formalization
    const preferredArchetype = formalization.archetype_hypotheses[0]?.archetype
    if (!preferredArchetype) return
    if (formalization.objectives.length && !selectedObjectiveId) return

    setFormalizationAccepting(true)
    setVerificationError('')
    setCompileError('')
    setCompiled(null)
    setExecuted(null)

    const formalizationStatuses: Record<string, CandidateChoice> = {}
    for (const item of formalization.decision_variables) {
      if (item.status === 'inferred') formalizationStatuses[item.id] = 'user_confirmed'
    }
    for (const item of formalization.objectives) {
      if (item.id === selectedObjectiveId) {
        formalizationStatuses[item.id] = 'user_confirmed'
      }
    }
    for (const item of formalization.constraints) {
      if (item.status === 'inferred') formalizationStatuses[item.id] = 'user_confirmed'
    }

    const acceptedSemanticRoles = new Set(['community_id', 'team_id', 'capacity', 'demand', 'service'])
    const compilerStatuses: Record<string, CandidateChoice> = {}
    for (const candidate of analysis.contract.candidates) {
      if (acceptedSemanticRoles.has(candidate.role) && candidate.status === 'inferred') {
        compilerStatuses[candidate.candidate_id] = 'user_confirmed'
      }
    }

    try {
      const response = await fetch(
        `/api/decision-intake/${encodeURIComponent(analysis.contract.contract_id)}/answers`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            archetype: preferredArchetype,
            formalization_statuses: formalizationStatuses,
            candidate_statuses_by_id: compilerStatuses,
            accept_timing_suggestions: true,
          } satisfies IntakeAnswers),
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
              sufficiency: result.sufficiency,
              interpretation: {
                ...current.interpretation,
                candidates: result.contract.candidates,
                formalization: result.contract.formalization,
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
      setFormalizationAccepting(false)
    }
  }

  async function compileContract() {
    if (!analysis) return
    setCompiling(true)
    setCompileError('')
    setCompiled(null)
    setExecuted(null)
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

  async function executeContract() {
    if (!analysis) return
    setExecuting(true)
    setExecutionError('')
    setExecuted(null)
    try {
      const response = await fetch(
        `/api/decision-intake/${encodeURIComponent(analysis.contract.contract_id)}/execute`,
        { method: 'POST' }
      )
      const payload: unknown = await response.json()
      if (!response.ok) {
        setExecutionError(t.executionFailed)
        return
      }
      setExecuted(executedDecisionIntakeSchema.parse(payload))
    } catch {
      setExecutionError(t.executionFailed)
    } finally {
      setExecuting(false)
    }
  }

  const hasPendingVerification =
    Object.keys(candidateAnswers).length > 0 ||
    Object.keys(availabilityAnswers).length > 0 ||
    semanticMappings.length > 0

  async function submitAnswerPayload(body: IntakeAnswerBody) {
    if (!analysis) return false

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
              interpretation: {
                ...current.interpretation,
                candidates: updated.contract.candidates,
                formalization: updated.contract.formalization,
              },
            }
          : current
      )
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed.')
      return false
    } finally {
      setAnswerBusy(false)
    }
  }

  async function overrideDecisionVariable(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const expression = String(form.get('expression') ?? '').trim()
    if (!expression) return
    await submitAnswerPayload({
      decision_variable_overrides: {
        [id]: { expression },
      },
    })
  }

  async function overrideObjective(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const expression = String(form.get('expression') ?? '').trim()
    const sense = String(form.get('sense') ?? '').trim()
    if (!expression && !sense) return
    await submitAnswerPayload({
      objective_overrides: {
        [id]: {
          sense: sense === 'minimize' ? 'minimize' : sense === 'maximize' ? 'maximize' : undefined,
          expression: expression || undefined,
        },
      },
    })
  }

  async function overrideConstraint(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const rawValue = String(form.get('value') ?? '').trim()
    let value: string | number | boolean | undefined
    if (rawValue) {
      if (rawValue === 'true' || rawValue === 'false') value = rawValue === 'true'
      else if (!Number.isNaN(Number(rawValue))) value = Number(rawValue)
      else value = rawValue
    }
    await submitAnswerPayload({
      constraint_overrides: {
        [id]: {
          kind: String(form.get('kind') ?? 'hard') as 'hard' | 'soft' | 'ambiguous',
          operator: String(form.get('operator') ?? '').trim() || undefined,
          expression: String(form.get('expression') ?? '').trim() || undefined,
          value,
        },
      },
    })
  }

  async function overrideCandidateScope(event: FormEvent<HTMLFormElement>, candidateId: string) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const field = String(form.get('scopeField') ?? '').trim()
    const values = String(form.get('scopeValues') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    await submitAnswerPayload({
      candidate_scope_overrides: {
        [candidateId]: field && values.length ? { field, values } : null,
      },
    })
  }

  async function applyAnswer(action?: 'confirm' | 'reject') {
    const question = analysis?.sufficiency.next_question
    if (
      !analysis ||
      !question ||
      question.kind === 'define_causal_model' ||
      question.kind === 'plan_causal_evidence' ||
      question.kind === 'assess_estimability'
    )
      return

    const body: IntakeAnswerBody = {}

    if (question.kind === 'confirm_semantic' && question.hypothesis_id) {
      body.formalization_statuses = {
        [question.hypothesis_id]: action === 'reject' ? 'rejected' : 'user_confirmed',
      }
    } else if (question.kind === 'confirm_semantic' && question.hypothesis_ids.length) {
      body.formalization_statuses = Object.fromEntries(
        question.hypothesis_ids.map((id) => [id, action === 'reject' ? 'rejected' : 'user_confirmed'])
      )
    } else if (question.kind === 'confirm_semantic' && question.field && question.role) {
      const candidate = analysis.contract.candidates.find(
        (item) => item.field === question.field && item.role === question.role
      )
      if (!candidate) return
      body.candidate_statuses_by_id = {
        [candidate.candidate_id]: action === 'reject' ? 'rejected' : 'user_confirmed',
      }
    }

    if (question.kind === 'select_field' && question.role && selectedField) {
      const role = semanticRoleSchema.safeParse(question.role)
      if (!role.success) return
      body.semantic_mappings = [{ field: selectedField, role: role.data }]
    }

    if (question.kind === 'select_available_fields') {
      const selected = new Set(availableFields)
      body.information_availability = Object.fromEntries(
        question.options.map((field) => [field, selected.has(field) ? 'available' : 'not_available'])
      )
    }

    if (!Object.keys(body).length) return

    if (await submitAnswerPayload(body)) {
      setSelectedField('')
      setAvailableFields([])
    }
  }

  async function applyCompilationAnswer() {
    const question = analysis?.sufficiency.compilation_next_question
    if (!question || !selectedCompilerField) return

    let body: IntakeAnswerBody = {}
    if (question.kind === 'select_archetype') {
      const archetype = decisionArchetypeSchema.safeParse(selectedCompilerField)
      if (!archetype.success) return
      body = { archetype: archetype.data }
    } else if (question.kind === 'select_objective') {
      body = {
        formalization_statuses: {
          [selectedCompilerField]: 'user_confirmed',
        },
      }
    } else if (question.role) {
      const role = semanticRoleSchema.safeParse(question.role)
      if (!role.success) return
      body = { semantic_mappings: [{ field: selectedCompilerField, role: role.data }] }
    }

    if (!Object.keys(body).length) return

    if (await submitAnswerPayload(body)) {
      if (question.kind === 'select_objective') {
        setSelectedObjectiveId(selectedCompilerField)
      }
      setSelectedCompilerField('')
    }
  }

  async function applyCausalSpecification() {
    if (!analysis) return

    try {
      const actionField = verifiedRoleField(analysis, 'action')
      const outcomeField = verifiedRoleField(analysis, 'outcome')
      const treatments = splitFields(causalTreatments || actionField || '')
      const outcomes = splitFields(causalOutcomes || outcomeField || '')
      if (!treatments.length || !outcomes.length) {
        throw new Error('Causal query requires at least one treatment and one outcome.')
      }

      const specification: CausalSpecification = {
        graph: {
          variables: analysis.contract.information_set.map((item) => item.field),
          edges: parseCausalEdges(causalEdges),
        },
        query: {
          treatments,
          outcomes,
          conditioning: splitFields(causalConditioning),
        },
        assumptions: ['semi_markovian_admg', 'causal_markov', 'consistency', 'no_interference'],
        graph_status: 'user_confirmed',
        query_status: 'user_confirmed',
        assumptions_verified: causalAssumptionsVerified,
      }

      await submitAnswerPayload({ causal_specification: specification })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid causal specification.')
    }
  }

  const nextQuestion = analysis?.sufficiency.next_question ?? null
  const compilationNextQuestion = analysis?.sufficiency.compilation_next_question ?? null

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
                  {t.contractVersion}:{' '}
                  <b data-testid="decision-intake-contract-version" className="text-white">
                    {analysis.contract.version}
                  </b>
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
                <b>{t.gate}:</b> <span className="text-cyan-200">{t.gateStatuses[analysis.evidence_gate.status]}</span>
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

          {analysis.contract.formalization ? (
            <section
              data-testid="decision-intake-formalization"
              className="mt-6 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.035] p-6 md:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <h2 className="text-xl font-medium">{t.formalizationTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{t.formalizationBody}</p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t.completeness}</div>
                  <div className="mt-1 text-2xl font-medium text-cyan-200">
                    {Math.round(analysis.contract.formalization.completeness_score * 100)}%
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.decisionArchetype}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.contract.formalization.archetype_hypotheses.map((item, index) => (
                    <span
                      key={item.archetype}
                      className={
                        index === 0
                          ? 'rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1.5 text-xs text-cyan-100'
                          : 'rounded-md border border-white/10 bg-white/[0.025] px-2.5 py-1.5 text-xs text-slate-400'
                      }
                    >
                      {item.archetype} · {Math.round(item.score * 100)}%
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t.decisionVariable}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {analysis.contract.formalization.decision_variables.map((item) => (
                      <div key={item.id} className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                        <div className="font-mono text-sm text-cyan-100">{item.expression}</div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {item.kind} · {Math.round(item.score * 100)}% · {item.status}
                        </div>
                        <details className="mt-3 border-t border-white/10 pt-2">
                          <summary className="cursor-pointer text-[11px] text-slate-400">{t.editFormalization}</summary>
                          <form
                            className="mt-2 flex gap-2"
                            onSubmit={(event) => void overrideDecisionVariable(event, item.id)}
                          >
                            <input
                              name="expression"
                              defaultValue={item.expression}
                              aria-label={t.expression}
                              className="min-w-0 flex-1 border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
                            />
                            <button
                              type="submit"
                              disabled={answerBusy}
                              className="border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100"
                            >
                              {t.saveOverride}
                            </button>
                          </form>
                        </details>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={answerBusy}
                            onClick={() =>
                              void submitAnswerPayload({
                                formalization_statuses: { [item.id]: 'user_confirmed' },
                              })
                            }
                            className={
                              item.status === 'user_confirmed'
                                ? 'border border-emerald-300/50 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200'
                                : 'border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-slate-300'
                            }
                          >
                            {t.confirm}
                          </button>
                          <button
                            type="button"
                            disabled={answerBusy}
                            onClick={() =>
                              void submitAnswerPayload({
                                formalization_statuses: { [item.id]: 'rejected' },
                              })
                            }
                            className={
                              item.status === 'rejected'
                                ? 'border border-rose-300/50 bg-rose-300/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200'
                                : 'border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-slate-300'
                            }
                          >
                            {t.reject}
                          </button>
                        </div>
                      </div>
                    ))}
                    {!analysis.contract.formalization.decision_variables.length ? (
                      <div className="text-xs text-amber-200">{t.structuralBlocked}</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t.objectiveCandidates}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {analysis.contract.formalization.objectives.map((item) => (
                      <div key={item.id} className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="radio"
                            name="formalization-objective"
                            data-testid={`formalization-objective-${item.id}`}
                            checked={selectedObjectiveId === item.id}
                            onChange={() => setSelectedObjectiveId(item.id)}
                            disabled={formalizationAccepting}
                            className="mt-1"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm text-slate-200">
                              {item.sense} · {item.expression}
                            </span>
                            <span className="mt-1 block text-[11px] text-slate-500">
                              {Math.round(item.score * 100)}% · {item.status} ·{' '}
                              {item.supported_compilers.includes('resource_allocation.v1')
                                ? t.supportedByCompiler
                                : t.requiresDifferentCompiler}
                            </span>
                          </span>
                        </label>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[11px] text-slate-400">{t.editFormalization}</summary>
                          <form
                            className="mt-2 grid gap-2 sm:grid-cols-[auto_1fr_auto]"
                            onSubmit={(event) => void overrideObjective(event, item.id)}
                          >
                            <select
                              name="sense"
                              defaultValue={item.sense}
                              className="border border-white/10 bg-slate-900 px-2 py-1 text-[11px] text-white"
                            >
                              <option value="maximize">maximize</option>
                              <option value="minimize">minimize</option>
                            </select>
                            <input
                              name="expression"
                              defaultValue={item.expression}
                              className="border border-white/10 bg-slate-900 px-2 py-1 text-[11px] text-white"
                            />
                            <button
                              type="submit"
                              disabled={answerBusy}
                              className="border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100"
                            >
                              {t.saveOverride}
                            </button>
                          </form>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.constraintsTitle}</div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {analysis.contract.formalization.constraints.map((item) => (
                    <div key={item.id} className="rounded-md border border-white/10 bg-white/[0.025] p-3 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <span className="leading-5 text-slate-300">{item.expression}</span>
                        <span
                          className={
                            item.kind === 'hard'
                              ? 'whitespace-nowrap text-rose-200'
                              : item.kind === 'soft'
                                ? 'whitespace-nowrap text-amber-200'
                                : 'whitespace-nowrap text-slate-400'
                          }
                        >
                          {item.kind === 'hard'
                            ? t.hardConstraint
                            : item.kind === 'soft'
                              ? t.softConstraint
                              : t.ambiguousConstraint}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600">
                        {Math.round(item.score * 100)}% · {item.status}
                      </div>
                      <details className="mt-3 border-t border-white/10 pt-2">
                        <summary className="cursor-pointer text-[11px] text-slate-400">{t.editFormalization}</summary>
                        <form className="mt-2 grid gap-2" onSubmit={(event) => void overrideConstraint(event, item.id)}>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              name="kind"
                              defaultValue={item.kind}
                              className="border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
                            >
                              <option value="hard">{t.hardConstraint}</option>
                              <option value="soft">{t.softConstraint}</option>
                              <option value="ambiguous">{t.ambiguousConstraint}</option>
                            </select>
                            <input
                              name="operator"
                              defaultValue={item.operator ?? ''}
                              placeholder={t.operator}
                              className="border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <input
                            name="value"
                            defaultValue={item.value == null ? '' : String(item.value)}
                            placeholder={t.value}
                            className="border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
                          />
                          <input
                            name="expression"
                            defaultValue={item.expression}
                            placeholder={t.expression}
                            className="border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
                          />
                          <button
                            type="submit"
                            disabled={answerBusy}
                            className="w-fit border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100"
                          >
                            {t.saveOverride}
                          </button>
                        </form>
                      </details>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={answerBusy}
                          onClick={() =>
                            void submitAnswerPayload({
                              formalization_statuses: { [item.id]: 'user_confirmed' },
                            })
                          }
                          className={
                            item.status === 'user_confirmed'
                              ? 'border border-emerald-300/50 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200'
                              : 'border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-slate-300'
                          }
                        >
                          {t.confirm}
                        </button>
                        <button
                          type="button"
                          disabled={answerBusy}
                          onClick={() =>
                            void submitAnswerPayload({
                              formalization_statuses: { [item.id]: 'rejected' },
                            })
                          }
                          className={
                            item.status === 'rejected'
                              ? 'border border-rose-300/50 bg-rose-300/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200'
                              : 'border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-slate-300'
                          }
                        >
                          {t.reject}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t.compilerMappings}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {analysis.contract.candidates
                      .filter((candidate) =>
                        ['community_id', 'team_id', 'capacity', 'demand', 'service'].includes(candidate.role)
                      )
                      .map((candidate) => (
                        <div key={candidate.candidate_id} className="text-xs leading-5 text-slate-300">
                          <span className="font-mono text-cyan-100">{candidate.field}</span>
                          {' → '}
                          <span>{candidate.role}</span>
                          {candidate.scope ? (
                            <span className="text-slate-500">
                              {' '}
                              · {t.scopedTo} {candidate.scope.field} ∈ [{candidate.scope.values.join(', ')}]
                            </span>
                          ) : null}
                          <span className="text-slate-600"> · {candidate.status}</span>
                          <details className="mt-1">
                            <summary className="cursor-pointer text-[11px] text-slate-500">
                              {t.editFormalization}
                            </summary>
                            <form
                              className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                              onSubmit={(event) => void overrideCandidateScope(event, candidate.candidate_id)}
                            >
                              <input
                                name="scopeField"
                                defaultValue={candidate.scope?.field ?? ''}
                                placeholder={t.scopeField}
                                className="border border-white/10 bg-slate-900 px-2 py-1 text-[11px] text-white"
                              />
                              <input
                                name="scopeValues"
                                defaultValue={candidate.scope?.values.join(', ') ?? ''}
                                placeholder={t.scopeValues}
                                className="border border-white/10 bg-slate-900 px-2 py-1 text-[11px] text-white"
                              />
                              <button
                                type="submit"
                                disabled={answerBusy}
                                className="border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100"
                              >
                                {t.saveOverride}
                              </button>
                            </form>
                          </details>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t.timingSuggestions}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {(['pre_decision', 'post_decision', 'ambiguous'] as const).map((timing) => {
                      const count =
                        analysis.contract.formalization?.timing.filter((item) => item.timing === timing).length ?? 0
                      return (
                        <span
                          key={timing}
                          className="rounded-md border border-white/10 bg-white/[0.025] px-2.5 py-1.5 text-slate-300"
                        >
                          {timing}: <b className="text-white">{count}</b>
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="decision-intake-accept-formalization"
                  disabled={
                    formalizationAccepting ||
                    (analysis.contract.formalization.objectives.length > 0 && !selectedObjectiveId)
                  }
                  onClick={() => void acceptSuggestedFormalization()}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {formalizationAccepting ? t.acceptingFormalization : t.acceptFormalization}
                </button>
                <span className="text-xs leading-5 text-slate-500">{analysis.contract.formalization.claim}</span>
              </div>
            </section>
          ) : null}

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
                      (!pending &&
                        ['user_confirmed', 'data_validated', 'evidence_supported'].includes(candidate.status))
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
                              current.filter((item) => !(item.field === mapping.field && item.role === mapping.role))
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
              {analysis.sufficiency.compilation_status === 'ready' &&
              analysis.contract.archetype === 'constrained_resource_allocation' ? (
                <>
                  <button
                    type="button"
                    data-testid="decision-intake-compile"
                    disabled={compiling}
                    onClick={compileContract}
                    className="inline-flex items-center gap-2 border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 disabled:opacity-40"
                  >
                    <Wrench className="h-4 w-4" /> {compiling ? t.compiling : t.compile}
                  </button>
                  <button
                    type="button"
                    data-testid="decision-intake-execute"
                    disabled={executing}
                    onClick={executeContract}
                    className="inline-flex items-center gap-2 bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"
                  >
                    <Wrench className="h-4 w-4" /> {executing ? t.executing : t.execute}
                  </button>
                </>
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
            {executionError ? (
              <p role="alert" className="mt-3 text-sm text-rose-300">
                {executionError}
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
            {executed ? (
              <div data-testid="decision-intake-executed" className="mt-6 border-t border-white/10 pt-5">
                <h3 className="text-sm font-semibold text-emerald-200">{t.executedTitle}</h3>
                <pre className="mt-3 max-h-96 overflow-auto bg-black/30 p-4 text-xs text-slate-300">
                  {JSON.stringify(executed.result, null, 2)}
                </pre>
              </div>
            ) : null}
          </section>

          <section className="mt-6">
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
                  <dt className="text-slate-400">{t.compilation}</dt>
                  <dd className="text-right text-cyan-200">
                    {analysis.sufficiency.compilation_status === 'ready'
                      ? t.compilationReady
                      : analysis.sufficiency.compilation_status === 'unsupported'
                        ? t.compilationUnsupported
                        : t.compilationBlocked}
                  </dd>
                </div>
                {analysis.sufficiency.compilation_validation_error ? (
                  <div className="border-t border-white/10 pt-3">
                    <dt className="text-slate-400">{t.preflightError}</dt>
                    <dd className="mt-1 text-xs leading-5 text-rose-200">
                      {analysis.sufficiency.compilation_validation_error}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                  <dt className="text-slate-400">{t.causal}</dt>
                  <dd className="text-right text-cyan-200">
                    {causalStatusText(locale, analysis.sufficiency.causal_identifiability)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                  <dt className="text-slate-400">{t.certificate}</dt>
                  <dd className="text-right text-cyan-200">
                    {analysis.sufficiency.certificate.issued ? t.certificateIssued : t.certificateBlocked}
                    <span className="ml-2 text-xs text-slate-500">{analysis.sufficiency.certificate.scope}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                  <dt className="text-slate-400">{t.planner}</dt>
                  <dd className="text-right text-xs text-slate-500">{analysis.sufficiency.planner_strategy}</dd>
                </div>
              </dl>

              {compilationNextQuestion ? (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <b className="text-sm">{t.compilerNextStep}</b>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {compilationNextQuestion.kind === 'select_archetype' ? t.decisionArchetype : t.compilerMapping}
                    {compilationNextQuestion.role ? (
                      <>
                        : <span className="font-mono text-cyan-200">{compilationNextQuestion.role}</span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-600">{compilationNextQuestion.rationale}</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <select
                      value={selectedCompilerField}
                      onChange={(event) => setSelectedCompilerField(event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 p-2.5 text-sm"
                    >
                      <option value="">
                        {compilationNextQuestion.kind === 'select_objective' ? t.selectObjective : t.chooseField}
                      </option>
                      {compilationNextQuestion.options.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedCompilerField || answerBusy}
                      onClick={() => void applyCompilationAnswer()}
                      className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {answerBusy ? t.answerBusy : t.apply}
                    </button>
                  </div>
                </div>
              ) : null}

              <details className="mt-5 border-t border-white/10 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-white">{t.requirements}</summary>
                <div className="mt-3 grid gap-2">
                  {analysis.sufficiency.requirements.map((requirement) => (
                    <div
                      key={requirement.id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-slate-900/40 p-3 text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-200">{requirement.id}</div>
                        {requirement.depends_on.length ? (
                          <div className="mt-1 text-slate-600">depends on: {requirement.depends_on.join(', ')}</div>
                        ) : null}
                      </div>
                      <span className="whitespace-nowrap text-cyan-200">{requirement.state}</span>
                    </div>
                  ))}
                </div>
              </details>

              {nextQuestion ? (
                <div className="mt-6 border-t border-white/10 pt-4">
                  <b className="text-sm">{t.nextQuestion}</b>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{questionText(locale, nextQuestion)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{questionEffect(locale, nextQuestion)}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-600">
                    {t.priority}: {nextQuestion.priority_score.toFixed(2)} · {t.estimatedCost}:{' '}
                    {nextQuestion.estimated_cost}
                  </p>

                  {nextQuestion.kind === 'select_field' ? (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <select
                        value={selectedField}
                        onChange={(event) => setSelectedField(event.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 p-2.5 text-sm"
                      >
                        <option value="">{t.chooseField}</option>
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
                    <div className="mt-4 grid gap-3">
                      <p className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100">
                        {t.boundary}
                      </p>
                      <label className="grid gap-2 text-xs text-slate-400">
                        <span className="font-medium text-slate-200">{t.causalEdges}</span>
                        <textarea
                          rows={6}
                          value={causalEdges}
                          onChange={(event) => setCausalEdges(event.target.value)}
                          placeholder={t.causalEdgesHint}
                          className="rounded-lg border border-white/10 bg-slate-900 p-3 font-mono text-xs text-white"
                        />
                        <p className="text-[11px] leading-5 text-amber-200/80">{t.graphWarning}</p>
                      </label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="grid gap-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-200">{t.treatments}</span>
                          <input
                            value={causalTreatments}
                            onChange={(event) => setCausalTreatments(event.target.value)}
                            placeholder={verifiedRoleField(analysis, 'action') ?? t.commaSeparated}
                            className="rounded-lg border border-white/10 bg-slate-900 p-2.5 text-white"
                          />
                        </label>
                        <label className="grid gap-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-200">{t.outcomes}</span>
                          <input
                            value={causalOutcomes}
                            onChange={(event) => setCausalOutcomes(event.target.value)}
                            placeholder={verifiedRoleField(analysis, 'outcome') ?? t.commaSeparated}
                            className="rounded-lg border border-white/10 bg-slate-900 p-2.5 text-white"
                          />
                        </label>
                        <label className="grid gap-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-200">{t.conditioning}</span>
                          <input
                            value={causalConditioning}
                            onChange={(event) => setCausalConditioning(event.target.value)}
                            placeholder={t.commaSeparated}
                            className="rounded-lg border border-white/10 bg-slate-900 p-2.5 text-white"
                          />
                        </label>
                      </div>
                      <label className="flex items-start gap-2 text-xs leading-5 text-slate-300">
                        <input
                          type="checkbox"
                          checked={causalAssumptionsVerified}
                          onChange={(event) => setCausalAssumptionsVerified(event.target.checked)}
                          className="mt-1"
                        />
                        <span>{t.verifyCausalAssumptions}</span>
                      </label>
                      <button
                        type="button"
                        disabled={!causalAssumptionsVerified || answerBusy}
                        onClick={() => void applyCausalSpecification()}
                        className="w-fit rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                      >
                        {answerBusy ? t.answerBusy : t.runIdentification}
                      </button>
                    </div>
                  ) : null}

                  {nextQuestion.kind === 'plan_causal_evidence' ? (
                    <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100">
                      {t.effectEvidence}
                      {analysis.sufficiency.causal_certificate?.failure_witness ? (
                        <div className="mt-2 font-mono text-[11px] text-amber-50">
                          outer C-component = [
                          {analysis.sufficiency.causal_certificate.failure_witness.outer_component_nodes.join(', ')}],
                          inner C-component = [
                          {analysis.sufficiency.causal_certificate.failure_witness.inner_component_nodes.join(', ')}]
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {nextQuestion.kind === 'assess_estimability' ? (
                    <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-3 text-xs leading-5 text-cyan-50">
                      <div>{nextQuestion.rationale}</div>
                      {nextQuestion.evidence_variables.length ? (
                        <div className="mt-2 font-mono text-[11px] text-cyan-100/70">
                          {nextQuestion.evidence_variables.join(', ')}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {analysis.sufficiency.causal_certificate ? (
                <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <b className="text-sm">{t.causalCertificate}</b>
                    <span className="text-xs text-cyan-200">
                      {analysis.sufficiency.causal_certificate.method} ·{' '}
                      {analysis.sufficiency.causal_certificate.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {analysis.sufficiency.causal_certificate.claim}
                  </p>
                  {analysis.sufficiency.causal_certificate.estimand ? (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-slate-300">{t.estimand}</div>
                      <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-cyan-100">
                        {analysis.sufficiency.causal_certificate.estimand}
                      </pre>
                    </div>
                  ) : null}
                  {analysis.sufficiency.causal_certificate.failure_witness ? (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-slate-300">{t.failureWitness}</div>
                      <div className="mt-1 font-mono text-[11px] text-amber-200">
                        outer C-component = [
                        {analysis.sufficiency.causal_certificate.failure_witness.outer_component_nodes.join(', ')}],
                        inner C-component = [
                        {analysis.sufficiency.causal_certificate.failure_witness.inner_component_nodes.join(', ')}]
                      </div>
                    </div>
                  ) : null}
                  {analysis.sufficiency.causal_certificate.proof_steps.length ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-slate-300">{t.proof}</summary>
                      <ol className="mt-2 grid gap-1 pl-4 text-[11px] leading-5 text-slate-500">
                        {analysis.sufficiency.causal_certificate.proof_steps.map((step, index) => (
                          <li key={`${index}:${step}`}>{step}</li>
                        ))}
                      </ol>
                    </details>
                  ) : null}
                </div>
              ) : null}

              {analysis.sufficiency.causal_evidence_plan ? (
                <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
                  <b className="text-sm text-amber-100">{t.evidencePlan}</b>
                  <div className="mt-3 grid gap-2">
                    {analysis.sufficiency.causal_evidence_plan.actions.map((action) => (
                      <div
                        key={action.id}
                        className="rounded-lg border border-amber-200/10 bg-slate-950/40 p-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-amber-50">{evidenceActionText(locale, action.kind)}</span>
                          {analysis.sufficiency.causal_evidence_plan?.preferred_action_id === action.id ? (
                            <span className="text-[10px] uppercase tracking-wide text-cyan-200">{t.preferred}</span>
                          ) : null}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">
                          {action.variables.join(', ')} · {t.estimatedCost}: {action.estimated_cost}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {analysis.sufficiency.empirical_support ? (
                <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <b className="text-sm">{t.empiricalSupport}</b>
                    <span className="text-xs text-cyan-200">{analysis.sufficiency.empirical_support.status}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {supportStatusText(locale, analysis.sufficiency.empirical_support.status)}
                  </p>
                  <div className="mt-2 text-[11px] text-slate-500">
                    {t.treatmentLevels}:{' '}
                    {Object.entries(analysis.sufficiency.empirical_support.treatment_levels)
                      .map(([field, count]) => `${field}=${count}`)
                      .join(', ') || '—'}
                    {' · '}
                    {t.checkedStrata}: {analysis.sufficiency.empirical_support.checked_strata}
                  </div>
                  {analysis.sufficiency.empirical_support.checked_obligations.length ? (
                    <div className="mt-2 text-[11px] leading-5 text-emerald-200/80">
                      {t.checkedObligations}: {analysis.sufficiency.empirical_support.checked_obligations.join(', ')}
                    </div>
                  ) : null}
                  {analysis.sufficiency.empirical_support.failed_obligations.length ? (
                    <div className="mt-2 text-[11px] leading-5 text-rose-200/80">
                      {t.failedObligations}: {analysis.sufficiency.empirical_support.failed_obligations.join(', ')}
                    </div>
                  ) : null}
                  {analysis.sufficiency.empirical_support.deferred_obligations.length ? (
                    <div className="mt-2 text-[11px] leading-5 text-amber-200/80">
                      {t.deferredObligations}: {analysis.sufficiency.empirical_support.deferred_obligations.join(', ')}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 border-t border-white/10 pt-4 text-sm">
                <b>{t.gate}:</b> <span className="text-cyan-200">{analysis.evidence_gate.status}</span>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </main>
  )
}
