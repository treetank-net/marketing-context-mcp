---
keywords: [google ads api, oauth, developer token, gaql, quota, retry, partial failure, versioning]
applies_to: [google-ads-api]
task_type: [implementation, troubleshooting]
trigger_stage: [prompt]
priority: 4
inject: summary
related: [google-ads/keyword-planner-api.md, google-ads/conversions-analytics-tracking.md, google-ads/account-hygiene-diagnostics.md]
source: ["https://developers.google.com/google-ads/api/docs/common-errors", "https://developers.google.com/google-ads/api/docs/best-practices/quotas", "https://developers.google.com/google-ads/api/docs/concepts/versioning"]
summary: "Najczęstsze pułapki Google Ads API dotyczą kontekstu klienta, OAuth i tokena deweloperskiego, wersji, limitów, nazw zasobów oraz niebezpiecznych ponowień mutacji. Loguj request-id i szczegóły GoogleAdsFailure, waliduj przed zapisem i projektuj operacje idempotentnie."
---

# Google Ads API — pułapki operacyjne

## Tożsamość i kontekst

- `customer_id` określa konto operacyjne; `login-customer-id` wskazuje konto menedżera użyte do dostępu. Numery w nagłówkach podaje się bez myślników.
- OAuth identyfikuje użytkownika, a developer token aplikację. Użytkownik musi mieć dostęp do właściwego klienta.
- Nie łącz tokena deweloperskiego z przypadkowym projektem Google Cloud. Google opisuje trwałe powiązanie projektu po pierwszym użyciu tokena.

## Zapytania i mutacje

1. Pobieraj istniejące nazwy zasobów zamiast składać je ręcznie.
2. W GAQL wybieraj tylko potrzebne pola i kontroluj segmentację; nadmierny wynik może prowadzić do timeoutu.
3. Przed mutacją sprawdź wymagane pola, limity długości, stan zasobu i duplikaty.
4. Użyj `validate_only`, gdy chcesz sprawdzić poprawność bez zapisu. `partial_failure` stosuj tylko wtedy, gdy akceptujesz częściowy sukces i potrafisz powiązać błędy z operacjami.

**Rekomendacja:** mutacje projektuj idempotentnie: nadaj własny klucz operacji, najpierw odczytaj stan i zapisuj wynik każdej operacji. Nie ponawiaj „w ciemno” po niejednoznacznym błędzie sieciowym.

## Błędy, limity i retry

**Fakt platformowy:** limity zależą od poziomu dostępu i usługi. `RESOURCE_EXHAUSTED` wymaga ograniczenia częstotliwości lub łączenia operacji. Błędy przejściowe można ponawiać z exponential backoff; błędy walidacji i autoryzacji wymagają poprawy żądania lub uprawnień.

Loguj bez sekretów: czas, metodę, klienta, wersję API, request-id, kod i `field_path`. Nie loguj access/refresh tokenów ani danych użytkowników.

## Wersje

Google okresowo wycofuje wersje API. Przypnij wspieraną wersję, śledź harmonogram wycofań i testuj migrację przed terminem. Nie zakładaj zgodności pól między wersjami tylko dlatego, że kompiluje się klient SDK.
