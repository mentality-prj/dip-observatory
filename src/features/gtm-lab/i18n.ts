import type { Locale } from '@/lib/observatory-i18n'
import type { EvidenceKind, GtmDecision, PortfolioModel } from './portfolio-model'

type EvidenceDisplayKind = EvidenceKind | 'SOURCED'

export type GtmLabCopy = {
  subtitle: string
  run: string
  running: string
  demo: string
  imported: string
  portfolio: string
  portfolioSummary: string
  search: string
  all: string
  decision: string
  why: string
  risks: string
  evidence: string
  unknown: string
  research: string
  next: string
  fit: string
  opportunity: string
  uncertainty: string
  quality: string
  confidence: string
  freshness: string
  details: string
  recommendation: string
  empty: string
  industry: string
  unavailable: string
  records: string
  rationale: string
  target: string
  source: string
  runDataset: string
  status: string
  decisionId: string
  plugin: string
  model: string
  trace: string
  evaluationFailed: string
  failedRecords: (count: number) => string
  decisions: Record<GtmDecision, string>
  evidenceKinds: Record<EvidenceDisplayKind, string>
  levels: Record<'HIGH' | 'MEDIUM' | 'LOW', string>
  sources: Record<PortfolioModel['source'], string>
  import: {
    tag: string
    title: string
    description: string
    upload: string
    validationErrors: string
    evaluating: string
    emptyCsv: string
    tooManyRows: string
    validationFailed: string
    importFailed: string
    evaluationFailed: string
    invalidValue: string
    requiredField: string
    validated: (count: number) => string
    invalidRows: (count: number) => string
    runFor: (count: number) => string
    completed: (evaluated: number, total: number, failed: number) => string
    issue: (row: number, field: string | null | undefined, message: string) => string
  }
}

function issueLabel(
  rowLabel: string,
  requiredField: string,
  invalidValue: string,
  row: number,
  field: string | null | undefined,
  message: string
) {
  const reason = message.toLowerCase().includes('required') ? requiredField : invalidValue
  return `${rowLabel} ${row}${field ? ` · ${field}` : ''}: ${reason}`
}

export const gtmLabI18n = {
  en: {
    subtitle: 'Decide where to spend commercial effort from evidence, opportunity and uncertainty.',
    run: 'Run evaluation',
    running: 'Evaluating companies…',
    demo: 'DEMO DATA',
    imported: 'IMPORTED DATA',
    portfolio: 'Portfolio',
    portfolioSummary: 'Portfolio summary',
    search: 'Search companies',
    all: 'All',
    decision: 'Decision',
    why: 'Why this decision',
    risks: 'Risks',
    evidence: 'Evidence',
    unknown: 'Missing information',
    research: 'Research objectives',
    next: 'Next action',
    fit: 'QDIP fit',
    opportunity: 'Opportunity',
    uncertainty: 'Uncertainty',
    quality: 'Evidence strength',
    confidence: 'Confidence',
    freshness: 'Freshness',
    details: 'Decision details',
    recommendation: 'Recommendation',
    empty: 'Run the bundled deterministic dataset or upload a CSV to open the decision portfolio.',
    industry: 'Industry',
    unavailable: 'Not provided by backend',
    records: 'companies evaluated',
    rationale: 'Rationale',
    target: 'Target',
    source: 'Source',
    runDataset: 'Run / dataset',
    status: 'Status',
    decisionId: 'Decision ID',
    plugin: 'Plugin',
    model: 'Model',
    trace: 'Trace',
    evaluationFailed: 'The GTM evaluation could not be completed.',
    failedRecords: (count) => `${count} records require correction; successful evaluations are preserved.`,
    decisions: { PURSUE: 'Pursue', RESEARCH: 'Research', WATCH: 'Watch', SKIP: 'Skip' },
    evidenceKinds: { FACT: 'Fact', SIGNAL: 'Signal', HYPOTHESIS: 'Hypothesis', UNKNOWN: 'Unknown', SOURCED: 'Sourced' },
    levels: { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' },
    sources: { DEMO: 'Demo data', IMPORTED: 'Imported data' },
    import: {
      tag: 'IMPORTED DATA',
      title: 'Evaluate your prospect portfolio',
      description: 'Upload up to 10 companies as CSV. QDIP validates the data and evaluates it without saving it or using external research.',
      upload: 'Upload CSV',
      validationErrors: 'Validation errors',
      evaluating: 'Evaluating…',
      emptyCsv: 'CSV must contain a header and at least one company.',
      tooManyRows: 'Public evaluation supports at most 10 companies per run.',
      validationFailed: 'The CSV could not be validated.',
      importFailed: 'The CSV could not be imported.',
      evaluationFailed: 'The companies could not be evaluated.',
      invalidValue: 'Invalid value',
      requiredField: 'Required field',
      validated: (count) => `${count} companies validated. Ready to evaluate.`,
      invalidRows: (count) => `${count} rows require correction.`,
      runFor: (count) => `Run evaluation (${count})`,
      completed: (evaluated, total, failed) =>
        `${evaluated}/${total} companies evaluated${failed ? ` · ${failed} require correction` : ''}.`,
      issue: (row, field, message) => issueLabel('Row', 'Required field', 'Invalid value', row, field, message),
    },
  },
  uk: {
    subtitle: 'Визначайте, куди спрямувати комерційні зусилля, на основі доказів, можливості та невизначеності.',
    run: 'Запустити оцінювання',
    running: 'Оцінювання компаній…',
    demo: 'ДЕМО-ДАНІ',
    imported: 'ІМПОРТОВАНІ ДАНІ',
    portfolio: 'Портфель',
    portfolioSummary: 'Підсумок портфеля',
    search: 'Пошук компаній',
    all: 'Усі',
    decision: 'Рішення',
    why: 'Чому це рішення',
    risks: 'Ризики',
    evidence: 'Докази',
    unknown: 'Відсутня інформація',
    research: 'Цілі дослідження',
    next: 'Наступна дія',
    fit: 'Відповідність QDIP',
    opportunity: 'Можливість',
    uncertainty: 'Невизначеність',
    quality: 'Сила доказів',
    confidence: 'Впевненість',
    freshness: 'Актуальність',
    details: 'Деталі рішення',
    recommendation: 'Рекомендація',
    empty: 'Запустіть демо-набір або завантажте CSV, щоб відкрити портфель рішень.',
    industry: 'Галузь',
    unavailable: 'Backend не надає даних',
    records: 'компаній оцінено',
    rationale: 'Обґрунтування',
    target: 'Цільова роль',
    source: 'Джерело',
    runDataset: 'Запуск / набір даних',
    status: 'Статус',
    decisionId: 'ID рішення',
    plugin: 'Плагін',
    model: 'Модель',
    trace: 'Трасування',
    evaluationFailed: 'Не вдалося виконати оцінювання GTM.',
    failedRecords: (count) => `${count} записів потребують виправлення; успішні оцінювання збережено в результаті.`,
    decisions: { PURSUE: 'Опрацювати', RESEARCH: 'Дослідити', WATCH: 'Спостерігати', SKIP: 'Пропустити' },
    evidenceKinds: { FACT: 'Факт', SIGNAL: 'Сигнал', HYPOTHESIS: 'Гіпотеза', UNKNOWN: 'Невідомо', SOURCED: 'З джерелом' },
    levels: { HIGH: 'Висока', MEDIUM: 'Середня', LOW: 'Низька' },
    sources: { DEMO: 'Демо-дані', IMPORTED: 'Імпортовані дані' },
    import: {
      tag: 'ІМПОРТОВАНІ ДАНІ',
      title: 'Оцініть портфель потенційних клієнтів',
      description: 'Завантажте до 10 компаній у CSV. QDIP перевірить дані та оцінить їх без збереження і без зовнішнього дослідження.',
      upload: 'Завантажити CSV',
      validationErrors: 'Помилки перевірки',
      evaluating: 'Оцінювання…',
      emptyCsv: 'CSV має містити заголовок і щонайменше одну компанію.',
      tooManyRows: 'Публічне оцінювання підтримує не більше 10 компаній за один запуск.',
      validationFailed: 'Не вдалося перевірити CSV.',
      importFailed: 'Не вдалося імпортувати CSV.',
      evaluationFailed: 'Не вдалося оцінити компанії.',
      invalidValue: 'Некоректне значення',
      requiredField: 'Обов’язкове поле',
      validated: (count) => `${count} компаній перевірено. Можна запускати оцінювання.`,
      invalidRows: (count) => `${count} рядків потребують виправлення.`,
      runFor: (count) => `Запустити оцінювання (${count})`,
      completed: (evaluated, total, failed) =>
        `${evaluated}/${total} компаній оцінено${failed ? ` · ${failed} потребують виправлення` : ''}.`,
      issue: (row, field, message) => issueLabel('Рядок', 'Обов’язкове поле', 'Некоректне значення', row, field, message),
    },
  },
  pl: {
    subtitle: 'Decyduj, gdzie skierować wysiłek komercyjny na podstawie dowodów, możliwości i niepewności.',
    run: 'Uruchom ocenę',
    running: 'Ocena firm…',
    demo: 'DANE DEMO',
    imported: 'DANE IMPORTOWANE',
    portfolio: 'Portfel',
    portfolioSummary: 'Podsumowanie portfela',
    search: 'Szukaj firm',
    all: 'Wszystkie',
    decision: 'Decyzja',
    why: 'Dlaczego ta decyzja',
    risks: 'Ryzyka',
    evidence: 'Dowody',
    unknown: 'Brakujące informacje',
    research: 'Cele badawcze',
    next: 'Następny krok',
    fit: 'Dopasowanie QDIP',
    opportunity: 'Możliwość',
    uncertainty: 'Niepewność',
    quality: 'Siła dowodów',
    confidence: 'Pewność',
    freshness: 'Aktualność',
    details: 'Szczegóły decyzji',
    recommendation: 'Rekomendacja',
    empty: 'Uruchom dane demo lub prześlij CSV, aby otworzyć portfel decyzji.',
    industry: 'Branża',
    unavailable: 'Backend nie dostarcza danych',
    records: 'ocenionych firm',
    rationale: 'Uzasadnienie',
    target: 'Rola docelowa',
    source: 'Źródło',
    runDataset: 'Uruchomienie / zestaw danych',
    status: 'Status',
    decisionId: 'ID decyzji',
    plugin: 'Wtyczka',
    model: 'Model',
    trace: 'Ślad',
    evaluationFailed: 'Nie udało się wykonać oceny GTM.',
    failedRecords: (count) => `${count} rekordów wymaga poprawy; poprawne wyniki pozostają dostępne.`,
    decisions: { PURSUE: 'Działać', RESEARCH: 'Zbadać', WATCH: 'Obserwować', SKIP: 'Pominąć' },
    evidenceKinds: { FACT: 'Fakt', SIGNAL: 'Sygnał', HYPOTHESIS: 'Hipoteza', UNKNOWN: 'Nieznane', SOURCED: 'Ze źródłem' },
    levels: { HIGH: 'Wysoka', MEDIUM: 'Średnia', LOW: 'Niska' },
    sources: { DEMO: 'Dane demo', IMPORTED: 'Dane importowane' },
    import: {
      tag: 'DANE IMPORTOWANE',
      title: 'Oceń portfel potencjalnych klientów',
      description: 'Prześlij do 10 firm w pliku CSV. QDIP zweryfikuje dane i oceni je bez zapisywania oraz bez zewnętrznego researchu.',
      upload: 'Prześlij CSV',
      validationErrors: 'Błędy walidacji',
      evaluating: 'Ocenianie…',
      emptyCsv: 'CSV musi zawierać nagłówek i co najmniej jedną firmę.',
      tooManyRows: 'Publiczna ocena obsługuje maksymalnie 10 firm na jedno uruchomienie.',
      validationFailed: 'Nie udało się zweryfikować CSV.',
      importFailed: 'Nie udało się zaimportować CSV.',
      evaluationFailed: 'Nie udało się ocenić firm.',
      invalidValue: 'Nieprawidłowa wartość',
      requiredField: 'Pole wymagane',
      validated: (count) => `${count} firm zweryfikowano. Można uruchomić ocenę.`,
      invalidRows: (count) => `${count} wierszy wymaga poprawy.`,
      runFor: (count) => `Uruchom ocenę (${count})`,
      completed: (evaluated, total, failed) =>
        `${evaluated}/${total} firm oceniono${failed ? ` · ${failed} wymaga poprawy` : ''}.`,
      issue: (row, field, message) => issueLabel('Wiersz', 'Pole wymagane', 'Nieprawidłowa wartość', row, field, message),
    },
  },
} satisfies Record<Locale, GtmLabCopy>
