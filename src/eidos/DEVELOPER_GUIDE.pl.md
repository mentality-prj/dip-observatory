# Przewodnik deweloperski EIDOS Decision Observatory

Wersja angielska: [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md)

Ten dokument jest technicznym punktem odniesienia dla prototypu EIDOS
zaimplementowanego w `dip-observatory`. Czytaj go razem z [`README.pl.md`](./README.pl.md),
gdy zmieniasz funkcję, walidujesz ją lub planujesz ścieżkę do realnej integracji.

## 1. Czym jest ta funkcja

EIDOS Decision Observatory to samodzielny interfejs ukierunkowany na decyzje,
który pozwala ekspertowi ds. zakupu energii obserwować wielu klientów naraz i
skupiać się tylko na decyzjach, które się zmieniły.

Aktualne granice implementacji:

- To **frontendowy prototyp** wewnątrz `dip-observatory`.
- Jest **syntetyczny i deterministyczny**: bez runtime randomness, bez live API,
  bez bazy danych i bez połączenia z EIDOS.
- Jest **odseparowany od głównego przepływu danych DIP Observatory**. Główna
  powierzchnia korzysta z DIP bootstrap/run APIs; EIDOS nie.
- Jest **bezpieczny do demo**, bo nie może modyfikować żadnych systemów zewnętrznych.

## 2. Bieżący kontrakt funkcji

Ta gałąź gwarantuje dziś następujące zachowanie:

- `/eidos` przekierowuje do wersji z locale, np. `/en/eidos` lub `/pl/eidos`.
- Obsługiwane locale w prototypie EIDOS to `en` i `pl`.
- Nieobsługiwane ścieżki locale dla EIDOS, takie jak `/uk/eidos` lub
  `/es/eidos`, przekierowują do `en`.
- Podsumowanie portfela i tabela klientów są zawsze oceniane w scenariuszu `BASELINE`.
- Przełączanie scenariuszy w detail view służy tylko do eksploracji pojedynczego klienta.
- Domyślny klient demo to `eidos-03` (`Helios Ceramics`).
- Rozkład portfela w `BASELINE` jest deterministyczny:
  `12 STABLE / 4 STRATEGY_CHANGED / 2 HIGH_RISK / 2 ACTION_REQUIRED`.
- Dla klienta demo rekomendacja zmienia się przy przejściu z `BASELINE` do `HIGH_PRICE`.
- Każdy detail view zawiera:
  bieżącą vs rekomendowaną strategię, selector scenariusza, tabelę alternatyw,
  wykres trade-off, explanation, replay, historię decyzji oraz outcome tracking.

Jeżeli którykolwiek z tych punktów zmieni się świadomie, zaktualizuj testy i dokumentację.

## 3. Mapa plików będących source of truth

### Routing

- `src/app/eidos/page.tsx`
  Przekierowuje `/eidos` do aktywnego locale.
- `src/app/[locale]/eidos/page.tsx`
  Locale-aware entry point, który renderuje `EidosWorkspace`.
- `src/proxy.ts`
  Przekierowuje nieobsługiwane locale-prefixed EIDOS routes do angielskiego
  wariantu jeszcze przed renderowaniem trasy.

### Shell funkcji

- `src/eidos/components/eidos-workspace.tsx`
  Zarządza stanem UI: filtry, sortowanie, search, wybrany klient, scenariusz i dokumentacja.
- `src/eidos/components/client-decision-detail.tsx`
  Składa pełny prawy panel szczegółów.
- `src/eidos/components/eidos-management-documentation.tsx`
  Wbudowany briefing dla managementu dostępny bezpośrednio z UI.

### Model domenowy i logika decyzji

- `src/eidos/types/eidos.ts`
  Kanoniczne typy domenowe i unie.
- `src/eidos/data/synthetic-eidos-data.ts`
  Seedy klientów oraz deterministyczne generowanie historii i outcome.
- `src/eidos/lib/eidos-decision.ts`
  Czysty syntetyczny silnik decyzji.
- `src/eidos/lib/eidos-format.ts`
  Formatowanie i mapping tonów.
- `src/eidos/lib/eidos-i18n.ts`
  Locale-aware copy dla `en`, `uk`, `pl` oraz lokalizacja etykiet domenowych.

### Warstwa prezentacji

- `src/eidos/components/eidos-overview.tsx`
- `src/eidos/components/client-table.tsx`
- `src/eidos/components/scenario-selector.tsx`
- `src/eidos/components/decision-alternatives.tsx`
- `src/eidos/components/decision-tradeoff-chart.tsx`
- `src/eidos/components/decision-explanation.tsx`
- `src/eidos/components/decision-replay.tsx`
- `src/eidos/components/decision-history.tsx`
- `src/eidos/components/decision-outcome.tsx`

### Testy

- `src/eidos/eidos-decision.test.ts`
  Pokrywa deterministyczność danych i logiki.
- `e2e/eidos.spec.ts`
  Pokrywa end-to-end przepływy EIDOS, w tym wersję polską i panel dokumentacji.
- `e2e/demo-reveal.spec.ts`
  Pokrywa globalny flow Observatory demo, współdzielony przez tę gałąź.

## 4. Runtime i przepływ danych

Przepływ danych w EIDOS jest prosty i jawny:

1. `EidosWorkspace` rozwiązuje wszystkie `EIDOS_CLIENT_SEEDS` do baseline clients
   przez `resolveClient(seed, "BASELINE")`.
2. `summarizePortfolio()` buduje podsumowanie portfela.
3. Lokalny stan React kontroluje search, risk filter, status filter, sorting,
   selected client, scenario i stan widoczności dokumentacji.
4. Wybrane `clientId` jest mapowane z powrotem do seeda przez `getClientSeed()`.
5. `ClientDecisionDetail` wywołuje `analyzeClient(seed, scenario)`.
6. Historia i outcomes są budowane przez `buildDecisionHistory()` i `buildDecisionOutcomes()`.
7. Wykres i wszystkie panele renderują wyłącznie dane pochodne.

W przepływie EIDOS nie ma ukrytego store na dane biznesowe, server action,
API route ani persystencji.

## 5. Syntetyczny model decyzji

Prototyp porównuje dokładnie trzy strategie:

- `BUY_20`
- `BUY_40`
- `WAIT`

Scenariusze są zdefiniowane centralnie i uporządkowane przez `SCENARIO_ORDER`:

- `BASELINE`
- `HIGH_PRICE`
- `LOW_PRICE`
- `HIGH_DEMAND`
- `LOW_DEMAND`
- `HIGH_VOLATILITY`

Dla każdej strategii i scenariusza model wyprowadza:

- oczekiwaną roczną wartość kosztu zakupu,
- ciągłą wartość ryzyka w `[0, 1]`,
- bucket ryzyka (`LOW`, `MEDIUM`, `HIGH`),
- confidence,
- downside exposure,
- koszt skorygowany o ryzyko,
- rank.

Rekomendacja to po prostu pozycja `#1` po sortowaniu według risk-adjusted cost.

Derivacja statusu jest celowo jawna:

- `HIGH` risk + zmiana rekomendacji => `ACTION_REQUIRED`
- `HIGH` risk bez zmiany => `HIGH_RISK`
- zmiana rekomendacji bez wysokiego ryzyka => `STRATEGY_CHANGED`
- w przeciwnym razie => `STABLE`

Traktuj ten model jako symulator hipotezy produktowej, a nie jako reusable
financial engine.

## 6. Zasady deterministyczności

Deterministyczność jest twardym wymaganiem, bo gałąź służy do demo, screenshotów
i powtarzalnej walidacji.

Zasady:

- Nie wprowadzaj `Math.random()` do renderowanego stanu EIDOS.
- Nie generuj dat dynamicznie w przeglądarce.
- Nie polegaj na locale-dependent compact formatting z `Intl.NumberFormat`, jeśli
  wynik może różnić się między SSR i CSR.
- Utrzymuj funkcje derivacyjne jako pure i side-effect free.
- Jeśli dodajesz nowe dane syntetyczne, opieraj je na istniejącym stabilnym seed pattern.

Praktyczny przykład: compact euro formatter w `eidos-format.ts` jest ręczny, aby
uniknąć hydration mismatch między server render i client hydration.

## 7. Reguły stanu UI i interakcji

### Karty overview

- Karty działają jako status filters.
- Kliknięcie aktywnej karty wraca do `ALL`.
- Karty zawsze pokazują baseline portfolio.

### Tabela klientów

- Search dopasowuje tylko nazwę klienta.
- Search, status filter i risk filter łączą się.
- Sorting wykonywany jest po filtrowaniu.
- Domyślny sort to `status` malejąco, a następnie nazwa klienta.
- Ponowne kliknięcie aktywnej kolumny przełącza kierunek sortowania.
- Wybór wiersza otwiera detail pane.

### Detail pane

- Selector scenariusza wpływa wyłącznie na analizę wybranego klienta.
- Overview i client table nie zmieniają się przy przełączeniu scenariusza.
- Scenariusz jest przechowywany na poziomie workspace, więc po zmianie klienta
  zachowuje się aktualnie eksplorowany scenariusz.
- Zamknięcie detail pane czyści tylko selected client.

### Dokumentacja dla managementu

- Jest dostępna bezpośrednio w UI pod przyciskiem `Show/Hide documentation` lub jego lokalizacją.
- Ma charakter objaśniający i nie wpływa na dane biznesowe.
- Powinna pozostać zgodna z `MANAGEMENT_BRIEF.md` i `MANAGEMENT_BRIEF.pl.md`.

### Replay / history / outcomes

- Replay jest tylko symulacją UI.
- History to deterministyczna sekwencja 12 miesięcy.
- Outcome tracking to deterministyczny zestaw 4 syntetycznych obserwacji.

## 8. Workflow walidacji

Uruchamiaj z katalogu repo `dip-observatory`:

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm exec playwright install chromium
pnpm test:e2e
```

Co potwierdzają komendy:

- `pnpm build`
  Production build Next.js oraz poprawność typów.
- `pnpm test`
  Kontrakty deterministycznych danych i logiki decyzji.
- `pnpm lint`
  ESLint-clean stan dotkniętego kodu.
- `pnpm test:e2e`
  Browser-level verification głównych przepływów użytkownika.

Rekomendowana kolejność po zmianach w EIDOS:

1. `pnpm lint`
2. `pnpm test`
3. `pnpm build`
4. `pnpm test:e2e` dla zmian UI lub copy

## 9. Co pokrywają automatyczne testy

### Unit i contract tests

- integralność datasetu 20 klientów,
- poprawność zbioru rekomendowanych strategii,
- deterministyczność ewaluacji scenariuszy,
- deterministyczność historii i outcomes,
- oczekiwane wyniki dla klienta referencyjnego,
- możliwość zmiany rekomendacji po zmianie scenariusza,
- poprawne bucketing ryzyka i derivacja statusu,
- niezmienność baseline summary `12 / 4 / 2 / 2`,
- czytelność formatterów.

### E2E tests

- render localized EIDOS route,
- disclaimer o synthetic data,
- search klientów,
- filtrowanie po statusie,
- wybór klienta i render detail pane,
- przełączenie scenariusza,
- render historii i outcome tracking,
- polski przycisk dokumentacji i otwarcie management panel.

## 10. Bezpieczne punkty rozszerzeń

### Dodanie lub zmiana archetypu klienta

Edytuj `EIDOS_CLIENT_SEEDS` w `synthetic-eidos-data.ts`.

Checklist:

- zachowaj deterministic seed generation,
- uruchom `pnpm test`,
- jeśli zmienia się portfolio distribution, zaktualizuj testy i dokumentację świadomie.

### Dodanie nowego scenariusza

Zmień wszystkie poniższe miejsca:

- `EidosScenario` w `types/eidos.ts`,
- `SCENARIOS` w `eidos-decision.ts`,
- `SCENARIO_ORDER` w `eidos-decision.ts`,
- scenario labels/descriptions w `eidos-i18n.ts`,
- testy zakładające bieżący zbiór scenariuszy.

### Zmiana logiki rekomendacji

Edytuj najpierw tylko `eidos-decision.ts`.

Checklist:

- utrzymaj funkcje jako pure,
- utrzymaj deterministic ranking,
- najpierw uruchom unit tests,
- potem `pnpm test:e2e`, bo UI asertywnie sprawdza demo client i portfolio counts.

### Zastąpienie danych syntetycznych realną integracją

Rekomendowana ścieżka migracji:

1. zastąp `synthetic-eidos-data.ts` typed Observatory API adapterem,
2. zastąp lokalną heurystykę wynikami prawdziwego decision/risk engine,
3. wprowadź persystencję historii decyzji i outcomes,
4. dodaj auth oraz tenant-aware data access,
5. utrzymaj kontrakt UI stabilny przy zmianie źródeł danych pod spodem.

## 11. Antywzorce, których należy unikać

Unikaj następujących zmian bez wyraźnej decyzji produktowej:

- mieszania logiki EIDOS z generycznymi adapterami Observatory,
- dodawania live network calls bezpośrednio w komponentach prezentacyjnych EIDOS,
- hardcodowania summary numbers w UI,
- uzależniania overview od bieżącego scenariusza przy baseline-only tabeli,
- usuwania prototype disclaimers,
- wprowadzania ukrytego mutable global state dla wyników pochodnych.

## 12. Checklista realnej integracji

Zanim tę funkcję będzie można nazwać MVP zamiast prototypem, potrzebne są co najmniej:

- realny feed portfela klientów,
- realne źródło rynku i scenariuszy,
- realne źródło rekomendacji z silników decyzji i ryzyka,
- trwały audit trail decyzji,
- trwałe outcome tracking dla wykonanych strategii,
- przegląd auth i tenant isolation,
- review product/legal dla języka rekomendacji prezentowanego użytkownikowi.

## 13. Working agreement dla przyszłych contributorów

Jeśli dotykasz EIDOS, minimalne oczekiwania są następujące:

- zachowaj deterministyczność,
- utrzymuj izolację, dopóki nie będzie zatwierdzonego projektu integracji,
- zachowaj exception-oriented workflow,
- aktualizuj testy przy każdej świadomej zmianie zachowania,
- aktualizuj ten przewodnik oraz [`MANAGEMENT_BRIEF.pl.md`](./MANAGEMENT_BRIEF.pl.md),
  gdy zmienia się story kierowane do interesariuszy.
