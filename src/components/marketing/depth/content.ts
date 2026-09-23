import type { MarketingLocale } from '../qdip-copy'

export type DepthPageKey = 'how-it-works' | 'use-cases' | 'core' | 'core/research'
export type ContentSection = {
  eyebrow?: string
  title: string
  body: string
  items?: readonly { title: string; body: string }[]
}
export type CaseStudy = {
  pattern: string
  title: string
  question: string
  problem: string
  inputs: string
  evaluation: string
  output: string
  href: string
}

type DepthContent = {
  nav: readonly [string, string, string, string]
  hero: readonly [string, string, string]
  sections: readonly ContentSection[]
  cases?: readonly CaseStudy[]
  cta: readonly [string, string, string]
}

const en: Record<DepthPageKey, DepthContent> = {
  'how-it-works': {
    nav: ['How it works', 'Solutions', 'Technology', 'Research'],
    hero: [
      'HOW QDIP WORKS',
      'Turn a recurring decision into a repeatable decision system.',
      'QDIP structures the information your team already uses, evaluates explicit alternatives under priorities, constraints, risk and uncertainty, and returns a recommendation with evidence. The responsible person remains in control.',
    ],
    sections: [
      {
        eyebrow: '01 · START WITH THE DECISION',
        title: 'Formalize the decision before optimizing it.',
        body: 'A QDIP implementation starts with one decision your team already makes repeatedly. We identify the trigger, responsible role, available alternatives, objectives, constraints and evidence instead of beginning with a large data or transformation project.',
        items: [
          { title: 'Context', body: 'What is happening now, what changed, and what evidence is available?' },
          { title: 'Alternatives', body: 'What actions are genuinely available to the responsible person?' },
          { title: 'Objectives', body: 'What outcomes matter and how do competing priorities relate?' },
        ],
      },
      {
        eyebrow: '02 · MAKE TRADE-OFFS EXPLICIT',
        title: 'Evaluate what people currently compare in their heads or spreadsheets.',
        body: 'QDIP keeps expected effects, costs, risk, uncertainty and hard constraints separate. That makes the decision model reviewable and prevents an attractive but infeasible option from silently winning.',
        items: [
          { title: 'Effects & costs', body: 'Represent what each alternative is expected to achieve and require.' },
          {
            title: 'Risk & uncertainty',
            body: 'Keep possible downside and confidence in the available information visible.',
          },
          {
            title: 'Constraints',
            body: 'Exclude or penalize choices that violate operational, policy or resource limits.',
          },
        ],
      },
      {
        eyebrow: '03 · EVALUATE',
        title: 'One evaluation path. Comparable recommendations.',
        body: 'QDIP Core applies the configured decision model consistently to the current context. Domain-specific logic plugs into the same engine rather than creating a separate product for every use case.',
        items: [
          {
            title: 'Recommendation',
            body: 'A selected action or prioritized set of actions based on the configured model.',
          },
          { title: 'Evidence', body: 'Supporting information stays connected to the recommendation.' },
          { title: 'Trace', body: 'The evaluated path remains inspectable for review, debugging and governance.' },
        ],
      },
      {
        eyebrow: '04 · HUMAN AUTHORITY',
        title: 'QDIP recommends. Your organization decides.',
        body: 'The purpose is not to remove accountable judgment. It is to make repeated comparison more consistent and inspectable so the responsible person can focus on exceptions, judgment and action.',
      },
      {
        eyebrow: 'FROM PILOT TO USE',
        title: 'Start with one decision, not an enterprise transformation.',
        body: 'A practical adoption path is: describe one recurring decision → formalize its alternatives and constraints → test historical or realistic scenarios → compare QDIP recommendations with the current process → refine the model → integrate only if the result is useful.',
        items: [
          { title: 'Small scope', body: 'Choose one frequent decision with a clear owner and observable inputs.' },
          { title: 'Scenario validation', body: 'Test normal, edge and stress cases before operational use.' },
          {
            title: 'Expand deliberately',
            body: 'Reuse the decision architecture for adjacent decisions only after the first pattern is understood.',
          },
        ],
      },
    ],
    cta: [
      'Have a recurring decision like this?',
      'Show us the decision, the information used today and the constraints that matter. We can map it to a QDIP decision pattern before discussing integration.',
      'Describe your decision',
    ],
  },
  'use-cases': {
    nav: ['How it works', 'Solutions', 'Technology', 'Research'],
    hero: [
      'SOLUTIONS',
      'One Decision Engine. Reusable decision patterns.',
      'Resource Allocation and GTM Lab are working applications. ALLOCATE, DECIDE and PRIORITIZE remain reusable decision patterns for new domains with explicit alternatives, priorities, constraints, uncertainty, evidence and an inspectable recommendation.',
    ],
    sections: [
      {
        eyebrow: 'THE FIT',
        title: 'QDIP is useful where comparison repeats and judgment still matters.',
        body: 'The strongest fit is a recurring decision where people repeatedly collect information, compare several viable options, apply rules or priorities, work within constraints and need to explain the choice afterwards.',
        items: [
          { title: 'Repeated', body: 'The same class of decision appears often enough that consistency matters.' },
          {
            title: 'Constrained',
            body: 'Budget, capacity, policy, timing or operational rules limit the feasible choices.',
          },
          { title: 'Explainable', body: 'Someone needs to understand and defend why one alternative was preferred.' },
        ],
      },
      {
        eyebrow: 'WHAT CHANGES',
        title: 'From manual comparison to a governed decision path.',
        body: 'QDIP does not require replacing the people who know the domain. It gives their decision criteria an explicit structure, evaluates alternatives consistently and preserves the evidence behind the recommendation.',
        items: [
          { title: 'Before', body: 'Information is spread across spreadsheets, messages and individual judgment.' },
          {
            title: 'With QDIP',
            body: 'Inputs, alternatives, priorities and constraints enter one repeatable evaluation path.',
          },
          {
            title: 'After',
            body: 'The responsible person receives a recommendation, evidence and visible trade-offs.',
          },
        ],
      },
      {
        eyebrow: 'BEYOND THE DEMOS',
        title: 'The demos are patterns, not the product boundary.',
        body: 'ALLOCATE applies where scarce resources compete. DECIDE applies where several actions must be compared under changing conditions. PRIORITIZE applies where many opportunities compete for limited attention. A new domain can reuse these patterns without redefining QDIP Core.',
      },
    ],
    cases: [
      {
        pattern: 'ALLOCATE',
        title: 'Resource Allocation',
        question: 'Where should limited resources go?',
        problem:
          'Teams and NGOs often compare requests manually while budgets, eligibility rules, urgency and program priorities compete.',
        inputs: 'Requests, available capacity, priorities, eligibility, constraints and supporting evidence.',
        evaluation:
          'QDIP compares feasible allocations under the same configured criteria and evaluates the current plan through the same decision path.',
        output: 'Recommended allocation, comparison with the current plan and evidence for review.',
        href: '/resource-allocation',
      },
      {
        pattern: 'ALLOCATE',
        title: 'Supply Network Resilience',
        question: 'How should inventory be distributed so one unavailable logistics node does not stop the network?',
        problem:
          'Inventory concentrated in too few logistics nodes can turn one interruption into a network-wide service failure.',
        inputs:
          'Inventory by node and product class, regional demand, node and route capacity, compatibility, lead time and logistics cost.',
        evaluation:
          'QDIP stress-tests normal and single-node-unavailable scenarios, compares feasible allocations and evaluates executable transfers.',
        output:
          'Recommended allocation, executable transfers, baseline comparison, scenario service levels, exposure and worst-case business loss.',
        href: '/supply-network-resilience',
      },
      {
        pattern: 'PRIORITIZE',
        title: 'GTM Lab',
        question: 'Which opportunities deserve attention first?',
        problem:
          'Small commercial teams can spend significant time comparing opportunities with incomplete evidence and competing priorities.',
        inputs: 'Opportunity evidence, fit signals, uncertainty, missing information and prioritization criteria.',
        evaluation:
          'QDIP evaluates opportunities consistently and distinguishes pursue, research, watch and skip outcomes.',
        output: 'Prioritized portfolio with rationale, risks, missing information, next action and provenance.',
        href: '/gtm-lab',
      },
    ],
    cta: [
      'Which of your decisions matches these patterns?',
      'If your exact domain is not shown, start from the decision structure rather than the industry label. Describe the repeated choice and we can determine whether ALLOCATE, DECIDE or PRIORITIZE is a useful starting point.',
      'Describe your decision',
    ],
  },
  core: {
    nav: ['How it works', 'Solutions', 'Technology', 'Research'],
    hero: [
      'QDIP CORE',
      'A technical foundation for inspectable decision systems.',
      'QDIP Core keeps the decision contract explicit: context, alternatives, rules, constraints, risk, uncertainty, evidence, evaluation and recommendation remain connected through one execution path.',
    ],
    sections: [
      {
        eyebrow: 'ARCHITECTURE',
        title: 'Stable core, extensible decision domains.',
        body: 'Domain capabilities plug into a common decision runtime. This separates reusable decision infrastructure from domain-specific evidence and evaluation logic, so a new use case does not require a new product architecture.',
        items: [
          {
            title: 'Decision Engine',
            body: 'Evaluates explicit alternatives through a consistent execution contract.',
          },
          { title: 'Domain plugins', body: 'Supply domain-specific capabilities without redefining the core runtime.' },
          { title: 'Decision API', body: 'Provides a stable boundary between applications and decision execution.' },
        ],
      },
      {
        eyebrow: 'DECISION MODEL',
        title: 'Keep the important concepts separate.',
        body: 'State, alternatives, objectives, expected effects, costs, risk, uncertainty, constraints and evidence are modeled as distinct decision concepts. This makes the model easier to review, test and evolve than a single opaque score.',
      },
      {
        eyebrow: 'EVIDENCE & EXPLAINABILITY',
        title: 'A recommendation should remain inspectable.',
        body: 'QDIP preserves supporting evidence and execution trace so reviewers can inspect why an alternative was selected and which constraints or assumptions shaped the result.',
        items: [
          { title: 'Evidence', body: 'Supporting information remains attached to the evaluated decision.' },
          { title: 'Execution trace', body: 'The evaluated path is available for technical review and debugging.' },
          {
            title: 'Auditability',
            body: 'Decision context and engine metadata can be retained for governance and reproducibility.',
          },
        ],
      },
      {
        eyebrow: 'PRODUCTION BOUNDARIES',
        title: 'Designed as infrastructure, not a demo-specific calculation.',
        body: 'The platform architecture includes tenant-scoped access, API keys, rate limiting, asynchronous decision jobs, feature definitions and values, and an extensible plugin SDK. These boundaries allow applications such as Observatory and Studio to remain separate from decision execution.',
      },
      {
        eyebrow: 'PRODUCT SURFACES',
        title: 'Configure, evaluate, inspect.',
        body: 'Studio configures decision models. QDIP Core evaluates them. Observatory exposes recommendations, alternatives, evidence and scenario changes for inspection. Demos are configured applications of the same architecture.',
      },
    ],
    cta: [
      'Need the technical model behind the demos?',
      'Continue into the research and architecture material, or open a working decision application to inspect the product behavior directly.',
      'Explore Research',
    ],
  },
  'core/research': {
    nav: ['How it works', 'Solutions', 'Technology', 'Research'],
    hero: [
      'QDIP RESEARCH',
      'Decision engineering grounded in explicit assumptions, baselines and reproducible evaluation.',
      'QDIP treats research as a way to challenge the decision model, not decorate the product. We separate implemented capability, experimental evidence and open research questions, and we do not turn an unsuccessful experiment into a success claim.',
    ],
    sections: [
      {
        eyebrow: 'RESEARCH QUESTION',
        title: 'How should a system support repeated decisions under constraints and uncertainty?',
        body: 'The research layer studies how context, alternatives, expected effects, costs, risk, uncertainty and constraints can be represented and evaluated while keeping the recommendation inspectable and human authority explicit.',
      },
      {
        eyebrow: 'METHODOLOGY',
        title: 'Baseline first. Then complexity only when it earns its place.',
        body: 'Experiments define the task, dataset or scenario, baseline, evaluation metrics and failure criteria before interpreting a more complex method. A model that does not beat a relevant baseline is evidence to revise the hypothesis, not a reason to hide the baseline.',
        items: [
          {
            title: 'Baselines',
            body: 'Simple reference strategies establish whether additional complexity creates measurable value.',
          },
          {
            title: 'Scenario tests',
            body: 'Stable, degradation, stress, recovery, noise, missing-data and anomaly conditions expose brittle behavior.',
          },
          {
            title: 'Reproducibility',
            body: 'Inputs, configuration, engine version and evidence should make an evaluation repeatable and reviewable.',
          },
        ],
      },
      {
        eyebrow: 'CLOSED EXPERIMENT',
        title: 'A failed gate closes a product hypothesis.',
        body: 'The Gas Forecast research program was closed after the frozen out-of-sample economic gate failed. Its code and artifacts remain an R&D record, but Gas Forecast is not a public QDIP application or commercial demo.',
      },
      {
        eyebrow: 'RESOURCE ALLOCATION',
        title: 'Compare recommendations against the same evaluation path.',
        body: 'Resource Allocation evaluates a current/manual allocation through the same backend decision capability used for the recommendation. This avoids presenting a frontend-only comparison formula as scientific evidence and makes Current → QDIP → Δ meaningful only when both plans are feasible and evaluated consistently.',
      },
      {
        eyebrow: 'VALIDATION STATUS',
        title: 'Be explicit about what is known and what is not.',
        body: 'Public demos demonstrate implemented decision patterns. They do not by themselves prove customer ROI, universal optimality, academic validation or superiority over every existing process. Those claims require separate evidence.',
        items: [
          {
            title: 'Implemented',
            body: 'Decision engine, rules and constraints, evidence/trace, domain plugins and the public decision applications.',
          },
          {
            title: 'Experimentally tested',
            body: 'Selected hypotheses and baselines in controlled datasets or scenarios.',
          },
          {
            title: 'Under research',
            body: 'Generalization, advanced risk/uncertainty treatment, causal effects and domain-specific validation.',
          },
        ],
      },
      {
        eyebrow: 'WHY THIS MATTERS',
        title: 'Scientific discipline reduces product risk.',
        body: 'For a client, the practical value of this approach is not academic terminology. It is knowing which assumptions drive a recommendation, what evidence supports it, where uncertainty remains, and whether a more complicated method actually improves the decision process.',
      },
    ],
    cta: [
      'Want to evaluate QDIP on a real decision?',
      'A useful pilot starts with a falsifiable question: can a configured QDIP decision model make this recurring comparison more consistent and inspectable than the current process?',
      'Discuss a pilot',
    ],
  },
}

const localizedUseCases: Record<Exclude<MarketingLocale, 'en'>, DepthContent> = {
  uk: {
    nav: ['Як це працює', 'Рішення', 'Технологія', 'Дослідження'],
    hero: [
      'РІШЕННЯ',
      'Один рушій рішень. Багаторазові патерни рішень.',
      'Resource Allocation, Supply Network Resilience і GTM Lab — робочі застосунки. РОЗПОДІЛИТИ, ВИРІШИТИ та ПРІОРИТЕЗУВАТИ залишаються багаторазовими патернами для нових доменів із явними альтернативами, пріоритетами, обмеженнями, невизначеністю, доказами та перевірюваною рекомендацією.',
    ],
    sections: [
      {
        eyebrow: 'ДЕ QDIP ДОРЕЧНИЙ',
        title: 'QDIP корисний там, де порівняння повторюється, а професійне судження залишається важливим.',
        body: 'Найкращий сценарій — регулярне рішення, для якого люди щоразу збирають інформацію, порівнюють кілька реальних варіантів, застосовують правила або пріоритети, працюють у межах обмежень і мають пояснити вибір після рішення.',
        items: [
          { title: 'Повторюваність', body: 'Той самий клас рішень виникає достатньо часто, щоб послідовність мала значення.' },
          { title: 'Обмеження', body: 'Бюджет, потужність, політики, строки або операційні правила звужують допустимі варіанти.' },
          { title: 'Пояснюваність', body: 'Відповідальна людина має розуміти й обґрунтовувати, чому одна альтернатива була кращою.' },
        ],
      },
      {
        eyebrow: 'ЩО ЗМІНЮЄТЬСЯ',
        title: 'Від ручного порівняння до керованого шляху прийняття рішення.',
        body: 'QDIP не замінює людей, які знають предметну область. Він робить критерії рішення явними, послідовно оцінює альтернативи та зберігає обґрунтування рекомендації.',
        items: [
          { title: 'До QDIP', body: 'Інформація розпорошена між таблицями, повідомленнями та особистими судженнями.' },
          { title: 'З QDIP', body: 'Вхідні дані, альтернативи, пріоритети й обмеження проходять один повторюваний шлях оцінювання.' },
          { title: 'Після оцінювання', body: 'Відповідальна людина отримує рекомендацію, докази та видимі компроміси.' },
        ],
      },
      {
        eyebrow: 'ЗА МЕЖАМИ ДЕМО',
        title: 'Демо показують патерни, а не межі продукту.',
        body: 'РОЗПОДІЛИТИ застосовується, коли за дефіцитні ресурси конкурують кілька потреб. ВИРІШИТИ — коли треба порівняти кілька дій за мінливих умов. ПРІОРИТЕЗУВАТИ — коли багато можливостей конкурують за обмежену увагу. Новий домен може повторно використати ці патерни без перевизначення QDIP Core.',
      },
    ],
    cases: [
      {
        pattern: 'РОЗПОДІЛИТИ',
        title: 'Resource Allocation',
        question: 'Куди спрямувати обмежені ресурси?',
        problem: 'Команди та організації часто порівнюють запити вручну, коли одночасно конкурують бюджет, правила допуску, терміновість і програмні пріоритети.',
        inputs: 'Запити, доступна спроможність, пріоритети, правила допуску, обмеження та підтвердні дані.',
        evaluation: 'QDIP порівнює допустимі варіанти розподілу за однаковими налаштованими критеріями та оцінює поточний план через той самий шлях рішення.',
        output: 'Рекомендований розподіл, порівняння з поточним планом та обґрунтування для перевірки.',
        href: '/resource-allocation',
      },
      {
        pattern: 'РОЗПОДІЛИТИ',
        title: 'Supply Network Resilience',
        question: 'Як розподілити запаси, щоб недоступність одного логістичного вузла не зупинила мережу?',
        problem: 'Надмірна концентрація запасів у кількох вузлах може перетворити одну локальну відмову на збій обслуговування всієї мережі.',
        inputs: 'Запаси за вузлами та класами товарів, регіональний попит, потужність вузлів і маршрутів, сумісність, строки та логістична вартість.',
        evaluation: 'QDIP тестує нормальні сценарії та сценарії недоступності одного вузла, порівнює допустимі розподіли й оцінює виконувані переміщення.',
        output: 'Рекомендований розподіл, виконувані переміщення, порівняння з базовими варіантами, рівень обслуговування, експозиція та найгірші бізнес-втрати.',
        href: '/supply-network-resilience',
      },
      {
        pattern: 'ПРІОРИТЕЗУВАТИ',
        title: 'GTM Lab',
        question: 'Які можливості потребують уваги першими?',
        problem: 'Невеликі комерційні команди можуть витрачати багато часу на порівняння можливостей за неповних даних і конкуруючих пріоритетів.',
        inputs: 'Докази щодо можливості, сигнали відповідності, невизначеність, відсутня інформація та критерії пріоритезації.',
        evaluation: 'QDIP послідовно оцінює можливості та розрізняє результати: опрацьовувати, дослідити, спостерігати або відхилити.',
        output: 'Пріоритезований портфель з обґрунтуванням, ризиками, відсутньою інформацією, наступною дією та походженням даних.',
        href: '/gtm-lab',
      },
    ],
    cta: [
      'Яке з ваших рішень відповідає цим патернам?',
      'Якщо вашого домену тут немає, почніть зі структури рішення, а не з назви галузі. Опишіть повторюваний вибір — і ми визначимо, чи підходить РОЗПОДІЛИТИ, ВИРІШИТИ або ПРІОРИТЕЗУВАТИ.',
      'Описати рішення',
    ],
  },
  pl: {
    nav: ['Jak to działa', 'Rozwiązania', 'Technologia', 'Badania'],
    hero: [
      'ROZWIĄZANIA',
      'Jeden silnik decyzyjny. Wielokrotnego użytku wzorce decyzji.',
      'Resource Allocation, Supply Network Resilience i GTM Lab to działające aplikacje. ALOKUJ, DECYDUJ i PRIORYTETYZUJ pozostają wzorcami wielokrotnego użytku dla nowych domen z jawnymi alternatywami, priorytetami, ograniczeniami, niepewnością, dowodami i możliwą do zweryfikowania rekomendacją.',
    ],
    sections: [
      {
        eyebrow: 'GDZIE QDIP PASUJE',
        title: 'QDIP jest użyteczny tam, gdzie porównanie się powtarza, a profesjonalna ocena nadal ma znaczenie.',
        body: 'Najlepszym zastosowaniem jest powtarzalna decyzja, przy której ludzie regularnie zbierają informacje, porównują kilka realnych opcji, stosują reguły lub priorytety, działają w ramach ograniczeń i muszą później uzasadnić wybór.',
        items: [
          { title: 'Powtarzalność', body: 'Ten sam typ decyzji pojawia się wystarczająco często, aby spójność miała znaczenie.' },
          { title: 'Ograniczenia', body: 'Budżet, przepustowość, polityki, terminy lub zasady operacyjne ograniczają możliwe wybory.' },
          { title: 'Wyjaśnialność', body: 'Odpowiedzialna osoba musi rozumieć i uzasadniać, dlaczego wybrano jedną alternatywę.' },
        ],
      },
      {
        eyebrow: 'CO SIĘ ZMIENIA',
        title: 'Od ręcznego porównania do kontrolowanej ścieżki decyzji.',
        body: 'QDIP nie zastępuje osób znających domenę. Nadaje kryteriom decyzji jawną strukturę, spójnie ocenia alternatywy i zachowuje uzasadnienie rekomendacji.',
        items: [
          { title: 'Przed QDIP', body: 'Informacje są rozproszone między arkuszami, wiadomościami i indywidualną oceną.' },
          { title: 'Z QDIP', body: 'Dane wejściowe, alternatywy, priorytety i ograniczenia trafiają do jednej powtarzalnej ścieżki oceny.' },
          { title: 'Po ocenie', body: 'Odpowiedzialna osoba otrzymuje rekomendację, dowody i widoczne kompromisy.' },
        ],
      },
      {
        eyebrow: 'POZA DEMAMI',
        title: 'Dema pokazują wzorce, a nie granice produktu.',
        body: 'ALOKUJ stosuje się, gdy ograniczone zasoby muszą zostać rozdzielone między konkurujące potrzeby. DECYDUJ — gdy trzeba porównać kilka działań w zmiennych warunkach. PRIORYTETYZUJ — gdy wiele możliwości konkuruje o ograniczoną uwagę. Nowa domena może ponownie wykorzystać te wzorce bez redefiniowania QDIP Core.',
      },
    ],
    cases: [
      {
        pattern: 'ALOKUJ',
        title: 'Resource Allocation',
        question: 'Gdzie skierować ograniczone zasoby?',
        problem: 'Zespoły i organizacje często porównują zgłoszenia ręcznie, gdy jednocześnie konkurują budżety, reguły kwalifikacji, pilność i priorytety programu.',
        inputs: 'Zgłoszenia, dostępna przepustowość, priorytety, kwalifikacja, ograniczenia i dane wspierające.',
        evaluation: 'QDIP porównuje wykonalne alokacje według tych samych skonfigurowanych kryteriów i ocenia bieżący plan przez tę samą ścieżkę decyzyjną.',
        output: 'Rekomendowana alokacja, porównanie z bieżącym planem i uzasadnienie do weryfikacji.',
        href: '/resource-allocation',
      },
      {
        pattern: 'ALOKUJ',
        title: 'Supply Network Resilience',
        question: 'Jak rozmieścić zapasy, aby niedostępność jednego węzła logistycznego nie zatrzymała sieci?',
        problem: 'Nadmierna koncentracja zapasów w kilku węzłach może zamienić pojedyncze zakłócenie w problem obsługi całej sieci.',
        inputs: 'Zapasy według węzła i klasy produktu, popyt regionalny, przepustowość węzłów i tras, kompatybilność, czas oraz koszt logistyki.',
        evaluation: 'QDIP testuje scenariusz normalny i scenariusze niedostępności pojedynczego węzła, porównuje wykonalne alokacje i ocenia możliwe przesunięcia.',
        output: 'Rekomendowana alokacja, wykonalne przesunięcia, porównanie z wariantami bazowymi, poziom obsługi, ekspozycja i najgorsza strata biznesowa.',
        href: '/supply-network-resilience',
      },
      {
        pattern: 'PRIORYTETYZUJ',
        title: 'GTM Lab',
        question: 'Które możliwości wymagają uwagi w pierwszej kolejności?',
        problem: 'Małe zespoły komercyjne mogą poświęcać dużo czasu na porównywanie możliwości przy niepełnych danych i konkurujących priorytetach.',
        inputs: 'Dowody dotyczące możliwości, sygnały dopasowania, niepewność, brakujące informacje i kryteria priorytetyzacji.',
        evaluation: 'QDIP spójnie ocenia możliwości i rozróżnia wyniki: rozwijać, zbadać, obserwować lub pominąć.',
        output: 'Priorytetyzowany portfel z uzasadnieniem, ryzykami, brakującymi informacjami, kolejnym działaniem i pochodzeniem danych.',
        href: '/gtm-lab',
      },
    ],
    cta: [
      'Która z Twoich decyzji pasuje do tych wzorców?',
      'Jeśli Twojej domeny tu nie ma, zacznij od struktury decyzji, a nie nazwy branży. Opisz powtarzalny wybór, a określimy, czy ALOKUJ, DECYDUJ lub PRIORYTETYZUJ jest dobrym punktem wyjścia.',
      'Opisz decyzję',
    ],
  },
}

const translate = (locale: MarketingLocale): Record<DepthPageKey, DepthContent> => {
  if (locale === 'en') return en

  const uk = locale === 'uk'
  const labels = uk
    ? ['ЯК ПРАЦЮЄ QDIP', 'РІШЕННЯ', 'QDIP CORE', 'ДОСЛІДЖЕННЯ QDIP']
    : ['JAK DZIAŁA QDIP', 'ROZWIĄZANIA', 'QDIP CORE', 'BADANIA QDIP']
  const nav = uk
    ? (['Як це працює', 'Рішення', 'Технологія', 'Дослідження'] as const)
    : (['Jak to działa', 'Rozwiązania', 'Technologia', 'Badania'] as const)
  const cta = uk
    ? ([
        'Опишіть ваше регулярне рішення',
        'Покажіть нам один повторюваний вибір, дані та обмеження — ми визначимо, чи підходить для нього QDIP.',
        'Описати рішення',
      ] as const)
    : ([
        'Opisz swoją powtarzalną decyzję',
        'Pokaż nam jeden powtarzalny wybór, dane i ograniczenia — ocenimy, czy QDIP do niego pasuje.',
        'Opisz decyzję',
      ] as const)

  const localizeFallback = (page: DepthContent, i: number): DepthContent => ({
    ...page,
    nav,
    hero: [labels[i], page.hero[1], page.hero[2]],
    cta,
  })

  return {
    'how-it-works': localizeFallback(en['how-it-works'], 0),
    'use-cases': localizedUseCases[locale],
    core: localizeFallback(en.core, 2),
    'core/research': localizeFallback(en['core/research'], 3),
  }
}

export function getDepthContent(locale: MarketingLocale, key: DepthPageKey): DepthContent {
  return translate(locale)[key]
}
