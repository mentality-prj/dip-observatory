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
  coverage: string
  reservations: string
  globalChoiceUnknown: string
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
    PARTIAL_OPTIMAL: string
    FEASIBLE_NOT_PROVEN: string
    PARTIAL_FEASIBLE_NOT_PROVEN: string
    INFEASIBLE: string
    UNKNOWN: string
    INVALID_INPUT: string
  }
  modelEstimate: string
}

export const contractorAllocationI18n: Record<Locale, ContractorAllocationCopy> = {
  en: {
    eyebrow: 'QDIP · CONTRACTOR ALLOCATION',
    title: 'Contractor Allocation',
    subtitle:
      'Replay approved work against trusted scope, contract and time-bucketed capacity inputs. Cost-uncertain work reserves resources but is never presented as an economic assignment.',
    run: 'Run allocation gate',
    rerun: 'Recalculate allocation',
    synthetic: 'Synthetic historical replay',
    counterfactualNote: 'Counterfactual model estimate, not realized savings.',
    authorityTitle: 'Trusted input boundary',
    authorityIntro:
      'Decision-driving provenance references a server-owned trusted-adapter registry; callers cannot self-declare an authoritative role.',
    authority: {
      inspector: { title: 'Inspector', body: 'Owns scope, quantity, location and technical requirements.' },
      procurement: {
        title: 'Procurement',
        body: 'Owns approved contractors, rates, eligibility and remaining contract volume.',
      },
      operations: {
        title: 'Operations',
        body: 'Owns execution windows, deadlines, time-bucketed capacity, equipment and resource estimates.',
      },
      planner: {
        title: 'Planner',
        body: 'Sequences execution. Contractor selection and authoritative allocation inputs are not writeable.',
      },
    },
    stressTitle: 'Capacity stress',
    stressNone: 'All contractors available',
    stressHelp: 'Set all capacity buckets for one contractor to zero and recalculate the portfolio.',
    summaryTitle: 'Economic decision summary',
    spendWithChoice: 'Spend with global contractor choice',
    unitsWithChoice: 'Units with global choice',
    observedSpend: 'Observed expected spend',
    qdipSpend: 'QDIP expected spend',
    allocationAdvantage: 'Counterfactual allocation advantage',
    choiceSpread: 'Spend-weighted global choice spread',
    unresolved: 'Blocked / exception units',
    coverage: 'Economic coverage',
    reservations: 'Cost-uncertain reservations',
    globalChoiceUnknown: 'Choice feasibility unresolved',
    decisionSpace: 'Global decision space',
    decisionSpaceHint:
      'A unit counts as discretionary only when at least two contractor choices can each belong to a globally feasible portfolio under the same constraints.',
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
      ALLOCATION_DECISION_REQUIRED: 'Local choice',
      NO_CHOICE: 'No local choice',
      EXCEPTION_REQUIRED: 'Exception',
      INFEASIBLE: 'Blocked',
    },
    decisionLabels: {
      ALLOCATION_DECISION_REQUIRED: 'Local allocation alternatives',
      NO_CHOICE: 'No local contractor choice',
      EXCEPTION_REQUIRED: 'Cost exception required',
      INFEASIBLE: 'No feasible contractor',
    },
    reasons: {
      CONTRACT_OUTSIDE_EXECUTION_WINDOW: 'Contract validity does not cover the planned execution window.',
      NOT_APPROVED: 'Contractor is not approved.',
      TERRITORY_NOT_ALLOWED: 'Contract does not cover this territory.',
      WORK_TYPE_NOT_ALLOWED: 'Contract does not cover this work type.',
      NO_CAPACITY: 'The contractor lacks capacity in a required execution bucket.',
      CAPACITY_BUCKET_MISSING: 'No authoritative capacity exists for a required execution bucket.',
      MISSING_EQUIPMENT: 'Required equipment is unavailable.',
      MISSING_CERTIFICATION: 'Required certification is unavailable.',
      SLA_IMPOSSIBLE: 'The planned execution window exceeds the operational deadline.',
      CONTRACT_VOLUME_LIMIT: 'Remaining contract volume is insufficient.',
      RATE_NOT_CONFIGURED: 'No authoritative rate is configured for this work.',
      UNTRUSTED_INPUT: 'A decision-driving input does not resolve to the required trusted adapter or uses future information.',
      INVALID_SCENARIO_INPUT: 'Scenario invariants are invalid.',
      'T&E_REQUIRES_EXCEPTION': 'Time-and-equipment hours cannot be estimated from trusted inputs.',
    },
    status: {
      OPTIMAL: 'Complete optimal portfolio proven',
      PARTIAL_OPTIMAL: 'Covered work optimized; unknown-cost work reserved',
      FEASIBLE_NOT_PROVEN: 'Complete feasible portfolio found; optimum not proven',
      PARTIAL_FEASIBLE_NOT_PROVEN: 'Partial feasible portfolio found; optimum not proven',
      INFEASIBLE: 'Complete portfolio infeasible',
      UNKNOWN: 'Search limit reached before feasibility was established',
      INVALID_INPUT: 'Scenario rejected: invalid or untrusted input',
    },
    modelEstimate: 'Synthetic data · deterministic constrained allocation · no fraud or motive inference',
  },
  uk: {
    eyebrow: 'QDIP · РОЗПОДІЛ РОБІТ МІЖ ПІДРЯДНИКАМИ',
    title: 'Розподіл робіт між підрядниками',
    subtitle:
      'Повторне програвання затверджених робіт на довірених даних про обсяг, договори та потужність за часовими періодами. Роботи з невідомою вартістю резервують ресурси, але не видаються за економічне призначення.',
    run: 'Запустити контроль розподілу',
    rerun: 'Перерахувати розподіл',
    synthetic: 'Синтетичне історичне відтворення',
    counterfactualNote: 'Контрфактична модельна оцінка, а не фактично отримана економія.',
    authorityTitle: 'Межа довірених даних',
    authorityIntro:
      'Походження входів посилається на серверний реєстр довірених адаптерів; виклик не може сам оголосити себе авторитетною роллю.',
    authority: {
      inspector: { title: 'Інспектор', body: 'Визначає обсяг робіт, кількість, місце та технічні вимоги.' },
      procurement: {
        title: 'Закупівлі',
        body: 'Визначають дозволених підрядників, ставки, допустимість і залишок обсягу договору.',
      },
      operations: {
        title: 'Операції',
        body: 'Надають вікна виконання, строки, потужність за періодами, обладнання та оцінки ресурсів.',
      },
      planner: {
        title: 'Планувальник',
        body: 'Керує послідовністю виконання. Вибір підрядника та авторитетні входи розподілу не можуть задаватися вручну.',
      },
    },
    stressTitle: 'Стрес потужності',
    stressNone: 'Усі підрядники доступні',
    stressHelp: 'Встановіть одному підряднику нульову потужність у всіх часових періодах і перерахуйте портфель.',
    summaryTitle: 'Економічний підсумок рішення',
    spendWithChoice: 'Витрати з глобальним вибором підрядника',
    unitsWithChoice: 'Роботи з глобальним вибором',
    observedSpend: 'Очікувані витрати фактичного розподілу',
    qdipSpend: 'Очікувані витрати QDIP',
    allocationAdvantage: 'Контрфактична перевага розподілу',
    choiceSpread: 'Зважена різниця глобально допустимих варіантів',
    unresolved: 'Заблоковані роботи / винятки',
    coverage: 'Економічне покриття',
    reservations: 'Резервування з невідомою вартістю',
    globalChoiceUnknown: 'Глобальний вибір не доведено',
    decisionSpace: 'Глобальний простір рішень',
    decisionSpaceHint:
      'Робота вважається дискреційною лише якщо щонайменше два варіанти підрядника можуть входити до глобально допустимого портфеля за тих самих обмежень.',
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
      ALLOCATION_DECISION_REQUIRED: 'Локальний вибір',
      NO_CHOICE: 'Без локального вибору',
      EXCEPTION_REQUIRED: 'Виняток',
      INFEASIBLE: 'Заблоковано',
    },
    decisionLabels: {
      ALLOCATION_DECISION_REQUIRED: 'Локальні альтернативи розподілу',
      NO_CHOICE: 'Немає локального вибору підрядника',
      EXCEPTION_REQUIRED: 'Потрібен виняток для вартості',
      INFEASIBLE: 'Немає допустимого підрядника',
    },
    reasons: {
      CONTRACT_OUTSIDE_EXECUTION_WINDOW: 'Строк дії договору не покриває заплановане вікно виконання.',
      NOT_APPROVED: 'Підрядник не затверджений.',
      TERRITORY_NOT_ALLOWED: 'Договір не покриває цю територію.',
      WORK_TYPE_NOT_ALLOWED: 'Договір не покриває цей тип робіт.',
      NO_CAPACITY: 'Підряднику бракує потужності у потрібному часовому періоді.',
      CAPACITY_BUCKET_MISSING: 'Для потрібного періоду немає підтверджених даних про потужність.',
      MISSING_EQUIPMENT: 'Немає необхідного обладнання.',
      MISSING_CERTIFICATION: 'Немає необхідної сертифікації.',
      SLA_IMPOSSIBLE: 'Заплановане вікно виконання виходить за операційний строк.',
      CONTRACT_VOLUME_LIMIT: 'Залишку обсягу договору недостатньо.',
      RATE_NOT_CONFIGURED: 'Для цієї роботи немає підтвердженої ставки.',
      UNTRUSTED_INPUT: 'Вхід не посилається на потрібний довірений адаптер або містить інформацію з майбутнього.',
      INVALID_SCENARIO_INPUT: 'Порушено інваріанти сценарію.',
      'T&E_REQUIRES_EXCEPTION': 'Години праці та обладнання неможливо оцінити з довірених даних.',
    },
    status: {
      OPTIMAL: 'Повну оптимальність портфеля доведено',
      PARTIAL_OPTIMAL: 'Покриті роботи оптимізовано; роботи з невідомою вартістю зарезервовано',
      FEASIBLE_NOT_PROVEN: 'Повний допустимий портфель знайдено, але оптимальність не доведено',
      PARTIAL_FEASIBLE_NOT_PROVEN: 'Частковий допустимий портфель знайдено, але оптимальність не доведено',
      INFEASIBLE: 'Повний портфель недопустимий',
      UNKNOWN: 'Ліміт пошуку досягнуто до встановлення допустимості',
      INVALID_INPUT: 'Сценарій відхилено через недійсні або недовірені входи',
    },
    modelEstimate: 'Синтетичні дані · детермінований розподіл з обмеженнями · без оцінки шахрайства чи мотивів',
  },
  pl: {
    eyebrow: 'QDIP · PRZYDZIAŁ PRAC WYKONAWCOM',
    title: 'Przydział prac wykonawcom',
    subtitle:
      'Odtworzenie zatwierdzonych prac na zaufanych danych o zakresie, umowach i mocy w przedziałach czasu. Prace o nieznanym koszcie rezerwują zasoby, ale nie są prezentowane jako ekonomiczny przydział.',
    run: 'Uruchom kontrolę przydziału',
    rerun: 'Przelicz przydział',
    synthetic: 'Syntetyczne odtworzenie historyczne',
    counterfactualNote: 'Kontrfaktyczna estymacja modelu, a nie zrealizowana oszczędność.',
    authorityTitle: 'Granica zaufanych danych',
    authorityIntro:
      'Pochodzenie danych odwołuje się do serwerowego rejestru zaufanych adapterów; wywołujący nie może sam nadać sobie roli źródła autorytatywnego.',
    authority: {
      inspector: { title: 'Inspektor', body: 'Określa zakres, ilość, lokalizację i wymagania techniczne.' },
      procurement: {
        title: 'Zakupy',
        body: 'Określają zatwierdzonych wykonawców, stawki, dopuszczalność i pozostały wolumen umowy.',
      },
      operations: {
        title: 'Operacje',
        body: 'Dostarczają okna wykonania, terminy, moc w przedziałach czasu, sprzęt i estymacje zasobów.',
      },
      planner: {
        title: 'Planista',
        body: 'Ustala kolejność wykonania. Wybór wykonawcy i autorytatywne dane przydziału nie są ręcznie zapisywalne.',
      },
    },
    stressTitle: 'Test dostępnej mocy',
    stressNone: 'Wszyscy wykonawcy dostępni',
    stressHelp: 'Ustaw jednemu wykonawcy zerową moc we wszystkich przedziałach i przelicz portfel.',
    summaryTitle: 'Ekonomiczne podsumowanie decyzji',
    spendWithChoice: 'Wydatki z globalnym wyborem wykonawcy',
    unitsWithChoice: 'Prace z globalnym wyborem',
    observedSpend: 'Oczekiwany koszt obserwowanego przydziału',
    qdipSpend: 'Oczekiwany koszt QDIP',
    allocationAdvantage: 'Kontrfaktyczna przewaga przydziału',
    choiceSpread: 'Ważone wydatkami zróżnicowanie globalnie wykonalnych opcji',
    unresolved: 'Prace zablokowane / wyjątki',
    coverage: 'Pokrycie ekonomiczne',
    reservations: 'Rezerwacje o nieznanym koszcie',
    globalChoiceUnknown: 'Nieustalona wykonalność wyboru',
    decisionSpace: 'Globalna przestrzeń decyzji',
    decisionSpaceHint:
      'Praca jest uznawana za dyskrecjonalną tylko wtedy, gdy co najmniej dwa wybory wykonawcy mogą należeć do globalnie wykonalnego portfela przy tych samych ograniczeniach.',
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
      ALLOCATION_DECISION_REQUIRED: 'Wybór lokalny',
      NO_CHOICE: 'Bez wyboru lokalnego',
      EXCEPTION_REQUIRED: 'Wyjątek',
      INFEASIBLE: 'Zablokowane',
    },
    decisionLabels: {
      ALLOCATION_DECISION_REQUIRED: 'Lokalne alternatywy przydziału',
      NO_CHOICE: 'Brak lokalnego wyboru wykonawcy',
      EXCEPTION_REQUIRED: 'Wymagany wyjątek kosztowy',
      INFEASIBLE: 'Brak wykonalnego wykonawcy',
    },
    reasons: {
      CONTRACT_OUTSIDE_EXECUTION_WINDOW: 'Okres obowiązywania umowy nie obejmuje planowanego okna wykonania.',
      NOT_APPROVED: 'Wykonawca nie jest zatwierdzony.',
      TERRITORY_NOT_ALLOWED: 'Umowa nie obejmuje tego obszaru.',
      WORK_TYPE_NOT_ALLOWED: 'Umowa nie obejmuje tego rodzaju pracy.',
      NO_CAPACITY: 'Wykonawca nie ma wystarczającej mocy w wymaganym przedziale czasu.',
      CAPACITY_BUCKET_MISSING: 'Brakuje autorytatywnych danych o mocy dla wymaganego przedziału.',
      MISSING_EQUIPMENT: 'Brak wymaganego sprzętu.',
      MISSING_CERTIFICATION: 'Brak wymaganej certyfikacji.',
      SLA_IMPOSSIBLE: 'Planowane okno wykonania wykracza poza termin operacyjny.',
      CONTRACT_VOLUME_LIMIT: 'Pozostały wolumen umowy jest niewystarczający.',
      RATE_NOT_CONFIGURED: 'Brak zatwierdzonej stawki dla tej pracy.',
      UNTRUSTED_INPUT: 'Dane nie wskazują wymaganego zaufanego adaptera albo wykorzystują informacje z przyszłości.',
      INVALID_SCENARIO_INPUT: 'Naruszono niezmienniki scenariusza.',
      'T&E_REQUIRES_EXCEPTION': 'Nie można oszacować godzin pracy i sprzętu na podstawie zaufanych danych.',
    },
    status: {
      OPTIMAL: 'Udowodniono optymalność pełnego portfela',
      PARTIAL_OPTIMAL: 'Pokryte prace zoptymalizowano; prace o nieznanym koszcie zarezerwowano',
      FEASIBLE_NOT_PROVEN: 'Znaleziono pełny wykonalny portfel, ale nie udowodniono optymalności',
      PARTIAL_FEASIBLE_NOT_PROVEN: 'Znaleziono częściowy wykonalny portfel, ale nie udowodniono optymalności',
      INFEASIBLE: 'Pełny portfel jest niewykonalny',
      UNKNOWN: 'Osiągnięto limit wyszukiwania przed ustaleniem wykonalności',
      INVALID_INPUT: 'Scenariusz odrzucono z powodu nieprawidłowych lub niezaufanych danych',
    },
    modelEstimate: 'Dane syntetyczne · deterministyczny przydział z ograniczeniami · bez oceny nadużyć ani motywów',
  },
}
