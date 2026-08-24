# Brief dla managementu EIDOS Decision Observatory

Wersja angielska: [`MANAGEMENT_BRIEF.md`](./MANAGEMENT_BRIEF.md)

Ten dokument opisuje aktualny prototyp w języku produktu i delivery dla
stakeholderów, sponsorów i managementu EIDOS.

## 1. Executive summary

Aktualna gałąź dostarcza samodzielny prototyp EIDOS Decision Observatory wewnątrz
`dip-observatory`.

Jego cel to walidacja jednej hipotezy produktowej:

> Ekspert ds. zakupu energii może skuteczniej nadzorować wielu klientów, jeśli
> interfejs pokazuje tylko wyjątki decyzyjne, tłumaczy zmianę rekomendacji,
> porównuje alternatywy pod różnymi scenariuszami rynkowymi i później ocenia,
> czy decyzja okazała się trafna.

Prototyp jest celowo bezpieczny:

- korzysta wyłącznie z danych syntetycznych,
- nie łączy się z systemami EIDOS,
- nie zmienia DIP Core ani żadnej bazy danych,
- nie podejmuje i nie zapisuje realnych decyzji zakupowych.

## 2. Co jest już zaimplementowane

Prototyp pokazuje pełny workflow przeglądu portfela 20 syntetycznych klientów.

### Podgląd portfela

- wszyscy klienci są widoczni w jednym miejscu,
- interfejs redukuje uwagę do mniejszego zbioru wyjątków,
- aktualny syntetyczny portfel daje:
  `20 total / 12 stable / 4 strategy changed / 2 high risk / 2 action required`.

### Analiza oparta na wyjątkach

- użytkownik może szukać, filtrować i sortować portfel,
- użytkownik może przejść bezpośrednio z listy do decyzji konkretnego klienta,
- detail view wyraźnie rozróżnia obecną strategię i rekomendowaną strategię.

### Eksploracja scenariuszy

- każdy klient może być analizowany w wielu scenariuszach rynkowych,
- zmiana scenariusza może zmienić preferowaną strategię,
- interfejs pokazuje kompromis koszt/ryzyko zamiast ukrywać go za jedną liczbą.

### Explainability i auditability

- interfejs wyjaśnia, dlaczego rekomendacja się zmieniła,
- prototyp zawiera decision replay do analizy i reasoning,
- pokazuje 12 miesięcy syntetycznej historii,
- śledzi syntetyczne wyniki: koszt oczekiwany vs rzeczywisty oraz prosty verdict.

## 3. Jak produkt wspiera codzienną pracę

Obecna koncepcja produktu jest zaprojektowana pod codzienny workflow nadzoru
w EIDOS:

- zawęża szeroki portfel klientów do przypadków, które wymagają uwagi teraz,
- pozwala ekspertowi zobaczyć w jednym miejscu obecną strategię i strategię
  rekomendowaną dla konkretnego klienta,
- wyjaśnia, dlaczego rekomendacja się zmieniła, zamiast pokazywać black-box output,
- porównuje alternatywy zakupowe przy różnych założeniach rynkowych,
- utrzymuje historię decyzji i śledzenie wyników w widoku, aby wspierać analizę
  retrospektywną i uczenie się.

## 4. Co ten prototyp udowadnia

Ta gałąź nadaje się do odpowiedzi na pytania workflow i product-fit, takie jak:

- Czy exception-oriented portfolio view jest użyteczniejszy niż analiza klientów jeden po drugim?
- Czy eksperci potrzebują tylko rekomendacji, czy również widoku alternatyw i trade-off?
- Czy przełączanie scenariuszy jest wartościowym narzędziem eksploracji?
- Czy outcome tracking wzmacnia zaufanie i retrospektywne uczenie się?
- Czy proponowany model interakcji jest praktyczny w codziennym nadzorze nad portfelem?

## 5. Czego ten prototyp nie udowadnia

Ta gałąź **nie** udowadnia:

- finansowej poprawności,
- jakości realnej rekomendacji zakupowej,
- poprawności produkcyjnego modelu ryzyka,
- gotowości do rollout produkcyjnego,
- gotowości integracyjnej z operacyjnymi systemami EIDOS,
- skalowalności do dużych realnych portfeli i real-time data volumes.

Waliduje kierunek workflow i produktu, a nie komercyjną lub ilościową poprawność.

## 6. Wartość dla EIDOS

Jeśli realni użytkownicy potwierdzą workflow, prototyp sugeruje drogę do kilku
praktycznych korzyści:

- jeden ekspert może nadzorować więcej portfeli bez ręcznego czytania każdego stabilnego przypadku,
- zmienione decyzje stają się szybciej widoczne,
- management otrzymuje jaśniejszy audit trail przyczyn zmian rekomendacji,
- eksperci mogą porównywać alternatywy przed zaakceptowaniem lub nadpisaniem sugestii,
- wyniki mogą być analizowane później, aby poprawiać zaufanie i kalibrację.

Krótko: interfejs ma skalować ekspercki nadzór, a nie zastępować ekspercki osąd.

## 7. Kluczowe ograniczenia, które management powinien rozumieć

Aktualny prototyp celowo upraszcza rzeczywistość.

- wszystkie dane klientów są syntetyczne,
- zbiór scenariuszy jest mały i stały,
- model rekomendacji jest kompaktową heurystyką,
- nie ma workflow akceptacji, trwałego override ani współpracy,
- nie ma tenant-aware live data access,
- nie ma realnego store audytowego.

Te ograniczenia są akceptowalne dla wczesnego prototypu i nieakceptowalne dla produkcji.

## 8. Główne ryzyka delivery na drodze do realnego produktu

Jeśli EIDOS zdecyduje się iść dalej, główne ryzyka nie są wizualne, lecz
integracyjne i governance-related:

- czyste podłączenie realnych danych rynkowych, klienckich i decyzyjnych,
- decyzja, który engine jest autorytatywnym źródłem rekomendacji,
- zapisywanie wykonanych decyzji i realnych outcomes w czasie,
- uzgodnienie, jak eksperci nadpisują rekomendacje i jak to jest audytowane,
- dopasowanie języka produktu do ograniczeń prawnych i komercyjnych,
- potwierdzenie, że interfejs pozostaje użyteczny przy realnych rozmiarach portfela i noisy data.

## 9. Rekomendowane następne kroki

### Product discovery

1. Przeprowadzić live review z realnymi decydentami EIDOS.
2. Obserwować, czy ufają exception-first workflow.
3. Zebrać, które explanation i outcome signals są dla nich obowiązkowe.

### Planning integracji

1. Zdefiniować read-only API contract dla portfela klientów, scenariuszy rynkowych,
   źródła rekomendacji, historii i outcomes.
2. Zdecydować, czy logika rekomendacji liczy się upstream, czy w warstwie Observatory.
3. Zdefiniować minimalny audit trail wymagany dla MVP.

### Scoping MVP

1. Zacząć od read-only integration.
2. Zachować scenario exploration i explanation.
3. Dodać persisted outcome tracking przed wprowadzaniem write actions.

## 10. Pytania go / no-go dla managementu

Przed finansowaniem ścieżki produkcyjnej management powinien odpowiedzieć:

- Która dokładnie rola użytkownika jest właścicielem finalnej decyzji zakupowej?
- Które decyzje naprawdę wymagają explanation i auditability?
- Który outcome metric jest najważniejszy: variance kosztu, redukcja ekspozycji,
  stabilność kontraktu czy inny KPI?
- Czy celem jest oversight, recommendation support czy approval workflow?
- Jaki poziom przejrzystości modelu jest wymagany dla adopcji wewnętrznej?

## 11. Bottom line

Ta gałąź dostarcza wiarygodny, interaktywny prototyp EIDOS Decision Observatory.
Jest wystarczająco mocna do przeglądu przez interesariuszy i dyskusji produktowej.

Powinna być traktowana jako wczesny prototyp produktu, a nie produkcyjny system decyzyjny.
