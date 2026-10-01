import type { Locale } from '@/lib/observatory-i18n'

export type ContractorAllocationCopy = {
  eyebrow: string
  title: string
  subtitle: string
  run: string
  rerun: string
  synthetic: string
  counterfactualNote: string
  authorityTitle: string
  authorityIntro: string
  authority: {
    inspector: { title: string; body: string }
    procurement: { title: string; body: string }
    operations: { title: string; body: string }
    planner: { title: string; body: string }
  }
  stressTitle: string
  stressNone: string
  stressHelp: string
  summaryTitle: string
  spendWithChoice: string
  unitsWithChoice: string
  observedSpend: string
  qdipSpend: string
  allocationAdvantage: string
  choiceSpread: string
  unresolved: string
  decisionSpace: string
  decisionSpaceHint: string
  allocationTable: string
  unit: string
  scope: string
  observed: string
  qdip: string
  observedCost: string
  qdipCost: string
  delta: string
  decision: string
  details: string
  selectUnit: string
  selectedContractor: string
  feasibleAlternatives: string
  rejectedAlternatives: string
  expectedCost: string
  contract: string
  reason: string
  noReason: string
  snapshot: string
  optimizer: string
  exploredNodes: string
  filters: {
    all: string
    ALLOCATION_DECISION_REQUIRED: string
    NO_CHOICE: string
    EXCEPTION_REQUIRED: string
    INFEASIBLE: string
  }
  decisionLabels: {
    ALLOCATION_DECISION_REQUIRED: string
    NO_CHOICE: string
    EXCEPTION_REQUIRED: string
    INFEASIBLE: string
  }
  reasons: Record<string, string>
  status: {
    OPTIMAL: string
    FEASIBLE_NOT_PROVEN: string
    INFEASIBLE: string
    UNKNOWN: string
  }
  modelEstimate: string
}

export const contractorAllocationI18n: Record<Locale, ContractorAllocationCopy> = {
  en: {
    eyebrow: 'QDIP · CONTRACTOR ALLOCATION',
    title: 'Contractor Allocation',
    subtitle:
      'Replay approved work against independently supplied scope, contract and time-bucketed capacity inputs. QDIP assigns only where a costable feasible contractor exists.',
    run: 'Run allocation gate',
    rerun: 'Recalculate allocation',
    synthetic: 'Synthetic historical replay',
    counterfactualNote: 'Counterfactual model estimate, not realized savings.',
    authorityTitle: 'Trusted input boundary',
    authorityIntro: 'Decision-driving inputs are accepted only from their authoritative source and only if captured by the decision date.',
    authority: {
      inspector: { title: 'Inspector', body: 'Owns scope, quantity, location and technical requirements.' },
      procurement: { title: 'Procurement', body: 'Owns approved contractors, rates, eligibility and remaining contract volume.' },
      operations: { title: 'Operations', body: 'Owns execution deadlines, time-bucketed capacity, equipment and resource estimates.' },
      planner: { title: 'Planner', body: 'Sequences execution. Contractor selection and authoritative allocation inputs are not writeable.' },
    },
    stressTitle: 'Capacity stress',
    stressNone: 'All contractors available',
    stressHelp: 'Set all capacity buckets for one contractor to zero and recalculate the portfolio.',
    summaryTitle: 'Economic decision summary',
    spendWithChoice: 'Spend with contractor choice',
    unitsWithChoice: 'Units with choice',
    observedSpend: 'Observed expected spend',
    qdipSpend: 'QDIP expected spend',
    allocationAdvantage: 'Counterfactual allocation advantage',
    choiceSpread: 'Spend-weighted choice spread',
    unresolved: 'Blocked / exception units',
    decisionSpace: 'Decision space',
    decisionSpaceHint: 'Only units with costable feasible contractors enter portfolio optimization.',
    allocationTable: 'Allocation replay',
    unit: 'Unit',
    scope: 'Scope',
    observed: 'Observed contractor',
    qdip: 'QDIP contractor',
    observedCost: 'Observed cost',
    qdipCost: 'QDIP cost',
    delta: 'Expected advantage',
    decision: 'Decision type',
    details: 'Decision detail',
    selectUnit: 'Select a row to inspect trusted inputs, feasible alternatives and rejected contractors.',
    selectedContractor: 'Selected contractor',
    feasibleAlternatives: 'Feasible alternatives',
    rejectedAlternatives: 'Rejected alternatives',
    expectedCost: 'Expected cost',
    contract: 'Contract',
    reason: 'Reason',
    noReason: 'No rejected alternatives.',
    snapshot: 'Scenario input snapshot',
    optimizer: 'Optimizer',
    exploredNodes: 'Search nodes',
    filters: {
      all: 'All',
      ALLOCATION_DECISION_REQUIRED: 'Choice',
      NO_CHOICE: 'No choice',
      EXCEPTION_REQUIRED: 'Exception',
      INFEASIBLE: 'Blocked',
    },
    decisionLabels: {
      ALLOCATION_DECISION_REQUIRED: 'Allocation decision',
      NO_CHOICE: 'No contractor choice',
      EXCEPTION_REQUIRED: 'Cost exception required',
      INFEASIBLE: 'No feasible contractor',
    },
    reasons: {
      CONTRACT_EXPIRED: 'Contract is not active at the decision date.',
      NOT_APPROVED: 'Contractor is not approved.',
      TERRITORY_NOT_ALLOWED: 'Contract does not cover this territory.',
      WORK_TYPE_NOT_ALLOWED: 'Contract does not cover this work type.',
      NO_CAPACITY: 'The contractor lacks capacity in a required execution bucket.',
      CAPACITY_BUCKET_MISSING: 'No authoritative capacity exists for a required execution bucket.',
      MISSING_EQUIPMENT: 'Required equipment is unavailable.',
      MISSING_CERTIFICATION: 'Required certification is unavailable.',
      SLA_IMPOSSIBLE: 'The execution bucket is later than the required deadline.',
      CONTRACT_VOLUME_LIMIT: 'Remaining contract volume is insufficient.',
      RATE_NOT_CONFIGURED: 'No authoritative rate is configured for this work.',
      UNTRUSTED_INPUT: 'A decision-driving input is missing authoritative provenance or uses future information.',
      'T&E_REQUIRES_EXCEPTION': 'Time-and-equipment hours cannot be estimated from trusted inputs.',
    },
    status: {
      OPTIMAL: 'Optimal portfolio proven',
      FEASIBLE_NOT_PROVEN: 'Feasible portfolio found; optimum not proven',
      INFEASIBLE: 'Portfolio infeasible',
      UNKNOWN: 'Search limit reached before feasibility was established',
    },
    modelEstimate: 'Synthetic data · deterministic constrained allocation · no fraud or motive inference',
  },
  uk: {
    eyebrow: 'QDIP · РОЗПОДІЛ РОБІТ МІЖ ПІДРЯДНИКАМИ',
    title: 'Розподіл робіт між підрядниками',
    subtitle:
      'Повторне програвання затверджених робіт на незалежно отриманих даних про обсяг, договори та потужність за часовими періодами. QDIP призначає підрядника лише за наявності допустимого варіанта з обчислюваною вартістю.',
    run: 'Запустити контроль розподілу',
    rerun: 'Перерахувати розподіл',
    synthetic: 'Синтетичне історичне відтворення',
    counterfactualNote: 'Контрфактична модельна оцінка, а не фактично отримана економія.',
    authorityTitle: 'Межа довірених даних',
    authorityIntro: 'Дані, що визначають рішення, приймаються лише від їхнього відповідального джерела і лише якщо вони були доступні на дату рішення.',
    authority: {
      inspector: { title: 'Інспектор', body: 'Визначає обсяг робіт, кількість, місце та технічні вимоги.' },
      procurement: { title: 'Закупівлі', body: 'Визначають дозволених підрядників, ставки, допустимість і залишок обсягу договору.' },
      operations: { title: 'Операції', body: 'Надають строки виконання, потужність за часовими періодами, обладнання та оцінки ресурсів.' },
      planner: { title: 'Планувальник', body: 'Керує послідовністю виконання. Вибір підрядника та авторитетні входи розподілу не можуть задаватися вручну.' },
    },
    stressTitle: 'Стрес потужності',
    stressNone: 'Усі підрядники доступні',
    stressHelp: 'Встановіть одному підряднику нульову потужність у всіх часових періодах і перерахуйте портфель.',
    summaryTitle: 'Економічний підсумок рішення',
    spendWithChoice: 'Витрати, де є вибір підрядника',
    unitsWithChoice: 'Роботи з вибором',
    observedSpend: 'Очікувані витрати фактичного розподілу',
    qdipSpend: 'Очікувані витрати QDIP',
    allocationAdvantage: 'Контрфактична перевага розподілу',
    choiceSpread: 'Зважена за витратами різниця між варіантами',
    unresolved: 'Заблоковані роботи / винятки',
    decisionSpace: 'Простір рішень',
    decisionSpaceHint: 'До оптимізації портфеля входять лише роботи з допустимими підрядниками та обчислюваною вартістю.',
    allocationTable: 'Повторне програвання розподілу',
    unit: 'Робота',
    scope: 'Обсяг',
    observed: 'Фактичний підрядник',
    qdip: 'Підрядник QDIP',
    observedCost: 'Фактична оцінка',
    qdipCost: 'Оцінка QDIP',
    delta: 'Очікувана перевага',
    decision: 'Тип рішення',
    details: 'Деталі рішення',
    selectUnit: 'Виберіть рядок, щоб переглянути довірені входи, допустимі альтернативи та причини відхилення.',
    selectedContractor: 'Обраний підрядник',
    feasibleAlternatives: 'Допустимі альтернативи',
    rejectedAlternatives: 'Відхилені альтернативи',
    expectedCost: 'Очікувана вартість',
    contract: 'Договір',
    reason: 'Причина',
    noReason: 'Відхилених альтернатив немає.',
    snapshot: 'Знімок вхідних даних сценарію',
    optimizer: 'Оптимізатор',
    exploredNodes: 'Перевірено вузлів пошуку',
    filters: {
      all: 'Усі',
      ALLOCATION_DECISION_REQUIRED: 'Є вибір',
      NO_CHOICE: 'Без вибору',
      EXCEPTION_REQUIRED: 'Виняток',
      INFEASIBLE: 'Заблоковано',
    },
    decisionLabels: {
      ALLOCATION_DECISION_REQUIRED: 'Потрібен розподіл',
      NO_CHOICE: 'Немає вибору підрядника',
      EXCEPTION_REQUIRED: 'Потрібен виняток для вартості',
      INFEASIBLE: 'Немає допустимого підрядника',
    },
    reasons: {
      CONTRACT_EXPIRED: 'Договір не чинний на дату рішення.',
      NOT_APPROVED: 'Підрядник не затверджений.',
      TERRITORY_NOT_ALLOWED: 'Договір не покриває цю територію.',
      WORK_TYPE_NOT_ALLOWED: 'Договір не покриває цей тип робіт.',
      NO_CAPACITY: 'Підряднику бракує потужності у потрібному часовому періоді.',
      CAPACITY_BUCKET_MISSING: 'Для потрібного періоду немає підтверджених даних про потужність.',
      MISSING_EQUIPMENT: 'Немає необхідного обладнання.',
      MISSING_CERTIFICATION: 'Немає необхідної сертифікації.',
      SLA_IMPOSSIBLE: 'Період виконання виходить за потрібний строк.',
      CONTRACT_VOLUME_LIMIT: 'Залишку обсягу договору недостатньо.',
      RATE_NOT_CONFIGURED: 'Для цієї роботи немає підтвердженої ставки.',
      UNTRUSTED_INPUT: 'Вхід, що впливає на рішення, не має авторитетного походження або зʼявився після дати рішення.',
      'T&E_REQUIRES_EXCEPTION': 'Години праці та обладнання неможливо оцінити з довірених даних.',
    },
    status: {
      OPTIMAL: 'Оптимальність портфеля доведено',
      FEASIBLE_NOT_PROVEN: 'Допустимий портфель знайдено, але оптимальність не доведено',
      INFEASIBLE: 'Портфель недопустимий',
      UNKNOWN: 'Ліміт пошуку досягнуто до встановлення допустимості',
    },
    modelEstimate: 'Синтетичні дані · детермінований розподіл з обмеженнями · без оцінки шахрайства чи мотивів',
  },
  pl: {
    eyebrow: 'QDIP · PRZYDZIAŁ PRAC WYKONAWCOM',
    title: 'Przydział prac wykonawcom',
    subtitle:
      'Odtworzenie zatwierdzonych prac na niezależnie dostarczonych danych o zakresie, umowach i mocy w przedziałach czasu. QDIP przydziela wykonawcę tylko wtedy, gdy istnieje wykonalna opcja z obliczalnym kosztem.',
    run: 'Uruchom kontrolę przydziału',
    rerun: 'Przelicz przydział',
    synthetic: 'Syntetyczne odtworzenie historyczne',
    counterfactualNote: 'Kontrfaktyczna estymacja modelu, a nie zrealizowana oszczędność.',
    authorityTitle: 'Granica zaufanych danych',
    authorityIntro: 'Dane wpływające na decyzję są akceptowane wyłącznie od odpowiedzialnego źródła i tylko wtedy, gdy były dostępne w dniu decyzji.',
    authority: {
      inspector: { title: 'Inspektor', body: 'Określa zakres, ilość, lokalizację i wymagania techniczne.' },
      procurement: { title: 'Zakupy', body: 'Określają zatwierdzonych wykonawców, stawki, dopuszczalność i pozostały wolumen umowy.' },
      operations: { title: 'Operacje', body: 'Dostarczają terminy, moc w przedziałach czasu, sprzęt i estymacje zasobów.' },
      planner: { title: 'Planista', body: 'Ustala kolejność wykonania. Wybór wykonawcy i autorytatywne dane przydziału nie są ręcznie zapisywalne.' },
    },
    stressTitle: 'Test dostępnej mocy',
    stressNone: 'Wszyscy wykonawcy dostępni',
    stressHelp: 'Ustaw jednemu wykonawcy zerową moc we wszystkich przedziałach i przelicz portfel.',
    summaryTitle: 'Ekonomiczne podsumowanie decyzji',
    spendWithChoice: 'Wydatki z wyborem wykonawcy',
    unitsWithChoice: 'Prace z wyborem',
    observedSpend: 'Oczekiwany koszt obserwowanego przydziału',
    qdipSpend: 'Oczekiwany koszt QDIP',
    allocationAdvantage: 'Kontrfaktyczna przewaga przydziału',
    choiceSpread: 'Ważone wydatkami zróżnicowanie opcji',
    unresolved: 'Prace zablokowane / wyjątki',
    decisionSpace: 'Przestrzeń decyzji',
    decisionSpaceHint: 'Do optymalizacji trafiają tylko prace z wykonalnymi wykonawcami i obliczalnym kosztem.',
    allocationTable: 'Odtworzenie przydziału',
    unit: 'Praca',
    scope: 'Zakres',
    observed: 'Obserwowany wykonawca',
    qdip: 'Wykonawca QDIP',
    observedCost: 'Koszt obserwowany',
    qdipCost: 'Koszt QDIP',
    delta: 'Oczekiwana przewaga',
    decision: 'Typ decyzji',
    details: 'Szczegóły decyzji',
    selectUnit: 'Wybierz wiersz, aby sprawdzić zaufane dane wejściowe, wykonalne alternatywy i powody odrzucenia.',
    selectedContractor: 'Wybrany wykonawca',
    feasibleAlternatives: 'Wykonalne alternatywy',
    rejectedAlternatives: 'Odrzucone alternatywy',
    expectedCost: 'Oczekiwany koszt',
    contract: 'Umowa',
    reason: 'Powód',
    noReason: 'Brak odrzuconych alternatyw.',
    snapshot: 'Migawka danych wejściowych scenariusza',
    optimizer: 'Optymalizator',
    exploredNodes: 'Węzły wyszukiwania',
    filters: {
      all: 'Wszystkie',
      ALLOCATION_DECISION_REQUIRED: 'Jest wybór',
      NO_CHOICE: 'Bez wyboru',
      EXCEPTION_REQUIRED: 'Wyjątek',
      INFEASIBLE: 'Zablokowane',
    },
    decisionLabels: {
      ALLOCATION_DECISION_REQUIRED: 'Decyzja przydziału',
      NO_CHOICE: 'Brak wyboru wykonawcy',
      EXCEPTION_REQUIRED: 'Wymagany wyjątek kosztowy',
      INFEASIBLE: 'Brak wykonalnego wykonawcy',
    },
    reasons: {
      CONTRACT_EXPIRED: 'Umowa nie jest aktywna w dniu decyzji.',
      NOT_APPROVED: 'Wykonawca nie jest zatwierdzony.',
      TERRITORY_NOT_ALLOWED: 'Umowa nie obejmuje tego obszaru.',
      WORK_TYPE_NOT_ALLOWED: 'Umowa nie obejmuje tego rodzaju pracy.',
      NO_CAPACITY: 'Wykonawca nie ma wystarczającej mocy w wymaganym przedziale czasu.',
      CAPACITY_BUCKET_MISSING: 'Brakuje autorytatywnych danych o mocy dla wymaganego przedziału.',
      MISSING_EQUIPMENT: 'Brak wymaganego sprzętu.',
      MISSING_CERTIFICATION: 'Brak wymaganej certyfikacji.',
      SLA_IMPOSSIBLE: 'Przedział wykonania wykracza poza wymagany termin.',
      CONTRACT_VOLUME_LIMIT: 'Pozostały wolumen umowy jest niewystarczający.',
      RATE_NOT_CONFIGURED: 'Brak zatwierdzonej stawki dla tej pracy.',
      UNTRUSTED_INPUT: 'Dane wpływające na decyzję nie mają autorytatywnego pochodzenia albo powstały po dacie decyzji.',
      'T&E_REQUIRES_EXCEPTION': 'Nie można oszacować godzin pracy i sprzętu na podstawie zaufanych danych.',
    },
    status: {
      OPTIMAL: 'Optymalność portfela została udowodniona',
      FEASIBLE_NOT_PROVEN: 'Znaleziono wykonalny portfel, ale nie udowodniono optymalności',
      INFEASIBLE: 'Portfel niewykonalny',
      UNKNOWN: 'Osiągnięto limit wyszukiwania przed ustaleniem wykonalności',
    },
    modelEstimate: 'Dane syntetyczne · deterministyczny przydział z ograniczeniami · bez oceny nadużyć ani motywów',
  },
}
