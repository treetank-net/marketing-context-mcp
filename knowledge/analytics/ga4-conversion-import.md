---
keywords: [ga4, google analytics 4, import konwersji, conversion import, key event, kluczowe zdarzenie, linkowanie, product linking, auto-tagging, gclid, smart bidding, secondary, primary, discrepancy, rozjazd]
applies_to: [google-ads]
task_type: [diagnosis, review]
trigger_stage: [prompt, post_tool]
priority: 3
inject: summary
related: [analytics/consent-mode.md, google-ads/conversions-analytics-tracking.md, analytics/ga4-gtm-operational.md]
source: ["https://support.google.com/google-ads/answer/2375435"]
summary: "Import konwersji GA4→Google Ads wymaga połączonych kont, włączonego auto-taggingu, nienaruszonego GCLID (redirecty!), zdarzenia oznaczonego jako key event w GA4 i min. roli Marketer. Dane pojawiają się z opóźnieniem do 24h, historia NIE jest importowana, a konwersje utworzone przez GA4 są domyślnie secondary — do Smart Biddingu trzeba przestawić na primary w Google Ads. Rozjazdy GA4 vs Ads (counting method, modeled conversions, cookie expiration, invalid clicks) są normalne, nie bug."
---

# GA4 → import konwersji do Google Ads

Źródło oficjalne: https://support.google.com/google-ads/answer/2375435 („Create conversions from Google Analytics events in Google Ads", Google Ads Help). Tier 1.

## Warunki i progi

| Element | Wartość / wymóg |
|---|---|
| Linkowanie kont | Google Ads ↔ Google Analytics musi być połączone |
| Auto-tagging | Musi być włączone w Google Ads |
| GCLID | Nie może być usuwany/zmieniany przez stronę (np. przez redirecty) |
| Uprawnienia | Min. rola **Marketer** w GA + admin w Google Ads |
| Warunek importu zdarzenia | Zdarzenie musi być oznaczone jako **key event** w GA4 |
| Opóźnienie danych | Do **24h** zanim konwersja pojawi się w Google Ads |
| Dane historyczne | NIE są importowane (tylko od momentu importu) |
| Domyślny status importu przez GA4 | **Secondary** (trzeba zmienić na primary do bidowania) |

## Zasady fundamentalne

- **GA4 = source of truth**: key events definiuje i zarządza się w GA4, potem importuje jako konwersje do Google Ads.
- Aby zaimportować zdarzenie GA4: najpierw oznacz je jako **key event** w GA4 (Admin → Events → toggle „Mark as key event"). Nowe zdarzenie musi się najpierw wyzwolić i pojawić na liście.
- Nazwy zdarzeń muszą się **dokładnie zgadzać** między GA4 a setupem konwersji w Google Ads (przy troubleshootingu/ręcznym tworzeniu).
- Część ustawień (conversion window, counting method) może być **nieedytowalna** w Google Ads, gdy konwersja pochodzi z GA4.
- Konwersje utworzone przez interfejs GA4 są ustawiane jako **secondary** — do użycia w bidowaniu trzeba zmienić action optimization w Google Ads.

## Jak zaimportować (dwie drogi)

- **Z Google Ads**: Goals → Summary → + Create conversion action → wybierz property GA4 → wybierz zdarzenia → Save.
- **Z GA4**: Advertising → Conversion management (Tools) → wybierz konto Google Ads → New conversion → wybierz zdarzenia/key events → (kategoria) → Save. Zdarzenia wybrane z sekcji „Events" zostaną oznaczone jako key events.

## Edycja i uprawnienia po imporcie

- Goal category i action optimization edytujesz **tylko w Google Ads** (nie w GA4).
- Jeśli konwersja jest **Primary** w Google Ads → ustawienia są read-only w GA4. Jeśli **Secondary** → edytowalne w GA4.
- Zmiany zrobione w GA4 pojawiają się w Google Ads tylko w „Change history".

## Dlaczego warto

- Smart Bidding dostaje dostęp do danych GA4 → potencjalnie więcej konwersji przy niższym koszcie.
- Widoczność konwersji i danych GA4 przy klikach Google Ads w jednym miejscu.

## Rozjazdy danych GA4 vs Google Ads (częste, normalne)

Możliwe przyczyny mimo poprawnego setupu: data of transaction, counting method / kolumny konwersji, invalid clicks, cookie expiration, opóźnienia importu Analytics, zmiany nazwy key eventu/property w GA4. Raporty mogą zawierać **modeled conversions** jako estymaty.

## Implikacje dla diagnostyki (google-ads-baby)

- Diagnozując „brak konwersji z GA4 w Google Ads": sprawdź kolejno — linkowanie kont, auto-tagging włączony, GCLID nienaruszony (redirecty!), zdarzenie oznaczone jako key event, upłynęło <24h.
- „Konwersje GA4 są, ale Smart Bidding ich nie używa": prawdopodobnie import zostawił je jako **secondary** — trzeba ustawić primary/action optimization w Google Ads.
- Rozjazd liczb GA4 vs Google Ads: nie traktować jako bug automatycznie; wskazać typowe przyczyny (counting method, modeled conversions, opóźnienia). Patrz też `google-ads/conversions-analytics-tracking.md` (all_conversions vs conversions).
