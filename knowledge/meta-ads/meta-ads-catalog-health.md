---
keywords: [catalog health, katalog produktowy, dpa, advantage plus catalog, feed meta, retargeting produktowy, pokrycie katalogu, zestawy produktow]
applies_to: [meta-ads]
task_type: [workflow]
intent: meta_ads_catalog_health
default_schedule: monthly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [meta-ads/catalog-dpa-advantage.md, meta-ads/placements-advantage-plus.md, general/task-catalog.md]
source: ["knowledge/meta-ads/catalog-dpa-advantage.md"]
summary: "Miesięczny health-check katalogu produktowego Meta i kampanii DPA/Advantage+ Catalog: status katalogu (produkty aktywne vs błędy/odrzucenia), pokrycie i świeżość feedu, spójność zdarzeń katalogowych (ViewContent/AddToCart/Purchase z content_id zgodnym z feedem), poprawność product setów i działanie retargetingu produktowego. Naprawy feedu/mapowań/zestawów idą jako zadania (append_task) — to zmiany w źródle danych, nie mutacje reklamowe; mutacje kampanijne tylko przez prepare_* + potwierdzenie. Zapisz append_review."
---

# Workflow: miesięczny health-check katalogu produktowego Meta (DPA / Advantage+ Catalog)

Powtarzalne zadanie kontrolne: raz w miesiącu sprawdź, czy katalog produktowy Meta i kampanie oparte o niego (DPA, Advantage+ Catalog Ads) mają pod sobą zdrowy fundament — kompletny feed, spójny sygnał katalogowy i poprawnie zbudowane zestawy produktów. Cel to wyłapać ciche awarie (odrzucone wiersze feedu, rozjazd `content_ids` ↔ `id`, puste product sety), zanim przepalą budżet.

Ten workflow jest orkiestracją — merytorykę i progi bierze z `catalog-dpa-advantage.md` (feed, match rate, product sets) oraz `placements-advantage-plus.md` (formaty per placement). Nie powtarzaj tu liczb; sprawdzaj je w tamtych plikach. Poprawki feedu/katalogu to zwykle zmiany po stronie źródła danych (sklep, integracja, plik feedu), a nie mutacje reklamowe — dlatego domyślnym wynikiem są zadania, nie `prepare_*`.

## Kroki

1. **Status katalogu.** Sprawdź w Commerce Manager (Diagnostyka katalogu) liczbę produktów aktywnych vs błędy/odrzucenia/ostrzeżenia. `out of stock` to norma, nie błąd — nie „naprawiaj" availability na siłę. Wynotuj wiersze wypadające z delivery przez braki w polach wymaganych.
2. **Pokrycie i świeżość feedu.** Zweryfikuj kompletność pól wymaganych (9 pól wg `catalog-dpa-advantage.md`) i datę ostatniego udanego pobrania feedu planowanego. Sprawdź, czy feed nie zawiera placeholderów obrazów ani ceny z symbolem waluty / wieloma walutami.
3. **Spójność zdarzeń katalogowych.** Potwierdź, że eventy `ViewContent`, `AddToCart`, `Purchase` niosą `content_id`/`contents` dokładnie zgodne z `id` w feedzie (case-sensitive). To rdzeń działania DPA/ACA — rozjazd ID jest najczęstszym killerem. Sprawdź match rate katalog↔Pixel wg progu z `catalog-dpa-advantage.md`.
4. **Product sets.** Przejrzyj zestawy produktów pod kątem reguł: czy żaden nie jest pusty lub za mały (brak delivery), czy filtry opierają się na `internal_label` a nie `custom_label` (ryzyko re-review policy). Skonfrontuj sety z ich rolą w lejku (bestsellery, nowości, porzucony koszyk, cross-sell).
5. **Działanie DPA / Advantage+ Catalog.** Zweryfikuj konfigurację kampanii wg `catalog-dpa-advantage.md`: czy retargeting katalogowy (ciepły) i prospecting/ACA (zimny, broad) są rozdzielone na osobne kampanie/ad sety z osobnymi benchmarkami.
6. **Zgodność placementów i formatów.** Sprawdź wg `placements-advantage-plus.md`, czy kreacje katalogowe mają właściwe formaty per placement (feed vs Stories/Reels) i czy tryb placementów jest uzasadniony danymi, a nie założeniem.

## Wynik

- **Naprawy feedu, mapowań eventów lub product setów** → `append_task`. To zmiany w źródle danych (feed, integracja sklepu, konfiguracja Pixela/CAPI, reguły katalogu w Commerce Manager), nie mutacje reklamowe — nie idą przez `prepare_*`.
- **Mutacje kampanijne** (zmiana budżetu, rozdzielenie retargetingu/prospectingu, edycja ad setu) → wyłącznie przez odpowiednik `prepare_*` w meta-ads-baby + jawne potwierdzenie użytkownika. Bez potwierdzenia nie wykonuj mutacji.
- Po zakończeniu health-checku zapisz `append_review` z podsumowaniem stanu katalogu, znalezionych problemów i wystawionych zadań.
- Nie zgaduj liczb ani progów spoza `catalog-dpa-advantage.md` / `placements-advantage-plus.md`; jeśli danych brakuje, odnotuj to jako lukę w review.
