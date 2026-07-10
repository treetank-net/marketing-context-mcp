---
keywords: [Google Ads monthly review, miesieczny przeglad, analiza wynikow, zmiany konta, eksperymenty, plan dzialan]
applies_to: [google-ads]
task_type: [workflow]
intent: google_ads_monthly_review
default_schedule: monthly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [google-ads/google-ads-daily-check.md, google-ads/product-bucketing-detailed.md, google-ads/google-ads-quarterly-audit.md]
source: ["https://support.google.com/google-ads/answer/19888?hl=en", "https://support.google.com/google-ads/answer/7321090?hl=en", "https://support.google.com/google-ads/answer/7281575?hl=en", "knowledge/google-ads/google-ads-daily-check.md", "src/tools/tasks.ts", "src/tools/write.ts"]
summary: "Miesięczny przegląd łączy cel biznesowy, jakość pomiaru, wyniki w porównywalnych okresach, historię zmian, strukturę i eksperymenty. Kończy się oddzieleniem faktów od hipotez, krótką listą priorytetów i trwałym zapisem review."
---

# Workflow: miesięczny przegląd Google Ads

## 1. Ustal kontekst

Potwierdź cel biznesowy, główne konwersje, model wartości, budżet i ważne zdarzenia miesiąca. Zaznacz zmiany
cen, promocje, braki magazynowe, sezonowość oraz opóźnienie raportowania. Bez tego porównanie wskaźników
może prowadzić do błędnej diagnozy.

## 2. Zweryfikuj wiarygodność danych

Sprawdź ciągłość pomiaru konwersji, duplikację, nagłe zmiany wolumenu i zgodność celu kampanii z tym, co
raportujesz. Dla e-commerce sprawdź spójność wartości oraz zdrowie katalogu Merchant Center. Jeśli dane są
niewiarygodne, oznacz ograniczenie i nie wydawaj kategorycznych rekomendacji optymalizacyjnych.

## 3. Przeczytaj wynik od ogółu do szczegółu

- Porównaj koszt, wolumen i wartość wyniku z poprzednim porównywalnym okresem oraz planem.
- Rozbij wynik na kampanie i typy kampanii, następnie na istotne segmenty; nie sumuj różnych celów tak,
  jakby były równoważne.
- Oddziel zmianę efektywności od zmiany skali. Wskaż, które elementy odpowiadają za największą część zmiany.
- W e-commerce przejrzyj kategorie lub segmenty produktów, lecz nie twórz progów klasyfikacji bez oparcia
  w ekonomice klienta i wystarczających danych.

## 4. Połącz wynik ze zmianami

W Change history filtruj po użytkowniku, narzędziu, kampanii i typie zmiany. Zaznacz eksperymenty, zmiany
budżetu, stawek, targetowania, reklam i statusów. Traktuj zbieżność czasową jako hipotezę do sprawdzenia,
nie automatyczny dowód wpływu.

## 5. Oceń strukturę i testy

Sprawdź, czy struktura nadal odpowiada celom i czy nie rozprasza danych bez potrzeby. Dla aktywnych
eksperymentów porównaj wynik z wcześniej zapisaną hipotezą i miernikiem sukcesu. Nie zmieniaj kampanii
bazowej w sposób, który uniemożliwi interpretację testu.

## 6. Zamknij przegląd

Podsumowanie przez `append_review` powinno zawierać: kontekst, wiarygodność danych, najważniejsze fakty,
hipotezy, ryzyka oraz decyzje. Ogranicz plan do priorytetowych działań; każde zapisz przez `append_task` z
powodem, zakresem i sugerowanym workflow. Dla zadania cyklicznego na końcu użyj `mark_task_run`.

Przegląd sam nie autoryzuje mutacji. Zmiany na platformie wykonuje się osobno, po przygotowaniu podglądu i
uzyskaniu wymaganego potwierdzenia.
