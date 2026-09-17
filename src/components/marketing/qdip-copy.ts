export const marketingLocales = ["en", "uk", "pl"] as const;
export type MarketingLocale = (typeof marketingLocales)[number];

type DemoCopy = { title: string; description: string; domain: string };
type CapabilityCopy = { title: string; description: string };
type LayerCopy = {
  label: string;
  title: string;
  description: string;
  bullets: [string, string, string];
  link?: string;
};

export type MarketingCopy = {
  nav: [string, string, string, string];
  openStudio: string;
  exploreDemos: string;
  eyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroBody: string;
  buildStudio: string;
  heroProof: string;
  trace: {
    title: string; online: string; state: string; disruption: string;
    confidence: string; steps: [string, string, string, string];
    reroute: string; recommended: string; hold: string; higherRisk: string;
    why: string; explanation: string;
  };
  proof: [string, string, string, string];
  problem: { label: string; lines: [string, string, string]; shift: string; answer: string; rows: [string, string, string] };
  platform: { eyebrow: string; title: string; body: string; layers: [LayerCopy, LayerCopy, LayerCopy] };
  demos: { eyebrow: string; title: string; body: string; run: string; all: string; items: [DemoCopy, DemoCopy, DemoCopy, DemoCopy, DemoCopy, DemoCopy] };
  trust: { eyebrow: string; title: string; body: string; badge: string; capabilities: [CapabilityCopy, CapabilityCopy, CapabilityCopy, CapabilityCopy] };
  cta: { title: string; body: string; observatory: string; studio: string };
  footer: string;
};

export const marketingCopy: Record<MarketingLocale, MarketingCopy> = {
  en: {
    nav: ["Platform", "Products", "Live demos", "Trust"],
    openStudio: "Open Studio", exploreDemos: "Explore demos",
    eyebrow: "Quality-driven decision intelligence",
    heroTitle: "From complex signals to decisions", heroAccent: "you can defend.",
    heroBody: "QDIP models alternatives, quantifies uncertainty and preserves the evidence behind every recommendation — before people or systems act.",
    buildStudio: "Build in Studio", heroProof: "Explainable by design · Human-governed · API-first",
    trace: { title: "LIVE DECISION TRACE", online: "ENGINE ONLINE", state: "CURRENT STATE", disruption: "Supply disruption", confidence: "confidence", steps: ["STATE", "OPTIONS", "RISK", "DECISION"], reroute: "Reroute supply", recommended: "RECOMMENDED", hold: "Hold schedule", higherRisk: "HIGHER RISK", why: "Why this decision?", explanation: "Rerouting protects the service threshold while keeping cost and propagation risk within policy limits." },
    proof: ["One decision layer", "Rules + models + optimization", "Evidence on every run", "Human approval when it matters"],
    problem: { label: "THE PROBLEM", lines: ["More AI.", "More dashboards.", "Still no accountable decision."], shift: "THE QDIP SHIFT", answer: "Move from insight to a decision — with the reasoning attached.", rows: ["Uncertainty is explicit", "Alternatives are comparable", "Every outcome is auditable"] },
    platform: { eyebrow: "One platform, full decision lifecycle", title: "Model. Decide. Observe. Improve.", body: "QDIP keeps authoring, execution and observation connected without collapsing them into one opaque AI workflow.", layers: [
      { label: "QDIP ENGINE", title: "Execute governed decisions", description: "Evaluate rules, models, constraints, uncertainty and alternatives through a single stable API.", bullets: ["Hybrid rule + ML execution", "Risk and uncertainty analysis", "Versioned traces and evidence"] },
      { label: "QDIP STUDIO", title: "Design decision systems", description: "Configure profiles, plugins, dimensions and output bindings without hiding the execution contract.", bullets: ["Decision profile authoring", "Plugin and capability registry", "Schema-driven configuration"], link: "Open Studio" },
      { label: "QDIP OBSERVATORY", title: "See decisions before they scale", description: "Replay scenarios, compare alternatives and inspect risk, evidence and outcomes in context.", bullets: ["Interactive scenario analysis", "State and trajectory views", "Human feedback and audit"], link: "Open Observatory" },
    ] },
    demos: { eyebrow: "QDIP in action", title: "Live decision demonstrators", body: "Explore domain-specific workspaces with explicit alternatives, uncertainty, constraints and decision evidence — not static mockups.", run: "Run demo", all: "View all demonstrators", items: [
      { title: "European gas forecasting", description: "Forecast market conditions, compare BUY / WAIT / SPLIT alternatives and inspect calibration evidence.", domain: "ENERGY" },
      { title: "Production replanning", description: "Respond to live disruptions, test recovery scenarios and expose propagation risk before acting.", domain: "MANUFACTURING" },
      { title: "Resource allocation", description: "Allocate mobile teams based on demand, skills, capacity, accessibility and travel constraints.", domain: "OPERATIONS" },
      { title: "Supplier decision", description: "Compare suppliers across cost, resilience, uncertainty and explicit operational constraints.", domain: "SUPPLY CHAIN" },
      { title: "Production scheduling", description: "Explore capacity, deadlines and disruptions in an interactive scheduling decision lab.", domain: "PLANNING" },
      { title: "Decision core lab", description: "Run reference scenarios through state, alternatives, risk, uncertainty and evidence.", domain: "PLATFORM" },
    ] },
    trust: { eyebrow: "Built for accountable automation", title: "Trust is part of the execution path.", body: "QDIP does not ask teams to accept an unexplained score. Evidence, ownership and review remain attached to the decision lifecycle.", badge: "Explainable and auditable by design", capabilities: [
      { title: "Hybrid reasoning", description: "Combine rules, analytical models and optimization in one traceable execution path." },
      { title: "Decision evidence", description: "See which conditions passed, which rules matched and why an alternative ranked first." },
      { title: "Human control", description: "Keep experts in the loop for review, adjustment, approval and outcome feedback." },
      { title: "Tenant boundaries", description: "Scope API keys, decision profiles and audit records to the organization that owns them." },
    ] },
    cta: { title: "See the decision — not just the dashboard.", body: "Run a live scenario, inspect the evidence and challenge the recommended action.", observatory: "Explore Observatory", studio: "Configure in Studio" },
    footer: "Quality-driven Decision Intelligence Platform.",
  },
  uk: {
    nav: ["Платформа", "Продукти", "Демо", "Надійність"],
    openStudio: "Відкрити Studio", exploreDemos: "Переглянути демо",
    eyebrow: "Інтелект прийняття рішень, керований якістю",
    heroTitle: "Від складних сигналів до рішень,", heroAccent: "які можна обґрунтувати.",
    heroBody: "QDIP моделює альтернативи, оцінює невизначеність і зберігає докази для кожної рекомендації — до того, як діятимуть люди або системи.",
    buildStudio: "Створити в Studio", heroProof: "Пояснюваність за задумом · Контроль людини · API-first",
    trace: { title: "ЖИВИЙ ТРЕЙС РІШЕННЯ", online: "РУШІЙ ПРАЦЮЄ", state: "ПОТОЧНИЙ СТАН", disruption: "Збій постачання", confidence: "впевненість", steps: ["СТАН", "ВАРІАНТИ", "РИЗИК", "РІШЕННЯ"], reroute: "Змінити маршрут", recommended: "РЕКОМЕНДОВАНО", hold: "Зберегти план", higherRisk: "ВИЩИЙ РИЗИК", why: "Чому це рішення?", explanation: "Зміна маршруту захищає рівень сервісу, утримуючи вартість і ризик поширення в межах політик." },
    proof: ["Єдиний шар рішень", "Правила + моделі + оптимізація", "Докази для кожного запуску", "Погодження людиною, коли це важливо"],
    problem: { label: "ПРОБЛЕМА", lines: ["Більше AI.", "Більше дашбордів.", "Але досі немає відповідального рішення."], shift: "ПІДХІД QDIP", answer: "Від аналітики до рішення — разом із його обґрунтуванням.", rows: ["Невизначеність явна", "Альтернативи порівнювані", "Кожен результат відтворюваний"] },
    platform: { eyebrow: "Одна платформа, повний життєвий цикл рішення", title: "Моделюйте. Вирішуйте. Спостерігайте. Покращуйте.", body: "QDIP поєднує проєктування, виконання та спостереження, не перетворюючи їх на непрозорий AI-процес.", layers: [
      { label: "QDIP ENGINE", title: "Виконуйте керовані рішення", description: "Оцінюйте правила, моделі, обмеження, невизначеність і альтернативи через стабільний API.", bullets: ["Гібридне виконання правил і ML", "Аналіз ризику та невизначеності", "Версійовані трейси й докази"] },
      { label: "QDIP STUDIO", title: "Проєктуйте системи рішень", description: "Налаштовуйте профілі, плагіни, виміри та прив’язки результатів, не приховуючи контракт виконання.", bullets: ["Конфігурація профілів рішень", "Реєстр плагінів і можливостей", "Конфігурація на основі схем"], link: "Відкрити Studio" },
      { label: "QDIP OBSERVATORY", title: "Перевіряйте рішення до масштабування", description: "Відтворюйте сценарії, порівнюйте альтернативи та аналізуйте ризик, докази й результати в контексті.", bullets: ["Інтерактивний аналіз сценаріїв", "Візуалізація станів і траєкторій", "Зворотний зв’язок і аудит"], link: "Відкрити Observatory" },
    ] },
    demos: { eyebrow: "QDIP у дії", title: "Живі демонстратори рішень", body: "Досліджуйте галузеві робочі простори з явними альтернативами, невизначеністю, обмеженнями та доказами — не статичні макети.", run: "Запустити демо", all: "Переглянути всі демонстратори", items: [
      { title: "Прогнозування європейського газового ринку", description: "Прогнозуйте стан ринку, порівнюйте BUY / WAIT / SPLIT і перевіряйте докази калібрування.", domain: "ЕНЕРГЕТИКА" },
      { title: "Перепланування виробництва", description: "Реагуйте на збої, тестуйте сценарії відновлення й оцінюйте ризик поширення до дії.", domain: "ВИРОБНИЦТВО" },
      { title: "Розподіл ресурсів", description: "Розподіляйте мобільні команди з урахуванням попиту, навичок, потужності, доступності та маршрутів.", domain: "ОПЕРАЦІЇ" },
      { title: "Вибір постачальника", description: "Порівнюйте постачальників за вартістю, стійкістю, невизначеністю та операційними обмеженнями.", domain: "ПОСТАЧАННЯ" },
      { title: "Планування виробництва", description: "Досліджуйте потужність, дедлайни та збої в інтерактивній лабораторії рішень.", domain: "ПЛАНУВАННЯ" },
      { title: "Лабораторія ядра рішень", description: "Пропускайте еталонні сценарії через стан, альтернативи, ризик, невизначеність і докази.", domain: "ПЛАТФОРМА" },
    ] },
    trust: { eyebrow: "Для відповідальної автоматизації", title: "Довіра є частиною виконання.", body: "QDIP не пропонує командам приймати непояснену оцінку. Докази, відповідальність і перевірка залишаються частиною життєвого циклу рішення.", badge: "Пояснюваність і аудит за задумом", capabilities: [
      { title: "Гібридне міркування", description: "Поєднуйте правила, аналітичні моделі й оптимізацію в одному відтворюваному процесі." },
      { title: "Докази рішення", description: "Перевіряйте умови, правила та причини, через які альтернатива отримала перше місце." },
      { title: "Контроль людини", description: "Залишайте експертів у контурі перевірки, коригування, погодження та оцінювання результатів." },
      { title: "Ізоляція організацій", description: "Обмежуйте API-ключі, профілі й записи аудиту організацією-власником." },
    ] },
    cta: { title: "Бачте рішення, а не лише дашборд.", body: "Запустіть живий сценарій, перевірте докази та поставте рекомендацію під сумнів.", observatory: "Відкрити Observatory", studio: "Налаштувати в Studio" },
    footer: "Quality-driven Decision Intelligence Platform.",
  },
  pl: {
    nav: ["Platforma", "Produkty", "Demo", "Zaufanie"],
    openStudio: "Otwórz Studio", exploreDemos: "Zobacz demo",
    eyebrow: "Inteligencja decyzyjna sterowana jakością",
    heroTitle: "Od złożonych sygnałów do decyzji,", heroAccent: "które można obronić.",
    heroBody: "QDIP modeluje alternatywy, szacuje niepewność i zachowuje dowody stojące za każdą rekomendacją — zanim zadziałają ludzie lub systemy.",
    buildStudio: "Buduj w Studio", heroProof: "Wyjaśnialność od podstaw · Nadzór człowieka · API-first",
    trace: { title: "ŚLAD DECYZJI NA ŻYWO", online: "SILNIK ONLINE", state: "BIEŻĄCY STAN", disruption: "Zakłócenie dostaw", confidence: "pewność", steps: ["STAN", "OPCJE", "RYZYKO", "DECYZJA"], reroute: "Zmień trasę dostaw", recommended: "REKOMENDOWANE", hold: "Utrzymaj plan", higherRisk: "WYŻSZE RYZYKO", why: "Dlaczego ta decyzja?", explanation: "Zmiana trasy chroni poziom usług, utrzymując koszt i ryzyko propagacji w granicach polityk." },
    proof: ["Jedna warstwa decyzyjna", "Reguły + modele + optymalizacja", "Dowody przy każdym uruchomieniu", "Akceptacja człowieka, gdy ma znaczenie"],
    problem: { label: "PROBLEM", lines: ["Więcej AI.", "Więcej dashboardów.", "Nadal brak odpowiedzialnej decyzji."], shift: "ZMIANA QDIP", answer: "Od wniosku do decyzji — wraz z uzasadnieniem.", rows: ["Niepewność jest jawna", "Alternatywy są porównywalne", "Każdy wynik podlega audytowi"] },
    platform: { eyebrow: "Jedna platforma, pełny cykl życia decyzji", title: "Modeluj. Decyduj. Obserwuj. Ulepszaj.", body: "QDIP łączy projektowanie, wykonanie i obserwację, nie zamieniając ich w nieprzejrzysty proces AI.", layers: [
      { label: "QDIP ENGINE", title: "Wykonuj nadzorowane decyzje", description: "Oceniaj reguły, modele, ograniczenia, niepewność i alternatywy za pośrednictwem stabilnego API.", bullets: ["Hybrydowe wykonanie reguł i ML", "Analiza ryzyka i niepewności", "Wersjonowane ślady i dowody"] },
      { label: "QDIP STUDIO", title: "Projektuj systemy decyzyjne", description: "Konfiguruj profile, wtyczki, wymiary i mapowania wyników bez ukrywania kontraktu wykonania.", bullets: ["Tworzenie profili decyzyjnych", "Rejestr wtyczek i możliwości", "Konfiguracja oparta na schematach"], link: "Otwórz Studio" },
      { label: "QDIP OBSERVATORY", title: "Sprawdzaj decyzje przed skalowaniem", description: "Odtwarzaj scenariusze, porównuj alternatywy i analizuj ryzyko, dowody oraz wyniki w kontekście.", bullets: ["Interaktywna analiza scenariuszy", "Widoki stanów i trajektorii", "Informacja zwrotna i audyt"], link: "Otwórz Observatory" },
    ] },
    demos: { eyebrow: "QDIP w działaniu", title: "Interaktywne demonstratory decyzji", body: "Poznaj branżowe środowiska z jawnymi alternatywami, niepewnością, ograniczeniami i dowodami — nie statyczne makiety.", run: "Uruchom demo", all: "Zobacz wszystkie demonstratory", items: [
      { title: "Prognozowanie europejskiego rynku gazu", description: "Prognozuj warunki rynkowe, porównuj BUY / WAIT / SPLIT i sprawdzaj dowody kalibracji.", domain: "ENERGETYKA" },
      { title: "Przeplanowanie produkcji", description: "Reaguj na zakłócenia, testuj scenariusze odbudowy i oceniaj ryzyko propagacji przed działaniem.", domain: "PRODUKCJA" },
      { title: "Alokacja zasobów", description: "Przydzielaj zespoły z uwzględnieniem popytu, kompetencji, wydajności, dostępności i tras.", domain: "OPERACJE" },
      { title: "Wybór dostawcy", description: "Porównuj dostawców pod względem kosztu, odporności, niepewności i ograniczeń operacyjnych.", domain: "ŁAŃCUCH DOSTAW" },
      { title: "Harmonogramowanie produkcji", description: "Analizuj moce, terminy i zakłócenia w interaktywnym laboratorium decyzji.", domain: "PLANOWANIE" },
      { title: "Laboratorium rdzenia decyzyjnego", description: "Uruchamiaj scenariusze referencyjne, analizując stan, alternatywy, ryzyko, niepewność i dowody.", domain: "PLATFORMA" },
    ] },
    trust: { eyebrow: "Dla odpowiedzialnej automatyzacji", title: "Zaufanie jest częścią procesu wykonania.", body: "QDIP nie wymaga od zespołów akceptowania niewyjaśnionej oceny. Dowody, odpowiedzialność i przegląd pozostają częścią cyklu życia decyzji.", badge: "Wyjaśnialność i audyt od podstaw", capabilities: [
      { title: "Rozumowanie hybrydowe", description: "Łącz reguły, modele analityczne i optymalizację w jednej odtwarzalnej ścieżce wykonania." },
      { title: "Dowody decyzji", description: "Sprawdzaj warunki, reguły i powody, dla których alternatywa zajęła pierwsze miejsce." },
      { title: "Kontrola człowieka", description: "Utrzymuj ekspertów w procesie przeglądu, korekty, akceptacji i oceny wyników." },
      { title: "Granice organizacji", description: "Ograniczaj klucze API, profile i zapisy audytu do organizacji, która jest ich właścicielem." },
    ] },
    cta: { title: "Zobacz decyzję, nie tylko dashboard.", body: "Uruchom scenariusz, sprawdź dowody i zakwestionuj rekomendowane działanie.", observatory: "Otwórz Observatory", studio: "Konfiguruj w Studio" },
    footer: "Quality-driven Decision Intelligence Platform.",
  },
};