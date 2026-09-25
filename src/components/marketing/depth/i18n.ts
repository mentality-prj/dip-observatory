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
      'Resource Allocation, Supply Network Optimization and GTM Lab are working applications. ALLOCATE, DECIDE and PRIORITIZE remain reusable decision patterns for new domains with explicit alternatives, priorities, constraints, uncertainty, evidence and an inspectable recommendation.',
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
        title: 'Supply Network Optimization',
        question:
          'Where should inventory be stored, how should demand be fulfilled, and how should the network adapt when warehouse capacity changes?',
        problem:
          'Inventory, inbound supply and fulfillment are often planned separately, which can increase logistics cost, create capacity bottlenecks and amplify disruption risk.',
        inputs:
          'Inventory by warehouse and product class, geographically differentiated demand, inbound supply, warehouse and route capacity, storage compatibility, lead time and logistics cost.',
        evaluation:
          'QDIP optimizes inventory placement, inbound allocation and fulfillment under hard network constraints, then re-runs the same model for unavailable and candidate warehouse scenarios.',
        output:
          'Recommended inventory placement, fulfillment and inbound allocation, executable transfers, scenario KPIs and candidate warehouse areas with traceable optimizer evidence.',
        href: '/supply-network-optimization',
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
      'Resource Allocation, Supply Network Optimization і GTM Lab — робочі застосунки. РОЗПОДІЛИТИ, ВИРІШИТИ та ПРІОРИТЕЗУВАТИ залишаються багаторазовими патернами для нових доменів із явними альтернативами, пріоритетами, обмеженнями, невизначеністю, доказами та перевірюваною рекомендацією.',
    ],
    sections: [
      {
        eyebrow: 'ДЕ QDIP ДОРЕЧНИЙ',
        title: 'QDIP корисний там, де порівняння повторюється, а професійне судження залишається важливим.',
        body: 'Найкращий сценарій — регулярне рішення, для якого люди щоразу збирають інформацію, порівнюють кілька реальних варіантів, застосовують правила або пріоритети, працюють у межах обмежень і мають пояснити вибір після рішення.',
        items: [
          {
            title: 'Повторюваність',
            body: 'Той самий клас рішень виникає достатньо часто, щоб послідовність мала значення.',
          },
          {
            title: 'Обмеження',
            body: 'Бюджет, потужність, політики, строки або операційні правила звужують допустимі варіанти.',
          },
          {
            title: 'Пояснюваність',
            body: 'Відповідальна людина має розуміти й обґрунтовувати, чому одна альтернатива була кращою.',
          },
        ],
      },
      {
        eyebrow: 'ЩО ЗМІНЮЄТЬСЯ',
        title: 'Від ручного порівняння до керованого шляху прийняття рішення.',
        body: 'QDIP не замінює людей, які знають предметну область. Він робить критерії рішення явними, послідовно оцінює альтернативи та зберігає обґрунтування рекомендації.',
        items: [
          { title: 'До QDIP', body: 'Інформація розпорошена між таблицями, повідомленнями та особистими судженнями.' },
          {
            title: 'З QDIP',
            body: 'Вхідні дані, альтернативи, пріоритети й обмеження проходять один повторюваний шлях оцінювання.',
          },
          {
            title: 'Після оцінювання',
            body: 'Відповідальна людина отримує рекомендацію, докази та видимі компроміси.',
          },
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
        problem:
          'Команди та організації часто порівнюють запити вручну, коли одночасно конкурують бюджет, правила допуску, терміновість і програмні пріоритети.',
        inputs: 'Запити, доступна спроможність, пріоритети, правила допуску, обмеження та підтвердні дані.',
        evaluation:
          'QDIP порівнює допустимі варіанти розподілу за однаковими налаштованими критеріями та оцінює поточний план через той самий шлях рішення.',
        output: 'Рекомендований розподіл, порівняння з поточним планом та обґрунтування для перевірки.',
        href: '/resource-allocation',
      },
      {
        pattern: 'РОЗПОДІЛИТИ',
        title: 'Supply Network Optimization',
        question:
          'Де зберігати запаси, як покривати попит і як перебудовувати мережу при зміні доступної складської потужності?',
        problem:
          'Окреме планування запасів, вхідних поставок і виконання попиту може збільшувати логістичні витрати, створювати вузькі місця потужності та посилювати ризик збоїв.',
        inputs:
          'Запаси за складами й класами товарів, географічно різний попит, вхідні поставки, потужність складів і маршрутів, сумісність зберігання, строки та логістична вартість.',
        evaluation:
          'QDIP оптимізує розміщення запасів, вхідні поставки та покриття попиту з жорсткими мережевими обмеженнями, а потім повторює той самий розрахунок для недоступного або нового складу.',
        output:
          'Рекомендоване розміщення запасів, постачання точок попиту, вхідний розподіл, переміщення, сценарні KPI та рекомендовані зони нового складу з перевірюваним обґрунтуванням.',
        href: '/supply-network-optimization',
      },
      {
        pattern: 'ПРІОРИТЕЗУВАТИ',
        title: 'GTM Lab',
        question: 'Які можливості потребують уваги першими?',
        problem:
          'Невеликі комерційні команди можуть витрачати багато часу на порівняння можливостей за неповних даних і конкуруючих пріоритетів.',
        inputs:
          'Докази щодо можливості, сигнали відповідності, невизначеність, відсутня інформація та критерії пріоритезації.',
        evaluation:
          'QDIP послідовно оцінює можливості та розрізняє результати: опрацьовувати, дослідити, спостерігати або відхилити.',
        output:
          'Пріоритезований портфель з обґрунтуванням, ризиками, відсутньою інформацією, наступною дією та походженням даних.',
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
      'Resource Allocation, Supply Network Optimization i GTM Lab to działające aplikacje. ALOKUJ, DECYDUJ i PRIORYTETYZUJ pozostają wzorcami wielokrotnego użytku dla nowych domen z jawnymi alternatywami, priorytetami, ograniczeniami, niepewnością, dowodami i możliwą do zweryfikowania rekomendacją.',
    ],
    sections: [
      {
        eyebrow: 'GDZIE QDIP PASUJE',
        title: 'QDIP jest użyteczny tam, gdzie porównanie się powtarza, a profesjonalna ocena nadal ma znaczenie.',
        body: 'Najlepszym zastosowaniem jest powtarzalna decyzja, przy której ludzie regularnie zbierają informacje, porównują kilka realnych opcji, stosują reguły lub priorytety, działają w ramach ograniczeń i muszą później uzasadnić wybór.',
        items: [
          {
            title: 'Powtarzalność',
            body: 'Ten sam typ decyzji pojawia się wystarczająco często, aby spójność miała znaczenie.',
          },
          {
            title: 'Ograniczenia',
            body: 'Budżet, przepustowość, polityki, terminy lub zasady operacyjne ograniczają możliwe wybory.',
          },
          {
            title: 'Wyjaśnialność',
            body: 'Odpowiedzialna osoba musi rozumieć i uzasadniać, dlaczego wybrano jedną alternatywę.',
          },
        ],
      },
      {
        eyebrow: 'CO SIĘ ZMIENIA',
        title: 'Od ręcznego porównania do kontrolowanej ścieżki decyzji.',
        body: 'QDIP nie zastępuje osób znających domenę. Nadaje kryteriom decyzji jawną strukturę, spójnie ocenia alternatywy i zachowuje uzasadnienie rekomendacji.',
        items: [
          {
            title: 'Przed QDIP',
            body: 'Informacje są rozproszone między arkuszami, wiadomościami i indywidualną oceną.',
          },
          {
            title: 'Z QDIP',
            body: 'Dane wejściowe, alternatywy, priorytety i ograniczenia trafiają do jednej powtarzalnej ścieżki oceny.',
          },
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
        problem:
          'Zespoły i organizacje często porównują zgłoszenia ręcznie, gdy jednocześnie konkurują budżety, reguły kwalifikacji, pilność i priorytety programu.',
        inputs: 'Zgłoszenia, dostępna przepustowość, priorytety, kwalifikacja, ograniczenia i dane wspierające.',
        evaluation:
          'QDIP porównuje wykonalne alokacje według tych samych skonfigurowanych kryteriów i ocenia bieżący plan przez tę samą ścieżkę decyzyjną.',
        output: 'Rekomendowana alokacja, porównanie z bieżącym planem i uzasadnienie do weryfikacji.',
        href: '/resource-allocation',
      },
      {
        pattern: 'ALOKUJ',
        title: 'Supply Network Optimization',
        question:
          'Gdzie przechowywać zapasy, jak obsługiwać popyt i jak przebudować sieć po zmianie dostępnej przepustowości magazynowej?',
        problem:
          'Oddzielne planowanie zapasów, dostaw przychodzących i realizacji popytu może zwiększać koszty logistyki, tworzyć wąskie gardła przepustowości i wzmacniać ryzyko zakłóceń.',
        inputs:
          'Zapasy według magazynu i klasy produktu, geograficznie zróżnicowany popyt, dostawy przychodzące, przepustowość magazynów i tras, zgodność składowania, czas oraz koszt logistyki.',
        evaluation:
          'QDIP optymalizuje rozmieszczenie zapasów, dostawy przychodzące i realizację popytu przy twardych ograniczeniach sieciowych, a następnie uruchamia ten sam model dla niedostępnego lub nowego magazynu.',
        output:
          'Rekomendowane rozmieszczenie zapasów, realizacja popytu, alokacja dostaw przychodzących, przesunięcia, KPI scenariuszy i rekomendowane obszary nowego magazynu z weryfikowalnym uzasadnieniem.',
        href: '/supply-network-optimization',
      },
      {
        pattern: 'PRIORYTETYZUJ',
        title: 'GTM Lab',
        question: 'Które możliwości wymagają uwagi w pierwszej kolejności?',
        problem:
          'Małe zespoły komercyjne mogą poświęcać dużo czasu na porównywanie możliwości przy niepełnych danych i konkurujących priorytetach.',
        inputs:
          'Dowody dotyczące możliwości, sygnały dopasowania, niepewność, brakujące informacje i kryteria priorytetyzacji.',
        evaluation: 'QDIP spójnie ocenia możliwości i rozróżnia wyniki: rozwijać, zbadać, obserwować lub pominąć.',
        output:
          'Priorytetyzowany portfel z uzasadnieniem, ryzykami, brakującymi informacjami, kolejnym działaniem i pochodzeniem danych.',
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
