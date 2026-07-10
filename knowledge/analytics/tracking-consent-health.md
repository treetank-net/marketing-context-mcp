---
keywords: [tracking health, consent mode, zgody, pixel, capi, ga4, konwersje nie spływają, dedup, emq, tag health, pomiar]
applies_to: [analytics, google-ads, meta-ads]
task_type: [workflow]
intent: tracking_consent_health
default_schedule: monthly
trigger_stage: [prompt]
priority: 5
inject: summary
related: [analytics/consent-mode.md, analytics/consent-mode-gtm-operational.md, analytics/ga4-conversion-import.md, analytics/meta-pixel-capi.md, meta-ads/pixel-capi-signal-quality.md, general/task-catalog.md]
source: ["knowledge/analytics/* (consent-mode, ga4-conversion-import, meta-pixel-capi)"]
summary: "Miesięczny health-check pomiaru — bez tego liczby wszystkich pozostałych przeglądów kłamią. Sprawdź: czy konwersje spływają (GA4 + import do Google Ads), czy Consent Mode v2 działa (sygnały denied/granted, brak spadku po wdrożeniu bannera), jakość sygnału Meta (EMQ, deduplikacja pixel+CAPI, pokrycie zdarzeń), spójność definicji konwersji między platformami. Wynik: findings → append_task (source_type: review); krytyczny tracking break blokuje wiarygodność raportów."
---

# Workflow: Tracking & Consent Health Check

Cross-cutting fundament: jeśli pomiar padł, każdy inny przegląd operuje na
fałszywych liczbach. Odpalaj miesięcznie **przed** monthly-client-review.

## Kroki

1. **Konwersje spływają?**
   - GA4: kluczowe zdarzenia mają niezerowy wolumen, brak nagłego urwania
     (`analytics/ga4-conversion-import.md`).
   - Import GA4 → Google Ads: konwersje zaimportowane, status „Recording",
     brak „No recent conversions".
   - Porównaj rząd wielkości konwersji platformowych vs GA4 vs backend/CRM —
     duża rozbieżność = problem atrybucji lub trackingu.
2. **Consent Mode v2** (`analytics/consent-mode.md`,
   `analytics/consent-mode-gtm-operational.md`):
   - sygnały `ad_storage`/`analytics_storage`/`ad_user_data`/`ad_personalization`
     wysyłane (granted i denied), nie tylko default;
   - brak trwałego spadku konwersji zbieżnego z wdrożeniem bannera (objaw złej
     konfiguracji, nie realnego spadku);
   - modelowanie konwersji aktywne tam, gdzie ma być.
3. **Jakość sygnału Meta** (`analytics/meta-pixel-capi.md`,
   `meta-ads/pixel-capi-signal-quality.md`):
   - Event Match Quality (EMQ) na kluczowych zdarzeniach — cel „Good/Great";
   - deduplikacja pixel + CAPI (jedno zdarzenie, nie podwójne liczenie) — sprawdź
     `event_id`;
   - pokrycie CAPI dla zdarzeń dolnego lejka (Purchase/Lead).
4. **Spójność definicji**: to samo „zakup"/„lead" znaczy to samo w GA4, Google Ads
   i Meta (okna atrybucji, licz-once vs every).

## Progi / czerwone flagi

| Objaw | Znaczenie |
|---|---|
| Zdarzenie konwersji z 0 wolumenem / nagłe urwanie | tracking break — **krytyczne**, blokuje raporty |
| Konwersje platformowe ≫ GA4/CRM | podwójne liczenie lub zła deduplikacja |
| Spadek konwersji zbieżny z wdrożeniem bannera zgód | źle skonfigurowany Consent Mode |
| EMQ „Poor" na Purchase/Lead | słaby sygnał Meta — pogarsza optymalizację i skalę |

## Wynik

- Krytyczny break → `append_task` high priority + oznacz w monthly-client-review,
  że dane kanału są niewiarygodne do czasu naprawy.
- Pozostałe → follow-up taski (`source_type: review`).
- Naprawy techniczne (GTM/pixel/CAPI) to zadania wdrożeniowe, nie mutacje
  reklamowe — poza `prepare_*`.
