---
keywords: [Pixel, Conversions API, CAPI, deduplikacja, deduplication, event_id, Event Match Quality, EMQ, jakosc sygnalu, signal quality, first-party data]
applies_to: [meta-ads]
task_type: [review, interpretation, mutation]
trigger_stage: [prompt, pre_tool]
trigger_tools: [prepare_ad_set_create, get_insights, prepare_ad_set_update]
priority: 4
inject: summary
related: [meta-ads/audiences-targeting.md, meta-ads/campaign-consolidation-andromeda.md, meta-ads/account-structure-learning-phase.md, analytics/meta-pixel-capi.md]
source: ["Meta for Developers (Dataset Quality API, CAPI)", "praktycy: adlibrary, budindia, taggrs"]
summary: "Event Match Quality: cel ≥8/10, <6 = wysyłaj więcej parametrów klienta (hashowany email/telefon, IP, fbp/fbc, external_id). Deduplikacja Pixel↔CAPI po event_name + event_id: jeden UUID przekazany do eventID pixela i event_id w CAPI; niespójny event_id = ~30% konwersji liczonych podwójnie i fałszywy «skok ROAS» po włączeniu CAPI. Data freshness < ~1h opóźnienia. Przed skalowaniem lub obwinieniem kampanii sprawdź EMQ, deduplikację i zgodność konwersji Ads Manager vs backend — słaby sygnał = Learning Limited i decyzje na szumie."
---

# Pixel + CAPI i jakość sygnału

Aspekt **operacyjny/strategiczny**: dlaczego jakość sygnału warunkuje optymalizację i skalowanie. Techniczny setup (GTM, server-side, mapowanie eventów) jest w warstwie analytics — tu chodzi o to, jak zły sygnał sabotuje delivery i jak to rozpoznać przy pracy na kampaniach.

Rdzeń: po Andromedzie **czysty Pixel + CAPI to warunek konieczny** — algorytm uczy się z eventów konwersji, więc słaby/podwójny sygnał wprost spowalnia naukę i psuje CPA (patrz `campaign-consolidation-andromeda.md`).

Źródła: Meta for Developers (Dataset Quality API, CAPI), destylacja praktyków (adlibrary, budindia, taggrs). Progi cytowane w ≥2 źródłach chyba że zaznaczono.

## Progi liczbowe

| Próg | Wartość | Zastosowanie |
|---|---|---|
| EMQ_GOOD | ≥ 8.0 / 10 | dobra jakość dopasowania eventu (Events Manager) |
| EMQ_WEAK | < 6.0 / 10 | słaby match — wysyłaj więcej parametrów klienta |
| DEDUP_KEY | event_name + event_id (+ external_id) | klucz deduplikacji browser↔server |
| DUP_RISK | ~30% eventów podwójnie liczonych | typowy skutek niespójnego event_id (praktycy) |
| DATA_FRESHNESS | < ~1h opóźnienia server→Meta | świeżość sygnału (Events Manager) |

## Dlaczego jakość sygnału to sprawa media buyera, nie tylko dev-a

- Algorytm optymalizuje na **eventach konwersji**. Jeśli sygnał jest rzadki, opóźniony albo źle dopasowany do osoby, ad set utyka w fazie uczenia / Learning Limited (patrz `account-structure-learning-phase.md`).
- Podwójne liczenie zawyża raportowane konwersje/ROAS → błędne decyzje o skalowaniu i budżecie. „Świetny ROAS" może być artefaktem duplikacji.
- Słaby match (niski EMQ) = Meta gorzej przypisuje konwersję do użytkownika → gorsze audytoria, gorsze lookalike (patrz `audiences-targeting.md`), wolniejsza nauka.

## Deduplikacja (event_id)

- Pixel (browser) i CAPI (server) wysyłają **ten sam event**. Meta scala je, gdy mają **ten sam `event_name` i `event_id`** (dla PageView/ViewContent pomaga też `external_id`/`fbp`).
- Najczęstszy błąd: EMQ wygląda wysoko, ale ~30% konwersji jest liczonych podwójnie, bo `event_id` **nie jest spójny** między pixelem a CAPI.
- Poprawnie: **jeden UUID** generowany raz przy inicjacji zdarzenia (np. checkout), zapisany w sesji, przekazany do `eventID` pixela **i** do `event_id` w payloadzie CAPI.
- Objaw duplikacji przy pracy: konwersje w Ads Manager > konwersje w analytics/backendzie sklepu; nagły „skok" ROAS po włączeniu CAPI bez wzrostu sprzedaży.

## Event Match Quality (EMQ)

- Ocena 0-10 w Events Manager: jak dobrze wysyłane parametry pozwalają dopasować event do konta użytkownika. Cel: **≥ 8**; < 6 to sygnał do naprawy.
- Podnoszenie EMQ: wysyłaj więcej **customer information parameters** przy evencie server — email, telefon (hashowane), IP, user agent, `fbp`/`fbc`, external_id. Więcej wiarygodnych identyfikatorów = wyższy match.
- CAPI jest dziś warunkiem odporności na blokady cookies/ITP/ad-blockery — sam Pixel przecieka. Od maja 2025 offline conversions też idą przez CAPI (Offline Conversions API wygaszone).

## Co sprawdzić zanim skalujesz / obwinisz kampanię

- Events Manager → EMQ per event (≥8?), Event Deduplication (brak „nieudanej deduplikacji"?), Data Freshness (świeżo?).
- Zgodność liczby konwersji: Ads Manager vs backend sklepu (rozjazd = duplikacja lub braki).
- Dopiero przy zdrowym sygnale ma sens ocena CPA/ROAS i decyzje o budżecie — inaczej optymalizujesz na szumie.
