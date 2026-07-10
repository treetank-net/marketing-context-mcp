---
keywords: [feed health, merchant center, disapprovals, odrzucenia produktow, shopping, pmax, pokrycie feedu, tytuly, gtin, feed optimization]
applies_to: [google-ads]
task_type: [workflow]
intent: google_ads_feed_health
default_schedule: weekly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [google-ads/merchant-center-feed.md, google-ads/feed-optimization-detailed.md, google-ads/shopping-pmax.md, general/task-catalog.md]
source: ["knowledge/google-ads/merchant-center-feed.md", "knowledge/google-ads/feed-optimization-detailed.md"]
summary: "Cotygodniowy health-check feedu Merchant Center i pokrycia Shopping/PMax. Wyłapuje produkty odrzucone/wstrzymane i ich powody (polityki, GTIN, ceny, dostępność), spadek pokrycia (% aktywnych vs feed), produkty bez wyświetleń oraz słabe tytuły/atrybuty obniżające widoczność. Wynik: naprawy feedu jako append_task + append_review; poprawki feedu to zmiany w źródle danych / Merchant Center, nie mutacje kampanii."
---

# Workflow: Google Ads Feed Health

Procedura (nie artykuł referencyjny): wykonaj kroki, wołając narzędzia platformowe.
To jest `suggested_workflow` dla zadania „cotygodniowy health-check feedu produktowego".

Cel: raz w tygodniu sprawdzić kondycję feedu Merchant Center i pokrycie Shopping/PMax —
wyłapać produkty **odrzucone/wstrzymane**, **spadek pokrycia** (mniej aktywnych produktów
niż w feedzie) oraz **słabe tytuły/atrybuty** obniżające widoczność, zanim przełożą się na
spadek ruchu i sprzedaży. To przegląd diagnostyczny — naprawy proponujesz jako taski,
nie wykonujesz automatycznie.

**Uwaga o zakresie (status):** google-ads-baby nie ma dziś integracji z Merchant Center API.
Diagnostyka połączenia konta z MC jest jednak możliwa już teraz przez zasób `product_link`
(`execute_gaql`), a analiza pokrycia i wydajności produktów przez `shopping_performance_view` /
`get_pmax_channel_breakdown`. Część odczytów o statusie produktów (disapprovals, powody)
wymaga panelu Merchant Center lub przyszłej integracji MC — patrz `merchant-center-feed.md`.

## Kroki

1. **Disapprovals i wstrzymania w Merchant Center** — sprawdź listę produktów odrzuconych
   i wstrzymanych oraz ich powody. Najczęstsze kategorie:

   | Kategoria powodu | Typowe przyczyny | Gdzie naprawiać |
   |---|---|---|
   | Polityki | promo/cena/nazwa sklepu w tytule, misleading, zakazana treść | źródło feedu; patrz `google-ads/google-ads-policies` |
   | GTIN / identyfikatory | brak/niepoprawny GTIN, zły `identifier_exists` | źródło feedu / supplemental |
   | Ceny | niespójność cena feed vs strona (mismatch) | źródło feedu + sklep |
   | Dostępność | `availability` niezgodne ze stanem sklepu | źródło feedu + sklep |

2. **Pokrycie feedu** — porównaj liczbę produktów aktywnych z liczbą w feedzie
   (% aktywnych vs pełny feed). Spadek udziału aktywnych między tygodniami = sygnał, że
   coś odpada (disapprovals, wygasła dostępność, błąd fetchu). Odnotuj kierunek zmiany
   tydzień do tygodnia, nie tylko wartość bezwzględną.

3. **Produkty bez wyświetleń** — znajdź produkty aktywne, ale bez impresji/kliknięć.
   Punkt startu: `get_pmax_channel_breakdown` (google-ads-baby) dla udziału Shopping w PMax
   oraz `shopping_performance_view` przez `execute_gaql`. Niski udział Shopping w PMax lub
   duża grupa produktów „zero impresji" mimo statusu aktywny → kandydaci do analizy
   tytułów/atrybutów. Zasady interpretacji udziału Shopping — patrz `shopping-pmax.md`.

4. **Jakość tytułów i atrybutów** — dla produktów słabo widocznych zdiagnozuj tytuły wg
   `feed-optimization-detailed.md` (kody SKU zamiast nazw, jednowyrazowe nazwy, brak
   kategorii/product_type w tytule, brak wariantu). To najczęstsza cicha przyczyna niskiej
   widoczności — produkt jest aktywny, ale nie matchuje zapytań.

5. **Spójność cena/dostępność feed vs sklep** — punktowo sprawdź, czy cena i dostępność
   w feedzie zgadzają się ze stanem sklepu (mismatch = ryzyko wstrzymania i utraty zaufania
   konta w MC).

## Wynik

- Dla każdej naprawy feedu (tytuł, atrybut, mapowanie, GTIN, kategoria) zapisz follow-up
  przez `append_task` z `source_type: review`, wskazując workflow naprawczy
  (`feed-optimization-detailed.md` dla tytułów/atrybutów).
- Problemy polityk → jeśli powód nie jest oczywisty, sprawdź `google-ads/google-ads-policies`
  przed sformułowaniem naprawy.
- Zapisz podsumowanie przeglądu przez `append_review`.

**Uwaga (bezpieczeństwo):** poprawki feedu to zwykle zmiany w **źródle danych / Merchant
Center** (primary feed po stronie sklepu, supplemental feed), a nie mutacje kampanii — poza
zakresem `prepare_*`. Nigdy nie modyfikuj primary feedu bezpośrednio (patrz
`feed-optimization-detailed.md`). Ewentualne mutacje kampanijne (np. segmentacja przez
osobne kampanie) tylko przez `prepare_*` + potwierdzenie safe-word; nic nie zmieniaj
automatycznie.
