import type { Locale } from '@/lib/observatory-i18n'

export type ContractorAllocationCopy = {
  eyebrow: string
  title: string
  subtitle: string
  synthetic: string
  run: string
  rerun: string
  viewAs: string
  scenario: string
  inputOwnership: string
  inputOwnershipIntro: string
  roles: Record<'INSPECTOR' | 'PROCUREMENT' | 'OPERATIONS' | 'PLANNER' | 'QDIP', string>
  roleHelp: Record<'INSPECTOR' | 'PROCUREMENT' | 'OPERATIONS' | 'PLANNER' | 'QDIP', string>
  presets: Record<'NORMAL' | 'CAPACITY_CONSTRAINED' | 'CONTRACT_COMMITMENT' | 'TE_UNCERTAINTY', string>
  presetHelp: Record<'NORMAL' | 'CAPACITY_CONSTRAINED' | 'CONTRACT_COMMITMENT' | 'TE_UNCERTAINTY', string>
  inspectorTitle: string
  procurementTitle: string
  operationsTitle: string
  plannerTitle: string
  qdipTitle: string
  unit: string
  territory: string
  workType: string
  quantity: string
  executionWindow: string
  requirements: string
  contractor: string
  contract: string
  rate: string
  remainingVolume: string
  capacity: string
  productivity: string
  labor: string
  equipment: string
  assignment: string
  autoAssigned: string
  pendingAllocation: string
  noManualSelection: string
  observedSpend: string
  qdipSpend: string
  allocationAdvantage: string
  spendWithChoice: string
  unitsWithChoice: string
  coverage: string
  counterfactualNote: string
  allocationTable: string
  observed: string
  qdip: string
  observedCost: string
  qdipCost: string
  delta: string
  decision: string
  details: string
  selectedContractor: string
  feasibleAlternatives: string
  rejectedAlternatives: string
  portfolioImpact: string
  localCost: string
  forcedPortfolio: string
  selected: string
  feasible: string
  infeasible: string
  unknown: string
  modelDiagnostics: string
  choiceSpread: string
  reservations: string
  globalChoiceUnknown: string
  optimizer: string
  exploredNodes: string
  snapshot: string
  decisionSpaceHint: string
  filters: Record<'all' | 'ALLOCATION_DECISION_REQUIRED' | 'NO_CHOICE' | 'EXCEPTION_REQUIRED' | 'INFEASIBLE', string>
  decisionLabels: Record<'ALLOCATION_DECISION_REQUIRED' | 'NO_CHOICE' | 'EXCEPTION_REQUIRED' | 'INFEASIBLE', string>
  reasons: Record<string, string>
  status: Record<string, string>
  modelEstimate: string
}

export const contractorAllocationI18n: Record<Locale, ContractorAllocationCopy> = {
  en: {
    eyebrow: 'QDIP · CONTRACTOR ALLOCATION',
    title: 'Contractor Allocation',
    subtitle: 'See the same work through each operational role, then let QDIP allocate the portfolio under contract, capacity and contractor-specific productivity constraints.',
    synthetic: 'Synthetic decision replay',
    run: 'Run QDIP allocation',
    rerun: 'Recalculate allocation',
    viewAs: 'View as',
    scenario: 'Scenario',
    inputOwnership: 'Decision inputs by role',
    inputOwnershipIntro: 'The demo separates who supplies scope, commercial terms and operational capacity from who receives the final contractor assignment.',
    roles: { INSPECTOR: 'Inspector', PROCUREMENT: 'Procurement', OPERATIONS: 'Operations', PLANNER: 'Planner', QDIP: 'QDIP' },
    roleHelp: {
      INSPECTOR: 'Approved work scope, quantity, location and technical requirements.',
      PROCUREMENT: 'Eligible contractors, contracts, rates and remaining commitments.',
      OPERATIONS: 'Capacity buckets, equipment and contractor-specific execution productivity.',
      PLANNER: 'Execution view. Contractor is assigned by QDIP; there is no manual vendor selector.',
      QDIP: 'Portfolio economics, global feasibility, alternatives and expected allocation advantage.',
    },
    presets: { NORMAL: 'Normal portfolio', CAPACITY_CONSTRAINED: 'Capacity constrained', CONTRACT_COMMITMENT: 'Contract commitment', TE_UNCERTAINTY: 'T&E uncertainty' },
    presetHelp: {
      NORMAL: 'Plenty of capacity: allocation is driven mostly by economics.',
      CAPACITY_CONSTRAINED: 'Cheap contractors cannot take all work, so QDIP must preserve scarce capacity for the highest-value assignments.',
      CONTRACT_COMMITMENT: 'A remaining contractual minimum changes the globally optimal allocation.',
      TE_UNCERTAINTY: 'Unknown T&E effort reserves resources but is excluded from the economic saving claim.',
    },
    inspectorTitle: 'Approved work',
    procurementTitle: 'Commercial constraints',
    operationsTitle: 'Operational capacity and productivity',
    plannerTitle: 'Planner release view',
    qdipTitle: 'Economic decision summary',
    unit: 'Unit', territory: 'Territory', workType: 'Work type', quantity: 'Quantity', executionWindow: 'Execution window', requirements: 'Requirements',
    contractor: 'Contractor', contract: 'Contract', rate: 'Rate', remainingVolume: 'Remaining volume', capacity: 'Capacity', productivity: 'Productivity', labor: 'Labor', equipment: 'Equipment',
    assignment: 'Contractor assignment', autoAssigned: 'Assigned automatically by QDIP', pendingAllocation: 'Pending QDIP allocation', noManualSelection: 'Planner view has no contractor dropdown or writeable contractor field.',
    observedSpend: 'Observed expected spend', qdipSpend: 'QDIP expected spend', allocationAdvantage: 'Expected allocation advantage', spendWithChoice: 'Spend under real choice', unitsWithChoice: 'Work with real choice', coverage: 'Economic coverage',
    counterfactualNote: 'Counterfactual model estimate, not realized savings.',
    allocationTable: 'Allocation replay', observed: 'Observed contractor', qdip: 'QDIP contractor', observedCost: 'Observed cost', qdipCost: 'QDIP cost', delta: 'Expected advantage', decision: 'Decision type', details: 'Decision detail', selectedContractor: 'Selected contractor',
    feasibleAlternatives: 'Feasible alternatives', rejectedAlternatives: 'Rejected alternatives', portfolioImpact: 'Portfolio impact', localCost: 'Local expected cost', forcedPortfolio: 'Forced portfolio delta', selected: 'Selected', feasible: 'Globally feasible', infeasible: 'Globally infeasible', unknown: 'Not proven',
    modelDiagnostics: 'Model diagnostics', choiceSpread: 'Spend-weighted global choice spread', reservations: 'Cost-uncertain reservations', globalChoiceUnknown: 'Choice feasibility unresolved', optimizer: 'Optimizer', exploredNodes: 'Search nodes', snapshot: 'Scenario snapshot',
    decisionSpaceHint: 'Real choice means at least two contractors can each participate in a globally feasible portfolio. Portfolio delta shows the cost of forcing that contractor for this work.',
    filters: { all: 'All', ALLOCATION_DECISION_REQUIRED: 'Local choice', NO_CHOICE: 'No local choice', EXCEPTION_REQUIRED: 'Exception', INFEASIBLE: 'Blocked' },
    decisionLabels: { ALLOCATION_DECISION_REQUIRED: 'Allocation alternatives', NO_CHOICE: 'No contractor choice', EXCEPTION_REQUIRED: 'Cost exception', INFEASIBLE: 'No feasible contractor' },
    reasons: {
      CONTRACT_OUTSIDE_EXECUTION_WINDOW: 'Contract does not cover the execution window.', NOT_APPROVED: 'Contractor is not approved.', TERRITORY_NOT_ALLOWED: 'Contract does not cover this territory.', WORK_TYPE_NOT_ALLOWED: 'Contract does not cover this work type.', NO_CAPACITY: 'Insufficient contractor-specific capacity.', CAPACITY_BUCKET_MISSING: 'Capacity is missing for a required period.', MISSING_EQUIPMENT: 'Required equipment is unavailable.', MISSING_CERTIFICATION: 'Required certification is unavailable.', SLA_IMPOSSIBLE: 'Execution exceeds the deadline.', CONTRACT_VOLUME_LIMIT: 'Remaining contract volume is insufficient.', RATE_NOT_CONFIGURED: 'No rate is configured for this work.', UNTRUSTED_INPUT: 'Input ownership metadata is inconsistent.', INVALID_SCENARIO_INPUT: 'Scenario invariants are invalid.', 'T&E_REQUIRES_EXCEPTION': 'T&E effort cannot be costed.'
    },
    status: { OPTIMAL: 'Optimal portfolio proven', PARTIAL_OPTIMAL: 'Covered work optimized; uncertain work reserved', FEASIBLE_NOT_PROVEN: 'Feasible portfolio found; optimum not proven', PARTIAL_FEASIBLE_NOT_PROVEN: 'Partial feasible portfolio found; optimum not proven', INFEASIBLE: 'Portfolio infeasible', UNKNOWN: 'Search limit reached', INVALID_INPUT: 'Scenario input invalid' },
    modelEstimate: 'Synthetic demo · contractor-specific productivity · constrained portfolio optimization · no fraud or motive inference',
  },
  uk: {
    eyebrow: 'QDIP · РОЗПОДІЛ РОБІТ МІЖ ПІДРЯДНИКАМИ',
    title: 'Розподіл робіт між підрядниками',
    subtitle: 'Перегляньте ті самі роботи очима різних ролей, а потім дозвольте QDIP розподілити портфель з урахуванням договорів, потужності та різної продуктивності підрядників.',
    synthetic: 'Синтетичне відтворення рішення',
    run: 'Запустити розподіл QDIP', rerun: 'Перерахувати розподіл', viewAs: 'Перегляд від ролі', scenario: 'Сценарій',
    inputOwnership: 'Вхідні дані за ролями', inputOwnershipIntro: 'Демо розділяє ролі, що задають обсяг робіт, комерційні умови й операційну потужність, від ролі, яка отримує готове призначення підрядника.',
    roles: { INSPECTOR: 'Інспектор', PROCUREMENT: 'Закупівлі', OPERATIONS: 'Операції', PLANNER: 'Планувальник', QDIP: 'QDIP' },
    roleHelp: {
      INSPECTOR: 'Затверджений обсяг робіт, кількість, місце та технічні вимоги.', PROCUREMENT: 'Допустимі підрядники, договори, ставки та залишок зобов’язань.', OPERATIONS: 'Потужність за періодами, обладнання та продуктивність конкретних підрядників.', PLANNER: 'Виконання робіт. Підрядника призначає QDIP; ручного селектора немає.', QDIP: 'Економіка портфеля, глобальна допустимість, альтернативи та очікувана перевага розподілу.'
    },
    presets: { NORMAL: 'Звичайний портфель', CAPACITY_CONSTRAINED: 'Обмежена потужність', CONTRACT_COMMITMENT: 'Договірне зобов’язання', TE_UNCERTAINTY: 'Невизначеність T&E' },
    presetHelp: {
      NORMAL: 'Потужності достатньо: розподіл переважно визначає економіка.', CAPACITY_CONSTRAINED: 'Дешеві підрядники не можуть забрати всі роботи, тому QDIP береже дефіцитну потужність для робіт із найбільшою економічною перевагою.', CONTRACT_COMMITMENT: 'Залишковий мінімум за договором змінює глобально оптимальний розподіл.', TE_UNCERTAINTY: 'Невідомий обсяг T&E резервує ресурси, але не входить у заявлену економічну перевагу.'
    },
    inspectorTitle: 'Затверджені роботи', procurementTitle: 'Комерційні обмеження', operationsTitle: 'Операційна потужність і продуктивність', plannerTitle: 'Робоче місце планувальника', qdipTitle: 'Економічний підсумок рішення',
    unit: 'Робота', territory: 'Територія', workType: 'Тип робіт', quantity: 'Кількість', executionWindow: 'Вікно виконання', requirements: 'Вимоги', contractor: 'Підрядник', contract: 'Договір', rate: 'Ставка', remainingVolume: 'Залишок обсягу', capacity: 'Потужність', productivity: 'Продуктивність', labor: 'Праця', equipment: 'Обладнання',
    assignment: 'Призначення підрядника', autoAssigned: 'Автоматично призначено QDIP', pendingAllocation: 'Очікує розподілу QDIP', noManualSelection: 'У view планувальника немає dropdown або іншого поля для ручного вибору підрядника.',
    observedSpend: 'Очікувані витрати фактичного розподілу', qdipSpend: 'Очікувані витрати QDIP', allocationAdvantage: 'Очікувана перевага розподілу', spendWithChoice: 'Витрати з реальним вибором', unitsWithChoice: 'Роботи з реальним вибором', coverage: 'Економічне покриття', counterfactualNote: 'Контрфактична модельна оцінка, а не фактично отримана економія.',
    allocationTable: 'Відтворення розподілу', observed: 'Фактичний підрядник', qdip: 'Підрядник QDIP', observedCost: 'Фактична оцінка', qdipCost: 'Оцінка QDIP', delta: 'Очікувана перевага', decision: 'Тип рішення', details: 'Деталі рішення', selectedContractor: 'Обраний підрядник',
    feasibleAlternatives: 'Допустимі альтернативи', rejectedAlternatives: 'Відхилені альтернативи', portfolioImpact: 'Вплив на портфель', localCost: 'Локальна очікувана вартість', forcedPortfolio: 'Зміна вартості портфеля при примусовому виборі', selected: 'Обрано', feasible: 'Глобально допустимо', infeasible: 'Глобально недопустимо', unknown: 'Не доведено',
    modelDiagnostics: 'Діагностика моделі', choiceSpread: 'Зважена різниця глобально допустимих варіантів', reservations: 'Резервування з невідомою вартістю', globalChoiceUnknown: 'Глобальний вибір не доведено', optimizer: 'Оптимізатор', exploredNodes: 'Вузлів пошуку', snapshot: 'Знімок сценарію',
    decisionSpaceHint: 'Реальний вибір існує лише тоді, коли щонайменше два підрядники можуть входити до глобально допустимого портфеля. Portfolio delta показує ціну примусового вибору конкретного підрядника.',
    filters: { all: 'Усі', ALLOCATION_DECISION_REQUIRED: 'Локальний вибір', NO_CHOICE: 'Без локального вибору', EXCEPTION_REQUIRED: 'Виняток', INFEASIBLE: 'Заблоковано' },
    decisionLabels: { ALLOCATION_DECISION_REQUIRED: 'Альтернативи розподілу', NO_CHOICE: 'Немає вибору підрядника', EXCEPTION_REQUIRED: 'Виняток вартості', INFEASIBLE: 'Немає допустимого підрядника' },
    reasons: {
      CONTRACT_OUTSIDE_EXECUTION_WINDOW: 'Договір не покриває вікно виконання.', NOT_APPROVED: 'Підрядник не затверджений.', TERRITORY_NOT_ALLOWED: 'Договір не покриває цю територію.', WORK_TYPE_NOT_ALLOWED: 'Договір не покриває цей тип робіт.', NO_CAPACITY: 'Бракує потужності конкретного підрядника.', CAPACITY_BUCKET_MISSING: 'Для потрібного періоду немає даних про потужність.', MISSING_EQUIPMENT: 'Немає потрібного обладнання.', MISSING_CERTIFICATION: 'Немає потрібної сертифікації.', SLA_IMPOSSIBLE: 'Виконання виходить за строк.', CONTRACT_VOLUME_LIMIT: 'Недостатньо залишку обсягу договору.', RATE_NOT_CONFIGURED: 'Для цієї роботи немає ставки.', UNTRUSTED_INPUT: 'Метадані власника входу неузгоджені.', INVALID_SCENARIO_INPUT: 'Порушено інваріанти сценарію.', 'T&E_REQUIRES_EXCEPTION': 'Неможливо оцінити T&E.'
    },
    status: { OPTIMAL: 'Оптимальність портфеля доведено', PARTIAL_OPTIMAL: 'Покриті роботи оптимізовано; невизначені зарезервовано', FEASIBLE_NOT_PROVEN: 'Допустимий портфель знайдено; оптимальність не доведено', PARTIAL_FEASIBLE_NOT_PROVEN: 'Частковий портфель знайдено; оптимальність не доведено', INFEASIBLE: 'Портфель недопустимий', UNKNOWN: 'Досягнуто ліміту пошуку', INVALID_INPUT: 'Некоректні входи сценарію' },
    modelEstimate: 'Синтетичне демо · різна продуктивність підрядників · обмежена оптимізація портфеля · без оцінки шахрайства чи мотивів',
  },
  pl: {
    eyebrow: 'QDIP · PRZYDZIAŁ PRAC WYKONAWCOM', title: 'Przydział prac wykonawcom', subtitle: 'Zobacz te same prace z perspektywy różnych ról, a następnie pozwól QDIP rozdzielić portfel z uwzględnieniem umów, mocy i różnej produktywności wykonawców.', synthetic: 'Syntetyczne odtworzenie decyzji', run: 'Uruchom przydział QDIP', rerun: 'Przelicz przydział', viewAs: 'Widok roli', scenario: 'Scenariusz', inputOwnership: 'Dane wejściowe według roli', inputOwnershipIntro: 'Demo rozdziela role dostarczające zakres prac, warunki handlowe i zdolność operacyjną od roli otrzymującej gotowy przydział wykonawcy.',
    roles: { INSPECTOR: 'Inspektor', PROCUREMENT: 'Zakupy', OPERATIONS: 'Operacje', PLANNER: 'Planista', QDIP: 'QDIP' },
    roleHelp: { INSPECTOR: 'Zatwierdzony zakres, ilość, lokalizacja i wymagania techniczne.', PROCUREMENT: 'Dopuszczeni wykonawcy, umowy, stawki i pozostałe zobowiązania.', OPERATIONS: 'Moc w okresach, sprzęt i produktywność konkretnego wykonawcy.', PLANNER: 'Widok wykonania. Wykonawcę przydziela QDIP; brak ręcznego selektora.', QDIP: 'Ekonomika portfela, globalna wykonalność, alternatywy i oczekiwana przewaga przydziału.' },
    presets: { NORMAL: 'Normalny portfel', CAPACITY_CONSTRAINED: 'Ograniczona moc', CONTRACT_COMMITMENT: 'Zobowiązanie umowne', TE_UNCERTAINTY: 'Niepewność T&E' },
    presetHelp: { NORMAL: 'Mocy jest dużo: przydział wynika głównie z ekonomiki.', CAPACITY_CONSTRAINED: 'Tańsi wykonawcy nie mogą przejąć wszystkich prac, więc QDIP zachowuje deficytową moc dla zadań o najwyższej wartości.', CONTRACT_COMMITMENT: 'Pozostałe minimum umowne zmienia globalnie optymalny przydział.', TE_UNCERTAINTY: 'Nieznany nakład T&E rezerwuje zasoby, lecz nie wchodzi do deklarowanej przewagi ekonomicznej.' },
    inspectorTitle: 'Zatwierdzone prace', procurementTitle: 'Ograniczenia handlowe', operationsTitle: 'Moc operacyjna i produktywność', plannerTitle: 'Widok planisty', qdipTitle: 'Ekonomiczne podsumowanie decyzji', unit: 'Praca', territory: 'Obszar', workType: 'Rodzaj pracy', quantity: 'Ilość', executionWindow: 'Okno wykonania', requirements: 'Wymagania', contractor: 'Wykonawca', contract: 'Umowa', rate: 'Stawka', remainingVolume: 'Pozostały wolumen', capacity: 'Moc', productivity: 'Produktywność', labor: 'Praca', equipment: 'Sprzęt', assignment: 'Przydział wykonawcy', autoAssigned: 'Przydzielono automatycznie przez QDIP', pendingAllocation: 'Oczekuje na przydział QDIP', noManualSelection: 'Widok planisty nie zawiera listy ani pola do ręcznego wyboru wykonawcy.',
    observedSpend: 'Oczekiwany koszt obserwowanego przydziału', qdipSpend: 'Oczekiwany koszt QDIP', allocationAdvantage: 'Oczekiwana przewaga przydziału', spendWithChoice: 'Wydatki z realnym wyborem', unitsWithChoice: 'Prace z realnym wyborem', coverage: 'Pokrycie ekonomiczne', counterfactualNote: 'Kontrfaktyczna estymacja modelu, a nie zrealizowana oszczędność.', allocationTable: 'Odtworzenie przydziału', observed: 'Obserwowany wykonawca', qdip: 'Wykonawca QDIP', observedCost: 'Koszt obserwowany', qdipCost: 'Koszt QDIP', delta: 'Oczekiwana przewaga', decision: 'Typ decyzji', details: 'Szczegóły decyzji', selectedContractor: 'Wybrany wykonawca', feasibleAlternatives: 'Wykonalne alternatywy', rejectedAlternatives: 'Odrzucone alternatywy', portfolioImpact: 'Wpływ na portfel', localCost: 'Lokalny oczekiwany koszt', forcedPortfolio: 'Zmiana kosztu portfela przy wymuszonym wyborze', selected: 'Wybrano', feasible: 'Globalnie wykonalne', infeasible: 'Globalnie niewykonalne', unknown: 'Nieudowodnione', modelDiagnostics: 'Diagnostyka modelu', choiceSpread: 'Ważone zróżnicowanie globalnych opcji', reservations: 'Rezerwacje o nieznanym koszcie', globalChoiceUnknown: 'Nieustalona wykonalność wyboru', optimizer: 'Optymalizator', exploredNodes: 'Węzły wyszukiwania', snapshot: 'Migawka scenariusza', decisionSpaceHint: 'Realny wybór istnieje tylko wtedy, gdy co najmniej dwóch wykonawców może należeć do globalnie wykonalnego portfela. Delta portfela pokazuje koszt wymuszenia konkretnego wykonawcy.',
    filters: { all: 'Wszystkie', ALLOCATION_DECISION_REQUIRED: 'Wybór lokalny', NO_CHOICE: 'Bez wyboru lokalnego', EXCEPTION_REQUIRED: 'Wyjątek', INFEASIBLE: 'Zablokowane' }, decisionLabels: { ALLOCATION_DECISION_REQUIRED: 'Alternatywy przydziału', NO_CHOICE: 'Brak wyboru wykonawcy', EXCEPTION_REQUIRED: 'Wyjątek kosztowy', INFEASIBLE: 'Brak wykonalnego wykonawcy' }, reasons: { CONTRACT_OUTSIDE_EXECUTION_WINDOW: 'Umowa nie obejmuje okna wykonania.', NOT_APPROVED: 'Wykonawca nie jest zatwierdzony.', TERRITORY_NOT_ALLOWED: 'Umowa nie obejmuje tego obszaru.', WORK_TYPE_NOT_ALLOWED: 'Umowa nie obejmuje tego rodzaju pracy.', NO_CAPACITY: 'Brakuje mocy konkretnego wykonawcy.', CAPACITY_BUCKET_MISSING: 'Brakuje danych o mocy dla wymaganego okresu.', MISSING_EQUIPMENT: 'Brak wymaganego sprzętu.', MISSING_CERTIFICATION: 'Brak wymaganej certyfikacji.', SLA_IMPOSSIBLE: 'Wykonanie przekracza termin.', CONTRACT_VOLUME_LIMIT: 'Pozostały wolumen umowy jest niewystarczający.', RATE_NOT_CONFIGURED: 'Brak stawki dla tej pracy.', UNTRUSTED_INPUT: 'Metadane właściciela wejścia są niespójne.', INVALID_SCENARIO_INPUT: 'Naruszono niezmienniki scenariusza.', 'T&E_REQUIRES_EXCEPTION': 'Nie można wycenić T&E.' }, status: { OPTIMAL: 'Udowodniono optymalność portfela', PARTIAL_OPTIMAL: 'Pokryte prace zoptymalizowano; niepewne zarezerwowano', FEASIBLE_NOT_PROVEN: 'Znaleziono wykonalny portfel; optymalności nie udowodniono', PARTIAL_FEASIBLE_NOT_PROVEN: 'Znaleziono częściowy portfel; optymalności nie udowodniono', INFEASIBLE: 'Portfel niewykonalny', UNKNOWN: 'Osiągnięto limit wyszukiwania', INVALID_INPUT: 'Nieprawidłowe dane scenariusza' }, modelEstimate: 'Syntetyczne demo · produktywność zależna od wykonawcy · ograniczona optymalizacja portfela · bez oceny nadużyć ani motywów',
  },
}
