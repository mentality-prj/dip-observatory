import type { MarketingLocale } from '../qdip-copy'
import type { DepthContent } from './content'

export const depthUiI18n = {
  en: {
    explore: 'Explore working demos',
    describe: 'Describe your decision',
    open: 'Open',
    inputs: 'INPUTS',
    evaluation: 'EVALUATION',
    output: 'OUTPUT',
    next: 'NEXT STEP',
  },
  uk: {
    explore: 'Переглянути робочі демо',
    describe: 'Описати рішення',
    open: 'Відкрити',
    inputs: 'ВХІДНІ ДАНІ',
    evaluation: 'ОЦІНЮВАННЯ',
    output: 'РЕЗУЛЬТАТ',
    next: 'НАСТУПНИЙ КРОК',
  },
  pl: {
    explore: 'Zobacz działające dema',
    describe: 'Opisz decyzję',
    open: 'Otwórz',
    inputs: 'DANE WEJŚCIOWE',
    evaluation: 'OCENA',
    output: 'WYNIK',
    next: 'NASTĘPNY KROK',
  },
} as const satisfies Record<MarketingLocale, Record<string, string>>

export const useCasesI18n: Record<MarketingLocale, DepthContent> = {
  en: {
    nav: ['How it works', 'Solutions', 'Technology', 'Research'],
    hero: [
      'SOLUTIONS',
      'One Decision Engine. Reusable decision patterns.',
      'Resource Allocation, Supply Network Resilience and GTM Lab are working applications. ALLOCATE, DECIDE and PRIORITIZE remain reusable decision patterns for new domains with explicit alternatives, priorities, constraints, uncertainty, evidence and an inspectable recommendation.',
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

