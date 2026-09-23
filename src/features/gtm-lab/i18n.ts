import type { Locale } from '@/lib/observatory-i18n'
import type { EvidenceKind, GtmDecision, PortfolioModel } from './portfolio-model'

type EvidenceDisplayKind = EvidenceKind | 'SOURCED'

type OnboardingCopy = {
  eyebrow: string
  title: string
  description: string
  stepContext: string
  stepCompanies: string
  stepDecision: string
  offering: string
  offeringPlaceholder: string
  problems: string
  problemsPlaceholder: string
  industries: string
  industriesPlaceholder: string
  sizes: string
  sizesPlaceholder: string
  geographies: string
  geographiesPlaceholder: string
  roles: string
  rolesPlaceholder: string
  continue: string
  contextRequired: string
  howTitle: string
  howDescription: string
  metricOpportunity: string
  metricOpportunityDescription: string
  metricUncertainty: string
  metricUncertaintyDescription: string
  metricEvidence: string
  metricEvidenceDescription: string
  metricConfidence: string
  metricConfidenceDescription: string
  metricFit: string
  metricFitDescription: string
  demoTitle: string
  demoDescription: string
  demoAction: string
  csvTitle: string
  csvDescription: string
  downloadTemplate: string
  templateColumns: string
}

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
  onboarding: OnboardingCopy
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
    subtitle: 'Decide which prospects deserve commercial attention, why, and what to do next.',
    run: 'View example evaluation',
    running: 'Loading example…',
    demo: 'DEMO DATA', imported: 'IMPORTED DATA', portfolio: 'Portfolio', portfolioSummary: 'Portfolio summary',
    search: 'Search companies', all: 'All', decision: 'Decision', why: 'Why this decision', risks: 'Risks', evidence: 'Evidence',
    unknown: 'Missing information', research: 'Research objectives', next: 'Next action', fit: 'QDIP fit', opportunity: 'Opportunity',
    uncertainty: 'Uncertainty', quality: 'Evidence strength', confidence: 'Confidence', freshness: 'Freshness', details: 'Decision details',
    recommendation: 'Recommendation', empty: 'Define your commercial context, then upload prospects or view the example evaluation.', industry: 'Industry',
    unavailable: 'Not provided by backend', records: 'companies evaluated', rationale: 'Rationale', target: 'Target', source: 'Source',
    runDataset: 'Run / dataset', status: 'Status', decisionId: 'Decision ID', plugin: 'Plugin', model: 'Model', trace: 'Trace',
    evaluationFailed: 'The GTM evaluation could not be completed.', failedRecords: (count) => `${count} records require correction; successful evaluations are preserved.`,
    decisions: { PURSUE: 'Pursue', RESEARCH: 'Research', WATCH: 'Watch', SKIP: 'Skip' },
    evidenceKinds: { FACT: 'Fact', SIGNAL: 'Signal', HYPOTHESIS: 'Hypothesis', UNKNOWN: 'Unknown', SOURCED: 'Sourced' },
    levels: { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }, sources: { DEMO: 'Demo data', IMPORTED: 'Imported data' },
    onboarding: {
      eyebrow: 'START HERE', title: 'Tell GTM Lab what you sell',
      description: 'QDIP needs your commercial context before it can judge whether a company is relevant to you. This context is sent to the decision engine; the browser does not calculate prospect scores.',
      stepContext: '1 · Your offer', stepCompanies: '2 · Prospect data', stepDecision: '3 · Decision portfolio',
      offering: 'What do you sell?', offeringPlaceholder: 'e.g. Decision support software for operational resource allocation',
      problems: 'What problems do you solve?', problemsPlaceholder: 'e.g. manual capacity allocation, staff scheduling, planning under constraints',
      industries: 'Target industries', industriesPlaceholder: 'e.g. logistics, manufacturing', sizes: 'Target company size', sizesPlaceholder: 'e.g. 50–500 employees',
      geographies: 'Target geography', geographiesPlaceholder: 'e.g. Poland, EU', roles: 'Typical buyer / decision-maker', rolesPlaceholder: 'e.g. Head of Operations, COO',
      continue: 'Use this commercial context', contextRequired: 'Describe your offer and at least one problem it solves before evaluating prospects.',
      howTitle: 'How QDIP evaluates prospects', howDescription: 'The backend combines your declared commercial context with evidence supplied for each company. Missing information increases uncertainty instead of being invented.',
      metricOpportunity: 'Opportunity', metricOpportunityDescription: 'How strongly the available evidence supports a meaningful decision problem.',
      metricUncertainty: 'Uncertainty', metricUncertaintyDescription: 'How much important information is still unresolved.', metricEvidence: 'Evidence strength', metricEvidenceDescription: 'Quality and relevance of the evidence behind the decision.',
      metricConfidence: 'Confidence', metricConfidenceDescription: 'Confidence after accounting for uncertainty and evidence quality.', metricFit: 'Fit', metricFitDescription: 'How well the identified problem matches the declared offer / available capability.',
      demoTitle: 'See the product before using your data', demoDescription: 'Open a deterministic example portfolio to understand CONTACT / RESEARCH / WATCH / SKIP, evidence, uncertainty and next actions.', demoAction: 'View example evaluation',
      csvTitle: 'Bring your prospects', csvDescription: 'CSV contains facts you already know about candidate companies. Only name is required; richer descriptions produce more grounded evaluations.', downloadTemplate: 'Download CSV template',
      templateColumns: 'Columns: name, domain, country, industry, employee_count, revenue_eur, description. Required: name.',
    },
    import: { tag: 'PROSPECT DATA', title: 'Upload prospect companies', description: 'Upload up to 10 companies as CSV. QDIP validates the data and evaluates it against the commercial context above without saving it or using external research.', upload: 'Upload CSV', validationErrors: 'Validation errors', evaluating: 'Evaluating…', emptyCsv: 'CSV must contain a header and at least one company.', tooManyRows: 'Public evaluation supports at most 10 companies per run.', validationFailed: 'The CSV could not be validated.', importFailed: 'The CSV could not be imported.', evaluationFailed: 'The companies could not be evaluated.', invalidValue: 'Invalid value', requiredField: 'Required field', validated: (count) => `${count} companies validated. Ready to evaluate.`, invalidRows: (count) => `${count} rows require correction.`, runFor: (count) => `Evaluate ${count} companies`, completed: (evaluated, total, failed) => `${evaluated}/${total} companies evaluated${failed ? ` · ${failed} require correction` : ''}.`, issue: (row, field, message) => issueLabel('Row', 'Required field', 'Invalid value', row, field, message) },
  },
  uk: {
    subtitle: 'Визначайте, які потенційні клієнти заслуговують комерційної уваги, чому і що робити далі.',
    run: 'Переглянути приклад оцінювання', running: 'Завантаження прикладу…', demo: 'ДЕМО-ДАНІ', imported: 'ІМПОРТОВАНІ ДАНІ', portfolio: 'Портфель', portfolioSummary: 'Підсумок портфеля', search: 'Пошук компаній', all: 'Усі', decision: 'Рішення', why: 'Чому це рішення', risks: 'Ризики', evidence: 'Докази', unknown: 'Відсутня інформація', research: 'Цілі дослідження', next: 'Наступна дія', fit: 'Відповідність', opportunity: 'Можливість', uncertainty: 'Невизначеність', quality: 'Сила доказів', confidence: 'Впевненість', freshness: 'Актуальність', details: 'Деталі рішення', recommendation: 'Рекомендація', empty: 'Опишіть свій комерційний контекст, потім імпортуйте потенційних клієнтів або перегляньте приклад.', industry: 'Галузь', unavailable: 'Backend не надає даних', records: 'компаній оцінено', rationale: 'Обґрунтування', target: 'Цільова роль', source: 'Джерело', runDataset: 'Запуск / набір даних', status: 'Статус', decisionId: 'ID рішення', plugin: 'Плагін', model: 'Модель', trace: 'Трасування', evaluationFailed: 'Не вдалося виконати оцінювання GTM.', failedRecords: (count) => `${count} записів потребують виправлення; успішні оцінювання збережено в результаті.`,
    decisions: { PURSUE: 'Контактувати', RESEARCH: 'Дослідити', WATCH: 'Спостерігати', SKIP: 'Пропустити' }, evidenceKinds: { FACT: 'Факт', SIGNAL: 'Сигнал', HYPOTHESIS: 'Гіпотеза', UNKNOWN: 'Невідомо', SOURCED: 'З джерелом' }, levels: { HIGH: 'Висока', MEDIUM: 'Середня', LOW: 'Низька' }, sources: { DEMO: 'Демо-дані', IMPORTED: 'Імпортовані дані' },
    onboarding: {
      eyebrow: 'ПОЧНІТЬ ЗВІДСИ', title: 'Розкажіть GTM Lab, що ви продаєте', description: 'QDIP потрібен ваш комерційний контекст, щоб визначати релевантність компаній саме для вас. Контекст передається рушію рішень; браузер не розраховує скоринг.',
      stepContext: '1 · Ваша пропозиція', stepCompanies: '2 · Дані про компанії', stepDecision: '3 · Портфель рішень', offering: 'Що ви продаєте?', offeringPlaceholder: 'напр. ПЗ для підтримки рішень щодо розподілу операційних ресурсів', problems: 'Які проблеми ви вирішуєте?', problemsPlaceholder: 'напр. ручний розподіл потужностей, планування персоналу, планування з обмеженнями', industries: 'Цільові галузі', industriesPlaceholder: 'напр. логістика, виробництво', sizes: 'Розмір цільової компанії', sizesPlaceholder: 'напр. 50–500 працівників', geographies: 'Цільова географія', geographiesPlaceholder: 'напр. Польща, ЄС', roles: 'Типовий покупець / особа, що приймає рішення', rolesPlaceholder: 'напр. Head of Operations, COO', continue: 'Використати цей контекст', contextRequired: 'Опишіть вашу пропозицію та щонайменше одну проблему, яку вона вирішує.',
      howTitle: 'Як QDIP оцінює потенційних клієнтів', howDescription: 'Backend поєднує заданий вами комерційний контекст із доказами про кожну компанію. Відсутні дані підвищують невизначеність, а не вигадуються.', metricOpportunity: 'Можливість', metricOpportunityDescription: 'Наскільки докази підтверджують наявність значущої проблеми прийняття рішень.', metricUncertainty: 'Невизначеність', metricUncertaintyDescription: 'Скільки важливої інформації ще невідомо.', metricEvidence: 'Сила доказів', metricEvidenceDescription: 'Якість і релевантність доказів, на яких базується рішення.', metricConfidence: 'Впевненість', metricConfidenceDescription: 'Впевненість після врахування невизначеності та якості доказів.', metricFit: 'Відповідність', metricFitDescription: 'Наскільки виявлена проблема відповідає вашій пропозиції / доступній можливості.',
      demoTitle: 'Подивіться продукт до імпорту власних даних', demoDescription: 'Відкрийте детермінований приклад портфеля, щоб побачити CONTACT / RESEARCH / WATCH / SKIP, докази, невизначеність і наступні дії.', demoAction: 'Переглянути приклад оцінювання', csvTitle: 'Додайте потенційних клієнтів', csvDescription: 'CSV містить відомі вам факти про компанії-кандидати. Обов’язкова лише назва; детальніший опис дає краще обґрунтоване оцінювання.', downloadTemplate: 'Скачати шаблон CSV', templateColumns: 'Колонки: name, domain, country, industry, employee_count, revenue_eur, description. Обов’язкова: name.',
    },
    import: { tag: 'ДАНІ ПРО КОМПАНІЇ', title: 'Імпортуйте потенційних клієнтів', description: 'Імпортуйте до 10 компаній із CSV. QDIP перевірить дані та оцінить їх відносно комерційного контексту вище без збереження і без зовнішнього дослідження.', upload: 'Обрати CSV-файл', validationErrors: 'Помилки перевірки', evaluating: 'Оцінювання…', emptyCsv: 'CSV має містити заголовок і щонайменше одну компанію.', tooManyRows: 'Публічне оцінювання підтримує не більше 10 компаній за один запуск.', validationFailed: 'Не вдалося перевірити CSV.', importFailed: 'Не вдалося імпортувати CSV.', evaluationFailed: 'Не вдалося оцінити компанії.', invalidValue: 'Некоректне значення', requiredField: 'Обов’язкове поле', validated: (count) => `${count} компаній перевірено. Можна запускати оцінювання.`, invalidRows: (count) => `${count} рядків потребують виправлення.`, runFor: (count) => `Оцінити ${count} компаній`, completed: (evaluated, total, failed) => `${evaluated}/${total} компаній оцінено${failed ? ` · ${failed} потребують виправлення` : ''}.`, issue: (row, field, message) => issueLabel('Рядок', 'Обов’язкове поле', 'Некоректне значення', row, field, message) },
  },
  pl: {
    subtitle: 'Określ, które firmy zasługują na uwagę handlową, dlaczego i jaki powinien być następny krok.', run: 'Zobacz przykładową ocenę', running: 'Ładowanie przykładu…', demo: 'DANE DEMO', imported: 'DANE IMPORTOWANE', portfolio: 'Portfel', portfolioSummary: 'Podsumowanie portfela', search: 'Szukaj firm', all: 'Wszystkie', decision: 'Decyzja', why: 'Dlaczego ta decyzja', risks: 'Ryzyka', evidence: 'Dowody', unknown: 'Brakujące informacje', research: 'Cele badawcze', next: 'Następny krok', fit: 'Dopasowanie', opportunity: 'Możliwość', uncertainty: 'Niepewność', quality: 'Siła dowodów', confidence: 'Pewność', freshness: 'Aktualność', details: 'Szczegóły decyzji', recommendation: 'Rekomendacja', empty: 'Opisz swój kontekst handlowy, a następnie prześlij potencjalnych klientów lub zobacz przykład.', industry: 'Branża', unavailable: 'Backend nie dostarcza danych', records: 'ocenionych firm', rationale: 'Uzasadnienie', target: 'Rola docelowa', source: 'Źródło', runDataset: 'Uruchomienie / zestaw danych', status: 'Status', decisionId: 'ID decyzji', plugin: 'Wtyczka', model: 'Model', trace: 'Ślad', evaluationFailed: 'Nie udało się wykonać oceny GTM.', failedRecords: (count) => `${count} rekordów wymaga poprawy; poprawne wyniki pozostają dostępne.`, decisions: { PURSUE: 'Skontaktować', RESEARCH: 'Zbadać', WATCH: 'Obserwować', SKIP: 'Pominąć' }, evidenceKinds: { FACT: 'Fakt', SIGNAL: 'Sygnał', HYPOTHESIS: 'Hipoteza', UNKNOWN: 'Nieznane', SOURCED: 'Ze źródłem' }, levels: { HIGH: 'Wysoka', MEDIUM: 'Średnia', LOW: 'Niska' }, sources: { DEMO: 'Dane demo', IMPORTED: 'Dane importowane' },
    onboarding: {
      eyebrow: 'ZACZNIJ TUTAJ', title: 'Powiedz GTM Lab, co sprzedajesz', description: 'QDIP potrzebuje kontekstu handlowego, aby ocenić, czy firma jest istotna właśnie dla Ciebie. Kontekst trafia do silnika decyzyjnego; przeglądarka nie oblicza scoringu.', stepContext: '1 · Twoja oferta', stepCompanies: '2 · Dane firm', stepDecision: '3 · Portfel decyzji', offering: 'Co sprzedajesz?', offeringPlaceholder: 'np. oprogramowanie wspierające decyzje o alokacji zasobów', problems: 'Jakie problemy rozwiązujesz?', problemsPlaceholder: 'np. ręczna alokacja mocy, planowanie personelu, planowanie z ograniczeniami', industries: 'Branże docelowe', industriesPlaceholder: 'np. logistyka, produkcja', sizes: 'Docelowa wielkość firmy', sizesPlaceholder: 'np. 50–500 pracowników', geographies: 'Geografia docelowa', geographiesPlaceholder: 'np. Polska, UE', roles: 'Typowy kupujący / decydent', rolesPlaceholder: 'np. Head of Operations, COO', continue: 'Użyj tego kontekstu', contextRequired: 'Opisz ofertę i co najmniej jeden problem, który rozwiązuje.', howTitle: 'Jak QDIP ocenia potencjalnych klientów', howDescription: 'Backend łączy zadeklarowany kontekst handlowy z dowodami dotyczącymi każdej firmy. Brakujące informacje zwiększają niepewność zamiast być wymyślane.', metricOpportunity: 'Możliwość', metricOpportunityDescription: 'Jak mocno dowody potwierdzają istotny problem decyzyjny.', metricUncertainty: 'Niepewność', metricUncertaintyDescription: 'Ile ważnych informacji pozostaje nierozstrzygniętych.', metricEvidence: 'Siła dowodów', metricEvidenceDescription: 'Jakość i trafność dowodów stojących za decyzją.', metricConfidence: 'Pewność', metricConfidenceDescription: 'Pewność po uwzględnieniu niepewności i jakości dowodów.', metricFit: 'Dopasowanie', metricFitDescription: 'Jak dobrze wykryty problem pasuje do zadeklarowanej oferty / dostępnej możliwości.', demoTitle: 'Zobacz produkt przed użyciem własnych danych', demoDescription: 'Otwórz deterministyczny przykładowy portfel, aby zobaczyć CONTACT / RESEARCH / WATCH / SKIP, dowody, niepewność i następne działania.', demoAction: 'Zobacz przykładową ocenę', csvTitle: 'Dodaj potencjalnych klientów', csvDescription: 'CSV zawiera znane Ci fakty o firmach. Wymagana jest tylko nazwa; bogatszy opis daje lepiej uzasadnioną ocenę.', downloadTemplate: 'Pobierz szablon CSV', templateColumns: 'Kolumny: name, domain, country, industry, employee_count, revenue_eur, description. Wymagana: name.',
    },
    import: { tag: 'DANE FIRM', title: 'Prześlij potencjalnych klientów', description: 'Prześlij do 10 firm w CSV. QDIP zweryfikuje dane i oceni je względem powyższego kontekstu handlowego bez zapisywania i zewnętrznego researchu.', upload: 'Prześlij CSV', validationErrors: 'Błędy walidacji', evaluating: 'Ocenianie…', emptyCsv: 'CSV musi zawierać nagłówek i co najmniej jedną firmę.', tooManyRows: 'Publiczna ocena obsługuje maksymalnie 10 firm na jedno uruchomienie.', validationFailed: 'Nie udało się zweryfikować CSV.', importFailed: 'Nie udało się zaimportować CSV.', evaluationFailed: 'Nie udało się ocenić firm.', invalidValue: 'Nieprawidłowa wartość', requiredField: 'Pole wymagane', validated: (count) => `${count} firm zweryfikowano. Można uruchomić ocenę.`, invalidRows: (count) => `${count} wierszy wymaga poprawy.`, runFor: (count) => `Oceń ${count} firm`, completed: (evaluated, total, failed) => `${evaluated}/${total} firm oceniono${failed ? ` · ${failed} wymaga poprawy` : ''}.`, issue: (row, field, message) => issueLabel('Wiersz', 'Pole wymagane', 'Nieprawidłowa wartość', row, field, message) },
  },
} satisfies Record<Locale, GtmLabCopy>
