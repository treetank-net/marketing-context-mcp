---
keywords: [insighty, insights, metryki, metrics, ROAS, CPA, CTR, frequency, czestotliwosc, CPM, breakdown, atrybucja, attribution, okno konwersji, conversion window, 7-day click, 1-day view, view-through, interpretacja, diagnoza]
applies_to: [meta-ads]
task_type: [interpretation, review, diagnosis]
trigger_stage: [prompt, pre_tool, post_tool]
trigger_tools: [get_insights]
priority: 3
inject: summary
related: [meta-ads/pixel-capi-signal-quality.md, meta-ads/creative-testing-scaling.md, meta-ads/placements-advantage-plus.md, meta-ads/account-structure-learning-phase.md, meta-ads/experiments-testing-methodology.md]
source: ["Meta Business Help (attribution)", "praktycy: Search Engine Land, Jon Loomer, adlibrary"]
summary: "Progi diagnostyczne: frequency > ~3.5/7 dni = fatigue; hook rate < ~25% = słaba pierwsza klatka; hook mocny + CTR słaby = problem offer/CTA; rozjazd LPV vs link clicks > ~15% = technika LP, nie kreacja. Domyślna atrybucja: 7-day click, 1-day engage-through, 1-day view; view-through zawyża ROAS — decyzje budżetowe po click-through i backendzie. Niespójny event_id (Pixel+CAPI) zawyża konwersje ~30%. Diagnozuj po lejku (hook → CTR → LPV → CPA), breakdown per placement/wiek/czas przed decyzją, nie oceniaj przed ~50 eventami i 48h."
---

# Interpretacja insightów Meta

Metryki czytaj **jako system**, nie jako tablicę wyników — jedna liczba w izolacji myli. Powierzchnia mówi „co", breakdown „gdzie", trend „kiedy się zaczęło", sygnały kreacji „dlaczego". Zanim zdiagnozujesz kampanię, sprawdź jakość sygnału i atrybucję — inaczej diagnozujesz szum (patrz `pixel-capi-signal-quality.md`).

Źródła: Meta Business Help („About actions attributed to your ad", attribution setting), destylacja praktyków (Search Engine Land, Jon Loomer, adlibrary). Progi diagnostyczne od praktyków — rzędy wielkości, nie twarde benchmarki (te różnią się per branża/region).

## Metryki i wzory

| Metryka | Wzór / definicja | Co mówi |
|---|---|---|
| ROAS | przychód / wydatek | zwrot z wydatku (4x = $4 na $1); metryka wyniku |
| CPA | wydatek / konwersje | koszt jednej konwersji; metryka wyniku |
| CTR (all / link) | kliknięcia / wyświetlenia × 100% | zainteresowanie kreacją (link CTR ≠ all CTR) |
| CPM | wydatek / wyświetlenia × 1000 | koszt zasięgu; proxy jakości i konkurencji aukcji |
| Frequency | wyświetlenia / zasięg | ile razy średnio ta sama osoba widzi reklamę |
| Hook rate | 3-sec views / impressions | siła pierwszej sekundy wideo |
| Hold rate | ThruPlay / 3-sec views | utrzymanie uwagi w wideo |

## Progi diagnostyczne (rzędy wielkości)

| Sygnał | Próg orientacyjny | Interpretacja |
|---|---|---|
| Frequency | > ~3.5 / 7 dni | ryzyko zmęczenia kreacji |
| Hook rate | < ~25% | kreacja pada na starcie (pierwsza klatka) |
| Hook rate mocny, CTR słaby | hook ~35%+, niski CTR | angażuje, nie motywuje kliku — offer/CTA |
| LPV vs Link clicks | rozjazd > ~15% | wyciek techniczny LP (page speed), nie kreacja |
| CPA ↑ i Frequency ↑ razem | — | zmęczenie audytorium → odśwież kreację, nie budżet |

## Breakdowny — gdzie leży problem

Breakdown rozbija dane po: **czasie** (dzień/tydzień → trend), **delivery** (wiek, płeć, kraj/region), **placemencie** (Feed vs Reels vs Stories vs Audience Network), **urządzeniu**, porze dnia.
- **Placement**: porównaj CPM i CVR per powierzchnia; zanim wyłączysz placement sprawdź, czy nie brakuje formatu 9:16 (patrz `placements-advantage-plus.md`).
- **Wiek/płeć**: czy jeden segment zjada wyświetlenia bez proporcjonalnych konwersji.
- **Pora dnia**: godziny z istotnie niższym CPA.
- Trend w czasie mówi, **kiedy** metryka się załamała — łącz z datą zmian (budżet/kreacja/audytorium).

## Diagnoza po lejku (czytaj metryki w relacji)

1. **Góra lejka (hook rate, CTR)**: hook < 25% → napraw pierwszą klatkę; hook mocny + CTR słaby → offer/CTA. Wysoki CTR bez wzrostu CVR = płacisz za ruch, którego LP nie domyka.
2. **Środek (LP)**: koszt LPV vs koszt link click; rozjazd > 15% = problem techniczny strony (najpierw page speed, potem kreacja).
3. **Dół (konwersja)**: CPA i ROAS naraz słabe przy sprawnej LP → dopasowanie oferty do audytorium (fix strategiczny, nie taktyczny).
Zasada: **zmieniaj jeden czynnik naraz**, inaczej nie wiesz, co zadziałało (spójne z `account-structure-learning-phase.md`).

## Atrybucja i okna konwersji

- **Domyślne ustawienie** dla ad setu optymalizowanego pod konwersje na stronie: **7-day click, 1-day engage-through (dawniej engaged-view), 1-day view**. To domyślny model, ale możesz go zmienić (np. 1-day click).
- **Click-through** (konwersja po kliknięciu w oknie X dni) jest najsolidniejsza. **View-through** (konwersja po samym obejrzeniu, bez kliknięcia) jest **najsłabszym dowodem przyczynowości** — łatwo zawyża wynik, bo przypisuje zakupy osobom, które i tak by kupiły.
- Konwersje **„on ad"** (reakcje, obejrzenia, kliknięcia) raportowane są osobno od konwersji **„off ad"** (zakup na stronie), które podlegają oknu atrybucji.
- Część konwersji to **modeled conversions** (Meta estymuje utracone przez ograniczenia cookies/ITP) — raportowany wynik nie jest czystym pomiarem 1:1.

## Pułapki (najczęstsze)

- **View-through zawyża ROAS/konwersje.** Przy porównaniach i decyzjach budżetowych patrz przede wszystkim na click-through; view-through traktuj jako sygnał pomocniczy.
- **Rozjazd Meta vs GA4/backend.** Meta liczy „last touch" we własnym oknie i dolicza modeled — GA4/backend liczą inaczej (inny model, inne okno). Rozbieżność to norma, nie błąd; **backend sklepu jest źródłem prawdy o przychodzie**, Meta o efektywności swojego kanału.
- **Podwójne liczenie z niespójnym event_id** (Pixel+CAPI) potrafi zawyżyć konwersje ~30% (patrz `pixel-capi-signal-quality.md`). „Skok ROAS" po włączeniu CAPI bez wzrostu sprzedaży = duplikacja, nie sukces.
- **Porównywanie kampanii o różnych oknach atrybucji** — najpierw ujednolić attribution setting, inaczej porównujesz jabłka z gruszkami.
- **CTR w izolacji** — wysoki CTR bez konwersji to koszt, nie wynik.
- **Ocena przed wolumenem** — nie wyciągaj wniosków przed ~50 eventami/wariant i przed 48h (patrz `creative-testing-scaling.md`).

## Zasady operacyjne

- Zanim obwinisz kampanię: sprawdź EMQ, deduplikację i świeżość sygnału (`pixel-capi-signal-quality.md`) oraz attribution setting — dopiero potem oceniaj CPA/ROAS.
- Diagnozuj po lejku (hook → CTR → LPV → CVR/CPA), jeden czynnik zmiany naraz.
- Do decyzji o skalowaniu bierz click-through i backend, nie view-through i modeled.
- Breakdown per placement/wiek/czas przed każdą decyzją „wyłącz/przesuń budżet".
