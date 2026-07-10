---
keywords: [monthly review, raport miesieczny, client review, decyzje, trend, atrybucja]
applies_to: [reporting, analytics, google-ads, meta-ads]
task_type: [workflow, review]
trigger_stage: [prompt, review]
priority: 5
inject: summary
related: [reporting/looker-studio.md, reporting/reporting-refresh.md, analytics/tracking-consent-health.md, general/task-operating-model.md]
source: ["https://support.google.com/analytics/answer/13818312", "https://support.google.com/analytics/answer/10596641", "https://support.google.com/analytics/answer/14731736", "knowledge/general/task-operating-model.md"]
summary: "Miesięczny przegląd klienta zaczyna się od wiarygodności danych i celu biznesowego, następnie wyjaśnia zmianę wyniku, wkład kanałów, ryzyka i decyzje. Porównania muszą zachowywać zakres, strefę czasową, walutę, zakres metryki i model atrybucji. Wynikiem jest krótka narracja oraz konkretne zadania z właścicielem, terminem i źródłem, nie katalog wykresów."
---

# Miesięczny przegląd klienta

## Cel spotkania

Przegląd ma doprowadzić do wspólnego rozumienia wyniku i następnych decyzji. Nie jest prezentacją wszystkich dostępnych metryk. Każdy wykres lub tabela powinny wspierać tezę, ujawniać ryzyko albo prowadzić do działania.

## Przygotowanie danych

1. Potwierdź cel biznesowy, okres, walutę, strefę czasową i zakres kont.
2. Przeprowadź kontrolę trackingu oraz zgód przed interpretacją efektywności. Oznacz przerwy, zmiany definicji i dane modelowane.
3. Zamknij okres raportowy zgodnie z rytmem przetwarzania źródeł. Nie mieszaj niepełnego bieżącego okresu z pełnym okresem porównawczym bez wyraźnego oznaczenia.
4. Ustal właściwe źródło prawdy dla wydatku, przychodu, leadów i jakości sprzedaży.
5. Porównaj sumy kontrolne raportu ze źródłami platformowymi i systemem biznesowym.

GA4 rozróżnia między innymi pozyskanie użytkowników od pozyskania ruchu: pierwsze dotyczy źródła nowych użytkowników, drugie źródła sesji. Zakresy tych raportów są różne, więc podobnie nazwanych wartości nie należy zestawiać bez sprawdzenia wymiaru. W sekcji Advertising raporty ścieżek i porównania modeli odpowiadają na pytania atrybucyjne; nie są tym samym co raport sesyjny.

## Struktura analizy

### Wynik i kontekst

Zacznij od wyniku biznesowego oraz zmiany względem uzgodnionego punktu odniesienia. Dodaj kontekst: sezon, promocję, zmianę oferty, dostępność produktu, pracę sprzedaży lub modyfikację pomiaru. Nie przypisuj całej zmiany reklamie, jeśli równocześnie zmieniły się inne elementy.

### Wkład kanałów

Pokaż koszt, wynik i jakość w ujęciu zgodnym z rolą kanału. Oddziel dane raportowane przez platformę od wyniku obserwowanego w analityce i backendzie. Wyjaśnij różnice w zakresie, oknie i modelu atrybucji zamiast wymuszać sztuczną zgodność.

### Diagnoza

Przejdź od całości do elementów, które mogły wpłynąć na wynik: kampanii, odbiorców, kreacji, zapytań, produktów, urządzeń lub stron docelowych. Segmentuj tylko wtedy, gdy przekrój może zmienić decyzję. Małe próbki i niepełne dane oznacz jako niepewne.

### Decyzje

Dla każdej rekomendacji zapisz obserwację, interpretację, działanie, ryzyko i sposób oceny. Rozdziel:

- działania możliwe do wykonania po zatwierdzeniu;
- pytania wymagające decyzji klienta;
- problemy techniczne lub pomiarowe;
- hipotezy wymagające testu;
- elementy do obserwacji bez natychmiastowej zmiany.

## Przebieg spotkania

Najpierw potwierdź, czy cel i ograniczenia nadal są aktualne. Następnie przedstaw krótką narrację o wyniku, omów największe ryzyka i przejdź do decyzji. Na końcu odczytaj listę ustaleń: działanie, właściciel, termin i zależność. Brak zgody na zmianę jest wynikiem spotkania, który również należy zapisać.

## Zapis po przeglądzie

Raport powinien zawierać zakres danych, zastrzeżenia, najważniejsze wnioski oraz decyzje. Konkretne follow-upy utwórz jako zadania ze źródłem `review`; nie ukrywaj ich wyłącznie w slajdzie lub komentarzu. Jeżeli przegląd ujawnił niewiarygodny pomiar, zadanie naprawcze ma pierwszeństwo przed optymalizacją opartą na tych danych.

W kolejnym miesiącu zacznij od wcześniejszych decyzji: sprawdź, co wykonano, jaki był wynik i czy hipoteza nadal obowiązuje. Dzięki temu raportowanie tworzy ciąg uczenia się, a nie serię niezależnych podsumowań.
