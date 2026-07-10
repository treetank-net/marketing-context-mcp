---
keywords: [kwartalny audyt, quarterly audit, struktura konta, higiena, always never, konwencje nazewnicze, przeglad strategiczny, zduplikowane kampanie]
applies_to: [google-ads]
task_type: [workflow]
intent: google_ads_quarterly_audit
default_schedule: quarterly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [google-ads/always-never-checklist.md, google-ads/account-hygiene-diagnostics.md, general/account-management-philosophy.md, general/task-catalog.md]
source: ["knowledge/google-ads/always-never-checklist.md", "knowledge/google-ads/account-hygiene-diagnostics.md"]
summary: "Kwartalny audyt strategiczny całego konta Google Ads — szerszy przegląd niż cotygodniowy daily-check. Przechodzi listę always/never, weryfikuje strukturę kampanii (duplikaty, kanibalizacja, konwencje nazewnicze), 11-punktową higienę konta i zgodność ze strategią klienta. Findings trafiają do append_task (od higienicznych po strukturalne), duże zmiany strukturalne planowane, nie ad-hoc; zamknięcie przez append_review."
---

# Workflow: Kwartalny audyt strategiczny konta Google Ads

Kwartalny audyt to szeroki przegląd całego konta — struktury, higieny i spójności z zasadami
`always`/`never`. To inny poziom niż cotygodniowy daily-check: tam patrzysz na bieżące wydatki i
alarmy, tutaj cofasz się i oceniasz konto jako całość. Cel: wychwycić dryf strukturalny, długi
techniczny i rozjazd między konfiguracją a strategią klienta, który w codziennym rytmie umyka.

Uruchamiaj raz na kwartał (`default_schedule: quarterly`). Wszystkie mutacje wynikające z audytu
przechodzą wyłącznie przez ścieżkę `prepare_*` + safe-word — audyt sam z siebie nic nie zmienia,
tylko produkuje listę zadań.

## Kroki

1. **Przejdź listę always/never** (`always-never-checklist.md`). Dla każdej pozycji "Zawsze"
   sprawdź, czy konto ją spełnia; dla każdej "Nigdy" — czy nie została naruszona. Szczególnie:
   Search bez sieci reklamowej, geo presence (nie presence_or_interest), brand wykluczony i
   ≤10% budżetu, PMax e-commerce feed-only, RSA min. 3/grupę. Naruszenia "Nigdy" (np.
   account-level brand negative w PMax, Maximize Clicks w kampanii konwersyjnej) mają najwyższy
   priorytet.

2. **Zweryfikuj strukturę kampanii i grup.** Szukaj duplikatów kampanii, kanibalizacji (nakładające
   się keywordy między kampaniami, PMax vs Search — patrz pkt 10 checklisty higieny), oraz zgodności
   z konwencjami nazewniczymi klienta. Niespójne nazwy utrudniają każdą przyszłą analizę i raport.

3. **Przejdź higienę konta** — 11-punktowa checklista z `account-hygiene-diagnostics.md`
   ("kampania nie wyświetla się") plus rutyna higieniczna: auto-apply recommendations off
   (Google włącza po cichu — sprawdź ponowne włączenie), dismiss recommendations, audyt AI Max,
   change history (flaguj `user_email = GOOGLE_INTERNAL`), audyt bidding strategy, przegląd
   negatywów i placementów. Pamiętaj: aktywna kampania = `ENABLED` **i** `serving_status = SERVING`.
   Optimization Score ignoruj całkowicie.

4. **Sprawdź zgodność ze strategią klienta** (`account-management-philosophy.md`). Czy struktura
   konta i alokacja budżetu nadal odpowiadają celom klienta i przyjętej filozofii prowadzenia konta?

5. **Przejrzyj stare wstrzymane kampanie i nieużywane assety.** Kampanie zapauzowane po sezonie,
   martwe grupy reklam, osierocone zasoby kreatywne — kandydaci do uporządkowania lub archiwizacji.

6. **Sprawdź konfigurację konwersji i atrybucji.** Czy zdarzenia konwersji, ich wartości (uwaga:
   nigdy wartości dla lead-gen) i model atrybucji dalej pasują do aktualnych celów kampanii?

## Wynik

- Każde znalezisko zapisz przez `append_task` — od najprostszych higienicznych (szybkie do
  naprawy) po strukturalne (wymagające planu). Uszereguj listę: najpierw naruszenia "Nigdy" i
  higiena, potem struktura.
- **Duże zmiany strukturalne planuj, nie rób ad-hoc.** Restrukturyzacja kampanii, zmiana strategii
  bidowania czy przebudowa nazewnictwa to osobne, zaplanowane zadania z monitoringiem — nie
  jednorazowe cięcia w trakcie audytu.
- Zamknij audyt wpisem `append_review` z podsumowaniem stanu konta i listą wygenerowanych zadań.
- Mutacje wyłącznie przez `prepare_*` + safe-word. Audyt jest read-only; wszelkie zmiany wykonuje
  się później, świadomie, przez zatwierdzoną ścieżkę mutacji.
