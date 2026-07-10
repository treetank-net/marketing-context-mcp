---
keywords: [testowanie kreacji, creative testing, skalowanie, scaling, winner, zwyciezca, fatigue, zmeczenie kreacji, hook, wariant]
applies_to: [meta-ads]
task_type: [mutation, review]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_ad_create, prepare_ad_creative, prepare_video_creative, prepare_carousel_creative, prepare_advantage_creative, prepare_budget_change]
priority: 4
inject: summary
related: [meta-ads/account-structure-learning-phase.md, meta-ads/budgeting-abo-cbo-advantage.md, general/copywriting-principles.md, general/case-studies.md, meta-ads/experiments-testing-methodology.md]
source: ["praktycy: Motion, AdAmigo, AdStellar, VibeMyAd, jetfuel.agency", "AppsFlyer 2025"]
summary: "Kreacja odpowiada za ~56-80% wyniku; po Andromedzie targetujesz kreacją, nie audytorium. Testuj 3-5 wariantów na koncept, oceniaj dopiero po ≥48h i 50+ eventach/wariant (100+ dla pewności); tempo: 10-15 wariantów/tydz. przy ≤$100/dzień, 30+ przy ≥$1000/dzień; 10-15% budżetu na testy, 15-20 aktywnych reklam różnych hooków. Skalowanie wg 60-30-10 (zwycięzcy/wariacje/nowe koncepty), budżet +20% co 3-5 dni, nie pauzuj starych kreacji. Rotuj co 3-4 tygodnie; fatigue = frequency rośnie, CTR spada, CPM/CPA rosną."
---

# Testowanie kreacji i skalowanie winnerów (Meta)

Na Meta kreacja jest głównym driverem wyniku (praktycy: ~56-80% efektu zależy od kreacji, nie od budżetu/targetu). Po zmianie algorytmu (Andromeda, 2025) algorytm czyta kreację, by dobrać odbiorcę — targetowanie robisz przez kreację, nie przez wąskie audytoria.

Źródła: destylacja praktyków (Motion, AdAmigo, AdStellar, VibeMyAd, jetfuel.agency) + AppsFlyer 2025. Progi cytowane w ≥2 źródłach chyba że zaznaczono.

## Progi liczbowe

| Próg | Wartość | Zastosowanie |
|---|---|---|
| TEST_VARIANTS_LOW_BUDGET | 10-15 wariantów/tydz. przy ≤ $100/dzień | tempo testów, mały budżet |
| TEST_VARIANTS_HIGH_BUDGET | 30+ wariantów/tydz. przy ≥ $1000/dzień | tempo testów, duży budżet |
| ACTIVE_ADS_ANDROMEDA | 15-20 aktywnych reklam różnych hooków/formatów | dywersyfikacja kreacji |
| TEST_BUDGET_SHARE | 10-15% budżetu dziennego na testy | alokacja na fazę testu |
| MIN_TEST_RUNTIME | ≥ 48h | zanim ocenisz test |
| MIN_EVENTS_DIRECTIONAL | 50+ eventów/wariant | sygnał kierunkowy |
| MIN_EVENTS_CONFIDENT | 100+ eventów/wariant | wysoka pewność (rekomendacja Meta) |
| SCALE_STEP | +20% co 3-5 dni | bezpieczne skalowanie budżetu |
| CREATIVE_REFRESH | co 3-4 tygodnie | rotacja przeciw zmęczeniu kreacji |

## Framework testowania (3 fazy)

1. **Test**: 3-5 wariantów kreacji na temat/koncept, znajdź top performerów. Nie oceniaj przed 48h i przed ~50 eventami/wariant.
2. **Walidacja**: potwierdź zwycięzcę na większym wolumenie (dąż do 100+ eventów dla pewności).
3. **Skalowanie**: przenieś zwycięzcę do skalowania budżetu (patrz niżej).

Tempo testów zależy od budżetu: 10-15 wariantów/tydzień przy ≤$100/dzień, 30+ przy ≥$1000/dzień. Po Andromeda liczy się **dywersyfikacja** (różne hooki, formaty, kąty), nie „głupi wolumen" drobnych wariacji tego samego przekazu.

## Skalowanie winnerów — reguła 60-30-10

Alokacja budżetu: **60% na sprawdzonych zwycięzców, 30% na wariacje zwycięzców, 10% na całkiem nowe koncepty**. Utrzymanie nowych na 10% chroni budżet zwycięzców przed „kradzieżą" w trakcie ich fazy uczenia; obiecujące koncepty awansują do tieru 30%.

## Zasady skalowania

- Budżet: **+20% co 3-5 dni** (spójne z resetem fazy uczenia przy >20% — patrz `account-structure-learning-phase.md`). Monitoruj ROAS, CPA, częstotliwość (frequency).
- **Nie pauzuj starych kreacji** przy dodawaniu nowych — trzymaj je równolegle.
- Gdy nowa kreacja dorównuje/bije zwycięzcę: zacznij skalować od razu; dodawaj świeżą kreację do zmęczonych ad setów, by je odświeżyć.
- Skalowanie horyzontalne (duplikacja ad setu/kampanii) jako alternatywa dla ciągłego podnoszenia budżetu jednej kampanii.

## Zmęczenie kreacji (fatigue)

- Rotuj kreacje **co 3-4 tygodnie** — odświeżaj hooki i propozycje wartości, nie tylko drobne zmiany wizualne.
- Sygnały zmęczenia: rosnąca frequency, spadający CTR, rosnący CPM/CPA przy tej samej kreacji.
