import type { Locale } from "@/lib/observatory-i18n";
import type {
  ClientRisk,
  DecisionStatus,
  EidosScenario,
  OutcomeStatus,
  ProcurementStrategy,
} from "@/eidos/types/eidos";

export type EidosDocumentationSection = {
  title: string;
  description: string;
  bullets: string[];
};

export type EidosCopy = {
  header: {
    eyebrow: string;
    prototypeBadge: string;
    title: string;
    description: string;
    backLink: string;
    backToDashboard: string;
    openDocumentationPage: string;
    showDocumentation: string;
    hideDocumentation: string;
    documentationBadge: string;
  };
  overview: {
    ariaLabel: string;
    totalClients: string;
    totalClientsHint: string;
    stable: string;
    stableHint: string;
    strategyChanged: string;
    strategyChangedHint: string;
    highRisk: string;
    highRiskHint: string;
    actionRequired: string;
    actionRequiredHint: string;
  };
  table: {
    title: string;
    attentionSummary: (needsAttention: number, total: number) => string;
    searchPlaceholder: string;
    searchAriaLabel: string;
    riskLabel: string;
    riskFilterAriaLabel: string;
    allRisk: string;
    noMatches: string;
    changedBadge: string;
    caption: (shown: number, total: number) => string;
    columns: {
      client: string;
      annualConsumption: string;
      current: string;
      recommended: string;
      risk: string;
      status: string;
    };
  };
  detail: {
    closeAriaLabel: string;
    annualConsumptionSuffix: string;
    currentStrategy: string;
    recommendedStrategy: string;
    decisionChanged: string;
    yes: string;
    no: string;
    scenarioAndAlternativesTitle: string;
    scenarioAndAlternativesDescription: string;
    whyTitle: string;
    replayTitle: string;
    replayDescription: string;
    historyTitle: string;
    historyDescription: string;
    outcomeTitle: string;
    outcomeDescription: string;
    emptyState: string;
    riskBadgeSuffix: string;
  };
  scenario: {
    ariaLabel: string;
  };
  alternatives: {
    caption: string;
    recommendedBadge: string;
    currentBadge: string;
    expectedCost: string;
    confidence: string;
    downside: string;
    savingsVsWorst: string;
    rank: string;
    summary: (strategyLabel: string) => string;
    headers: {
      strategy: string;
      risk: string;
    };
  };
  explanation: {
    changedLead: string;
    changedTail: string;
    stableLead: string;
    stableTail: string;
    noMaterialChanges: string;
  };
  replay: {
    show: string;
    hide: string;
    originalDecision: string;
    currentScenario: string;
    changedBecause: string;
    heldDespite: string;
    unchangedAssumptions: string;
  };
  history: {
    reasonPrefix: string;
  };
  outcomes: {
    empty: string;
    caption: string;
    headers: {
      date: string;
      recommended: string;
      executed: string;
      expected: string;
      actual: string;
      variance: string;
      outcome: string;
    };
  };
  chart: {
    riskAxis: string;
    expectedCostAxis: string;
    figureCaption: string;
    ariaLabelPrefix: string;
    recommendedLabel: string;
    riskPointLabel: string;
  };
  documentation: {
    title: string;
    description: string;
    sections: EidosDocumentationSection[];
  };
  footerDisclaimer: string;
};

const strategyLabelsByLocale: Record<
  Locale,
  Record<ProcurementStrategy, string>
> = {
  en: {
    BUY_20: "BUY 20%",
    BUY_40: "BUY 40%",
    WAIT: "WAIT",
  },
  uk: {
    BUY_20: "КУПИТИ 20%",
    BUY_40: "КУПИТИ 40%",
    WAIT: "ЧЕКАТИ",
  },
  pl: {
    BUY_20: "KUP 20%",
    BUY_40: "KUP 40%",
    WAIT: "CZEKAJ",
  },
};

const statusLabelsByLocale: Record<Locale, Record<DecisionStatus, string>> = {
  en: {
    STABLE: "Stable",
    STRATEGY_CHANGED: "Strategy changed",
    HIGH_RISK: "High risk",
    ACTION_REQUIRED: "Action required",
  },
  uk: {
    STABLE: "Стабільно",
    STRATEGY_CHANGED: "Стратегію змінено",
    HIGH_RISK: "Високий ризик",
    ACTION_REQUIRED: "Потрібна дія",
  },
  pl: {
    STABLE: "Stabilnie",
    STRATEGY_CHANGED: "Zmiana strategii",
    HIGH_RISK: "Wysokie ryzyko",
    ACTION_REQUIRED: "Wymaga działania",
  },
};

const riskLabelsByLocale: Record<Locale, Record<ClientRisk, string>> = {
  en: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  },
  uk: {
    LOW: "Низький",
    MEDIUM: "Середній",
    HIGH: "Високий",
  },
  pl: {
    LOW: "Niskie",
    MEDIUM: "Średnie",
    HIGH: "Wysokie",
  },
};

const outcomeLabelsByLocale: Record<Locale, Record<OutcomeStatus, string>> = {
  en: {
    FAVOURABLE: "Favourable",
    NEUTRAL: "Neutral",
    UNFAVOURABLE: "Unfavourable",
  },
  uk: {
    FAVOURABLE: "Сприятливий",
    NEUTRAL: "Нейтральний",
    UNFAVOURABLE: "Несприятливий",
  },
  pl: {
    FAVOURABLE: "Korzystny",
    NEUTRAL: "Neutralny",
    UNFAVOURABLE: "Niekorzystny",
  },
};

const scenarioLabelsByLocale: Record<Locale, Record<EidosScenario, string>> = {
  en: {
    BASELINE: "Baseline",
    HIGH_PRICE: "High price",
    LOW_PRICE: "Low price",
    HIGH_DEMAND: "High demand",
    LOW_DEMAND: "Low demand",
    HIGH_VOLATILITY: "High volatility",
  },
  uk: {
    BASELINE: "Базовий",
    HIGH_PRICE: "Висока ціна",
    LOW_PRICE: "Низька ціна",
    HIGH_DEMAND: "Високий попит",
    LOW_DEMAND: "Низький попит",
    HIGH_VOLATILITY: "Висока волатильність",
  },
  pl: {
    BASELINE: "Bazowy",
    HIGH_PRICE: "Wysoka cena",
    LOW_PRICE: "Niska cena",
    HIGH_DEMAND: "Wysoki popyt",
    LOW_DEMAND: "Niski popyt",
    HIGH_VOLATILITY: "Wysoka zmienność",
  },
};

const scenarioDescriptionsByLocale: Record<
  Locale,
  Record<EidosScenario, string>
> = {
  en: {
    BASELINE: "Central market assumptions with no directional shock.",
    HIGH_PRICE: "Forward prices rise; spot exposure becomes more expensive.",
    LOW_PRICE: "Forward prices fall; waiting for spot is comparatively cheap.",
    HIGH_DEMAND: "Consumption and prices climb, raising exposed volume.",
    LOW_DEMAND: "Softer consumption relieves pressure on procurement.",
    HIGH_VOLATILITY:
      "Prices are unstable; downside risk dominates the decision.",
  },
  uk: {
    BASELINE: "Центральні ринкові припущення без напрямного шоку.",
    HIGH_PRICE: "Форвардні ціни зростають; spot-експозиція дорожчає.",
    LOW_PRICE: "Форвардні ціни падають; очікування spot стає відносно дешевим.",
    HIGH_DEMAND:
      "Споживання й ціни зростають, збільшуючи незахеджований обсяг.",
    LOW_DEMAND: "Слабший попит знижує тиск на закупівлю.",
    HIGH_VOLATILITY: "Ціни нестабільні; downside-ризик домінує в рішенні.",
  },
  pl: {
    BASELINE: "Centralne założenia rynkowe bez kierunkowego szoku.",
    HIGH_PRICE: "Ceny terminowe rosną; ekspozycja spot staje się droższa.",
    LOW_PRICE:
      "Ceny terminowe spadają; czekanie na spot jest relatywnie tańsze.",
    HIGH_DEMAND: "Zużycie i ceny rosną, zwiększając niezabezpieczony wolumen.",
    LOW_DEMAND: "Słabszy popyt zmniejsza presję na zakup energii.",
    HIGH_VOLATILITY: "Ceny są niestabilne; ryzyko spadkowe dominuje decyzję.",
  },
};

const factorLabelsByLocale: Record<Locale, Record<string, string>> = {
  en: {
    "TTF price forecast": "TTF price forecast",
    "Demand forecast": "Demand forecast",
    "Expected cost": "Expected cost",
    "Downside risk": "Downside risk",
    "Forecast confidence": "Forecast confidence",
    "Contract coverage vs target": "Contract coverage vs target",
  },
  uk: {
    "TTF price forecast": "Прогноз ціни TTF",
    "Demand forecast": "Прогноз попиту",
    "Expected cost": "Очікувана вартість",
    "Downside risk": "Ризик негативного сценарію",
    "Forecast confidence": "Впевненість у прогнозі",
    "Contract coverage vs target": "Покриття контрактом відносно цілі",
  },
  pl: {
    "TTF price forecast": "Prognoza ceny TTF",
    "Demand forecast": "Prognoza popytu",
    "Expected cost": "Oczekiwany koszt",
    "Downside risk": "Ryzyko spadkowe",
    "Forecast confidence": "Pewność prognozy",
    "Contract coverage vs target": "Pokrycie kontraktowe względem celu",
  },
};

const historyReasonsByLocale: Record<Locale, Record<string, string>> = {
  en: {
    "Market scenario changed": "Market scenario changed",
    "Coverage rebalanced toward target": "Coverage rebalanced toward target",
  },
  uk: {
    "Market scenario changed": "Ринковий сценарій змінився",
    "Coverage rebalanced toward target":
      "Покриття перебалансовано ближче до цілі",
  },
  pl: {
    "Market scenario changed": "Zmienił się scenariusz rynkowy",
    "Coverage rebalanced toward target": "Pokrycie zbilansowano bliżej celu",
  },
};

const copyByLocale: Record<Locale, EidosCopy> = {
  en: {
    header: {
      eyebrow: "EIDOS Decision Observatory",
      prototypeBadge: "Prototype — synthetic data",
      title: "Monitor procurement decisions, focus on what changed",
      description:
        "Scale expert energy-procurement oversight across many clients: surface changed decisions, compare alternatives, expose the cost/risk trade-off and track outcomes.",
      backLink: "DIP Observatory",
      backToDashboard: "Back to EIDOS dashboard",
      openDocumentationPage: "Go to documentation",
      showDocumentation: "Show documentation",
      hideDocumentation: "Hide documentation",
      documentationBadge: "Documentation",
    },
    overview: {
      ariaLabel: "Portfolio summary",
      totalClients: "Total clients",
      totalClientsHint: "need attention",
      stable: "Stable",
      stableHint: "No change · not high risk",
      strategyChanged: "Strategy changed",
      strategyChangedHint: "Recommendation differs from contract",
      highRisk: "High risk",
      highRiskHint: "Elevated exposure",
      actionRequired: "Action required",
      actionRequiredHint: "High risk · decision changed",
    },
    table: {
      title: "Clients",
      attentionSummary: (needsAttention, total) =>
        `${needsAttention} of ${total} need attention. Exceptions are sorted to the top so a trader can investigate only those that changed.`,
      searchPlaceholder: "Search by client name",
      searchAriaLabel: "Search clients by name",
      riskLabel: "Risk",
      riskFilterAriaLabel: "Filter by risk",
      allRisk: "All risk",
      noMatches: "No clients match the current filters.",
      changedBadge: "changed",
      caption: (shown, total) =>
        `Synthetic EIDOS clients with current and recommended procurement strategy, risk and decision status. Showing ${shown} of ${total} clients.`,
      columns: {
        client: "Client",
        annualConsumption: "Annual consumption",
        current: "Current",
        recommended: "Recommended",
        risk: "Risk",
        status: "Status",
      },
    },
    detail: {
      closeAriaLabel: "Close decision detail",
      annualConsumptionSuffix: "annual consumption",
      currentStrategy: "Current strategy",
      recommendedStrategy: "Recommended strategy",
      decisionChanged: "Decision changed",
      yes: "YES",
      no: "NO",
      scenarioAndAlternativesTitle: "Scenario & alternatives",
      scenarioAndAlternativesDescription:
        "A change in assumptions can change the preferred decision. Switch scenarios to see cost, risk, confidence and ranking update.",
      whyTitle: "Why did the recommendation change?",
      replayTitle: "Decision replay",
      replayDescription:
        "UI simulation only — the underlying decision engine is not modified.",
      historyTitle: "Decision history",
      historyDescription:
        "Twelve months of synthetic observations — decisions evolve over time.",
      outcomeTitle: "Outcome tracking",
      outcomeDescription:
        "Recommended vs executed strategy and expected vs actual cost (synthetic).",
      emptyState:
        "Select a client to inspect its decision, alternatives, scenario comparison, history and outcome.",
      riskBadgeSuffix: "risk",
    },
    scenario: {
      ariaLabel: "Market scenario",
    },
    alternatives: {
      caption:
        "Expected cost, risk and confidence for each procurement alternative under the selected scenario.",
      recommendedBadge: "Recommended",
      currentBadge: "Current",
      expectedCost: "Expected cost",
      confidence: "Confidence",
      downside: "Downside",
      savingsVsWorst: "Savings vs worst",
      rank: "Rank",
      summary: (strategyLabel) =>
        `${strategyLabel} is recommended under current assumptions, not presented as an absolute optimum. Lower risk-adjusted cost wins; the trade-off is shown so a trader can override it.`,
      headers: {
        strategy: "Strategy",
        risk: "Risk",
      },
    },
    explanation: {
      changedLead: "The recommendation moved from",
      changedTail: "because of the following changes in assumptions:",
      stableLead: "The current strategy",
      stableTail:
        "remains recommended. The factors below did not move the decision:",
      noMaterialChanges: "No material changes versus the baseline assumptions.",
    },
    replay: {
      show: "Replay decision",
      hide: "Hide replay",
      originalDecision: "Original decision",
      currentScenario: "Current scenario",
      changedBecause: "Changed because",
      heldDespite: "Recommendation held despite",
      unchangedAssumptions:
        "Assumptions are unchanged from the original decision.",
    },
    history: {
      reasonPrefix: "Reason",
    },
    outcomes: {
      empty: "No tracked outcomes yet for this client.",
      caption:
        "Recommended versus executed strategy and expected versus actual cost for tracked historical decisions.",
      headers: {
        date: "Date",
        recommended: "Recommended",
        executed: "Executed",
        expected: "Expected",
        actual: "Actual",
        variance: "Variance",
        outcome: "Outcome",
      },
    },
    chart: {
      riskAxis: "Risk →",
      expectedCostAxis: "Expected cost",
      figureCaption:
        "Each point is one alternative. Down-left is cheaper and safer; the recommended option balances cost against risk.",
      ariaLabelPrefix: "Cost versus risk trade-off",
      recommendedLabel: "Recommended",
      riskPointLabel: "risk",
    },
    documentation: {
      title: "Management explanation for EIDOS",
      description:
        "This panel explains what the prototype is, how it supports EIDOS work, what value it can create, and what its current limits are.",
      sections: [
        {
          title: "What this prototype is",
          description:
            "A standalone, synthetic decision-observability surface for energy procurement.",
          bullets: [
            "Shows 20 deterministic demo clients in one exception-oriented portfolio.",
            "Helps an expert focus only on changed, risky, or action-worthy decisions.",
            "Compares procurement alternatives under scenario changes.",
          ],
        },
        {
          title: "How it supports EIDOS work",
          description:
            "The product is designed to make expert portfolio oversight faster and clearer.",
          bullets: [
            "Reduces a broad portfolio to the decisions that need attention now.",
            "Shows the current strategy, recommended strategy, and the reason for the change in one view.",
            "Compares alternatives under different market assumptions instead of presenting a single black-box output.",
            "Keeps decision history and tracked outcomes visible for retrospective review.",
          ],
        },
        {
          title: "Value for EIDOS",
          description:
            "The prototype is designed to support expert oversight, not to replace expert judgment.",
          bullets: [
            "Helps one expert supervise more client portfolios without manually reviewing every stable case.",
            "Makes changed decisions and elevated risk visible earlier.",
            "Supports comparison of alternatives before accepting or overriding a recommendation.",
            "Creates a clearer basis for retrospective learning through decision history and outcome tracking.",
          ],
        },
        {
          title: "What this prototype does not prove",
          description:
            "It validates workflow and product direction, not production readiness.",
          bullets: [
            "No live EIDOS integration.",
            "No real market prediction or procurement recommendation.",
            "No persisted audit trail, approvals, or operational workflow.",
          ],
        },
      ],
    },
    footerDisclaimer:
      "Prototype — synthetic data only. This does not modify DIP Core, does not connect to EIDOS systems, and makes no real market prediction or procurement recommendation.",
  },
  uk: {
    header: {
      eyebrow: "Обсерваторія рішень EIDOS",
      prototypeBadge: "Прототип — синтетичні дані",
      title:
        "Відстежуйте закупівельні рішення і фокусуйтеся на тому, що змінилося",
      description:
        "Масштабуйте експертний нагляд за закупівлею енергії для багатьох клієнтів: виявляйте змінені рішення, порівнюйте альтернативи, показуйте компроміс між вартістю та ризиком і відстежуйте результати.",
      backLink: "DIP Observatory",
      backToDashboard: "Назад до дашборду EIDOS",
      openDocumentationPage: "Перейти до документації",
      showDocumentation: "Показати документацію",
      hideDocumentation: "Сховати документацію",
      documentationBadge: "Документація",
    },
    overview: {
      ariaLabel: "Портфельний огляд",
      totalClients: "Усього клієнтів",
      totalClientsHint: "потребують уваги",
      stable: "Стабільні",
      stableHint: "Без змін · не високий ризик",
      strategyChanged: "Стратегію змінено",
      strategyChangedHint: "Рекомендація відрізняється від контракту",
      highRisk: "Високий ризик",
      highRiskHint: "Підвищена експозиція",
      actionRequired: "Потрібна дія",
      actionRequiredHint: "Високий ризик · рішення змінилося",
    },
    table: {
      title: "Клієнти",
      attentionSummary: (needsAttention, total) =>
        `${needsAttention} з ${total} потребують уваги. Винятки піднімаються вгору списку, щоб трейдер досліджував лише ті випадки, де щось змінилося.`,
      searchPlaceholder: "Пошук за назвою клієнта",
      searchAriaLabel: "Пошук клієнтів за назвою",
      riskLabel: "Ризик",
      riskFilterAriaLabel: "Фільтр за ризиком",
      allRisk: "Усі ризики",
      noMatches: "Жоден клієнт не відповідає поточним фільтрам.",
      changedBadge: "зміна",
      caption: (shown, total) =>
        `Синтетичні клієнти EIDOS з поточною та рекомендованою стратегією закупівлі, ризиком і статусом рішення. Показано ${shown} з ${total} клієнтів.`,
      columns: {
        client: "Клієнт",
        annualConsumption: "Річне споживання",
        current: "Поточна",
        recommended: "Рекомендована",
        risk: "Ризик",
        status: "Статус",
      },
    },
    detail: {
      closeAriaLabel: "Закрити деталі рішення",
      annualConsumptionSuffix: "річне споживання",
      currentStrategy: "Поточна стратегія",
      recommendedStrategy: "Рекомендована стратегія",
      decisionChanged: "Рішення змінилося",
      yes: "ТАК",
      no: "НІ",
      scenarioAndAlternativesTitle: "Сценарій і альтернативи",
      scenarioAndAlternativesDescription:
        "Зміна припущень може змінити бажане рішення. Перемикайте сценарії, щоб побачити, як оновлюються вартість, ризик, впевненість і рейтинг.",
      whyTitle: "Чому рекомендація змінилася?",
      replayTitle: "Відтворення рішення",
      replayDescription:
        "Лише UI-симуляція — базовий decision engine не змінюється.",
      historyTitle: "Історія рішень",
      historyDescription:
        "Дванадцять місяців синтетичних спостережень — рішення еволюціонують у часі.",
      outcomeTitle: "Відстеження результату",
      outcomeDescription:
        "Рекомендована vs виконана стратегія та очікувана vs фактична вартість (синтетично).",
      emptyState:
        "Оберіть клієнта, щоб переглянути його рішення, альтернативи, порівняння сценаріїв, історію та результат.",
      riskBadgeSuffix: "ризик",
    },
    scenario: {
      ariaLabel: "Ринковий сценарій",
    },
    alternatives: {
      caption:
        "Очікувана вартість, ризик і впевненість для кожної закупівельної альтернативи в межах вибраного сценарію.",
      recommendedBadge: "Рекомендовано",
      currentBadge: "Поточна",
      expectedCost: "Очікувана вартість",
      confidence: "Впевненість",
      downside: "Downside",
      savingsVsWorst: "Економія проти найгіршої",
      rank: "Ранг",
      summary: (strategyLabel) =>
        `${strategyLabel} рекомендована за поточних припущень, але не подається як абсолютний оптимум. Перемагає нижча вартість з поправкою на ризик; компроміс показано так, щоб трейдер міг свідомо перевизначити рішення.`,
      headers: {
        strategy: "Стратегія",
        risk: "Ризик",
      },
    },
    explanation: {
      changedLead: "Рекомендація змістилася з",
      changedTail: "через такі зміни в припущеннях:",
      stableLead: "Поточна стратегія",
      stableTail:
        "залишається рекомендованою. Наведені нижче фактори не зрушили рішення:",
      noMaterialChanges: "Немає суттєвих змін відносно базових припущень.",
    },
    replay: {
      show: "Відтворити рішення",
      hide: "Сховати відтворення",
      originalDecision: "Початкове рішення",
      currentScenario: "Поточний сценарій",
      changedBecause: "Змінилося через",
      heldDespite: "Рекомендація збереглася попри",
      unchangedAssumptions: "Припущення не змінилися від початкового рішення.",
    },
    history: {
      reasonPrefix: "Причина",
    },
    outcomes: {
      empty: "Для цього клієнта ще немає зафіксованих результатів.",
      caption:
        "Рекомендована проти виконаної стратегії та очікувана проти фактичної вартості для відстежуваних історичних рішень.",
      headers: {
        date: "Дата",
        recommended: "Рекомендована",
        executed: "Виконана",
        expected: "Очікувана",
        actual: "Фактична",
        variance: "Відхилення",
        outcome: "Результат",
      },
    },
    chart: {
      riskAxis: "Ризик →",
      expectedCostAxis: "Очікувана вартість",
      figureCaption:
        "Кожна точка — одна альтернатива. Ліворуч унизу означає дешевше й безпечніше; рекомендований варіант балансує вартість і ризик.",
      ariaLabelPrefix: "Компроміс між вартістю та ризиком",
      recommendedLabel: "Рекомендовано",
      riskPointLabel: "ризик",
    },
    documentation: {
      title: "Пояснення для менеджменту EIDOS",
      description:
        "Ця панель пояснює, чим є прототип, як він підтримує роботу EIDOS, яку цінність може створити і які його поточні обмеження.",
      sections: [
        {
          title: "Що це за прототип",
          description:
            "Окремий синтетичний інтерфейс для спостереження за рішеннями щодо закупівлі енергії.",
          bullets: [
            "Показує 20 детермінованих демо-клієнтів в одному exception-oriented портфелі.",
            "Допомагає експерту фокусуватися лише на змінених, ризикових або тих, що вимагають дії, рішеннях.",
            "Порівнює закупівельні альтернативи при зміні сценаріїв.",
          ],
        },
        {
          title: "Як це підтримує роботу EIDOS",
          description:
            "Продукт задуманий так, щоб робити експертний нагляд за портфелем швидшим і зрозумілішим.",
          bullets: [
            "Зводить широкий портфель до тих рішень, які потребують уваги зараз.",
            "Показує поточну стратегію, рекомендовану стратегію і причину зміни в одному вікні.",
            "Порівнює альтернативи за різних ринкових припущень замість одного black-box output.",
            "Тримає історію рішень і відстеження результатів у видимому полі для ретроспективного аналізу.",
          ],
        },
        {
          title: "Цінність для EIDOS",
          description:
            "Прототип створений, щоб підсилювати експертний нагляд, а не замінювати експертне судження.",
          bullets: [
            "Допомагає одному експерту супроводжувати більше клієнтських портфелів без ручного перегляду кожного стабільного кейсу.",
            "Раніше виявляє змінені рішення та підвищений ризик.",
            "Дає змогу порівнювати альтернативи перед прийняттям або перевизначенням рекомендації.",
            "Створює кращу основу для ретроспективного навчання через історію рішень і відстеження результатів.",
          ],
        },
        {
          title: "Чого прототип не доводить",
          description:
            "Він перевіряє workflow і продуктову гіпотезу, а не production-ready стан.",
          bullets: [
            "Немає live-інтеграції з EIDOS.",
            "Немає реального ринкового прогнозу чи закупівельної рекомендації.",
            "Немає persisted audit trail, approvals або операційного workflow.",
          ],
        },
      ],
    },
    footerDisclaimer:
      "Прототип — лише синтетичні дані. Він не змінює DIP Core, не підключається до систем EIDOS і не дає реального ринкового прогнозу чи рекомендації щодо закупівлі.",
  },
  pl: {
    header: {
      eyebrow: "Obserwatorium decyzji EIDOS",
      prototypeBadge: "Prototyp — dane syntetyczne",
      title: "Monitoruj decyzje zakupowe i skupiaj się na tym, co się zmieniło",
      description:
        "Skaluj ekspercki nadzór nad zakupem energii dla wielu klientów: pokazuj zmienione decyzje, porównuj alternatywy, odsłaniaj kompromis koszt/ryzyko i śledź wyniki.",
      backLink: "DIP Observatory",
      backToDashboard: "Wróć do dashboardu EIDOS",
      openDocumentationPage: "Przejdź do dokumentacji",
      showDocumentation: "Pokaż dokumentację",
      hideDocumentation: "Ukryj dokumentację",
      documentationBadge: "Dokumentacja",
    },
    overview: {
      ariaLabel: "Podsumowanie portfela",
      totalClients: "Wszyscy klienci",
      totalClientsHint: "wymaga uwagi",
      stable: "Stabilne",
      stableHint: "Bez zmiany · bez wysokiego ryzyka",
      strategyChanged: "Zmiana strategii",
      strategyChangedHint: "Rekomendacja różni się od kontraktu",
      highRisk: "Wysokie ryzyko",
      highRiskHint: "Podwyższona ekspozycja",
      actionRequired: "Wymaga działania",
      actionRequiredHint: "Wysokie ryzyko · decyzja się zmieniła",
    },
    table: {
      title: "Klienci",
      attentionSummary: (needsAttention, total) =>
        `${needsAttention} z ${total} wymaga uwagi. Wyjątki są sortowane na górę, aby trader analizował tylko te przypadki, w których coś się zmieniło.`,
      searchPlaceholder: "Szukaj po nazwie klienta",
      searchAriaLabel: "Szukaj klientów po nazwie",
      riskLabel: "Ryzyko",
      riskFilterAriaLabel: "Filtruj według ryzyka",
      allRisk: "Wszystkie poziomy ryzyka",
      noMatches: "Żaden klient nie pasuje do bieżących filtrów.",
      changedBadge: "zmiana",
      caption: (shown, total) =>
        `Syntetyczni klienci EIDOS z bieżącą i rekomendowaną strategią zakupową, ryzykiem i statusem decyzji. Pokazano ${shown} z ${total} klientów.`,
      columns: {
        client: "Klient",
        annualConsumption: "Roczne zużycie",
        current: "Obecnie",
        recommended: "Rekomendacja",
        risk: "Ryzyko",
        status: "Status",
      },
    },
    detail: {
      closeAriaLabel: "Zamknij szczegóły decyzji",
      annualConsumptionSuffix: "roczne zużycie",
      currentStrategy: "Obecna strategia",
      recommendedStrategy: "Rekomendowana strategia",
      decisionChanged: "Decyzja zmieniona",
      yes: "TAK",
      no: "NIE",
      scenarioAndAlternativesTitle: "Scenariusz i alternatywy",
      scenarioAndAlternativesDescription:
        "Zmiana założeń może zmienić preferowaną decyzję. Przełączaj scenariusze, aby zobaczyć aktualizację kosztu, ryzyka, pewności i rankingu.",
      whyTitle: "Dlaczego rekomendacja się zmieniła?",
      replayTitle: "Odtworzenie decyzji",
      replayDescription:
        "Tylko symulacja UI — bazowy silnik decyzyjny nie jest modyfikowany.",
      historyTitle: "Historia decyzji",
      historyDescription:
        "Dwanaście miesięcy syntetycznych obserwacji — decyzje ewoluują w czasie.",
      outcomeTitle: "Śledzenie wyników",
      outcomeDescription:
        "Rekomendowana vs wykonana strategia oraz oczekiwany vs rzeczywisty koszt (syntetyczne).",
      emptyState:
        "Wybierz klienta, aby przeanalizować jego decyzję, alternatywy, porównanie scenariuszy, historię i wynik.",
      riskBadgeSuffix: "ryzyko",
    },
    scenario: {
      ariaLabel: "Scenariusz rynkowy",
    },
    alternatives: {
      caption:
        "Oczekiwany koszt, ryzyko i pewność dla każdej alternatywy zakupowej w wybranym scenariuszu.",
      recommendedBadge: "Rekomendacja",
      currentBadge: "Obecna",
      expectedCost: "Koszt oczekiwany",
      confidence: "Pewność",
      downside: "Ryzyko spadkowe",
      savingsVsWorst: "Oszczędność vs najgorszy wariant",
      rank: "Pozycja",
      summary: (strategyLabel) =>
        `${strategyLabel} jest rekomendowana przy bieżących założeniach, ale nie jest przedstawiana jako absolutne optimum. Wygrywa niższy koszt skorygowany o ryzyko; pokazujemy kompromis, aby trader mógł świadomie nadpisać decyzję.`,
      headers: {
        strategy: "Strategia",
        risk: "Ryzyko",
      },
    },
    explanation: {
      changedLead: "Rekomendacja przesunęła się z",
      changedTail: "z powodu następujących zmian założeń:",
      stableLead: "Obecna strategia",
      stableTail:
        "pozostaje rekomendowana. Poniższe czynniki nie przesunęły decyzji:",
      noMaterialChanges: "Brak istotnych zmian względem założeń bazowych.",
    },
    replay: {
      show: "Pokaż odtworzenie",
      hide: "Ukryj odtworzenie",
      originalDecision: "Decyzja pierwotna",
      currentScenario: "Bieżący scenariusz",
      changedBecause: "Zmiana nastąpiła przez",
      heldDespite: "Rekomendacja utrzymała się mimo",
      unchangedAssumptions: "Założenia nie różnią się od decyzji pierwotnej.",
    },
    history: {
      reasonPrefix: "Powód",
    },
    outcomes: {
      empty: "Brak jeszcze zarejestrowanych wyników dla tego klienta.",
      caption:
        "Rekomendowana versus wykonana strategia oraz oczekiwany versus rzeczywisty koszt dla śledzonych decyzji historycznych.",
      headers: {
        date: "Data",
        recommended: "Rekomendowana",
        executed: "Wykonana",
        expected: "Oczekiwany",
        actual: "Rzeczywisty",
        variance: "Odchylenie",
        outcome: "Wynik",
      },
    },
    chart: {
      riskAxis: "Ryzyko →",
      expectedCostAxis: "Koszt oczekiwany",
      figureCaption:
        "Każdy punkt to jedna alternatywa. Lewy dolny róg oznacza taniej i bezpieczniej; rekomendowana opcja równoważy koszt i ryzyko.",
      ariaLabelPrefix: "Kompromis koszt versus ryzyko",
      recommendedLabel: "Rekomendowana",
      riskPointLabel: "ryzyko",
    },
    documentation: {
      title: "Objaśnienie dla managera EIDOS",
      description:
        "Ten panel objaśnia, czym jest prototyp, jak wspiera pracę EIDOS, jaką wartość może dać i jakie są jego obecne ograniczenia.",
      sections: [
        {
          title: "Czym jest ten prototyp",
          description:
            "To odseparowany, syntetyczny interfejs do obserwacji decyzji zakupowych w obszarze energii.",
          bullets: [
            "Pokazuje 20 deterministycznych klientów demo w jednym portfelu nastawionym na wyjątki.",
            "Pomaga ekspertowi skupić się tylko na decyzjach zmienionych, ryzykownych albo wymagających działania.",
            "Porównuje alternatywy zakupowe przy zmianie scenariuszy.",
          ],
        },
        {
          title: "Jak wspiera pracę EIDOS",
          description:
            "Produkt jest zaprojektowany tak, aby przyspieszać i porządkować ekspercki nadzór nad portfelem.",
          bullets: [
            "Redukuje szeroki portfel do decyzji, które wymagają uwagi teraz.",
            "Pokazuje obecną strategię, rekomendowaną strategię i przyczynę zmiany w jednym widoku.",
            "Porównuje alternatywy przy różnych założeniach rynkowych zamiast pojedynczego black-box output.",
            "Utrzymuje historię decyzji i śledzenie wyników w polu widzenia do analizy retrospektywnej.",
          ],
        },
        {
          title: "Wartość dla EIDOS",
          description:
            "Prototyp ma wzmacniać ekspercki nadzór, a nie zastępować ekspercki osąd.",
          bullets: [
            "Pomaga jednemu ekspertowi nadzorować więcej portfeli klientów bez ręcznego przeglądu każdego stabilnego przypadku.",
            "Wcześniej ujawnia zmienione decyzje i podwyższone ryzyko.",
            "Pozwala porównywać alternatywy przed zaakceptowaniem lub nadpisaniem rekomendacji.",
            "Tworzy lepszą podstawę do uczenia retrospektywnego dzięki historii decyzji i śledzeniu wyników.",
          ],
        },
        {
          title: "Czego ten prototyp nie potwierdza",
          description:
            "Waliduje kierunek produktu i workflow, a nie gotowość produkcyjną.",
          bullets: [
            "Brak integracji live z EIDOS.",
            "Brak realnej prognozy rynkowej i realnej rekomendacji zakupowej.",
            "Brak trwałego audytu, akceptacji i workflow operacyjnego.",
          ],
        },
      ],
    },
    footerDisclaimer:
      "Prototyp — tylko dane syntetyczne. Nie modyfikuje DIP Core, nie łączy się z systemami EIDOS i nie stanowi realnej prognozy rynkowej ani rekomendacji zakupowej.",
  },
};

export function getEidosCopy(locale: Locale): EidosCopy {
  return copyByLocale[locale];
}

export function getEidosStrategyLabel(
  locale: Locale,
  strategy: ProcurementStrategy,
) {
  return strategyLabelsByLocale[locale][strategy];
}

export function getEidosStatusLabel(locale: Locale, status: DecisionStatus) {
  return statusLabelsByLocale[locale][status];
}

export function getEidosRiskLabel(locale: Locale, risk: ClientRisk) {
  return riskLabelsByLocale[locale][risk];
}

export function getEidosOutcomeLabel(locale: Locale, outcome: OutcomeStatus) {
  return outcomeLabelsByLocale[locale][outcome];
}

export function getEidosScenarioLabel(locale: Locale, scenario: EidosScenario) {
  return scenarioLabelsByLocale[locale][scenario];
}

export function getEidosScenarioDescription(
  locale: Locale,
  scenario: EidosScenario,
) {
  return scenarioDescriptionsByLocale[locale][scenario];
}

export function getEidosDecisionFactorLabel(locale: Locale, label: string) {
  return factorLabelsByLocale[locale][label] ?? label;
}

export function getEidosHistoryReason(locale: Locale, reason: string) {
  return historyReasonsByLocale[locale][reason] ?? reason;
}
