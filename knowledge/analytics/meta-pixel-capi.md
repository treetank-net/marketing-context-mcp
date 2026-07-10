---
keywords: [meta pixel, conversions api, capi, deduplikacja, deduplication, event_id, event_name, external_id, fbp, event match quality, emq, signal quality, jakosc sygnalu, server-side, cookieless, aggregated event measurement]
applies_to: [meta-ads]
task_type: [diagnosis, review]
trigger_stage: [prompt, post_tool]
priority: 3
inject: summary
related: [analytics/consent-mode.md, meta-ads/pixel-capi-signal-quality.md]
source: ["https://www.facebook.com/business/help/2041148702652965", "https://www.facebook.com/business/help/823677331451951", "https://www.facebook.com/business/help/765081237991954"]
summary: "Meta zaleca wysyłać zdarzenia redundantnie z Pixela (browser) i Conversions API (server) — wtedy deduplikacja obowiązkowa: identyczny event_name + event_id (alternatywnie event_name + external_id lub fbp); Meta zachowuje event otrzymany pierwszy, bez deduplikacji konwersje i ROAS są zawyżone. Event Match Quality: score 0-10 z ostatnich 48h — podnoszą go hashowany email i click ID (high), phone/external_id/fbp (medium). Offline Conversions API wycofane w maju 2025 — migracja do CAPI/datasets."
---

# Meta Pixel + Conversions API (CAPI)

Źródła oficjalne (Meta Business Help Centre, Tier 1):
- Conversions API: https://www.facebook.com/business/help/2041148702652965
- Deduplikacja: https://www.facebook.com/business/help/823677331451951
- Event match quality: https://www.facebook.com/business/help/765081237991954

## Parametry i progi kluczowe

| Element | Wartość / zasada |
|---|---|
| Warunek deduplikacji (główny) | `event_name` identyczny **oraz** `event_id` identyczny |
| Warunek deduplikacji (alternatywny) | `event_name` + (`external_id` **lub** `fbp`) |
| Preferencja przy duplikacie | Meta zachowuje **event otrzymany pierwszy** |
| Event match quality (EMQ) | Score **0-10** per zdarzenie |
| Okno danych EMQ | Ostatnie **48h** — wysyłać zdarzenia regularnie |
| Offline Conversions API | Wycofane w **maju 2025** — migrować do datasets/CAPI |

## Po co CAPI (Pixel vs Conversions API)

- **Meta Pixel** = browser-based; śledzi akcje na stronie, ale dane mogą być blokowane/tracone (ustawienia przeglądarki, ad blockery, utrata connectivity).
- **Conversions API** = server-side; wysyła zdarzenia bezpośrednio z serwera → bardziej odporne na ograniczenia przeglądarki, pełniejsze dane.
- CAPI tworzy bezpośrednie, bardziej niezawodne połączenie danych marketingowych (server/website platform/app/CRM) z systemami optymalizacji Meta → lepszy targeting, niższy koszt/wynik, lepszy pomiar. Obsługuje web/app/offline/messaging events przez jedno API.
- **Zalecenie Meta: wysyłać oba (Pixel + CAPI) redundantnie** dla tych samych zdarzeń, by odzyskać utracone sygnały — a wtedy **deduplikacja jest obowiązkowa**.

## Deduplikacja — kiedy i jak

- **Potrzebna**, gdy wysyłasz to samo zdarzenie (np. Purchase) z obu źródeł.
- **Niepotrzebna**, gdy różne zdarzenia z każdego źródła (np. AddToCart z browser, Purchase z server).
- Bez deduplikacji: sztucznie zawyżone konwersje → błędny conversion rate, ROAS, atrybucja i decyzje o budżecie.
- Setup techniczny: dodaj `event_name`, unikalny `event_id` do każdej instancji zdarzenia; opcjonalnie `external_id`/`fbp` jako dodatkowe dopasowanie. Partner integrations (Shopify, WooCommerce) często robią to automatycznie.
- Weryfikacja: **Test Events tool** w Events Manager pokazuje, które zdarzenia są received/deduplicated/dropped; Pixel Helper do diagnostyki.
- Najczęstsze błędy: niespójny/brakujący `event_id`, opóźnienia między browser a server, złe nazwy/wartości parametrów.

## Event match quality (jakość sygnału)

- EMQ (0-10) mierzy, jak skutecznie parametry customer information dopasowują zdarzenia do kont Meta. Lepszy match → lepsza atrybucja, dostarczanie do konwertujących, niższy koszt/akcję.
- Dostępne dla CAPI web events z `action_source = Website`, dla wszystkich standard/custom web events.
- **Priorytet parametrów** (wysyłać ile się da, gdy dostępne):
  - **High**: email address, click ID.
  - **Medium**: Facebook Login ID, date of birth, country, phone number, external ID, browser ID (fbp).
  - **Low**: lead, first name, surname, town/city, postcode.
- Wymóg prawny/Terms: mieć prawo do danych i **hashować** contact info wg dokumentacji dev; nie wysyłać danych wrażliwych; uzyskać zgodę przed udostępnieniem.

## Implikacje dla diagnostyki (meta-ads-baby)

- „Podwojone konwersje / zawyżony ROAS" przy Pixel+CAPI: sprawdź deduplikację — czy `event_id` jest **identyczny** i spójny między browser a server, czy `event_name` się zgadza.
- „Słabe dostarczanie / wysoki koszt per akcja": sprawdź EMQ w Events Manager — dosyłać email/phone/external_id (hashowane) by podnieść score.
- Utrata sygnału (iOS/ad blockery/cookieless) → rekomendacja wdrożenia CAPI obok Pixela (server-side odporny na browser limits).
- To temat wdrożenia po stronie klienta (serwer/CMS/GTM) — meta-ads-baby diagnozuje skutki (jakość sygnału, deduplikacja), nie konfiguruje Pixela/CAPI.
