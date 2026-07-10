---
keywords: [Merchant Center, feed, dane produktowe, odrzucenia produktow, Needs attention, cena, dostepnosc]
applies_to: [google-ads]
task_type: [reference]
intent: merchant_center_feed_health
trigger_stage: [prompt]
priority: 4
inject: summary
related: [google-ads/feed-optimization-detailed.md, google-ads/google-ads-feed-health.md, google-ads/product-bucketing.md]
source: ["https://support.google.com/merchants/answer/7052112?hl=en", "https://support.google.com/merchants/answer/16488801?hl=en", "https://support.google.com/merchants/answer/12476548?hl=en-GB"]
summary: "Podstawy zdrowego feedu Merchant Center: zgodność wymaganych atrybutów ze sklepem, rozróżnienie statusu i widoczności, triage zakładki Needs attention oraz bezpieczna korekta danych w źródle właścicielskim."
---

# Merchant Center: fundamenty feedu produktowego

Feed łączy katalog sklepu z reklamami produktowymi i bezpłatnymi informacjami. Jego rolą jest przekazanie
Google aktualnych, jednoznacznych danych, a nie tworzenie alternatywnej wersji oferty.

## Minimalny kontrakt danych

- `id` identyfikuje produkt stabilnie; nie używaj ponownie identyfikatora dla innego produktu.
- `title`, `description`, `link` i `image_link` mają opisywać dokładnie ten produkt i wariant, który użytkownik
  zobaczy na stronie.
- `price` wraz z walutą oraz `availability` muszą zgadzać się z landing page, checkoutem i danymi
  strukturalnymi.
- `brand`, `gtin` i `mpn` przekazuj zgodnie z tym, co nadał producent i z warunkami specyfikacji. Nie
  generuj wartości zastępczych tylko po to, by wypełnić pole.
- Atrybuty wariantu i `item_group_id` powinny konsekwentnie grupować wersje jednego produktu.

Wymagalność części pól zależy od produktu, programu i kraju. Przy sporze źródłem prawdy jest bieżąca
specyfikacja danych produktowych Google, nie lokalna checklista.

## Triage w Merchant Center

1. Sprawdź problemy konta oraz produkty w **Needs attention**. Wyłącz filtr priorytetowych poprawek, jeśli
   potrzebujesz pełnego obrazu problemów.
2. Grupuj po przyczynie i wpływie, nie tylko po liczbie komunikatów. Najpierw obsłuż problemy blokujące
   konto lub dużą część katalogu, potem błędy pojedynczych atrybutów.
3. W tabeli produktów sprawdź osobno **Status** i **Visibility**. Produkt zatwierdzony może nadal nie być
   widoczny z innego powodu.
4. Otwórz przykładowe produkty z każdej grupy problemu i porównaj wartości ze źródłem oraz stroną sklepu.
5. Popraw dane w ich źródle właścicielskim, uruchom aktualizację, poczekaj na przetworzenie i sprawdź wynik.
6. Proś o review dopiero wtedy, gdy problem został faktycznie usunięty albo masz uzasadnione podstawy, by
   zakwestionować diagnozę.

## Zasady operacyjne

- Monitoruj świeżość źródeł i nagłe zmiany liczby produktów widocznych, odrzuconych lub oczekujących.
- Utrzymuj mapę: atrybut → system właścicielski → osoba odpowiedzialna → częstotliwość aktualizacji.
- Zmiany masowe zaczynaj od małej, odwracalnej partii i zapisuj listę `id` oraz wersję źródła.
- Nie utożsamiaj poprawy feedu z podnoszeniem stawek. Jakość danych i decyzje mediowe oceniaj osobno.
