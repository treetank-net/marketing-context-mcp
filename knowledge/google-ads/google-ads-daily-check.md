---
keywords: [Google Ads daily check, codzienna kontrola, monitoring kampanii, diagnostyka, anomalie, historia zmian]
applies_to: [google-ads]
task_type: [workflow]
intent: google_ads_daily_check
default_schedule: daily
trigger_stage: [prompt]
priority: 4
inject: summary
related: [google-ads/google-ads-monthly-review.md, google-ads/google-ads-feed-health.md, google-ads/google-ads-quarterly-audit.md, google-ads/zz-google-ads-baby-implications.md]
source: ["https://support.google.com/google-ads/answer/12327514?hl=en", "https://support.google.com/google-ads/answer/19888?hl=en", "https://support.google.com/google-ads/answer/7321090?hl=en", "knowledge/google-ads/google-ads-feed-health.md", "src/tools/tasks.ts", "src/tools/write.ts"]
summary: "Codzienny, read-only przegląd wyjątków: dostęp i płatności, serving i diagnostyka, nagłe odchylenia kosztu oraz wyników, nieoczekiwane zmiany i problemy feedu. Wynik zapisuje fakty, priorytet i kolejne zadanie; nie optymalizuje kampanii na podstawie jednego dnia."
---

# Workflow: codzienna kontrola Google Ads

Codzienna kontrola wykrywa awarie i anomalie. Nie służy do oceniania strategii na podstawie krótkiego okna
ani do seryjnego wdrażania rekomendacji.

## Kroki

1. **Zakres i porównanie.** Potwierdź konto, strefę czasową i świeżość danych. Porównaj bieżący okres z
   sensownym okresem odniesienia, uwzględniając dzień tygodnia, sezonowość i opóźnienie konwersji.
2. **Blokery konta.** Sprawdź dostęp, rozliczenia, komunikaty zasad i inne problemy mogące zatrzymać emisję.
3. **Serving.** Na Overview i w campaign diagnostics wyszukaj kampanie, które przestały emitować lub mają
   ograniczenia. Otwórz przyczynę; sam status kampanii nie wyjaśnia braku ruchu.
4. **Koszt i wynik.** Znajdź nagłe odchylenia wydatku, wyświetleń, kliknięć, konwersji i wartości konwersji.
   Rozdziel zmianę popytu od zmiany konfiguracji, trackingu, strony i feedu.
5. **Historia zmian.** Sprawdź ostatnie zmiany według użytkownika, narzędzia i typu. Zestaw je z osią wyników;
   korelacja pomaga znaleźć hipotezę, ale nie dowodzi przyczyny.
6. **E-commerce.** W Merchant Center sprawdź problemy konta, nagły spadek widoczności i grupy produktów w
   Needs attention.
7. **Rejestr.** Dla każdego wyjątku zapisz dowód, dotknięty zakres, pilność, właściciela i następny krok.

## Decyzja

- Awaria pomiaru, płatności, strony, zasad lub szeroki brak emisji: eskaluj natychmiast.
- Istotna anomalia bez rozpoznanej przyczyny: utwórz zadanie diagnostyczne przez `append_task`.
- Brak problemów: zapisz krótkie „bez wyjątków” w `append_review`; dla zadania cyklicznego użyj
  `mark_task_run`.
- Każda zmiana na platformie wymaga osobnej analizy i właściwej ścieżki przygotowania oraz potwierdzenia.
  Daily check pozostaje read-only.
