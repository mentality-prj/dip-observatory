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
    BOUNDED: string
    INFEASIBLE: string
  }
  modelEstimate: string
}

export const contractorAllocationI18n: Record<Locale, ContractorAllocationCopy> = {
  en: {
    eyebrow: 'QDIP · CONTRACTOR ALLOCATION',
    title: 'Contractor Allocation',
    subtitle:
      'Replay approved work against independently supplied scope, contract and capacity inputs. QDIP assigns only where more than one feasible contractor exists.',
    run: 'Run allocation gate',
    rerun: 'Recalculate allocation',
    synthetic: 'Synthetic historical replay',
    counterfactualNote: 'Counterfactual model estimate, not realized savings.',
    authorityTitle: 'Trusted input boundary',
    authorityIntro: 'The allocator cannot manufacture the facts that determine eligibility.',
    authority: {
      inspector: { title: 'Inspector', body: 'Owns scope, quantity, location and technical requirements.' },
      procurement: { title: 'Procurement', body: 'Owns approved contractors, contracts, rates and eligibility.' },
      operations: { title: 'Operations', body: 'Owns available capacity, equipment and resource availability.' },
      planner: { title: 'Planner', body: 'Sequences execution. Contractor selection is not a writeable input.' },
    },
    stressTitle: 'Capacity stress',
    stressNone: 'All contractors available',
    stressHelp: 'Set one contractor capacity to zero and recalculate the remaining portfolio.',
    summaryTitle: 'Economic decision summary',
    spendWithChoice: 'Spend with contractor choice',
    unitsWithChoice: 'Units with choice',
    observedSpend: 'Observed expected spend',
    qdipSpend: 'QDIP expected spend',
    allocationAdvantage: 'Counterfactual allocation advantage',
    choiceSpread: 'Spend-weighted choice spread',
    unresolved: 'Blocked / exception units',
    decisionSpace: 'Decision space',
    decisionSpaceHint: 'Only units with at least two costable feasible contractors are optimization decisions.',
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
    selectUnit: 'Select a row to inspect the trusted inputs, feasible alternatives and rejected contractors.',
    selectedContractor: 'Selected contractor',
    feasibleAlternatives: 'Feasible alternatives',
    rejectedAlternatives: 'Rejected alternatives',
    expectedCost: 'Expected cost',
    contract: 'Contract',
    reason: 'Reason',
    noReason: 'No rejected alternatives.',
    snapshot: 'Input snapshot',
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
      NO_CAPACITY: 'No authoritative capacity is available.',
      MISSING_EQUIPMENT: 'Required equipment is unavailable.',
      MISSING_CERTIFICATION: 'Required certification is unavailable.',
      SLA_IMPOSSIBLE: 'Availability does not cover the required deadline.',
      CONTRACT_VOLUME_LIMIT: 'Contract volume limit is exhausted.',
      RATE_NOT_CONFIGURED: 'No authoritative rate is configured for this work.',
      'T&E_REQUIRES_EXCEPTION': 'Time-and-equipment hours cannot be estimated from trusted inputs.',
    },
    status: { OPTIMAL: 'Optimal portfolio found', BOUNDED: 'Best portfolio within search bound', INFEASIBLE: 'Portfolio infeasible' },
    modelEstimate: 'Synthetic data · deterministic constrained allocation · no fraud or motive inference',
  },
  uk: {
    eyebrow: 'QDIP · РОЗПОДІЛ РОБІТ МІЖ ПІДРЯДНИКАМИ',
    title: 'Розподіл робіт між підрядниками',
    subtitle:
      'Повторне програвання затверджених робіт на незалежно отриманих даних про обсяг, договори та потужність. QDIP призначає підрядника лише там, де є більше одного допустимого варіанта.',
    run: 'Запустити контроль розподілу',
    rerun: 'Перерахувати розподіл',
    synthetic: 'Синтетичне історичне відтворення',
    counterfactualNote: 'Контрфактична модельна оцінка, а не фактично отримана економія.',
    authorityTitle: 'Межа довірених даних',
    authorityIntro: 'Модуль розподілу не може сам створювати факти, що визначають допустимість підрядника.',
    authority: {
      inspector: { title: 'Інспектор', body: 'Визначає обсяг робіт, кількість, місце та технічні вимоги.' },
      procurement: { title: 'Закупівлі', body: 'Визначають дозволених підрядників, договори, ставки та допустимість.' },
      operations: { title: 'Операції', body: 'Надають доступну потужність, обладнання та доступність ресурсів.' },
      planner: { title: 'Планувальник', body: 'Керує послідовністю виконання. Підрядник не є полем ручного вводу.' },
    },
    stressTitle: 'Стрес потужності',
    stressNone: 'Усі підрядники доступні',
    stressHelp: 'Встановіть одному підряднику нульову потужність і перерахуйте решту портфеля.',
    summaryTitle: 'Економічний підсумок рішення',
    spendWithChoice: 'Витрати, де є вибір підрядника',
    unitsWithChoice: 'Роботи з вибором',
    observedSpend: 'Очікувані витрати фактичного розподілу',
    qdipSpend: 'Очікувані витрати QDIP',
    allocationAdvantage: 'Контрфактична перевага розподілу',
    choiceSpread: 'Зважена за витратами різниця між варіантами',
    unresolved: 'Заблоковані роботи / винятки',
    decisionSpace: 'Простір рішень',
    decisionSpaceHint: 'Оптимізуються лише роботи, для яких є щонайменше два допустимі підрядники з обчислюваною вартістю.',
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
    snapshot: 'Знімок вхідних даних',
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
      NO_CAPACITY: 'Немає підтвердженої доступної потужності.',
      MISSING_EQUIPMENT: 'Немає необхідного обладнання.',
      MISSING_CERTIFICATION: 'Немає необхідної сертифікації.',
      SLA_IMPOSSIBLE: 'Доступність не покриває потрібний строк.',
      CONTRACT_VOLUME_LIMIT: 'Ліміт обсягу договору вичерпано.',
      RATE_NOT_CONFIGURED: 'Для цієї роботи немає підтвердженої ставки.',
      'T&E_REQUIRES_EXCEPTION': 'Години праці та обладнання неможливо оцінити з довірених даних.',
    },
    status: { OPTIMAL: 'Знайдено оптимальний портфель', BOUNDED: 'Найкращий портфель у межах пошуку', INFEASIBLE: 'Портфель недопустимий' },
    modelEstimate: 'Синтетичні дані · детермінований розподіл з обмеженнями · без оцінки шахрайства чи мотивів',
  },
  pl: {
    eyebrow: 'QDIP · PRZYDZIAŁ PRAC WYKONAWCOM',
    title: 'Przydział prac wykonawcom',
    subtitle:
      'Odtworzenie zatwierdzonych prac na niezależnie dostarczonych danych o zakresie, umowach i dostępnej mocy. QDIP przydziela wykonawcę tylko wtedy, gdy istnieje więcej niż jedna wykonalna opcja.',
    run: 'Uruchom kontrolę przydziału',
    rerun: 'Przelicz przydział',
    synthetic: 'Syntetyczne odtworzenie historyczne',
    counterfactualNote: 'Kontrfaktyczna estymacja modelu, a nie zrealizowana oszczędność.',
    authorityTitle: 'Granica zaufanych danych',
    authorityIntro: 'Moduł przydziału nie może sam tworzyć faktów decydujących o dopuszczalności wykonawcy.',
    authority: {
      inspector: { title: 'Inspektor', body: 'Określa zakres, ilość, lokalizację i wymagania techniczne.' },
      procurement: { title: 'Zakupy', body: 'Określają zatwierdzonych wykonawców, umowy, stawki i dopuszczalność.' },
      operations: { title: 'Operacje', body: 'Dostarczają informacje o mocy, sprzęcie i dostępności zasobów.' },
      planner: { title: 'Planista', body: 'Ustala kolejność wykonania. Wykonawca nie jest ręcznie zapisywanym polem.' },
    },
    stressTitle: 'Test dostępnej mocy',
    stressNone: 'Wszyscy wykonawcy dostępni',
    stressHelp: 'Ustaw jednemu wykonawcy zerową moc i przelicz pozostały portfel.',
    summaryTitle: 'Ekonomiczne podsumowanie decyzji',
    spendWithChoice: 'Wydatki z wyborem wykonawcy',
    unitsWithChoice: 'Prace z wyborem',
    observedSpend: 'Oczekiwany koszt obserwowanego przydziału',
    qdipSpend: 'Oczekiwany koszt QDIP',
    allocationAdvantage: 'Kontrfaktyczna przewaga przydziału',
    choiceSpread: 'Ważone wydatkami zróżnicowanie opcji',
    unresolved: 'Prace zablokowane / wyjątki',
    decisionSpace: 'Przestrzeń decyzji',
    decisionSpaceHint: 'Optymalizowane są tylko prace z co najmniej dwoma wykonalnymi wykonawcami o obliczalnym koszcie.',
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
    snapshot: 'Migawka danych wejściowych',
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
      NO_CAPACITY: 'Brak potwierdzonej dostępnej mocy.',
      MISSING_EQUIPMENT: 'Brak wymaganego sprzętu.',
      MISSING_CERTIFICATION: 'Brak wymaganej certyfikacji.',
      SLA_IMPOSSIBLE: 'Dostępność nie obejmuje wymaganego terminu.',
      CONTRACT_VOLUME_LIMIT: 'Limit wolumenu umowy został wyczerpany.',
      RATE_NOT_CONFIGURED: 'Brak zatwierdzonej stawki dla tej pracy.',
      'T&E_REQUIRES_EXCEPTION': 'Nie można oszacować godzin pracy i sprzętu na podstawie zaufanych danych.',
    },
    status: { OPTIMAL: 'Znaleziono optymalny portfel', BOUNDED: 'Najlepszy portfel w granicach wyszukiwania', INFEASIBLE: 'Portfel niewykonalny' },
    modelEstimate: 'Dane syntetyczne · deterministyczny przydział z ograniczeniami · bez oceny nadużyć ani motywów',
  },
}
