---
keywords: [struktura konta, account structure, ABO, CBO, faza uczenia, learning phase, learning limited, reset, adset, kampania]
applies_to: [meta-ads]
task_type: [mutation, review]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_ad_set_create, prepare_campaign_create, prepare_ad_set_update, confirm_mutation]
priority: 5
session_start: true
enforce_read: true
inject: body
related: [meta-ads/creative-testing-scaling.md, meta-ads/budgeting-abo-cbo-advantage.md, general/case-studies.md]
source: ["Meta Business Help (Learning Phase)", "praktycy: Niblin, RebootIQ, AdAmigo, SuperScale"]
summary: "Ad set wychodzi z fazy uczenia po ~50 eventach optymalizacji/7 dni; poniżej tego utyka w Learning Limited (fix: szersze audytorium, częstszy event, konsolidacja). Reset wywołuje zmiana budżetu >20%, zmiana audytorium, eventu optymalizacji lub stawek oraz pauza ≥7 dni; edycja copy i budżet <20% nie resetują. Skaluj max +20% co 3-5 dni, jedna zmiana naraz, nie oceniaj przed 3-5 dniami. ABO do testów, CBO do skalowania zwycięzców (hybryda: testuj na ABO, zwycięzców przenoś do CBO); CBO potrzebuje ~50× CPA/tydzień."
---

# Struktura konta Meta + faza uczenia

Jeśli masz czas tylko na jeden plik Meta — to ten. Rdzeń: hierarchia kampania → ad set → reklama, wybór ABO vs CBO, mechanika fazy uczenia.

Źródła: Meta Business Help (About the Learning Phase), destylacja praktyków (Niblin, RebootIQ, AdAmigo, SuperScale) — progi liczbowe potwierdzone w ≥3 niezależnych źródłach chyba że zaznaczono inaczej.

## Progi liczbowe (rdzeń)

| Próg | Wartość | Zastosowanie |
|---|---|---|
| LEARNING_EXIT_EVENTS | ~50 eventów optymalizacji / 7 dni na ad set | wyjście z fazy uczenia |
| LEARNING_LIMITED | < ~50 eventów / 7 dni | „Learning Limited" — ad set nie stabilizuje się |
| EDIT_RESET_THRESHOLD | zmiana budżetu > 20% | znacząca edycja → reset fazy uczenia |
| PAUSE_RESET_DAYS | pauza ≥ 7 dni | wznowienie liczy 50 eventów od zera |
| TEST_MIN_RUNTIME | 3-5 dni | minimalny czas testu ad setu przed oceną |
| CBO_MIN_WEEKLY_BUDGET | ~50× docelowy CPA / tydzień | żeby CBO zebrało dość danych (1 źródło Meta, patrz uwaga) |

## Hierarchia

Kampania (cel + typ budżetu) → Ad set (budżet ABO / audytorium / placement / optymalizacja) → Reklama (kreacja). Faza uczenia dotyczy **ad setu**, nie kampanii ani reklamy.

## ABO vs CBO — kiedy które

- **ABO** (Ad Set Budget Optimization): budżet ustawiany per ad set, ty kontrolujesz alokację. Do **testowania** — nowe audytoria/kreacje, audytoria mocno różnej wielkości (małe remarketing obok dużego cold), niski wolumen konwersji (np. niszowe B2B), gdzie chcesz chronić alokację.
- **CBO** (Campaign Budget Optimization, w UI = „Advantage+ campaign budget"): budżet na poziomie kampanii, algorytm Meta rozdziela go między ad sety wg predykcji. Do **skalowania** sprawdzonych zwycięzców, audytoriów jednorodnych i podobnej wielkości (same cold albo same lookalike), przy większych budżetach.
- **Podejście hybrydowe (rekomendowane przez praktyków)**: testuj na ABO → zwycięzców przenieś/zduplikuj do nowej kampanii CBO. Nie mieszaj w jednym CBO ad setów skrajnie różnej wielkości — algorytm przeleje budżet na jedno.

## Faza uczenia — mechanika

- Ad set potrzebuje **~50 eventów optymalizacji w oknie 7 dni**, by wyjść z fazy uczenia. Event = to, na co optymalizujesz (zakup, lead, add-to-cart) — nie zawsze zakup.
- **„Learning Limited"**: gdy ad set nie zbiera ~50 eventów/tydzień, utyka w tym stanie bezterminowo — delivery jest niestabilne, CPA rozjeżdżony. Przyczyna zwykle: zbyt wąskie audytorium, zbyt niski budżet, albo optymalizacja na zbyt rzadki event.
- Wyjście z Learning Limited: poszerz audytorium, optymalizuj na częstszy event wyżej w lejku (Add to Cart zamiast Purchase), skonsoliduj ad sety, albo zaakceptuj stan jeśli wolumen jest strukturalnie mały.

## Co RESETUJE fazę uczenia (znacząca edycja)

- Zmiana **budżetu > 20%** (próg powszechnie cytowany; drobne zmiany < 20% zwykle nie resetują).
- Zmiana **audytorium/targetowania** (audiencja, lokalizacja, wiek/płeć).
- Zmiana **eventu optymalizacji** (np. Purchase → Add to Cart) lub **strategii stawek**.
- **Pauza ≥ 7 dni** przed wznowieniem — po wznowieniu zegar 50 eventów rusza od zera.
- Dodanie/usunięcie kreacji do ad setu — status „debatowany" (część praktyków raportuje reset, część nie); traktuj ostrożnie, ale drobne edycje kreacji są mniej ryzykowne niż zmiana budżetu/audytorium.

## Co NIE resetuje

- Edycja tekstu reklamy (copy) bez zmiany kreacji.
- Zmiana budżetu **< 20%**.
- Włączanie/wyłączanie pojedynczych reklam w tym samym ad secie.
- Zmiana budżetu na poziomie kampanii (CBO) — mniej wrażliwa niż zmiana budżetu ad setu.
- Zmiana harmonogramu wyświetlania.

## Zasady operacyjne

- Skaluj budżet stopniowo: **max +20% co 3-5 dni**, żeby nie wywołać resetu ani „pseudo-fazy uczenia". Duży skok budżetu = destabilizacja.
- Jeden czynnik zmiany naraz (budżet albo audytorium albo optymalizacja — nie kilka).
- Nie oceniaj ad setu przed **3-5 dniami** i przed zebraniem sensownego wolumenu eventów.
- Uwaga: reguła CBO „~50× CPA/tydzień" pochodzi głównie z materiałów Meta/agencji cytujących Meta — pojedyncze źródło pierwotne; traktuj jako wskazówkę rzędu wielkości, nie twardy próg.
