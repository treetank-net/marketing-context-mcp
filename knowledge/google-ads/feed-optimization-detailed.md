---
keywords: [feed produktowy, optymalizacja feedu, Merchant Center, tytul produktu, opis produktu, GTIN, obrazy]
applies_to: [google-ads]
task_type: [reference]
intent: optimize_merchant_feed
trigger_stage: [prompt]
priority: 3
inject: summary
related: [google-ads/merchant-center-feed.md, google-ads/product-bucketing-detailed.md, google-ads/google-ads-feed-health.md]
source: ["https://support.google.com/merchants/answer/7052112?hl=en", "https://support.google.com/merchants/answer/16488800?hl=en", "https://support.google.com/merchants/answer/12476548?hl=en-GB"]
summary: "Szczegółowy, oparty na specyfikacji Google proces poprawy danych produktowych: najpierw zgodność i spójność ze sklepem, potem kompletność identyfikatorów, treść i obrazy, a na końcu pomiar wpływu zmian na porównywalnych grupach produktów."
---

# Szczegółowa optymalizacja feedu produktowego

Dobry feed jest przede wszystkim dokładnym opisem oferty. Optymalizacja nie może maskować błędnej ceny,
dostępności ani strony docelowej. Najpierw usuń przyczyny odrzuceń i niespójności, dopiero potem poprawiaj
jakość informacji używanych przez Google do dopasowania produktu.

## Kolejność pracy

1. W Merchant Center otwórz **Products → Needs attention**. Rozdziel problemy konta od problemów
   pojedynczych produktów i zapisz liczbę ofert dotkniętych każdym problemem.
2. Sprawdź źródło danych. Poprawiaj atrybut w systemie, który jest jego właścicielem; ręczna korekta w
   Merchant Center może zostać nadpisana przez następne odświeżenie źródła.
3. Potwierdź zgodność `price` i `availability` z landing page, checkoutem i danymi strukturalnymi.
   Sprawdź też działanie `link` oraz to, czy `id` pozostaje stabilny dla tego samego produktu.
4. Uzupełnij identyfikatory. Przekazuj prawidłowy `gtin`, gdy producent go nadał, oraz zgodny `brand`;
   nie twórz sztucznych identyfikatorów. Dla produktów bez GTIN stosuj wymagania specyfikacji właściwe
   dla danego typu produktu.
5. Popraw `title` tak, by jednoznacznie nazywał oferowany wariant. Używaj faktycznych cech produktu,
   bez haseł promocyjnych, nadmiaru kapitalików i informacji sprzecznych ze stroną.
6. W `description` umieść wyłącznie istotne, prawdziwe cechy: zastosowanie, materiał, rozmiar,
   kompatybilność i cechy wizualne. Nie kopiuj tekstu sprzedażowego, który nie opisuje produktu.
7. Zweryfikuj `image_link` i obrazy dodatkowe. Główne zdjęcie powinno pokazywać właściwy produkt bez
   nakładek promocyjnych, ramek, znaków wodnych ani zastępczych grafik. URL obrazu utrzymuj stabilny,
   jeśli sam obraz się nie zmienił.
8. Dla wariantów utrzymuj spójne `item_group_id` i właściwe atrybuty różnicujące, np. kolor lub rozmiar.
   Każdy wariant musi prowadzić do odpowiadającej mu oferty i obrazu.
9. Po ponownym przetworzeniu danych sprawdź status i widoczność produktów. Status „approved” i
   widoczność to odrębne informacje; brak emisji wymaga sprawdzenia obu.

## Pomiar zmian

- Zapisz hipotezę, zakres identyfikatorów produktów, datę i dokładnie zmienione atrybuty.
- Nie zmieniaj równocześnie treści, ceny, kampanii i stawek, jeśli chcesz przypisać efekt jednej zmianie.
- Porównuj grupy o podobnym asortymencie i sezonowości; przy istotnej decyzji użyj dostępnego w Google Ads
  eksperymentu zamiast arbitralnego „przed i po”.
- Oceniaj nie tylko kliknięcia, lecz także zatwierdzenie i widoczność ofert, koszt, konwersje oraz wartość
  konwersji zgodnie z celem biznesowym.

Nie stosuj uniwersalnych szablonów kolejności słów ani progów wyniku. Forma tytułu i zakres atrybutów
zależą od produktu, rynku i wymagań aktualnej specyfikacji Merchant Center.
