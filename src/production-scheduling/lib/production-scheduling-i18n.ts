/**
 * Production Scheduling — i18n copy.
 *
 * Supports English ("en") and Polish ("pl").
 * All display strings live here; no translatable text inside React components.
 *
 * SYNTHETIC DEMONSTRATION — not real production data.
 */

import type { Locale } from "@/lib/observatory-i18n";

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

export interface ProductionSchedulingCopy {
  /** Locale selector option labels. */
  localeOptions: Record<Locale, string>;

  header: {
    backLink: string;
    title: string;
    subtitle: string;
    badgeLabel: string;
    localeAriaLabel: string;
  };

  disclaimer: {
    default: string;
    aerospace: string;
  };

  disruption: {
    eyebrow: string;
    badge: string;
    capacityReduction: string;
    duration: string;
    hoursLost: string;
    hoursRemaining: string;
    reason: string;
  };

  urgentOrder: {
    eyebrow: string;
    title: string;
    description: string;
    button: string;
    fields: {
      order: string;
      priority: string;
      deadline: string;
      duration: string;
      product: string;
      compatibleLines: string;
      revenue: string;
      delayPenalty: string;
    };
  };

  simulation: {
    steps: {
      event: { title: string; desc: string };
      impact: { title: string; desc: string };
      decision: { title: string; desc: string };
    };
    skipAnimation: string;
  };

  strategyLabels: {
    KEEP_CURRENT_SCHEDULE: string;
    PRIORITIZE_URGENT_ORDERS: string;
    REDISTRIBUTE_TO_OTHER_LINES: string;
    DELAY_LOW_PRIORITY_ORDERS: string;
    USE_OVERTIME: string;
  };

  recommended: {
    eyebrow: string;
    avoidedCostLabel: string;
    ordersOnTime: string;
    ordersDelayed: string;
    totalImpact: string;
    capacityUtilisation: string;
    productionSchedule: string;
    avoidedCostHeading: string;
    avoidedCostComparedTo: string;
  };

  beforeAfter: {
    cardTitle: string;
    before: string;
    acceptKeepCurrent: string;
    acceptRecommended: string;
    notOptimised: string;
    optimised: string;
    onTime: string;
    estimatedImpact: string;
    avoidedByOptimising: string;
    avoidedByComparison: string;
    orders: string;
    order: string;
    productionHours: string;
    revenue: string;
    riskIfLate: string;
  };

  whatShouldWeDo: {
    eyebrow: string;
    title: string;
    decisionChanged: string;
    decisionUnchanged: string;
    additionalOrderAbsorbed: string;
    recommendedStrategy: string;
    ordersOnTime: string;
    delayed: string;
    totalImpact: string;
    score: string;
    why: string;
    keepCurrentFails: string;
  };

  financial: {
    title: string;
    currentPlan: string;
    recommended: string;
    delta: string;
    rows: {
      delayCost: string;
      overtimeCost: string;
      setupCost: string;
      unusedCapacityCost: string;
      totalCost: string;
      revenueAtRisk: string;
    };
  };

  alternatives: {
    title: string;
    whyTitle: string;
    headers: {
      strategy: string;
      feasibility: string;
      ordersOnTime: string;
      delayed: string;
      totalImpact: string;
      score: string;
    };
    recommended: string;
    feasible: string;
    infeasible: string;
    blocking: string;
  };

  scenarioLab: {
    title: string;
    eyebrow: string;
    description: string;
    presetScenariosLabel: string;
    resetToBaseline: string;
    baselineResult: string;
    scenarioResult: string;
    controls: {
      lineBCapacity: string;
      disruptionDuration: string;
      dayUnit: string;
      criticalDeadline: string;
      day: string;
      materialAvailable: string;
      overtimeEnabled: string;
      overtimeCost: string;
      order116Priority: string;
    };
    scenLabResult: {
      strategyLabel: string;
      feasibility: string;
      ordersOnTime: string;
      delayed: string;
      totalImpact: string;
      avoidedCost: string;
      sensitivity: string;
      sensitivityLevels: { HIGH: string; MEDIUM: string; LOW: string };
    };
  };

  decisionTrace: {
    title: string;
    rule: string;
    baseline: string;
    scenario: string;
    pass: string;
    fail: string;
    changedOnly: string;
    allRules: string;
  };

  assumptions: {
    title: string;
    rows: string[];
  };

  audit: {
    title: string;
    fields: {
      decisionId: string;
      scenarioId: string;
      engineVersion: string;
      configVersion: string;
      computedAt: string;
      decisionStatus: string;
      recommendedStrategy: string;
      totalImpact: string;
      avoidedCost: string;
      strategiesEvaluated: string;
      rulesExecuted: string;
      source: string;
    };
  };

  buttons: {
    resetToBaseline: string;
    findBetterPlan: string;
    findBetterPlanHint: string;
  };
}

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

const en: ProductionSchedulingCopy = {
  localeOptions: { en: "English", uk: "Українська", pl: "Polski" },

  header: {
    backLink: "Observatory",
    title: "Production Scheduling",
    subtitle: "Pergolas, Carports & Shading — Scheduling Decision Demonstrator",
    badgeLabel: "Decision Engine",
    localeAriaLabel: "Select language",
  },

  disclaimer: {
    default: "Synthetic demonstration — not real production data",
    aerospace: "Synthetic aerospace manufacturing scenario — not client production data",
  },

  disruption: {
    eyebrow: "Production disruption",
    badge: "Capacity at risk",
    capacityReduction: "Capacity reduction",
    duration: "Duration",
    hoursLost: "Hours lost (disruption period)",
    hoursRemaining: "remaining",
    reason: "Reason",
  },

  urgentOrder: {
    eyebrow: "What if?",
    title: "What If We Accept an Urgent Customer Order?",
    description: "See how the production plan and recommended action change.",
    button: "Simulate Urgent Order",
    fields: {
      order: "Order",
      priority: "Priority",
      deadline: "Deadline",
      duration: "Duration",
      product: "Product",
      compatibleLines: "Compatible lines",
      revenue: "Revenue",
      delayPenalty: "Delay penalty",
    },
  },

  simulation: {
    steps: {
      event: {
        title: "New Urgent Customer Order",
        desc: "+1 order — CRITICAL priority — Deadline: Day 2",
      },
      impact: {
        title: "Production capacity recalculating\u2026",
        desc: "Analysing impact on the current schedule and production lines.",
      },
      decision: {
        title: "Re-evaluating possible actions\u2026",
        desc: "Evaluating all scheduling strategies with the new order included.",
      },
    },
    skipAnimation: "Skip animation \u2192",
  },

  strategyLabels: {
    KEEP_CURRENT_SCHEDULE: "Keep current schedule",
    PRIORITIZE_URGENT_ORDERS: "Prioritize urgent orders",
    REDISTRIBUTE_TO_OTHER_LINES: "Redistribute to other lines",
    DELAY_LOW_PRIORITY_ORDERS: "Delay low-priority orders",
    USE_OVERTIME: "Use overtime",
  },

  recommended: {
    eyebrow: "Recommended schedule",
    avoidedCostLabel: "Avoided cost vs. current plan",
    ordersOnTime: "Orders on time",
    ordersDelayed: "Orders delayed",
    totalImpact: "Total impact",
    capacityUtilisation: "Capacity utilisation",
    productionSchedule: "Production schedule",
    avoidedCostHeading: "Avoided cost",
    avoidedCostComparedTo: "Compared to keeping the current schedule under disruption.",
  },

  beforeAfter: {
    cardTitle: "Impact of Accepting URGENT-201",
    before: "Before",
    acceptKeepCurrent: "Accept + Keep current",
    acceptRecommended: "Accept + Recommended",
    notOptimised: "not optimised",
    optimised: "optimised",
    onTime: "On time",
    estimatedImpact: "Estimated impact",
    avoidedByOptimising: "Potential avoided impact by optimising",
    avoidedByComparison: "Compared to accepting the order without rescheduling.",
    orders: "orders",
    order: "order",
    productionHours: "production",
    revenue: "Revenue",
    riskIfLate: "Risk if late",
  },

  whatShouldWeDo: {
    eyebrow: "What should we do?",
    title: "Recommended Action",
    decisionChanged: "Decision changed",
    decisionUnchanged: "Decision unchanged",
    additionalOrderAbsorbed:
      "The additional order can be absorbed without changing the optimal strategy:",
    recommendedStrategy: "Recommended strategy",
    ordersOnTime: "Orders on time",
    delayed: "Delayed",
    totalImpact: "Total impact",
    score: "Score",
    why: "Why?",
    keepCurrentFails: "Why Keep Current fails with URGENT-201",
  },

  financial: {
    title: "Financial Impact",
    currentPlan: "Current",
    recommended: "Recommended",
    delta: "Delta",
    rows: {
      delayCost: "Delay cost",
      overtimeCost: "Overtime cost",
      setupCost: "Setup / changeover cost",
      unusedCapacityCost: "Unused capacity cost",
      totalCost: "Total operational impact",
      revenueAtRisk: "Revenue at risk",
    },
  },

  alternatives: {
    title: "Alternative Schedules",
    whyTitle: "Why This Schedule?",
    headers: {
      strategy: "Strategy",
      feasibility: "Feasibility",
      ordersOnTime: "On time",
      delayed: "Delayed",
      totalImpact: "Total impact",
      score: "Score",
    },
    recommended: "Recommended",
    feasible: "Feasible",
    infeasible: "Infeasible",
    blocking: "Blocking constraints",
  },

  scenarioLab: {
    title: "Scenario Lab",
    eyebrow: "Scenario Lab",
    description: "Change production conditions — the engine recalculates the schedule.",
    presetScenariosLabel: "Preset scenarios",
    resetToBaseline: "Reset to baseline",
    baselineResult: "Baseline result",
    scenarioResult: "Scenario result",
    controls: {
      lineBCapacity: "Line B capacity reduction",
      disruptionDuration: "Disruption duration",
      dayUnit: "day(s)",
      criticalDeadline: "Critical order #101 deadline: Day",
      day: "Day",
      materialAvailable: "ORDER-103 material available",
      overtimeEnabled: "Overtime enabled",
      overtimeCost: "Overtime cost",
      order116Priority: "ORDER-116 priority",
    },
    scenLabResult: {
      strategyLabel: "Strategy",
      feasibility: "Feasibility",
      ordersOnTime: "Orders on time",
      delayed: "Delayed",
      totalImpact: "Total impact",
      avoidedCost: "Avoided cost vs. baseline",
      sensitivity: "Decision sensitivity",
      sensitivityLevels: { HIGH: "High", MEDIUM: "Medium", LOW: "Low" },
    },
  },

  decisionTrace: {
    title: "Decision Trace",
    rule: "Rule",
    baseline: "Baseline",
    scenario: "Scenario",
    pass: "PASS",
    fail: "FAIL",
    changedOnly: "Changed only",
    allRules: "All rules",
  },

  assumptions: {
    title: "Model Assumptions",
    rows: [
      "Planning horizon: 5 working days.",
      "Normal shift: 8 h/day per line.",
      "Disruption affects Line B only (capacity reduction + duration).",
      "Setup time deducted from available line hours.",
      "Overtime hours are in addition to normal shift hours.",
      "Overtime cost per hour is configurable in Scenario Lab.",
      "Delay penalty accrues from Day 1 overdue.",
      "Revenue at risk = revenue of orders that cannot be completed on time.",
      "Financial impact = delay cost + overtime cost + setup cost + unused capacity cost.",
      "All values are synthetic — not actual production data.",
    ],
  },

  audit: {
    title: "Audit Trail",
    fields: {
      decisionId: "Decision ID",
      scenarioId: "Scenario ID",
      engineVersion: "Engine version",
      configVersion: "Config version",
      computedAt: "Computed at",
      decisionStatus: "Decision status",
      recommendedStrategy: "Recommended strategy",
      totalImpact: "Total impact",
      avoidedCost: "Avoided cost",
      strategiesEvaluated: "Strategies evaluated",
      rulesExecuted: "Rules executed",
      source: "Source",
    },
  },

  buttons: {
    resetToBaseline: "Reset to Baseline",
    findBetterPlan: "Find Better Plan",
    findBetterPlanHint: "View full scheduling analysis",
  },
};

// ---------------------------------------------------------------------------
// Polish
// ---------------------------------------------------------------------------

const pl: ProductionSchedulingCopy = {
  localeOptions: { en: "English", uk: "Українська", pl: "Polski" },

  header: {
    backLink: "Obserwatorium",
    title: "Harmonogramowanie Produkcji",
    subtitle:
      "Pergole, Wiaty i Osłony — Demonstrator Decyzji Harmonogramowania",
    badgeLabel: "Silnik Decyzyjny",
    localeAriaLabel: "Wybierz język",
  },

  disclaimer: {
    default: "Demonstracja syntetyczna — nie są to rzeczywiste dane produkcyjne",
    aerospace: "Syntetyczny scenariusz produkcji lotniczej — nie są to dane klienta",
  },

  disruption: {
    eyebrow: "Zakłócenie produkcji",
    badge: "Wydajność zagrożona",
    capacityReduction: "Redukcja wydajności",
    duration: "Czas trwania",
    hoursLost: "Utracone godziny (okres zakłócenia)",
    hoursRemaining: "pozostało",
    reason: "Przyczyna",
  },

  urgentOrder: {
    eyebrow: "Co jeśli?",
    title: "Co się stanie, jeśli przyjmiemy pilne zamówienie?",
    description: "Sprawdź, jak zmieni się plan produkcji i zalecane działanie.",
    button: "Symuluj pilne zamówienie",
    fields: {
      order: "Zamówienie",
      priority: "Priorytet",
      deadline: "Termin",
      duration: "Czas produkcji",
      product: "Produkt",
      compatibleLines: "Kompatybilne linie",
      revenue: "Przychód",
      delayPenalty: "Kara za opóźnienie",
    },
  },

  simulation: {
    steps: {
      event: {
        title: "Nowe pilne zamówienie klienta",
        desc: "+1 zamówienie — priorytet KRYTYCZNY — Termin: Dzień 2",
      },
      impact: {
        title: "Przeliczanie zdolności produkcyjnych\u2026",
        desc: "Analizuję wpływ na aktualny harmonogram i linie produkcyjne.",
      },
      decision: {
        title: "Ponowna ocena możliwych działań\u2026",
        desc: "Oceniam wszystkie strategie harmonogramowania z nowym zamówieniem.",
      },
    },
    skipAnimation: "Pomiń animację \u2192",
  },

  strategyLabels: {
    KEEP_CURRENT_SCHEDULE: "Zachowaj aktualny harmonogram",
    PRIORITIZE_URGENT_ORDERS: "Priorytetyzuj pilne zamówienia",
    REDISTRIBUTE_TO_OTHER_LINES: "Przeplanuj na inne linie",
    DELAY_LOW_PRIORITY_ORDERS: "Opóźnij zamówienia o niskim priorytecie",
    USE_OVERTIME: "Użyj nadgodzin",
  },

  recommended: {
    eyebrow: "Zalecany harmonogram",
    avoidedCostLabel: "Uniknięty koszt vs. aktualny plan",
    ordersOnTime: "Zamówienia na czas",
    ordersDelayed: "Zamówienia opóźnione",
    totalImpact: "Całkowity wpływ",
    capacityUtilisation: "Wykorzystanie mocy",
    productionSchedule: "Harmonogram produkcji",
    avoidedCostHeading: "Uniknięty koszt",
    avoidedCostComparedTo:
      "W porównaniu z zachowaniem aktualnego harmonogramu w warunkach zakłócenia.",
  },

  beforeAfter: {
    cardTitle: "Wpływ przyjęcia URGENT-201",
    before: "Przed",
    acceptKeepCurrent: "Przyjmij + Zachowaj aktualny",
    acceptRecommended: "Przyjmij + Zalecany",
    notOptimised: "nieoptymalizowane",
    optimised: "zoptymalizowane",
    onTime: "Na czas",
    estimatedImpact: "Szacowany wpływ",
    avoidedByOptimising: "Potencjalnie uniknięty wpływ dzięki optymalizacji",
    avoidedByComparison: "W porównaniu z przyjęciem zamówienia bez przeplanowania.",
    orders: "zamówień",
    order: "zamówienie",
    productionHours: "produkcja",
    revenue: "Przychód",
    riskIfLate: "Ryzyko przy opóźnieniu",
  },

  whatShouldWeDo: {
    eyebrow: "Co powinniśmy zrobić?",
    title: "Zalecane działanie",
    decisionChanged: "Decyzja uległa zmianie",
    decisionUnchanged: "Decyzja bez zmian",
    additionalOrderAbsorbed:
      "Dodatkowe zamówienie można wchłonąć bez zmiany optymalnej strategii:",
    recommendedStrategy: "Zalecana strategia",
    ordersOnTime: "Zamówienia na czas",
    delayed: "Opóźnione",
    totalImpact: "Całkowity wpływ",
    score: "Wynik",
    why: "Dlaczego?",
    keepCurrentFails: "Dlaczego strategia Zachowaj aktualny zawodzi z URGENT-201",
  },

  financial: {
    title: "Wpływ finansowy",
    currentPlan: "Aktualny",
    recommended: "Zalecany",
    delta: "Różnica",
    rows: {
      delayCost: "Koszt opóźnień",
      overtimeCost: "Koszt nadgodzin",
      setupCost: "Koszt przezbrojeń",
      unusedCapacityCost: "Koszt niewykorzystanej mocy",
      totalCost: "Całkowity wpływ operacyjny",
      revenueAtRisk: "Zagrożony przychód",
    },
  },

  alternatives: {
    title: "Alternatywne harmonogramy",
    whyTitle: "Dlaczego ten harmonogram?",
    headers: {
      strategy: "Strategia",
      feasibility: "Wykonalność",
      ordersOnTime: "Na czas",
      delayed: "Opóźnione",
      totalImpact: "Całkowity wpływ",
      score: "Wynik",
    },
    recommended: "Zalecany",
    feasible: "Wykonalny",
    infeasible: "Niewykonalny",
    blocking: "Blokujące ograniczenia",
  },

  scenarioLab: {
    title: "Laboratorium Scenariuszy",
    eyebrow: "Laboratorium Scenariuszy",
    description:
      "Zmień warunki produkcji — silnik ponownie oblicza harmonogram.",
    presetScenariosLabel: "Predefiniowane scenariusze",
    resetToBaseline: "Przywróć dane bazowe",
    baselineResult: "Wynik bazowy",
    scenarioResult: "Wynik scenariusza",
    controls: {
      lineBCapacity: "Redukcja wydajności Linii B",
      disruptionDuration: "Czas trwania zakłócenia",
      dayUnit: "dni",
      criticalDeadline: "Termin krytycznego zamówienia #101: Dzień",
      day: "Dzień",
      materialAvailable: "Materiał ORDER-103 dostępny",
      overtimeEnabled: "Nadgodziny włączone",
      overtimeCost: "Koszt nadgodzin",
      order116Priority: "Priorytet ORDER-116",
    },
    scenLabResult: {
      strategyLabel: "Strategia",
      feasibility: "Wykonalność",
      ordersOnTime: "Zamówienia na czas",
      delayed: "Opóźnione",
      totalImpact: "Całkowity wpływ",
      avoidedCost: "Uniknięty koszt vs. baza",
      sensitivity: "Wrażliwość decyzji",
      sensitivityLevels: { HIGH: "Wysoka", MEDIUM: "Średnia", LOW: "Niska" },
    },
  },

  decisionTrace: {
    title: "Ślad decyzyjny",
    rule: "Reguła",
    baseline: "Baza",
    scenario: "Scenariusz",
    pass: "OK",
    fail: "BŁĄD",
    changedOnly: "Tylko zmienione",
    allRules: "Wszystkie reguły",
  },

  assumptions: {
    title: "Założenia modelu",
    rows: [
      "Horyzont planowania: 5 dni roboczych.",
      "Normalna zmiana: 8 h/dobę na linię.",
      "Zakłócenie dotyczy tylko Linii B (redukcja wydajności + czas trwania).",
      "Czas przezbrojenia odliczany jest od dostępnych godzin linii.",
      "Godziny nadliczbowe są dodatkiem do godzin normalnej zmiany.",
      "Koszt nadgodzin na godzinę jest konfigurowalny w Laboratorium Scenariuszy.",
      "Kara za opóźnienie naliczana jest od 1. dnia po terminie.",
      "Zagrożony przychód = przychód zamówień, których nie można ukończyć na czas.",
      "Wpływ finansowy = koszt opóźnień + nadgodziny + przezbrojenia + niewykorzystana moc.",
      "Wszystkie wartości są syntetyczne — nie są to rzeczywiste dane produkcyjne.",
    ],
  },

  audit: {
    title: "Ścieżka audytu",
    fields: {
      decisionId: "ID decyzji",
      scenarioId: "ID scenariusza",
      engineVersion: "Wersja silnika",
      configVersion: "Wersja konfiguracji",
      computedAt: "Obliczono o",
      decisionStatus: "Status decyzji",
      recommendedStrategy: "Zalecana strategia",
      totalImpact: "Całkowity wpływ",
      avoidedCost: "Uniknięty koszt",
      strategiesEvaluated: "Ocenione strategie",
      rulesExecuted: "Wykonane reguły",
      source: "Źródło",
    },
  },

  buttons: {
    resetToBaseline: "Przywróć dane bazowe",
    findBetterPlan: "Znajdź lepszy plan",
    findBetterPlanHint: "Pełna analiza harmonogramowania",
  },
};

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

const COPY: Record<Locale, ProductionSchedulingCopy> = { en, uk: en, pl };

export function getProductionSchedulingCopy(locale: Locale): ProductionSchedulingCopy {
  return COPY[locale] ?? en;
}
