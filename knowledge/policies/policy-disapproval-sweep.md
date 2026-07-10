---
keywords: [policy, polityki reklamowe, disapproval, odrzucenie reklamy, wstrzymanie, appeal, odwolanie, compliance, zgodnosc, konto ograniczone]
applies_to: [google-ads, meta-ads]
task_type: [workflow]
intent: policy_disapproval_sweep
default_schedule: weekly
trigger_stage: [prompt]
priority: 4
inject: summary
related: [policies/google-ads-policies.md, policies/meta-advertising-standards.md, general/task-catalog.md]
source: ["knowledge/policies/google-ads-policies.md", "knowledge/policies/meta-advertising-standards.md"]
summary: "Cotygodniowy sweep odrzuceń i ograniczeń reklam oraz statusu kont na Google Ads i Meta. Przejrzyj reklamy/assety/rozszerzenia disapproved/limited, zmapuj powód na kategorię polityki (prohibited / restricted / editorial u Google; prohibited / restricted / DSA u Meta) i zdecyduj: poprawa kreacji vs appeal. Sprawdź ograniczenia konta i weryfikacje domeny/biznesu — powtarzalne naruszenia grożą suspension (Google strike system) lub restrykcją Business Account. Wynik: poprawki/appeale → append_task wg ryzyka dla dostarczania; mutacje przez prepare_* + potwierdzenie; append_review."
---

# Workflow: Policy Disapproval Sweep

Procedura (nie artykuł referencyjny): cotygodniowy przegląd odrzuceń,
ograniczeń emisji i statusu kont na **obu** platformach. Cel — złapać
disapprovale zanim wytną dostarczanie kluczowych reklam, i wychwycić
ograniczenia konta zanim eskalują do zawieszenia. Kanon polityk, na który
mapujesz powody, siedzi w `policies/google-ads-policies.md` i
`policies/meta-advertising-standards.md`.

## Zasady (najpierw, inaczej sweep robi więcej szkody niż pożytku)

- **Nie składaj masowych appeali bez poprawy przyczyny.** Appeal reklamy, którą
  faktycznie łamie politykę, to strata review budgetu i sygnał złej wiary.
  Najpierw ustal, czy powód jest naprawialny w kreacji, czy to nasz błąd oceny.
- **Powtarzalne naruszenia grożą zawieszeniem konta** — u Google działa strike
  system, u Meta powtórki skutkują restrykcją Business Account/assetu. Traktuj
  takie przypadki priorytetowo, ponad pojedyncze odrzucenia.
- U Meta pamiętaj: edytowana odrzucona reklama liczy się jako **nowa** i
  przechodzi review od nowa; reklama może zostać re-reviewed i odrzucona także
  **po** publikacji.

## Kroki

1. **Zbierz odrzucenia i ograniczenia** na poziomie reklam, assetów i rozszerzeń:
   - Google Ads: `list_ads_entities` po statusie (disapproved / eligible-limited),
     obejmij RSA/RDA, asset groupy PMax i rozszerzenia.
   - Meta: analogicznie — reklamy i creativy ze statusem odrzucenia lub
     ograniczenia emisji.
2. **Zmapuj powód na kategorię polityki** (cytuj kanon, nie zgaduj):
   - Google: prohibited content / prohibited practices / restricted content /
     editorial & technical (`google-ads-policies.md`).
   - Meta: prohibited / restricted goods & services / objectionable /
     business-asset (`meta-advertising-standards.md`).
3. **Zdecyduj: poprawa kreacji vs appeal (odwołanie).**
   - Editorial/format/relevance i personal-attributes → zwykle poprawa kreacji.
   - Błędna klasyfikacja lub restricted, dla którego mamy spełnione warunki
     (certyfikacja, permission, targetowanie 18+, disclosure) → appeal
     (Google: z konta Google Ads; Meta: w Account Quality).
4. **Sprawdź status i ograniczenia konta oraz weryfikacje.**
   - Ograniczenia/limited ad serving na koncie, historia strike'ów (Google).
   - Restrykcje Business Account/assetu (Meta).
   - Weryfikacja domeny, biznesu i wymogi transparentności — w tym
     **beneficiary/payor (DSA)** dla reklam kierowanych do EU.

## Wynik

- Dla każdego trafienia zaproponuj follow-up task przez `append_task`
  z `source_type: review`, priorytet wg **ryzyka dla dostarczania**: reklama
  disapproved na aktywnej kampanii > ograniczenie assetu > pojedyncze
  ostrzeżenie editorial. Ograniczenia konta idą na górę.
- Poprawki kreacji i inne zmiany na platformie wykonuj wyłącznie przez
  `prepare_*` + potwierdzenie safe-word; nic nie zmieniaj automatycznie.
- Zapisz podsumowanie sweepu przez `append_review`.
