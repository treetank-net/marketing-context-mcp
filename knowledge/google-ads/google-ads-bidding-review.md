---
keywords: [bidding, strategia stawek, tCPA, tROAS, maximize conversions, target, licytacja, smart bidding, learning phase, korekta celu]
applies_to: [google-ads]
task_type: [workflow]
intent: google_ads_bidding_review
default_schedule: monthly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [google-ads/bidding-strategies.md, google-ads/budget-scaling-seasonality.md, general/benchmarks/google-ads-search.md, general/task-catalog.md]
source: ["knowledge/google-ads/bidding-strategies.md"]
summary: "Miesięczny przegląd strategii stawek per kampania: czy strategia pasuje do celu i dojrzałości konta (bidding ladder wg progów konwersji), czy target tCPA/tROAS jest realistyczny vs faktyczne CPA/ROAS z 30 dni, czy kampania nie utknęła w fazie uczenia. Wynik: stopniowe zmiany targetów/strategii (nie skokowo, jeden czynnik naraz) jako append_task + prepare_* po zatwierdzeniu; append_review. Mutacje tylko prepare_* + safe-word."
---

# Workflow: Google Ads Bidding Review

Procedura miesięczna. Cel: dla każdej kampanii sprawdzić, czy strategia stawek pasuje do
celu biznesowego i dojrzałości konta, czy target (tCPA/tROAS) jest realistyczny względem
faktycznych wyników, i czy kampania nie tkwi w fazie uczenia. Progi biorą się z
`bidding-strategies.md` — nie wymyślaj własnych. Mutacje zawsze przez `prepare_*` + safe-word.

## Progi (z `bidding-strategies.md`)

| Sygnał | Próg | Akcja |
|---|---|---|
| Konwersje/30d (usługi / lead-gen) | 15 | kandydat na Maximize Conversions |
| Konwersje/30d (usługi / lead-gen) | 30 | kandydat na tCPA |
| Konwersje/30d (e-commerce) | 15 | kandydat na Maximize Value |
| Konwersje/30d (e-commerce) | 50 | kandydat na tROAS |
| Learning period po zmianie strategii | 7-14 dni | nie zmieniać targetów w tym oknie |
| Tempo zmiany targetu/budżetu | 10-20%/mies. | jeden czynnik naraz |
| Monitoring po zmianie | min. 3 dni | przed oceną efektu |

Bidding ladder — zawsze przeskok **wyżej**. Jedyny wyjątek: „odbicie" po dłuższej przerwie
(o jeden poziom w dół, nie więcej). eCPC nie istnieje od 2024-2025 — nie proponuj.
Nigdy Maximize Clicks ani CPM w kampaniach konwersyjnych.

## Kroki

1. Zbierz stan per kampania: `bidding_strategy_type`, target_cpa/target_roas, faktyczny
   CPA/ROAS z ostatnich 30 dni, wolumen konwersji, Impression Share i trend wydatków
   (read: `get_campaigns`, doprecyzowanie przez `execute_gaql`). Uwaga: gdy
   `campaign.bidding_strategy` jest niepuste, strategia jest portfolio (współdzielona) —
   targety czytaj z osobnego zasobu `bidding_strategy`, nie z pola na kampanii, inaczej
   diagnoza „kampania bez celu" bywa błędna.
2. **Dopasowanie strategii** (wg `bidding-strategies.md`): porównaj wolumen konwersji z
   progami ladder. Kampania usługowa z 30+ konwersji na Maximize Conversions → kandydat
   na tCPA; e-commerce z 50+ na Maximize Value → kandydat na tROAS. Sam brak targetu przy
   Maximize Conversions/Value to NIE automatycznie problem — może być świadoma decyzja przy
   zbyt małej historii; wymaga kontekstu.
3. **Realizm targetu**: zestaw target vs faktyczny wynik z 30d. Target zbyt agresywny
   (tCPA znacznie poniżej faktycznego CPA, tROAS znacznie powyżej realnego) dławi wolumen —
   Impression Share spada, wydatek nie schodzi w całości. Target zbyt luźny → przepłacanie.
   Porównaj z benchmarkami (`general/benchmarks/google-ads-search.md`) zanim uznasz wynik
   za zły — słaby CPA może być normą w branży.
4. **Faza uczenia**: sprawdź, czy kampania nie zmieniała strategii/targetu w ostatnich
   7-14 dniach. Jeśli tak — jest w learning period, nie ruszaj targetów, poczekaj na
   ustabilizowanie.
5. **Sezonowość** (`budget-scaling-seasonality.md`): nie zmieniaj strategii bidowania w
   trakcie szczytu; danych z okresów wyjątkowych (np. Black Friday) nie używaj jako bazy do
   ustawiania ROAS na resztę roku.

## Wynik

- Zmiany targetów/strategii utrwalaj jako `append_task`, a wykonanie przez `prepare_*`
  (`prepare_search_campaign`, `prepare_campaign_targeting`) **po zatwierdzeniu** + safe-word.
- Target zmieniaj **stopniowo** (10-20%/mies.), nigdy skokowo — skok resetuje fazę uczenia.
  Zmieniaj **jeden czynnik naraz** (albo target, albo budżet, nigdy obie rzeczy razem);
  po zmianie min. 3 dni monitoringu przed oceną efektu.
- Zapisz `append_review` z listą kampanii, oceną dopasowania i proponowanymi zmianami.
- Jeśli recurring: po wykonaniu `mark_task_run` (ustawi `last_run`/`next_due`).
