---
keywords: [konsolidacja, consolidation, Andromeda, data density, gestosc danych, mniej ad setow, fragmentacja, sygnal, delivery, struktura kampanii]
applies_to: [meta-ads]
task_type: [mutation, review]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_campaign_create, prepare_ad_set_create, prepare_ad_set_update]
priority: 4
inject: summary
related: [meta-ads/account-structure-learning-phase.md, meta-ads/pixel-capi-signal-quality.md, meta-ads/creative-testing-scaling.md, meta-ads/audiences-targeting.md, general/case-studies.md]
source: ["praktycy: Foxwell, jetfuel, fiveninestrategy, PPC Hero, TheOptimizer"]
summary: "Po Andromedzie mniej ad setów = więcej sygnału: każdy ad set potrzebuje ~50 eventów/7 dni i ≥ ~$50/dzień, więc rozbicie budżetu na 5-10 ad setów wpycha wszystkie w Learning Limited. Domyślnie jeden broad ad set z 15-30 kreacjami; test agencyjny: 1 ad set × 25 kreacji dał ~17% więcej konwersji przy ~16% niższym koszcie niż 5 × 5. Osobny ad set tylko przy realnej różnicy (prospecting vs retargeting, inny cel, geografia/waluta), nigdy dla drobnych wariantów interest/LAL. Warunek wstępny: zdrowy Pixel+CAPI."
---

# Konsolidacja kampanii i Andromeda

Krótko: **mniej ad setów = więcej sygnału na ad set = szybsza nauka**. To rozwinięcie zasad ze `account-structure-learning-phase.md` (hierarchia, ABO/CBO, faza uczenia — tam, nie tu) o kontekst zmiany systemu delivery Meta (Andromeda) i regułę „kiedy NIE fragmentować".

Źródła: destylacja praktyków (Foxwell, jetfuel, fiveninestrategy, PPC Hero, TheOptimizer). Liczby konsolidacji z pojedynczych testów agencyjnych — oznaczone „1 źródło", traktuj jako rząd wielkości.

## Progi liczbowe

| Próg | Wartość | Zastosowanie |
|---|---|---|
| ADSET_MIN_DAILY | ≥ ~$50/dzień/ad set | poniżej tego za mało danych do nauki |
| CREATIVES_PER_ADSET | 15-30 (limit techniczny 150) | dywersyfikacja kreacji w jednym broad ad secie |
| DATA_DENSITY_RULE | konwersje skupione, nie rozproszone | 1 ad set 20 konw./dzień > 3 ad sety po 6-7 |
| CONSOLIDATION_LIFT | ~+17% konw. / -16% koszt | 1 ad set × 25 kreacji vs 5 × 5 (1 źródło, test) |
| LEARNING_EXIT_EVENTS | ~50 eventów / 7 dni / ad set | patrz account-structure (powód konsolidacji) |

## Andromeda — co się zmieniło (kontekst)

- Andromeda (nowy system delivery/retrieval Meta, 2025/26) mocniej niż wcześniej opiera dopasowanie na **kreacji i sygnale konwersji**, nie na ręcznych warstwach audytoriów. Efekt: rozdrabnianie struktury szkodzi, bo rozcieńcza dane.
- „Data density" (gęstość danych) = koncentracja eventów konwersji w jednej kampanii/ad secie. Wyższa gęstość → szybsza i lepsza optymalizacja. Zły/podwójny sygnał to „cichy zabójca" (patrz `pixel-capi-signal-quality.md`).

## Dlaczego konsolidować

- Każdy ad set potrzebuje ~50 eventów/7 dni, by wyjść z fazy uczenia. Rozbicie budżetu na 5-10 ad setów = każdy zbiera za mało → wszystkie tkwią w Learning Limited (patrz `account-structure-learning-phase.md`).
- Jeden broad ad set z **15-30 kreacjami** daje Andromedzie wolumen do szybkiego wyłonienia zwycięzców — zamiast wielu ad setów po kilka kreacji.
- Zamiast warstw interest/LAL polegaj na broad + kreacja + custom audience jako suggestion (patrz `audiences-targeting.md`).
- Test agencyjny (1 źródło): te same reklamy i LP, inaczej ułożone — **1 ad set × 25 kreacji dał ~17% więcej konwersji przy ~16% niższym koszcie** niż 5 ad setów × 5 kreacji. Traktuj jako kierunek, nie gwarancję.

## Kiedy NIE fragmentować (a kiedy wolno)

- **Nie twórz osobnego ad setu** dla drobnych różnic interest/LAL/% lookalike — to rozcieńcza sygnał i tworzy overlap (auction overlap, patrz `audiences-targeting.md`).
- **Nie mnóż ad setów z budżetem < ~$50/dzień** — nie zbiorą danych.
- **Osobny ad set/kampania uzasadniony tylko** przy realnej różnicy: inne audytorium o innej intencji (prospecting vs retargeting), inny cel/optymalizacja, inna geografia/waluta, wymóg osobnego budżetu/raportowania.
- Wyjątek zdroworozsądkowy: jeśli w Twoim koncie segmentacja **konsekwentnie** bije pełną konsolidację — nie porzucaj jej. Konsolidacja to domyślna hipoteza, nie dogmat.

## Zasady operacyjne

- Domyślnie: mniej kampanii, mniej (często jeden) broad ad set, dużo dywersyfikowanych kreacji.
- Zawsze wyklucz obecnych klientów z prospectingu (patrz `audiences-targeting.md`).
- Konsoliduj stopniowo i obserwuj — konsolidacja też może zresetować fazę uczenia (zmiany budżetu/audytorium; patrz `account-structure-learning-phase.md`).
- Warunek wstępny każdej konsolidacji: zdrowy Pixel+CAPI (patrz `pixel-capi-signal-quality.md`) — inaczej skupiasz szum, nie sygnał.
