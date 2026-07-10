---
keywords: [consent mode, consent mode v2, zgoda, tryb zgody, basic, advanced, ad_storage, analytics_storage, ad_user_data, ad_personalization, eog, eea, cookieless pings, conversion modeling, gtm, google tag, tcf]
applies_to: [google-ads]
task_type: [diagnosis, review]
trigger_stage: [prompt, post_tool]
priority: 3
inject: summary
related: [analytics/ga4-conversion-import.md, google-ads/conversions-analytics-tracking.md, analytics/consent-mode-gtm-operational.md]
source: ["https://support.google.com/google-ads/answer/10000067"]
summary: "Consent Mode przekazuje Google status zgody (ad_storage, analytics_storage; v2 dodaje wymagane w EOG ad_user_data i ad_personalization — bez nich brak remarketingu/personalizacji). Basic blokuje tagi do interakcji z bannerem i daje tylko general model; advanced wysyła cookieless pings przy denied i daje advertiser-specific model, o ile przekroczono próg zbierania danych. Impact results po min. 7 pełnych dniach; Consent Mode nie zastępuje bannera CMP."
---

# Consent Mode (v2) — tryb zgody Google

Źródło oficjalne: https://support.google.com/google-ads/answer/10000067 („About consent mode", Google Ads Help). Tier 1.

## Basic vs Advanced — porównanie

| Cecha | Basic consent mode | Advanced consent mode |
|---|---|---|
| Ładowanie tagów | Zablokowane do interakcji z bannerem | Ładują się od razu (defaults = denied, chyba że skonfigurowano inaczej) |
| Transmisja danych przed zgodą | Żadna — nawet status zgody nie idzie | Przy denied: stan zgody + **cookieless pings**; przy granted: cookies + pełne dane |
| Stany zgody | Ustawiane po interakcji usera | Defaults denied, aktualizowane wyborem usera |
| Conversion modeling | **General model** (mniej dokładny) | **Advertiser-specific model** (dokładniejszy) |

- Wynik uplift (impact results) dostępny w Google Ads/GA dopiero po **min. 7 pełnych dniach** działania i po przekroczeniu progu danych.

## Czym jest (i czym NIE jest)

- Consent Mode komunikuje Google status zgody usera na cookie/identyfikatory. Tagi dostosowują zachowanie i respektują wybory.
- **Consent Mode NIE dostarcza bannera/widgetu zgody** — współpracuje z Twoim bannerem (CMP), by odebrać zgodę. Banner/CMP trzeba mieć osobno.
- Dynamicznie dostosowuje Analytics, Ads i third-party tagi, które tworzą/czytają cookies.
- `ad_storage` = użycie cookies i ID Google Ads; ustawienie default na `denied` blokuje ich użycie w Google Ads.

## Kluczowe sygnały zgody

- Podstawowe stany: **`ad_storage`** i **`analytics_storage`**. (Consent Mode v2 dodaje wymagane dla EOG: **`ad_user_data`** i **`ad_personalization`** — bez nich remarketing/audience i personalizacja są ograniczone.)
- Cookieless pings (przy denied) mogą zawierać: timestamp, user agent (web), referrer; oraz coarse info: czy URL zawierał ad-click info (GCLID/DCLID), boolean stanu zgody, losowa liczba per page load, ID platformy zgody (Developer ID). Bez tożsamości usera.

## Modelowanie (dlaczego to ważne)

- Przy denied Google używa pingów do **modelowania** brakujących metryk, żeby wypełnić lukę pomiarową.
- Warunek modelowania: tagi muszą przekroczyć **próg zbierania danych** (data collection threshold) — inaczej brak modelu.
- Advanced daje model advertiser-specific (lepszy) vs basic (general).

## Wymóg dla EOG (EEA/Switzerland/UK)

- Dokumentacja wprost wskazuje **regionalne różnice zachowania dla EEA, Switzerland i UK** (w advanced default „consented unless specific choice made" NIE stosuje się tam automatycznie).
- Praktyczny wniosek: dla ruchu z EOG Consent Mode v2 z sygnałami `ad_user_data`/`ad_personalization` jest warunkiem korzystania z danych do personalizacji/remarketingu i mierzenia konwersji.

## Tagi z wbudowaną obsługą

Google tag, Google Analytics, Google Ads (conversion tracking + data segments), Floodlight, Conversion Linker. Tagi bez wbudowanego checku → dodaj Consent Settings w Tag Manager (Advanced > Consent Settings).

## Implikacje dla diagnostyki (google-ads-baby)

- Diagnozując „spadek konwersji"/„not set"/rozjazd z GA4 dla ruchu EOG: sprawdź czy Consent Mode wdrożony (basic vs advanced) i czy przekazywane są `ad_user_data`/`ad_personalization`.
- Brak Consent Mode + banner blokujący tagi = utrata sygnału i słabszy Smart Bidding; advanced + próg danych → modelowanie łata lukę.
- To temat poza Google Ads API (wdrożenie na stronie/GTM) — google-ads-baby może diagnozować skutki, nie konfigurować Consent Mode.
