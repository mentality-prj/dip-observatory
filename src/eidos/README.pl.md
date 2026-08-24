# EIDOS Decision Observatory (Prototyp)

Wersja angielska: [`README.md`](./README.md)

> **Prototyp — dane syntetyczne.** Ta funkcja **nie** modyfikuje DIP Core,
> DIP API, silnika decyzji, silnika ryzyka ani żadnej bazy danych. **Nie** łączy
> się z żadnym systemem EIDOS. Wszystkie wartości widoczne w interfejsie są
> generowane lokalnie na podstawie deterministycznego zestawu danych.

## Dokumentacja szczegółowa

- Przewodnik deweloperski (PL): [`DEVELOPER_GUIDE.pl.md`](./DEVELOPER_GUIDE.pl.md)
- Brief dla managementu (PL): [`MANAGEMENT_BRIEF.pl.md`](./MANAGEMENT_BRIEF.pl.md)
- Developer guide (EN): [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md)
- Management brief (EN): [`MANAGEMENT_BRIEF.md`](./MANAGEMENT_BRIEF.md)

## 1. Cel

To samodzielna, ukierunkowana na decyzje powierzchnia obserwacyjna, która ma
pomóc ekspertowi ds. zakupu energii monitorować wielu klientów jednocześnie,
skupiać się tylko na tych decyzjach, które się zmieniły, rozumieć przyczyny
zmian rekomendacji, porównywać alternatywy i później oceniać wynik decyzji.

## 2. Hipoteza produktowa

> EIDOS może skalować eksperckie podejmowanie decyzji zakupowych w energetyce,
> jeśli interfejs będzie koncentrował uwagę na wyjątkach, porównaniach
> alternatyw, ekspozycji na ryzyko i retrospektywnym śledzeniu wyników.

Interfejs jest celowo **exception-oriented**: 20 klientów redukuje się do
małego zbioru przypadków wymagających uwagi, dzięki czemu trader analizuje tylko
to, co naprawdę się zmieniło.

## 3. Trasa

`/eidos` (z prefiksem locale, np. `/pl/eidos`). Trasę można otworzyć bezpośrednio
lub przez nawigację w głównym Observatory. Ścieżka `/eidos` przekierowuje do
aktywnego locale.

## 4. Model danych syntetycznych

Typy domenowe znajdują się w [`types/eidos.ts`](./types/eidos.ts). Najważniejsze
unie:

- `ProcurementStrategy` — `BUY_20 | BUY_40 | WAIT`
- `DecisionStatus` — `STABLE | STRATEGY_CHANGED | HIGH_RISK | ACTION_REQUIRED`
- `ClientRisk` — `LOW | MEDIUM | HIGH`
- `OutcomeStatus` — `FAVOURABLE | NEUTRAL | UNFAVOURABLE`
- `EidosScenario` — `BASELINE | HIGH_PRICE | LOW_PRICE | HIGH_DEMAND | LOW_DEMAND | HIGH_VOLATILITY`

Źródła danych:

- [`data/synthetic-eidos-data.ts`](./data/synthetic-eidos-data.ts) — 20 ręcznie
  opisanych seedów klientów oraz deterministyczne generowanie historii i wyników.
- [`lib/eidos-decision.ts`](./lib/eidos-decision.ts) — lokalny, deterministyczny
  silnik decyzji.

Podsumowanie portfela i tabela klientów są zawsze liczone dla scenariusza
`BASELINE`; przełączanie scenariuszy służy do analizy pojedynczego klienta.

## 5. Sugerowany scenariusz demo

1. Otwórz `/pl/eidos`.
2. Pokaż podsumowanie: 20 klientów, z czego 8 wymaga uwagi.
3. Otwórz domyślnego klienta demo z widoczną zmianą rekomendacji.
4. Pokaż sekcję wyjaśniającą, dlaczego rekomendacja się zmieniła.
5. Porównaj trzy strategie: `BUY 20%`, `BUY 40%`, `WAIT`.
6. Przełącz scenariusz `BASELINE` na `HIGH_PRICE` i pokaż zmianę preferowanej decyzji.
7. Zakończ historią decyzji i śledzeniem wyników.

## 6. Architektura

```text
src/eidos/
├── components/          # warstwa prezentacyjna i stan UI
├── data/synthetic-eidos-data.ts
├── lib/
│   ├── eidos-decision.ts
│   ├── eidos-format.ts
│   └── eidos-i18n.ts
├── types/eidos.ts
└── eidos-decision.test.ts
```

Routing:

- [`../app/[locale]/eidos/page.tsx`](../app/%5Blocale%5D/eidos/page.tsx) renderuje workspace.
- [`../app/eidos/page.tsx`](../app/eidos/page.tsx) wykonuje przekierowanie do locale.

Zachowanie UI pokrywają testy w [`../../e2e/eidos.spec.ts`](../../e2e/eidos.spec.ts).

## 7. Ograniczenia

- Tylko dane syntetyczne.
- Model decyzji jest uproszczoną heurystyką, a nie produkcyjnym silnikiem DIP.
- Zestaw scenariuszy i archetypów klientów jest mały i stały.
- Brak persystencji: replay i przełączanie scenariuszy są symulacją UI.

## 8. Co byłoby potrzebne do realnej integracji EIDOS

- Podmiana syntetycznego datasetu na klienta Observatory API.
- Podmiana lokalnej heurystyki na wyniki prawdziwego silnika decyzji i ryzyka.
- Realne źródła scenariuszy oraz prognoz rynkowych.
- Trwałe przechowywanie historii decyzji, wykonań i wyników.

## 9. Założenia bezpieczeństwa produktu

Ten prototyp **nie** deklaruje:

- realnej predykcji rynku,
- realnej optymalizacji finansowej,
- realnej rekomendacji zakupowej,
- gotowości produkcyjnej,
- połączenia z systemami EIDOS.
