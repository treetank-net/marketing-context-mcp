---
keywords: [reporting, dashboard, looker studio, odswiezenie raportu, data source, blended, sanity check, raportowanie]
applies_to: [analytics, google-ads, meta-ads]
task_type: [workflow]
intent: reporting_refresh
default_schedule: weekly
trigger_stage: [prompt]
priority: 3
inject: summary
related: [reporting/looker-studio.md, reporting/monthly-client-review.md, general/benchmarks-index.md, general/task-catalog.md]
source: ["knowledge/reporting/looker-studio.md"]
summary: "Rutyna utrzymania raportowania (Looker Studio): sprawdź że data source'y łączą się i nie mają błędów, że okna dat i filtry są aktualne, że metryki blended (koszt/przychód cross-platform) się zgadzają z platformami, i że nie ma pustych/zepsutych widgetów przed wysłaniem klientowi. To higiena raportu, odrębna od analitycznego monthly-client-review — dba o to, żeby deliverable był poprawny technicznie."
---

# Workflow: Reporting Refresh (dashboardy)

Higiena raportowania — żeby dashboard, który widzi klient, był aktualny i
poprawny. Odrębne od `reporting/monthly-client-review.md` (to jest analiza +
deliverable; tu chodzi o techniczną sprawność raportu).

## Kroki

1. **Data source'y** (`reporting/looker-studio.md`): każde źródło (Google Ads,
   Meta, GA4) łączy się bez błędu autoryzacji; brak „configuration error" na
   wykresach; świeżość danych zgodna z oczekiwaniem.
2. **Okna dat i filtry**: zakresy dat aktualne (nie zamrożone na starym miesiącu),
   filtry kont/kampanii nie gubią nowych bytów, ignorowane kampanie zgodne z
   `procedures/monthly.md`.
3. **Blended metrics**: koszt/przychód/ROAS „blended" (cross-platform) zgadzają się
   z sumą z platform w granicach zaokrągleń; waluty spójne.
4. **Sanity vs benchmarki**: kluczowe metryki w rozsądnych widełkach
   (`general/benchmarks-index.md`); wartość odstająca = albo insight, albo błąd
   raportu — rozróżnij przed wysyłką.
5. **Widgety**: brak pustych/zepsutych elementów, tabele się renderują, sortowanie
   sensowne.

## Wynik

- Błędy techniczne raportu → `append_task` (naprawa źródła/widgetu).
- Anomalie w danych (nie błędy raportu) → przekaż do właściwego przeglądu
  platformowego jako finding.
- Nie wysyłaj klientowi raportu z „configuration error" na wykresie — to psuje
  zaufanie bardziej niż słabszy wynik.
