---
keywords: [signal quality, jakosc sygnalu, emq, event match quality, pixel, capi, conversions api, deduplikacja, pokrycie zdarzen, meta]
applies_to: [meta-ads]
task_type: [workflow]
intent: meta_ads_signal_quality
default_schedule: monthly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [meta-ads/pixel-capi-signal-quality.md, analytics/meta-pixel-capi.md, analytics/tracking-consent-health.md, general/task-catalog.md]
source: ["knowledge/meta-ads/pixel-capi-signal-quality.md"]
summary: "Miesięczny przegląd jakości sygnału Meta (Pixel + CAPI): sprawdzasz Event Match Quality na kluczowych zdarzeniach, deduplikację Pixel↔CAPI po event_id, pokrycie CAPI dla zdarzeń dolnego lejka i kompletność parametrów dopasowania. Słaby lub podwójny sygnał psuje optymalizację i skalowanie oraz zawyża ROAS. Braki sygnału zapisujesz jako techniczne zadania pomiarowe (append_task), nie jako mutacje reklamowe; przegląd domykasz przez append_review."
---

# Workflow: miesięczny przegląd jakości sygnału Meta (Pixel + CAPI)

Cel: raz w miesiącu sprawdzić, czy sygnał konwersji, którym karmisz Meta (Pixel + CAPI), jest czysty, kompletny i dobrze dopasowany. Słaby, opóźniony albo podwójnie liczony sygnał wprost psuje optymalizację i skalowanie: ad sety utykają w fazie uczenia, a raportowany ROAS bywa artefaktem duplikacji. To węższy, „metowy" odpowiednik cross-cuttingowego przeglądu `analytics/tracking-consent-health.md` — tu patrzysz wyłącznie na jakość zdarzeń trafiających do Meta.

To zadanie diagnostyczne warstwy pomiaru, nie zadanie reklamowe. Nie zmieniasz kampanii, budżetów ani stawek. Progi liczbowe i mechanika w `meta-ads/pixel-capi-signal-quality.md`; wdrożenie techniczne (GTM, server-side, mapowanie zdarzeń) w `analytics/meta-pixel-capi.md`.

## Kroki

1. **Event Match Quality (EMQ)** — Events Manager → EMQ per zdarzenie dla kluczowych zdarzeń (zwłaszcza dolny lejek). Cel poniżej; niski EMQ to sygnał do naprawy, nie do obwiniania kampanii.

   | Ocena EMQ | Wartość | Interpretacja |
   |---|---|---|
   | Dobra (cel) | ≥ 8.0 / 10 | jakość dopasowania OK |
   | Słaba | < 6.0 / 10 | za mało parametrów klienta — do naprawy |

2. **Deduplikacja Pixel ↔ CAPI (event_id)** — sprawdź w Events Manager, czy Pixel i CAPI scalają się po tym samym `event_name` + `event_id` (brak „nieudanej deduplikacji"). Niespójny `event_id` daje typowo ~30% zdarzeń liczonych podwójnie i fałszywy „skok" ROAS po włączeniu CAPI. Objaw przy pracy: konwersje w Ads Manager > konwersje w backendzie sklepu.

3. **Pokrycie CAPI dla dolnego lejka** — upewnij się, że zdarzenia decydujące o optymalizacji (Purchase, Lead) idą przez CAPI, nie tylko przez Pixel. Sam Pixel przecieka (cookies/ITP/ad-blockery), więc brak pokrycia CAPI na dole lejka = ubogi sygnał tam, gdzie najbardziej boli.

4. **Parametry dopasowania** — sprawdź, czy przy zdarzeniach server przekazywane są customer information parameters: hashowany email, telefon, IP, user agent, `fbp`/`fbc`, `external_id`. Więcej wiarygodnych identyfikatorów = wyższy EMQ i lepsze audytoria/lookalike.

5. **Świeżość i kompletność** — Data Freshness < ~1h opóźnienia server→Meta; zgodność liczby konwersji Ads Manager vs backend sklepu (rozjazd = duplikacja lub braki). Szczegóły w `pixel-capi-signal-quality.md`.

6. **Powiązania** — jeśli sygnał słabnie mimo poprawnego wdrożenia, sprawdź `analytics/tracking-consent-health.md` (Consent Mode i zgody ograniczają zdarzenia u źródła). Pytania o samo wdrożenie techniczne → `analytics/meta-pixel-capi.md`.

## Wynik

- Każdy wykryty brak sygnału (niski EMQ, nieudana deduplikacja, brak pokrycia CAPI, brakujące parametry) zapisz jako techniczne zadanie pomiarowe przez `append_task` — to naprawy wdrożeniowe CAPI/parametrów, kierowane do warstwy analytics/dev, **nie** mutacje reklamowe.
- Nie ruszaj kampanii na podstawie tego przeglądu: dopóki sygnał jest niezdrowy, ocena CPA/ROAS i decyzje budżetowe byłyby podejmowane na szumie.
- Domknij przegląd przez `append_review` (data, sprawdzone zdarzenia, wykryte braki, wystawione zadania), żeby następny miesięczny cykl miał punkt odniesienia.
