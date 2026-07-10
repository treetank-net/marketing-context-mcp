---
keywords: [segmentacja produktow, custom labels, listing groups, product groups, eksperymenty, analiza produktowa]
applies_to: [google-ads]
task_type: [workflow]
intent: segment_products_detailed
trigger_stage: [prompt]
priority: 3
inject: summary
related: [google-ads/product-bucketing.md, google-ads/feed-optimization-detailed.md, google-ads/google-ads-monthly-review.md]
source: ["https://support.google.com/google-ads/answer/6275295?hl=en", "https://support.google.com/google-ads/answer/3517331?hl=en", "https://support.google.com/google-ads/answer/7281575?hl=en"]
summary: "Szczegółowy workflow evidence-led: walidacja danych, wybór jednej osi segmentacji, rozłączne reguły custom labels, wdrożenie do grup produktów/listing groups, kontrola pokrycia i ocena hipotezy w eksperymencie."
---

# Workflow: segmentacja katalogu oparta na dowodach

## 1. Zdefiniuj decyzję

Zapisz jedno zdanie: „Jeżeli segment X zachowuje się inaczej niż porównywalne produkty, podejmiemy decyzję
Y”. Ustal główny miernik zgodny z celem kampanii oraz mierniki ochronne, np. wolumen, koszt i jakość
konwersji. Bez decyzji segment służy tylko jako wymiar raportowy.

## 2. Oceń dane wejściowe

- Potwierdź, że konwersje i wartość konwersji mierzą właściwy cel.
- Sprawdź stabilność `id`, kompletność atrybutów i zgodność ceny oraz dostępności ze sklepem.
- Oznacz produkty nowe, niedostępne i bez wystarczających obserwacji jako osobne stany danych, a nie jako
  wynik biznesowy.
- Rozpoznaj sezonowość, promocje i zmiany asortymentu, które mogłyby zaburzyć porównanie.

## 3. Wybierz oś segmentacji

Najpierw użyj natywnych atrybutów: kategoria Google, typ produktu, marka, stan lub `id`. `custom_label_0`–
`custom_label_4` stosuj dla cech wewnętrznych, których nie opisują standardowe pola, np. sezon, cykl życia,
zakres marży albo status testu. Każda etykieta powinna mieć jeden jasno opisany sens.

Reguły muszą być:

- rozłączne lub mieć jawny porządek pierwszeństwa,
- możliwe do ponownego wyliczenia z danych źródłowych,
- wersjonowane wraz z datą i właścicielem,
- odporne na brak wartości; „brak danych” jest własnym stanem.

## 4. Wdróż najpierw obserwację

Dodaj etykiety w systemie właścicielskim feedu. Po synchronizacji sprawdź próbkę `id` w Merchant Center i
Google Ads. Zbuduj product groups w Shopping lub listing groups w kampanii Performance Max z feedem.
Zweryfikuj pokrycie katalogu oraz grupę pozostałych produktów. Na tym etapie nie zmieniaj jednocześnie
budżetu, stawek, kreacji i stron docelowych.

## 5. Oceń przydatność segmentu

Porównuj segmenty w tym samym oknie, z uwzględnieniem dostępności, sezonowości i różnic asortymentowych.
Nie uznawaj małej próby za dowód przewagi. Jeśli segment nie prowadzi do innej decyzji albo regularnie ma
za mało danych, połącz go lub pozostaw wyłącznie jako etykietę raportową.

## 6. Przetestuj działanie

Dla istotnej zmiany zapisz hipotezę i użyj właściwego typu eksperymentu dostępnego w Google Ads. Zmieniaj
jeden główny czynnik, utrzymuj porównywalną bazę i unikaj zmian kampanii bazowej w trakcie testu. Ocenę
opieraj na celu biznesowym i nie kończ testu tylko dlatego, że chwilowy wynik wygląda korzystnie.

## 7. Utrzymuj

Regularnie przeliczaj etykiety z bieżących danych, kontroluj produkty bez przypisania i zapisuj zmiany reguł.
Usuń segmenty, które nie wspierają decyzji. Nie utrwalaj uniwersalnych tierów ani progów: warunki klienta,
marża, opóźnienie konwersji i wolumen danych zmieniają sens granic.
