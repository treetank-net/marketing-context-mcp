---
keywords: [budzet, budget, ABO, CBO, Advantage+, ASC, advantage shopping, skalowanie budzetu, alokacja, spend floor]
applies_to: [meta-ads]
task_type: [mutation, review]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_budget_change, prepare_ad_set_create, prepare_campaign_create, prepare_ad_set_update, confirm_mutation]
priority: 4
inject: summary
related: [meta-ads/account-structure-learning-phase.md, meta-ads/creative-testing-scaling.md, general/case-studies.md]
source: ["praktycy: AdAmigo, SuperScale, RebootIQ, TopGrowth, Marpipe", "dane Meta"]
summary: "ABO do testów (równy budżet, np. $20/dzień/ad set, min 3-5 dni; kill gdy CPA >20% nad celem po ~$100 spend), CBO do skalowania (dąż do ~50× CPA/tydzień danych). Advantage+ Shopping bije manual o ~15-30% ROAS przy 50+ konwersjach/tydzień, ale nie przy wydatku < ~$5k/mies. ani na nowym koncie. Typowa alokacja e-commerce: 60-70% Advantage+, 20-30% manual prospecting, 10-20% manual retargeting; w ASC wchodź od 20-30% budżetu, oceniaj po 4-6 tyg. Skaluj max +20% co 3-5 dni; zmiana budżetu CBO mniej wrażliwa niż ABO."
---

# Budżetowanie: ABO / CBO / Advantage+ Shopping

Kiedy który typ budżetu, ile minimalnie, jak alokować między prospecting/retargeting i jak skalować bez resetu fazy uczenia.

Źródła: destylacja praktyków (AdAmigo, SuperScale, RebootIQ, TopGrowth, Marpipe) + liczby raportowane przez Meta. Cyfry cytujące „dane wewnętrzne Meta" oznaczone jako 1 źródło.

## Progi liczbowe

| Próg | Wartość | Zastosowanie |
|---|---|---|
| CBO_MIN_WEEKLY | ~50× docelowy CPA / tydzień | próg wolumenu danych dla CBO (1 źródło Meta) |
| ASC_MIN_DAILY | ~50× docelowy CPA / dzień | rekomendacja Meta dla Advantage+ (1 źródło Meta) |
| ASC_MIN_SPEND | < ~$5k/mies. = za mało | poniżej tego ASC rzadko wychodzi z fazy uczenia |
| ASC_WEEKLY_CONV | 50+ konwersji/tydzień | próg, od którego Advantage+ zwykle bije manual |
| SCALE_STEP | +20% co 3-5 dni | bezpieczne skalowanie (>20%/tydz. destabilizuje) |
| TEST_BUDGET_PER_ADSET | równy budżet, np. $20/dzień/ad set | testowanie na ABO |
| KILL_CRITERION | CPA > cel o 20% po ~$100 spend | próg wyłączenia testowego ad setu |

## Wybór typu budżetu

- **ABO** — kontrola i testy. Równy budżet per ad set (np. $20/dzień), min. 3-5 dni runtime dla istotności. Chroni alokację przy audytoriach różnej wielkości.
- **CBO** — skalowanie sprawdzonych zwycięzców, algorytm rozdziela budżet kampanii. Wolumen: dąż do ~50× CPA/tydzień (1 źródło Meta), by miał dane. Nie mieszaj skrajnie różnych audytoriów w jednym CBO.
- **Advantage+ Shopping (ASC)** — pełna automatyzacja pod e-commerce z historią zakupów. Bije manual o ~15-30% ROAS przy 50+ konwersjach/tydzień; Meta raportuje ~17% niższy koszt/zakup i ~32% niższy koszt konwersji inkrementalnej gdy ASC działa obok manuala (dane Meta, 1 źródło).

## Kiedy NIE Advantage+

- Nowe konto/sklep z małą historią zakupów — manual z określonymi audytoriami zwykle startuje lepiej.
- Wydatek < ~$5k/miesiąc — za mało danych, ASC nie wychodzi stabilnie z fazy uczenia.

## Alokacja budżetu (typowa struktura e-commerce)

- 60-70% na Advantage+ (broad prospecting + auto-retargeting).
- 20-30% na manual prospecting (testy konkretnych audytoriów).
- 10-20% na manual retargeting (DPA / custom remarketing).

Wchodzenie w ASC stopniowo: start 20-30% całego budżetu Meta obok istniejących manuali, ocena po 4-6 tygodniach, przy równym/lepszym ROAS zwiększaj do 50-70%.

## Skalowanie budżetu — zasady

- **Max +20% co 3-5 dni.** Skok > 20%/tydzień destabilizuje algorytm, wynik spada, kampania wpada w pseudo-fazę uczenia (spójne z resetem przy edycji budżetu >20% — patrz `account-structure-learning-phase.md`).
- Jeden czynnik zmiany naraz; monitoruj CPA po każdej korekcie.
- Skalowanie horyzontalne (duplikacja) jako alternatywa dla ciągłego windowania jednej kampanii.
- Zmiana budżetu na poziomie **kampanii (CBO)** jest mniej wrażliwa niż zmiana budżetu **ad setu (ABO)** — preferuj CBO do skalowania.
