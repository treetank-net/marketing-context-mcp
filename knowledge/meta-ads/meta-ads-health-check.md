---
keywords: [meta health check, przeglad meta, facebook ads, instagram, faza uczenia, learning phase, delivery, frequency, czestotliwosc, wydajnosc zestawow]
applies_to: [meta-ads]
task_type: [workflow]
intent: meta_ads_health_check
default_schedule: weekly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [meta-ads/insights-interpretation.md, meta-ads/account-structure-learning-phase.md, meta-ads/objectives-optimization-events.md, general/task-catalog.md]
source: ["knowledge/meta-ads/insights-interpretation.md", "knowledge/meta-ads/account-structure-learning-phase.md"]
summary: "Cotygodniowy health-check kont Meta (odpowiednik daily-check Google Ads): sprawdź status dostarczania, fazę uczenia (~50 eventów optymalizacji/7 dni; poniżej — Learning Limited), częstotliwość (frequency > ~3.5/7 dni = zmęczenie), wydajność zestawów i zgodność eventu optymalizacji z celem. Interpretuj wg insights-interpretation.md, patrz na okno nie na szum dzienny, nie restartuj uczenia bez powodu. Wynik: findings → append_task (source_type: review), mutacje przez prepare_* + potwierdzenie, zapis przez append_review."
---

# Workflow: Meta Ads Health Check

Procedura (nie artykuł referencyjny): wykonaj kroki, wołając narzędzia platformowe.
To jest cotygodniowy przegląd zdrowia kont Meta — odpowiednik `google-ads-daily-check.md`
dla Google Ads. Skupia się na czterech osiach: **dostarczanie** (delivery), **faza uczenia**,
**częstotliwość** i **wydajność zestawów reklam**.
Progi są **domyślne** i pochodzą ze źródeł (`insights-interpretation.md`,
`account-structure-learning-phase.md`) — jeśli klient ma własne wartości w `procedures/`,
one mają pierwszeństwo.

## Zasady interpretacji (najpierw, inaczej alerty kłamią)

- **Nie reaguj na szum dzienny** — patrz na okno (7 dni), nie na pojedynczy dzień.
- **Nie oceniaj przed wolumenem** — ~50 eventów optymalizacji i min. 48h; przed tym to szum,
  nie sygnał (patrz `insights-interpretation.md`).
- **Nie restartuj fazy uczenia bez powodu** — znacząca edycja (budżet > 20%, zmiana
  audytorium / eventu optymalizacji / stawek, pauza ≥ 7 dni) zeruje zegar 50 eventów
  (patrz `account-structure-learning-phase.md`). Jeden czynnik zmiany naraz.
- **Diagnozuj po lejku** (hook → CTR → LPV → CPA), jeden czynnik naraz; do decyzji
  budżetowych bierz click-through i backend, nie view-through i modeled conversions.

## Progi (domyślne, rzędy wielkości)

| Oś | Sygnał | Próg orientacyjny | Źródło |
|---|---|---|---|
| Faza uczenia | wyjście z fazy uczenia | ~50 eventów optymalizacji / 7 dni na ad set | account-structure |
| Faza uczenia | „Learning Limited" (utyka) | < ~50 eventów / 7 dni | account-structure |
| Faza uczenia | reset po edycji budżetu | zmiana budżetu > 20% | account-structure |
| Częstotliwość | zmęczenie kreacji | frequency > ~3.5 / 7 dni | insights |
| Kreacja | słaby hook (pierwsza klatka) | hook rate < ~25% | insights |
| Środek lejka | wyciek techniczny LP | rozjazd LPV vs link clicks > ~15% | insights |
| Wydajność | zmęczenie audytorium | CPA ↑ i frequency ↑ razem → odśwież kreację, nie budżet | insights |

## Kroki

1. **Faza uczenia** — dla każdego aktywnego ad setu sprawdź, czy wyszedł z fazy uczenia
   (~50 eventów optymalizacji / 7 dni), czy utknął w „Learning Limited" (< ~50). Dla
   utkniętych ustal przyczynę (za wąskie audytorium / za niski budżet / zbyt rzadki event)
   i kandydujący fix wg `account-structure-learning-phase.md` (poszerz audytorium, event
   wyżej w lejku, konsolidacja).
2. **Dostarczanie (delivery)** — czy budżet się wydaje, czy nie ma statusu „not delivering"
   (odrzucenie kreacji, wyczerpany budżet, zawężone audytorium, problem płatności).
3. **Częstotliwość** — frequency per ad set w oknie 7 dni; > ~3.5 = ryzyko zmęczenia
   odbiorców. Jeśli równolegle rośnie CPA — sygnał do odświeżenia kreacji, nie do zmiany
   budżetu.
4. **Wydajność zestawów** — interpretuj CPM / CTR / CVR wg `insights-interpretation.md`:
   czytaj metryki jako system i po lejku, oddziel sygnał od szumu, zrób breakdown per
   placement / wiek / czas przed decyzją „wyłącz / przesuń budżet".
5. **Zgodność eventu optymalizacji z celem** — sprawdź, czy event optymalizacji ad setu
   pasuje do celu kampanii (`objectives-optimization-events.md`); niedopasowanie zaniża
   wolumen i wpycha ad set w Learning Limited.

## Wynik

- Dla każdego trafienia ustal severity i **zaproponuj follow-up task** (`append_task`)
  z `source_type: review`, wskazując workflow naprawczy (np.
  `account-structure-learning-phase.md` dla Learning Limited,
  `insights-interpretation.md` dla diagnozy wydajności).
- **Mutacje tylko przez odpowiednik `prepare_*`** w `meta-ads-baby` (np. `prepare_budget_change`,
  `prepare_ad_set_update`) **+ potwierdzenie safe-word**; nic nie zmieniaj automatycznie
  i pamiętaj o progu resetu fazy uczenia przed zmianą budżetu/audytorium.
- Zapisz podsumowanie przeglądu przez `append_review`.
