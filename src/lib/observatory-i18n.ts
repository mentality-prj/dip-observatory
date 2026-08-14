import type { ObservatoryScenario } from "@/lib/dip-contracts";

export const LOCALE_STORAGE_KEY = "dip-observatory-locale";
export const SUPPORTED_LOCALES = ["en", "uk", "pl"] as const;
export const DEFAULT_LOCALE: Locale = "en";

export type Locale = (typeof SUPPORTED_LOCALES)[number];

type ScenarioFieldOverride = {
  label?: string;
  hint?: string | null;
};

type ScenarioPresetOverride = {
  label?: string;
  description?: string;
};

type ScenarioTextOverride = {
  name?: string;
  description?: string;
  domain?: string;
  axes?: Partial<Record<string, string>>;
  fields?: Record<string, ScenarioFieldOverride>;
  presets?: Record<string, ScenarioPresetOverride>;
};

export type ObservatoryCopy = {
  localeLabel: string;
  localeOptions: Record<Locale, string>;
  shell: {
    frontendClientOnly: string;
    decisionSemanticsStay: string;
    title: string;
    description: string;
  };
  stats: {
    connection: string;
    configured: string;
    missing: string;
    scenarioCatalog: string;
    scenariosUnit: string;
    unavailable: string;
    noScenarioSelected: string;
    runSurface: string;
    ready: string;
    runSurfaceDetail: string;
    comparisonMode: string;
    alternativesUnit: string;
    comparisonModeDetail: string;
    setDipConfig: string;
  };
  actions: {
    resetInputs: string;
    runLiveScenario: string;
    runningDip: string;
    selected: string;
    load: string;
    inspect: string;
  };
  tabs: {
    catalog: string;
    inputs: string;
    overview: string;
    alternatives: string;
    evidence: string;
  };
  sections: {
    configurationTitle: string;
    configurationDescription: string;
    scenarioCatalogTitle: string;
    scenarioCatalogSubtitle: string;
    scenarioCatalogDemoSubtitle: string;
    selectedScenarioTitle: string;
    stateSpaceTitle: string;
    stateSpaceDescription: string;
    stateTimelineTitle: string;
    stateTimelineDescription: string;
    decisionAnalysisTitle: string;
    decisionAnalysisDescription: string;
    alternativeComparisonTitle: string;
    alternativeComparisonSubtitle: string;
    decisionAlternativesTitle: string;
    decisionAlternativesSubtitle: string;
    whyDecisionTitle: string;
    whyDecisionSubtitle: string;
    ruleEvidenceTitle: string;
    ruleEvidenceSubtitle: string;
  };
  labels: {
    model: string;
    dataset: string;
    selectedPath: string;
    currentState: string;
    predictedState: string;
    matchedRule: string;
    execution: string;
    uncertaintyInterval: string;
    rank: string;
    riskShort: string;
    confidenceShort: string;
    apiBadge: string;
    comparisonBadge: string;
    na: string;
  };
  notices: {
    dipNotConnected: string;
    bootstrapFromApi: string;
    observatoryNeedsPayload: string;
    demoInputsLocked: string;
    noAlternativeDecisions: string;
    noExplanation: string;
    noRuleEvidence: string;
    chooseScenario: string;
    runTwoAlternatives: string;
  };
  chart: {
    ariaLabel: string;
    axisFallbackX: string;
    axisFallbackY: string;
    waitingTitle: string;
    waitingDescription: string;
    loading: string;
  };
  timeline: {
    empty: string;
    currentState: string;
    predictedState: string;
    optimisticBranch: string;
    conservativeBranch: string;
    noBranchAvailable: string;
  };
  fieldTypes: {
    number: string;
    boolean: string;
    text: string;
    enabled: string;
    disabled: string;
  };
  metrics: {
    decision: string;
    confidence: string;
    uncertainty: string;
    risk: string;
    systemStability: string;
    propagationRisk: string;
    decisionDetail: string;
    confidenceDetail: string;
    uncertaintyDetail: string;
    riskDetail: string;
    systemStabilityDetail: string;
    propagationRiskDetail: string;
    riskDelta: string;
    confidenceDelta: string;
    stabilityDelta: string;
    decisionShift: string;
    versusDetail: string;
    stabilityDeltaDetail: string;
    decisionShiftDetail: string;
    uncertaintyEnvelope: string;
  };
  evidence: {
    observed: string;
    pass: string;
    fail: string;
  };
};

const copyByLocale: Record<Locale, ObservatoryCopy> = {
  en: {
    localeLabel: "Language",
    localeOptions: { en: "English", uk: "Українська", pl: "Polski" },
    shell: {
      frontendClientOnly: "Frontend Client Only",
      decisionSemanticsStay: "Decision semantics stay in DIP",
      title: "Scenario-driven Observatory for the existing DIP API.",
      description:
        "The UI remains a standalone Next.js client, while DIP now owns the scenario catalog, risk propagation, system stability, uncertainty, state vectors, and decision alternatives returned by the observatory contract.",
    },
    stats: {
      connection: "Connection",
      configured: "Configured",
      missing: "Missing",
      scenarioCatalog: "Scenario Catalog",
      scenariosUnit: "scenarios",
      unavailable: "Unavailable",
      noScenarioSelected: "No scenario selected",
      runSurface: "Run Surface",
      ready: "Ready",
      runSurfaceDetail:
        "Runs full Observatory analysis inside DIP, then returns it through the Next.js server-side proxy.",
      comparisonMode: "Comparison Mode",
      alternativesUnit: "alternatives",
      comparisonModeDetail:
        "Scenario presets come from the DIP API and execute under the same analysis contract.",
      setDipConfig: "Set DIP_API_BASE_URL and DIP_API_KEY",
    },
    actions: {
      resetInputs: "Reset Inputs",
      runLiveScenario: "Run Live Scenario",
      runningDip: "Running DIP...",
      selected: "Selected",
      load: "Load",
      inspect: "Inspect",
    },
    tabs: {
      catalog: "Catalog",
      inputs: "Inputs",
      overview: "Overview",
      alternatives: "Alternatives",
      evidence: "Evidence",
    },
    sections: {
      configurationTitle: "Configuration / Input",
      configurationDescription:
        "Choose one of the DIP-served scenarios, inspect its preset alternatives, and run the live analysis contract.",
      scenarioCatalogTitle: "Scenario Catalog",
      scenarioCatalogSubtitle:
        "Five domain scenarios are served by DIP and selected here without changing the overall UI architecture.",
      scenarioCatalogDemoSubtitle:
        "Presentation mode is pinned to one curated scenario and preset alternatives for reproducible demos.",
      selectedScenarioTitle: "Selected Scenario",
      stateSpaceTitle: "State-Space Projection",
      stateSpaceDescription:
        "A 2D projection of API-returned current state, predicted state, uncertainty, and future trajectories for the selected scenario branch.",
      stateTimelineTitle: "State Timeline",
      stateTimelineDescription:
        "Tracks the selected branch from the current state to the optimistic and conservative futures returned by DIP.",
      decisionAnalysisTitle: "Decision Analysis",
      decisionAnalysisDescription:
        "All primary metrics in this panel come directly from the DIP observatory contract. The client only formats and compares them.",
      alternativeComparisonTitle: "Alternative Comparison",
      alternativeComparisonSubtitle:
        "Baseline vs challenger under the same live DIP scenario contract",
      decisionAlternativesTitle: "Decision Alternatives",
      decisionAlternativesSubtitle:
        "Counterfactual decisions and outcome/risk trade-offs returned directly by DIP",
      whyDecisionTitle: "Why This Decision",
      whyDecisionSubtitle:
        "Explanation bullets returned by the DIP observatory run contract",
      ruleEvidenceTitle: "Rule Evidence",
      ruleEvidenceSubtitle:
        "Condition-level traces surfaced directly by the DIP scenario workflow",
    },
    labels: {
      model: "Model",
      dataset: "Dataset",
      selectedPath: "Selected path",
      currentState: "Current State",
      predictedState: "Predicted State",
      matchedRule: "Matched Rule",
      execution: "Execution",
      uncertaintyInterval: "Uncertainty Interval",
      rank: "Rank",
      riskShort: "Risk",
      confidenceShort: "Conf",
      apiBadge: "API",
      comparisonBadge: "CMP",
      na: "N/A",
    },
    notices: {
      dipNotConnected: "DIP not connected",
      bootstrapFromApi:
        "Configure DIP credentials to bootstrap Observatory from the API.",
      observatoryNeedsPayload:
        "Observatory needs a live DIP bootstrap payload before scenario inputs can be edited.",
      demoInputsLocked:
        "Demo mode locks preset inputs so the same scenario produces a reproducible presentation state on every reset and rerun.",
      noAlternativeDecisions:
        "No alternative decisions were returned for the selected branch.",
      noExplanation: "No explanation was returned for the selected path.",
      noRuleEvidence: "No rule evidence was returned for the selected branch.",
      chooseScenario:
        "Choose a scenario and run a live analysis to inspect DIP outputs.",
      runTwoAlternatives: "Run two alternatives to unlock comparison deltas.",
    },
    chart: {
      ariaLabel: "DIP state-space projection chart",
      axisFallbackX: "STATE AXIS X",
      axisFallbackY: "STATE AXIS Y",
      waitingTitle: "State-space projection is awaiting a live DIP run.",
      waitingDescription:
        "Select one of the DIP-served scenarios and run it to populate the chart with API-returned current state, predicted state, trajectories, and uncertainty.",
      loading: "Running live DIP calculation...",
    },
    timeline: {
      empty:
        "Timeline becomes available after the first live DIP observatory run.",
      currentState: "Current State",
      predictedState: "Predicted State",
      optimisticBranch: "Optimistic Branch",
      conservativeBranch: "Conservative Branch",
      noBranchAvailable: "No branch available",
    },
    fieldTypes: {
      number: "number",
      boolean: "boolean",
      text: "text",
      enabled: "Enabled",
      disabled: "Disabled",
    },
    metrics: {
      decision: "Decision",
      confidence: "Confidence",
      uncertainty: "Uncertainty",
      risk: "Risk",
      systemStability: "System Stability",
      propagationRisk: "Propagation Risk",
      decisionDetail: "Returned by the DIP observatory scenario workflow.",
      confidenceDetail:
        "API-sourced confidence for the selected scenario branch.",
      uncertaintyDetail: "Returned by the DIP observatory run contract.",
      riskDetail: "Scenario-level branch risk returned directly by DIP.",
      systemStabilityDetail:
        "API-sourced system stability metric from the observatory run.",
      propagationRiskDetail:
        "API-sourced downstream risk propagation indicator.",
      riskDelta: "Risk Delta",
      confidenceDelta: "Confidence Delta",
      stabilityDelta: "Stability Delta",
      decisionShift: "Decision Shift",
      versusDetail: "from the same DIP scenario run.",
      stabilityDeltaDetail:
        "Difference between API-returned stability outcomes.",
      decisionShiftDetail:
        "Shows whether the alternative path changes the selected DIP decision.",
      uncertaintyEnvelope: "envelope from DIP",
    },
    evidence: {
      observed: "observed",
      pass: "pass",
      fail: "fail",
    },
  },
  uk: {
    localeLabel: "Мова",
    localeOptions: { en: "English", uk: "Українська", pl: "Polski" },
    shell: {
      frontendClientOnly: "Лише frontend-клієнт",
      decisionSemanticsStay: "Семантика рішень лишається в DIP",
      title: "Scenario-driven Observatory для існуючого DIP API.",
      description:
        "UI лишається окремим Next.js клієнтом, а DIP керує каталогом сценаріїв, propagation risk, system stability, uncertainty, state vectors і decision alternatives, які повертає observatory contract.",
    },
    stats: {
      connection: "З'єднання",
      configured: "Налаштовано",
      missing: "Відсутнє",
      scenarioCatalog: "Каталог сценаріїв",
      scenariosUnit: "сценаріїв",
      unavailable: "Недоступно",
      noScenarioSelected: "Сценарій не вибрано",
      runSurface: "Run Surface",
      ready: "Готово",
      runSurfaceDetail:
        "Запускає повний Observatory analysis всередині DIP і повертає його через server-side proxy у Next.js.",
      comparisonMode: "Режим порівняння",
      alternativesUnit: "альтернативи",
      comparisonModeDetail:
        "Scenario presets приходять з DIP API і виконуються в межах одного analysis contract.",
      setDipConfig: "Вкажи DIP_API_BASE_URL і DIP_API_KEY",
    },
    actions: {
      resetInputs: "Скинути входи",
      runLiveScenario: "Запустити live сценарій",
      runningDip: "Запуск DIP...",
      selected: "Вибрано",
      load: "Завантажити",
      inspect: "Переглянути",
    },
    tabs: {
      catalog: "Сценарії",
      inputs: "Входи",
      overview: "Огляд",
      alternatives: "Альтернативи",
      evidence: "Докази",
    },
    sections: {
      configurationTitle: "Конфігурація / Вхід",
      configurationDescription:
        "Вибери один зі сценаріїв, які віддає DIP, переглянь preset alternatives і запусти live analysis contract.",
      scenarioCatalogTitle: "Каталог сценаріїв",
      scenarioCatalogSubtitle:
        "П'ять доменних сценаріїв віддаються з DIP і обираються тут без зміни загальної архітектури UI.",
      scenarioCatalogDemoSubtitle:
        "Режим презентації фіксує один curated scenario і preset alternatives для відтворюваних демонстрацій.",
      selectedScenarioTitle: "Вибраний сценарій",
      stateSpaceTitle: "Проєкція простору станів",
      stateSpaceDescription:
        "2D-проєкція current state, predicted state, uncertainty та future trajectories, які повертає API для вибраної гілки сценарію.",
      stateTimelineTitle: "Таймлайн стану",
      stateTimelineDescription:
        "Показує вибрану гілку від current state до optimistic і conservative futures, які повертає DIP.",
      decisionAnalysisTitle: "Аналіз рішення",
      decisionAnalysisDescription:
        "Усі основні метрики на цій панелі приходять напряму з observatory contract у DIP. Клієнт лише форматує і порівнює їх.",
      alternativeComparisonTitle: "Порівняння альтернатив",
      alternativeComparisonSubtitle:
        "Базова та альтернативна траєкторії в межах одного live DIP scenario contract",
      decisionAlternativesTitle: "Альтернативи рішення",
      decisionAlternativesSubtitle:
        "Counterfactual decisions та компроміси outcome/risk, які повертає DIP",
      whyDecisionTitle: "Чому саме це рішення",
      whyDecisionSubtitle:
        "Explanation bullets, які повертає DIP observatory run contract",
      ruleEvidenceTitle: "Підтвердження правил",
      ruleEvidenceSubtitle:
        "Condition-level traces, які напряму повертає DIP scenario workflow",
    },
    labels: {
      model: "Модель",
      dataset: "Набір даних",
      selectedPath: "Вибрана траєкторія",
      currentState: "Поточний стан",
      predictedState: "Прогнозований стан",
      matchedRule: "Спрацьоване правило",
      execution: "Виконання",
      uncertaintyInterval: "Інтервал невизначеності",
      rank: "Ранг",
      riskShort: "Ризик",
      confidenceShort: "Дов.",
      apiBadge: "API",
      comparisonBadge: "ПОР",
      na: "н/д",
    },
    notices: {
      dipNotConnected: "DIP не підключено",
      bootstrapFromApi:
        "Налаштуй облікові дані DIP, щоб bootstrap-нути Observatory з API.",
      observatoryNeedsPayload:
        "Observatory потребує live bootstrap payload від DIP, перш ніж можна буде редагувати inputs сценарію.",
      demoInputsLocked:
        "Demo mode блокує preset inputs, щоб один і той самий сценарій давав відтворюваний presentation state після reset і rerun.",
      noAlternativeDecisions:
        "Для вибраної гілки не повернуто альтернативних рішень.",
      noExplanation: "Для вибраної траєкторії не повернуто пояснення.",
      noRuleEvidence: "Для вибраної гілки не повернуто доказів rule evidence.",
      chooseScenario:
        "Вибери сценарій і запусти live analysis, щоб переглянути outputs від DIP.",
      runTwoAlternatives:
        "Запусти дві альтернативи, щоб побачити comparison deltas.",
    },
    chart: {
      ariaLabel: "Графік проєкції простору станів DIP",
      axisFallbackX: "ВІСЬ СТАНУ X",
      axisFallbackY: "ВІСЬ СТАНУ Y",
      waitingTitle: "Проєкція простору станів очікує live запуск DIP.",
      waitingDescription:
        "Вибери один зі сценаріїв DIP і запусти його, щоб наповнити графік current state, predicted state, trajectories та uncertainty з API.",
      loading: "Виконується live-розрахунок DIP...",
    },
    timeline: {
      empty:
        "Таймлайн стане доступним після першого live Observatory run у DIP.",
      currentState: "Поточний стан",
      predictedState: "Прогнозований стан",
      optimisticBranch: "Оптимістична гілка",
      conservativeBranch: "Консервативна гілка",
      noBranchAvailable: "Гілка недоступна",
    },
    fieldTypes: {
      number: "число",
      boolean: "логічне",
      text: "текст",
      enabled: "Увімкнено",
      disabled: "Вимкнено",
    },
    metrics: {
      decision: "Рішення",
      confidence: "Довіра",
      uncertainty: "Невизначеність",
      risk: "Ризик",
      systemStability: "Стійкість системи",
      propagationRisk: "Ризик поширення",
      decisionDetail:
        "Повертається scenario workflow всередині DIP observatory.",
      confidenceDetail:
        "Оцінка довіри, яка напряму приходить з API для вибраної гілки сценарію.",
      uncertaintyDetail:
        "Рівень невизначеності, який повертає DIP observatory run contract.",
      riskDetail: "Ризик гілки сценарію, який напряму повертає DIP.",
      systemStabilityDetail:
        "Метрика system stability, яку напряму повертає observatory run.",
      propagationRiskDetail:
        "Метрика downstream risk propagation, яку напряму повертає DIP.",
      riskDelta: "Дельта ризику",
      confidenceDelta: "Дельта довіри",
      stabilityDelta: "Дельта стійкості",
      decisionShift: "Зміна рішення",
      versusDetail: "в межах одного запуску DIP scenario.",
      stabilityDeltaDetail: "Різниця між stability outcomes, які повернув API.",
      decisionShiftDetail:
        "Показує, чи змінює альтернативний шлях вибране рішення DIP.",
      uncertaintyEnvelope: "envelope від DIP",
    },
    evidence: {
      observed: "спостережено",
      pass: "pass",
      fail: "fail",
    },
  },
  pl: {
    localeLabel: "Język",
    localeOptions: { en: "English", uk: "Українська", pl: "Polski" },
    shell: {
      frontendClientOnly: "Tylko frontend client",
      decisionSemanticsStay: "Semantyka decyzji pozostaje w DIP",
      title: "Scenario-driven Observatory dla istniejącego DIP API.",
      description:
        "UI pozostaje osobnym klientem Next.js, a DIP zarządza katalogiem scenariuszy, propagation risk, system stability, uncertainty, state vectors oraz decision alternatives zwracanymi przez observatory contract.",
    },
    stats: {
      connection: "Połączenie",
      configured: "Skonfigurowane",
      missing: "Brak",
      scenarioCatalog: "Katalog scenariuszy",
      scenariosUnit: "scenariuszy",
      unavailable: "Niedostępne",
      noScenarioSelected: "Nie wybrano scenariusza",
      runSurface: "Run Surface",
      ready: "Gotowe",
      runSurfaceDetail:
        "Uruchamia pełną analizę Observatory wewnątrz DIP i zwraca ją przez server-side proxy w Next.js.",
      comparisonMode: "Tryb porównania",
      alternativesUnit: "alternatywy",
      comparisonModeDetail:
        "Scenario presets pochodzą z DIP API i wykonują się w ramach tego samego analysis contract.",
      setDipConfig: "Ustaw DIP_API_BASE_URL i DIP_API_KEY",
    },
    actions: {
      resetInputs: "Resetuj wejścia",
      runLiveScenario: "Uruchom live scenario",
      runningDip: "Uruchamianie DIP...",
      selected: "Wybrane",
      load: "Wczytaj",
      inspect: "Podgląd",
    },
    tabs: {
      catalog: "Scenariusze",
      inputs: "Wejścia",
      overview: "Przegląd",
      alternatives: "Alternatywy",
      evidence: "Dowody",
    },
    sections: {
      configurationTitle: "Konfiguracja / Wejście",
      configurationDescription:
        "Wybierz jeden ze scenariuszy dostarczanych przez DIP, sprawdź preset alternatives i uruchom live analysis contract.",
      scenarioCatalogTitle: "Katalog scenariuszy",
      scenarioCatalogSubtitle:
        "Pięć scenariuszy domenowych jest dostarczanych przez DIP i wybieranych tutaj bez zmiany ogólnej architektury UI.",
      scenarioCatalogDemoSubtitle:
        "Tryb prezentacyjny przypina jeden curated scenario oraz preset alternatives dla powtarzalnych demonstracji.",
      selectedScenarioTitle: "Wybrany scenariusz",
      stateSpaceTitle: "Projekcja przestrzeni stanów",
      stateSpaceDescription:
        "Projekcja 2D current state, predicted state, uncertainty i future trajectories zwracanych przez API dla wybranej gałęzi scenariusza.",
      stateTimelineTitle: "Oś czasu stanu",
      stateTimelineDescription:
        "Pokazuje wybraną gałąź od current state do optimistic i conservative futures zwróconych przez DIP.",
      decisionAnalysisTitle: "Analiza decyzji",
      decisionAnalysisDescription:
        "Wszystkie główne metryki na tym panelu pochodzą bezpośrednio z observatory contract w DIP. Klient tylko je formatuje i porównuje.",
      alternativeComparisonTitle: "Porównanie alternatyw",
      alternativeComparisonSubtitle:
        "Ścieżka bazowa i alternatywna w ramach tego samego live DIP scenario contract",
      decisionAlternativesTitle: "Alternatywy decyzji",
      decisionAlternativesSubtitle:
        "Counterfactual decisions oraz kompromisy outcome/risk zwracane bezpośrednio przez DIP",
      whyDecisionTitle: "Dlaczego ta decyzja",
      whyDecisionSubtitle:
        "Explanation bullets zwrócone przez DIP observatory run contract",
      ruleEvidenceTitle: "Rule Evidence",
      ruleEvidenceSubtitle:
        "Condition-level traces zwracane bezpośrednio przez DIP scenario workflow",
    },
    labels: {
      model: "Model",
      dataset: "Zbiór danych",
      selectedPath: "Wybrana ścieżka",
      currentState: "Stan bieżący",
      predictedState: "Stan prognozowany",
      matchedRule: "Dopasowana reguła",
      execution: "Wykonanie",
      uncertaintyInterval: "Przedział niepewności",
      rank: "Pozycja",
      riskShort: "Ryzyko",
      confidenceShort: "Uf.",
      apiBadge: "API",
      comparisonBadge: "POR",
      na: "brak",
    },
    notices: {
      dipNotConnected: "DIP nie jest połączony",
      bootstrapFromApi:
        "Skonfiguruj dane dostępu do DIP, aby zbootstrapować Observatory z API.",
      observatoryNeedsPayload:
        "Observatory potrzebuje live bootstrap payload z DIP, zanim będzie można edytować inputs scenariusza.",
      demoInputsLocked:
        "Demo mode blokuje preset inputs, aby ten sam scenariusz dawał powtarzalny presentation state po każdym resecie i rerunie.",
      noAlternativeDecisions:
        "Dla wybranej gałęzi nie zwrócono alternatywnych decyzji.",
      noExplanation: "Dla wybranej ścieżki nie zwrócono wyjaśnienia.",
      noRuleEvidence: "Dla wybranej gałęzi nie zwrócono evidence dla reguł.",
      chooseScenario:
        "Wybierz scenariusz i uruchom live analysis, aby zobaczyć outputy z DIP.",
      runTwoAlternatives:
        "Uruchom dwie alternatywy, aby odblokować comparison deltas.",
    },
    chart: {
      ariaLabel: "Wykres projekcji przestrzeni stanów DIP",
      axisFallbackX: "OŚ STANU X",
      axisFallbackY: "OŚ STANU Y",
      waitingTitle: "Projekcja przestrzeni stanów czeka na live run DIP.",
      waitingDescription:
        "Wybierz jeden ze scenariuszy DIP i uruchom go, aby wypełnić wykres current state, predicted state, trajectories i uncertainty z API.",
      loading: "Trwa live kalkulacja DIP...",
    },
    timeline: {
      empty:
        "Oś czasu będzie dostępna po pierwszym live Observatory run w DIP.",
      currentState: "Stan bieżący",
      predictedState: "Stan prognozowany",
      optimisticBranch: "Gałąź optymistyczna",
      conservativeBranch: "Gałąź konserwatywna",
      noBranchAvailable: "Brak dostępnej gałęzi",
    },
    fieldTypes: {
      number: "liczba",
      boolean: "logiczne",
      text: "tekst",
      enabled: "Włączone",
      disabled: "Wyłączone",
    },
    metrics: {
      decision: "Decyzja",
      confidence: "Pewność",
      uncertainty: "Niepewność",
      risk: "Ryzyko",
      systemStability: "Stabilność systemu",
      propagationRisk: "Ryzyko propagacji",
      decisionDetail:
        "Zwracane przez scenario workflow wewnątrz DIP observatory.",
      confidenceDetail:
        "Pewność pochodząca bezpośrednio z API dla wybranej gałęzi scenariusza.",
      uncertaintyDetail:
        "Poziom niepewności zwracany przez DIP observatory run contract.",
      riskDetail: "Ryzyko gałęzi scenariusza zwracane bezpośrednio przez DIP.",
      systemStabilityDetail:
        "Metryka system stability zwracana bezpośrednio przez observatory run.",
      propagationRiskDetail:
        "Metryka downstream risk propagation zwracana bezpośrednio przez DIP.",
      riskDelta: "Delta ryzyka",
      confidenceDelta: "Delta pewności",
      stabilityDelta: "Delta stabilności",
      decisionShift: "Zmiana decyzji",
      versusDetail: "w ramach tego samego uruchomienia DIP scenario.",
      stabilityDeltaDetail:
        "Różnica między outcome stability zwróconymi przez API.",
      decisionShiftDetail:
        "Pokazuje, czy alternatywna ścieżka zmienia wybraną decyzję DIP.",
      uncertaintyEnvelope: "envelope z DIP",
    },
    evidence: {
      observed: "zaobserwowano",
      pass: "pass",
      fail: "fail",
    },
  },
};

const scenarioOverrides: Partial<
  Record<Locale, Record<string, ScenarioTextOverride>>
> = {
  uk: {
    hr_workforce_stability: {
      name: "Стабільність HR-команди",
      description:
        "Показує pressure утримання, вибір втручання та невизначеність навколо стабільності критичного таланту.",
      domain: "HR",
      axes: {
        pressure: "Тиск на утримання",
        readiness: "Готовність підтримки",
      },
      fields: {
        burnout_index: {
          label: "Індекс вигорання",
          hint: "Спостережувана інтенсивність вигорання у критичному сегменті команди.",
        },
        workload_pressure: {
          label: "Тиск навантаження",
          hint: "Поточне навантаження на команду або роль.",
        },
        manager_support: {
          label: "Підтримка менеджера",
          hint: "Наявність активної підтримки від локального менеджера.",
        },
        engagement_score: {
          label: "Рівень залученості",
          hint: "Останній сигнал залученості або настрою.",
        },
        critical_role: {
          label: "Критична роль",
          hint: "Позначає, чи є роль складною для заміни в поточному горизонті.",
        },
      },
      presets: {
        baseline: {
          label: "Черга ескалації",
          description:
            "Високий strain і слабка підтримка навколо критичної ролі.",
        },
        challenger: {
          label: "Спринт підтримки",
          description:
            "Тимчасове полегшення й сильніша підтримка до формального втручання.",
        },
      },
    },
    resource_allocation_control: {
      name: "Контроль розподілу ресурсів",
      description:
        "Показує, як utilization, backlog і бюджетні буфери впливають на рішення про allocation та downstream delivery risk.",
      domain: "Розподіл ресурсів",
      axes: {
        pressure: "Тиск попиту",
        readiness: "Готовність доставки",
      },
      fields: {
        utilization_rate: {
          label: "Рівень завантаження",
          hint: "Поточне завантаження команди.",
        },
        backlog_pressure: {
          label: "Тиск backlog",
          hint: "Зважене навантаження від delivery backlog.",
        },
        budget_buffer: {
          label: "Бюджетний буфер",
          hint: "Доступний резерв бюджету для пом'якшення ризиків.",
        },
        skill_alignment: {
          label: "Відповідність навичок",
          hint: "Наскільки вхідна робота відповідає наявним компетенціям.",
        },
        supplier_delay: {
          label: "Затримка постачальника",
          hint: "Очікувана затримка зовнішньої залежності.",
        },
      },
      presets: {
        baseline: {
          label: "Криза потужності",
          description: "Команда перевантажена, а backlog продовжує зростати.",
        },
        challenger: {
          label: "Cross-trained lane",
          description:
            "Потужності перерозподілено, а matching поліпшено через selective cross-training.",
        },
      },
    },
    research_portfolio_navigation: {
      name: "Навігація R&D-портфелем",
      description:
        "Демонструє uncertainty, evidence maturity та stage-gate decisions для портфеля дослідницьких ставок.",
      domain: "Дослідження",
      axes: {
        pressure: "Тиск невизначеності",
        readiness: "Готовність доказів",
      },
      fields: {
        novelty_risk: {
          label: "Ризик новизни",
          hint: "Ризик дослідження через неперевірені припущення.",
        },
        evidence_readiness: {
          label: "Готовність доказів",
          hint: "Поточна емпірична обґрунтованість пропозиції.",
        },
        collaboration_strength: {
          label: "Сила співпраці",
          hint: "Наявність committed execution partners.",
        },
        funding_runway_months: {
          label: "Фінансовий runway (місяці)",
          hint: "Залишок runway для експериментів.",
        },
        execution_variance: {
          label: "Варіативність виконання",
          hint: "Остання варіативність delivery між експериментами.",
        },
      },
      presets: {
        baseline: {
          label: "Шок дослідження",
          description:
            "Висока новизна при низькій зрілості доказів і короткому runway.",
        },
        challenger: {
          label: "Фокусована валідація",
          description:
            "Команда звужує scope і додає evidence перед масштабуванням наступного етапу.",
        },
      },
    },
    supply_chain_resilience: {
      name: "Стійкість ланцюга постачання",
      description:
        "Візуалізує disruption pressure, buffer decisions і resilience trajectories для supply operations.",
      domain: "Ланцюг постачання",
      axes: {
        pressure: "Тиск збоїв",
        readiness: "Готовність до відновлення",
      },
      fields: {
        supplier_concentration: {
          label: "Концентрація постачальників",
          hint: "Залежність від невеликої групи критичних постачальників.",
        },
        lead_time_volatility: {
          label: "Волатильність lead time",
          hint: "Спостережувана мінливість вхідних lead time.",
        },
        inventory_buffer: {
          label: "Інвентарний буфер",
          hint: "Доступний coverage buffer проти збоїв.",
        },
        demand_volatility: {
          label: "Волатильність попиту",
          hint: "Нестабільність попиту в поточному плановому горизонті.",
        },
        recovery_readiness: {
          label: "Готовність до відновлення",
          hint: "Здатність відновити сервіс після supply shock.",
        },
      },
      presets: {
        baseline: {
          label: "Крихкий канал",
          description:
            "Висока концентрація й нестабільні lead times створюють крихкий supply lane.",
        },
        challenger: {
          label: "Буферизована диверсифікація",
          description:
            "План додає buffer stock і запускає diversification постачальників.",
        },
      },
    },
    operational_risk_containment: {
      name: "Стримування операційного ризику",
      description:
        "Показує exposure, control coverage і containment choices для enterprise risk management.",
      domain: "Управління ризиками",
      axes: {
        pressure: "Тиск загроз",
        readiness: "Готовність контролів",
      },
      fields: {
        threat_exposure: {
          label: "Експозиція загроз",
          hint: "Поточна агрегована експозиція до активного набору загроз.",
        },
        control_coverage: {
          label: "Покриття контролями",
          hint: "Покриття активними контролями на exposed surface.",
        },
        incident_velocity: {
          label: "Швидкість інцидентів",
          hint: "Швидкість появи або поширення споріднених інцидентів.",
        },
        dependency_criticality: {
          label: "Критичність залежностей",
          hint: "Критичність залежних сервісів або активів під ризиком.",
        },
        response_readiness: {
          label: "Готовність реагування",
          hint: "Поточна готовність response organization.",
        },
      },
      presets: {
        baseline: {
          label: "Ескалація експозиції",
          description:
            "Тиск загроз високий, а контролі та readiness залишаються слабкими.",
        },
        challenger: {
          label: "Хвиля стримування",
          description:
            "Coverage і readiness покращуються після пріоритетних containment actions.",
        },
      },
    },
  },
  pl: {
    hr_workforce_stability: {
      name: "Stabilność zespołu HR",
      description:
        "Pokazuje presję retencji, wybór interwencji oraz niepewność wokół stabilności kluczowych talentów.",
      domain: "HR",
      axes: {
        pressure: "Presja retencyjna",
        readiness: "Gotowość wsparcia",
      },
      fields: {
        burnout_index: {
          label: "Indeks wypalenia",
          hint: "Obserwowana intensywność wypalenia w krytycznym segmencie zespołu.",
        },
        workload_pressure: {
          label: "Presja obciążenia",
          hint: "Aktualne obciążenie zespołu lub roli.",
        },
        manager_support: {
          label: "Wsparcie menedżera",
          hint: "Dostępność aktywnego wsparcia ze strony lokalnego menedżera.",
        },
        engagement_score: {
          label: "Poziom zaangażowania",
          hint: "Ostatni sygnał zaangażowania lub nastroju.",
        },
        critical_role: {
          label: "Rola krytyczna",
          hint: "Określa, czy dana rola jest trudna do zastąpienia w bieżącym horyzoncie.",
        },
      },
      presets: {
        baseline: {
          label: "Kolejka eskalacji",
          description: "Wysoki strain i słabe wsparcie wokół krytycznej roli.",
        },
        challenger: {
          label: "Sprint wsparcia",
          description:
            "Tymczasowe odciążenie i mocniejsze wsparcie przed formalną interwencją.",
        },
      },
    },
    resource_allocation_control: {
      name: "Kontrola alokacji zasobów",
      description:
        "Pokazuje, jak utilization, backlog i bufory budżetowe wpływają na decyzje alokacyjne oraz downstream delivery risk.",
      domain: "Alokacja zasobów",
      axes: {
        pressure: "Presja popytu",
        readiness: "Gotowość dostarczenia",
      },
      fields: {
        utilization_rate: {
          label: "Poziom wykorzystania",
          hint: "Aktualne wykorzystanie zespołu.",
        },
        backlog_pressure: {
          label: "Presja backlogu",
          hint: "Ważone obciążenie delivery backlogiem.",
        },
        budget_buffer: {
          label: "Bufor budżetowy",
          hint: "Dostępny zapas budżetu do łagodzenia ryzyk.",
        },
        skill_alignment: {
          label: "Dopasowanie kompetencji",
          hint: "Jak dobrze napływająca praca pasuje do dostępnych kompetencji.",
        },
        supplier_delay: {
          label: "Opóźnienie dostawcy",
          hint: "Oczekiwane opóźnienie zewnętrznej zależności.",
        },
      },
      presets: {
        baseline: {
          label: "Kryzys pojemności",
          description: "Zespół jest przeciążony, a backlog nadal rośnie.",
        },
        challenger: {
          label: "Cross-trained lane",
          description:
            "Pojemność została zrównoważona, a matching poprawiono przez selective cross-training.",
        },
      },
    },
    research_portfolio_navigation: {
      name: "Nawigacja portfelem badań",
      description:
        "Pokazuje uncertainty, evidence maturity oraz stage-gate decisions dla portfela zakładów badawczych.",
      domain: "Badania",
      axes: {
        pressure: "Presja niepewności",
        readiness: "Gotowość dowodowa",
      },
      fields: {
        novelty_risk: {
          label: "Ryzyko nowości",
          hint: "Ryzyko eksploracji wynikające z niezweryfikowanych założeń.",
        },
        evidence_readiness: {
          label: "Gotowość dowodowa",
          hint: "Aktualny poziom empirycznego uzasadnienia propozycji.",
        },
        collaboration_strength: {
          label: "Siła współpracy",
          hint: "Dostępność committed execution partners.",
        },
        funding_runway_months: {
          label: "Runway finansowy (miesiące)",
          hint: "Pozostały runway na eksperymenty.",
        },
        execution_variance: {
          label: "Wariancja wykonania",
          hint: "Ostatnia zmienność delivery pomiędzy eksperymentami.",
        },
      },
      presets: {
        baseline: {
          label: "Szok eksploracyjny",
          description:
            "Wysoka nowość przy niskiej dojrzałości dowodowej i krótkim runway.",
        },
        challenger: {
          label: "Skoncentrowana walidacja",
          description:
            "Zespół zawęża scope i dodaje evidence przed skalowaniem kolejnego etapu.",
        },
      },
    },
    supply_chain_resilience: {
      name: "Odporność łańcucha dostaw",
      description:
        "Wizualizuje disruption pressure, buffer decisions oraz resilience trajectories dla supply operations.",
      domain: "Łańcuch dostaw",
      axes: {
        pressure: "Presja zakłóceń",
        readiness: "Gotowość do odzyskania",
      },
      fields: {
        supplier_concentration: {
          label: "Koncentracja dostawców",
          hint: "Zależność od małej grupy krytycznych dostawców.",
        },
        lead_time_volatility: {
          label: "Zmienność lead time",
          hint: "Obserwowana zmienność inbound lead times.",
        },
        inventory_buffer: {
          label: "Bufor zapasów",
          hint: "Dostępny coverage buffer przeciwko zakłóceniom.",
        },
        demand_volatility: {
          label: "Zmienność popytu",
          hint: "Niestabilność popytu w bieżącym horyzoncie planowania.",
        },
        recovery_readiness: {
          label: "Gotowość odzyskania",
          hint: "Zdolność przywrócenia usługi po supply shock.",
        },
      },
      presets: {
        baseline: {
          label: "Krucha linia",
          description:
            "Wysoka koncentracja i niestabilne lead times tworzą kruchy supply lane.",
        },
        challenger: {
          label: "Buforowana dywersyfikacja",
          description:
            "Plan dodaje buffer stock i rozpoczyna dywersyfikację dostawców.",
        },
      },
    },
    operational_risk_containment: {
      name: "Ograniczanie ryzyka operacyjnego",
      description:
        "Pokazuje exposure, control coverage i containment choices dla enterprise risk management.",
      domain: "Zarządzanie ryzykiem",
      axes: {
        pressure: "Presja zagrożeń",
        readiness: "Gotowość kontroli",
      },
      fields: {
        threat_exposure: {
          label: "Ekspozycja zagrożeń",
          hint: "Bieżąca łączna ekspozycja na aktywny zestaw zagrożeń.",
        },
        control_coverage: {
          label: "Pokrycie kontrolami",
          hint: "Pokrycie exposed surface przez aktywne kontrole.",
        },
        incident_velocity: {
          label: "Szybkość incydentów",
          hint: "Tempo, w jakim powiązane incydenty pojawiają się lub rozprzestrzeniają.",
        },
        dependency_criticality: {
          label: "Krytyczność zależności",
          hint: "Krytyczność zależnych usług lub aktywów objętych ryzykiem.",
        },
        response_readiness: {
          label: "Gotowość reakcji",
          hint: "Bieżąca gotowość response organization.",
        },
      },
      presets: {
        baseline: {
          label: "Rosnąca ekspozycja",
          description:
            "Presja zagrożeń jest wysoka, a kontrole i readiness pozostają płytkie.",
        },
        challenger: {
          label: "Fala containment",
          description:
            "Coverage i readiness poprawiają się po priorytetowych containment actions.",
        },
      },
    },
  },
};

export function resolveLocale(preferred?: string | null): Locale {
  const normalized = preferred?.trim().toLowerCase() ?? "";

  if (normalized.startsWith("uk")) return "uk";
  if (normalized.startsWith("pl")) return "pl";

  return DEFAULT_LOCALE;
}

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function detectLocaleFromHeader(value?: string | null): Locale {
  const candidates = (value ?? "")
    .split(",")
    .map((entry) => entry.trim().split(";")[0]?.trim())
    .filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate.startsWith("uk")) return "uk";
    if (candidate.startsWith("pl")) return "pl";
    if (candidate.startsWith("en")) return "en";
  }

  return DEFAULT_LOCALE;
}

export function buildLocalePath(pathname: string, locale: Locale) {
  const normalizedPath = pathname || "/";
  const stripped = normalizedPath.replace(/^\/(en|uk|pl)(?=\/|$)/, "") || "/";
  return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
}

export function getObservatoryCopy(locale: Locale) {
  return copyByLocale[locale];
}

export function getLocaleMetadata(locale: Locale) {
  const copy = getObservatoryCopy(locale);

  return {
    title:
      locale === "uk"
        ? "DIP Observatory | Український інтерфейс"
        : locale === "pl"
          ? "DIP Observatory | Polski interfejs"
          : "DIP Observatory | English interface",
    description: copy.shell.description,
  };
}

export function localizeScenario(
  locale: Locale,
  scenario: ObservatoryScenario,
): ObservatoryScenario {
  const override = scenarioOverrides[locale]?.[scenario.id];

  if (!override) {
    return scenario;
  }

  return {
    ...scenario,
    name: override.name ?? scenario.name,
    description: override.description ?? scenario.description,
    domain: override.domain ?? scenario.domain,
    stateAxes: scenario.stateAxes.map((axis) => ({
      ...axis,
      label: override.axes?.[axis.key] ?? axis.label,
    })),
    fields: scenario.fields.map((field) => ({
      ...field,
      label: override.fields?.[field.name]?.label ?? field.label,
      hint: override.fields?.[field.name]?.hint ?? field.hint,
    })),
    presets: scenario.presets.map((preset) => ({
      ...preset,
      label: override.presets?.[preset.id]?.label ?? preset.label,
      description:
        override.presets?.[preset.id]?.description ?? preset.description,
    })),
  };
}
