---
keywords: [google ads, konwersje, ga4, google tag, enhanced conversions, pomiar, atrybucja]
applies_to: [google-ads, analytics]
task_type: [implementation, audit, troubleshooting]
trigger_stage: [prompt]
priority: 5
inject: summary
related: [google-ads/account-hygiene-diagnostics.md, google-ads/bidding-strategies.md, google-ads/google-ads-api-gotchas.md]
source: ["https://support.google.com/google-ads/answer/16560108", "https://support.google.com/google-ads/answer/11461796", "https://support.google.com/google-ads/answer/13262500", "https://support.google.com/google-ads/answer/7521212"]
summary: "Pomiar jest wejściem do stawek: wybierz jednoznaczne cele biznesowe, ustaw działania główne i dodatkowe, przekaż poprawne wartości i testuj tagi. Google Ads oraz GA4 mogą raportować inaczej z powodu atrybucji i zakresu; różnica nie oznacza automatycznie błędu."
---

# Konwersje, Analytics i tracking

## Projekt pomiaru

1. Zdefiniuj zdarzenie biznesowe, jego właściciela, źródło prawdy, wartość, walutę i zasadę deduplikacji.
2. Wybierz źródło działania: tag Google Ads, zdarzenie z połączonej usługi Google Analytics albo import danych offline. Unikaj równoległego użycia duplikujących się działań jako głównych.
3. Ustaw liczenie, okno konwersji i cele domyślne konta zgodnie z procesem zakupowym.

**Fakt platformowy:** działanie główne trafia do kolumny „Konwersje” i może sterować stawkami, jeśli kampania używa zawierającego je celu. Działanie dodatkowe jest zwykle obserwacyjne w „Wszystkie konwersje”; niestandardowy cel może stanowić wyjątek.

## Implementacja i test

- Google tag powinien działać w wymaganym zakresie witryny, a zdarzenie konwersji tylko w prawidłowym momencie.
- Przekazuj dynamiczną wartość i identyfikator transakcji, gdy model biznesowy tego wymaga.
- Testuj ścieżki na różnych urządzeniach i wariantach zgody. Sprawdź diagnostykę, Tag Assistant, żądania sieciowe i późniejszy zapis w interfejsie.
- Porównuj Ads, GA4 i backend na spójnym zakresie dat, walucie i definicji zdarzenia, z uwzględnieniem opóźnienia oraz modelu atrybucji.

## Ulepszone konwersje

**Fakt platformowy:** ulepszone konwersje uzupełniają istniejący tag zaszyfrowanymi funkcją SHA-256 danymi własnymi, aby poprawić dopasowanie. Obowiązują zasady danych klientów Google.

**Rekomendacja:** wdrażaj je dopiero po potwierdzeniu podstawy prawnej, zgód i jakości normalizacji danych. Nie wysyłaj pól niepotrzebnych i nie traktuj haszowania jako zastępstwa obowiązków prywatności.

## Alarmy

Brak nowych konwersji, nagły skok, stałe wartości, duplikaty, status „wymaga uwagi” lub rozjazd identyfikatorów produktu wymagają diagnozy przed zmianą stawek.
